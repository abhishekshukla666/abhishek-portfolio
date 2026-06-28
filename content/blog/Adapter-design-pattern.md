---
title: "The Adapter Design Pattern in Swift: Bridging Legacy Code to Modern APIs"
# description: "Learn how to use the Adapter design pattern in Swift to bridge old legacy frameworks and completion blocks to modern, strongly-typed async/await architecture."
date: "2026-06-24T11:20:00+05:30"
draft: false
tags: ["Swift", "Architecture", "Structural Design Patterns", "Async/Await"]
weight: 108
# cover:
    # image: "blog/Adapter.jpeg"

# ShowWordCount: true
ShowReadingTime: true
---

In the real world, you cannot always control the code you work with. You will frequently need to integrate legacy systems, older Objective-C frameworks, or external SDKs into your modern Swift application. 

The problem arises when these external systems have interfaces that are completely incompatible with your app's existing architecture. If you force your app to accommodate these legacy interfaces directly—like dealing with `NSArray`, untyped dictionaries, and completion handlers—your code quickly becomes a tightly coupled, unsafe mess.

This is where the **Adapter** (or Wrapper) design pattern comes in. It acts as a bridge, allowing objects with incompatible interfaces to collaborate.

---

## What is the Adapter Pattern?

Think of a real-world travel adapter. If you travel from the US to Europe, your laptop charger plug will not fit into the wall socket. You do not rewire the European wall socket, nor do you buy a new laptop. Instead, you use a travel adapter that sits between the socket and your plug, translating the connection.

In software, the Adapter pattern does exactly the same thing. It wraps an "Adaptee" (the incompatible class) and exposes a "Target" interface that your client code already understands.

## The Violation: Tight Coupling to Legacy Code

Imagine you are building a modern SwiftUI app, but you are forced to use an older internal framework to fetch user contacts. This legacy SDK relies on completion blocks and returns an untyped `NSArray`.

### ❌ The Anti-Pattern

```swift
// The incompatible legacy framework (Adaptee)
class LegacyContactFramework {
    func getRecords(completion: @escaping (NSArray) -> Void) {
        // Simulating a legacy fetch returning untyped dictionaries
        let rawData: NSArray = [
            ["name": "Alice", "phone": "555-1234"],
            ["name": "Bob", "phone": "555-5678"]
        ]
        DispatchQueue.global().async {
            completion(rawData)
        }
    }
}

```

The lazy (and dangerous) way to fix this is to inject the legacy framework directly into your ViewModels and deal with the messy parsing inside your business logic.

```swift
class ContactsViewModel: ObservableObject {
    @Published var displayNames: [String] = []
    
    let legacyFramework = LegacyContactFramework() // Tightly coupled!
    
    func loadContacts() {
        // Messy completion blocks and raw type casting bleeding into the UI layer
        legacyFramework.getRecords { [weak self] nsArray in
            guard let dictArray = nsArray as? [[String: String]] else { return }
            
            var names: [String] = []
            for dict in dictArray {
                if let name = dict["name"] {
                    names.append(name)
                }
            }
            
            DispatchQueue.main.async {
                self?.displayNames = names
            }
        }
    }
}

```

**Why this fails:** * `ContactsViewModel` is completely dependent on `LegacyContactFramework`.

* It violates the **Single Responsibility Principle** by forcing the ViewModel to parse `NSArray` and dictionaries.
* It prevents you from fully migrating to modern Swift Concurrency (`async/await`) because the completion handler pollutes the call site.

---

## The Fix: The Adapter Pattern

Instead of changing the client (`ContactsViewModel`), we create an Adapter. This Adapter will translate the old completion-block `NSArray` interface into a modern `async/await` interface returning strictly typed Swift structs.

### ✅ Step 1: Define the Target Interface

First, we define how we *want* our app to handle contacts. We want strongly typed models and modern concurrency.

```swift
// 1. The modern data model
struct Contact: Identifiable {
    let id = UUID()
    let name: String
    let phone: String
}

// 2. The Target Interface abstraction
protocol ContactFetching {
    func fetchContacts() async -> [Contact]
}

```

### ✅ Step 2: Create the Adapter

We create a new class that conforms to our modern `ContactFetching` protocol. Under the hood, it interacts with the legacy framework, parses the dirty data, and uses continuations to bridge the completion handler to `async/await`.

```swift
// The Adapter bridging the gap
class LegacyContactAdapter: ContactFetching {
    
    private let legacyFramework = LegacyContactFramework()
    
    func fetchContacts() async -> [Contact] {
        // Bridging completion handler to async/await
        return await withCheckedContinuation { continuation in
            legacyFramework.getRecords { nsArray in
                var parsedContacts: [Contact] = []
                
                // Safely parse the untyped legacy data
                if let dictArray = nsArray as? [[String: String]] {
                    for dict in dictArray {
                        if let name = dict["name"], let phone = dict["phone"] {
                            parsedContacts.append(Contact(name: name, phone: phone))
                        }
                    }
                }
                
                // Return the clean, strongly-typed data
                continuation.resume(returning: parsedContacts)
            }
        }
    }
}

```

### ✅ Step 3: Clean Up the Client Code

Now, our `ContactsViewModel` only needs to know about the `ContactFetching` protocol. It uses modern Swift, is highly testable, and has no idea that a legacy `NSArray` even exists.

```swift
@MainActor
class ContactsViewModel: ObservableObject {
    @Published var contacts: [Contact] = []
    
    // Depends purely on the modern abstraction!
    private let contactService: ContactFetching
    
    init(contactService: ContactFetching) {
        self.contactService = contactService
    }
    
    func loadContacts() async {
        // Clean, readable, and strongly-typed
        self.contacts = await contactService.fetchContacts()
    }
}

// Usage in app:
// We inject the Adapter when initializing the ViewModel
let adapter = LegacyContactAdapter()
let viewModel = ContactsViewModel(contactService: adapter)

Task {
    await viewModel.loadContacts()
}

```

---

## Where to Use the Adapter Pattern

1. **Modernizing Legacy Code:** Wrapping older Objective-C SDKs, delegate patterns, or completion handlers so they expose modern Swift `async/await` APIs or Combine publishers.
2. **Third-Party Integrations:** Wrapping closed-source SDKs so your business logic isn't tied to an external dependency. If you swap SDKs later, you only write a new Adapter.
3. **API Responses:** If a backend API changes its JSON structure, you can create an adapter to map the new response format into your app's existing internal models.

## Where NOT to Use the Adapter Pattern

* **When you control both systems:** If you own both the client code and the incompatible legacy class, and it is safe to do so, it is usually better to just refactor the class to implement the correct interface directly. Do not build an Adapter to cover up lazy refactoring.
* **When the interfaces are overly complex:** If translating between the two systems requires massive amounts of business logic and state management, you might need a more robust pattern (like a Facade or an Anti-Corruption Layer) rather than a simple Adapter.

## Final Thoughts

The Adapter pattern is an essential defensive mechanism. It protects your core application logic from external changes, outdated legacy frameworks, and incompatible data structures. By bridging the old to the new, you ensure that your code dictates how external libraries are used—not the other way around.