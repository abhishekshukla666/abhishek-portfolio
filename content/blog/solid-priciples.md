---
title: "Understanding SOLID Principles in Swift: Violations, Fixes, and Real-World Examples"
# description: "A practical guide to the SOLID principles with real-world Swift examples, showing common violations and how to fix them."
date: "2026-06-22T14:52:03+05:30"
draft: false
tags: ["Swift", "Architecture", "SOLID"]
weight: 104
# cover:
    # image: "blog/SOLID.jpeg"

# ShowWordCount: true
ShowReadingTime: true
---

The **SOLID** principles are five fundamental design guidelines in object-oriented programming intended to make software designs more understandable, flexible, and maintainable. These principles help developers avoid code smells, refactor easily, and build robust architectures.

Let's break down each principle with a real-world scenario, showing how it is commonly violated and how to properly fix it using Swift.

---

## 1. Single Responsibility Principle (SRP)

> **Definition:** A class should have one, and only one, reason to change. Meaning it should only have one job or responsibility.

When classes take on multiple responsibilities, they become highly coupled and difficult to test or modify without breaking other features.

### ❌ The Violation

Imagine an e-commerce application where we process an order. A common mistake is putting all the logic—validation, database saving, and notifications—into one massive class.

```swift
class OrderProcessor {
    func process(order: Order) {
        // 1. Validate order
        if order.items.isEmpty {
            fatalError("Order is empty")
        }
        
        // 2. Save to database
        Database.shared.save(order)
        
        // 3. Send email confirmation
        let emailService = EmailService()
        emailService.sendEmail(to: order.customerEmail, message: "Your order is confirmed!")
    }
}

```

**Why this fails:** If the database implementation changes, or if we decide to send SMS instead of emails, `OrderProcessor` has to change. It has three reasons to change.

### ✅ The Fix

We split the responsibilities into distinct classes, delegating the work appropriately.

```swift
// 1. Validation
class OrderValidator {
    func validate(order: Order) throws {
        if order.items.isEmpty { throw OrderError.empty }
    }
}

// 2. Data Persistence
class OrderRepository {
    func save(order: Order) {
        Database.shared.save(order)
    }
}

// 3. Notification
class OrderNotifier {
    func sendConfirmation(for order: Order) {
        EmailService().sendEmail(to: order.customerEmail, message: "Order Confirmed!")
    }
}

// The Coordinator
class OrderProcessor {
    let validator: OrderValidator
    let repository: OrderRepository
    let notifier: OrderNotifier
    
    init(validator: OrderValidator, repository: OrderRepository, notifier: OrderNotifier) {
        self.validator = validator
        self.repository = repository
        self.notifier = notifier
    }
    
    func process(order: Order) {
        do {
            try validator.validate(order: order)
            repository.save(order: order)
            notifier.sendConfirmation(for: order)
        } catch {
            print("Failed to process order")
        }
    }
}

```

---

## 2. Open/Closed Principle (OCP)

> **Definition:** Software entities (classes, modules, functions) should be open for extension, but closed for modification.

You should be able to add new functionality without altering existing code.

### ❌ The Violation

Imagine a system that calculates shipping costs based on the shipping method.

```swift
class ShippingCalculator {
    func calculateCost(for order: Order, method: String) -> Double {
        if method == "Standard" {
            return order.weight * 5.0
        } else if method == "Express" {
            return order.weight * 10.0
        } else if method == "Overnight" {
            return order.weight * 20.0
        }
        return 0.0
    }
}

```

**Why this fails:** If we add a "Drone" delivery method, we have to modify the `ShippingCalculator` class by adding another `else if` statement. This risks breaking existing logic.

### ✅ The Fix

We use a protocol to represent the shipping strategy. This allows us to add new methods without touching existing code.

```swift
protocol ShippingStrategy {
    func calculateCost(for order: Order) -> Double
}

class StandardShipping: ShippingStrategy {
    func calculateCost(for order: Order) -> Double {
        return order.weight * 5.0
    }
}

class ExpressShipping: ShippingStrategy {
    func calculateCost(for order: Order) -> Double {
        return order.weight * 10.0
    }
}

// Adding a new method requires NO changes to existing classes!
class DroneShipping: ShippingStrategy {
    func calculateCost(for order: Order) -> Double {
        return order.weight * 15.0
    }
}

class ShippingCalculator {
    func calculateCost(for order: Order, strategy: ShippingStrategy) -> Double {
        return strategy.calculateCost(for: order)
    }
}

```

---

## 3. Liskov Substitution Principle (LSP)

> **Definition:** Objects in a program should be replaceable with instances of their subtypes without altering the correctness of that program.

If `Class B` is a subclass of `Class A`, you should be able to use `Class B` wherever `Class A` is expected without the app crashing or behaving unexpectedly.

### ❌ The Violation

A classic example involves birds. We model all birds with a `fly()` method.

