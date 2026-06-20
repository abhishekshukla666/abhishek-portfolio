---
title: "How Copy-on-Write(CoW) in Swift works and optimizes memory"
# description: ""
date: "2026-06-21T13:47:17+05:30"
draft: false
tags: ["Swift", "CoW", "Memory-Managment"]
weight: 101
# cover:
    # image: "blog/Swift.jpeg"

# ShowWordCount: true
ShowReadingTime: true
---

Swift is designed around two core principles: **safety** and **performance**.

At first glance, these goals often appear to conflict. Value types provide safety and predictability, but copying large values repeatedly can be expensive. Reference types provide efficiency through shared storage, but they introduce shared mutable state.

Swift solves this tension elegantly through a memory optimization technique called **Copy-on-Write (CoW).**

If you’ve used Array, Dictionary, Set, or String, you’ve already relied on Copy-on-Write — even if you didn’t realize it.

In this article, we’ll explore:

* What is Copy-on-Write
* Why Swift uses it
* How it works internally
* The role of isKnownUniquelyReferenced
* How ensureUnique() preserves value semantics
* How to implement your own Copy-on-Write type

## What Is Copy-on-Write?

Copy-on-Write is a strategy where:

> A value is only copied when a mutation occurs — not when it is assigned.

This allows multiple variables to share the same underlying storage until one of them attempts to modify it.

Instead of eagerly copying data during assignment, Swift delays copying until mutation is required.

This achieves:

* Value semantics externally
* Shared storage internally
* Efficient memory usage
* Predictable behavior

## The Problem Copy-on-Write Solves

Consider this example:
```
var numbers = Array(0...1_000_000)
var copy = numbers
```

If Swift eagerly copied one million integers during assignment, performance would suffer significantly.

Instead:

* numbers and copy share the same storage.
* No duplication happens yet.
* A copy is only created if one of them mutates.

This lazy copying is the essence of Copy-on-Write.

## Observing Copy-on-Write in Action

### Example 1 — Assignment Without Mutation

```
var a = [1, 2, 3]
var b = a
```
At this moment:

* a and b share the same storage.
* No copy has been made.

### Example 2 — Mutation Triggers Copy

```
b.append(4)
```

Now Swift performs a check:

* Is the underlying storage uniquely referenced?
* If not, create a copy before mutating.

Final result:

```
a = [1, 2, 3]
b = [1, 2, 3, 4]
```

Value semantics are preserved, but copying only happens when necessary.

## How Swift Knows When to Copy

Even though *Array* is a *struct*, it stores its elements in a hidden reference-type buffer internally.

Before mutating that buffer, Swift performs a runtime check:

```
isKnownUniquelyReferenced(_:)
```

This function determines whether the underlying storage is exclusively owned.

## Deep Dive: *isKnownUniquelyReferenced*

The function signature is:

```
func isKnownUniquelyReferenced<T>(_ object: inout T) -> Bool where T : AnyObject
```

It returns:

* true → if exactly one strong reference exists
* false → if multiple strong references exist

In practical terms:

> “Is this storage exclusively owned?”

If yes → mutate in place.

If no → create a copy first.

### Why the Parameter Is *inout*

You may wonder why the parameter is marked inout.

This is deliberate and essential.

### 1. Avoiding Temporary Retains

If the parameter were passed normally, Swift might temporarily increase the reference count while passing it into the function. That temporary retain would falsely indicate the object is not unique.

Using *inout* prevents that extra reference increment and ensures the check reflects the true ARC count.

### 2. Enforcing Memory Exclusivity

Swift enforces strict memory access rules. By requiring inout, the compiler guarantees exclusive access to the variable during the check.

This prevents race conditions and overlapping access during mutation.

### What “Known” Means

The name is precise:

> isKnownUniquelyReferenced

It does not guarantee uniqueness under every conceivable concurrency scenario. It guarantees uniqueness when Swift can safely prove it under ARC and exclusivity rules.

This is sufficient for implementing Copy-on-Write correctly in standard Swift usage.

## Value Semantics Is Not Copy-on-Write

It is important to clarify a common misconception:

> Value semantics is not the same as Copy-on-Write.

All structs in Swift have value semantics. That means:

* Assignment creates a new value.
* Mutation does not affect the original instance.

However, **Copy-on-Write is not automatically applied to all structs.**

Copy-on-Write is a deliberate engineering decision made by the implementer of a type.

For example:

* Array uses Copy-on-Write.
* Dictionary uses Copy-on-Write.
* Set uses Copy-on-Write.
* String uses Copy-on-Write.

But a simple struct like this:

```
struct Point {
    var x: Int
    var y: Int
}
```

