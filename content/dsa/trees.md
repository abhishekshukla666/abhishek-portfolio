---
title: "Trees: 21 Problems and the Pattern Behind Each"
date: 2026-11-24T12:00:00+05:30
draft: false
tags: ["DSA", "Trees"]
categories: ["Trees"]
description: "Traversals, depth and paths, BST properties, and building and serialising trees."
keyPoints:
  - "BST + \"sorted order\", \"k-th smallest\", \"validate\" → inorder. The stack template here powers many BST problems."
  - "\"Process parent before children\" (copy, serialise, pass info down) → preorder."
  - "\"A node needs results from both children\" (height, diameter, path sums, balanced) → postorder, usually as a recursive function that returns a value."
  - "\"Do the same local change at every node\" → any traversal works; pick recursion for brevity, BFS for depth safety."
  - "\"Height / depth\" → return a value from each child, combine at the parent. This helper reappears in Diameter and Balanced Tree."
  - "\"Longest / best path anywhere in the tree\" → DFS returns the best downward branch and updates a global answer with left + right."
  - "\"Check a property at every node that depends on subtree sizes / heights\" → bottom-up DFS that returns a value and a failure signal."
  - "\"Compare two trees\" → walk both in lockstep; handle (nil, nil), (x, y), (one nil) explicitly."
  - "\"Does tree B appear inside tree A\" → serialise with nil markers; tree matching becomes sequence matching."
  - "BST + \"where do two values diverge\" → walk down while both are on the same side."
  - "BST search / insert → one path from root to a leaf: compare, go left or right, O(h)."
  - "Modify a BST → recursive function returns the new subtree root; parent reattaches it (node.left = f(node.left))."
  - "\"Per level\", \"by depth\", \"zigzag\", \"right side\", \"averages per level\" → BFS with a level array."
  - "\"First / last node at each depth\" → DFS that records when depth == result.count, with child order chosen to put the wanted node first."
  - "\"Depends on the path from the root\" → pass a summary (max, sum, bounds) down as a parameter instead of the whole path."
  - "\"Every node must satisfy a range set by its ancestors\" → pass (low, high) down and narrow it at each step."
  - "BST + \"k-th smallest / largest\", \"next in order\" → iterative inorder (reverse inorder for largest) and stop early."
  - "\"Rebuild a tree from two traversals\" → one traversal gives the root, inorder gives the split; use a value → index map."
  - "\"Choose nodes with a parent/child constraint\" → tree DP: each node returns the best answer for each of its states."
  - "\"Best path anywhere\" with weights → DFS returns one branch, records both branches in a global best; clamp negatives with max(0, …)."
  - "\"Encode a structure so it can be rebuilt\" → traversal + explicit null markers; reading back follows the same traversal."
toc: false
---

Traversals, depth and paths, BST properties, and building and serialising trees. Each problem below is listed with its optimal approach, then the pattern that should make you reach for it.

| # | Problem | Level | Optimal approach | Time | Space |
|---|---|---|---|---|---|
| 94 | Binary Tree Inorder Traversal | Easy | Morris traversal (temporary threads) | O(n) | O(1) |
| 144 | Binary Tree Preorder Traversal | Easy | Morris preorder | O(n) | O(1) |
| 145 | Binary Tree Postorder Traversal | Easy | One stack + "last visited" pointer | O(n) | O(h) |
| 226 | Invert Binary Tree | Easy | Recursive swap in place | O(n) | O(h) |
| 104 | Maximum Depth of Binary Tree | Easy | Recursion: 1 + max(left, right) | O(n) | O(h) |
| 543 | Diameter of Binary Tree | Easy | One DFS: return height, update best | O(n) | O(h) |
| 110 | Balanced Binary Tree | Easy | Bottom-up height, −1 means "unbalanced" | O(n) | O(h) |
| 100 | Same Tree | Easy | Recursive parallel walk | O(n) | O(h) |
| 572 | Subtree of Another Tree | Easy | Preorder tokens with nil markers + KMP | O(m + n) | O(m + n) |
| 235 | Lowest Common Ancestor of a BST | Medium | Iterative walk down | O(h) | O(1) |
| 701 | Insert into a Binary Search Tree | Medium | Iterative descent | O(h) | O(1) |
| 450 | Delete Node in a BST | Medium | Recursive delete with successor | O(h) | O(h) |
| 102 | Binary Tree Level Order Traversal | Medium | BFS, one level at a time | O(n) | O(w) |
| 199 | Binary Tree Right Side View | Medium | DFS visiting right child first | O(n) | O(h) |
| 1448 | Count Good Nodes in Binary Tree | Medium | DFS passing the max down | O(n) | O(h) |
| 98 | Validate Binary Search Tree | Medium | DFS with (low, high) bounds | O(n) | O(h) |
| 230 | Kth Smallest Element in a BST | Medium | Iterative inorder that stops at k | O(h + k) | O(h) |
| 105 | Construct Binary Tree from Preorder and Inorder Traversal | Medium | Hash map of inorder positions | O(n) | O(n) |
| 337 | House Robber III | Medium | Return (with, without) from each node | O(n) | O(h) |
| 124 | Binary Tree Maximum Path Sum | Hard | One DFS: return gain, update best | O(n) | O(h) |
| 297 | Serialize and Deserialize Binary Tree | Hard | Preorder DFS with # markers | O(n) | O(n) |

