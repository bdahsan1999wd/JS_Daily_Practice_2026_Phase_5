# 🎓 JS DAILY PRACTICE – DAY-223

📅 **Goal:** Linked List Operations (Data Structures & Algorithms)
🎯 **Focus:** Singly Linked List • Doubly Linked List • List Manipulation • Two Pointer Technique • List Applications

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🔗 Singly Linked List Implementation

⚠️ **Function Name:** `createSinglyLinkedList()`

| Input      | None (factory function)     |
| :--------- | :-------------------------- |
| **Output** | object (singly linked list) |

**Rules:**

Return a linked list object with these methods:

- `append(value)` — add node to the END of the list
- `prepend(value)` — add node to the BEGINNING of the list
- `delete(value)` — remove the FIRST node with matching value
- `find(value)` — return node position (1-based) or null if not found
- `toArray()` — return all values as array (head → tail)
- `size()` — return number of nodes
- `reverse()` — reverse the list in-place, return `{ reversed: true, list: toArray() }`

**Node Structure (internal):** `{ value, next: null }`

**Operation Rules:**

- `append(value)` → any non-undefined value; returns `{ appended: true, value, size: newSize }`
- `prepend(value)` → returns `{ prepended: true, value, size: newSize }`
- `delete(value)` → returns `{ deleted: true, value, size: newSize }` or `{ deleted: false, reason: "Value not found" }`
- `find(value)` → returns `{ value, position: N }` or `{ found: false, value }`
- `toArray()` → returns array of values from head to tail
- `size()` → returns number
- `reverse()` → reverses in-place, returns `{ reversed: true, list: newArray }`
- `undefined` value → return `"Invalid Input"`

| Challenge 📢 | Return the linked list object maintaining internal node state. |
| :----------- | :------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const list = createSinglyLinkedList();

list.append(10); // → { appended: true, value: 10, size: 1 }
list.append(20); // → { appended: true, value: 20, size: 2 }
list.append(30); // → { appended: true, value: 30, size: 3 }
list.prepend(5); // → { prepended: true, value: 5, size: 4 }

list.toArray(); // → [5, 10, 20, 30]

list.find(20); // → { value: 20, position: 3 }
list.find(99); // → { found: false, value: 99 }

list.delete(10); // → { deleted: true, value: 10, size: 3 }
list.toArray(); // → [5, 20, 30]

list.reverse(); // → { reversed: true, list: [30, 20, 5] }
list.toArray(); // → [30, 20, 5]
```

---

## 🧩 PROBLEM–02: 🔄 Doubly Linked List Implementation

⚠️ **Function Name:** `createDoublyLinkedList()`

| Input      | None (factory function)     |
| :--------- | :-------------------------- |
| **Output** | object (doubly linked list) |

**Rules:**

Return a doubly linked list object with these methods:

- `append(value)` — add to end
- `prepend(value)` — add to beginning
- `insertAt(value, position)` — insert at 1-based position
- `deleteAt(position)` — delete node at 1-based position
- `toArray()` — return values head → tail
- `toArrayReverse()` — return values tail → head (traverse backwards using `prev` pointers)
- `size()` — return node count

**Node Structure (internal):** `{ value, next: null, prev: null }`

**Operation Rules:**

- `append(value)` → returns `{ appended: true, value, size: newSize }`
- `prepend(value)` → returns `{ prepended: true, value, size: newSize }`
- `insertAt(value, position)`:
  - `position` must be integer, 1 ≤ position ≤ size + 1
  - Returns `{ inserted: true, value, position, size: newSize }` or `{ error: "Invalid position" }`
- `deleteAt(position)`:
  - `position` must be integer, 1 ≤ position ≤ size
  - Returns `{ deleted: true, value: deletedValue, position, size: newSize }` or `{ error: "Invalid position" }`
- `toArray()` → array from head to tail
- `toArrayReverse()` → array from tail to head
- `undefined` value or invalid types → return `"Invalid Input"`

| Challenge 📢 | Return the doubly linked list object maintaining `next` and `prev` pointers. |
| :----------- | :--------------------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const dll = createDoublyLinkedList();

dll.append(10); // → { appended: true, value: 10, size: 1 }
dll.append(20); // → { appended: true, value: 20, size: 2 }
dll.append(30); // → { appended: true, value: 30, size: 3 }
dll.prepend(5); // → { prepended: true, value: 5, size: 4 }

dll.toArray(); // → [5, 10, 20, 30]
dll.toArrayReverse(); // → [30, 20, 10, 5]

dll.insertAt(15, 3); // → { inserted: true, value: 15, position: 3, size: 5 }
dll.toArray(); // → [5, 10, 15, 20, 30]

dll.deleteAt(2); // → { deleted: true, value: 10, position: 2, size: 4 }
dll.toArray(); // → [5, 15, 20, 30]
dll.toArrayReverse(); // → [30, 20, 15, 5]
```

