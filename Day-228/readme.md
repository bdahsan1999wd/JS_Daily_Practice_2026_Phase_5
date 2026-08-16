# 🎓 JS DAILY PRACTICE – DAY-228

📅 **Goal:** Tree Traversal (Data Structures & Algorithms)
🎯 **Focus:** Binary Tree Traversals • BFS • DFS • BST Operations • Tree Problems

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🌲 DFS Traversals (Inorder, Preorder, Postorder)

⚠️ **Function Name:** `dfsTraversal()`

| Input      | `tree` (object), `traversalType` (string) |
| :--------- | :---------------------------------------- |
| **Output** | object                                    |

**Rules:**

`tree` — binary tree node object:

```javascript
{ value: number, left: treeNode or null, right: treeNode or null }
```

`traversalType` must be one of: `"INORDER"`, `"PREORDER"`, `"POSTORDER"`

**Traversal Definitions:**

- **`"INORDER"`** → Left → Root → Right
- **`"PREORDER"`** → Root → Left → Right
- **`"POSTORDER"`** → Left → Right → Root

**Rules:**

- Implement each traversal both **recursively** and track `calls`
- Do NOT use any built-in sort
- Returns `{ traversalType, result: array of values, nodeCount: total nodes visited, calls }`

| Challenge 📢 | Return the traversal result object. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------ |

**Sample Input & Output:**

- Given tree:

```
        1
       / \
      2   3
     / \
    4   5
```

`tree = { value: 1, left: { value: 2, left: { value: 4, left: null, right: null }, right: { value: 5, left: null, right: null } }, right: { value: 3, left: null, right: null } }`

- `dfsTraversal(tree, "INORDER")` →

  **Manual Verify:**
  - Left of 1 → Left of 2 → 4 → back to 2 → Right of 2 → 5 → back to 1 → Right of 1 → 3
  - Result: [4, 2, 5, 1, 3]

  `{ traversalType: "INORDER", result: [4, 2, 5, 1, 3], nodeCount: 5, calls: 5 }`

- `dfsTraversal(tree, "PREORDER")` →

  **Manual Verify:**
  - Root first: 1 → 2 → 4 → 5 → 3

  `{ traversalType: "PREORDER", result: [1, 2, 4, 5, 3], nodeCount: 5, calls: 5 }`

- `dfsTraversal(tree, "POSTORDER")` →

  **Manual Verify:**
  - Children first: 4 → 5 → 2 → 3 → 1

  `{ traversalType: "POSTORDER", result: [4, 5, 2, 3, 1], nodeCount: 5, calls: 5 }`

---

## 🧩 PROBLEM–02: 🌊 BFS Traversal (Level Order)

⚠️ **Function Name:** `bfsTraversal()`

| Input      | `tree` (object), `problemType` (string) |
| :--------- | :-------------------------------------- |
| **Output** | object                                  |

**Rules:**

`tree` — binary tree node (same structure as Problem-01)
`problemType` must be one of: `"LEVEL_ORDER"`, `"ZIGZAG_ORDER"`, `"RIGHT_SIDE_VIEW"`

**BFS Rules (use a queue):**

- **`"LEVEL_ORDER"`** — standard BFS, return values grouped by level
  - Returns `{ levels: [[level0 values], [level1 values], ...], totalLevels, nodeCount }`

- **`"ZIGZAG_ORDER"`** — BFS but alternate direction per level (left→right, right→left, ...)
  - Level 0: left→right, Level 1: right→left, Level 2: left→right, ...
  - Returns `{ levels: [[level0], [level1 reversed], ...], totalLevels, nodeCount }`

