---
title: "SwiftUI and Concurrency in Depth: 6 Questions, Answered in Detail"
date: 2026-11-24T16:00:00+05:30
draft: false
tags: ["Swift", "SwiftUI", "Concurrency", "Observation", "Actors"]
categories: ["Q&A"]
keyPoints:
  - "`ObservableObject` tells every observing view that something changed; `@Observable` tracks the exact properties each `body` read and updates only those views."
  - "Actor reentrancy: at every `await` the actor runs other calls, so state read before the `await` can be stale after it."
  - "Swift's cooperative pool has about one thread per CPU core; tasks give their thread back at every `await`, so never block a thread inside a task."
  - "Setting a `@Published` property fires `objectWillChange` before the value changes; SwiftUI then re-runs the `body` of every view observing that object on the next update."
  - "To stop needless re-renders: use `@Observable`, split views, pass only the values a subview needs, and check with `Self._printChanges()`."
  - "`@State` lives in SwiftUI's storage, not the struct; changing it invalidates only the views that read it, then SwiftUI re-runs their `body` and applies the difference."
ShowReadingTime: true
ShowToc: true
TocOpen: false
---

Six questions that come up whenever SwiftUI and Swift Concurrency are discussed in depth. Each answer
goes past the definition into **how it actually works**, with code you can run.

**How to use this page:** read the question, answer it out loud, then open the answer.

---

## Observation and SwiftUI updates

{{< qa q="What is the difference between `@Observable` and `ObservableObject` in SwiftUI?" level="Senior" >}}
Both let SwiftUI views react to changes in a reference-type model. The difference is **how precisely**
SwiftUI knows what changed.

**`ObservableObject` (Combine, iOS 13+)** — the object has one publisher, `objectWillChange`.
Each `@Published` property sends on it just before it changes. A view that observes the object
(`@StateObject`, `@ObservedObject`, `@EnvironmentObject`) subscribes to that single publisher, so
**any** published change invalidates **every** observing view — even views that never read the property
that changed.

```swift
final class ProfileModel: ObservableObject {
    @Published var name = "Abhishek"
    @Published var unreadCount = 0
}

struct NameLabel: View {
    @ObservedObject var model: ProfileModel
    var body: some View { Text(model.name) }   // re-runs when unreadCount changes too
}
```

**`@Observable` (Observation framework, iOS 17+)** — the macro rewrites each stored property so that
reads and writes go through an `ObservationRegistrar`. SwiftUI runs `body` inside
`withObservationTracking`, which records exactly which properties were **read**. Only a later write to
one of *those* properties invalidates the view.

```swift
@Observable
final class ProfileModel {
    var name = "Abhishek"
    var unreadCount = 0
}

struct NameLabel: View {
    let model: ProfileModel
    var body: some View { Text(model.name) }   // ignores unreadCount changes
}
```

| | `ObservableObject` | `@Observable` |
| --- | --- | --- |
| Granularity | Whole object | Per property read in `body` |
| Marking properties | `@Published` on each | Automatic; opt out with `@ObservationIgnored` |
| Owning it in a view | `@StateObject` | `@State` |
| Passing it down | `@ObservedObject` | Plain `let` (`@Bindable` when you need `$bindings`) |
| Environment | `.environmentObject` / `@EnvironmentObject` | `.environment(model)` / `@Environment(Model.self)` |
| Nested models, arrays of models | Changes inside don't propagate | Tracked, as long as they are `@Observable` too |
| Availability | iOS 13+ | iOS 17+ |

**When to choose which:** use `@Observable` for new code on iOS 17+. Keep `ObservableObject` when you
support older versions or rely on Combine pipelines built from `$property` publishers.
{{< /qa >}}

{{< qa q="What happens when you update a `@Published` property in a view model?" level="Senior" >}}
Step by step, for `model.unreadCount = 5`:

1. **`willSet` fires.** `@Published` is a property wrapper. Before the new value is stored, it calls
   `objectWillChange.send()` on the enclosing `ObservableObject` (the publisher is synthesised for
   you).
