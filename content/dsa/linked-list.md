---
title: "Linked List: 11 Problems and the Pattern Behind Each"
date: 2026-11-24T12:00:00+05:30
draft: false
tags: ["DSA", "Linked List"]
categories: ["Linked List"]
description: "Dummy heads, reversing in place, fast and slow pointers, and merging."
keyPoints:
  - "Any \"reverse part of a list\" → save next, flip, advance. Reused in Reorder List, Palindrome List, Reverse k-Group."
  - "Building a new list node-by-node → dummy head + tail pointer. \"Merge two sorted\" is the core of merge sort and Merge k Lists."
  - "\"Cycle\", \"loop\", \"middle of list\", \"repeated state\" → fast & slow pointers."
  - "\"Pair the front with the back\" on a singly linked list → split at middle, reverse back half. Same trick as Palindrome Linked List."
  - "\"k-th from the end\" on a singly linked list → two pointers with a fixed gap; start both at a dummy to land on the node before."
  - "Deep copy with arbitrary cross-links → map original → copy first, wire links second. Same idea as Clone Graph."
  - "\"Big number as digits\" → simulate schoolbook arithmetic with a carry; loop condition includes the carry."
  - "Values in [1, n] used as indices + \"no extra space\" → treat i → nums[i] as a linked list; duplicates become cycles."
  - "\"O(1) lookup and O(1) reorder / remove- oldest\" → hash map pointing into a doubly linked list, with sentinels."
  - "\"Combine k sorted things\" → log k rounds of pairwise merges or a size-k min-heap of current heads."
  - "\"Reverse a sub-range\" of a list → keep the node before the range and the node after it; reverse in between with prev seeded to \"after\"."
toc: false
---

Dummy heads, reversing in place, fast and slow pointers, and merging. Each problem below is listed with its optimal approach, then the pattern that should make you reach for it.

| # | Problem | Level | Optimal approach | Time | Space |
|---|---|---|---|---|---|
| 206 | Reverse Linked List | Easy | Iterative: prev, cur, next | O(n) | O(1) |
| 21 | Merge Two Sorted Lists | Easy | Iterative with a dummy head | O(m + n) | O(1) |
| 141 | Linked List Cycle | Easy | Floyd's tortoise and hare | O(n) | O(1) |
| 143 | Reorder List | Medium | Find middle, reverse second half, weave | O(n) | O(1) |
| 19 | Remove Nth Node From End of List | Medium | One pass with a fixed gap | O(n), 1 pass | O(1) |
| 138 | Copy List with Random Pointer | Medium | Interleave copies, set randoms, split | O(n) | O(1) extra |
| 2 | Add Two Numbers | Medium | Schoolbook addition on the lists | O(max(m, n)) | O(1) extra (output aside) |
| 287 | Find the Duplicate Number | Medium | Floyd: find where the cycle begins | O(n) | O(1) |
| 146 | LRU Cache | Medium | Hash map → nodes of a doubly linked list get/put O(1) Space O(capacity) | — | — |
| 23 | Merge k Sorted Lists | Hard | Pairwise merging (divide & conquer) | O(N log k) | O(1) extra |
| 25 | Reverse Nodes in k-Group | Hard | Iterative block reversal with a dummy | O(n) | O(1) |

## The patterns

### 206. Reverse Linked List

**Pattern:** Any "reverse part of a list" → save next, flip, advance. Reused in Reorder List, Palindrome List, Reverse k-Group.

**Edge cases:** Empty list · single node · very long list (recursion can overflow the stack).

**Related:** #92 Reverse Linked List II · #25 Reverse Nodes in k-Group · #234 Palindrome Linked List

### 21. Merge Two Sorted Lists

**Pattern:** Building a new list node-by-node → dummy head + tail pointer. "Merge two sorted" is the core of merge sort and Merge k Lists.

**Edge cases:** One or both lists empty · equal values (≤ keeps it stable) · one list much longer.

**Related:** #23 Merge k Sorted Lists · #88 Merge Sorted Array · #148 Sort List

### 141. Linked List Cycle

**Pattern:** "Cycle", "loop", "middle of list", "repeated state" → fast & slow pointers.

**Edge cases:** Empty list · single node pointing to itself · cycle back to head.

**Related:** #142 Linked List Cycle II (find entry) · #287 Find the Duplicate Number · #202 Happy Number

### 143. Reorder List

**Pattern:** "Pair the front with the back" on a singly linked list → split at middle, reverse back half. Same trick as Palindrome Linked List.

**Edge cases:** 0, 1 or 2 nodes (nothing changes) · even vs odd length · forgetting slow.next = nil creates a cycle.

**Related:** #234 Palindrome Linked List · #876 Middle of the Linked List · #206 Reverse Linked List

### 19. Remove Nth Node From End of List

**Pattern:** "k-th from the end" on a singly linked list → two pointers with a fixed gap; start both at a dummy to land on the node before.

**Edge cases:** Remove the head (n = length) · single node · n = 1 (remove tail).

**Related:** #61 Rotate List · #876 Middle of the Linked List · #1721 Swapping Nodes in a Linked List

### 138. Copy List with Random Pointer

**Pattern:** Deep copy with arbitrary cross-links → map original → copy first, wire links second. Same idea as Clone Graph.

**Edge cases:** Empty list · random points to itself · all randoms nil · must restore the original list.

**Related:** #133 Clone Graph · #1485 Clone Binary Tree with Random Pointer · #146 LRU Cache

### 2. Add Two Numbers

**Pattern:** "Big number as digits" → simulate schoolbook arithmetic with a carry; loop condition includes the carry.

**Edge cases:** Different lengths · final carry (99 + 1 = 100) · both lists are [0].

**Related:** #445 Add Two Numbers II (forward order: use stacks) · #67 Add Binary · #415 Add Strings

### 287. Find the Duplicate Number

**Pattern:** Values in [1, n] used as indices + "no extra space" → treat i → nums[i] as a linked list; duplicates become cycles.

**Edge cases:** Duplicate appears many times ([2,2,2,2,2]) · duplicate is 1 · n = 1 ([1,1]).

**Related:** #142 Linked List Cycle II · #141 Linked List Cycle · #41 First Missing Positive

### 146. LRU Cache

**Pattern:** "O(1) lookup and O(1) reorder / remove- oldest" → hash map pointing into a doubly linked list, with sentinels.

**Edge cases:** Capacity 1 · put on an existing key (update + move to front, no eviction) · get on a missing key.

**Related:** #460 LFU Cache · #895 Maximum Frequency Stack · #432 All O(1) Data Structure

### 23. Merge k Sorted Lists

**Pattern:** "Combine k sorted things" → log k rounds of pairwise merges or a size-k min-heap of current heads.

**Edge cases:** Empty input array · some lists empty (nil) · k = 1.

**Related:** #21 Merge Two Sorted Lists · #148 Sort List · #378 Kth Smallest in a Sorted Matrix

### 25. Reverse Nodes in k-Group

**Pattern:** "Reverse a sub-range" of a list → keep the node before the range and the node after it; reverse in between with prev seeded to "after".

**Edge cases:** k = 1 (no change) · k = n (whole list) · length not a multiple of k · empty list.

**Related:** #24 Swap Nodes in Pairs · #92 Reverse Linked List II · #206 Reverse Linked List
