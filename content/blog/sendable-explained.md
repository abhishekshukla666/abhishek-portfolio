---
title: "Understanding Sendable in Swift: Mastering Concurrency Safety"
# description: "A comprehensive guide to the Sendable protocol in Swift. Learn how to pass data safely across concurrency domains and prepare your codebase for Swift 6."
date: "2026-06-29T10:00:00+05:30"
draft: false
tags: ["Swift", "Concurrency", "DataRace", "Sendable"]
weight: 112
# cover:
    # image: "blog/Sendable.jpeg"

# ShowWordCount: true
ShowReadingTime: true
---

With the introduction of Structured Concurrency and Actors, Apple fundamentally changed how we write asynchronous Swift code. However, simply using `async/await` or `Task` does not automatically make your code safe from data races. 

To achieve true thread safety—and to compile under Swift 6's Strict Concurrency checks—you must understand **concurrency domains** and the **`Sendable`** protocol.

In this post, we will explore what `Sendable` is, when and how to use it, and the dangerous anti-patterns you must avoid when trying to quiet the compiler.

---

## What is Sendable?

In Swift, a "concurrency domain" is an isolated execution context, like an Actor or a specific Task. 

When you pass an object from one domain to another (e.g., passing data into a `Task.detached` or sending an object to an `actor`), you cross a boundary. If that object contains mutable state, multiple domains could attempt to modify it simultaneously, causing a crash or data corruption.

> **`Sendable`** is a marker protocol. It tells the compiler: *"This type is safe to be shared concurrently across different execution domains."*

It does not add any properties or methods to your type. It purely acts as a compile-time guarantee.

---

## Implicit vs. Explicit Sendable

You often use `Sendable` types without realizing it. 

**Value types** (like `Int`, `String`, and `Bool`) are inherently safe to pass around because they are copied when passed. If a `struct` or `enum` is composed entirely of `Sendable` properties, Swift implicitly makes the entire `struct` `Sendable`.

```swift
// Swift implicitly knows this is Sendable
struct UserProfile {
    let id: UUID
    var username: String
}

```

However, **reference types** (classes) are shared by reference. They are *not* implicitly `Sendable`.

---

## The Violation: Passing Unsafe Classes Across Boundaries

Imagine an analytics tracker that holds mutable state.

### ❌ The Anti-Pattern

```swift
class AnalyticsSession {
    var events: [String] = []
    
    func logEvent(_ name: String) {
        events.append(name)
    }
}

class CheckoutViewModel {
    let session = AnalyticsSession()
    
    func completePurchase() {
        // Crossing a concurrency boundary!
        Task.detached {
            // Compiler Warning/Error in Swift 6:
            // "Capture of non-sendable type 'AnalyticsSession' in a `@Sendable` closure"
            self.session.logEvent("Purchase Completed")
        }
    }
}

```

**Why this fails:** `Task.detached` creates a new concurrency domain. The `AnalyticsSession` class is passed into this new domain by reference. If the main thread and the detached task attempt to append to the `events` array at the exact same millisecond, your app will crash due to a data race.

---

## The Fix: How to Make a Type Sendable

You have four primary ways to fix this violation, depending on your architectural needs.

### ✅ Fix 1: Convert to a Value Type (Preferred)

The easiest and safest way to achieve `Sendable` compliance is to change your `class` to a `struct`.

```swift
struct AnalyticsSession: Sendable {
    var events: [String] = []
    
    mutating func logEvent(_ name: String) {
        events.append(name)
    }
}

```

*Note: If you do this, you cannot share the same mutated instance across the app easily, as every pass creates a copy.*

### ✅ Fix 2: Use an Actor

If the object *must* be shared by reference and has mutable state, convert it to an `actor`. Actors automatically synchronize access to their state and are implicitly `Sendable`.

```swift
actor AnalyticsSession {
    var events: [String] = []
    
    func logEvent(_ name: String) {
        events.append(name)
    }
}

class CheckoutViewModel {
    let session = AnalyticsSession()
    
    func completePurchase() {
        Task.detached {
            // Safe! The actor ensures thread-safe access.
            await self.session.logEvent("Purchase Completed")
        }
    }
}

```

### ✅ Fix 3: Immutable Classes

If you must use a class, but its state never changes after initialization, you can explicitly mark it as `Sendable`. The class must be `final`, and all properties must be immutable (`let`).

```swift
final class AppConfiguration: Sendable {
    let apiBaseURL: URL
    let maximumRetries: Int
    
    init(apiBaseURL: URL, maximumRetries: Int) {
        self.apiBaseURL = apiBaseURL
        self.maximumRetries = maximumRetries
    }
}

```

### ✅ Fix 4: @unchecked Sendable (Advanced)

Sometimes you are wrapping a legacy Objective-C class, or you are managing state using manual locks (like `OSAllocatedUnfairLock` or a serial `DispatchQueue`). You know the class is thread-safe, but the Swift compiler does not.

You can bypass the compiler's checks by using `@unchecked Sendable`.

```swift
import os

final class ThreadSafeCache: @unchecked Sendable {
    private var storage: [String: Data] = [:]
    private let lock = OSAllocatedUnfairLock()
    
    func save(_ data: Data, forKey key: String) {
        lock.withLock {
            storage[key] = data
        }
    }
}

```

---

## Where NOT to Use Sendable

### ❌ The Ultimate Anti-Pattern: Silencing Warnings with @unchecked Sendable

When developers migrate codebases to Swift 6, they are often overwhelmed by Strict Concurrency warnings. The temptation is to slap `@unchecked Sendable` on a class just to make the project compile.

```swift
// DO NOT DO THIS!
class DirtySessionManager: @unchecked Sendable {
    var userTokens: [String] = [] // Unprotected mutable state!
}

```

**Why this is disastrous:** `@unchecked Sendable` tells the compiler, *"Trust me, I have manually written locks to protect this data."* If you haven't actually written those locks, you have actively lied to the compiler. The compiler will now allow you to pass this class across concurrency boundaries, guaranteeing random, un-debuggable crashes in production.

Never use `@unchecked Sendable` unless you have manually implemented synchronization (like locks or queues).

---

## Closures and @Sendable

Types aren't the only things that cross concurrency boundaries; closures do too. If you pass a closure into a Task, that closure must be `@Sendable`.

```swift
func performBackgroundWork(completion: @escaping @Sendable (Data) -> Void) {
    Task.detached {
        let data = Data()
        completion(data)
    }
}

```

A `@Sendable` closure cannot capture mutable local variables or non-sendable types from its surrounding context.

---

## Final Thoughts

The `Sendable` protocol is the cornerstone of Swift's data-race safety.

**Rule of Thumb for conforming to Sendable:**

1. Default to **Structs** or **Enums**.
2. If you need shared mutable state, use an **Actor**.
3. If you need shared immutable state, use a **final class with `let` properties**.
4. Only use **`@unchecked Sendable`** if you are manually implementing thread locks, and document exactly how you are ensuring safety.

By respecting concurrency domains and the `Sendable` protocol, you ensure your app is robust, crash-free, and fully prepared for the strict concurrency era of Swift 6.