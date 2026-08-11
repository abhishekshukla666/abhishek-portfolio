---
title: "Sorting Algorithms"
date: "2026-06-24T11:20:00+05:30"
draft: false
tags: ["Sorting"]
weight: 101
ShowReadingTime: true
---

Here are the all most used sorting techniques in swift language. 

## Bubble Sort
```swift
func bubbleSort(_ nums: inout [Int]) {
    for i in 0..<nums.count {
        var isSwapped = false
        for j in 0..<nums.count - 1 - i {
            print(nums[j], nums[j + 1])
            if nums[j] > nums[j + 1] {
                nums.swapAt(j, j + 1)
                isSwapped = true
            }
        }
        if !isSwapped {
            break
        }
    }
}
```

## Selection Sort
```swift
func selectionSort(_ arr: [Int]) -> [Int] {
    var sortedArray = arr
    guard sortedArray.count > 1 else {
        return sortedArray
    }
    
    for i in 0..<sortedArray.count {
        var minIndex = i
        for j in i + 1..<sortedArray.count {
            if sortedArray[j] < sortedArray[minIndex] {
                minIndex = j
            }
        }
        sortedArray.swapAt(i, minIndex)
    }
    return sortedArray
}
```

## Insertion Sort
```swift
func sort<T: Comparable>(_ arr: inout [T], _ isOrdered: (T, T) -> Bool) {
    for i in 1..<arr.count {
        var j = i
        while j > 0 && isOrdered(arr[j], arr[j-1]) {
            arr.swapAt(j, j-1)
            j -= 1
        }
    }
}

var arr = [9,2,6,3,7,5,4,1,8]
//var arr = ["z","a","c","b","x","y"]
sort(&arr, >)
```

## Quick Sort
```swift
// Method 1
func quicksort<T: Comparable>(_ a: [T]) -> [T] {
    guard a.count > 1 else { return a }

    let pivot = a[a.count/2]
    let less = a.filter { $0 < pivot }
    let equal = a.filter { $0 == pivot }
    let greater = a.filter { $0 > pivot }

    return quicksort(less) + equal + quicksort(greater)
}

// Method 2
func quickSort<T: Comparable>(_ array: inout [T], low: Int, high: Int, isOrdered: (T, T) -> Bool) -> [T] {
    if low < high {
        let i = partition(&array, low: low, high: high, isOrdered: isOrdered)
        quickSort(&array, low: low, high: i - 1, isOrdered: isOrdered)
        quickSort(&array, low: i + 1, high: high, isOrdered: isOrdered)
    }
    return array
}

func partition<T: Comparable>(_ array: inout [T], low: Int, high: Int, isOrdered: (T, T) -> Bool) -> Int {
    
    let pivot = array[high]
    var i = low
    for j in low..<high {
        if isOrdered(array[j], pivot) {
            array.swapAt(i, j)
            i += 1
        }
    }
    array.swapAt(i, high)
    return i
}

var unSortedArray = [6, 2, 4, 5, 7, 1, 9, 8, 10, 3]

/// Method 1
quicksort(unSortedArray)

/// Method 2
quickSort(&unSortedArray, low: 0, high: unSortedArray.count - 1, isOrdered: <)
```

## Merge Sort
```swift
func sort(_ arr: [Int]) -> [Int] {
    if arr.count < 2 { return arr }
    let mid = arr.count/2
    let left = sort(Array(arr[0..<mid]))
    let right = sort(Array(arr[mid..<arr.count]))
    return helper(left, right)
}

func helper(_ left: [Int], _ right: [Int]) -> [Int] {
    var sorted = [Int]()
    var left = left
    var right = right
    var i = 0
    var j = 0
    // left = [2,3], right = [1,4]
    while i < left.count && j < right.count {
        if left[i] < right[j] {
            sorted.append(left[i])
            i += 1
        } else {
            sorted.append(right[j])
            j += 1
        }
    }
    
    
    while i < left.count {
        sorted.append(left[i])
        i += 1
    }
    
    while j < right.count {
        sorted.append(right[j])
        j += 1
    }
    return sorted
}

sort([8,7,1,6,3,5,2,4])
```

## Heap Sort
```swift
/// Sorts an array in-place using the Heap Sort algorithm.
/// - Parameter array: The array of Comparable elements to sort.
func heapSort<T: Comparable>(_ array: inout [T]) {
    let n = array.count
    guard n > 1 else { return }
    
    // Step 1: Build a Max-Heap from the array
    // Start from the last non-leaf node and sift down to the root
    for i in stride(from: (n / 2) - 1, through: 0, by: -1) {
        siftDown(&array, from: i, upTo: n)
    }
    
    // Step 2: Extract elements from the heap one by one
    for i in stride(from: n - 1, generosity: 0, through: 1, by: -1) {
        // Move current root (largest element) to the end of the unsorted segment
        array.swapAt(0, i)
        
        // Restore the Max-Heap property on the reduced heap
        siftDown(&array, from: 0, upTo: i)
    }
}

/// Helper function to maintain the Max-Heap property (Sift-Down / Heapify).
/// - Parameters:
///   - array: The array representation of the binary heap.
///   - index: The node index to start sifting down.
///   - maxCount: The current size boundary of the active heap segment.
func siftDown<T: Comparable>(_ array: inout [T], from index: Int, upTo maxCount: Int) {
    var parentIndex = index
    
    while true {
        let leftChildIndex = 2 * parentIndex + 1
        let rightChildIndex = 2 * parentIndex + 2
        var candidateIndex = parentIndex
        
        // Check if left child is larger than parent
        if leftChildIndex < maxCount && array[leftChildIndex] > array[candidateIndex] {
            candidateIndex = leftChildIndex
        }
        
        // Check if right child is larger than the largest so far
        if rightChildIndex < maxCount && array[rightChildIndex] > array[candidateIndex] {
            candidateIndex = rightChildIndex
        }
        
        // If the parent is already larger than both children, heap property is satisfied
        if candidateIndex == parentIndex {
            break
        }
        
        // Otherwise, swap and continue sifting down
        array.swapAt(parentIndex, candidateIndex)
        parentIndex = candidateIndex
    }
}

// MARK: - Example Usage
var numbers = [35, 12, 43, 8, 24, 19, 5]
print("Original Array: \(numbers)")

heapSort(&numbers)
print("Sorted Array:   \(numbers)")
// Output: [5, 8, 12, 19, 24, 35, 43]
```