```swift
class Bird {
    func fly() {
        print("Flapping wings!")
    }
}

class Eagle: Bird {
    override func fly() {
        print("Soaring through the sky!")
    }
}

class Penguin: Bird {
    override func fly() {
        fatalError("Penguins can't fly!") // Breaks LSP!
    }
}

func makeBirdFly(bird: Bird) {
    bird.fly()
}

let pingu = Penguin()
makeBirdFly(bird: pingu) // CRASH!

```

**Why this fails:** `Penguin` is a `Bird`, but it cannot substitute its parent class safely because calling `fly()` results in a crash.

### ✅ The Fix

We must re-evaluate our inheritance hierarchy. Not all birds can fly, so flying should be abstracted into a protocol.

```swift
class Bird {
    // Shared bird properties like layEgg()
}

protocol Flyable {
    func fly()
}

protocol Swimmable {
    func swim()
}

class Eagle: Bird, Flyable {
    func fly() {
        print("Soaring through the sky!")
    }
}

class Penguin: Bird, Swimmable {
    func swim() {
        print("Swimming in the ocean!")
    }
}

// Now we only accept objects that are guaranteed to fly
func makeBirdFly(bird: Flyable) {
    bird.fly()
}

```

---

## 4. Interface Segregation Principle (ISP)

> **Definition:** Clients should not be forced to depend upon interfaces that they do not use.

It is better to have many small, specific interfaces (protocols) rather than one large, general-purpose one.

### ❌ The Violation

Imagine a smart home protocol that forces devices to implement methods they don't need.

```swift
protocol SmartDevice {
    func turnOn()
    func turnOff()
    func setTemperature(_ temp: Double)
    func startRecording()
}

class SmartThermostat: SmartDevice {
    func turnOn() { print("Thermostat on") }
    func turnOff() { print("Thermostat off") }
    func setTemperature(_ temp: Double) { print("Temp set to \(temp)") }
    
    // Forced to implement a meaningless method
    func startRecording() {
        // Do nothing... Thermostats don't have cameras!
    }
}

```

**Why this fails:** `SmartThermostat` is forced to provide a dummy implementation for `startRecording()`, creating pollution and potential bugs.

### ✅ The Fix

Break the fat protocol down into smaller, role-specific protocols.

```swift
protocol Switchable {
    func turnOn()
    func turnOff()
}

protocol Thermostat {
    func setTemperature(_ temp: Double)
}

protocol Camera {
    func startRecording()
}

// Now devices only adopt what they actually do
class SmartThermostat: Switchable, Thermostat {
    func turnOn() { print("Thermostat on") }
    func turnOff() { print("Thermostat off") }
    func setTemperature(_ temp: Double) { print("Temp set to \(temp)") }
}

class SecurityCamera: Switchable, Camera {
    func turnOn() { print("Camera on") }
    func turnOff() { print("Camera off") }
    func startRecording() { print("Recording video...") }
}

```

---

## 5. Dependency Inversion Principle (DIP)

> **Definition:** High-level modules should not depend on low-level modules. Both should depend on abstractions (e.g., interfaces or protocols). Abstractions should not depend on details. Details should depend on abstractions.

### ❌ The Violation

A high-level `PaymentManager` relies directly on a concrete low-level `StripeAPI` class.

```swift
class StripeAPI {
    func processCharge(amount: Double) {
        print("Charging $\(amount) via Stripe")
    }
}

class PaymentManager {
    let stripeAPI = StripeAPI() // Direct dependency!
    
    func checkout(amount: Double) {
        stripeAPI.processCharge(amount: amount)
    }
}

```

**Why this fails:** If the company decides to switch from Stripe to PayPal, we have to rewrite the `PaymentManager`. The high-level module is tightly coupled to the low-level implementation.

### ✅ The Fix

Introduce a protocol (`PaymentProvider`) that both the high-level and low-level modules depend upon. We then inject the dependency.

```swift
// 1. The Abstraction
protocol PaymentProvider {
    func processPayment(amount: Double)
}

// 2. Low-Level Modules depending on the Abstraction
class StripeAPI: PaymentProvider {
    func processPayment(amount: Double) {
        print("Charging $\(amount) via Stripe")
    }
}

class PayPalAPI: PaymentProvider {
    func processPayment(amount: Double) {
        print("Charging $\(amount) via PayPal")
    }
}

// 3. High-Level Module depending on the Abstraction
class PaymentManager {
    let paymentProvider: PaymentProvider
    
    // Dependency Injection
    init(paymentProvider: PaymentProvider) {
        self.paymentProvider = paymentProvider
    }
    
    func checkout(amount: Double) {
        paymentProvider.processPayment(amount: amount)
    }
}

// Usage:
let stripePayment = PaymentManager(paymentProvider: StripeAPI())
stripePayment.checkout(amount: 50.0)

// Easily switch to PayPal without modifying PaymentManager!
let paypalPayment = PaymentManager(paymentProvider: PayPalAPI())
paypalPayment.checkout(amount: 50.0)

```

---

## Conclusion

By applying the SOLID principles to your codebase, you transform rigid, fragile code into a modular, flexible system. While it might take a bit more upfront planning, the long-term benefits in testability, maintenance, and scalability are well worth the effort.