2. **`$unreadCount` emits, then the value is stored.** The property's own publisher also fires
   before the store, which is why a `sink` that reads `model.unreadCount` instead of the value it
   receives still sees the old number.
3. **SwiftUI marks views dirty.** Every view subscribed to `objectWillChange` is marked as needing an
   update. Nothing is redrawn yet.
4. **Changes coalesce.** Several changes in the same run-loop turn produce **one** update, not one per
   property.
5. **`body` re-runs.** On the next render pass, SwiftUI calls `body` on each invalidated view, builds the
   new view description, diffs it against the old one, and updates only what differs on screen.

```swift
@MainActor
final class InboxModel: ObservableObject {
    @Published var unreadCount = 0
}

// objectWillChange fires before the store:
// model.objectWillChange.sink { print("will change; still \(model.unreadCount)") }
// prints the OLD value — SwiftUI reads the new one later, when it re-runs body.

struct InboxView: View {
    @StateObject private var model = InboxModel()
    var body: some View {
        let _ = Self._printChanges()          // logs "InboxView: _model changed."
        Button("Unread: \(model.unreadCount)") { model.unreadCount += 1 }
    }
}
```

Things that follow from this:

- **Why "will" change?** SwiftUI is told before the change so it can capture the old state for
  animations and diffing.
- **Main thread only.** Publishing from a background thread triggers the runtime warning
  *"Publishing changes from background threads is not allowed"*. Mark the view model `@MainActor`.
- **Don't publish inside `body`.** Changing a `@Published` value while a view is updating triggers
  *"Modifying state during view update"* and can loop.
- **Cost:** every observing view re-runs `body`, whichever property changed — the reason
  `@Observable` exists.
{{< /qa >}}

{{< qa q="How does a `@State` change redraw a SwiftUI view? Explain with an example." level="Senior" >}}
A SwiftUI view struct is a short-lived description. `@State` storage does **not** live inside it:
SwiftUI keeps it in its own graph, keyed by the view's **identity**. The struct only holds a handle to
that storage.

```swift
struct CounterScreen: View {
    @State private var count = 0
    @State private var note = ""

    var body: some View {
        let _ = Self._printChanges()
        VStack {
            Text("Count: \(count)")
            Button("Add") { count += 1 }
            Footer(title: "Tap to count")      // doesn't depend on count
        }
    }
}

struct Footer: View {
    let title: String
    var body: some View {
        let _ = Self._printChanges()
        Text(title).font(.footnote)
    }
}
```

What happens when you tap **Add**:

1. **First appearance.** SwiftUI creates storage for `count` and `note` with their initial values. On
   later re-creations of `CounterScreen`, the `= 0` is ignored — the stored value wins.
2. **Dependency recorded.** While `body` ran, SwiftUI recorded that it **read** `count`. It never read
   `note`.
3. **The write.** `count += 1` writes to SwiftUI's storage, not the struct.
4. **Invalidation.** SwiftUI marks every view that read `count` — here only `CounterScreen` — as needing
   an update, and schedules one for the next frame.
5. **`body` re-runs.** `CounterScreen.body` produces a new description: a `Text` with a new string, the
   same `Button`, a `Footer` with the same `title`.
6. **Diff.** SwiftUI compares it with the previous description. `Footer`'s input (`title`) is
   unchanged, so **its `body` is not called again**. Only the `Text` string changed.
7. **Render.** SwiftUI updates just that text on screen. With `withAnimation { count += 1 }`, the change
   happens inside an animated transaction instead.

The console shows `CounterScreen: _count changed.` and nothing from `Footer`. And because `body` never
reads `note`, changing `note` would not re-run `body` at all.
{{< /qa >}}

{{< qa q="How do you stop a view's `body` re-running on every property update? Explain with an example." level="Senior" >}}
Start by **measuring**: add `let _ = Self._printChanges()` at the top of `body` to log what triggered
each update. Then apply these, roughly in order of impact.

**1. Use `@Observable` instead of `ObservableObject` (iOS 17+).** Views then update only for the
properties they read.

