---
title: "System Design: An Image Loading and Caching Library for iOS"
date: 2026-11-24T11:00:00+05:30
draft: false
tags: ["System Design", "iOS", "Swift", "Caching", "Concurrency"]
categories: ["System Design"]
keyPoints:
  - "Clarify requirements first: smooth scrolling, bounded memory, no duplicate downloads, offline for what was seen."
  - "Check caches cheapest first: decoded images in memory, encoded bytes on disk, then the network."
  - "Key the memory cache by URL and target size, and cost it in bytes, not image count."
  - "Coalesce requests: one in-flight task per URL, kept in an actor so the check and insert cannot interleave."
  - "Downsample with ImageIO off the main actor; a 12 MP photo in a small cell drops from about 48 MB to 360 KB."
ShowReadingTime: true
ShowToc: true
TocOpen: false
---

> "Design the image loading layer for a feed app — think Instagram. Thousands of images, fast scrolling, flaky networks."

This is one of the most common mobile system design prompts, because it touches everything at once: networking, memory, disk, threading, cancellation and API design. Here is how I would walk through it in an interview.

---

## 1. Clarify the requirements

Spend the first few minutes asking questions. It shows you design for a product, not for a whiteboard.

### Functional
- Load an image from a URL into a view, with a placeholder while it loads.
- Cache images so scrolling back up is instant and repeat launches avoid the network.
- Support resizing to the view's size.

### Non-functional
- **Smooth scrolling** — no decoding or resizing on the main thread.
- **Bounded memory** — the app must not be killed for memory on older devices.
- **Efficient network use** — never download the same URL twice at the same time; cancel work for cells that scroll away.
- **Works offline** for anything already seen.

### Out of scope
- Animated images, video thumbnails and image editing. Mention them, then park them.

## 2. High-level design

```text
               ┌──────────────────────── ImagePipeline (actor) ───────────────────────┐
 request ───▶  │ Memory cache ──miss──▶ Disk cache ──miss──▶ In-flight map ──▶ Network │
 (URL, size)   │      ▲                      │                    │              │     │
               │      └──── decoded image ◀─ Decoder (downsample, off main) ◀─────┘     │
               └───────────────────────────────────────────────────────────────────────┘
```

A request checks each layer from cheapest to most expensive and fills every layer on the way back.

| Layer | Holds | Speed | Survives relaunch |
| --- | --- | --- | --- |
| Memory cache | Decoded, display-ready images | ~instant | No |
| Disk cache | Original encoded bytes | milliseconds | Yes |
| Network | — | 100 ms to seconds | — |

## 3. API

Keep the surface small. Feature teams should not have to think about caches.

```swift
public struct ImageRequest: Hashable, Sendable {
    public let url: URL
    public let targetSize: CGSize      // in pixels — the view's size × screen scale
}

public actor ImagePipeline {
    public static let shared = ImagePipeline()

    public func image(for request: ImageRequest) async throws -> UIImage
}
```

```swift
// SwiftUI: cancellation comes for free — .task is cancelled when the cell disappears.
.task(id: url) {
    image = try? await ImagePipeline.shared.image(for: .init(url: url, targetSize: size))
}
```

## 4. Deep dives

### Memory cache

Use `NSCache`, keyed by the full request (URL **and** target size — a 60 pt avatar and a full-screen hero are different images).

- It evicts automatically under memory pressure.
- Set `totalCostLimit` and pass the decoded byte size as the cost: `width × height × 4`. Counting images instead of bytes is the classic mistake — one 4K image costs as much as hundreds of thumbnails.

### Disk cache

Store the **original encoded bytes** (JPEG/PNG/HEIC), not decoded bitmaps — they are 10–20× smaller.

- File name: a SHA-256 of the URL.
- Location: the `Caches` directory, so the system can purge it.
- Eviction: LRU by last-access date with a size cap (for example 200 MB), trimmed on a background task, not on every write.
- Respect HTTP `Cache-Control` if the backend sets it; otherwise use a fixed time-to-live.

