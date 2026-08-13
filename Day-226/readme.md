# 🎓 JS DAILY PRACTICE – DAY-226

📅 **Goal:** Recursion & Memoization (Data Structures & Algorithms)
🎯 **Focus:** Recursive Thinking • Base Cases • Memoization • Dynamic Programming Intro • Classic Recursive Problems

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🔢 Classic Recursion Problems

⚠️ **Function Name:** `solveClassicRecursion()`

| Input      | `problemType` (string), `params` (object) |
| :--------- | :---------------------------------------- |
| **Output** | object                                    |

**Rules:**

`problemType` must be one of: `"FACTORIAL"`, `"FIBONACCI"`, `"POWER"`

---

**`"FACTORIAL"`** — compute `n!` recursively

- `params`: `{ n: number, integer, 0–15 }`
- Base case: `factorial(0) = 1`, `factorial(1) = 1`
- Recursive case: `factorial(n) = n × factorial(n-1)`
- Track `calls` — total number of recursive function calls made
- Returns `{ n, result, calls }`

**Sample Input & Output:**

- `solveClassicRecursion("FACTORIAL", { n: 6 })` →

  **Manual Verify:**
  - factorial(6) → 6×factorial(5) → ... → 6×5×4×3×2×1 = 720
  - calls: 7 (factorial(6) + factorial(5) + ... + factorial(0))

  `{ n: 6, result: 720, calls: 7 }`

---

**`"FIBONACCI"`** — compute nth Fibonacci number recursively (WITHOUT memoization)

- `params`: `{ n: number, integer, 0–20 }`
- Base cases: `fib(0) = 0`, `fib(1) = 1`
- Recursive case: `fib(n) = fib(n-1) + fib(n-2)`
- Track `calls` — total recursive calls (shows exponential growth)
- Returns `{ n, result, calls }`

**Sample Input & Output:**

- `solveClassicRecursion("FIBONACCI", { n: 7 })` →

  **Manual Verify:**
  - fib(7) = 13
  - calls: 41 (exponential — many overlapping subproblems)

  `{ n: 7, result: 13, calls: 41 }`

---

**`"POWER"`** — compute `base^exponent` using fast recursive exponentiation

- `params`: `{ base: number, exponent: number, integer ≥ 0 }`
- Use divide-and-conquer:
  - If `exponent === 0` → return 1
  - If `exponent` is even → `power(base, exp/2)² `
  - If `exponent` is odd → `base × power(base, exp-1)`
- Track `calls`
- Returns `{ base, exponent, result, calls }`

**Sample Input & Output:**

- `solveClassicRecursion("POWER", { base: 2, exponent: 10 })` →

  **Manual Verify:**
  - 2^10 = 1024
  - Fast exponentiation: calls = 7 (log n depth)

  `{ base: 2, exponent: 10, result: 1024, calls: 7 }`

---

| Challenge 📢 | Return the appropriate result based on `problemType`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------ |

---

## 🧩 PROBLEM–02: 🧠 Memoization Engine

⚠️ **Function Name:** `solvWithMemoization()`

| Input      | `problemType` (string), `params` (object) |
| :--------- | :---------------------------------------- |
| **Output** | object                                    |

**Rules:**

`problemType` must be one of: `"FIBONACCI_MEMO"`, `"GRID_PATHS"`, `"COIN_CHANGE"`

---

**`"FIBONACCI_MEMO"`** — compute nth Fibonacci WITH memoization

- `params`: `{ n: number, integer, 0–40 }`
- Use a memo object to cache results
- Track `calls` (actual recursive calls) and `cacheHits` (times result served from cache)
- Returns `{ n, result, calls, cacheHits }`

**Sample Input & Output:**

- `solvWithMemoization("FIBONACCI_MEMO", { n: 10 })` →

  **Manual Verify:**
  - fib(10) = 55
  - With memo: calls=11 (each subproblem computed once), cacheHits=9

  `{ n: 10, result: 55, calls: 11, cacheHits: 9 }`

---

**`"GRID_PATHS"`** — count unique paths in an m×n grid from top-left to bottom-right

- `params`: `{ m: number, integer ≥ 1, n: number, integer ≥ 1 }` (m rows, n cols)
- Can only move RIGHT or DOWN
- Use memoization: `memo[m][n]` caches result for subgrid of size m×n
- Base cases: `paths(1, n) = 1`, `paths(m, 1) = 1`
- Recursive: `paths(m, n) = paths(m-1, n) + paths(m, n-1)`
- Track `calls` and `cacheHits`
- Returns `{ m, n, uniquePaths, calls, cacheHits }`

**Sample Input & Output:**

- `solvWithMemoization("GRID_PATHS", { m: 3, n: 3 })` →

  **Manual Verify:**
  - 3×3 grid → 6 unique paths
  - calls=6, cacheHits=2 (some subproblems reused)

  `{ m: 3, n: 3, uniquePaths: 6, calls: 6, cacheHits: 2 }`

---

**`"COIN_CHANGE"`** — find minimum number of coins to make `amount`

