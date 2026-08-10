# 🎓 JS DAILY PRACTICE – DAY-222

📅 **Goal:** Stack & Queue Implementation (Data Structures & Algorithms)
🎯 **Focus:** Stack (LIFO) • Queue (FIFO) • Deque • Monotonic Stack • Stack/Queue Applications

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 📚 Stack Implementation

⚠️ **Function Name:** `createStack()`

| Input      | None (factory function) |
| :--------- | :---------------------- |
| **Output** | object (stack)          |

**Rules:**

Return a stack object with these methods:

- `push(value)` — add item to top of stack
- `pop()` — remove and return top item
- `peek()` — return top item without removing
- `isEmpty()` — return true if stack is empty
- `size()` — return number of items
- `toArray()` — return all items as array (bottom → top)
- `clear()` — remove all items, return `{ cleared: true, removedCount }`

**Operation Rules:**

- `push(value)` → `value` can be any non-undefined value; returns `{ pushed: true, value, size: newSize }`
- `pop()` → returns `{ value, size: newSize }` or `{ error: "Stack is empty" }`
- `peek()` → returns `{ value }` or `{ error: "Stack is empty" }`
- `isEmpty()` → returns boolean
- `size()` → returns number
- `toArray()` → returns array (index 0 = bottom, last index = top)
- `clear()` → returns `{ cleared: true, removedCount: N }`
- `push(undefined)` → return `"Invalid Input"`

| Challenge 📢 | Return the stack object maintaining internal LIFO state. |
| :----------- | :------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const stack = createStack();

stack.push(10);  // → { pushed: true, value: 10, size: 1 }
stack.push(20);  // → { pushed: true, value: 20, size: 2 }
stack.push(30);  // → { pushed: true, value: 30, size: 3 }

stack.peek();    // → { value: 30 }
stack.pop();     // → { value: 30, size: 2 }
stack.pop();     // → { value: 20, size: 1 }

stack.toArray(); // → [10]
stack.size();    // → 1
stack.isEmpty(); // → false

stack.clear();   // → { cleared: true, removedCount: 1 }
stack.isEmpty(); // → true
stack.pop();     // → { error: "Stack is empty" }
```

---

## 🧩 PROBLEM–02: 🚶 Queue Implementation

⚠️ **Function Name:** `createQueue()`

| Input      | None (factory function) |
| :--------- | :---------------------- |
| **Output** | object (queue)          |

**Rules:**

Return a queue object with these methods:

- `enqueue(value)` — add item to back of queue
- `dequeue()` — remove and return front item (FIFO)
- `front()` — return front item without removing
- `rear()` — return last item without removing
- `isEmpty()` — return true if queue is empty
- `size()` — return number of items
- `toArray()` — return all items as array (front → rear)
- `clear()` — remove all items

**Operation Rules:**

- `enqueue(value)` → any non-undefined value; returns `{ enqueued: true, value, size: newSize }`
- `dequeue()` → returns `{ value, size: newSize }` or `{ error: "Queue is empty" }`
- `front()` → returns `{ value }` or `{ error: "Queue is empty" }`
- `rear()` → returns `{ value }` or `{ error: "Queue is empty" }`
- `toArray()` → returns array (index 0 = front, last = rear)
- `clear()` → returns `{ cleared: true, removedCount: N }`
- `enqueue(undefined)` → return `"Invalid Input"`

| Challenge 📢 | Return the queue object maintaining internal FIFO state. |
| :----------- | :------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const queue = createQueue();

queue.enqueue("A"); // → { enqueued: true, value: "A", size: 1 }
queue.enqueue("B"); // → { enqueued: true, value: "B", size: 2 }
queue.enqueue("C"); // → { enqueued: true, value: "C", size: 3 }

queue.front();      // → { value: "A" }
queue.rear();       // → { value: "C" }
queue.toArray();    // → ["A", "B", "C"]

queue.dequeue();    // → { value: "A", size: 2 }
queue.dequeue();    // → { value: "B", size: 1 }

queue.front();      // → { value: "C" }
queue.size();       // → 1

queue.clear();      // → { cleared: true, removedCount: 1 }
queue.dequeue();    // → { error: "Queue is empty" }
```

