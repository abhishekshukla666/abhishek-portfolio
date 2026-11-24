---
title: "SwiftUI in 12 Questions: State, Identity and Rendering"
date: 2026-11-24T11:20:39+05:30
draft: false
tags: ["Swift", "SwiftUI", "Observation"]
categories: ["Q&A"]
keyPoints:
  - "SwiftUI views are cheap value descriptions; the framework keeps the real state and identity elsewhere."
  - "Whoever creates a reference-type model owns it: `@StateObject` or `@State`, never `@ObservedObject`."
  - "`@Observable` tracks the properties a `body` actually reads, so unrelated changes don't redraw the view."
  - "A view's identity is its position in the tree or an explicit `.id`; change it and SwiftUI resets the view's state."
  - "Prefer a ternary inside one modifier to an `if` around two views: it keeps identity, state and animations."
  - "Use `.task` (or `.task(id:)`) for async work — SwiftUI cancels it when the view goes away or the id changes."
ShowReadingTime: true
ShowToc: true
TocOpen: false
---

SwiftUI is easy to start with and surprisingly deep once a screen grows. Most hard SwiftUI bugs come
from three ideas: who owns state, what a view's identity is, and when `body` runs. These twelve
questions build up to those ideas, from the basics to the details that matter in production.

**How to use this page:** read the question, answer it out loud, then open the answer.

---

## State and ownership

{{< qa q="Why are SwiftUI views structs rather than classes?" level="Junior" >}}
A SwiftUI view is a lightweight **description** of UI, not the UI itself. Structs are cheap to
create and compare, so SwiftUI can rebuild the description whenever data changes and diff it against
the previous one.

The real, long-lived things — the rendered views, `@State` storage, animations — live inside
SwiftUI's own graph, keyed by each view's identity. That is why a view struct can be thrown away and
recreated many times a second without losing its state.
{{< /qa >}}

{{< qa q="What is the difference between `@State` and `@Binding`?" level="Junior" >}}
`@State` **owns** a value: SwiftUI stores it outside the struct and keeps it for as long as the view
keeps its identity. `@Binding` **borrows** a value someone else owns: it reads and writes through to
the owner's storage.

```swift
struct Settings: View {
    @State private var isOn = false          // owner
    var body: some View { Row(isOn: $isOn) } // pass a binding down
}

struct Row: View {
    @Binding var isOn: Bool                  // borrower
    var body: some View { Toggle("Alerts", isOn: $isOn) }
}
```

Keep `@State` private: it is meant to be initialised and owned by the view itself.
{{< /qa >}}

{{< qa q="When do you use `@StateObject` and when `@ObservedObject`?" level="Mid" >}}
It comes down to **who creates the object**.

- `@StateObject` — the view creates and owns the object. SwiftUI makes it once and keeps it alive
  across re-renders.
- `@ObservedObject` — the object is created elsewhere and passed in; the view only watches it.

The classic bug is creating an object with `@ObservedObject`:

```swift
@ObservedObject var model = ProfileModel()   // recreated every time the parent re-renders
```

Each time the parent's `body` runs, a new `ProfileModel` is made and its state is lost. With
`@StateObject` it is created once.
{{< /qa >}}

{{< qa q="What does the `@Observable` macro change compared with `ObservableObject`?" level="Mid" >}}
With `ObservableObject`, any `@Published` change fires `objectWillChange`, and **every** view
observing the object re-evaluates its `body`.

`@Observable` (Observation framework, iOS 17) tracks which properties each `body` actually reads.
A view only updates when one of *those* properties changes. You also drop the property wrappers:

| `ObservableObject` | `@Observable` |
| --- | --- |
| `@Published var name` | `var name` |
| Own it with `@StateObject` | Own it with `@State` |
| Pass it with `@ObservedObject` | Pass it as a plain `let` (or `@Bindable` for bindings) |
| `@EnvironmentObject` | `@Environment(Model.self)` |

The result is fewer redraws and simpler code.
{{< /qa >}}

## Identity and rendering

{{< qa q="What is a view's identity, and why does it matter?" level="Senior" >}}
Identity is how SwiftUI knows that the view it sees now is "the same" view it saw before. It has two
kinds:

- **Structural identity** — the view's type and position in the view tree.
- **Explicit identity** — an id you give it: `.id(_:)`, or the ids in a `ForEach`.

State, animations and transitions are tied to identity. If identity changes, SwiftUI treats the view
as new: its `@State` is reset and an insertion/removal transition runs. That is why unstable
`ForEach` ids (such as indices or `UUID()` created on the fly) cause flicker and lost state, and why
`.id(someValue)` is a deliberate way to reset a view.
{{< /qa >}}

