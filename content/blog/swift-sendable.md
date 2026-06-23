---
title: "Swift Sendable Explained - Compile Time Data Race Prevention in Swift Concurrency"
# description: ""
date: "2026-03-10T18:40:17+05:30"
draft: false
tags: ["Swift", "Memory-Managment", "Concurrency"]
weight: 102
# cover:
    # image: "blog/Swift.jpeg"

# ShowWordCount: true
ShowReadingTime: true
---

Swift Concurrency introduced one of the most important safety improvements in the language: compile-time data race detection.

Before Swift Concurrency, it was possible to accidentally access mutable state from multiple threads at the same time. These bugs were notoriously difficult to reproduce because they depended on timing and thread scheduling. An application might work perfectly for months and then suddenly crash or corrupt data in production.

Swift's concurrency model takes a different approach:

> Instead of trying to detect data races at runtime, Swift attempts to prevent them from being written in the first place.
At the center of this system is the Sendable protocol.

This article explores:

* What data races are
* Why they are dangerous
* How Swift prevents them
* What Sendable means
* Automatic vs manual Sendable conformance
* @Sendable closures
* Actors and Sendable
* Common compiler errors
* Real world examples and best practices

## The Problem: Data Races

Before understanding Sendable, we must understand the problem it solves.

A **data race** occurs when:

1. Multiple execution contexts access the same memory
2. At least one access is a write
3. Access is not synchronized

Consider:
```swift
class Counter {
    var value = 0
}

let counter = Counter()

DispatchQueue.global().async {
    counter.value += 1
}

DispatchQueue.global().async {
    counter.value += 1
}
```
Both threads are modifying the same memory location.

Possible outcomes:
```swift
Expected: 2

Actual:
1
2
Undefined behavior
```
The result depends entirely on timing.

This is called a data race.

## Why Data Races Are Dangerous

Data races can cause:

* Incorrect values
* Corrupted state
* Random crashes
* Security vulnerabilities
* Bugs that are impossible to reproduce consistently

For example:
```swift
class BankAccount {
    var balance = 1000

    func withdraw(_ amount: Int) {
        balance -= amount
    }
}
```
Two threads simultaneously execute:
```swift
account.withdraw(500)
```
You might expect:
```swift
Balance = 0
```
But race conditions can produce:
```swift
Balance = 500
```
because both threads read the original value before either write occurs.

## Swift's Approach

Historically, developers solved this using:

* Locks
* Serial queues
* Semaphores
* Thread confinement

Swift Concurrency introduces a stronger guarantee:

> Certain categories of race conditions can be detected during compilation.

The compiler examines values crossing concurrency boundaries and determines whether those values are safe to share.

This is where Sendable comes in.

## What is *Sendable?*

*Sendable* is a marker protocol.
```swift
protocol Sendable { }
```
At first glance it looks empty.

That is intentional.

The protocol does not add functionality.

Instead, it communicates a guarantee:

> Values of this type can be safely transferred between concurrent execution contexts.

Examples include:

* Tasks
* Child tasks
* Actors
* Task groups
* Detached tasks

If a type conforms to Sendable, Swift assumes it can safely move between those contexts.

## Understanding "Sending" Values

Consider:
```swift
Task {
    await processUser(user)
}
```
The value:
```swift
user
```

is crossing a concurrency boundary.

The compiler asks:

> Is this value safe to share with another concurrent task?

If the answer is yes:
```swift
Sendable
```
If not:
```swift
Compiler Warning/Error
```

## Value Types Are Usually Safe

Most value types naturally work well with concurrency.

Example:
```swift
struct User: Sendable {
    let id: UUID
    let name: String
}
```

Because structs are copied on assignment:
```swift
let user = User(id: UUID(), name: "John")

let user1 = user
let user2 = user
```

each task gets its own value.

No shared mutable memory exists.

This makes value types ideal candidates for Sendable.

## Automatic Sendable Conformance

Swift can automatically synthesize conformance when all stored properties are already Sendable.

Example:
```swift
struct Product: Sendable {
    let id: Int
    let name: String
    let price: Double
}
```
Every property is Sendable.

The compiler verifies this automatically.

No additional work is required.

## When Automatic Conformance Fails

Consider:
```swift
class UserManager {
    var users: [String] = []
}

struct AppState: Sendable {
    let manager: UserManager
}
```

Compiler error:
```swift
Stored property 'manager' of 'Sendable'-conforming struct 'AppState' has non-Sendable type 'UserManager'
```

Why?

Because classes are reference types.

Multiple tasks could share the same instance:
```swift
taskA ---> UserManager
taskB ---> UserManager
```

