---
title: "System Design: {{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
draft: true
tags: ["System Design", "iOS"]
categories: ["System Design"]
ShowReadingTime: true
ShowToc: true
TocOpen: false
---

The prompt, as an interviewer would say it.

---

## 1. Clarify the requirements

### Functional
- What the system must do.

### Non-functional
- Performance, memory, offline, battery, privacy.

### Out of scope
- What you will deliberately not build.

## 2. High-level design

```text
 Component ──▶ Component ──▶ Component
```

## 3. API

```swift
// The public surface a feature team would call.
```

## 4. Deep dives

### Component one
### Component two

## 5. Trade-offs

| Decision | Chosen | Alternative | Why |
| --- | --- | --- | --- |

## 6. Follow-up questions

- Questions an interviewer is likely to push on, with short answers.

## Final thoughts
