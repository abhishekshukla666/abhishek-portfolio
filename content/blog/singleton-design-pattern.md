---
title: "The Singleton Design Pattern in Swift: Why, How, and When NOT to Use It"
# description: "A deep dive into the Singleton design pattern in Swift. Learn how to implement it correctly, where it shines, and why it is often considered an anti-pattern."
date: "2026-06-23T05:47:17+05:30"
draft: false
tags: ["Swift", "Architecture", "Design Patterns"]
weight: 105
# cover:
    # image: "blog/Singleton.jpeg"

# ShowWordCount: true
ShowReadingTime: true
---

The **Singleton** is one of the most well-known—and heavily debated—creational design patterns in software engineering. Apple uses it extensively throughout the iOS SDK (`UserDefaults.standard`, `URLSession.shared`, `NotificationCenter.default`), which often leads developers to believe it should be used everywhere. 

However, while Singletons are incredibly easy to create in Swift, they are equally easy to abuse. 

In this post, we will explore what the Singleton pattern is, why and how to implement it, where it makes sense, and most importantly, where you should avoid it.

---

## What is a Singleton?

The Singleton pattern ensures that a class has **only one instance** during the entire lifecycle of an application, and it provides a **global point of access** to that instance.

This means no matter where or how many times you request the object, you are always interacting with the exact same instance in memory.

## Why Use a Singleton?

Singletons are typically used when you need to manage a shared resource or a central piece of state across your entire application. 

Key benefits include:
* **Memory Efficiency:** Since only one instance is created, you save memory.
* **Shared State:** It allows multiple parts of your app to easily read and write to the same data structure.
* **Lazy Initialization:** In Swift, Singletons are initialized lazily by default. The instance is only created the first time it is accessed.

---

## How to Implement a Singleton in Swift

Swift makes creating a thread-safe Singleton incredibly simple. 

### ✅ The Correct Way

```swift
final class AppSettings {
    
    // 1. Static constant to hold the single instance
    static let shared = AppSettings()
    
    var isDarkModeEnabled: Bool = false
    
    // 2. Private initializer prevents external instantiation
    private init() {
        // Setup code here
        print("AppSettings initialized")
    }
    
    func resetSettings() {
        isDarkModeEnabled = false
    }
}

```

### Breakdown of the Code:

1. **`final class`**: Prevents the class from being subclassed, ensuring the Singleton cannot be overridden.
2. **`static let shared`**: Swift guarantees that `static` properties are lazily initialized and thread-safe. You don't need manual locks or `DispatchQueue` to protect the initialization.
3. **`private init()`**: **This is the most critical part.** It prevents anyone from calling `AppSettings()` elsewhere in your code, enforcing the rule that only the `shared` instance can be used.

### Usage:

```swift
AppSettings.shared.isDarkModeEnabled = true

```

---

## Where to Use Singletons

Singletons shine when dealing with centralized, stateless coordination or hardware constraints.

**Good Use Cases:**

1. **Analytics and Logging:** A `Logger` or `AnalyticsTracker` needs to receive events from everywhere in the app and funnel them to a single destination.
2. **Hardware Interfaces:** Managing device hardware like GPS (`CLLocationManager`), audio sessions (`AVAudioSession`), or the camera. You only have one physical device, so a single manager makes sense.
3. **Global Configurations:** Wrappers around `UserDefaults` or standard application themes/styling.

---

## Where NOT to Use Singletons (The Anti-Pattern)

Despite their convenience, Singletons are widely considered an **anti-pattern** when misused. They can quietly destroy the architecture of your app.

### 1. Hidden Dependencies

When you use a Singleton, you hide the dependencies of a class.

```swift
class CheckoutViewModel {
    func completePurchase() {
        // Hidden dependencies!
        PaymentGateway.shared.charge()
        Analytics.shared.trackPurchase()
        Database.shared.saveOrder()
    }
}

```

Looking at the initialization of `CheckoutViewModel()`, a developer has no idea that it relies on a payment gateway, an analytics engine, and a database. This makes the code hard to understand and maintain.

### 2. The Testing Nightmare

Singletons maintain state across the entire lifecycle of the app. This is catastrophic for unit tests.

If `Test A` modifies the state of `Database.shared`, `Test B` might fail because it starts with dirty state. Tests should be isolated and independent. You cannot easily "mock" or reset a hardcoded Singleton.

### 3. Concurrency and Data Races

If your Singleton holds mutable state (like an array or a dictionary) and is accessed from multiple threads simultaneously, your app will crash. You have to manually synchronize access using actors or serial queues.

```swift
final class SessionManager {
    static let shared = SessionManager()
    
    // DANGEROUS: Multiple threads accessing this will cause a crash
    var userTokens: [String] = [] 
    
    private init() {}
}

```

---

## The Fix: Dependency Injection

Instead of reaching out to a global Singleton, pass the required dependencies into the class. This is known as **Dependency Injection**.

### ❌ Instead of this:

```swift
class ProfileViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        let user = NetworkManager.shared.fetchUser()
    }
}

```

### ✅ Do this:

```swift
class ProfileViewController: UIViewController {
    let networkManager: NetworkManager
    
    // Inject the dependency
    init(networkManager: NetworkManager = .shared) {
        self.networkManager = networkManager
        super.init(nibName: nil, bundle: nil)
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        let user = networkManager.fetchUser()
    }
}

```

**Why is this better?**

1. **Clear Intent:** Anyone using `ProfileViewController` immediately knows it requires a `NetworkManager`.
2. **Testability:** In a unit test, you can easily pass a `MockNetworkManager` instead of hitting real servers.
3. **Flexibility:** You can default to the `.shared` instance for convenience, but still allow custom instances when needed.

---

## Final Thoughts

The Singleton pattern is a tool, not an architecture.

**Rule of Thumb:**

* If the object represents a single physical resource (like a camera) or a stateless utility (like logging), a Singleton is likely fine.
* If the object holds mutable app state, network logic, or business logic, avoid the Singleton. Use Dependency Injection to pass that object where it is needed.

When in doubt, inject!