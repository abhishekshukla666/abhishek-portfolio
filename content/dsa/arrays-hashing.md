---
title: "Arrays & Hashing: 22 Problems and the Pattern Behind Each"
date: 2026-11-24T12:00:00+05:30
draft: false
tags: ["DSA", "Arrays & Hashing"]
categories: ["Arrays & Hashing"]
description: "When a Set or Dictionary turns a nested loop into one pass, and when the array's own indices are the hash."
keyPoints:
  - "Output size known in advance → allocate once with Array(repeating:count:) or reserveCapacity."
  - "\"Have I seen this before?\" → Set. Need a count or position too → Dictionary."
  - "\"Same letters, different order\" → compare frequency counts. Small fixed alphabet → array, not dictionary."
  - "\"Find two items that combine to X\" → store what you've seen, look up the complement."
  - "\"Common to all\" → start with one candidate and let each item shrink it. The answer can only get smaller."
  - "\"Group items that are equivalent\" → compute a canonical key per item, then bucket by key in a dictionary."
  - "\"Remove / keep in place, return new length\" → write pointer that trails a read pointer."
  - "\"Appears more than n/2 times\" + O(1) space → voting: pair off different values until only the majority remains."
  - "\"Design a hash X\" → hash function + buckets + collision strategy (chaining or open addressing)."
  - "Hash map = hash set + a value per entry. Know chaining vs open addressing (linear probing) for design rounds."
  - "\"Sort without built-in\" → merge sort (safe) or heap sort (O(1) space). Small integer range → counting sort."
  - "\"Partition into 3 groups in place\" → three pointers (low / mid / high). Two groups → two pointers."
  - "\"Top / most frequent k\" → heap of size k. Frequency bounded by n → bucket by frequency for O(n)."
  - "\"Serialize arbitrary data\" → never trust a delimiter; use length-prefixed framing (how HTTP Content-Length and many binary protocols work)."
  - "\"Many sum queries, data never changes\" → precompute prefix sums. Data changes too → Fenwick / segment tree."
  - "\"For each i, combine everything except i\" → left pass × right pass. Works for sums, products, max, etc."
  - "\"No repeats within several groups\" → one seen-set per group; map each cell to its groups with index math. Small value range → bitmask."
  - "\"Consecutive values, unsorted, O(n)\" → Set + only start from the beginning of a run (num − 1 absent)."
  - "\"Unlimited transactions, no cost\" → sum of positive differences. Any extra rule (fee, cooldown, k limit) → state DP."
  - "\"More than n/k times\" → at most k − 1 answers → voting with k − 1 candidates + a verify pass."
  - "\"Count subarrays with sum / property = k\" + negatives allowed → prefix sum + hash map. All positive → sliding window also works."
  - "\"Values in range 1…n\" + O(1) space → use indices as the hash: cyclic sort, or mark presence by negating nums[v − 1]."
toc: false
---

When a Set or Dictionary turns a nested loop into one pass, and when the array's own indices are the hash. Each problem below is listed with its optimal approach, then the pattern that should make you reach for it.

| # | Problem | Level | Optimal approach | Time | Space |
|---|---|---|---|---|---|
| 1929 | Concatenation of Array | Easy | Preallocate, fill in one pass | O(n) | O(1) extra |
| 217 | Contains Duplicate | Easy | Hash Set, stop at first repeat | O(n) | O(n) |
| 242 | Valid Anagram | Easy | Fixed array of 26 counts | O(n) | O(1) |
| 1 | Two Sum | Easy | One-pass hash map | O(n) | O(n) |
| 14 | Longest Common Prefix | Easy | Shrink the prefix, char by char | O(S) | O(m) |
| 49 | Group Anagrams | Medium | Letter-count array as key | O(n·k) | O(n·k) |
| 27 | Remove Element | Easy | Read pointer + write pointer | O(n) | O(1) |
| 169 | Majority Element | Easy | Boyer-Moore voting | O(n) | O(1) |
| 705 | Design HashSet | Easy | Buckets with separate chaining | O(1) avg per op | O(n + B) |
| 706 | Design HashMap | Easy | Buckets of (key, value) chains | O(1) avg per op | O(n + B) |
| 912 | Sort an Array | Medium | Counting sort | O(n + k) | O(k) |
| 75 | Sort Colors | Medium | Dutch National Flag (one pass) | O(n) | O(1) |
| 347 | Top K Frequent Elements | Medium | Bucket sort by frequency | O(n) | O(n) |
| 271 | Encode and Decode Strings | Medium | Length prefix: "len#string" | O(N) | O(N) |
| 304 | Range Sum Query 2D – Immutable | Medium | 2D prefix sums (inclusion–exclusion) Query O(1) · Build O(r·c) Space O(r·c) | — | — |
| 238 | Product of Array Except Self | Medium | Output array + running suffix | O(n) | O(1) extra |
| 36 | Valid Sudoku | Medium | One pass, bitmasks | O(81) | O(27) ints |
| 128 | Longest Consecutive Sequence | Medium | Hash Set, count only from run starts | O(n) | O(n) |
| 122 | Best Time to Buy and Sell Stock II | Medium | Greedy: collect every rise | O(n) | O(1) |
| 229 | Majority Element II | Medium | Boyer-Moore with two candidates | O(n) | O(1) |
| 560 | Subarray Sum Equals K | Medium | Prefix sum + hash map of counts | O(n) | O(n) |
| 41 | First Missing Positive | Hard | Cyclic sort: put each v at index v − 1 | O(n) | O(1) extra |

