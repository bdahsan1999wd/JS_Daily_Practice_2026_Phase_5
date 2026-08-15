// 🧩 PROBLEM–03: solveGroupingPatterns()

// Logic: Implements three grouping and bucketing patterns:
// 1. GROUP_ANAGRAMS       — group strings by anagram family
// 2. TOP_K_FREQUENT       — find top K most frequent elements
// 3. LONGEST_CONSECUTIVE  — find longest consecutive sequence

function solveGroupingPatterns(input, problemType) {

    // --- STEP 1: VALIDATE problemType ---

    if (
        typeof problemType !== "string" ||
        problemType.trim() === ""
    ) {
        return "Invalid Input";
    }

    if (
        problemType !== "GROUP_ANAGRAMS" &&
        problemType !== "TOP_K_FREQUENT" &&
        problemType !== "LONGEST_CONSECUTIVE"
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: GROUP ANAGRAMS ---

    if (problemType === "GROUP_ANAGRAMS") {

        // input must be a non-empty array of non-empty strings.

        if (
            !Array.isArray(input) ||
            input.length === 0 ||
            !input.every(
                s => typeof s === "string" && s.length > 0
            )
        ) {
            return "Invalid Input";
        }

        // --- BUILD ANAGRAM GROUPS ---
        // Key insight: two strings are anagrams if and only if
        // their sorted characters are identical.
        //
        // For each string:
        //   1. Sort its characters → this is the group key.
        //   2. Push the original string into groups[key].
        //
        // Example:
        //   "eat" → sorted → "aet"
        //   "tea" → sorted → "aet"  ← same key, same group
        //   "tan" → sorted → "ant"  ← different key, new group

        const groups = {};

        for (const word of input) {

            // Sort characters of the word to get its canonical key.

            const key = word.split("").sort().join("");

            // If this key doesn't exist yet, initialize its group array.

            if (groups[key] === undefined) {
                groups[key] = [];
            }

            // Add the original word to its anagram group.

            groups[key].push(word);
        }

        // groupCount = number of distinct anagram families found.

        const groupCount = Object.keys(groups).length;

        // --- GROUP_ANAGRAMS RESULT ---

        return {
            groups,
            groupCount
        };
    }

    // --- STEP 3: TOP K FREQUENT ---

    if (problemType === "TOP_K_FREQUENT") {

        // input must be an object with:
        //   nums → non-empty array of integers
        //   k    → positive integer

        if (
            typeof input !== "object" ||
            input === null ||
            Array.isArray(input) ||
            !Array.isArray(input.nums) ||
            input.nums.length === 0 ||
            !input.nums.every(
                n => typeof n === "number" && Number.isInteger(n)
            )
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

        // --- BUILD FREQUENCY MAP ---
        // Count how many times each value appears in nums.

        const freqMap = {};

        for (const num of nums) {
            freqMap[num] = (freqMap[num] ?? 0) + 1;
        }

        // --- SORT BY FREQUENCY ---
        // Convert frequency map entries to an array and sort:
        //   Primary   → frequency descending (highest count first)
        //   Secondary → value ascending (smaller value first on tie)

        const sorted = Object.entries(freqMap).sort((a, b) => {

            // a[0] = value (string key), a[1] = count
            // b[0] = value (string key), b[1] = count

            if (b[1] !== a[1]) return b[1] - a[1];

            // Tie in frequency → sort by numeric value ascending.

            return Number(a[0]) - Number(b[0]);
        });

        // Take the top K entries.

        const topKEntries = sorted.slice(0, k);

        // topK → array of the K most frequent values (as numbers).

        const topK = topKEntries.map(entry => Number(entry[0]));

        // frequencies → { value: count } only for the top K elements.

        const frequencies = {};

        for (const [val, count] of topKEntries) {
            frequencies[val] = count;
        }

        // --- TOP_K_FREQUENT RESULT ---

        return {
            topK,
            frequencies
        };
    }

    // --- STEP 4: LONGEST CONSECUTIVE ---

    if (problemType === "LONGEST_CONSECUTIVE") {

        // input must be a non-empty array of integers.
        // Duplicates are allowed.

        if (
            !Array.isArray(input) ||
            input.length === 0 ||
            !input.every(
                n => typeof n === "number" && Number.isInteger(n)
            )
        ) {
            return "Invalid Input";
        }

        // --- BUILD A SET FOR O(1) LOOKUPS ---
        // Storing all values in a Set lets us check existence instantly
        // without sorting the array (which would be O(n log n)).

        const numSet = new Set(input);

        let longestStreak = 0;
        let bestSequence = [];

        // --- FIND CONSECUTIVE SEQUENCES ---
        // Key insight: only START counting from numbers where
        // (num - 1) is NOT in the set.
        //
        // Why? If (num - 1) exists, then `num` is not the beginning
        // of a sequence — it's a continuation of a longer one.
        // Starting only from sequence beginnings avoids redundant work
        // and keeps the algorithm O(n).


        for (const num of numSet) {

            // Only process numbers that are the START of a sequence.

            if (!numSet.has(num - 1)) {

                let currentNum = num;
                let currentStreak = 0;
                const sequence = [];

                // Extend the sequence as far as consecutive numbers exist.

                while (numSet.has(currentNum)) {
                    sequence.push(currentNum);
                    currentStreak++;
                    currentNum++;
                }

                // Update best if this sequence is longer.

                if (currentStreak > longestStreak) {
                    longestStreak = currentStreak;
                    bestSequence = sequence;
                }
            }
        }

        // --- LONGEST_CONSECUTIVE RESULT ---

        return {
            longestStreak,
            sequence: bestSequence
        };
    }
}


// ------ EXAMPLE USAGE ------

// --- GROUP_ANAGRAMS ---
console.log(solveGroupingPatterns(
    ["eat", "tea", "tan", "ate", "nat", "bat"],
    "GROUP_ANAGRAMS"
));


// --- TOP_K_FREQUENT ---
console.log(solveGroupingPatterns(
    { nums: [1, 1, 1, 2, 2, 3], k: 2 },
    "TOP_K_FREQUENT"
));


// --- TOP_K_FREQUENT: tie in frequency ---
console.log(solveGroupingPatterns(
    { nums: [1, 2, 3, 1, 2, 3], k: 2 },
    "TOP_K_FREQUENT"
));

// --- LONGEST_CONSECUTIVE ---
console.log(solveGroupingPatterns(
    [100, 4, 200, 1, 3, 2],
    "LONGEST_CONSECUTIVE"
));


// --- LONGEST_CONSECUTIVE: with duplicates ---
console.log(solveGroupingPatterns(
    [0, 3, 7, 2, 5, 8, 4, 6, 0, 1],
    "LONGEST_CONSECUTIVE"
));


// --- INVALID: empty array ---
console.log(solveGroupingPatterns([], "GROUP_ANAGRAMS"));


// --- INVALID: k larger than nums length ---
console.log(solveGroupingPatterns({ nums: [1, 2], k: 5 }, "TOP_K_FREQUENT"));


// --- INVALID: wrong problemType ---
console.log(solveGroupingPatterns([1, 2, 3], "BUCKET_SORT"));