**2. Split large views, and give each subview only what it needs.** This is the most important habit.
SwiftUI skips a child's `body` when the child's inputs are equal to last time.

```swift
// Before: every model change re-runs this whole body, including the expensive chart.
struct DashboardView: View {
    @ObservedObject var model: DashboardModel        // has `title`, `points`, `lastSynced`
    var body: some View {
        VStack {
            Text(model.title)
            ExpensiveChart(points: model.points)
            Text("Synced \(model.lastSynced.formatted())")   // changes every few seconds
        }
    }
}

// After: the frequently changing value is read in its own small view,
// and the chart receives only its points.
struct DashboardView: View {
    @ObservedObject var model: DashboardModel
    var body: some View {
        VStack {
            Text(model.title)
            ChartSection(points: model.points)
            SyncStatus(model: model)
        }
    }
}

struct ChartSection: View, Equatable {
    let points: [Double]
    var body: some View { ExpensiveChart(points: points) }
}

struct SyncStatus: View {
    @ObservedObject var model: DashboardModel
    var body: some View { Text("Synced \(model.lastSynced.formatted())") }
}
```

With `ObservableObject`, `DashboardView` still re-runs when `lastSynced` changes — but its `body` is now
cheap, and `ChartSection` is skipped because its `points` are equal. With `@Observable`,
`DashboardView` would not re-run for `lastSynced` at all, because only `SyncStatus` reads it.

**3. Make comparisons cheap and explicit.** Conforming a view to `Equatable` (and, where needed,
applying `.equatable()`) lets SwiftUI use your `==` to decide whether the inputs changed — useful when
inputs include closures or reference types it can't compare.

**4. Pass values, not whole models.** A child that takes `model: Model` depends on the whole object; a
child that takes `title: String` only depends on the title.

**5. Don't read what you don't render.** Each value read in `body` is a dependency. Read timers,
scroll offsets and similar fast-changing values in the smallest view that displays them.

**6. Keep `body` cheap and avoid `AnyView`.** Sorting, filtering and formatting belong in the model or
in cached values, not in `body`. `AnyView` erases types and weakens SwiftUI's diffing.

**7. With Combine, publish less.** Split one large `ObservableObject` into smaller ones, or use
`.removeDuplicates()` before assigning to a `@Published` property, so equal values don't trigger
updates.
{{< /qa >}}

## Swift Concurrency internals

{{< qa q="What is actor reentrancy? Explain with an example." level="Senior" >}}
An actor runs one piece of its code at a time. But it is **reentrant**: when an actor method reaches an
`await`, it suspends and the actor is free to run **other** calls. When the first call resumes, the
actor's state may have changed underneath it.

Apple made actors reentrant on purpose: a non-reentrant actor that waited for something which, in turn,
needed the same actor would deadlock.

**Example — an image cache that downloads the same image twice:**

```swift
actor ImageCache {
    private var cache: [URL: Image] = [:]

    func image(for url: URL) async throws -> Image {
        if let cached = cache[url] { return cached }   // 1. miss
        let image = try await download(url)            // 2. suspends: actor is released
        cache[url] = image                             // 3. resumes later
        return image
    }
}
```

Two views ask for the same URL at once:

| Time | Call A | Call B |
| --- | --- | --- |
| t1 | Checks cache: miss | — |
| t2 | `await download` — suspends | Enters the actor, checks cache: still a miss |
| t3 | — | `await download` — second download starts |
| t4 | Resumes, stores image | — |
| t5 | — | Resumes, stores image again |

No data race happened — the actor protected `cache` the whole time — but the logic is wrong: two
downloads, wasted data and battery.

**Fix — cache the in-flight work, not just the result**, and record it *before* the first `await`:

```swift
actor ImageCache {
    private var tasks: [URL: Task<Image, Error>] = [:]

    func image(for url: URL) async throws -> Image {
        if let task = tasks[url] { return try await task.value }  // join the running download
        let task = Task { try await download(url) }
        tasks[url] = task                                         // set before any await
        do {
            return try await task.value
        } catch {
            tasks[url] = nil                                      // allow a retry after failure
            throw error
        }
    }
}
```