{{< qa q="Why can `if` / `else` around two views behave differently from a ternary inside one modifier?" level="Senior" >}}
An `if`/`else` produces two **different** views in the tree (`_ConditionalContent`), so toggling the
condition destroys one and inserts the other: state resets and it animates as a removal and an
insertion.

```swift
// Two identities: the text is replaced, not changed
if isError { Text(message).foregroundStyle(.red) }
else       { Text(message).foregroundStyle(.primary) }

// One identity: only the colour changes, and it animates smoothly
Text(message).foregroundStyle(isError ? .red : .primary)
```

Use branches when the content is genuinely different; use a ternary when only a value differs.
{{< /qa >}}

{{< qa q="When does SwiftUI re-run a view's `body`?" level="Mid" >}}
When something the view **depends on** changes: its own `@State`, a binding, an observed property it
read, an environment value it reads, or the inputs its parent passes in.

Ways to keep that cheap:

- Keep `body` fast and side-effect free — it can run often.
- Split large views so that a change only invalidates the small subview that reads it.
- Pass subviews only the values they need, not a whole model.
- With `ObservableObject`, prefer `@Observable`, which narrows updates to the properties read.
{{< /qa >}}

{{< qa q="Why is `AnyView` usually a bad idea?" level="Mid" >}}
`AnyView` erases the view's type, and SwiftUI relies on types to tell views apart. With `AnyView` it
can no longer diff efficiently, so it may rebuild more than necessary and lose identity across
updates.

Return `some View` with `@ViewBuilder`, use `Group`, or make the container generic over its content
instead. Reach for `AnyView` only for truly heterogeneous collections, where nothing else fits.
{{< /qa >}}

## Lifecycle, environment and interop

{{< qa q="When do you use `.task` instead of `.onAppear`?" level="Mid" >}}
Use `.task` for async work. It starts when the view appears and is **cancelled automatically when the
view disappears**. `.task(id:)` also cancels and restarts the work whenever the id changes — ideal for
reloading when a selection or search query changes.

A `Task { }` started in `onAppear` is unstructured: nothing cancels it, so it can finish after the
screen is gone and write stale results.
{{< /qa >}}

{{< qa q="What is the difference between `@Environment` and `@EnvironmentObject`?" level="Mid" >}}
`@Environment(\.key)` reads values SwiftUI or you put in the environment with keys — colour scheme,
locale, dismiss actions, your own `EnvironmentKey`s. Every key has a default value.

`@EnvironmentObject` reads an `ObservableObject` injected with `.environmentObject(_:)` by type. It
has no default, so a missing object **crashes at runtime**, often only on a screen you didn't test.

With `@Observable`, inject the object with `.environment(model)` and read it with
`@Environment(Model.self)`.
{{< /qa >}}

{{< qa q="How do you use a UIKit view inside SwiftUI?" level="Mid" >}}
Wrap it in a `UIViewRepresentable` (or `UIViewControllerRepresentable`):

- `makeUIView(context:)` creates the view once.
- `updateUIView(_:context:)` pushes new SwiftUI state into it on every update — keep it idempotent.
- A `Coordinator` (from `makeCoordinator()`) acts as the delegate or target and sends changes back
  through bindings.

```swift
struct SearchField: UIViewRepresentable {
    @Binding var text: String

    func makeUIView(context: Context) -> UISearchBar {
        let bar = UISearchBar()
        bar.delegate = context.coordinator
        return bar
    }
    func updateUIView(_ bar: UISearchBar, context: Context) { bar.text = text }
    func makeCoordinator() -> Coordinator { Coordinator(text: $text) }

    final class Coordinator: NSObject, UISearchBarDelegate {
        var text: Binding<String>
        init(text: Binding<String>) { self.text = text }
        func searchBar(_ bar: UISearchBar, textDidChange new: String) { text.wrappedValue = new }
    }
}
```
{{< /qa >}}

{{< qa q="How does `NavigationStack` support programmatic navigation?" level="Mid" >}}
`NavigationStack(path:)` binds the stack to a collection of values. Pushing is appending a value;
popping to root is emptying the path. `navigationDestination(for:)` maps each value type to the
screen it shows.

```swift
@State private var path: [Recipe] = []

NavigationStack(path: $path) {
    RecipeList(onSelect: { path.append($0) })
        .navigationDestination(for: Recipe.self) { RecipeDetail(recipe: $0) }
}
// Deep link: path = [dessert, cake]; back to root: path.removeAll()
```

Because the path is plain data, it can be restored, deep-linked and tested without the UI.
{{< /qa >}}

---

## Further reading

- [Swift Concurrency in 11 Questions]({{< relref "swift-concurrency-questions.md" >}})
- [Understanding Opaque Types in Swift and SwiftUI]({{< relref "swift-opaque-type.md" >}})
- [The Observer Design Pattern in Swift]({{< relref "observer-design-pattern.md" >}})
