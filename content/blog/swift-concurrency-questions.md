---
title: "Swift Concurrency in 11 Questions: Tasks, Actors and Sendable"
date: 2026-11-24T10:00:00+05:30
draft: false
tags: ["Swift", "Concurrency", "Actors", "Sendable"]
categories: ["Q&A"]
aliases: ["/blog/swift-concurrency-interview-questions/"]
keyPoints:
  - "Structured tasks (`async let`, task groups) are cancelled with their parent; `Task {}` is not."
  - "`Task {}` inherits the current actor, priority and task-locals; `Task.detached` inherits none of them."
  - "Cancellation is cooperative: a task stops only when it checks `Task.isCancelled` or calls a throwing API."
  - "Actors are reentrant: every `await` inside one lets other calls run, so re-check state after it."
  - "`Sendable` is a compile-time promise that a value is safe to share across isolation domains."
ShowReadingTime: true
ShowToc: true
TocOpen: false
---

Swift Concurrency is now the default topic in almost every senior iOS interview. Interviewers rarely ask for definitions on their own — they ask *why* something behaves the way it does, then push on an edge case.

This set goes from the basics to the questions that separate people who have read about concurrency from people who have shipped it.

**How to use this page:** read the question, answer it out loud, then open the answer.

---

## Tasks and structured concurrency

{{< qa q="What is the difference between structured and unstructured concurrency?" level="Mid" >}}
In **structured** concurrency, a child task's lifetime is bound to the scope that created it. `async let` and task groups are structured: the parent cannot return until every child has finished, cancelling the parent cancels the children, and errors propagate up.

An **unstructured** task — `Task { }` or `Task.detached { }` — has no parent scope. It lives until its work finishes, and nothing cancels it unless you keep the handle and call `cancel()` yourself.

Rule of thumb: reach for structured concurrency first; use `Task { }` only to bridge from synchronous code into async code.

Deep dive: [Swift Task Lifecycle Management]({{< relref "swift-task-life-cycle.md" >}}).
{{< /qa >}}

{{< qa q="What does `Task { }` inherit from its context, and what does `Task.detached { }` drop?" level="Mid" >}}
`Task { }` inherits the **actor isolation**, **priority** and **task-local values** of the context it is created in. Created inside a `@MainActor` view model, its body runs on the main actor.

`Task.detached { }` inherits none of these. It runs on the global concurrent executor with no actor isolation, which is why touching `self`'s main-actor state from inside it needs an `await`.

```swift
@MainActor
final class ProfileViewModel {
    var name = ""

    func load() {
        Task {
            name = await api.fetchName()      // fine: still on the main actor
        }
        Task.detached {
            let name = await api.fetchName()
            await MainActor.run { self.name = name }  // has to hop back
        }
    }
}
```
{{< /qa >}}

{{< qa q="Is cancellation in Swift Concurrency preemptive? How does a task actually stop?" level="Mid" >}}
No — cancellation is **cooperative**. Calling `cancel()` only sets a flag. The task keeps running until its own code checks the flag:

- `try Task.checkCancellation()` throws `CancellationError` — use it in throwing code.
- `Task.isCancelled` returns a `Bool` — use it when you need to clean up or return a partial result.

Many system APIs, such as `URLSession` and `Task.sleep`, check for you and throw when cancelled. A tight CPU loop that never checks will run to completion.
{{< /qa >}}

{{< qa q="Why is SwiftUI's `.task` modifier preferred over starting a `Task` in `onAppear`?" level="Mid" >}}
`.task` ties the task's lifetime to the view: SwiftUI cancels it automatically when the view disappears, and `.task(id:)` cancels and restarts it when the id changes.

A `Task { }` started in `onAppear` is unstructured. It keeps running after the view is gone unless you store the handle and cancel it in `onDisappear` — an easy leak and a common source of "stale result overwrote new state" bugs.
{{< /qa >}}

## Actors

{{< qa q="An actor serializes access to its state. Why can it still have a race-like bug?" level="Senior" >}}
Because actors are **reentrant**. At every `await` inside an actor method, the actor is released and can run other calls. When the original call resumes, any state it read before the `await` may have changed.