### Request coalescing

When ten cells ask for the same avatar at once, make **one** network request. The actor keeps a map of in-flight tasks:

```swift
private var inFlight: [ImageRequest: Task<UIImage, Error>] = [:]

public func image(for request: ImageRequest) async throws -> UIImage {
    if let cached = memory.object(forKey: request.key) { return cached }
    if let running = inFlight[request] { return try await running.value }

    let task = Task { try await load(request) }
    inFlight[request] = task
    defer { inFlight[request] = nil }
    return try await task.value
}
```

Because `ImagePipeline` is an actor, the check-then-insert on `inFlight` happens without an `await` in between, so two callers cannot both start a download. (If you put an `await` between the lookup and the insert, reentrancy breaks this — a good point to raise unprompted.)

### Decoding and downsampling

`UIImage(data:)` decodes lazily — on the main thread, at first draw, at full resolution. That causes dropped frames and huge memory spikes.

Use ImageIO to decode straight to the target size, off the main actor:

```swift
func downsample(_ data: Data, to pixelSize: CGSize) -> UIImage? {
    let sourceOptions = [kCGImageSourceShouldCache: false] as CFDictionary
    guard let source = CGImageSourceCreateWithData(data as CFData, sourceOptions) else { return nil }

    let options = [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceShouldCacheImmediately: true,           // decode now, not at draw time
        kCGImageSourceCreateThumbnailWithTransform: true,
        kCGImageSourceThumbnailMaxPixelSize: max(pixelSize.width, pixelSize.height)
    ] as CFDictionary

    return CGImageSourceCreateThumbnailAtIndex(source, 0, options).map(UIImage.init(cgImage:))
}
```

A 12 MP photo shown in a 100 × 100 pt cell drops from about 48 MB to about 360 KB.

### Cancellation and priority

- A cell that scrolls off screen should cancel its request. With coalescing, only cancel the underlying download when **no** caller still wants it — keep a subscriber count per in-flight task.
- Visible cells get higher priority than prefetches. `UITableViewDataSourcePrefetching` / `onAppear` of upcoming rows can warm the disk cache at low priority.

## 5. Trade-offs

| Decision | Chosen | Alternative | Why |
| --- | --- | --- | --- |
| Concurrency model | Actor | Serial `DispatchQueue` + locks | Compiler-checked isolation; natural `async` API |
| Memory cache | `NSCache` | Custom LRU dictionary | Automatic purge under memory pressure; less code |
| Disk format | Encoded bytes | Decoded bitmaps | 10–20× smaller; decode cost is acceptable off main |
| Cache key | URL + target size | URL only | Avoids keeping full-size bitmaps for thumbnails |
| Build vs. buy | Build (in the interview) | Kingfisher, Nuke, SDWebImage | In production, say you would evaluate these first |

## 6. Follow-up questions

**"How do you avoid showing the wrong image in a reused cell?"**
Tie the request to the cell's current identity: cancel the old task in `prepareForReuse`, and check the URL still matches before assigning the result. In SwiftUI, `.task(id:)` handles both.

**"What happens on a memory warning?"**
`NSCache` evicts on its own. Also clear the decoded cache when the app enters the background; the disk cache makes the refill cheap.

**"How would you measure success?"**
Cache hit rate per layer, time-to-first-image for visible cells, dropped frames while scrolling (MetricKit / Instruments), peak memory, and bytes downloaded per session.

**"How do you test it?"**
Inject the network client and the disk store behind protocols. Test coalescing by firing concurrent requests at a stub that counts calls, and test eviction with a tiny `totalCostLimit`.

## Final thoughts

The interviewer is not looking for a perfect library. They want to see that you start from requirements, put the expensive work off the main thread, keep memory bounded, and can explain every trade-off you made — including when you would just use an existing library instead.