The rules that follow:

- Treat every `await` inside an actor as a point where **any** of the actor's state may change.
- Check a condition and act on it **in the same synchronous stretch**, with no `await` in between.
- After an `await`, **re-check** anything you relied on before it.
- Actor isolation prevents data races; it does not make a multi-step operation atomic.

Deep dive: [Understanding Actor Reentrancy in Swift]({{< relref "swift-actor-reentrancy.md" >}}).
{{< /qa >}}

{{< qa q="How does Swift Concurrency's cooperative thread pool work, in detail?" level="Senior" >}}
**The problem it solves.** With GCD, a queue blocked on I/O makes the system create another thread to
keep work moving. Many blocked queues meant **thread explosion**: hundreds of threads, each with its
own stack and kernel scheduling cost, and constant context switching.

**The pool.** Swift Concurrency runs tasks on a **cooperative thread pool** with a fixed width — about
**one thread per CPU core**. It never grows to compensate for blocked threads. Code isolated to
`@MainActor` is the exception: it runs on the main thread, not in the pool.

**Tasks are split into jobs at suspension points.** The compiler splits every `async` function at each
`await`. The pieces between suspension points become **jobs** that an executor schedules. A task's
local variables that must survive a suspension live in an **async frame on the heap**, not on the
thread's stack.

**What happens at an `await`:**

1. The task reaches `await fetch()`. If `fetch` needs to wait (for the network, another actor, a
   timer), the task **suspends**: its continuation — "the rest of this function" — is saved.
2. The thread is **returned to the pool** and immediately picks up another ready job. No thread sits
   blocked waiting.
3. When `fetch` completes, the continuation is enqueued as a new job on the right executor: the global
   concurrent pool, an actor's serial executor, or the main actor.
4. Any free thread in the pool runs it. The task may **resume on a different thread** than it started
   on — which is why thread-local assumptions break in async code.

```swift
func loadProfile() async throws -> Profile {
    let data = try await api.fetch("/me")      // suspension point: the thread goes back to the pool
    let profile = try decode(data)             // this job may run on a different thread
    await cache.store(profile)                 // hop to the `cache` actor's executor
    return profile
}
```

Switching between tasks this way costs about as much as a function call, instead of a full thread
context switch.

**Actors on the pool.** An actor has a serial executor but no thread of its own. Its jobs run on pool
threads one at a time. Calling into an actor from outside is an "actor hop": the caller's continuation
is enqueued on that actor's executor.

**Priorities.** Jobs carry a priority (`.userInitiated`, `.utility`, `.background`, …). When
higher-priority work waits on lower-priority work — for example, awaiting a `Task` or a busy actor —
the runtime **escalates** the lower priority to avoid inversion.

**The contract: always make forward progress.** Because the pool can't add threads, blocking one
starves everyone. Never, inside async code:

- wait on a semaphore or `DispatchGroup.wait()`;
- hold a lock across an `await`;
- call blocking synchronous I/O or long `sleep`s.

```swift
// ❌ Blocks a pool thread until the task finishes; with enough of these, the whole pool deadlocks.
let semaphore = DispatchSemaphore(value: 0)
Task { await work(); semaphore.signal() }
semaphore.wait()

// ✅ Stay async all the way up.
await work()
```

For long CPU-bound loops, call `await Task.yield()` now and then so other jobs get a turn, and check
`Task.isCancelled`. For genuinely blocking work, such as a legacy synchronous API, run it outside the
pool — on a dedicated `DispatchQueue` bridged with a continuation.
{{< /qa >}}

---

## Further reading

- [SwiftUI in 12 Questions]({{< relref "swiftui-questions.md" >}})
- [Swift Concurrency in 11 Questions]({{< relref "swift-concurrency-questions.md" >}})
- [Swift Task Lifecycle Management]({{< relref "swift-task-life-cycle.md" >}})
- [Understanding Actor Reentrancy in Swift]({{< relref "swift-actor-reentrancy.md" >}})
