# 🎓 JS DAILY PRACTICE – DAY-227

📅 **Goal:** Hash Map Patterns (Data Structures & Algorithms)
🎯 **Focus:** Frequency Counter • Two Sum Pattern • Grouping • Sliding Window with Map • Hash Map Applications

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🔢 Frequency Counter Patterns

⚠️ **Function Name:** `solveFrequencyCounter()`

| Input      | `input` (any), `problemType` (string) |
| :--------- | :------------------------------------ |
| **Output** | object                                |

**Rules:**

`problemType` must be one of: `"CHAR_FREQUENCY"`, `"ANAGRAM_CHECK"`, `"FIRST_UNIQUE"`

---

**`"CHAR_FREQUENCY"`** — count frequency of each character in a string

- `input` — non-empty string
- Build a frequency map: `{ char: count }`
- Also find: `mostFrequent` (char with highest count, first alphabetically if tie), `leastFrequent` (char with lowest count, first alphabetically if tie), `uniqueChars` (count of distinct chars)
- Returns `{ input, frequencyMap, mostFrequent, leastFrequent, uniqueChars }`

**Sample Input & Output:**

- `solveFrequencyCounter("javascript", "CHAR_FREQUENCY")` →

  **Manual Verify:**
  - j:1, a:2, v:1, s:1, c:1, r:1, i:1, p:1, t:1
  - mostFrequent: "a" (count 2)
  - leastFrequent: "c" (first alphabetically among count-1 chars)
  - uniqueChars: 9

  `{
  input: "javascript",
  frequencyMap: { j:1, a:2, v:1, s:1, c:1, r:1, i:1, p:1, t:1 },
  mostFrequent: { char: "a", count: 2 },
  leastFrequent: { char: "c", count: 1 },
  uniqueChars: 9
}`

---

**`"ANAGRAM_CHECK"`** — check if two strings are anagrams of each other

- `input` — object: `{ str1: string, str2: string }`
- Two strings are anagrams if they have the same characters with same frequencies
- Build frequency maps for both, compare
- Returns `{ str1, str2, isAnagram: boolean, reason: null or "Different lengths" or "Character mismatch" }`

**Sample Input & Output:**

- `solveFrequencyCounter({ str1: "listen", str2: "silent" }, "ANAGRAM_CHECK")` →

  `{ str1: "listen", str2: "silent", isAnagram: true, reason: null }`

- `solveFrequencyCounter({ str1: "hello", str2: "world" }, "ANAGRAM_CHECK")` →

  `{ str1: "hello", str2: "world", isAnagram: false, reason: "Character mismatch" }`

---

**`"FIRST_UNIQUE"`** — find the first non-repeating character in a string

- `input` — non-empty string
- Use two passes: first build frequency map, then find first char with count 1
- Returns `{ input, firstUnique: char or null, position: 1-based index or null }`

**Sample Input & Output:**

- `solveFrequencyCounter("aabbcdeeff", "FIRST_UNIQUE")` →

  **Manual Verify:**
  - a:2, b:2, c:1 → first unique is 'c' at position 5

  `{ input: "aabbcdeeff", firstUnique: "c", position: 5 }`

- `solveFrequencyCounter("aabbcc", "FIRST_UNIQUE")` →

  `{ input: "aabbcc", firstUnique: null, position: null }`

---

| Challenge 📢 | Return the appropriate result based on `problemType`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------ |

---

## 🧩 PROBLEM–02: ➕ Two Sum & Complement Patterns

⚠️ **Function Name:** `solveTwoSumPatterns()`

| Input      | `nums` (array of numbers), `problemType` (string), `params` (object) |
| :--------- | :-------------------------------------------------------------------- |
| **Output** | object                                                                |

**Rules:**

`nums` — non-empty array of integers
`problemType` must be one of: `"TWO_SUM"`, `"THREE_SUM"`, `"SUBARRAY_SUM"`

---

**`"TWO_SUM"`** — find indices of two numbers that add up to `params.target`

