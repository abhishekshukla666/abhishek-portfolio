---
title: "Binary Search: 13 Problems and the Pattern Behind Each"
date: 2026-11-24T12:00:00+05:30
draft: false
tags: ["DSA", "Binary Search"]
categories: ["Binary Search"]
description: "Searching sorted data, lower bounds, rotated arrays, and binary search on the answer."
keyPoints:
  - "\"Sorted\" + \"find\" + \"O(log n)\" → binary search. Ask: what is my window, and what does each comparison let me throw away?"
  - "\"First position where condition becomes true\" → lower-bound template: while lo < hi, keep mid when it might be the answer."
  - "An oracle that says \"too high / too low\" over a numeric range → binary search the range, no array needed."
  - "\"Largest / smallest value such that a condition holds\" with a monotonic condition → binary search on the answer, keep the last valid mid."
  - "A 2-D structure that is sorted when read row by row → map index k to (k / n, k % n) and binary search once."
  - "\"Minimum rate / capacity / size such that the job fits a limit\" → binary search on the answer + a greedy canDo(x) check."
  - "\"Split an ordered list into ≤ D consecutive groups, minimise the biggest group\" → binary search the limit, greedy-pack to test it."
  - "\"Rotated sorted array\" → one side of mid is always sorted. Compare mid with an end to learn which side holds the drop."
  - "Search in a rotated array → identify the sorted half, range-check target there, discard the other half otherwise."
  - "Rotated search with duplicates → #33 logic + \"if the ends equal mid, shrink by one\". Always state the O(n) worst case."
  - "\"Latest value at or before time t\" with appends in time order → append-only sorted list + upper bound − 1. Same idea as snapshot/versioned stores."
  - "\"Minimise the maximum\" (or maximise the minimum) over contiguous groups → binary search the threshold, greedy check."
  - "\"Median / k-th element across two sorted arrays in log time\" → binary search a cut in the smaller array; the other cut is forced."
toc: false
---

Searching sorted data, lower bounds, rotated arrays, and binary search on the answer. Each problem below is listed with its optimal approach, then the pattern that should make you reach for it.

| # | Problem | Level | Optimal approach | Time | Space |
|---|---|---|---|---|---|
| 704 | Binary Search | Easy | Iterative binary search | O(log n) | O(1) |
| 35 | Search Insert Position | Easy | Lower-bound binary search | O(log n) | O(1) |
| 374 | Guess Number Higher or Lower | Easy | Binary search the answer range | O(log n) | O(1) |
| 69 | Sqrt(x) | Easy | Newton's method (integer) | O(log x), ~5 steps in practice | O(1) |
| 74 | Search a 2D Matrix | Medium | One binary search over a virtual flat array | O(log(m·n)) | O(1) |
| 875 | Koko Eating Bananas | Medium | Binary search the smallest valid speed | O(n log max) | O(1) |
| 1011 | Capacity To Ship Packages Within D Days | Medium | Binary search capacity in [max, sum] | O(n log sum) | O(1) |
| 153 | Find Minimum in Rotated Sorted Array | Medium | Binary search: compare mid with hi | O(log n) | O(1) |
| 33 | Search in Rotated Sorted Array | Medium | One pass: decide using the sorted half | O(log n), one pass | O(1) |
| 81 | Search in Rotated Sorted Array II | Medium | Sorted-half search, shrink when ambiguous | O(log n) avg · O(n) worst | O(1) |
| 981 | Time Based Key-Value Store | Medium | Per-key history + binary search set O(1) · get O(log k) Space O(N) | — | — |
| 410 | Split Array Largest Sum | Hard | Binary search the largest sum | O(n log sum) | O(1) |
| 4 | Median of Two Sorted Arrays | Hard | Binary search the partition of the smaller array | O(log min(m, n)) | O(1) |

## The patterns

### 704. Binary Search

**Pattern:** "Sorted" + "find" + "O(log n)" → binary search. Ask: what is my window, and what does each comparison let me throw away?

**Edge cases:** Empty array (hi = −1, loop never runs) · single element · target smaller than all / bigger than all.

**Related:** #35 Search Insert Position · #374 Guess Number · #278 First Bad Version

### 35. Search Insert Position

**Pattern:** "First position where condition becomes true" → lower-bound template: while lo < hi, keep mid when it might be the answer.

**Edge cases:** Target smaller than all → 0 · larger than all → n · empty array → 0.

