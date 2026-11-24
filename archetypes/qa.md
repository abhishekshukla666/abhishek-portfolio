---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
draft: true
tags: ["Swift"]
categories: ["Q&A"]
ShowReadingTime: true
ShowToc: true
TocOpen: false
---

One or two sentences on what this set covers and who it is for.

**How to use this page:** read the question, answer it out loud, then open the answer.

---

## Basics

{{"{{<"}} qa q="The question, in one line" level="Junior" {{">}}"}}
The answer, in Markdown. Code blocks work:

```swift
// example
```
{{"{{<"}} /qa {{">}}"}}

## Going deeper

{{"{{<"}} qa q="A harder question" level="Senior" {{">}}"}}
The answer.
{{"{{<"}} /qa {{">}}"}}

---

## Further reading

- Link to the deep-dive posts on this topic.