- `params`: `{ target: number }`
- Use a hash map: store `{ value: index }` as you iterate
- For each num, check if `target - num` exists in map
- Returns `{ target, indices: [i, j] }` (0-based) or `{ target, indices: null, reason: "No pair found" }`
- If multiple pairs exist → return the FIRST pair found

**Sample Input & Output:**

- `solveTwoSumPatterns([2, 7, 11, 15], "TWO_SUM", { target: 9 })` →

  **Manual Verify:**
  - i=0: num=2, complement=7, not in map → add {2:0}
  - i=1: num=7, complement=2, found at index 0 → return [0,1]

  `{ target: 9, indices: [0, 1] }`

- `solveTwoSumPatterns([3, 2, 4], "TWO_SUM", { target: 6 })` →

  `{ target: 6, indices: [1, 2] }`

---

**`"THREE_SUM"`** — find all unique triplets that sum to zero

- No extra `params` needed (target is always 0)
- Sort array first, then use hash map for the third element
- Avoid duplicate triplets in output
- Returns `{ triplets: array of [a,b,c] arrays, count }`

**Sample Input & Output:**

- `solveTwoSumPatterns([-1, 0, 1, 2, -1, -4], "THREE_SUM", {})` →

  **Manual Verify:**
  - Unique triplets summing to 0: [-1,-1,2] and [-1,0,1]

  `{ triplets: [[-1, -1, 2], [-1, 0, 1]], count: 2 }`

---

**`"SUBARRAY_SUM"`** — find number of subarrays that sum to `params.target`

- `params`: `{ target: number }`
- Use prefix sum + hash map technique
- `prefixSum[i]` = sum of nums[0..i]
- For each index, check if `prefixSum - target` exists in map
- Returns `{ target, count: numberOfSubarrays, subarrays: [[startIdx, endIdx], ...] }`

**Sample Input & Output:**

- `solveTwoSumPatterns([1, 1, 1], "SUBARRAY_SUM", { target: 2 })` →

  **Manual Verify:**
  - Subarrays summing to 2: [0,1] (1+1) and [1,2] (1+1)

  `{ target: 2, count: 2, subarrays: [[0, 1], [1, 2]] }`

---

| Challenge 📢 | Return the appropriate result based on `problemType`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------ |

---

## 🧩 PROBLEM–03: 🗂️ Grouping & Bucketing with Hash Maps

⚠️ **Function Name:** `solveGroupingPatterns()`

| Input      | `input` (any), `problemType` (string) |
| :--------- | :------------------------------------ |
| **Output** | object                                |

**Rules:**

`problemType` must be one of: `"GROUP_ANAGRAMS"`, `"TOP_K_FREQUENT"`, `"LONGEST_CONSECUTIVE"`

---

**`"GROUP_ANAGRAMS"`** — group an array of strings by anagram families

- `input` — non-empty array of strings
- Key = sorted characters of each string (anagrams share the same key)
- Returns `{ groups: object where key is sorted chars and value is array of strings, groupCount }`

**Sample Input & Output:**

- `solveGroupingPatterns(["eat","tea","tan","ate","nat","bat"], "GROUP_ANAGRAMS")` →

  `{
  groups: {
    "aet": ["eat", "tea", "ate"],
    "ant": ["tan", "nat"],
    "abt": ["bat"]
  },
  groupCount: 3
}`

---

**`"TOP_K_FREQUENT"`** — find top K most frequent elements

- `input` — object: `{ nums: array of integers, k: integer ≥ 1 }`
- Build frequency map, then sort by frequency descending
- If tie in frequency → sort by value ascending
- Returns `{ topK: array of k elements, frequencies: { value: count } for top k elements }`

**Sample Input & Output:**

- `solveGroupingPatterns({ nums: [1,1,1,2,2,3], k: 2 }, "TOP_K_FREQUENT")` →

  `{
  topK: [1, 2],
  frequencies: { "1": 3, "2": 2 }
}`

