# 🎓 JS DAILY PRACTICE – DAY-224

📅 **Goal:** Binary Search (Data Structures & Algorithms)
🎯 **Focus:** Classic Binary Search • Search Variants • Rotated Array • Binary Search on Answer • 2D Search

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🔍 Classic Binary Search

⚠️ **Function Name:** `binarySearch()`

| Input      | `sortedArray` (array of numbers), `target` (number) |
| :--------- | :-------------------------------------------------- |
| **Output** | object                                              |

**Rules:**

`sortedArray` — non-empty array of numbers sorted in **ascending order**
`target` — number to search for

**Binary Search Rules:**

- Use iterative binary search (not recursive)
- Track `comparisons` — how many times you compared `mid` value to `target`
- `left = 0`, `right = sortedArray.length - 1`
- Each iteration: `mid = Math.floor((left + right) / 2)`
  - If `arr[mid] === target` → found
  - If `arr[mid] < target` → search right half (`left = mid + 1`)
  - If `arr[mid] > target` → search left half (`right = mid - 1`)
- If not found → `{ found: false, target, comparisons }`

| Challenge 📢 | Return `{ found: true, target, index, comparisons }` or `{ found: false, target, comparisons }`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `binarySearch([1, 3, 5, 7, 9, 11, 13, 15, 17, 19], 7)` →

  **Manual Verify:**
  - left=0, right=9 → mid=4 → arr[4]=9 > 7 → right=3, comparisons=1
  - left=0, right=3 → mid=1 → arr[1]=3 < 7 → left=2, comparisons=2
  - left=2, right=3 → mid=2 → arr[2]=5 < 7 → left=3, comparisons=3
  - left=3, right=3 → mid=3 → arr[3]=7 === 7 → FOUND, comparisons=4

  `{ found: true, target: 7, index: 3, comparisons: 4 }`

- `binarySearch([1, 3, 5, 7, 9], 4)` →

  `{ found: false, target: 4, comparisons: 3 }`

---

## 🧩 PROBLEM–02: 🎯 Binary Search Variants

⚠️ **Function Name:** `binarySearchVariant()`

| Input      | `sortedArray` (array of numbers), `target` (number), `variant` (string) |
| :--------- | :---------------------------------------------------------------------- |
| **Output** | object                                                                  |

**Rules:**

`sortedArray` — non-empty sorted ascending array of numbers (may contain duplicates)
`target` — number to search for
`variant` must be one of: `"FIRST_OCCURRENCE"`, `"LAST_OCCURRENCE"`, `"COUNT_OCCURRENCES"`

**Variant Definitions:**

- **`"FIRST_OCCURRENCE"`** — find the index of the FIRST occurrence of `target`
  - If found → `{ found: true, target, firstIndex, comparisons }`
  - When `arr[mid] === target` → record it but continue searching LEFT (`right = mid - 1`) to find earlier occurrence
  - If not found → `{ found: false, target, comparisons }`

- **`"LAST_OCCURRENCE"`** — find the index of the LAST occurrence of `target`
  - When `arr[mid] === target` → record it but continue searching RIGHT (`left = mid + 1`)
  - If found → `{ found: true, target, lastIndex, comparisons }`
  - If not found → `{ found: false, target, comparisons }`

- **`"COUNT_OCCURRENCES"`** — count how many times `target` appears
  - Use FIRST_OCCURRENCE + LAST_OCCURRENCE results
  - `count = lastIndex - firstIndex + 1` (or 0 if not found)
  - Returns `{ target, count, firstIndex: null if not found, lastIndex: null if not found }`

| Challenge 📢 | Return the appropriate result based on `variant`. If invalid → return `"Invalid Input"` |
| :----------- | :-------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `binarySearchVariant([1, 2, 2, 2, 3, 4, 5], 2, "FIRST_OCCURRENCE")` →

  **Manual Verify:**
  - mid=3 → arr[3]=2 === 2 → record index=3, search left (right=2)
  - mid=1 → arr[1]=2 === 2 → record index=1, search left (right=0)
  - mid=0 → arr[0]=1 < 2 → left=1
  - left > right → stop, firstIndex=1

  `{ found: true, target: 2, firstIndex: 1, comparisons: 3 }`

- `binarySearchVariant([1, 2, 2, 2, 3, 4, 5], 2, "LAST_OCCURRENCE")` →

  `{ found: true, target: 2, lastIndex: 3, comparisons: 3 }`