---

## 🧩 PROBLEM–03: 🔄 Deque (Double-Ended Queue)

⚠️ **Function Name:** `createDeque()`

| Input      | None (factory function) |
| :--------- | :---------------------- |
| **Output** | object (deque)          |

**Rules:**

Return a deque object with these methods:

- `pushFront(value)` — add to front
- `pushRear(value)` — add to rear
- `popFront()` — remove and return from front
- `popRear()` — remove and return from rear
- `peekFront()` — view front without removing
- `peekRear()` — view rear without removing
- `size()` — return current size
- `toArray()` — return all items (front → rear)

**Operation Rules:**

- `pushFront(value)` → returns `{ pushed: "FRONT", value, size: newSize }`
- `pushRear(value)` → returns `{ pushed: "REAR", value, size: newSize }`
- `popFront()` → returns `{ value, size: newSize }` or `{ error: "Deque is empty" }`
- `popRear()` → returns `{ value, size: newSize }` or `{ error: "Deque is empty" }`
- `peekFront()` → returns `{ value }` or `{ error: "Deque is empty" }`
- `peekRear()` → returns `{ value }` or `{ error: "Deque is empty" }`
- `undefined` value → return `"Invalid Input"`

| Challenge 📢 | Return the deque object maintaining internal state. |
| :----------- | :-------------------------------------------------- |

**Sample Input & Output:**

```javascript
const deque = createDeque();

deque.pushRear(1);   // → { pushed: "REAR", value: 1, size: 1 }
deque.pushRear(2);   // → { pushed: "REAR", value: 2, size: 2 }
deque.pushFront(0);  // → { pushed: "FRONT", value: 0, size: 3 }

deque.toArray();     // → [0, 1, 2]

deque.popFront();    // → { value: 0, size: 2 }
deque.popRear();     // → { value: 2, size: 1 }

deque.peekFront();   // → { value: 1 }
deque.peekRear();    // → { value: 1 }

deque.pushFront(99);
deque.toArray();     // → [99, 1]
```

---

## 🧩 PROBLEM–04: 📊 Monotonic Stack Applications

⚠️ **Function Name:** `solveWithMonotonicStack()`

| Input      | `numbers` (array of numbers), `problemType` (string) |
| :--------- | :--------------------------------------------------- |
| **Output** | array or object                                      |

**Rules:**

`numbers` — non-empty array of integers
`problemType` must be one of: `"NEXT_GREATER"`, `"PREV_SMALLER"`, `"LARGEST_RECTANGLE"`

**Problem Definitions:**

- **`"NEXT_GREATER"`** — for each element, find the next element to its RIGHT that is greater than it
  - If no greater element exists to the right → use `-1`
  - Use a **monotonic decreasing stack** (stack holds indices)
  - Returns array of same length: `nextGreater[i]` = next greater value for `numbers[i]`

- **`"PREV_SMALLER"`** — for each element, find the nearest element to its LEFT that is smaller than it
  - If no smaller element exists to the left → use `-1`
  - Use a **monotonic increasing stack**
  - Returns array of same length: `prevSmaller[i]` = previous smaller value for `numbers[i]`

- **`"LARGEST_RECTANGLE"`** — given an array as histogram bar heights, find the largest rectangle area
  - Use stack-based approach
  - Returns `{ maxArea, heights: numbers }`

| Challenge 📢 | Return the result based on `problemType`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------ |

**Sample Input & Output:**

- `solveWithMonotonicStack([2, 1, 5, 3, 6, 4], "NEXT_GREATER")` →

  **Manual Verify:**
  - 2 → next greater is 5 (index 2)
  - 1 → next greater is 5 (index 2)
  - 5 → next greater is 6 (index 4)
  - 3 → next greater is 6 (index 4)
  - 6 → no greater → -1
  - 4 → no greater → -1

  `[5, 5, 6, 6, -1, -1]`

