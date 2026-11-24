---
title: "Two Pointers: 13 Problems and the Pattern Behind Each"
date: 2026-11-24T12:00:00+05:30
draft: false
tags: ["DSA", "Two Pointers"]
categories: ["Two Pointers"]
description: "Opposite ends, fast and slow, and read/write pointers: O(n²) scans folded into one pass."
keyPoints:
  - "\"Reverse / mirror / compare ends\" → l at start, r at end, move inward. The base move for most two-pointer problems."
  - "\"Palindrome, ignoring some characters\" → opposite-end pointers that skip the ignored ones instead of filtering first."
  - "\"Palindrome with k allowed fixes\" → at the first mismatch, branch into the two ways to fix it. k = 1 keeps it linear."
  - "\"Walk two sequences side by side\" → one pointer per sequence, each moving at its own pace; handle the leftover tail."
  - "\"Merge in place, empty space at the end\" → write from the back so you never overwrite unread data."
  - "\"Sorted\" + \"remove duplicates in place\" → compare with the last kept value, not the previous raw value."
  - "\"Sorted array + pair with a target sum\" → l at the smallest, r at the largest, move based on whether the sum is too small or too big."
  - "\"Unique k-tuples summing to X\" → sort, fix k − 2 values, two-pointer the last two, skip equal neighbours to avoid duplicates."
  - "k-Sum → sort, add one fixed loop per extra number, two-pointer the last pair: O(n^(k−1)). Can be written once as a recursive kSum."
  - "\"Rotate / shift in place\" → reverse whole, then reverse parts. Same trick reverses the words in a sentence."
  - "\"Best pair where the smaller side limits the result\" → start widest, move the limiting pointer."
  - "\"Pair items under a capacity, at most 2 per group, minimise groups\" → sort, pair heaviest with lightest."
  - "\"Value at i depends on the best to its left and right\" → prefix/suffix arrays, then squeeze to two pointers when only the smaller side matters."
toc: false
---

Opposite ends, fast and slow, and read/write pointers: O(n²) scans folded into one pass. Each problem below is listed with its optimal approach, then the pattern that should make you reach for it.

| # | Problem | Level | Optimal approach | Time | Space |
|---|---|---|---|---|---|
| 344 | Reverse String | Easy | Two pointers from both ends | O(n) | O(1) |
| 125 | Valid Palindrome | Easy | Two pointers on the raw string, skip junk | O(n) | O(1) |
| 680 | Valid Palindrome II | Easy | Check the leftovers by index only | O(n) | O(n)* |
| 1768 | Merge Strings Alternately | Easy | Two iterators, no copies | O(m+n) | O(1) extra |
| 88 | Merge Sorted Array | Easy | Three pointers, fill from the back | O(m+n) | O(1) |
| 26 | Remove Duplicates from Sorted Array | Easy | Write pointer compares with last kept | O(n) | O(1) |
| 167 | Two Sum II – Input Array Is Sorted | Medium | Two pointers from both ends | O(n) | O(1) |
| 15 | 3Sum | Medium | Sort, fix one, two pointers, skip repeats | O(n²) | O(1) extra |
| 18 | 4Sum | Medium | Sort, fix two, two pointers, skip repeats | O(n³) | O(1) extra |
| 189 | Rotate Array | Medium | Three reversals | O(n) | O(1) |
| 11 | Container With Most Water | Medium | Two pointers, always move the shorter wall | O(n) | O(1) |
| 881 | Boats to Save People | Medium | Count weights, two pointers over buckets | O(n + L) | O(L) |
| 42 | Trapping Rain Water | Hard | Two pointers with running maxima | O(n) | O(1) |

## The patterns

### 344. Reverse String

**Pattern:** "Reverse / mirror / compare ends" → l at start, r at end, move inward. The base move for most two-pointer problems.

**Edge cases:** n = 1 (loop never runs) · even vs odd length · already a palindrome.

**Related:** #125 Valid Palindrome · #541 Reverse String II · #151 Reverse Words in a String

### 125. Valid Palindrome

**Pattern:** "Palindrome, ignoring some characters" → opposite-end pointers that skip the ignored ones instead of filtering first.

**Edge cases:** Only punctuation ",." → true · digits count ("0P" → false) · mixed case.

**Related:** #680 Valid Palindrome II · #234 Palindrome Linked List · #5 Longest Palindromic Substring

### 680. Valid Palindrome II