- `binarySearchVariant([1, 2, 2, 2, 3, 4, 5], 2, "COUNT_OCCURRENCES")` →

  `{ target: 2, count: 3, firstIndex: 1, lastIndex: 3 }`

- `binarySearchVariant([1, 2, 2, 2, 3, 4, 5], 9, "COUNT_OCCURRENCES")` →

  `{ target: 9, count: 0, firstIndex: null, lastIndex: null }`

---

## 🧩 PROBLEM–03: 🌀 Binary Search on Rotated Array

⚠️ **Function Name:** `searchRotatedArray()`

| Input      | `rotatedArray` (array of numbers), `target` (number) |
| :--------- | :--------------------------------------------------- |
| **Output** | object                                               |

**Rules:**

`rotatedArray` — non-empty array of **distinct** integers, originally sorted ascending but rotated at some pivot
e.g. `[4, 5, 6, 7, 0, 1, 2]` is `[0,1,2,4,5,6,7]` rotated at index 3

`target` — number to search for

**Rotated Binary Search Rules:**

- Use modified binary search — O(log n), no linear scan allowed
- At each step, determine which half is SORTED:
  - If `arr[left] <= arr[mid]` → LEFT half is sorted
    - If `target >= arr[left] && target < arr[mid]` → search left
    - Else → search right
  - Else → RIGHT half is sorted
    - If `target > arr[mid] && target <= arr[right]` → search right
    - Else → search left
- Track `comparisons`

| Challenge 📢 | Return `{ found: true, target, index, comparisons }` or `{ found: false, target, comparisons }`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `searchRotatedArray([4, 5, 6, 7, 0, 1, 2], 0)` →

  **Manual Verify:**
  - left=0, right=6, mid=3 → arr[3]=7
  - arr[0]=4 ≤ arr[3]=7 → left half [4,5,6,7] is sorted
  - target=0 not in [4,7] → search right: left=4, comparisons=1
  - left=4, right=6, mid=5 → arr[5]=1
  - arr[4]=0 ≤ arr[5]=1 → left half [0,1] is sorted
  - target=0 in [0,1) → search left: right=4, comparisons=2
  - left=4, right=4, mid=4 → arr[4]=0 === 0 → FOUND, comparisons=3

  `{ found: true, target: 0, index: 4, comparisons: 3 }`

- `searchRotatedArray([4, 5, 6, 7, 0, 1, 2], 3)` →

  `{ found: false, target: 3, comparisons: 3 }`

---

## 🧩 PROBLEM–04: 📐 Binary Search on Answer

⚠️ **Function Name:** `binarySearchOnAnswer()`

| Input      | `problemType` (string), `params` (object) |
| :--------- | :---------------------------------------- |
| **Output** | object                                    |

**Rules:**

`problemType` must be one of: `"SQRT"`, `"MIN_DAYS"`, `"PEAK_ELEMENT"`

---

**`"SQRT"`** — find integer square root of `params.n` (largest integer k where k² ≤ n)

- `params`: `{ n: number, ≥ 0 }`
- Binary search range: `left=0, right=n`
- Each step: `mid = Math.floor((left+right)/2)`, check `mid*mid <= n`
- Returns `{ n, sqrtFloor: k, comparisons }`

**Sample Input & Output:**

- `binarySearchOnAnswer("SQRT", { n: 25 })` → `{ n: 25, sqrtFloor: 5, comparisons: 5 }`
- `binarySearchOnAnswer("SQRT", { n: 37 })` → `{ n: 37, sqrtFloor: 6, comparisons: 6 }`

---

**`"MIN_DAYS"`** — given `params.bloomDays` (array: day on which flower i blooms) and `params.k` (bouquets needed) and `params.m` (flowers per bouquet), find minimum day to make k bouquets of m consecutive flowers

- Binary search on the answer (day range: min to max of bloomDays)
- For a given `day`, count how many bouquets can be made (consecutive bloomed flowers)
- If impossible (not enough flowers) → return `{ possible: false, minDay: -1 }`
- Returns `{ possible: true, minDay, comparisons }`

**Sample Input & Output:**

- `binarySearchOnAnswer("MIN_DAYS", { bloomDays: [1, 10, 3, 10, 2], k: 3, m: 1 })` →

  **Manual Verify:**
  - Need 3 bouquets of 1 flower each → need 3 flowers to have bloomed
  - Day 3: flowers 1(day1✓), 2(day10✗), 3(day3✓), 4(day10✗), 5(day2✓) → 3 separate bloomed → 3 bouquets ✓
  - Binary search finds minDay=3

  `{ possible: true, minDay: 3, comparisons: 4 }`