- `solveWithMonotonicStack([2, 1, 5, 3, 6, 4], "PREV_SMALLER")` →

  **Manual Verify:**
  - 2 → no smaller to left → -1
  - 1 → no smaller to left → -1
  - 5 → previous smaller is 1
  - 3 → previous smaller is 1
  - 6 → previous smaller is 3
  - 4 → previous smaller is 3

  `[-1, -1, 1, 1, 3, 3]`

- `solveWithMonotonicStack([2, 1, 5, 6, 2, 3], "LARGEST_RECTANGLE")` →

  **Manual Verify:**
  - Largest rectangle area in histogram = 10 (bars of height 5 and 6, width 2)

  `{ maxArea: 10, heights: [2, 1, 5, 6, 2, 3] }`

---

## 🧩 PROBLEM–05: 🏗️ Stack & Queue Combined Challenges

⚠️ **Function Name:** `solveStackQueueChallenge()`

| Input      | `input` (any), `challengeType` (string) |
| :--------- | :-------------------------------------- |
| **Output** | any                                     |

**Rules:**

`challengeType` must be one of: `"BALANCED_BRACKETS"`, `"QUEUE_VIA_STACKS"`, `"SORT_STACK"`

---

**`"BALANCED_BRACKETS"`**

`input` — string containing brackets: `(`, `)`, `{`, `}`, `[`, `]`

- Use a stack to check if all brackets are properly matched and closed
- Returns `{ input, isBalanced: true/false, reason: null or "Unmatched closing bracket" or "Unclosed opening brackets" }`

**Sample Input & Output:**

- `solveStackQueueChallenge("({[]})", "BALANCED_BRACKETS")` → `{ input: "({[]})", isBalanced: true, reason: null }`
- `solveStackQueueChallenge("({[}])", "BALANCED_BRACKETS")` → `{ input: "({[}])", isBalanced: false, reason: "Unmatched closing bracket" }`

---

**`"QUEUE_VIA_STACKS"`**

`input` — array of operation objects: `{ op: "ENQUEUE" | "DEQUEUE", value?: any }`

- Simulate a Queue using TWO stacks (stack1 for enqueue, stack2 for dequeue)
- Process each operation and return the result log
- Returns `{ operationLog: [{ op, value or result, queueState }] }` where `queueState` is current queue contents (front → rear)

**Sample Input & Output:**

- `solveStackQueueChallenge([
    { op: "ENQUEUE", value: 1 },
    { op: "ENQUEUE", value: 2 },
    { op: "DEQUEUE" },
    { op: "ENQUEUE", value: 3 }
  ], "QUEUE_VIA_STACKS")` →
  `{
  operationLog: [
    { op: "ENQUEUE", value: 1, queueState: [1] },
    { op: "ENQUEUE", value: 2, queueState: [1, 2] },
    { op: "DEQUEUE", result: 1, queueState: [2] },
    { op: "ENQUEUE", value: 3, queueState: [2, 3] }
  ]
}`

---

**`"SORT_STACK"`**

`input` — array of numbers (unsorted)

- Use only stack operations (push, pop, peek) to sort in ascending order (smallest on top)
- Algorithm: use a temp stack — for each element, pop from main stack and insert into correct position in temp stack
- Returns `{ original: input, sorted: resultArray }` where `resultArray[0]` is the top (smallest)

**Sample Input & Output:**

- `solveStackQueueChallenge([34, 3, 31, 98, 92, 23], "SORT_STACK")` →
  `{ original: [34, 3, 31, 98, 92, 23], sorted: [3, 23, 31, 34, 92, 98] }`

---

| Challenge 📢 | Return the appropriate result based on `challengeType`. If invalid → return `"Invalid Input"` |
| :----------- | :-------------------------------------------------------------------------------------------- |