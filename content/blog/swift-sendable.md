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
```
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
```
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
```
class BankAccount {
    var balance = 1000

    func withdraw(_ amount: Int) {
        balance -= amount
    }
}
```
Two threads simultaneously execute:
```
account.withdraw(500)
```
You might expect:
```
Balance = 0
```
But race conditions can produce:
```
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
```
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
```
Task {
    await processUser(user)
}
```
The value:
```
user
```

is crossing a concurrency boundary.

The compiler asks:

> Is this value safe to share with another concurrent task?

If the answer is yes:
```
Sendable
```
If not:
```
Compiler Warning/Error
```

## Value Types Are Usually Safe

Most value types naturally work well with concurrency.

Example:
```
struct User: Sendable {
    let id: UUID
    let name: String
}
```

Because structs are copied on assignment:
```
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
```
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
```
class UserManager {
    var users: [String] = []
}

struct AppState: Sendable {
    let manager: UserManager
}
```

Compiler error:
```
Stored property 'manager' of 'Sendable'-conforming struct 'AppState' has non-Sendable type 'UserManager'
```

Why?

Because classes are reference types.

Multiple tasks could share the same instance:
```
taskA ---> UserManager
taskB ---> UserManager
```

Both tasks could mutate:
```
users
```

simultaneously.

Swift therefore rejects it.

## Why Classes Are Not Automatically Sendable

Consider:
```
class Counter {
    var value = 0
}
```

Now:
```
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
```
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
```
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
```
Stored property 'apiKey' of 'Sendable'-conforming class 'Configuration' is mutable
```

The compiler cannot guarantee thread safety.

Therefore conformance is rejected.

## Enter Actors

Actors are designed specifically for shared mutable state.

Example:
```
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
```
let account = BankAccount()

await account.withdraw(500)
await account.withdraw(500)
```

The actor guarantees:

```
Only one task accesses actor state at a time.
```

This eliminates many race conditions.

## Actors Are Sendable

Actor references automatically conform to Sendable.
```
actor Logger {
    func log(_ message: String) { }
}
```
This is allowed:
```
let logger = Logger()

Task {
    await logger.log("Hello")
}
```

because actor isolation provides safety.

## Sendable with Enums

Enums can also conform automatically.
```
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
```
struct Container<T>: Sendable {
    let value: T
}
```

Compiler error:
```
Stored property 'value' of 'Sendable'-conforming generic struct 'Container' has non-Sendable type 'T'
```

The compiler knows nothing about **T**.

Fix:
```
struct Container<T: Sendable>: Sendable {
    let value: T
}
```

Now Swift guarantees:

```
Every T used here must also be Sendable.
```

## What is *@Sendable*?

So far we've discussed types.

Closures can also cross concurrency boundaries.

Example:
```
Task.detached {
    print("Hello")
}
```
The closure is executed concurrently.

Swift therefore treats it as:
```
@Sendable
```

## Why *@Sendable* Exists

Consider:
```
var count = 0

let closure = {
    count += 1
}
```
The closure captures:
```
count
```

Now imagine multiple tasks executing it simultaneously.

A race condition becomes possible.

**@Sendable** prevents unsafe captures.

## Example of a Compiler Error
```
class Counter {
    var value = 0
}

let counter = Counter()

Task.detached {
    counter.value += 1
}
```
You may see warning:

```
Main actor-isolated property 'value' can not be mutated from a nonisolated context
```

Swift is warning that the detached task could access shared mutable state.

### Fixing the Problem

One solution is to use an actor.
```
actor Counter {
    var value = 0

    func increment() {
        value += 1
    }
}
```
Now:
```
let counter = Counter()

Task.detached {
    await counter.increment()
}
```

The compiler is satisfied because actor isolation guarantees safety.

## Detached Tasks and Sendable

Detached tasks are one of the most common places where Sendable checks appear.

Example:
```
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
```
class SessionManager {
    var token = ""
}
```
```
let manager = SessionManager()

Task.detached {
    print(manager.token)
}
```

Swift 5.0:

```
Warning
```

Swift 6.0:

```
Error
```

The goal is stronger compile-time race prevention.

## *@unchecked Sendable*

Sometimes you know a type is thread-safe but the compiler cannot verify it.

Example:
```
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
```
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
```
actor UserService {
    func fetchUser() async throws -> UserResponse {
        // Network call
    }
}
```

Because:
```
UserResponse
```

is Sendable, it can safely cross the actor boundary.
```
let user = try await service.fetchUser()
```

No race conditions occur.

## Common Sendable Compiler Errors

### Non-Sendable Class
```
class Logger { }

struct AppState: Sendable {
    let logger: Logger
}
```

Error:
```
Stored property 'logger' of 'Sendable'-conforming struct 'AppState' has non-Sendable type 'Logger'
```

### Missing Generic Constraint
```
struct Box<T>: Sendable {
    let value: T
}
```

Error:
```
Stored property 'value' of 'Sendable'-conforming generic struct 'Box' has non-Sendable type 'T'
```

Fix:
```
struct Box<T: Sendable>: Sendable {
    let value: T
}
```

### Non-Sendable Closure Capture
```
Task.detached {
    self.updateUI()
}
```

Error:
```
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
```
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
```
Write code
Run app
Hope races don't happen
Debug production crashes
```

With Swift Concurrency:

```
Write code
Compiler detects unsafe sharing
Fix issue before shipping
```

Many concurrency bugs never reach production.

That is a significant shift in software reliability.

## Best Practices

### Prefer Value Types
```
struct User: Sendable
```

is generally better than:

```
class User
```

for data models.

### Use Actors for Shared State
```
actor Cache { }
```

instead of manually managing locks whenever possible.

### Make Models Sendable
```
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