Both tasks could mutate:
```swift
users
```

simultaneously.

Swift therefore rejects it.

## Why Classes Are Not Automatically Sendable

Consider:
```swift
class Counter {
    var value = 0
}
```

Now:
```swift
let counter = Counter()

Task {
    counter.value += 1
}

Task {
    counter.value += 1
}
```

Both tasks access the same object.

Because classes are reference types, sharing is possible.

Swift therefore assumes ordinary classes are not Sendable.

## Immutable Classes Can Be Sendable

Sometimes a class never changes after creation.

Example:
```swift
final class Configuration: Sendable {
    let apiKey: String
    let baseURL: URL

    init(apiKey: String, baseURL: URL) {
        self.apiKey = apiKey
        self.baseURL = baseURL
    }
}
```

All properties are immutable.

No race condition can occur.

The compiler accepts this conformance.

## Mutable Classes and Sendable

Now consider:
```swift
final class Configuration: Sendable {
    var apiKey: String
    let baseURL: URL

    init(apiKey: String, baseURL: URL) {
        self.apiKey = apiKey
        self.baseURL = baseURL
    }
}
```

Compiler error:
```swift
Stored property 'apiKey' of 'Sendable'-conforming class 'Configuration' is mutable
```

The compiler cannot guarantee thread safety.

Therefore conformance is rejected.

## Enter Actors

Actors are designed specifically for shared mutable state.

Example:
```swift
actor BankAccount {
    private var balance = 1000

    func withdraw(_ amount: Int) {
        balance -= amount
    }

    func currentBalance() -> Int {
        balance
    }
}
```

Usage:
```swift
let account = BankAccount()

await account.withdraw(500)
await account.withdraw(500)
```

The actor guarantees:

```swift
Only one task accesses actor state at a time.
```

This eliminates many race conditions.

## Actors Are Sendable

Actor references automatically conform to Sendable.
```swift
actor Logger {
    func log(_ message: String) { }
}
```
This is allowed:
```swift
let logger = Logger()

Task {
    await logger.log("Hello")
}
```

because actor isolation provides safety.

## Sendable with Enums

Enums can also conform automatically.
```swift
enum NetworkState: Sendable {
    case idle
    case loading
    case success(String)
    case failure(ErrorMessage)
}
```
As long as associated values are Sendable, the enum is Sendable.

## Generic Types and Sendable

Generics require additional constraints.

Example:
```swift
struct Container<T>: Sendable {
    let value: T
}
```

Compiler error:
```swift
Stored property 'value' of 'Sendable'-conforming generic struct 'Container' has non-Sendable type 'T'
```

The compiler knows nothing about **T**.

Fix:
```swift
struct Container<T: Sendable>: Sendable {
    let value: T
}
```

Now Swift guarantees:

```swift
Every T used here must also be Sendable.
```

## What is *@Sendable*?

So far we've discussed types.

Closures can also cross concurrency boundaries.

Example:
```swift
Task.detached {
    print("Hello")
}
```
The closure is executed concurrently.

Swift therefore treats it as:
```swift
@Sendable
```

## Why *@Sendable* Exists

Consider:
```swift
var count = 0

let closure = {
    count += 1
}
```
The closure captures:
```swift
count
```

Now imagine multiple tasks executing it simultaneously.

A race condition becomes possible.

**@Sendable** prevents unsafe captures.

## Example of a Compiler Error
```swift
class Counter {
    var value = 0
}

let counter = Counter()

Task.detached {
    counter.value += 1
}
```
You may see warning:

```swift
Main actor-isolated property 'value' can not be mutated from a nonisolated context
```

Swift is warning that the detached task could access shared mutable state.

### Fixing the Problem

One solution is to use an actor.
```swift
actor Counter {
    var value = 0

    func increment() {
        value += 1
    }
}
```
Now:
```swift
let counter = Counter()

Task.detached {
    await counter.increment()
}
```

The compiler is satisfied because actor isolation guarantees safety.

## Detached Tasks and Sendable

Detached tasks are one of the most common places where Sendable checks appear.

Example:
```swift
Task.detached {
    await performWork()
}
```
A detached task has no relationship to the current actor.

Everything captured inside must therefore be safe to transfer.

Swift performs strict Sendable checking here.

## Understanding Swift 6's Stricter Checks

Swift 6 dramatically strengthens concurrency checking.

Code that previously produced warnings may now produce errors.

Example:
```swift
class SessionManager {
    var token = ""
}
```
```swift
let manager = SessionManager()

Task.detached {
    print(manager.token)
}
```

Swift 5.0:

```swift
Warning
```

Swift 6.0:

```swift
Error
```

The goal is stronger compile-time race prevention.