- `params`: `{ coins: array of positive integers, amount: integer ≥ 0 }`
- Use top-down recursion with memoization
- `minCoins(amount) = 1 + min(minCoins(amount - coin))` for each valid coin
- Base case: `minCoins(0) = 0`
- If impossible → return `{ amount, minCoins: -1, calls, cacheHits }`
- Track `calls` and `cacheHits`
- Returns `{ amount, coins, minCoins: count, calls, cacheHits }`

**Sample Input & Output:**

- `solvWithMemoization("COIN_CHANGE", { coins: [1, 5, 6, 9], amount: 11 })` →

  **Manual Verify:**
  - 11 = 9+1+1 (3 coins) OR 6+5 (2 coins) → minimum is 2

  `{ amount: 11, coins: [1, 5, 6, 9], minCoins: 2, calls: 12, cacheHits: 3 }`

---

| Challenge 📢 | Return the appropriate result based on `problemType`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------ |

---

## 🧩 PROBLEM–03: 🌳 Tree & Recursive Traversal

⚠️ **Function Name:** `solveTreeRecursion()`

| Input      | `tree` (object), `problemType` (string) |
| :--------- | :--------------------------------------- |
| **Output** | object                                  |

**Rules:**

`tree` — a nested object representing a binary tree node:
```javascript
{ value: number, left: treeNode or null, right: treeNode or null }
```

`problemType` must be one of: `"MAX_DEPTH"`, `"PATH_SUM"`, `"INORDER"`

---

**`"MAX_DEPTH"`** — find maximum depth (height) of the binary tree

- Depth = number of nodes along the longest path from root to leaf
- `maxDepth(null) = 0`
- `maxDepth(node) = 1 + max(maxDepth(node.left), maxDepth(node.right))`
- Track `calls`
- Returns `{ maxDepth, calls }`

**Sample Input & Output:**

- `solveTreeRecursion({ value: 3, left: { value: 9, left: null, right: null }, right: { value: 20, left: { value: 15, left: null, right: null }, right: { value: 7, left: null, right: null } } }, "MAX_DEPTH")` →

  **Manual Verify:**
  - Tree: 3 → left: 9, right: 20 → 20's children: 15, 7
  - depth(9)=1, depth(15)=1, depth(7)=1
  - depth(20)=2, depth(3)=3

  `{ maxDepth: 3, calls: 7 }`

---

**`"PATH_SUM"`** — check if there exists a root-to-leaf path that sums to `params.target`

- `params` passed as third argument: `{ target: number }`
- Recursive: subtract node value from target, check if leaf with remainder 0
- Returns `{ target, hasPathSum: boolean, calls }`

**Sample Input & Output:**

- `solveTreeRecursion({ value: 5, left: { value: 4, left: { value: 11, left: { value: 7, left: null, right: null }, right: { value: 2, left: null, right: null } }, right: null }, right: { value: 8, left: { value: 13, left: null, right: null }, right: { value: 4, left: null, right: { value: 1, left: null, right: null } } } }, "PATH_SUM", { target: 22 })` →

  **Manual Verify:**
  - Path 5→4→11→2 = 22 ✓

  `{ target: 22, hasPathSum: true, calls: 11 }`

---

**`"INORDER"`** — return inorder traversal (left → root → right) of the tree

- Recursive inorder traversal
- Track `calls`
- Returns `{ traversal: array of values in inorder, calls }`

**Sample Input & Output:**

- `solveTreeRecursion({ value: 4, left: { value: 2, left: { value: 1, left: null, right: null }, right: { value: 3, left: null, right: null } }, right: { value: 6, left: { value: 5, left: null, right: null }, right: { value: 7, left: null, right: null } } }, "INORDER")` →

  `{ traversal: [1, 2, 3, 4, 5, 6, 7], calls: 7 }`

---

| Challenge 📢 | `solveTreeRecursion(tree, problemType, params?)` — `params` optional for PATH_SUM. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------------------------------ |

---

## 🧩 PROBLEM–04: 🧩 Backtracking Problems

⚠️ **Function Name:** `solveWithBacktracking()`

| Input      | `problemType` (string), `params` (object) |
| :--------- | :---------------------------------------- |
| **Output** | object                                    |

**Rules:**

`problemType` must be one of: `"SUBSETS"`, `"PERMUTATIONS"`, `"COMBINATION_SUM"`

---

**`"SUBSETS"`** — generate ALL subsets of a given array

- `params`: `{ nums: array of distinct integers }`
- Use recursive backtracking: at each step include or exclude current element
- Returns `{ nums, subsets: array of arrays, totalSubsets, calls }`
- Total subsets = 2^n (including empty set)

**Sample Input & Output:**

- `solveWithBacktracking("SUBSETS", { nums: [1, 2, 3] })` →

  `{
  nums: [1, 2, 3],
  subsets: [[], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]],
  totalSubsets: 8,
  calls: 16
}`

---

**`"PERMUTATIONS"`** — generate ALL permutations of a given array

