# 🎓 JS DAILY PRACTICE – DAY-225

📅 **Goal:** Sorting Algorithms (Data Structures & Algorithms)
🎯 **Focus:** Bubble Sort • Selection Sort • Insertion Sort • Merge Sort • Quick Sort • Sorting Applications

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🫧 Bubble Sort & Selection Sort

⚠️ **Function Name:** `runBasicSorts()`

| Input      | `numbers` (array of numbers), `algorithm` (string) |
| :--------- | :------------------------------------------------- |
| **Output** | object                                             |

**Rules:**

`numbers` — non-empty array of numbers
`algorithm` must be one of: `"BUBBLE"`, `"SELECTION"`

**Algorithm Definitions:**

- **`"BUBBLE"`** — repeatedly compare adjacent elements and swap if out of order
  - Outer loop: i from 0 to n-1
  - Inner loop: j from 0 to n-i-2
  - If `arr[j] > arr[j+1]` → swap
  - Track `swaps` — total number of swaps performed
  - Track `passes` — number of outer loop iterations actually needed (stop early if no swap in a pass)

- **`"SELECTION"`** — find minimum element and place it at the beginning each pass
  - Outer loop: i from 0 to n-2
  - Find index of minimum in remaining unsorted portion `arr[i..n-1]`
  - Swap `arr[i]` with `arr[minIndex]` (only if `minIndex !== i`)
  - Track `swaps` — total number of swaps performed
  - Track `comparisons` — total number of comparisons made

| Challenge 📢 | Return `{ algorithm, original, sorted, swaps, passes or comparisons }`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------------------ |

**Sample Input & Output:**

- `runBasicSorts([64, 34, 25, 12, 22, 11, 90], "BUBBLE")` →

  **Manual Verify:**
  - Pass 1: multiple swaps, largest (90) bubbles to end
  - Pass 2: second largest settles
  - ... continues until sorted
  - sorted: [11, 12, 22, 25, 34, 64, 90]

  `{
  algorithm: "BUBBLE",
  original: [64, 34, 25, 12, 22, 11, 90],
  sorted: [11, 12, 22, 25, 34, 64, 90],
  swaps: 14,
  passes: 6
}`

- `runBasicSorts([64, 34, 25, 12, 22, 11, 90], "SELECTION")` →

  `{
  algorithm: "SELECTION",
  original: [64, 34, 25, 12, 22, 11, 90],
  sorted: [11, 12, 22, 25, 34, 64, 90],
  swaps: 5,
  comparisons: 21
}`

---

## 🧩 PROBLEM–02: 🃏 Insertion Sort

⚠️ **Function Name:** `insertionSort()`

| Input      | `items` (array), `comparatorKey` (string or null) |
| :--------- | :------------------------------------------------ |
| **Output** | object                                            |

**Rules:**

`items` — non-empty array of numbers OR objects
`comparatorKey` — if `null`, sort numbers in ascending order; if string, sort objects by that key ascending

**Insertion Sort Rules:**

- Start from index 1
- For each element, compare with previous elements and shift them right until correct position found
- Insert element in correct position
- Track `shifts` — total number of shift operations (each time an element moves right by one)
- Track `passes` — number of outer iterations (always `n - 1` for insertion sort)
- Do NOT mutate original array — work on a copy

| Challenge 📢 | Return `{ original, sorted, shifts, passes }`. If invalid → return `"Invalid Input"` |
| :----------- | :----------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `insertionSort([12, 11, 13, 5, 6], null)` →

  **Manual Verify:**
  - i=1: key=11, shift 12 right → [12,12,13,5,6] → insert 11 → [11,12,13,5,6], shifts=1
  - i=2: key=13, no shift → shifts=0
  - i=3: key=5, shift 13,12,11 → shifts=3, insert → [5,11,12,13,6]
  - i=4: key=6, shift 13,12,11 → shifts=3, insert → [5,6,11,12,13]
  - total shifts=7, passes=4

  `{
  original: [12, 11, 13, 5, 6],
  sorted: [5, 6, 11, 12, 13],
  shifts: 7,
  passes: 4
}`

- `insertionSort([
  { name: "Karim", score: 70 },
  { name: "Rahim", score: 90 },
  { name: "Nadia", score: 55 }
], "score")` →

  `{
  original: [{ name: "Karim", score: 70 }, { name: "Rahim", score: 90 }, { name: "Nadia", score: 55 }],
  sorted: [{ name: "Nadia", score: 55 }, { name: "Karim", score: 70 }, { name: "Rahim", score: 90 }],
  shifts: 2,
  passes: 2
}`

---

## 🧩 PROBLEM–03: ⚔️ Merge Sort

⚠️ **Function Name:** `mergeSort()`

| Input      | `numbers` (array of numbers) |
| :--------- | :--------------------------- |
| **Output** | object                       |

**Rules:**

`numbers` — non-empty array of numbers

**Merge Sort Rules:**

- Use classic recursive divide-and-conquer
- **Divide:** split array into two halves
- **Conquer:** recursively sort each half
- **Merge:** merge two sorted halves into one sorted array
- Track `mergeOperations` — how many times the `merge` step was called
- Track `comparisons` — total comparisons made during all merge steps
- Do NOT mutate original array

**Merge Step:**

- Use two pointers (i for left half, j for right half)
- Compare `left[i]` and `right[j]`, push smaller to result
- Each comparison increments `comparisons`
- After one half exhausted, append remaining elements (no comparison needed)