- **`"RIGHT_SIDE_VIEW"`** — return the LAST node value at each level (what you'd see from the right)
  - Returns `{ rightView: array of values (one per level), totalLevels }`

| Challenge 📢 | Return the appropriate result based on `problemType`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------ |

**Sample Input & Output:**

- Given tree:

```
        3
       / \
      9  20
        /  \
       15   7
```

`tree = { value: 3, left: { value: 9, left: null, right: null }, right: { value: 20, left: { value: 15, left: null, right: null }, right: { value: 7, left: null, right: null } } }`

- `bfsTraversal(tree, "LEVEL_ORDER")` →

  `{ levels: [[3], [9, 20], [15, 7]], totalLevels: 3, nodeCount: 5 }`

- `bfsTraversal(tree, "ZIGZAG_ORDER")` →

  **Manual Verify:**
  - Level 0 (L→R): [3]
  - Level 1 (R→L): [20, 9]
  - Level 2 (L→R): [15, 7]

  `{ levels: [[3], [20, 9], [15, 7]], totalLevels: 3, nodeCount: 5 }`

- `bfsTraversal(tree, "RIGHT_SIDE_VIEW")` →

  **Manual Verify:**
  - Level 0: last = 3
  - Level 1: last = 20
  - Level 2: last = 7

  `{ rightView: [3, 20, 7], totalLevels: 3 }`

---

## 🧩 PROBLEM–03: 🔍 BST (Binary Search Tree) Operations

⚠️ **Function Name:** `createBST()`

| Input      | None (factory function) |
| :--------- | :---------------------- |
| **Output** | object (BST)            |

**Rules:**

Return a BST object with these methods:

- `insert(value)` — insert a value maintaining BST property
- `search(value)` — find if value exists
- `delete(value)` — remove a node (handle all 3 cases)
- `toSortedArray()` — return all values via inorder traversal (ascending)
- `isValidBST()` — verify the tree is a valid BST
- `getStats()` — return tree statistics

**BST Property:** left subtree values < node value < right subtree values

**Operation Rules:**

- `insert(value)`:
  - `value` must be a number
  - If value already exists → `{ inserted: false, reason: "Duplicate value" }`
  - Else → `{ inserted: true, value, depth: level where inserted (root=1) }`

- `search(value)` → `{ found: true, value, depth }` or `{ found: false, value }`

- `delete(value)`:
  - Case 1: leaf node → simply remove
  - Case 2: one child → replace node with child
  - Case 3: two children → replace with inorder successor (smallest in right subtree)
  - Returns `{ deleted: true, value }` or `{ deleted: false, reason: "Value not found" }`

- `toSortedArray()` → array of all values in ascending order

- `isValidBST()` → `{ isValid: boolean }`

- `getStats()` → `{ nodeCount, height, minValue, maxValue }`

**Validation:** invalid value type → return `"Invalid Input"`

| Challenge 📢 | Return the BST object maintaining internal tree state. |
| :----------- | :----------------------------------------------------- |

**Sample Input & Output:**

```javascript
const bst = createBST();

bst.insert(5); // → { inserted: true, value: 5, depth: 1 }
bst.insert(3); // → { inserted: true, value: 3, depth: 2 }
bst.insert(7); // → { inserted: true, value: 7, depth: 2 }
bst.insert(1); // → { inserted: true, value: 1, depth: 3 }
bst.insert(4); // → { inserted: true, value: 4, depth: 3 }
bst.insert(5); // → { inserted: false, reason: "Duplicate value" }

bst.search(3); // → { found: true, value: 3, depth: 2 }
bst.search(9); // → { found: false, value: 9 }

bst.toSortedArray(); // → [1, 3, 4, 5, 7]

bst.delete(3);
// Case: two children (1 and 4) → replace with inorder successor (4)
// → { deleted: true, value: 3 }

bst.toSortedArray(); // → [1, 4, 5, 7]

bst.getStats(); // → { nodeCount: 4, height: 3, minValue: 1, maxValue: 7 }
bst.isValidBST(); // → { isValid: true }
```

---

## 🧩 PROBLEM–04: 🧩 Tree Problem Solving

⚠️ **Function Name:** `solveTreeProblem()`

| Input      | `tree` (object), `problemType` (string), `params` (object or null) |
| :--------- | :----------------------------------------------------------------- |
| **Output** | object                                                             |

**Rules:**

`tree` — binary tree node (same structure as Problem-01)
`problemType` must be one of: `"LOWEST_COMMON_ANCESTOR"`, `"DIAMETER"`, `"FLATTEN"`

---

**`"LOWEST_COMMON_ANCESTOR"`** — find LCA of two nodes in a BST

- `params`: `{ p: number, q: number }` — values of two nodes
- For BST: if both p,q < root → go left; if both > root → go right; else root is LCA
- If either p or q not in tree → `{ error: "Node not found" }`
- Returns `{ p, q, lca: value of lowest common ancestor, depth: depth of LCA node }`

**Sample Input & Output:**

- Given BST: `{ value: 6, left: { value: 2, left: { value: 0, left: null, right: null }, right: { value: 4, left: { value: 3, left: null, right: null }, right: { value: 5, left: null, right: null } } }, right: { value: 8, left: { value: 7, left: null, right: null }, right: { value: 9, left: null, right: null } } }`

- `solveTreeProblem(tree, "LOWEST_COMMON_ANCESTOR", { p: 2, q: 8 })` →

  **Manual Verify:**
  - p=2 < 6, q=8 > 6 → root(6) is LCA

  `{ p: 2, q: 8, lca: 6, depth: 1 }`

- `solveTreeProblem(tree, "LOWEST_COMMON_ANCESTOR", { p: 2, q: 4 })` →

  **Manual Verify:**
  - Both < 6 → go left to 2; p=2 matches root → root(2) is LCA

  `{ p: 2, q: 4, lca: 2, depth: 2 }`

---

**`"DIAMETER"`** — find the diameter of the tree (longest path between any two nodes)

- `params`: null
- Diameter = max of (leftHeight + rightHeight) at any node
- Use recursive DFS, track maxDiameter
- Returns `{ diameter: number of edges on longest path, longestPath: number of nodes on longest path }`

**Sample Input & Output:**

- Given tree from Problem-01 (1,2,3,4,5):
- `solveTreeProblem(tree, "DIAMETER", null)` →

  **Manual Verify:**
  - Longest path: 4→2→1→3 (3 edges) or 5→2→1→3 (3 edges)

  `{ diameter: 3, longestPath: 4 }`

---

**`"FLATTEN"`** — flatten binary tree to a linked list (in-place, preorder)

- `params`: null
- Rearrange nodes so each node's `right` points to next preorder node, all `left` = null
- Returns `{ flattenedOrder: array of values in preorder, nodeCount }`

**Sample Input & Output:**

- Given tree from Problem-01 (1,2,3,4,5):
- `solveTreeProblem(tree, "FLATTEN", null)` →

  **Manual Verify:**
  - Preorder: 1→2→4→5→3
  - Flattened (right pointers): 1→2→4→5→3, all left=null

  `{ flattenedOrder: [1, 2, 4, 5, 3], nodeCount: 5 }`

---

| Challenge 📢 | Return the appropriate result based on `problemType`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------ |

---

## 🧩 PROBLEM–05: 🏗️ Tree Full Challenge Orchestrator

⚠️ **Function Name:** `runTreeChallenge()`

| Input      | `challengeConfig` (object) |
| :--------- | :------------------------- |
| **Output** | object                     |

**Rules:**

`challengeConfig` object:

- `challengeId` (string, non-empty)
- `values` (array of numbers, non-empty) — insert into a BST in order to build the tree
- `traversals` (array of strings) — traversal types to run: subset of `"INORDER"`, `"PREORDER"`, `"POSTORDER"`, `"LEVEL_ORDER"`, `"ZIGZAG_ORDER"`, `"RIGHT_SIDE_VIEW"`
- `operations` (array of objects) — BST operations to perform sequentially:
  - `type` (string: `"INSERT"`, `"DELETE"`, `"SEARCH"`)
  - `value` (number)
- `treeProblems` (array of objects) — tree problems to solve after operations:
  - `type` (string: `"DIAMETER"`, `"LOWEST_COMMON_ANCESTOR"`, `"FLATTEN"`)
  - `params` (object or null)

**Orchestration Rules (compose all previous concepts):**

1. **Build BST** — insert all `values` into a BST (Problem-03 logic)
2. **Run Traversals** — run each requested traversal on the initial BST (Problems 01 & 02 logic)
3. **Apply Operations** — apply each BST operation sequentially (Problem-03 logic), log results
4. **Solve Tree Problems** — run each tree problem on the FINAL tree state (Problem-04 logic)
5. **Build Summary:**
   - `initialNodeCount` → nodes after initial build
   - `finalNodeCount` → nodes after all operations
   - `treeHeight` → height of final tree
   - `isBSTValid` → validity check on final tree

**Validation:** invalid `challengeConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ challengeId, traversalResults, operationLog, treeProblemResults, summary }`. |
| :----------- | :------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runTreeChallenge({
  challengeId: "TREE-01",
  values: [5, 3, 7, 1, 4],
  traversals: ["INORDER", "LEVEL_ORDER"],
  operations: [
    { type: "INSERT", value: 6 },
    { type: "DELETE", value: 3 },
    { type: "SEARCH", value: 4 }
  ],
  treeProblems: [
    { type: "DIAMETER", params: null }
  ]
})` →

  **Manual Verify:**
  - Build BST: insert 5,3,7,1,4 → initialNodeCount=5
  - INORDER: [1,3,4,5,7]
  - LEVEL_ORDER: [[5],[3,7],[1,4]]
  - INSERT 6: adds 6 between 5 and 7
  - DELETE 3: 3 has two children (1,4) → replace with inorder successor (4)
  - SEARCH 4: found at some depth
  - Final tree: [1,4,5,6,7] → finalNodeCount=5
  - DIAMETER: longest path in final tree

  `{
  challengeId: "TREE-01",
  traversalResults: [
    { traversalType: "INORDER", result: [1, 3, 4, 5, 7], nodeCount: 5, calls: 5 },
    { levels: [[5], [3, 7], [1, 4]], totalLevels: 3, nodeCount: 5 }
  ],
  operationLog: [
    { type: "INSERT", value: 6, result: { inserted: true, value: 6, depth: 3 } },
    { type: "DELETE", value: 3, result: { deleted: true, value: 3 } },
    { type: "SEARCH", value: 4, result: { found: true, value: 4, depth: 3 } }
  ],
  treeProblemResults: [
    { type: "DIAMETER", result: { diameter: 4, longestPath: 5 } }
  ],
  summary: {
    initialNodeCount: 5,
    finalNodeCount: 5,
    treeHeight: 3,
    isBSTValid: true
  }
}`

---
