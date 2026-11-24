---
title: "Sliding Window: 8 Problems and the Pattern Behind Each"
date: 2026-11-24T12:00:00+05:30
draft: false
tags: ["DSA", "Sliding Window"]
categories: ["Sliding Window"]
description: "Grow on the right, shrink on the left: fixed and variable windows over arrays and strings."
keyPoints:
  - "\"Within distance k\" → keep a fixed-size window of the last k items: add on the right, evict on the left."
  - "\"Best pair with i < j\" → for each j, keep the best value seen before j in one variable."
  - "\"Longest substring with no repeats / at most X\" → variable window: grow r, move l only when the rule breaks."
  - "\"Longest window after at most k changes\" → window is valid when length − (count of the kept item) ≤ k."
  - "\"Does some anagram / permutation of P appear in S?\" → fixed window of ∣P∣ with letter counts, updated by one in, one out."
  - "\"Shortest window with sum ≥ X, positive numbers\" → grow r, then shrink l while still valid, recording as you shrink."
  - "\"Sorted input, answer is a block of size k\" → binary search the block's start, comparing the element that leaves with the one that enters."
  - "\"Smallest window containing all of X\" → expand r until valid, then shrink l while valid; track validity with a have/required counter."
toc: false
---

Grow on the right, shrink on the left: fixed and variable windows over arrays and strings. Each problem below is listed with its optimal approach, then the pattern that should make you reach for it.

| # | Problem | Level | Optimal approach | Time | Space |
|---|---|---|---|---|---|
| 219 | Contains Duplicate II | Easy | Sliding window Set of the last k values | O(n) | O(min(n, k)) |
| 121 | Best Time to Buy and Sell Stock | Easy | Track the cheapest price so far | O(n) | O(1) |
| 3 | Longest Substring Without Repeating Characters | Medium | Sliding window, jump l past the old copy | O(n) | O(k) |
| 424 | Longest Repeating Character Replacement | Medium | Window with a never-decreasing maxFreq | O(n) | O(26) |
| 567 | Permutation in String | Medium | Track how many letters match | O(n) | O(26) |
| 209 | Minimum Size Subarray Sum | Medium | Grow right, shrink left while valid | O(n) | O(1) |
| 658 | Find K Closest Elements | Medium | Binary search the window's left edge | O(log(n − k) + k) | O(1) extra |
| 76 | Minimum Window Substring | Hard | Expand right, shrink left, count "have" | O(m + n) | O(k) |

## The patterns

### 219. Contains Duplicate II

**Pattern:** "Within distance k" → keep a fixed-size window of the last k items: add on the right, evict on the left.

**Edge cases:** k = 0 → always false · k ≥ n → same as Contains Duplicate · same value three times.

**Related:** #217 Contains Duplicate · #220 Contains Duplicate III (value gap too: buckets) · #643 Maximum Average Subarray I

### 121. Best Time to Buy and Sell Stock

**Pattern:** "Best pair with i < j" → for each j, keep the best value seen before j in one variable.

**Edge cases:** One day → 0 · prices only fall → 0 · lowest price is the last day → it can't be used as a buy.

**Related:** #122 Stock II (unlimited trades) · #123 Stock III · #53 Maximum Subarray (Kadane, same running idea)

### 3. Longest Substring Without Repeating Characters

**Pattern:** "Longest substring with no repeats / at most X" → variable window: grow r, move l only when the rule breaks.

**Edge cases:** Empty string → 0 · all same → 1 · spaces count as characters · Unicode: use a dictionary keyed by Character instead.

**Related:** #424 Character Replacement · #340 At Most K Distinct Characters · #76 Minimum Window Substring

### 424. Longest Repeating Character Replacement

**Pattern:** "Longest window after at most k changes" → window is valid when length − (count of the kept item) ≤ k.

**Edge cases:** k = 0 → longest run of one letter · k ≥ n → n · all letters the same.

**Related:** #1004 Max Consecutive Ones III · #3 Longest Substring Without Repeating · #2024 Maximize the Confusion of an Exam

### 567. Permutation in String

**Pattern:** "Does some anagram / permutation of P appear in S?" → fixed window of ∣P∣ with letter counts, updated by one in, one out.

**Edge cases:** s1 longer than s2 → false · window at the very end (hence the final return matches == 26) · repeated letters in s1.

**Related:** #438 Find All Anagrams in a String · #242 Valid Anagram · #76 Minimum Window Substring

### 209. Minimum Size Subarray Sum

**Pattern:** "Shortest window with sum ≥ X, positive numbers" → grow r, then shrink l while still valid, recording as you shrink.

**Edge cases:** Total sum < target → 0 · one element ≥ target → 1 · with negatives this breaks (use a monotonic deque, #862).

**Related:** #713 Subarray Product Less Than K · #862 Shortest Subarray with Sum at Least K · #76 Minimum Window Substring

### 658. Find K Closest Elements

**Pattern:** "Sorted input, answer is a block of size k" → binary search the block's start, comparing the element that leaves with the one that enters.

**Edge cases:** x smaller than all → first k · x larger than all → last k · k == n · duplicates of x.

**Related:** #35 Search Insert Position · #973 K Closest Points to Origin (heap) · #1004 Max Consecutive Ones III

### 76. Minimum Window Substring

**Pattern:** "Smallest window containing all of X" → expand r until valid, then shrink l while valid; track validity with a have/required counter.

**Edge cases:** t longer than s → "" · repeated letters in t ("aa") · case matters ('a' ≠ 'A') · whole s is the answer.

**Related:** #567 Permutation in String · #438 Find All Anagrams · #30 Substring with Concatenation of All Words