---

**`"PEAK_ELEMENT"`** — find a peak element (element greater than its neighbors) in `params.nums`

- `params`: `{ nums: array of distinct integers }`
- Binary search: if `nums[mid] < nums[mid+1]` → peak is in right half, else in left half
- Returns `{ peakValue, peakIndex, comparisons }`

**Sample Input & Output:**

- `binarySearchOnAnswer("PEAK_ELEMENT", { nums: [1, 2, 3, 1] })` →

  **Manual Verify:**
  - left=0, right=3, mid=1 → nums[1]=2 < nums[2]=3 → go right
  - left=2, right=3, mid=2 → nums[2]=3 > nums[3]=1 → go left
  - left=2, right=2 → peak at index 2, value=3

  `{ peakValue: 3, peakIndex: 2, comparisons: 2 }`

---

| Challenge 📢 | Return the appropriate result based on `problemType`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------ |

---

## 🧩 PROBLEM–05: 🏗️ Binary Search Full Challenge

⚠️ **Function Name:** `runBinarySearchChallenge()`

| Input      | `challengeConfig` (object) |
| :--------- | :------------------------- |
| **Output** | object                     |

**Rules:**

`challengeConfig` object:

- `challengeId` (string, non-empty)
- `dataset` (array of numbers, non-empty, sorted ascending, may have duplicates)
- `queries` (array of objects) — each query to run on `dataset`:
  - `type` (string: `"SEARCH"`, `"FIRST"`, `"LAST"`, `"COUNT"`, `"ROTATED"`)
  - `target` (number)

**Query Definitions:**

- `"SEARCH"` → classic binary search (Problem-01 logic) on `dataset`
- `"FIRST"` → first occurrence (Problem-02 `FIRST_OCCURRENCE` logic)
- `"LAST"` → last occurrence (Problem-02 `LAST_OCCURRENCE` logic)
- `"COUNT"` → count occurrences (Problem-02 `COUNT_OCCURRENCES` logic)
- `"ROTATED"` → rotate `dataset` by moving first element to end, then search (Problem-03 logic)
  - e.g. `[1,2,3,4,5]` rotated → `[2,3,4,5,1]`

**Build query log** → for each query, record `{ type, target, result }`

**Summary:**

- `totalQueries` → count
- `totalComparisons` → sum of all comparisons across all queries
- `foundCount` → queries where `found: true` or `count > 0`

**Validation:** invalid `challengeConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ challengeId, queryLog, summary: { totalQueries, totalComparisons, foundCount } }`. |
| :----------- | :------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runBinarySearchChallenge({
  challengeId: "BS-01",
  dataset: [1, 2, 2, 3, 3, 3, 4, 5],
  queries: [
    { type: "SEARCH", target: 3 },
    { type: "FIRST", target: 3 },
    { type: "LAST", target: 3 },
    { type: "COUNT", target: 3 },
    { type: "COUNT", target: 9 }
  ]
})` →

  **Manual Verify:**
  - SEARCH 3: finds index 3 or 4 or 5 (any valid index) → found: true
  - FIRST 3: firstIndex=3
  - LAST 3: lastIndex=5
  - COUNT 3: count=3 (indices 3,4,5)
  - COUNT 9: count=0
  - foundCount: 4 (SEARCH✓, FIRST✓, LAST✓, COUNT 3 ✓, COUNT 9 ✗)

  `{
  challengeId: "BS-01",
  queryLog: [
    { type: "SEARCH", target: 3, result: { found: true, target: 3, index: 4, comparisons: 3 } },
    { type: "FIRST", target: 3, result: { found: true, target: 3, firstIndex: 3, comparisons: 4 } },
    { type: "LAST", target: 3, result: { found: true, target: 3, lastIndex: 5, comparisons: 4 } },
    { type: "COUNT", target: 3, result: { target: 3, count: 3, firstIndex: 3, lastIndex: 5 } },
    { type: "COUNT", target: 9, result: { target: 9, count: 0, firstIndex: null, lastIndex: null } }
  ],
  summary: {
    totalQueries: 5,
    totalComparisons: 14,
    foundCount: 4
  }
}`

---