```swift
actor BankAccount {
    var balance: Double = 100

    func withdraw(_ amount: Double) async throws {
        guard balance >= amount else { throw BankError.insufficientFunds }
        await audit.log(amount)       // suspension point: another withdraw can run here
        balance -= amount             // the guard above may no longer hold
    }
}
```

Fixes: mutate state *before* the first `await`, re-check invariants *after* every `await`, or keep the critical section entirely synchronous.

Deep dive: [Understanding Actor Reentrancy in Swift]({{< relref "swift-actor-reentrancy.md" >}}).
{{< /qa >}}

{{< qa q="When would you mark an actor method `nonisolated`?" level="Mid" >}}
When it does not touch the actor's mutable state — for example, a computed property over `let` constants, or a conformance to a synchronous protocol such as `CustomStringConvertible` or `Hashable`.

A `nonisolated` member can be called synchronously from outside without an `await`. The compiler stops you from reading isolated `var`s inside it.
{{< /qa >}}

{{< qa q="What does `@MainActor` guarantee, and what does it not?" level="Mid" >}}
It guarantees that the annotated code runs on the main actor (and therefore the main thread), and the compiler enforces it: callers from other isolation domains must `await`.

It does **not** make the code fast, and it does not stop reentrancy — a `@MainActor` method that `await`s can see main-actor state change before it resumes, exactly like any other actor.
{{< /qa >}}

## Sendable and data-race safety

{{< qa q="What is `Sendable`, and why does the compiler care about it?" level="Mid" >}}
`Sendable` marks a type whose values can be safely passed across concurrency domains — between tasks or into and out of actors. The compiler uses it to prove, at compile time, that no two domains can mutate the same memory at once.

- Value types whose stored properties are all `Sendable` are implicitly `Sendable`.
- A `final class` with only immutable, `Sendable` stored properties can conform.
- Actors are always `Sendable` — they protect their own state.

Deep dive: [Understanding Sendable in Swift]({{< relref "sendable-explained.md" >}}).
{{< /qa >}}

{{< qa q="When is `@unchecked Sendable` acceptable?" level="Senior" >}}
Only when the type *is* thread-safe but the compiler cannot prove it — typically a class that guards all of its mutable state with a lock or a serial queue.

`@unchecked` turns off the check; it does not add safety. Treat every use as a promise you have to defend in code review, and prefer an actor or `Mutex` (Swift 6, `Synchronization` module) where you can.
{{< /qa >}}

{{< qa q="In Swift 6, what is region-based isolation, and what problem does `sending` solve?" level="Senior" >}}
Region-based isolation lets the compiler track whether a non-`Sendable` value is still reachable from the code that created it. If it is not — the value was created locally and handed off — it can safely cross into another domain even though its type is not `Sendable`.

The `sending` keyword on a parameter or result states that contract in an API: the caller gives up access to the value, so the callee may move it to another isolation domain.
{{< /qa >}}

## Putting it together

{{< qa q="You need to download 20 images concurrently, but never more than 4 at a time. How would you do it?" level="Senior" >}}
Use a `TaskGroup` and keep only four children in flight: seed the group with four tasks, then add one new task each time one finishes.

```swift
func downloadAll(_ urls: [URL], limit: Int = 4) async throws -> [URL: Data] {
    try await withThrowingTaskGroup(of: (URL, Data).self) { group in
        var results: [URL: Data] = [:]
        var iterator = urls.makeIterator()

        for _ in 0..<limit {
            guard let url = iterator.next() else { break }
            group.addTask { (url, try await fetch(url)) }
        }
        while let (url, data) = try await group.next() {
            results[url] = data
            if let next = iterator.next() {
                group.addTask { (next, try await fetch(next)) }
            }
        }
        return results
    }
}
```

It stays structured: if the caller is cancelled, every in-flight download is cancelled too, and the first thrown error cancels the rest.
{{< /qa >}}

---

## Further reading

- [Swift Task Lifecycle Management]({{< relref "swift-task-life-cycle.md" >}})
- [Understanding Actor Reentrancy in Swift]({{< relref "swift-actor-reentrancy.md" >}})
- [Understanding Sendable in Swift]({{< relref "sendable-explained.md" >}})
- [Resilient Networking in Swift: Building a Retry Mechanism]({{< relref "retry-logic-networklayer.md" >}})
