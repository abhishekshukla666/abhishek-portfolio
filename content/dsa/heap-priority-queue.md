---
title: "Heap / Priority Queue: 10 Problems and the Pattern Behind Each"
date: 2026-11-24T12:00:00+05:30
draft: false
tags: ["DSA", "Heap / Priority Queue"]
categories: ["Heap / Priority Queue"]
description: "Top-k, k-way merges, running medians and scheduling with a heap."
keyPoints:
  - "\"k-th largest\" → min-heap of size k (and \"k-th smallest\" → max-heap of size k). The heap's top is the answer."
  - "\"Repeatedly take the largest / smallest, maybe add a new item\" → priority queue simulation."
  - "\"k smallest / closest\" → max-heap of size k (evict the worst), or quickselect when all data is in memory."
  - "\"k-th order statistic\" (k-th largest / smallest / median) → quickselect or a size-k heap."
  - "\"Same item needs a gap of n\" → greedy: most frequent first (heap + cooldown queue), often with a closed-form count."
  - "\"Top / newest k across many sorted sources\" → heap of one head per source, pop and advance that source."
  - "\"Items arrive over time; always serve the best available\" → sort by arrival + heap of the available, jump the clock when idle."
  - "\"No two equal neighbours\" → feasibility check maxFreq ≤ ⌈n/2⌉, then most frequent first (heap) or interleave on even/odd slots."
  - "\"Running median\" / \"balance two halves\" → two heaps: max-heap below, min-heap above, sizes within 1."
  - "\"Options unlock as a resource grows; pick the best unlocked one\" → sort by requirement + max-heap of value."
toc: false
---

Top-k, k-way merges, running medians and scheduling with a heap. Each problem below is listed with its optimal approach, then the pattern that should make you reach for it.

| # | Problem | Level | Optimal approach | Time | Space |
|---|---|---|---|---|---|
| 703 | Kth Largest Element in a Stream | Easy | Min-heap holding only the top k add O(log k) Space O(k) | — | — |
| 1046 | Last Stone Weight | Easy | Max-heap | O(n log n) | O(n) |
| 973 | K Closest Points to Origin | Medium | Quickselect on distances | O(n) average | O(n) copy |
| 215 | Kth Largest Element in an Array | Medium | Quickselect for index n − k | O(n) average | O(n) copy |
| 621 | Task Scheduler | Medium | Count the frames of the most frequent task | O(T) | O(1) |
| 355 | Design Twitter | Medium | Merge followees' lists with a max-heap feed O(F + 10 log F) Space O(F) per call | — | — |
| 1834 | Single-Threaded CPU | Medium | Sort by arrival, min-heap of (time, index) | O(n log n) | O(n) |
| 767 | Reorganize String | Medium | Fill even indices first, then odd | O(n) | O(n) output |
| 295 | Find Median from Data Stream | Hard | Max-heap for the low half, min-heap for the high half add O(log n) · median O(1) Space O(n) | — | — |
| 502 | IPO | Hard | Sort by capital, max-heap of unlocked profits | O(n log n + k log n) | O(n) |

## The patterns

### 703. Kth Largest Element in a Stream

**Pattern:** "k-th largest" → min-heap of size k (and "k-th smallest" → max-heap of size k). The heap's top is the answer.

**Edge cases:** Initial nums shorter than k (heap fills over time) · duplicates · negative values.

**Related:** #215 Kth Largest in an Array · #347 Top K Frequent · #295 Find Median from Data Stream

### 1046. Last Stone Weight

**Pattern:** "Repeatedly take the largest / smallest, maybe add a new item" → priority queue simulation.

**Edge cases:** Single stone · all stones cancel → 0 · all equal weights.

**Related:** #1049 Last Stone Weight II (DP) · #2558 Take Gifts from the Richest Pile · #1167 Min Cost to Connect Sticks

### 973. K Closest Points to Origin

**Pattern:** "k smallest / closest" → max-heap of size k (evict the worst), or quickselect when all data is in memory.

**Edge cases:** k = n (return all) · ties in distance (any is fine) · large coordinates (use Int, not Int32, for x²).

**Related:** #215 Kth Largest in an Array · #347 Top K Frequent · #658 Find K Closest Elements

### 215. Kth Largest Element in an Array

**Pattern:** "k-th order statistic" (k-th largest / smallest / median) → quickselect or a size-k heap.

**Edge cases:** k = 1 (max) · k = n (min) · many duplicates · negative numbers.

**Related:** #703 Kth Largest in a Stream · #973 K Closest Points · #347 Top K Frequent

### 621. Task Scheduler

**Pattern:** "Same item needs a gap of n" → greedy: most frequent first (heap + cooldown queue), often with a closed-form count.

**Edge cases:** n = 0 → tasks.count · many distinct tasks (no idle) · several tasks tied for max.

**Related:** #767 Reorganize String · #358 Rearrange String k Distance Apart · #1405 Longest Happy String

### 355. Design Twitter

**Pattern:** "Top / newest k across many sorted sources" → heap of one head per source, pop and advance that source.

**Edge cases:** Follow yourself (ignore) · unfollow someone not followed · user with no tweets · fewer than 10 tweets total.

**Related:** #23 Merge k Sorted Lists · #373 Find K Pairs with Smallest Sums · #378 Kth Smallest in a Sorted Matrix

### 1834. Single-Threaded CPU

**Pattern:** "Items arrive over time; always serve the best available" → sort by arrival + heap of the available, jump the clock when idle.

**Edge cases:** Gaps where the CPU idles · several tasks arriving at once · equal processing times (index tie-break) · large times (use Int).

**Related:** #502 IPO · #1882 Process Tasks Using Servers · #253 Meeting Rooms II

### 767. Reorganize String

**Pattern:** "No two equal neighbours" → feasibility check maxFreq ≤ ⌈n/2⌉, then most frequent first (heap) or interleave on even/odd slots.

**Edge cases:** Single character · exactly ⌈n/2⌉ copies (tight) · all letters distinct.

**Related:** #621 Task Scheduler · #1405 Longest Happy String · #358 Rearrange String k Distance Apart

### 295. Find Median from Data Stream

**Pattern:** "Running median" / "balance two halves" → two heaps: max-heap below, min-heap above, sizes within 1.

**Edge cases:** Single number · even vs odd count · negative numbers · follow-up: values in 0…100 → counting array.

**Related:** #480 Sliding Window Median · #502 IPO · #4 Median of Two Sorted Arrays

### 502. IPO

**Pattern:** "Options unlock as a resource grows; pick the best unlocked one" → sort by requirement + max-heap of value.

**Edge cases:** Nothing affordable at the start → w · k larger than n · projects with 0 capital requirement.

**Related:** #1834 Single-Threaded CPU · #630 Course Schedule III · #871 Minimum Number of Refueling Stops