## The patterns

### 1929. Concatenation of Array

**Pattern:** Output size known in advance → allocate once with Array(repeating:count:) or reserveCapacity.

**Edge cases:** n = 1 → two copies of one value. Swift arrays are value types: nums + nums copies, never aliases.

**Related:** #1470 Shuffle the Array · #189 Rotate Array (index math with i + n)

### 217. Contains Duplicate

**Pattern:** "Have I seen this before?" → Set. Need a count or position too → Dictionary.

**Edge cases:** Single element → false. Negative numbers and zero hash fine. All values equal → stops at index 1.

**Related:** #219 Contains Duplicate II (within distance k → sliding Set) · #220 Contains Duplicate III (buckets)

### 242. Valid Anagram

**Pattern:** "Same letters, different order" → compare frequency counts. Small fixed alphabet → array, not dictionary.

**Edge cases:** Different lengths → false at once. Empty strings → true. Swift: String.count is O(n); utf8.count is O(1).

**Related:** #49 Group Anagrams · #438 Find All Anagrams in a String · #383 Ransom Note

### 1. Two Sum

**Pattern:** "Find two items that combine to X" → store what you've seen, look up the complement.

**Edge cases:** Duplicates [3, 3] · negatives · same index twice · answer at the very end.

**Related:** #167 Two Sum II (sorted) · #15 3Sum · #18 4Sum · #560 Subarray Sum Equals K

### 14. Longest Common Prefix

**Pattern:** "Common to all" → start with one candidate and let each item shrink it. The answer can only get smaller.

**Edge cases:** One word → itself. An empty word → "". Swift strings can't be indexed by Int: convert once with Array(s).

**Related:** #208 Implement Trie (prefix queries at scale) · #1858 Longest Word With All Prefixes

### 49. Group Anagrams

**Pattern:** "Group items that are equivalent" → compute a canonical key per item, then bucket by key in a dictionary.

**Edge cases:** Empty string "" is its own valid group. Single word → one group. Duplicate words stay together.

**Related:** #242 Valid Anagram · #249 Group Shifted Strings · #438 Find All Anagrams

### 27. Remove Element

**Pattern:** "Remove / keep in place, return new length" → write pointer that trails a read pointer.

**Edge cases:** Empty array → 0. Every element equals val → 0. val not present → n.

**Related:** #26 Remove Duplicates from Sorted Array · #283 Move Zeroes · #80 Remove Duplicates II

### 169. Majority Element

**Pattern:** "Appears more than n/2 times" + O(1) space → voting: pair off different values until only the majority remains.

**Edge cases:** n = 1 → that element. Negative values are fine. If no majority is guaranteed, verify the candidate.

**Related:** #229 Majority Element II (n/3, two candidates) · #1150 Check if a Number is Majority in Sorted Array

### 705. Design HashSet

**Pattern:** "Design a hash X" → hash function + buckets + collision strategy (chaining or open addressing).

**Edge cases:** Duplicate add · remove a missing key (no-op) · key 0 · key 10⁶.

**Related:** #706 Design HashMap · #146 LRU Cache · #380 Insert Delete GetRandom O(1)

### 706. Design HashMap

**Pattern:** Hash map = hash set + a value per entry. Know chaining vs open addressing (linear probing) for design rounds.