**Pattern:** "Palindrome with k allowed fixes" → at the first mismatch, branch into the two ways to fix it. k = 1 keeps it linear.

**Edge cases:** Must try both skips: "cbbcc" fails if you only skip the left char (skipping the right one works) · length 1 or 2 → always true.

**Related:** #125 Valid Palindrome · #1216 Valid Palindrome III (k deletions, DP) · #2108 First Palindromic String

### 1768. Merge Strings Alternately

**Pattern:** "Walk two sequences side by side" → one pointer per sequence, each moving at its own pace; handle the leftover tail.

**Edge cases:** Equal lengths · one word much longer · a single-letter word.

**Related:** #88 Merge Sorted Array · #21 Merge Two Sorted Lists · #1679 Max Number of K-Sum Pairs

### 88. Merge Sorted Array

**Pattern:** "Merge in place, empty space at the end" → write from the back so you never overwrite unread data.

**Edge cases:** n = 0 (nothing to do) · m = 0 (copy nums2) · all of nums2 smaller than nums1 · duplicates across arrays.

**Related:** #21 Merge Two Sorted Lists · #977 Squares of a Sorted Array · #1768 Merge Strings Alternately

### 26. Remove Duplicates from Sorted Array

**Pattern:** "Sorted" + "remove duplicates in place" → compare with the last kept value, not the previous raw value.

**Edge cases:** Single element → 1 · all equal → 1 · all distinct → n (every write is a self-copy).

**Related:** #80 Remove Duplicates II (allow 2: compare with nums[k − 2]) · #27 Remove Element · #283 Move Zeroes

### 167. Two Sum II – Input Array Is Sorted

**Pattern:** "Sorted array + pair with a target sum" → l at the smallest, r at the largest, move based on whether the sum is too small or too big.

**Edge cases:** Negative numbers · duplicates like [3, 3] · answer uses the first and last element · remember the +1 for 1-indexing.

**Related:** #1 Two Sum (unsorted → hash map) · #15 3Sum · #18 4Sum · #1099 Two Sum Less Than K

### 15. 3Sum

**Pattern:** "Unique k-tuples summing to X" → sort, fix k − 2 values, two-pointer the last two, skip equal neighbours to avoid duplicates.

**Edge cases:** All zeros [0, 0, 0, 0] → [[0, 0, 0]] once · no answer · all positive (break at once) · many duplicates.

**Related:** #167 Two Sum II · #18 4Sum · #16 3Sum Closest · #259 3Sum Smaller

### 18. 4Sum

**Pattern:** k-Sum → sort, add one fixed loop per extra number, two-pointer the last pair: O(n^(k−1)). Can be written once as a recursive kSum.

**Edge cases:** n < 4 → [] · large values (overflow in 32-bit languages) · all equal [2, 2, 2, 2, 2] with target 8 → one result.

**Related:** #15 3Sum · #454 4Sum II (four arrays, hash map of pair sums) · #167 Two Sum II

### 189. Rotate Array

**Pattern:** "Rotate / shift in place" → reverse whole, then reverse parts. Same trick reverses the words in a sentence.

**Edge cases:** k == 0 or k a multiple of n → unchanged · k > n (always take k % n) · n = 1.

**Related:** #151 Reverse Words in a String · #61 Rotate List · #48 Rotate Image

### 11. Container With Most Water

**Pattern:** "Best pair where the smaller side limits the result" → start widest, move the limiting pointer.

**Edge cases:** n = 2 · equal heights (move either) · tallest walls in the middle · zeros.

**Related:** #42 Trapping Rain Water · #167 Two Sum II · #84 Largest Rectangle in Histogram

### 881. Boats to Save People

**Pattern:** "Pair items under a capacity, at most 2 per group, minimise groups" → sort, pair heaviest with lightest.

**Edge cases:** Everyone exactly at limit → n boats · all tiny → ⌈n/2⌉ boats · l == r means one person left (still needs a boat).

**Related:** #1877 Minimize Maximum Pair Sum · #2491 Divide Players Into Teams · #455 Assign Cookies

### 42. Trapping Rain Water

**Pattern:** "Value at i depends on the best to its left and right" → prefix/suffix arrays, then squeeze to two pointers when only the smaller side matters.

**Edge cases:** n < 3 → 0 · strictly increasing or decreasing → 0 · flat bars → 0 · deep single valley.

**Related:** #11 Container With Most Water · #407 Trapping Rain Water II (heap) · #238 Product Except Self (same left/right idea)
