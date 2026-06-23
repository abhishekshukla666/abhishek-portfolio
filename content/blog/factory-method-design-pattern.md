---
title: "The Factory Method Pattern in Swift: Decoupling Object Creation"
# description: "Learn how to use the Factory Method pattern in Swift to clean up complex object creation, adhere to SOLID principles, and prevent tight coupling."
draft: false
date: "2026-06-23T08:28:30+05:30"
tags: ["Swift", "Architecture", "Design Patterns"]
weight: 106
# cover:
    # image: "blog/FactoryMethod.jpeg"

# ShowWordCount: true
ShowReadingTime: true
---

As your application grows, the way you create and manage objects becomes just as important as how those objects behave. If your code is littered with complex initialization logic or massive `switch` statements deciding which object to create, you are likely creating tightly coupled, fragile code.

Enter the **Factory Method** pattern.

This creational design pattern provides an interface for creating objects, but delegates the exact type of object being created to a dedicated "factory." In modern Swift, this pattern is often implemented using protocols and static methods, keeping our business logic incredibly clean.

Let's look at why you need it, how to implement it, and when you are better off without it.

---

## Why Use the Factory Method?

Creating objects often requires a lot of setup: injecting dependencies, formatting data, or deciding *which* subclass to instantiate based on user input. 

If you put this logic directly inside your view controllers or view models, you violate the **Single Responsibility Principle (SRP)**. Furthermore, if you need to add a new type of object later, you have to modify existing code, violating the **Open/Closed Principle (OCP)**.

The Factory Method solves this by:
1. **Encapsulating Creation:** Moving the messy initialization logic out of your business flow.
2. **Hiding Concrete Types:** Returning protocols instead of concrete classes, reducing coupling.
3. **Enhancing Scalability:** Making it trivial to add new object types without breaking existing code.

---

## The Violation: Tight Coupling

Imagine a ride-sharing app where a user can request different types of rides: standard, premium, or carpool. 

### ❌ The Anti-Pattern

```swift
class RideManager {
    func requestRide(type: String, distance: Double) {
        // The business logic is cluttered with creation logic
        if type == "Standard" {
            let ride = StandardRide(baseFare: 5.0, perMileRate: 1.5)
            ride.start(distance: distance)
        } else if type == "Premium" {
            let ride = PremiumRide(baseFare: 10.0, perMileRate: 3.0, includesWater: true)
            ride.start(distance: distance)
        } else if type == "Carpool" {
            let ride = CarpoolRide(baseFare: 3.0, perMileRate: 1.0, maxPassengers: 4)
            ride.start(distance: distance)
        } else {
            print("Unknown ride type")
        }
    }
}

```

**Why this fails:** * `RideManager` knows too much. It knows exactly how to initialize every single type of ride and their specific properties (`includesWater`, `maxPassengers`).

* If we add a "Helicopter" ride tomorrow, we have to modify `RideManager`.

---

## The Fix: The Factory Method

We can fix this by introducing a common protocol and moving the creation logic into a dedicated Factory.

### ✅ Step 1: Define the Abstraction

First, ensure all ride types conform to a single protocol.

```swift
protocol Ride {
    var name: String { get }
    func start(distance: Double)
}

class StandardRide: Ride {
    let name = "Standard"
    let baseFare: Double
    let perMileRate: Double
    
    init(baseFare: Double, perMileRate: Double) {
        self.baseFare = baseFare
        self.perMileRate = perMileRate
    }
    
    func start(distance: Double) {
        print("Starting \(name) ride. Estimated cost: $\(baseFare + (perMileRate * distance))")
    }
}

class PremiumRide: Ride { ... }
class CarpoolRide: Ride { ... }

```

### ✅ Step 2: Create the Factory

Now, build a factory whose sole responsibility is creating `Ride` objects. We use an `enum` for type safety instead of raw strings.

```swift
enum RideType {
    case standard, premium, carpool
}

class RideFactory {
    // The Factory Method
    static func createRide(type: RideType) -> Ride {
        switch type {
        case .standard:
            return StandardRide(baseFare: 5.0, perMileRate: 1.5)
        case .premium:
            return PremiumRide(baseFare: 10.0, perMileRate: 3.0, includesWater: true)
        case .carpool:
            return CarpoolRide(baseFare: 3.0, perMileRate: 1.0, maxPassengers: 4)
        }
    }
}

```

### ✅ Step 3: Clean up the Client Code

Now look at how clean our `RideManager` becomes. It no longer cares *how* the ride is created; it only cares about using it.

```swift
class RideManager {
    func requestRide(type: RideType, distance: Double) {
        // 1. Ask the factory for the object
        let ride = RideFactory.createRide(type: type)
        
        // 2. Use the object
        ride.start(distance: distance)
    }
}

// Usage:
let manager = RideManager()
manager.requestRide(type: .premium, distance: 10.0)

```

---

## Where to Use the Factory Method

The Factory pattern is incredibly useful in modern iOS development, especially in these scenarios:

1. **Dependency Injection:** When configuring complex ViewControllers or ViewModels. For example, a `ProfileViewControllerFactory` that handles instantiating the view controller, assigning its view model, and passing in the network service.
2. **Polymorphic Collections:** When parsing JSON arrays containing different types of objects (e.g., a feed of text posts, image posts, and video posts). A factory can evaluate the JSON and return the correct `Post` protocol conformer.
3. **Cross-Platform or Theming:** Returning different UI components depending on whether the user is on iOS, iPadOS, or using a specific app theme.

---

## Where NOT to Use the Factory Method

Like all patterns, Factories can be overused.

### ❌ The Anti-Pattern: Over-Engineering

If an object is simple to initialize and has no complex dependencies or subclasses, do not build a factory for it.

**Don't do this:**

```swift
class UserFactory {
    static func createUser(name: String) -> User {
        return User(name: name)
    }
}

// Just initialize the object directly!
let user = User(name: "Alice") 

```

**Rule of Thumb:**
If a standard `init()` is clean, obvious, and doesn't require conditional logic (like `if` or `switch` statements), stick with `init()`. Only introduce a Factory when object creation becomes a burden to the surrounding code.

---

## Final Thoughts

The Factory Method pattern is a powerful tool for maintaining clean, decoupled Swift architecture. By isolating object creation, you make your codebase easier to read, easier to test, and infinitely easier to scale when new requirements inevitably come up.