**Related:** #34 First and Last Position · #278 First Bad Version · #744 Smallest Letter Greater Than Target

### 374. Guess Number Higher or Lower

**Pattern:** An oracle that says "too high / too low" over a numeric range → binary search the range, no array needed.

**Edge cases:** n = 1 · pick = 1 or pick = n · n = 2³¹ − 1 (overflow- safe mid).

**Related:** #278 First Bad Version · #69 Sqrt(x) · #875 Koko Eating Bananas

### 69. Sqrt(x)

**Pattern:** "Largest / smallest value such that a condition holds" with a monotonic condition → binary search on the answer, keep the last valid mid.

**Edge cases:** x = 0 and x = 1 · perfect squares · x = 2³¹ − 1 (use 64-bit multiply).

**Related:** #367 Valid Perfect Square · #50 Pow(x, n) · #875 Koko Eating Bananas

### 74. Search a 2D Matrix

**Pattern:** A 2-D structure that is sorted when read row by row → map index k to (k / n, k % n) and binary search once.

**Edge cases:** Empty matrix or empty rows · single row / single column · target outside [first, last].

**Related:** #240 Search a 2D Matrix II · #378 Kth Smallest in Sorted Matrix · #704 Binary Search

### 875. Koko Eating Bananas

**Pattern:** "Minimum rate / capacity / size such that the job fits a limit" → binary search on the answer + a greedy canDo(x) check.

**Edge cases:** h == number of piles → answer is max(piles) · huge piles (10⁹) → ceil via (p + k − 1) / k · single pile.

**Related:** #1011 Capacity to Ship Packages · #410 Split Array Largest Sum · #1482 Min Days to Make Bouquets

### 1011. Capacity To Ship Packages Within D Days

**Pattern:** "Split an ordered list into ≤ D consecutive groups, minimise the biggest group" → binary search the limit, greedy-pack to test it.

**Edge cases:** days = 1 → sum · days = n → max · one very heavy package dominates the lower bound.

**Related:** #410 Split Array Largest Sum (same problem, different story) · #875 Koko · #1482 Min Days for Bouquets

### 153. Find Minimum in Rotated Sorted Array

**Pattern:** "Rotated sorted array" → one side of mid is always sorted. Compare mid with an end to learn which side holds the drop.

**Edge cases:** Not rotated · rotated by n − 1 (min at the end) · single element · two elements.

**Related:** #33 Search in Rotated Sorted Array · #154 Find Min II (duplicates) · #81 Search in Rotated II

### 33. Search in Rotated Sorted Array

**Pattern:** Search in a rotated array → identify the sorted half, range-check target there, discard the other half otherwise.

**Edge cases:** nums[lo] <= nums[mid] needs ≤ for lo == mid · not rotated · single element · target is the pivot.

**Related:** #81 Search in Rotated II (duplicates) · #153 Find Minimum · #162 Find Peak Element

### 81. Search in Rotated Sorted Array II

**Pattern:** Rotated search with duplicates → #33 logic + "if the ends equal mid, shrink by one". Always state the O(n) worst case.

**Edge cases:** All elements equal · duplicates straddling the pivot [1,0,1,1,1] · single element.

**Related:** #33 Search in Rotated Sorted Array · #154 Find Minimum II · #153 Find Minimum

### 981. Time Based Key-Value Store

**Pattern:** "Latest value at or before time t" with appends in time order → append-only sorted list + upper bound − 1. Same idea as snapshot/versioned stores.

**Edge cases:** Unknown key · query earlier than first set · query equal to a stored timestamp (≤, not <).

**Related:** #1146 Snapshot Array · #2034 Stock Price Fluctuation · #35 Search Insert Position

### 410. Split Array Largest Sum

**Pattern:** "Minimise the maximum" (or maximise the minimum) over contiguous groups → binary search the threshold, greedy check.

**Edge cases:** k = 1 → sum · k = n → max · zeros in the array · one huge element.

**Related:** #1011 Capacity to Ship Packages · #875 Koko · #1231 Divide Chocolate (maximise the minimum)

### 4. Median of Two Sorted Arrays

**Pattern:** "Median / k-th element across two sorted arrays in log time" → binary search a cut in the smaller array; the other cut is forced.

**Edge cases:** One array empty · all of A smaller than B (i = m) · even total · duplicates across arrays.

**Related:** #88 Merge Sorted Array · #295 Find Median from Data Stream · #719 K-th Smallest Pair Distance