does not use Copy-on-Write.

When you assign *Point*, its stored properties are copied immediately because they are small and inexpensive.

## Why Some Types Use Copy-on-Write

Copy-on-Write exists purely for performance optimization.

It is applied when:

* The underlying storage is large
* Copying eagerly would be expensive
* Shared storage improves efficiency
* Value semantics must still be preserved

In other words:

> Copy-on-Write is an optimization strategy, not a language rule.

## The Architectural Distinction

* Value semantics → language-level behavior
* Copy-on-Write(CoW) → storage optimization pattern
* ARC → runtime mechanism enabling uniqueness checks

These are related — but not identical.

Understanding this distinction separates surface-level familiarity from architectural understanding of Swift’s design.

## Implementing Copy-on-Write Manually

To understand the mechanism fully, let’s build our own CoW type.

### Step 1 — Reference Storage

```
final class Storage {
    var value: Int

    init(value: Int) {
        self.value = value
    }
}
```

We use a *final class* because:

* Classes are reference types.
* final avoids dynamic dispatch overhead.

### Step 2 — Struct Wrapper

```
struct Counter {
    private var storage: Storage

    init(value: Int) {
        self.storage = Storage(value: value)
    }

    var value: Int {
        get { storage.value }
        set {
            ensureUnique()
            storage.value = newValue
        }
    }
}
```

Externally, Counter behaves like a value type.

Internally, it shares reference storage.

## The Critical Mutation Gate: ensureUnique()

```
extension Counter {
    private mutating func ensureUnique() {
        if !isKnownUniquelyReferenced(&storage) {
            storage = Storage(value: storage.value)
        }
    }
}
```
This function guarantees:

> Before mutation occurs, the struct owns its storage exclusively.

### Why ensureUnique() Is mutating

If the storage is shared, we assign a new instance to storage. That modifies self, so the method must be marked mutating.

### What ensureUnique() Actually Does

It does not mutate the value directly.

It only ensures that mutation can occur safely.

Think of it as a safety checkpoint before modification.

## Step-by-Step Execution Flow

Consider:

```
var a = Counter(value: 10)
var b = a

b.value = 20
```

### Step 1 — Assignment
```
a ──┐
    ├── Storage(value: 10)
b ──┘
```
Reference count = 2.

### Step 2 — Mutation Begins

b.value = 20 calls:
```
ensureUnique()
```

Swift checks:

```
isKnownUniquelyReferenced(&storage)
```
Result: false

### Step 3 — Copy Created

```
storage = Storage(value: storage.value)
```

Now each instance has its own storage.

### Step 4 — Safe Mutation

```
storage.value = 20
```

Final state:
```
a.value // 10
b.value // 20
```
Value semantics preserved.

### Why This Pattern Is Essential

If you skipped *ensureUnique()*:
```
storage.value = newValue
```

You would accidentally mutate shared storage.

Your struct would behave like a class.

Value semantics would be broken silently.

The uniqueness check is what guarantees correctness.

### Performance Characteristics

The uniqueness check:

* Is O(1)
* Reads ARC metadata
* Does not allocate memory unless needed

Copy-on-Write performs best when:

* Data is large
* Reads are frequent
* Mutations are relatively rare

However, repeated copying inside tight mutation loops can reduce performance.

Understanding this helps you design more efficient systems.

## Why Swift Uses Copy-on-Write

Copy-on-Write gives Swift the best of both worlds:

| Feature  | Struct + CoW | Class |
| ------------- |:-------------:|:-------------:|
| Value semantics       | ✅     | ❌ |
| Shared storage        | ✅     | ✅ |
| Predictable behavior  | ✅     | ❌ |
| Memory efficiency     | ✅     | ✅ |

It enables:

* Safer APIs
* Better SwiftUI data modeling
* Efficient large collections
* Scalable architecture

## Key Design Principles for Custom CoW Types

When implementing Copy-on-Write:

1. Use a final class for storage.
2. Keep storage private.
3. Gate every mutation behind ensureUnique().
4. Never expose the reference storage directly.
5. Ensure copying is deep enough to preserve isolation.

These rules are non-negotiable.

## Final Thoughts

Copy-on-Write is not just a performance trick. It is a foundational design pattern in Swift.

It allows Swift to deliver:

* Value semantics
* High performance
* Memory efficiency
* Predictable behavior

The partnership between:

* isKnownUniquelyReferenced
* ensureUnique()
* ARC
* Struct wrappers

is what makes Swift’s standard library both elegant and powerful.

Mastering Copy-on-Write deepens your understanding of how Swift balances safety with efficiency — and equips you to design high-performance abstractions in your own code.