## The patterns

### 94. Binary Tree Inorder Traversal

**Pattern:** BST + "sorted order", "k-th smallest", "validate" → inorder. The stack template here powers many BST problems.

**Edge cases:** Empty tree → [] · skewed tree (h = n) · Morris must remove every thread it adds.

**Related:** #144 Preorder · #145 Postorder · #230 Kth Smallest in a BST

### 144. Binary Tree Preorder Traversal

**Pattern:** "Process parent before children" (copy, serialise, pass info down) → preorder.

**Edge cases:** Empty tree · only left children · only right children.

**Related:** #94 Inorder · #297 Serialize and Deserialize · #105 Construct from Preorder and Inorder

### 145. Binary Tree Postorder Traversal

**Pattern:** "A node needs results from both children" (height, diameter, path sums, balanced) → postorder, usually as a recursive function that returns a value.

**Edge cases:** Empty tree · single node · use !== (identity), since values can repeat.

**Related:** #94 Inorder · #543 Diameter · #124 Maximum Path Sum

### 226. Invert Binary Tree

**Pattern:** "Do the same local change at every node" → any traversal works; pick recursion for brevity, BFS for depth safety.

**Edge cases:** Empty tree · single node · skewed tree (recursion depth = n).

**Related:** #101 Symmetric Tree · #100 Same Tree · #951 Flip Equivalent Binary Trees

### 104. Maximum Depth of Binary Tree

**Pattern:** "Height / depth" → return a value from each child, combine at the parent. This helper reappears in Diameter and Balanced Tree.

**Edge cases:** Empty tree → 0 · skewed tree (depth n) · single node → 1.

**Related:** #111 Minimum Depth · #543 Diameter · #110 Balanced Binary Tree

### 543. Diameter of Binary Tree

**Pattern:** "Longest / best path anywhere in the tree" → DFS returns the best downward branch and updates a global answer with left + right.

**Edge cases:** Count edges, not nodes · single node → 0 · longest path entirely inside one subtree.

**Related:** #124 Maximum Path Sum · #687 Longest Univalue Path · #104 Maximum Depth

### 110. Balanced Binary Tree

**Pattern:** "Check a property at every node that depends on subtree sizes / heights" → bottom-up DFS that returns a value and a failure signal.

**Edge cases:** Empty tree → true · balanced at root but not below · long single chain.

**Related:** #104 Maximum Depth · #543 Diameter · #1382 Balance a BST

### 100. Same Tree

**Pattern:** "Compare two trees" → walk both in lockstep; handle (nil, nil), (x, y), (one nil) explicitly.

**Edge cases:** Both empty → true · same values, different shape · one empty.

**Related:** #572 Subtree of Another Tree · #101 Symmetric Tree · #951 Flip Equivalent Trees

### 572. Subtree of Another Tree

**Pattern:** "Does tree B appear inside tree A" → serialise with nil markers; tree matching becomes sequence matching.

**Edge cases:** subRoot matches only a top part (must fail) · duplicate values in root · single-node subRoot.

**Related:** #100 Same Tree · #652 Find Duplicate Subtrees · #28 Find the Index of the First Occurrence (KMP)

### 235. Lowest Common Ancestor of a BST

