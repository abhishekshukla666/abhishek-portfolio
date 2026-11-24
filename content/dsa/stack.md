---
title: "Stack: 15 Problems and the Pattern Behind Each"
date: 2026-11-24T12:00:00+05:30
draft: false
tags: ["DSA", "Stack"]
categories: ["Stack"]
description: "Matching pairs, undo, and monotonic stacks for the nearest greater or smaller element."
keyPoints:
  - "Operations that refer to \"the last one / last two\" and can undo → stack."
  - "\"Nested / matching pairs, last opened = first closed\" → stack."
  - "\"Implement X using Y\" → decide which operation pays for the reordering, and say the trade-off out loud."
  - "\"Amortized O(1)\" → do expensive work lazily and make sure each item pays for it only once."
  - "\"Stack with O(1) query of an aggregate\" → store the aggregate alongside each level (min, max, gcd…), since popping restores the previous level exactly."
  - "\"Evaluate postfix / combine the two most recent values\" → operand stack. Pop order matters for − and ÷."
  - "\"Generate all valid X\" → backtracking that only takes legal moves, so you never build an invalid candidate."
  - "\"A new item may cancel the most recent ones, possibly several in a row\" → stack + while loop against the top."
  - "\"Next greater / warmer / taller element\" → monotonic decreasing stack of indices; the new item answers everything smaller on top."
  - "\"How far back until something bigger?\" in a stream → monotonic stack where each entry carries the count it absorbed."
  - "\"Things moving in one lane, can't overtake\" → sort by position, convert to arrival times, merge into whatever is directly ahead."
  - "\"Go in / go back / ignore\" over a sequence of tokens → stack as current state: push on enter, pop on back."
  - "Nested brackets where the inside must be finished before the outside → save context on open, combine on close (stack or recursion)."
  - "\"Most frequent, ties broken by recency\" with counts that only move by ±1 → bucket by count, each bucket a stack. Same idea as LFU Cache."
  - "\"For each element, how far can it extend while it stays the minimum?\" → nearest smaller to the left and right → monotonic increasing stack."
toc: false
---

Matching pairs, undo, and monotonic stacks for the nearest greater or smaller element. Each problem below is listed with its optimal approach, then the pattern that should make you reach for it.

| # | Problem | Level | Optimal approach | Time | Space |
|---|---|---|---|---|---|
| 682 | Baseball Game | Easy | Stack + running total | O(n), one pass | O(n) |
| 20 | Valid Parentheses | Easy | Push the expected closer | O(n) | O(n) |
| 225 | Implement Stack using Queues | Easy | One queue, rotate after push push O(n) · pop / top O(1) Space O(n), one queue | — | — |
| 232 | Implement Queue using Stacks | Easy | Inbox + outbox, pour only when empty O(1) amortized per op Space O(n) | — | — |
| 155 | Min Stack | Medium | Separate min-stack, only for new minimums All ops O(1) Space n + (number of new mins) | — | — |
| 150 | Evaluate Reverse Polish Notation | Medium | Single pass with an operand stack | O(n) | O(n) |
| 22 | Generate Parentheses | Medium | Backtracking with open / close counts | O(4ⁿ/√n) | O(n) + output |
| 735 | Asteroid Collision | Medium | Stack of survivors | O(n) | O(n) |
| 739 | Daily Temperatures | Medium | Walk backwards, jump with known answers | O(n) | O(1) extra |
| 901 | Online Stock Span | Medium | Monotonic stack of (price, span) O(1) amortized per call Space O(n) | — | — |
| 853 | Car Fleet | Medium | Sort + one "slowest ahead" variable | O(n log n) | O(1) extra (+ sort) |
| 71 | Simplify Path | Medium | Stack of folder names | O(n) | O(n) |
| 394 | Decode String | Medium | Two explicit stacks: counts + saved strings | O(L) | O(L) |
| 895 | Maximum Frequency Stack | Hard | One stack per frequency level push/pop O(1) Space O(n) | — | — |
| 84 | Largest Rectangle in Histogram | Hard | One pass with a height-0 sentinel | O(n) | O(n) |

## The patterns

### 682. Baseball Game

**Pattern:** Operations that refer to "the last one / last two" and can undo → stack.

**Edge cases:** Negative scores ("-2") · everything cancelled → 0 · "+" right after a "C" uses the scores below.

**Related:** #150 Evaluate Reverse Polish Notation · #1047 Remove All Adjacent Duplicates · #71 Simplify Path

### 20. Valid Parentheses

**Pattern:** "Nested / matching pairs, last opened = first closed" → stack.

**Edge cases:** Starts with a closer → pop on empty returns nil → false · leftover openers "((" → false · odd length.

**Related:** #22 Generate Parentheses · #921 Minimum Add to Make Parentheses Valid · #32 Longest Valid Parentheses

### 225. Implement Stack using Queues

**Pattern:** "Implement X using Y" → decide which operation pays for the reordering, and say the trade-off out loud.