---

**`"LONGEST_CONSECUTIVE"`** — find the length of the longest consecutive sequence

- `input` — array of integers (unsorted, may have duplicates)
- Use a Set/Map for O(n) solution: only start counting from numbers where `num-1` is NOT in set
- Returns `{ longestStreak, sequence: array of the consecutive values in the streak }`

**Sample Input & Output:**

- `solveGroupingPatterns([100, 4, 200, 1, 3, 2], "LONGEST_CONSECUTIVE")` →

  **Manual Verify:**
  - Consecutive sequences: [1,2,3,4] (length 4), [100] (length 1), [200] (length 1)
  - longest: [1,2,3,4]

  `{ longestStreak: 4, sequence: [1, 2, 3, 4] }`

---

| Challenge 📢 | Return the appropriate result based on `problemType`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------ |

---

## 🧩 PROBLEM–04: 🪟 Sliding Window with Hash Map

⚠️ **Function Name:** `solveSlidingWindowMap()`

| Input      | `input` (any), `problemType` (string) |
| :--------- | :------------------------------------ |
| **Output** | object                                |

**Rules:**

`problemType` must be one of: `"LONGEST_UNIQUE_SUBSTR"`, `"MIN_WINDOW_SUBSTR"`, `"MAX_WINDOW_SUM"`

---

**`"LONGEST_UNIQUE_SUBSTR"`** — find the longest substring without repeating characters

- `input` — non-empty string
- Use sliding window + hash map: `{ char: lastSeenIndex }`
- When duplicate found → move `left` pointer to `lastSeenIndex + 1`
- Returns `{ input, longestLength, substring: the actual longest substring (first one if tie) }`

**Sample Input & Output:**

- `solveSlidingWindowMap("abcabcbb", "LONGEST_UNIQUE_SUBSTR")` →

  **Manual Verify:**
  - Window expands: a,b,c → then 'a' repeats → slide left
  - Longest: "abc" (length 3)

  `{ input: "abcabcbb", longestLength: 3, substring: "abc" }`

- `solveSlidingWindowMap("pwwkew", "LONGEST_UNIQUE_SUBSTR")` →

  `{ input: "pwwkew", longestLength: 3, substring: "wke" }`

---

**`"MIN_WINDOW_SUBSTR"`** — find the minimum window substring containing all chars of `params.pattern`

- `input` — object: `{ str: string, pattern: string }`
- Use sliding window with two frequency maps (pattern freq + window freq)
- Expand right until all pattern chars covered, then shrink left
- Returns `{ str, pattern, minWindow: string or null, windowLength: number or 0 }`

**Sample Input & Output:**

- `solveSlidingWindowMap({ str: "ADOBECODEBANC", pattern: "ABC" }, "MIN_WINDOW_SUBSTR")` →

  **Manual Verify:**
  - Minimum window containing A, B, C → "BANC" (length 4)

  `{ str: "ADOBECODEBANC", pattern: "ABC", minWindow: "BANC", windowLength: 4 }`

---

**`"MAX_WINDOW_SUM"`** — find maximum sum subarray of size `params.k`

- `input` — object: `{ nums: array of numbers, k: integer ≥ 1 }`
- Use sliding window (fixed size k): maintain running sum
- Track which window (start index) gives max sum
- Returns `{ k, maxSum, windowStart: startIndex, windowEnd: endIndex, window: subarray }`

**Sample Input & Output:**

- `solveSlidingWindowMap({ nums: [2, 1, 5, 1, 3, 2], k: 3 }, "MAX_WINDOW_SUM")` →

  **Manual Verify:**
  - Window [2,1,5]=8, [1,5,1]=7, [5,1,3]=9, [1,3,2]=6
  - Max=9 at index 2→4

  `{ k: 3, maxSum: 9, windowStart: 2, windowEnd: 4, window: [5, 1, 3] }`

---

| Challenge 📢 | Return the appropriate result based on `problemType`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------ |

---