---

## 🧩 PROBLEM–03: 👆👆 Two Pointer Technique

⚠️ **Function Name:** `solveWithTwoPointers()`

| Input      | `values` (array), `problemType` (string) |
| :--------- | :--------------------------------------- |
| **Output** | any                                      |

**Rules:**

`values` — non-empty array
`problemType` must be one of: `"FIND_MIDDLE"`, `"DETECT_CYCLE"`, `"NTH_FROM_END"`

Build an internal linked list from `values` array first, then apply the two-pointer technique.

**Problem Definitions:**

- **`"FIND_MIDDLE"`** — find the middle node of the linked list
  - Use slow/fast pointer: slow moves 1 step, fast moves 2 steps
  - If even number of nodes → return the SECOND middle node
  - Returns `{ middleValue, position: 1-based index of middle node, totalNodes }`

- **`"DETECT_CYCLE"`** — detect if a linked list has a cycle
  - Since we build from an array, there is NO real cycle — always returns `{ hasCycle: false, message: "No cycle detected" }`
  - BUT also return `{ nodeCount: totalNodes, traversedNodes: totalNodes }` to show the traversal worked
  - Returns `{ hasCycle: false, message: "No cycle detected", nodeCount, traversedNodes }`

- **`"NTH_FROM_END"`** — `values` first element is `N` (integer ≥ 1), rest are the list values
  - Find the Nth node from the END using two pointers (fast pointer goes N steps ahead first)
  - Returns `{ n: N, nthFromEnd: value, position: 1-based from head }` or `{ error: "N exceeds list length" }` if N > list length

| Challenge 📢 | Return the appropriate result based on `problemType`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------ |

**Sample Input & Output:**

- `solveWithTwoPointers([1, 2, 3, 4, 5], "FIND_MIDDLE")` →

  **Manual Verify:**
  - slow/fast: start at 1
  - step1: slow→2, fast→3
  - step2: slow→3, fast→5 (fast.next is null → stop)
  - middle = 3, position = 3, totalNodes = 5

  `{ middleValue: 3, position: 3, totalNodes: 5 }`

- `solveWithTwoPointers([1, 2, 3, 4, 5, 6], "FIND_MIDDLE")` →

  **Manual Verify:**
  - 6 nodes → second middle = node at position 4 (value 4)

  `{ middleValue: 4, position: 4, totalNodes: 6 }`

- `solveWithTwoPointers([1, 2, 3, 4, 5], "DETECT_CYCLE")` →

  `{ hasCycle: false, message: "No cycle detected", nodeCount: 5, traversedNodes: 5 }`

- `solveWithTwoPointers([2, 10, 20, 30, 40, 50], "NTH_FROM_END")` →

  **Manual Verify:**
  - N=2, list=[10,20,30,40,50]
  - 2nd from end = 40, position from head = 4

  `{ n: 2, nthFromEnd: 40, position: 4 }`

---

## 🧩 PROBLEM–04: ✂️ Linked List Manipulation

⚠️ **Function Name:** `manipulateLinkedList()`

| Input      | `values` (array), `operation` (string), `params` (object) |
| :--------- | :-------------------------------------------------------- |
| **Output** | object                                                    |

**Rules:**

`values` — non-empty array of numbers (build a linked list from this)
`operation` must be one of: `"MERGE_SORTED"`, `"REMOVE_DUPLICATES"`, `"PARTITION"`
`params` — operation-specific parameters

**Operation Definitions:**

- **`"MERGE_SORTED"`** — merge two sorted linked lists into one sorted list
  - `params`: `{ second: array }` — second sorted array to merge with `values`
  - Both `values` and `params.second` are already sorted ascending
  - Merge using the classic two-pointer merge approach
  - Returns `{ merged: array of merged sorted values, size: totalNodes }`

- **`"REMOVE_DUPLICATES"`** — remove all duplicate values, keep first occurrence
  - No extra `params` needed
  - Traverse list, use a Set to track seen values, skip duplicates
  - Returns `{ original: values, deduplicated: array, removedCount: N }`

- **`"PARTITION"`** — partition list around a pivot value
  - `params`: `{ pivot: number }`
  - Rearrange nodes so all values LESS THAN pivot come before values GREATER THAN OR EQUAL TO pivot
  - Relative order within each partition must be preserved
  - Returns `{ pivot, before: array (< pivot), after: array (≥ pivot), partitioned: combined array }`

