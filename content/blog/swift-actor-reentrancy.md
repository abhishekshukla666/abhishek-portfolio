---
title: "Understanding Actor Reentrancy in Swift: The Hidden Concurrency Trap"
# description: "Swift Actors protect you from data races, but they introduce a new challenge: Reentrancy. Learn what it is, why it causes bugs, and how to write safe actor code."
date: "2026-07-02T09:30:00+05:30"
draft: false
tags: ["Swift", "Concurrency", "Actors", "DataRace"]
weight: 116
# cover:
    # image: "blog/ActorReentrancy.jpeg"

# ShowWordCount: true
ShowReadingTime: true
---

With the introduction of Swift Concurrency, **Actors** became the ultimate tool for protecting shared mutable state. By isolating their state and ensuring that only one task can access that state at a time, actors eliminate traditional data races. 

However, they introduce a new, subtle, and incredibly dangerous concept that trips up even experienced developers: **Actor Reentrancy**.

If you assume that an actor behaves exactly like a serial `DispatchQueue` or an `NSLock`, you are going to write buggy code. Let’s explore what actor reentrancy is, why it breaks your logic, and how to fix it using a real-world banking scenario.

---

## What is Actor Reentrancy?

To understand reentrancy, you must understand suspension points (the `await` keyword). 

When an actor executes synchronous code, it holds a "lock." No other task can enter the actor. But when an actor hits an `await` keyword, it **suspends**. 

By suspending, **the actor yields its lock**. While the first task is waiting for some external work to finish, the actor is completely free to accept and process *new* tasks. When the first task finishes waiting and resumes, the actor's state might have completely changed.

> **Reentrancy means an actor can safely interleave multiple tasks at suspension points to prevent deadlocks.**

Actor isolation only guarantees mutual exclusion *within a synchronous block*. The moment an actor method hits an `await`, the actor is released.

---

## The Violation: The Bank Transfer Trap

Let's look at a real scenario from a production-style app. We have a `BankAccount` actor, and we want to transfer money between two accounts.

### ❌ The Anti-Pattern

```swift
actor BankAccount {
    private var balance: Double
    
    init(balance: Double) {
        self.balance = balance
    }
    
    func getBalance() -> Double {
        return balance
    }
    
    // 🚨 The Dangerous Method
    func transfer(amount: Double, to destination: BankAccount) async throws {
        guard balance >= amount else {
            throw BankError.insufficientFunds
        }
        
        balance -= amount
        
        // 🚨 SUSPENSION POINT! The actor yields its lock here.
        try await destination.deposit(amount: amount)
    }
    
    func deposit(amount: Double) {
        balance += amount
    }
}

enum BankError: Error {
    case insufficientFunds
}

```

Imagine we trigger two concurrent transfers from Account A (balance: 1000) to Account B:

```swift
let accountA = BankAccount(balance: 1000)
let accountB = BankAccount(balance: 500)

// Two concurrent transfers attempting to move 1100 total
async let transfer1 = accountA.transfer(amount: 300, to: accountB)
async let transfer2 = accountA.transfer(amount: 800, to: accountB)

try await [transfer1, transfer2]

```

### What Exactly Goes Wrong Here?

This code has a **critical bug** that actors are supposed to prevent, but don't in this specific scenario because of reentrancy. Here is the exact sequence of events:

1. **Task 1** enters `accountA`, passes the guard check (1000 >= 300), deducts the balance (balance is now 700), and then **SUSPENDS** at `await destination.deposit()`.
2. Because Task 1 suspended, the actor is released.
3. **Task 2** enters `accountA` while Task 1 is still suspended.
4. Task 2 reads the current balance (700), passes the guard check (700 >= 800 is false, but if the execution interleaves slightly differently or if the deduction happened *after* the await, the bounds are completely broken).
5. More importantly, what if `destination.deposit` fails or throws an error? The money has already been deducted from `accountA`, but the `deposit` didn't complete. Because the transaction was split by an `await`, it is no longer **atomic**.

---

## The Fix: Eliminating the Suspension Point

To fix this, we must recognize a fundamental actor constraint: **State mutations that rely on a specific condition must remain strictly synchronous.** We can solve this by eliminating the suspension point inside the `BankAccount` completely. We do this by separating the operation into two synchronous steps (`withdraw` and `deposit`) and orchestrating them from the outside.

### ✅ Step 1: Make Actor Methods Synchronous and Atomic

First, we rewrite the `BankAccount` so that mutations happen instantly, with no `await` keywords to break the lock.

```swift
actor BankAccount {
    private var balance: Double
    
    init(balance: Double) {
        self.balance = balance
    }
    
    func getBalance() -> Double { return balance }
    
    func withdraw(amount: Double) throws {
        guard balance >= amount else {
            throw BankError.insufficientFunds
        }
        balance -= amount
        
        // ✅ guard + deduction is now atomic — no await between them
        // ✅ no suspension possible — reentrancy eliminated
    }
    
    func deposit(amount: Double) {
        balance += amount // ✅ synchronous — atomic
    }
}

```

### ✅ Step 2: Use a Coordinator to Handle the Async Work

Next, we create a dedicated `TransactionCoordinator`. This coordinator will safely call the atomic methods on our actors. If a failure occurs mid-transaction, it handles the rollback.

```swift
actor TransactionCoordinator {
    func transfer(amount: Double,
                  from source: BankAccount,
                  to destination: BankAccount) async throws {
        
        // 1. Attempt the withdrawal
        try await source.withdraw(amount: amount)
        // ✅ atomic check + deduct in ONE actor call
        // ✅ if insufficient funds → throws here, nothing is deducted
        
        // 2. Attempt the deposit
        do {
            await destination.deposit(amount: amount)
            // ✅ deposit attempted only after successful withdraw
        } catch {
            // 3. The Rollback
            await source.deposit(amount: amount)
            // ✅ money returned to source if deposit fails
            throw error 
        }
    }
}

```

### ✅ Step 3: Run the Safe Code

Now, our transaction is fully protected against reentrancy.

```swift
func runTest() async {
    let accountA = BankAccount(balance: 1000)
    let accountB = BankAccount(balance: 500)
    let coordinator = TransactionCoordinator()
    
    print("Before transfer:")
    print("accountA: \(await accountA.getBalance())")
    print("accountB: \(await accountB.getBalance())")
    
    do {
        try await coordinator.transfer(
            amount: 300,
            from: accountA,
            to: accountB
        )
        print("\nAfter transfer:")
        print("accountA: \(await accountA.getBalance())")
        print("accountB: \(await accountB.getBalance())")
    } catch {
        print("Transfer failed: \(error)")
    }
}

Task { await runTest() }

```

---

## Final Thoughts

Actor reentrancy is by design in Swift; it is not a flaw in the actor model itself. It ensures your app remains responsive and avoids deadlocks.

However, it forces you to design your state mutations carefully. The golden rule is: **Keep your state mutations synchronous.** Group your condition checks and modifications together without any `await` calls in between. If you must cross boundaries, use a coordinator pattern to orchestrate the atomic pieces securely.