**Edge cases:** pop / top on empty (guaranteed not to happen here) · single element (zero rotations).

**Related:** #232 Implement Queue using Stacks · #622 Design Circular Queue · #641 Design Circular Deque

### 232. Implement Queue using Stacks

**Pattern:** "Amortized O(1)" → do expensive work lazily and make sure each item pays for it only once.

**Edge cases:** Interleaved push / pop (never pour while outbox has items, or order breaks) · peek doesn't remove · empty checks both stacks.

**Related:** #225 Implement Stack using Queues · #155 Min Stack · #933 Number of Recent Calls

### 155. Min Stack

**Pattern:** "Stack with O(1) query of an aggregate" → store the aggregate alongside each level (min, max, gcd…), since popping restores the previous level exactly.

**Edge cases:** Duplicate minimums (use ≤) · negative values · many pops in a row.

**Related:** #716 Max Stack · #895 Maximum Frequency Stack · #239 Sliding Window Maximum

### 150. Evaluate Reverse Polish Notation

**Pattern:** "Evaluate postfix / combine the two most recent values" → operand stack. Pop order matters for − and ÷.

**Edge cases:** Negative numbers like "-11" are operands, not operators (compare whole tokens) · truncation of negatives: −7 / 2 = −3 · single token.

**Related:** #224 Basic Calculator · #227 Basic Calculator II · #682 Baseball Game

### 22. Generate Parentheses

**Pattern:** "Generate all valid X" → backtracking that only takes legal moves, so you never build an invalid candidate.

**Edge cases:** n = 1 → ["()"] · output grows like 4ⁿ/n^1.5, so time is dominated by writing answers.

**Related:** #20 Valid Parentheses · #301 Remove Invalid Parentheses · #17 Letter Combinations of a Phone Number

### 735. Asteroid Collision

**Pattern:** "A new item may cancel the most recent ones, possibly several in a row" → stack + while loop against the top.

**Edge cases:** ← then → never collide (−2, 1) · equal sizes destroy both · one left-mover clearing the whole stack.

**Related:** #1047 Remove All Adjacent Duplicates · #2390 Removing Stars From a String · #853 Car Fleet

### 739. Daily Temperatures

**Pattern:** "Next greater / warmer / taller element" → monotonic decreasing stack of indices; the new item answers everything smaller on top.

**Edge cases:** Equal temperatures are not warmer (use < / ≤ carefully) · strictly decreasing input → all 0 · single day.

**Related:** #496 Next Greater Element I · #503 Next Greater Element II (circular) · #901 Online Stock Span

### 901. Online Stock Span

**Pattern:** "How far back until something bigger?" in a stream → monotonic stack where each entry carries the count it absorbed.

**Edge cases:** Equal prices are included (≤) · strictly rising prices → spans 1, 2, 3, … · strictly falling → all 1.

**Related:** #739 Daily Temperatures · #84 Largest Rectangle in Histogram · #1475 Final Prices With a Special Discount

### 853. Car Fleet

**Pattern:** "Things moving in one lane, can't overtake" → sort by position, convert to arrival times, merge into whatever is directly ahead.

**Edge cases:** Single car → 1 · equal arrival times merge · faster car starting ahead never merges with a slower one behind.

**Related:** #1776 Car Fleet II (collision times) · #735 Asteroid Collision · #739 Daily Temperatures

### 71. Simplify Path

**Pattern:** "Go in / go back / ignore" over a sequence of tokens → stack as current state: push on enter, pop on back.

**Edge cases:** "/" → "/" · "/../" → "/" · "/..." → "/..." (a real name) · "//a//" → "/a".

**Related:** #844 Backspace String Compare · #1598 Crawler Log Folder · #394 Decode String

### 394. Decode String

**Pattern:** Nested brackets where the inside must be finished before the outside → save context on open, combine on close (stack or recursion).

**Edge cases:** Multi-digit counts 10[a] · letters after a bracket 2[a]bc · no brackets at all · deep nesting.

**Related:** #224 Basic Calculator · #726 Number of Atoms · #20 Valid Parentheses

### 895. Maximum Frequency Stack

**Pattern:** "Most frequent, ties broken by recency" with counts that only move by ±1 → bucket by count, each bucket a stack. Same idea as LFU Cache.

**Edge cases:** All values distinct → behaves like a normal stack · one value pushed many times · maxFreq must drop only when its group empties.

**Related:** #460 LFU Cache · #155 Min Stack · #347 Top K Frequent Elements

### 84. Largest Rectangle in Histogram

**Pattern:** "For each element, how far can it extend while it stays the minimum?" → nearest smaller to the left and right → monotonic increasing stack.

**Edge cases:** Single bar · all equal heights (one wide rectangle) · strictly increasing (everything popped by the sentinel) · zeros.

**Related:** #85 Maximal Rectangle (run this per row) · #42 Trapping Rain Water · #907 Sum of Subarray Minimums