## *@unchecked Sendable*

Sometimes you know a type is thread-safe but the compiler cannot verify it.

Example:
```swift
class ThreadSafeCache: @unchecked Sendable {
    private let lock = NSLock()
    private var storage: [String: String] = [:]

    func set(_ value: String, for key: String) {
        lock.lock()
        defer { lock.unlock() }

        storage[key] = value
    }
}
```

@unchecked Sendable tells Swift:

> Trust me. I guarantee thread safety.

The compiler stops validating the internals.

## When Should You Use *@unchecked Sendable*?

Only when:

* You fully understand the concurrency model
* Internal synchronization exists
* Thread safety is guaranteed

Avoid using it merely to silence compiler errors.

Incorrect usage can reintroduce data races.

## Real-World Example: Network Response Models

A common pattern:
```swift
struct UserResponse: Codable, Sendable {
    let id: Int
    let name: String
    let email: String
}
```

Now the model can safely travel through:

* Tasks
* Task groups
* Actors
* Async sequences

without concurrency warnings.

## Real-World Example: Service Layer
```swift
actor UserService {
    func fetchUser() async throws -> UserResponse {
        // Network call
    }
}
```

Because:
```swift
UserResponse
```

is Sendable, it can safely cross the actor boundary.
```swift
let user = try await service.fetchUser()
```

No race conditions occur.

## Common Sendable Compiler Errors

### Non-Sendable Class
```swift
class Logger { }

struct AppState: Sendable {
    let logger: Logger
}
```

Error:
```swift
Stored property 'logger' of 'Sendable'-conforming struct 'AppState' has non-Sendable type 'Logger'
```

### Missing Generic Constraint
```swift
struct Box<T>: Sendable {
    let value: T
}
```

Error:
```swift
Stored property 'value' of 'Sendable'-conforming generic struct 'Box' has non-Sendable type 'T'
```

Fix:
```swift
struct Box<T: Sendable>: Sendable {
    let value: T
}
```

### Non-Sendable Closure Capture
```swift
Task.detached {
    self.updateUI()
}
```

Error:
```swift
Main actor-isolated instance method 'updateUI()' cannot be called from outside of the actor
```

Fix:

* Use actor isolation
* Use MainActor
* Avoid detached task when unnecessary

## Sendable vs Actor Isolation

These concepts solve different problems.

| Feature |	Purpose |
|:-------------|:-------------|
| *Sendable* | Safe transfer between concurrency domains |
| *actor* |	Safe access to shared mutable state |
| *@Sendable*	| Safe closure capture |
| *@unchecked Sendable* |	Manual thread-safety guarantee |

Think of them together:
```swift
Sendable
    ↓
Can this value cross boundaries safely?

Actor
    ↓
Can shared mutable state be protected safely?
```

## Compile-Time Data Race Prevention in Practice

The real innovation is not the Sendable protocol itself.

The innovation is that Swift uses it to build a static safety system.

Before Swift Concurrency:
```swift
Write code
Run app
Hope races don't happen
Debug production crashes
```

With Swift Concurrency:

```swift
Write code
Compiler detects unsafe sharing
Fix issue before shipping
```

Many concurrency bugs never reach production.

That is a significant shift in software reliability.

## Best Practices

### Prefer Value Types
```swift
struct User: Sendable
```

is generally better than:

```swift
class User
```

for data models.

### Use Actors for Shared State
```swift
actor Cache { }
```

instead of manually managing locks whenever possible.

### Make Models Sendable
```swift
struct Invoice: Codable, Sendable
```

This is especially useful in modern async codebases.

### Avoid @*unchecked Sendable* Unless Necessary

Treat it as an escape hatch.

Use it only when thread safety has been carefully designed and verified.

### Pay Attention to Swift 6 Concurrency Errors

Do not simply suppress them.

Most are exposing genuine race-condition risks.

## Final Thoughts

Sendable is one of the foundational pieces of Swift's modern concurrency system. While the protocol itself appears deceptively simple, it enables something extremely powerful: **compile-time verification that data can safely move between concurrent execution contexts.**

Combined with actors, task isolation, and *@Sendable* closures, Swift can detect entire classes of concurrency bugs before the application ever runs.

The practical mental model is:

* Sendable answers: Can this value safely cross a concurrency boundary?

* @Sendable answers: Can this closure safely execute concurrently?

* actor answer: How do we safely protect shared mutable state?

Together, these features move Swift away from the traditional "find races at runtime" model and toward a future where many race conditions are impossible to write at all. For developers building modern Swift applications, understanding Sendable is not optional, it is a core skill for writing safe, scalable, and concurrency-friendly code.