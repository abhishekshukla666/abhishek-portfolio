---
title: "The Decorator Design Pattern in Swift: Enhancing Objects Dynamically"
# description: "Learn how to use the Decorator design pattern in Swift to add behavior to objects dynamically without subclass explosion. Featuring a real-world Network Service example."
date: "2026-06-25T12:51:58+05:30"
draft: false
tags: ["Swift", "Architecture", "Structural Design Patterns"]
weight: 109
# cover:
    # image: "blog/Decorator.jpeg"

# ShowWordCount: true
ShowReadingTime: true
---

As your application grows, you often need to add new responsibilities to existing objects. The default approach for many developers is subclassing. However, subclassing is static and applies to an entire class. If you need to combine multiple different behaviors, subclassing leads to a massive, unmaintainable "subclass explosion."

The **Decorator** pattern (also known as a Wrapper) solves this. It is a structural design pattern that lets you attach new behaviors to objects by placing these objects inside special wrapper objects that contain the behaviors.

This pattern is a perfect practical application of the **Open/Closed Principle**: you can extend an object's behavior without modifying its existing code.

---

## The Violation: Subclass Explosion

Imagine we have a standard `NetworkService` protocol and a basic implementation that fetches data. 

Later, your product manager asks you to add **logging** to see how long requests take. Then, the security team asks you to add **authentication headers** to certain requests. 

### ❌ The Anti-Pattern

If you rely on inheritance to solve this, your code quickly spirals out of control.

```swift
protocol NetworkService {
    func fetch(url: URL) async -> Data
}

// 1. The Base Class
class BasicNetworkService: NetworkService {
    func fetch(url: URL) async -> Data {
        print("Fetching data from \(url.absoluteString)...")
        return Data() // Simulated network response
    }
}

// 2. We need logging, so we subclass
class LoggingNetworkService: BasicNetworkService {
    override func fetch(url: URL) async -> Data {
        print("[Log] Starting request to \(url)")
        let data = await super.fetch(url: url)
        print("[Log] Finished request")
        return data
    }
}

// 3. We need auth, so we subclass again
class AuthNetworkService: BasicNetworkService {
    override func fetch(url: URL) async -> Data {
        print("Adding Auth Header: Bearer <token>")
        return await super.fetch(url: url)
    }
}

// 4. THE EXPLOSION: Now we need BOTH logging AND auth!
class AuthAndLoggingNetworkService: BasicNetworkService {
    override func fetch(url: URL) async -> Data {
        print("[Log] Starting request to \(url)")
        print("Adding Auth Header: Bearer <token>")
        let data = await super.fetch(url: url)
        print("[Log] Finished request")
        return data
    }
}

```

**Why this fails:** * We are duplicating code.

* If we add a third feature (like `Caching`), we would need `CachingNetworkService`, `CachingAndAuthNetworkService`, `CachingAndLoggingNetworkService`, and `CachingAuthAndLoggingNetworkService`. This is mathematically unsustainable.

---

## The Fix: The Decorator Pattern

Instead of creating subclasses, we create **Decorators**. A decorator implements the exact same protocol as the base object, but it holds a reference to a wrapped instance of that protocol. It performs its specific task and delegates the rest of the work to the wrapped object.

### ✅ Step 1: The Base Component

We start with the same protocol and base implementation.

```swift
protocol NetworkService {
    func fetch(url: URL) async -> Data
}

class BasicNetworkService: NetworkService {
    func fetch(url: URL) async -> Data {
        print("Fetching data from \(url.absoluteString)...")
        return Data() 
    }
}

```

### ✅ Step 2: Create the Decorators

Now, instead of subclassing `BasicNetworkService`, we create standalone classes that conform to `NetworkService` and wrap an injected `NetworkService`.

```swift
// The Logging Decorator
class LoggingNetworkDecorator: NetworkService {
    private let wrappee: NetworkService
    
    init(_ wrappee: NetworkService) {
        self.wrappee = wrappee
    }
    
    func fetch(url: URL) async -> Data {
        print("[Log] Starting request to \(url.absoluteString)")
        // Delegate the actual fetching to the wrapped object
        let data = await wrappee.fetch(url: url)
        print("[Log] Finished request")
        return data
    }
}

// The Authentication Decorator
class AuthNetworkDecorator: NetworkService {
    private let wrappee: NetworkService
    private let token: String
    
    init(_ wrappee: NetworkService, token: String) {
        self.wrappee = wrappee
        self.token = token
    }
    
    func fetch(url: URL) async -> Data {
        print("Adding Auth Header: Bearer \(token)")
        // Delegate to the wrapped object
        return await wrappee.fetch(url: url)
    }
}

```

### ✅ Step 3: Stack Them Up!

Because every decorator conforms to `NetworkService`, we can nest them infinitely. We can mix and match behaviors at runtime without writing any new classes!

```swift
let url = URL(string: "[https://api.example.com/profile](https://api.example.com/profile)")!

// 1. Just a basic service
let standardService = BasicNetworkService()

// 2. A service with ONLY logging
let loggingService = LoggingNetworkDecorator(standardService)

// 3. A service with Auth AND Logging
let secureLoggedService = LoggingNetworkDecorator(
    AuthNetworkDecorator(
        BasicNetworkService(), 
        token: "xyz_123"
    )
)

// Executing the fully decorated service:
Task {
    await secureLoggedService.fetch(url: url)
}

/* Console Output:
 [Log] Starting request to [https://api.example.com/profile](https://api.example.com/profile)
 Adding Auth Header: Bearer xyz_123
 Fetching data from [https://api.example.com/profile](https://api.example.com/profile)...
 [Log] Finished request
*/

```

---

## Where to Use the Decorator Pattern

1. **Adding Responsibilities on the Fly:** When you need to assign extra behaviors to objects at runtime without breaking the code that uses these objects.
2. **Avoiding Subclass Explosion:** When inheritance becomes awkward or impossible due to combinatorial explosions of features.
3. **Legacy Code:** When you need to add behavior to a class that is declared as `final` and cannot be subclassed. You can wrap it in a decorator instead.

## Where NOT to Use the Decorator Pattern

* **Order Dependency:** If the order in which the decorators are applied strictly matters and causes crashes if stacked incorrectly, this pattern can become fragile. In our example, it doesn't matter if we log first or auth first, which is ideal.
* **Heavy Interface Protocols:** If your base protocol (`NetworkService`) has 20 methods, every single decorator must implement all 20 methods, even if it only wants to decorate one of them. This leads to massive boilerplate. (In Swift, you can sometimes mitigate this with default protocol extensions, but it remains a drawback).

## Final Thoughts

The Decorator pattern is a brilliant way to achieve the Open/Closed Principle. By favoring composition over inheritance, we kept our `BasicNetworkService` completely untouched, yet we successfully added authentication and logging to our application's networking layer in a modular, highly testable way.