| Challenge 📢 | Return the appropriate result based on `operation`. If invalid → return `"Invalid Input"` |
| :----------- | :---------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `manipulateLinkedList([1, 3, 5, 7], "MERGE_SORTED", { second: [2, 4, 6, 8] })` →

  **Manual Verify:**
  - Merge [1,3,5,7] and [2,4,6,8] → [1,2,3,4,5,6,7,8]

  `{ merged: [1, 2, 3, 4, 5, 6, 7, 8], size: 8 }`

- `manipulateLinkedList([1, 2, 3, 2, 4, 1, 5], "REMOVE_DUPLICATES", {})` →

  **Manual Verify:**
  - Keep first occurrence: 1,2,3,4,5 → removed: 2,1 (2 items)

  `{ original: [1, 2, 3, 2, 4, 1, 5], deduplicated: [1, 2, 3, 4, 5], removedCount: 2 }`

- `manipulateLinkedList([3, 5, 8, 2, 10, 1, 7], "PARTITION", { pivot: 5 })` →

  **Manual Verify:**
  - before (< 5): [3, 2, 1] (preserve relative order)
  - after (≥ 5): [5, 8, 10, 7]
  - partitioned: [3, 2, 1, 5, 8, 10, 7]

  `{ pivot: 5, before: [3, 2, 1], after: [5, 8, 10, 7], partitioned: [3, 2, 1, 5, 8, 10, 7] }`

---

## 🧩 PROBLEM–05: 🏗️ Linked List Full Challenge

⚠️ **Function Name:** `runLinkedListChallenge()`

| Input      | `challengeConfig` (object) |
| :--------- | :------------------------- |
| **Output** | object                     |

**Rules:**

`challengeConfig` object:

- `listId` (string, non-empty)
- `values` (array of numbers, non-empty)
- `operations` (array of objects) — sequential operations to apply:
  - `type` (string: `"APPEND"`, `"PREPEND"`, `"DELETE"`, `"REVERSE"`, `"REMOVE_DUPLICATES"`, `"FIND_MIDDLE"`)
  - `value` (any, for APPEND/PREPEND/DELETE)

**Orchestration Rules (compose all previous concepts):**

1. **Build** initial singly linked list from `values` (Problem-01 logic)
2. **Apply operations** sequentially — each operation mutates the list:
   - `"APPEND"` → append `value` to list
   - `"PREPEND"` → prepend `value` to list
   - `"DELETE"` → delete first node with `value`
   - `"REVERSE"` → reverse the list in-place
   - `"REMOVE_DUPLICATES"` → remove duplicates (Problem-04 logic), keep first occurrence
   - `"FIND_MIDDLE"` → find middle using two-pointer (Problem-03 logic), does NOT mutate list
3. **Build operation log** → array of `{ type, result }` for each operation
4. **Final state** → `toArray()` of the list after all operations

**Validation:** invalid `challengeConfig` or missing required fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ listId, initialList, operationLog, finalList, finalSize }`. |
| :----------- | :-------------------------------------------------------------------- |

**Sample Input & Output:**

- `runLinkedListChallenge({
  listId: "LIST-01",
  values: [3, 1, 4, 1, 5, 9, 2, 6],
  operations: [
    { type: "REMOVE_DUPLICATES" },
    { type: "APPEND", value: 7 },
    { type: "REVERSE" },
    { type: "FIND_MIDDLE" }
  ]
})` →

  **Manual Verify:**
  - Initial list: [3, 1, 4, 1, 5, 9, 2, 6]
  - REMOVE_DUPLICATES: [3, 1, 4, 5, 9, 2, 6] (removed one 1)
  - APPEND 7: [3, 1, 4, 5, 9, 2, 6, 7]
  - REVERSE: [7, 6, 2, 9, 5, 4, 1, 3]
  - FIND_MIDDLE: 8 nodes → second middle = position 5 = value 5

  `{
  listId: "LIST-01",
  initialList: [3, 1, 4, 1, 5, 9, 2, 6],
  operationLog: [
    { type: "REMOVE_DUPLICATES", result: { deduplicated: [3, 1, 4, 5, 9, 2, 6], removedCount: 1 } },
    { type: "APPEND", result: { appended: true, value: 7, size: 8 } },
    { type: "REVERSE", result: { reversed: true, list: [7, 6, 2, 9, 5, 4, 1, 3] } },
    { type: "FIND_MIDDLE", result: { middleValue: 5, position: 5, totalNodes: 8 } }
  ],
  finalList: [7, 6, 2, 9, 5, 4, 1, 3],
  finalSize: 8
}`

---