## 🧩 PROBLEM–05: 🏗️ Hash Map Full Challenge

⚠️ **Function Name:** `runHashMapChallenge()`

| Input      | `challengeConfig` (object) |
| :--------- | :-------------------------- |
| **Output** | object                      |

**Rules:**

`challengeConfig` object:

- `challengeId` (string, non-empty)
- `problems` (array of objects) — each problem to solve:
  - `type` (string: `"CHAR_FREQUENCY"`, `"TWO_SUM"`, `"GROUP_ANAGRAMS"`, `"TOP_K_FREQUENT"`, `"LONGEST_UNIQUE_SUBSTR"`, `"SUBARRAY_SUM"`)
  - `input` (any) — problem input
  - `params` (object or null) — extra params if needed

**Orchestration Rules (compose all previous concepts):**

1. Solve each problem using the appropriate logic from Problems 01–04
2. Build `problemLog` → array of `{ type, input, params, result }` for each problem
3. Build `summary`:
   - `totalProblems` → count
   - `successCount` → problems that returned a valid result (not error)
   - `patternUsage` → object counting how many times each pattern category was used:
     - `"frequencyCounter"` → CHAR_FREQUENCY, ANAGRAM_CHECK, FIRST_UNIQUE
     - `"twoPointer"` → TWO_SUM, THREE_SUM, SUBARRAY_SUM
     - `"grouping"` → GROUP_ANAGRAMS, TOP_K_FREQUENT, LONGEST_CONSECUTIVE
     - `"slidingWindow"` → LONGEST_UNIQUE_SUBSTR, MIN_WINDOW_SUBSTR, MAX_WINDOW_SUM

**Validation:** invalid `challengeConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ challengeId, problemLog, summary }`. |
| :----------- | :--------------------------------------------- |

**Sample Input & Output:**

- `runHashMapChallenge({
  challengeId: "HM-01",
  problems: [
    { type: "CHAR_FREQUENCY", input: "hello", params: null },
    { type: "TWO_SUM", input: [2, 7, 11, 15], params: { target: 9 } },
    { type: "GROUP_ANAGRAMS", input: ["eat", "tea", "tan", "ate"], params: null },
    { type: "LONGEST_UNIQUE_SUBSTR", input: "abcabcbb", params: null }
  ]
})` →

  **Manual Verify:**
  - CHAR_FREQUENCY("hello"): h:1,e:1,l:2,o:1 → mostFrequent:"l"(2), leastFrequent:"e"(1)
  - TWO_SUM([2,7,11,15], 9): indices [0,1]
  - GROUP_ANAGRAMS: { "aet":["eat","tea","ate"], "ant":["tan"] }
  - LONGEST_UNIQUE_SUBSTR("abcabcbb"): "abc" length 3
  - patternUsage: frequencyCounter:1, twoPointer:1, grouping:1, slidingWindow:1

  `{
  challengeId: "HM-01",
  problemLog: [
    { type: "CHAR_FREQUENCY", input: "hello", params: null, result: { input: "hello", frequencyMap: { h:1, e:1, l:2, o:1 }, mostFrequent: { char: "l", count: 2 }, leastFrequent: { char: "e", count: 1 }, uniqueChars: 4 } },
    { type: "TWO_SUM", input: [2,7,11,15], params: { target: 9 }, result: { target: 9, indices: [0,1] } },
    { type: "GROUP_ANAGRAMS", input: ["eat","tea","tan","ate"], params: null, result: { groups: { "aet": ["eat","tea","ate"], "ant": ["tan"] }, groupCount: 2 } },
    { type: "LONGEST_UNIQUE_SUBSTR", input: "abcabcbb", params: null, result: { input: "abcabcbb", longestLength: 3, substring: "abc" } }
  ],
  summary: {
    totalProblems: 4,
    successCount: 4,
    patternUsage: {
      frequencyCounter: 1,
      twoPointer: 1,
      grouping: 1,
      slidingWindow: 1
    }
  }
}`

---