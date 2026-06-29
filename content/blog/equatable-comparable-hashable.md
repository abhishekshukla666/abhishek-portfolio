---
title: "Mastering Equatable, Comparable, and Hashable in Swift"
# description: "A complete guide to understanding and implementing Equatable, Comparable, and Hashable protocols in Swift. Learn the crucial differences between structs and classes."
date: "2026-06-29T10:00:00+05:30"
draft: false
tags: ["Swift", "Protocols"]
weight: 113
# cover:
    # image: "blog/Protocols.jpeg"

# ShowWordCount: true
ShowReadingTime: true
---

When building applications in Swift, you constantly need to compare objects, sort arrays, or store unique items in a `Set` or `Dictionary`. To do this efficiently, Swift relies on three fundamental protocols: **Equatable**, **Comparable**, and **Hashable**.

While these protocols are easy to adopt, their behavior differs significantly depending on whether you are using a `struct` or a `class`. Let's break down why we need them and how to implement them correctly.

---

## 1. Equatable

### Why do we need it?
By default, Swift does not know how to check the equality of two custom objects. If you try to use the `==` operator on a standard struct, the compiler will throw an error.

![](/blog/equatable-issue1.png)

Without `Equatable`, your only option is to manually compare the properties every single time, which is tedious and error-prone:

```swift
struct River {
    let name: String
    let country: String
}

let ganga = River(name: "Ganga", country: "India")
let yamuna = River(name: "Yamuna", country: "India")

// ❌ Not ideal: Manual property comparison
if ganga.name == yamuna.name && ganga.country == yamuna.country {
    debugPrint("Same Value for both objects")
}

```

### Implementing Equatable for Structs

Swift makes this incredibly easy for value types. If all properties inside your `struct` already conform to `Equatable` (like `String` and `Int`), you simply add the protocol conformance, and Swift synthesizes the logic for you.

```swift
struct River: Equatable {
    let name: String
    let country: String
}

let ganga = River(name: "Ganga", country: "India")
let yamuna = River(name: "Ganga", country: "India")

// ✅ Clean and native
if ganga == yamuna {
    debugPrint("Same Value for both objects")
}

```

**Custom Equality:**
If you only want to compare *specific* properties (e.g., only checking the country), you can explicitly implement the `==` method:

```swift
struct River: Equatable {
    let name: String
    let country: String
    
    static func == (lhs: Self, rhs: Self) -> Bool {
        return lhs.country == rhs.country
    }
}

```

### Implementing Equatable for Classes

Classes are reference types, which means Swift **does not** automatically synthesize initializers or `Equatable` conformance for them.

Even after you write the initializer, the compiler still won't know which properties dictate equality. You *must* manually implement the `==` method.

![](/blog/equatable-issue3.png)

```swift
class River: Equatable {
    let name: String
    let country: String
    
    init(name: String, country: String) {
        self.name = name
        self.country = country
    }
    
    // Required for classes!
    static func == (lhs: River, rhs: River) -> Bool {
        return lhs.country == rhs.country
    }
}

```

---

## 2. Comparable

The `Comparable` protocol inherits from `Equatable`. It allows you to use relational operators like `<`, `>`, `<=`, and `>=`. This is essential if you want to use methods like `.sorted()` on an array of your custom types.

To conform, you only need to implement the `<` (less than) operator. Swift will automatically infer the rest based on `<` and `==`.

### Structs

```swift
struct River: Comparable {
    let name: String
    let country: String
    let length: Int // KM
    
    static func < (lhs: River, rhs: River) -> Bool {
        return lhs.length < rhs.length
    }
}

let ganga = River(name: "Ganga", country: "India", length: 2525)
let yamuna = River(name: "Yamuna", country: "India", length: 1376)

if yamuna < ganga {
    debugPrint("Yamuna's length is smaller than Ganga")
}

```

### Classes

Just like with `Equatable`, classes get no automatic synthesis. Because `Comparable` inherits from `Equatable`, a class adopting `Comparable` must implement **both** the `<` method and the `==` method explicitly.

```swift
class River: Comparable {
    let name: String
    let country: String
    let length: Int // KM
    
    init(name: String, country: String, length: Int) {
        self.name = name
        self.country = country
        self.length = length
    }
    
    // 1. Conform to Comparable
    static func < (lhs: River, rhs: River) -> Bool {
        return lhs.length < rhs.length
    }
    
    // 2. Conform to Equatable requirements
    static func == (lhs: River, rhs: River) -> Bool {
        return lhs.name == rhs.name && lhs.country == rhs.country
    }
}

```

---

## 3. Hashable

A hash value is a large integer representation of an object. Swift uses this integer to quickly look up items in a `Set` or a `Dictionary`. The hash value may change each time the program runs, but it remains consistent during a single execution.

*(Note: The `Hashable` protocol also inherits from `Equatable`, meaning any type that is Hashable must also be Equatable).*

### Structs

For structs where all properties are already `Hashable` (like standard strings and integers), Swift synthesizes the conformance automatically.

```swift
struct River: Hashable {
    let name: String
    let country: String
}

let ganga = River(name: "Ganga", country: "India")
let yamuna = River(name: "Yamuna", country: "India")

print(ganga.hashValue) // e.g., -749079774561398480
print(yamuna.hashValue) // e.g., 2503812864319202522

```

**Custom Hashing:**
If you want to manually dictate which properties are fed into the hashing algorithm (for instance, to ignore the `name` and only hash the `country`), you implement `hash(into:)`.

```swift
struct River: Hashable {
    let name: String
    let country: String
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(country)
    }
}

```

### Classes

As you might have guessed, classes require manual implementation. You must provide the `hash(into:)` method AND the `==` method.

```swift
class River: Hashable {
    let name: String
    let country: String
    
    init(name: String, country: String) {
        self.name = name
        self.country = country
    }
    
    // 1. Feed properties into the hasher
    func hash(into hasher: inout Hasher) {
        hasher.combine(country)
    }
    
    // 2. Provide Equatable logic
    static func == (lhs: River, rhs: River) -> Bool {
        return lhs.country == rhs.country
    }
}

```

## Summary

* **Structs** do most of the heavy lifting for you. Swift automatically synthesizes `Equatable` and `Hashable` if the properties support it.
* **Classes** require you to manually write the `==`, `<`, and `hash(into:)` methods.
* If you adopt **Hashable** or **Comparable**, you must also ensure your object conforms to **Equatable**.