**Edge cases:** put on an existing key overwrites · get / remove on a missing key · value 0 is valid (don't use 0 as "empty").

**Related:** #705 Design HashSet · #146 LRU Cache · #981 Time Based Key-Value Store

### 912. Sort an Array

**Pattern:** "Sort without built-in" → merge sort (safe) or heap sort (O(1) space). Small integer range → counting sort.

**Edge cases:** Empty or single element · all values equal · negatives (shift by min) · already sorted (plain quicksort degrades to O(n²) here).

**Related:** #75 Sort Colors · #215 Kth Largest Element · #148 Sort List (merge sort on a linked list)

### 75. Sort Colors

**Pattern:** "Partition into 3 groups in place" → three pointers (low / mid / high). Two groups → two pointers.

**Edge cases:** All one colour · n = 1 · already sorted · reverse sorted. Never advance mid after swapping with high.

**Related:** #283 Move Zeroes · #905 Sort Array By Parity · quicksort's 3-way partition

### 347. Top K Frequent Elements

**Pattern:** "Top / most frequent k" → heap of size k. Frequency bounded by n → bucket by frequency for O(n).

**Edge cases:** k == number of distinct values → return all · single element · negative numbers.

**Related:** #692 Top K Frequent Words · #215 Kth Largest Element · #451 Sort Characters By Frequency

### 271. Encode and Decode Strings

**Pattern:** "Serialize arbitrary data" → never trust a delimiter; use length-prefixed framing (how HTTP Content-Length and many binary protocols work).

**Edge cases:** [] → "" → [] · [""] → "0#" → [""] · strings containing "#" or digits · multi-byte characters (use UTF-8 counts).

**Related:** #297 Serialize and Deserialize Binary Tree · #443 String Compression

### 304. Range Sum Query 2D – Immutable

**Pattern:** "Many sum queries, data never changes" → precompute prefix sums. Data changes too → Fenwick / segment tree.

**Edge cases:** Single-cell query (row1 == row2, col1 == col2) · query covering the whole grid · negative values (still works).

**Related:** #303 Range Sum Query (1D) · #308 Range Sum Query 2D – Mutable · #1314 Matrix Block Sum

### 238. Product of Array Except Self

**Pattern:** "For each i, combine everything except i" → left pass × right pass. Works for sums, products, max, etc.

**Edge cases:** One zero → only that index is non-zero. Two zeros → all zeros. Negatives are fine. n = 2 → [nums[1], nums[0]].

**Related:** #42 Trapping Rain Water (left max / right max) · #152 Maximum Product Subarray · #135 Candy

### 36. Valid Sudoku

**Pattern:** "No repeats within several groups" → one seen-set per group; map each cell to its groups with index math. Small value range → bitmask.

**Edge cases:** Empty board → true. Box index formula (r/3)*3 + c/3 is the classic slip: test (4, 7) → box 5.

**Related:** #37 Sudoku Solver (backtracking) · #51 N- Queens (same "used" tracking idea)

### 128. Longest Consecutive Sequence

**Pattern:** "Consecutive values, unsorted, O(n)" → Set + only start from the beginning of a run (num − 1 absent).

**Edge cases:** Empty → 0 · all duplicates [7, 7, 7] → 1 · negatives (−1, 0, 1 is a run of 3).

**Related:** #298 Binary Tree Longest Consecutive Sequence · #41 First Missing Positive · Union- Find variant of this problem

### 122. Best Time to Buy and Sell Stock II

**Pattern:** "Unlimited transactions, no cost" → sum of positive differences. Any extra rule (fee, cooldown, k limit) → state DP.

**Edge cases:** One day → 0 · prices only fall → 0 · flat prices → 0.

**Related:** #121 Stock I (one trade) · #123 Stock III (2 trades) · #309 with Cooldown · #714 with Fee

### 229. Majority Element II

**Pattern:** "More than n/k times" → at most k − 1 answers → voting with k − 1 candidates + a verify pass.

**Edge cases:** No answer, e.g. [1, 2, 3] → [] · n = 1 or 2 → every distinct value qualifies · same value fills both seats (prevented by checking c1 first).

**Related:** #169 Majority Element (k = 2) · Misra-Gries "heavy hitters" streaming algorithm

### 560. Subarray Sum Equals K

**Pattern:** "Count subarrays with sum / property = k" + negatives allowed → prefix sum + hash map. All positive → sliding window also works.

**Edge cases:** k = 0 · negative numbers · zeros (create many equal prefixes) · forget the [0: 1] seed → misses chunks starting at 0.

**Related:** #1 Two Sum · #523 Continuous Subarray Sum · #974 Subarray Sums Divisible by K · #525 Contiguous Array

### 41. First Missing Positive

**Pattern:** "Values in range 1…n" + O(1) space → use indices as the hash: cyclic sort, or mark presence by negating nums[v − 1].

**Edge cases:** All negatives → 1 · [1, 2, …, n] → n + 1 · duplicates [1, 1] → 2 · values larger than n are ignored.

**Related:** #268 Missing Number · #448 Find All Numbers Disappeared · #287 Find the Duplicate Number · #442 Find All Duplicates
