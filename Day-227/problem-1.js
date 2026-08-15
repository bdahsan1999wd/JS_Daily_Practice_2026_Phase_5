// 🧩 PROBLEM–01: solveFrequencyCounter()

// Logic: Implements three frequency counter patterns:
// 1. CHAR_FREQUENCY — character frequency map of a string
// 2. ANAGRAM_CHECK  — checks if two strings are anagrams
// 3. FIRST_UNIQUE   — finds first non-repeating character

function solveFrequencyCounter(input, problemType) {

    // --- STEP 1: VALIDATE problemType ---

    if (
        typeof problemType !== "string" ||
        problemType.trim() === ""
    ) {
        return "Invalid Input";
    }

    if (
        problemType !== "CHAR_FREQUENCY" &&
        problemType !== "ANAGRAM_CHECK" &&
        problemType !== "FIRST_UNIQUE"
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: CHAR FREQUENCY ---

    if (problemType === "CHAR_FREQUENCY") {

        // input must be a non-empty string.

        if (
            typeof input !== "string" ||
            input.length === 0
        ) {
            return "Invalid Input";
        }

        // --- BUILD FREQUENCY MAP ---
        // Iterate through each character and count occurrences.

        const frequencyMap = {};

        for (const char of input) {
            frequencyMap[char] = (frequencyMap[char] ?? 0) + 1;
        }

        // --- FIND mostFrequent & leastFrequent ---
        // Rules:
        //   mostFrequent  → highest count, first alphabetically if tie
        //   leastFrequent → lowest count,  first alphabetically if tie

        const entries = Object.entries(frequencyMap);

        // Sort entries: primary → count descending, secondary → char ascending.
        // This way entries[0] = mostFrequent after sort.

        const sortedDesc = [...entries].sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return a[0].localeCompare(b[0]);
        });

        // Sort entries: primary → count ascending, secondary → char ascending.
        // This way entries[0] = leastFrequent after sort.

        const sortedAsc = [...entries].sort((a, b) => {
            if (a[1] !== b[1]) return a[1] - b[1];
            return a[0].localeCompare(b[0]);
        });

        const mostFrequent = { char: sortedDesc[0][0], count: sortedDesc[0][1] };
        const leastFrequent = { char: sortedAsc[0][0], count: sortedAsc[0][1] };

        // uniqueChars = number of distinct characters (keys in frequencyMap).

        const uniqueChars = entries.length;

        // --- CHAR_FREQUENCY RESULT ---
        return {
            input,
            frequencyMap,
            mostFrequent,
            leastFrequent,
            uniqueChars
        };
    }

    // --- STEP 3: ANAGRAM CHECK ---

    if (problemType === "ANAGRAM_CHECK") {

        // input must be an object with str1 and str2 as non-empty strings.

        if (
            typeof input !== "object" ||
            input === null ||
            Array.isArray(input) ||
            typeof input.str1 !== "string" ||
            typeof input.str2 !== "string" ||
            input.str1.length === 0 ||
            input.str2.length === 0
        ) {
            return "Invalid Input";
        }

        const { str1, str2 } = input;

        // Quick check: different lengths → cannot be anagrams.

        if (str1.length !== str2.length) {
            return {
                str1,
                str2,
                isAnagram: false,
                reason: "Different lengths"
            };
        }

        // --- BUILD FREQUENCY MAP FOR str1 ---

        const freq1 = {};

        for (const char of str1) {
            freq1[char] = (freq1[char] ?? 0) + 1;
        }

        // --- COMPARE AGAINST str2 ---
        // For each character in str2, decrement its count in freq1.
        // If a character is missing or count drops below 0 → mismatch.

        const freq2 = {};

        for (const char of str2) {
            freq2[char] = (freq2[char] ?? 0) + 1;
        }

        for (const char of Object.keys(freq2)) {
            if (freq1[char] !== freq2[char]) {
                return {
                    str1,
                    str2,
                    isAnagram: false,
                    reason: "Character mismatch"
                };
            }
        }

        // --- ANAGRAM_CHECK RESULT ---

        return {
            str1,
            str2,
            isAnagram: true,
            reason: null
        };
    }

    // --- STEP 4: FIRST UNIQUE ---

    if (problemType === "FIRST_UNIQUE") {

        // input must be a non-empty string.

        if (
            typeof input !== "string" ||
            input.length === 0
        ) {
            return "Invalid Input";
        }

        // --- PASS 1: BUILD FREQUENCY MAP ---
        // Count how many times each character appears.

        const frequencyMap = {};

        for (const char of input) {
            frequencyMap[char] = (frequencyMap[char] ?? 0) + 1;
        }

        // --- PASS 2: FIND FIRST UNIQUE ---
        // Scan the string from left to right.
        // First character whose count in frequencyMap is exactly 1 is the answer.
        // Position is 1-based index.

        for (let i = 0; i < input.length; i++) {
            if (frequencyMap[input[i]] === 1) {
                return {
                    input,
                    firstUnique: input[i],
                    position: i + 1
                };
            }
        }

        // No unique character found.

        return {
            input,
            firstUnique: null,
            position: null
        };
    }
}


// ------ EXAMPLE USAGE ------

// --- CHAR_FREQUENCY ---
console.log(solveFrequencyCounter("javascript", "CHAR_FREQUENCY"));


// --- ANAGRAM_CHECK: true case ---
console.log(solveFrequencyCounter({ str1: "listen", str2: "silent" }, "ANAGRAM_CHECK"));


// --- ANAGRAM_CHECK: false case ---
console.log(solveFrequencyCounter({ str1: "hello", str2: "world" }, "ANAGRAM_CHECK"));


// --- ANAGRAM_CHECK: different lengths ---
console.log(solveFrequencyCounter({ str1: "abc", str2: "ab" }, "ANAGRAM_CHECK"));


// --- FIRST_UNIQUE: found ---
console.log(solveFrequencyCounter("aabbcdeeff", "FIRST_UNIQUE"));


// --- FIRST_UNIQUE: not found ---
console.log(solveFrequencyCounter("aabbcc", "FIRST_UNIQUE"));


// --- INVALID: wrong problemType ---
console.log(solveFrequencyCounter("hello", "WORD_COUNT"));


// --- INVALID: empty string ---
console.log(solveFrequencyCounter("", "CHAR_FREQUENCY"));