- `params`: `{ nums: array of distinct integers }`
- Use recursive backtracking with swap technique
- Returns `{ nums, permutations: array of arrays, totalPermutations, calls }`
- Total permutations = n!

**Sample Input & Output:**

- `solveWithBacktracking("PERMUTATIONS", { nums: [1, 2, 3] })` →

  `{
  nums: [1, 2, 3],
  permutations: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,2,1],[3,1,2]],
  totalPermutations: 6,
  calls: 16
}`

---

**`"COMBINATION_SUM"`** — find all combinations of `candidates` that sum to `target`

- `params`: `{ candidates: array of positive distinct integers, target: integer > 0 }`
- Same number can be used multiple times
- Use backtracking: try each candidate, subtract from remaining target
- Sort candidates first for cleaner output
- Returns `{ candidates, target, combinations: array of arrays, totalCombinations, calls }`

**Sample Input & Output:**

- `solveWithBacktracking("COMBINATION_SUM", { candidates: [2, 3, 6, 7], target: 7 })` →

  **Manual Verify:**
  - [2,2,3] = 7 ✓
  - [7] = 7 ✓

  `{
  candidates: [2, 3, 6, 7],
  target: 7,
  combinations: [[2, 2, 3], [7]],
  totalCombinations: 2,
  calls: 18
}`

---

| Challenge 📢 | Return the appropriate result based on `problemType`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------ |

---

## 🧩 PROBLEM–05: 🏗️ Recursion & Memoization Full Challenge

⚠️ **Function Name:** `runRecursionChallenge()`

| Input      | `challengeConfig` (object) |
| :--------- | :------------------------- |
| **Output** | object                     |

**Rules:**

`challengeConfig` object:

- `challengeId` (string, non-empty)
- `problems` (array of objects) — each problem to solve:
  - `type` (string: `"FACTORIAL"`, `"FIBONACCI"`, `"FIBONACCI_MEMO"`, `"COIN_CHANGE"`, `"SUBSETS"`, `"COMBINATION_SUM"`)
  - `params` (object) — problem-specific parameters

**Orchestration Rules (compose all previous concepts):**

1. Solve each problem in `problems` array using the appropriate logic
2. For `"FIBONACCI"` vs `"FIBONACCI_MEMO"` — run BOTH on same `n` if both requested, and include a **comparison** showing call count difference
3. Build `problemLog` → array of `{ type, params, result }` for each problem
4. Build `summary`:
   - `totalProblems` → count
   - `memoizationSavings` → if both FIBONACCI and FIBONACCI_MEMO present with same n: `{ n, naiveCalls, memoCalls, callsReduced: naiveCalls - memoCalls }`
   - `totalRecursiveCalls` → sum of all `calls` across all problems

**Validation:** invalid `challengeConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ challengeId, problemLog, summary }`. |
| :----------- | :--------------------------------------------- |

**Sample Input & Output:**

- `runRecursionChallenge({
  challengeId: "REC-01",
  problems: [
    { type: "FACTORIAL", params: { n: 5 } },
    { type: "FIBONACCI", params: { n: 8 } },
    { type: "FIBONACCI_MEMO", params: { n: 8 } },
    { type: "COIN_CHANGE", params: { coins: [1, 5, 6, 9], amount: 11 } },
    { type: "SUBSETS", params: { nums: [1, 2] } }
  ]
})` →

  **Manual Verify:**
  - FACTORIAL(5): 5!=120, calls=6
  - FIBONACCI(8): fib(8)=21, calls=109 (naive exponential)
  - FIBONACCI_MEMO(8): fib(8)=21, calls=9, cacheHits=7
  - COIN_CHANGE(11): minCoins=2
  - SUBSETS([1,2]): [[], [1], [1,2], [2]] → 4 subsets
  - memoizationSavings: { n:8, naiveCalls:109, memoCalls:9, callsReduced:100 }
  - totalRecursiveCalls: 6+109+9+12+8 = 144

  `{
  challengeId: "REC-01",
  problemLog: [
    { type: "FACTORIAL", params: { n: 5 }, result: { n: 5, result: 120, calls: 6 } },
    { type: "FIBONACCI", params: { n: 8 }, result: { n: 8, result: 21, calls: 109 } },
    { type: "FIBONACCI_MEMO", params: { n: 8 }, result: { n: 8, result: 21, calls: 9, cacheHits: 7 } },
    { type: "COIN_CHANGE", params: { coins: [1,5,6,9], amount: 11 }, result: { amount: 11, coins: [1,5,6,9], minCoins: 2, calls: 12, cacheHits: 3 } },
    { type: "SUBSETS", params: { nums: [1,2] }, result: { nums: [1,2], subsets: [[],[1],[1,2],[2]], totalSubsets: 4, calls: 8 } }
  ],
  summary: {
    totalProblems: 5,
    memoizationSavings: { n: 8, naiveCalls: 109, memoCalls: 9, callsReduced: 100 },
    totalRecursiveCalls: 144
  }
}`

---