| Challenge 📢 | Return `{ original, sorted, mergeOperations, comparisons }`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `mergeSort([38, 27, 43, 3, 9, 82, 10])` →

  **Manual Verify:**
  - Split → [38,27,43,3] and [9,82,10]
  - Split → [38,27] and [43,3] | [9,82] and [10]
  - Split → [38],[27] | [43],[3] | [9],[82] | [10]
  - Merge pairs → [27,38],[3,43],[9,82],[10]
  - Merge → [3,27,38,43],[9,10,82]
  - Merge → [3,9,10,27,38,43,82]
  - mergeOperations: 6 (merge called for each non-trivial merge)
  - comparisons: counted during all merge steps

  `{
  original: [38, 27, 43, 3, 9, 82, 10],
  sorted: [3, 9, 10, 27, 38, 43, 82],
  mergeOperations: 6,
  comparisons: 11
}`

---

## 🧩 PROBLEM–04: ⚡ Quick Sort

⚠️ **Function Name:** `quickSort()`

| Input      | `numbers` (array of numbers), `pivotStrategy` (string) |
| :--------- | :----------------------------------------------------- |
| **Output** | object                                                 |

**Rules:**

`numbers` — non-empty array of numbers
`pivotStrategy` must be one of: `"FIRST"`, `"LAST"`, `"MIDDLE"`

**Quick Sort Rules:**

- Use recursive quick sort with in-place partitioning (Lomuto partition scheme)
- **Pivot selection** based on `pivotStrategy`:
  - `"FIRST"` → pivot = first element of current subarray
  - `"LAST"` → pivot = last element of current subarray
  - `"MIDDLE"` → pivot = middle element (`Math.floor((low + high) / 2)`)
- **Lomuto Partition:**
  - Place pivot at the end (swap with last if not already there)
  - i = low - 1
  - For j from low to high-1: if `arr[j] <= pivot` → i++, swap arr[i] and arr[j]
  - Swap arr[i+1] and arr[high] → pivot at correct position
  - Return pivot index
- Track `comparisons` — total comparisons in partition steps
- Track `swaps` — total swaps performed
- Do NOT mutate original — work on a copy

| Challenge 📢 | Return `{ pivotStrategy, original, sorted, comparisons, swaps }`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------------ |

**Sample Input & Output:**

- `quickSort([10, 7, 8, 9, 1, 5], "LAST")` →

  **Manual Verify:**
  - pivot=5 (last), partition → [1,5,8,9,10,7] after some swaps
  - recursively sort left [1] and right [8,9,10,7]
  - continue until sorted: [1,5,7,8,9,10]

  `{
  pivotStrategy: "LAST",
  original: [10, 7, 8, 9, 1, 5],
  sorted: [1, 5, 7, 8, 9, 10],
  comparisons: 11,
  swaps: 5
}`

- `quickSort([10, 7, 8, 9, 1, 5], "MIDDLE")` →

  `{
  pivotStrategy: "MIDDLE",
  original: [10, 7, 8, 9, 1, 5],
  sorted: [1, 5, 7, 8, 9, 10],
  comparisons: 9,
  swaps: 7
}`

---

## 🧩 PROBLEM–05: 🏗️ Sorting Full Challenge

⚠️ **Function Name:** `runningSortChallenge()`

| Input      | `challengeConfig` (object) |
| :--------- | :------------------------- |
| **Output** | object                     |

**Rules:**

`challengeConfig` object:

- `challengeId` (string, non-empty)
- `dataset` (array of numbers, non-empty)
- `algorithms` (array of strings) — subset of: `"BUBBLE"`, `"SELECTION"`, `"INSERTION"`, `"MERGE"`, `"QUICK"`
- `quickPivot` (string: `"FIRST"`, `"LAST"`, `"MIDDLE"`) — used only if `"QUICK"` is in algorithms

**Orchestration Rules (compose all previous concepts):**

1. Run each algorithm in `algorithms` on the SAME `dataset`
2. Each algorithm produces its sorted result + metrics
3. Verify all algorithms produce the same sorted output
4. Build a **comparison report** across algorithms:
   - For each algorithm: `{ algorithm, swaps or mergeOperations, comparisons or passes, timeComplexity }`
   - `timeComplexity` (hardcoded based on algorithm):
     - BUBBLE, SELECTION, INSERTION → `"O(n²)"`
     - MERGE → `"O(n log n)"`
     - QUICK → `"O(n log n) avg"`
5. Find `mostEfficientAlgorithm` — algorithm with fewest `comparisons` (use `swaps` as tiebreaker)

**Validation:** invalid `challengeConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ challengeId, dataset, sortedResult, allMatch, comparisonReport, mostEfficientAlgorithm }`. |
| :----------- | :--------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runningSortChallenge({
  challengeId: "SORT-01",
  dataset: [64, 34, 25, 12, 22, 11, 90],
  algorithms: ["BUBBLE", "MERGE", "QUICK"],
  quickPivot: "LAST"
})` →

  **Manual Verify:**
  - All three sort [64,34,25,12,22,11,90] → [11,12,22,25,34,64,90]
  - allMatch: true (all produce same output)
  - BUBBLE: O(n²), swaps=14, passes=6
  - MERGE: O(n log n), mergeOperations=6, comparisons=11
  - QUICK: O(n log n) avg, comparisons=11, swaps=5
  - mostEfficient: QUICK (fewest swaps among tied comparisons)

  `{
  challengeId: "SORT-01",
  dataset: [64, 34, 25, 12, 22, 11, 90],
  sortedResult: [11, 12, 22, 25, 34, 64, 90],
  allMatch: true,
  comparisonReport: [
    { algorithm: "BUBBLE", swaps: 14, passes: 6, timeComplexity: "O(n²)" },
    { algorithm: "MERGE", mergeOperations: 6, comparisons: 11, timeComplexity: "O(n log n)" },
    { algorithm: "QUICK", comparisons: 11, swaps: 5, timeComplexity: "O(n log n) avg" }
  ],
  mostEfficientAlgorithm: "QUICK"
}`

---