**Pattern:** BST + "where do two values diverge" → walk down while both are on the same side.

**Edge cases:** p is an ancestor of q (answer p) · p == q · p and q are root's two children.

**Related:** #236 LCA of a Binary Tree · #1650 LCA with Parent Pointers · #700 Search in a BST

### 701. Insert into a Binary Search Tree

**Pattern:** BST search / insert → one path from root to a leaf: compare, go left or right, O(h).

**Edge cases:** Empty tree → new root · val smaller than all (far left) · skewed BST (h = n).

**Related:** #700 Search in a BST · #450 Delete Node in a BST · #98 Validate BST

### 450. Delete Node in a BST

**Pattern:** Modify a BST → recursive function returns the new subtree root; parent reattaches it (node.left = f(node.left)).

**Edge cases:** Key not found (tree unchanged) · deleting the root · node with only one child · empty tree.

**Related:** #701 Insert into a BST · #98 Validate BST · #285 Inorder Successor in BST

### 102. Binary Tree Level Order Traversal

**Pattern:** "Per level", "by depth", "zigzag", "right side", "averages per level" → BFS with a level array.

**Edge cases:** Empty tree → [] · single node · very wide last level (memory).

**Related:** #103 Zigzag Level Order · #199 Right Side View · #637 Average of Levels

### 199. Binary Tree Right Side View

**Pattern:** "First / last node at each depth" → DFS that records when depth == result.count, with child order chosen to put the wanted node first.

**Edge cases:** Empty tree · left subtree deeper than right (left nodes become visible) · single chain.

**Related:** #102 Level Order · #513 Find Bottom Left Tree Value · #116 Populating Next Right Pointers

### 1448. Count Good Nodes in Binary Tree

**Pattern:** "Depends on the path from the root" → pass a summary (max, sum, bounds) down as a parameter instead of the whole path.

**Edge cases:** Single node → 1 · all equal values (all good) · strictly decreasing path (only root good).

**Related:** #98 Validate BST (bounds passed down) · #112 Path Sum · #1026 Max Difference Between Node and Ancestor

### 98. Validate Binary Search Tree

**Pattern:** "Every node must satisfy a range set by its ancestors" → pass (low, high) down and narrow it at each step.

**Edge cases:** Duplicates (invalid: strict) · Int32.min / Int32.max as values · deep violation like the example.

**Related:** #230 Kth Smallest in a BST · #99 Recover BST · #1448 Count Good Nodes

### 230. Kth Smallest Element in a BST

**Pattern:** BST + "k-th smallest / largest", "next in order" → iterative inorder (reverse inorder for largest) and stop early.

**Edge cases:** k = 1 (leftmost) · k = n (rightmost) · skewed BST.

**Related:** #94 Inorder Traversal · #173 BST Iterator · #98 Validate BST

### 105. Construct Binary Tree from Preorder and Inorder Traversal

**Pattern:** "Rebuild a tree from two traversals" → one traversal gives the root, inorder gives the split; use a value → index map.

**Edge cases:** Single node · skewed tree (recursion depth n) · requires unique values.

**Related:** #106 From Inorder and Postorder · #889 From Preorder and Postorder · #297 Serialize and Deserialize

### 337. House Robber III

**Pattern:** "Choose nodes with a parent/child constraint" → tree DP: each node returns the best answer for each of its states.

**Edge cases:** Empty tree → 0 · single node · best answer skips two levels in a row.

**Related:** #198 House Robber · #213 House Robber II · #968 Binary Tree Cameras

### 124. Binary Tree Maximum Path Sum

**Pattern:** "Best path anywhere" with weights → DFS returns one branch, records both branches in a global best; clamp negatives with max(0, …).

**Edge cases:** All values negative (answer = largest single node) · single node · best path doesn't include the root.

**Related:** #543 Diameter of Binary Tree · #687 Longest Univalue Path · #53 Maximum Subarray

### 297. Serialize and Deserialize Binary Tree

**Pattern:** "Encode a structure so it can be rebuilt" → traversal + explicit null markers; reading back follows the same traversal.

**Edge cases:** Empty tree → "#" · negative values (split on "," not "-") · very deep tree (recursion depth).

**Related:** #449 Serialize and Deserialize BST · #105 Construct from Preorder and Inorder · #271 Encode and Decode Strings
