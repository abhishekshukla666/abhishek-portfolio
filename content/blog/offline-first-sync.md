---
title: "System Design: Offline-First Sync for an iOS App"
date: 2026-11-24T11:20:53+05:30
draft: false
tags: ["System Design", "iOS", "Swift", "Networking", "Persistence"]
categories: ["System Design"]
keyPoints:
  - "Make the local database the source of truth: the UI reads and writes it, and sync runs behind it."
  - "Record every local change in an outbox, with an idempotency key, so retries can never apply it twice."
  - "Pull with a server cursor (change token) to fetch only what changed, and send deletions as tombstones."
  - "Pick conflict rules per field: last-writer-wins with server time is simple; merge or keep both when data matters."
  - "Sync opportunistically — on launch, on reconnect, after edits, and in background tasks — and back off on failure."
ShowReadingTime: true
ShowToc: true
TocOpen: false
---

> "Design a notes app — or a task list, or a field-inspection app — that works fully offline and syncs
> across a person's devices when the network comes back."

Offline-first is one of the most revealing mobile design problems. It touches persistence, networking,
concurrency, conflict resolution and user experience at once, and every choice is a trade-off. Here is
how I would work through it.

---

## 1. Clarify the requirements

### Functional
- Create, edit and delete items with no network, and see the changes instantly.
- Changes made on one device appear on the user's other devices.
- Edits made offline on two devices to the same item are resolved predictably.

### Non-functional
- **Instant UI** — no spinner for local actions; the network is never on the critical path.
- **No lost writes** — a change survives app kills, crashes and days offline.
- **Efficient** — sync only what changed, in small batches, kind to battery and data.
- **Correct** — retries never duplicate a change.

### Out of scope
- Real-time collaborative editing of the same text (that is a CRDT/OT problem of its own).
- Sharing between different users and permissions. Mention them, then park them.

## 2. High-level design

```text
 UI ──reads/writes──▶ Local store (source of truth) ──▶ Outbox (pending changes)
  ▲                         ▲                                  │
  │ observes                │ apply remote changes             ▼
  └──────────────── Sync engine (actor) ◀──── pull ──── Server API (cursor-based)
                              └──────────────── push ───────▶
```

The UI never talks to the network. It reads and writes the local store, and the sync engine moves
changes between that store and the server in the background.

## 3. API

Two endpoints are enough:

```http
POST /sync/push   { "changes": [ { "id", "op", "fields", "baseVersion", "idempotencyKey" } ] }
                  → per change: applied (new version) | conflict (server copy) | rejected

GET  /sync/pull?cursor=abc123&limit=500
                  → { "changes": [...], "nextCursor": "def456", "hasMore": true }
```

On the device, the rest of the app sees a small repository:

```swift
protocol NotesRepository: Sendable {
    func notes() -> AsyncStream<[Note]>          // observe the local store
    func save(_ note: Note) async throws          // write locally + enqueue in the outbox
    func delete(id: Note.ID) async throws
}
```

## 4. Deep dives

### The local store

SwiftData, Core Data or SQLite (for example via GRDB) all work; what matters is the schema. Each
record carries:

- a client-generated `id` (a UUID, so records can be created offline),
- a server `version` (or `updatedAt` from the server) for conflict checks,
- a `deletedAt` tombstone instead of a hard delete, so the deletion itself can sync.

### The outbox

Every local write does two things **in one transaction**: update the record, and append an outbox
entry describing the change. If the app dies a moment later, both happened or neither did.

The sync engine pushes outbox entries in order and removes each only after the server confirms it.
Every entry has an **idempotency key**, so if a response is lost and the push is retried, the server
recognises the change and doesn't apply it twice.

### Pulling changes

The server keeps a monotonically increasing change log. The client stores the last `cursor` it
processed and asks for everything after it, in pages. Applying a page and saving the new cursor
happen in one transaction, so an interrupted pull resumes exactly where it stopped.

Deletions arrive as tombstones. Tombstones can be pruned on the server after every device has synced
past them, with a "full resync" fallback for a device that has been offline longer than that.

### Conflicts

A conflict is a push whose `baseVersion` is older than the server's current version. Options, from
simplest to most careful:

| Strategy | How it works | Good for |
| --- | --- | --- |
| Last writer wins | The latest server-received write replaces the record | Settings, flags, low-value fields |
| Field-level merge | Merge field by field; only same-field edits conflict | Records with independent fields (title vs. tags) |
| Keep both | Save the losing version as a copy and tell the user | Documents where losing text is unacceptable |
| CRDT | Data types that merge automatically | Real-time collaborative text, lists |

Use **server time**, not device clocks, to decide "latest" — device clocks drift and can be changed.
Many apps mix strategies: last-writer-wins for metadata, keep-both for the body text.

### When sync runs

The sync engine is an `actor`, so only one sync pass runs at a time. It is triggered:

- on launch and when the app returns to the foreground,
- when `NWPathMonitor` reports the network is back,
- shortly after local edits (debounced, so typing doesn't cause a request per keystroke),
- in the background with `BGAppRefreshTask`, and by silent push notifications when the server has
  news.

Failures retry with exponential backoff; permanent rejections are surfaced to the user rather than
retried forever.

### Telling the user

Offline-first should feel calm. Show a small "Not synced yet" or "Synced" status, never block editing,
and explain the rare conflict in plain words instead of silently dropping a change.

## 5. Trade-offs

| Decision | Chosen | Alternative | Why |
| --- | --- | --- | --- |
| Source of truth | Local store | Server first, cache second | Instant UI and no lost writes offline |
| IDs | Client UUIDs | Server-assigned IDs | Records can be created and linked offline |
| Change capture | Outbox in the same transaction | Diff the database at sync time | Never misses or reorders a change |
| Pull | Cursor over a change log | "Give me everything since date X" | Exact, resumable, immune to clock skew |
| Conflicts | Per-field rules | One global rule | Matches how much each field matters |
| Build vs. buy | Custom sync | CloudKit (`NSPersistentCloudKitContainer`), Realm/Firestore | In production, weigh these first: they solve much of this |

## 6. Follow-up questions

**"What happens if the schema changes while a device is offline for a month?"**
Version the sync protocol. The server accepts old-format pushes or rejects them with a clear
"update the app" response, and a migrated client does a full resync if its cursor is too old.

**"How do you test it?"**
Put the network behind a protocol and drive the sync engine with a fake server: drop responses,
duplicate them, reorder them, and kill the process mid-pull. Assert that the final state is the same
every time.

**"How big can the outbox get?"**
Coalesce entries for the same record (three edits become one), batch pushes, and cap batch size so
one sync pass never holds the database for long.

**"Why not just use CloudKit?"**
Often you should. Build your own when you need a non-Apple backend, Android clients, custom conflict
rules, or server-side processing of the data.

## Final thoughts

The core of offline-first is small: the local store is the truth, every change goes through an
outbox, and pulls follow a cursor. Everything else — conflict rules, scheduling, UX — is a set of
trade-offs you can explain one by one.

## Further reading

- [System Design: An Image Loading and Caching Library for iOS]({{< relref "system-design-image-loading.md" >}})
- [Resilient Networking in Swift: Building a Retry Mechanism]({{< relref "retry-logic-networklayer.md" >}})
- [Understanding Actor Reentrancy in Swift]({{< relref "swift-actor-reentrancy.md" >}})
