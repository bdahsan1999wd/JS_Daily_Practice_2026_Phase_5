// 🧩 PROBLEM–04: solveSlidingWindowMap()

// Logic: Implements three sliding window + hash map patterns:
// 1. LONGEST_UNIQUE_SUBSTR — longest substring without repeating characters
// 2. MIN_WINDOW_SUBSTR     — smallest window containing all chars of a pattern
// 3. MAX_WINDOW_SUM        — max sum subarray of fixed size k

function solveSlidingWindowMap(input, problemType) {

    // --- STEP 1: VALIDATE problemType ---

    if (
        typeof problemType !== "string" ||
        problemType.trim() === ""
    ) {
        return "Invalid Input";
    }

    if (
        problemType !== "LONGEST_UNIQUE_SUBSTR" &&
        problemType !== "MIN_WINDOW_SUBSTR" &&
        problemType !== "MAX_WINDOW_SUM"
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: LONGEST UNIQUE SUBSTRING ---

    if (problemType === "LONGEST_UNIQUE_SUBSTR") {

        // input must be a non-empty string.

        if (
            typeof input !== "string" ||
            input.length === 0
        ) {
            return "Invalid Input";
        }

        // --- SLIDING WINDOW TECHNIQUE ---
        //
        // Key insight:
        //   Maintain a window [left, right] that always contains
        //   only unique characters.

        //   Map lastSeen stores { char: lastIndex where char appeared }.
        //   When we hit a duplicate char, we slide `left` to just
        //   after that char's previous occurrence.

        const lastSeen = {};
        let left = 0;
        let longest = 0;
        let bestStart = 0;

        for (let right = 0; right < input.length; right++) {

            const char = input[right];

            // If this char was seen inside the current window,
            // move `left` just past its previous occurrence.

            if (
                lastSeen[char] !== undefined &&
                lastSeen[char] >= left
            ) {
                left = lastSeen[char] + 1;
            }

            // Record/update the last seen index of this char.

            lastSeen[char] = right;

            // Current window length = right - left + 1.
            // Track the longest window and where it started.

            if (right - left + 1 > longest) {
                longest = right - left + 1;
                bestStart = left;
            }
        }

        // Slice the actual longest substring from the input.

        const substring = input.slice(bestStart, bestStart + longest);

        // --- LONGEST_UNIQUE_SUBSTR RESULT ---

        return {
            input,
            longestLength: longest,
            substring
        };
    }

    // --- STEP 3: MINIMUM WINDOW SUBSTRING ---

    if (problemType === "MIN_WINDOW_SUBSTR") {

        // input must be an object with non-empty strings str and pattern.

        if (
            typeof input !== "object" ||
            input === null ||
            Array.isArray(input) ||
            typeof input.str !== "string" ||
            input.str.length === 0 ||
            typeof input.pattern !== "string" ||
            input.pattern.length === 0
        ) {
            return "Invalid Input";
        }

        const { str, pattern } = input;

        // --- TWO FREQUENCY MAPS TECHNIQUE ---
        //
        // freqPattern: count of each character in `pattern`.
        // freqWindow:  count of each character currently inside the window.
        //
        // required = number of DISTINCT characters in pattern.
        // formed   = number of distinct characters whose count inside the
        //            window is >= its required count.
        //
        // Expand `right` until formed === required (window has all chars).
        // Then shrink `left` as much as possible while still keeping
        // formed === required. Track the smallest valid window.

        const freqPattern = {};

        for (const char of pattern) {
            freqPattern[char] = (freqPattern[char] ?? 0) + 1;
        }

        const required = Object.keys(freqPattern).length;

        const freqWindow = {};
        let formed = 0;
        let left = 0;
        let minLength = Infinity;
        let bestStart = -1;

        for (let right = 0; right < str.length; right++) {

            // Expand window to include str[right].

            const addChar = str[right];
            freqWindow[addChar] = (freqWindow[addChar] ?? 0) + 1;

            // If this char is needed and its count just reached the
            // required count → one more distinct char is fully covered.

            if (
                freqPattern[addChar] !== undefined &&
                freqWindow[addChar] === freqPattern[addChar]
            ) {
                formed++;
            }

            // Try to shrink from the left while the window is still valid.

            while (formed === required) {

                // Update best window if this one is smaller.

                if (right - left + 1 < minLength) {
                    minLength = right - left + 1;
                    bestStart = left;
                }

                // Remove str[left] from the window.

                const removeChar = str[left];
                freqWindow[removeChar]--;

                // If a required char's count drops below its needed count,
                // this distinct char is no longer fully covered.

                if (
                    freqPattern[removeChar] !== undefined &&
                    freqWindow[removeChar] < freqPattern[removeChar]
                ) {
                    formed--;
                }

                left++;
            }
        }

        // If no valid window was found → minWindow null, windowLength 0.

        if (bestStart === -1) {
            return {
                str,
                pattern,
                minWindow: null,
                windowLength: 0
            };
        }

        // --- MIN_WINDOW_SUBSTR RESULT ---

        const minWindow = str.slice(bestStart, bestStart + minLength);

        return {
            str,
            pattern,
            minWindow,
            windowLength: minLength
        };
    }

    // --- STEP 4: MAX WINDOW SUM ---

    if (problemType === "MAX_WINDOW_SUM") {

        // input must be an object with:
        //   nums → non-empty array of numbers
        //   k    → positive integer

        if (
            typeof input !== "object" ||
            input === null ||
            Array.isArray(input) ||
            !Array.isArray(input.nums) ||
            input.nums.length === 0
        ) {
            return "Invalid Input";
        }

        const { nums, k } = input;

        if (
            typeof k !== "number" ||
            !Number.isInteger(k) ||
            k < 1 ||
            k > nums.length
        ) {
            return "Invalid Input";
        }

        // --- FIXED-SIZE SLIDING WINDOW ---
        //
        // Compute the sum of the first k elements, then slide:
        //   windowSum = windowSum - nums[left] + nums[right]
        // Each slide keeps a running sum of the current window of size k.
        // Track which window gives the maximum sum.

        let windowSum = 0;

        for (let i = 0; i < k; i++) {
            windowSum += nums[i];
        }

        let maxSum = windowSum;
        let windowStart = 0;
        let windowEnd = k - 1;

        for (let right = k; right < nums.length; right++) {

            // Slide the window: drop leftmost element, add new element.

            windowSum += nums[right] - nums[right - k];

            // Update max if this window's sum is larger.

            if (windowSum > maxSum) {
                maxSum = windowSum;
                windowStart = right - k + 1;
                windowEnd = right;
            }
        }

        // Slice the winning subarray.

        const window = nums.slice(windowStart, windowEnd + 1);

        // --- MAX_WINDOW_SUM RESULT ---

        return {
            k,
            maxSum,
            windowStart,
            windowEnd,
            window
        };
    }
}


// ------ EXAMPLE USAGE ------

// --- LONGEST_UNIQUE_SUBSTR ---
console.log(solveSlidingWindowMap("abcabcbb", "LONGEST_UNIQUE_SUBSTR"));


// --- LONGEST_UNIQUE_SUBSTR: another case ---
console.log(solveSlidingWindowMap("pwwkew", "LONGEST_UNIQUE_SUBSTR"));


// --- MIN_WINDOW_SUBSTR ---
console.log(solveSlidingWindowMap(
    { str: "ADOBECODEBANC", pattern: "ABC" },
    "MIN_WINDOW_SUBSTR"
));


// --- MIN_WINDOW_SUBSTR: no window ---
console.log(solveSlidingWindowMap(
    { str: "a", pattern: "ab" },
    "MIN_WINDOW_SUBSTR"
));


// --- MAX_WINDOW_SUM ---
console.log(solveSlidingWindowMap(
    { nums: [2, 1, 5, 1, 3, 2], k: 3 },
    "MAX_WINDOW_SUM"
));


// --- INVALID: wrong problemType ---
console.log(solveSlidingWindowMap("abc", "WINDOW_SLIDE"));


// --- INVALID: empty string ---
console.log(solveSlidingWindowMap("", "LONGEST_UNIQUE_SUBSTR"));


// --- INVALID: k larger than nums length ---
console.log(solveSlidingWindowMap(
    { nums: [1, 2], k: 5 },
    "MAX_WINDOW_SUM"
));