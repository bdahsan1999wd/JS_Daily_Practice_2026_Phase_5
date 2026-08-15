// 🧩 PROBLEM–05: runHashMapChallenge()

// Logic: Orchestrates all hash map patterns from Problems 01–04:

//   CHAR_FREQUENCY / TWO_SUM / GROUP_ANAGRAMS /
//   TOP_K_FREQUENT / LONGEST_UNIQUE_SUBSTR / SUBARRAY_SUM
//   Builds a problemLog (each solved problem + its result)
//   Builds a summary with totalProblems, successCount and
//   patternUsage (how many times each pattern category was used)

function runHashMapChallenge(challengeConfig) {

    // --- STEP 1: VALIDATE challengeConfig ---

    if (
        typeof challengeConfig !== "object" ||
        challengeConfig === null ||
        Array.isArray(challengeConfig)
    ) {
        return "Invalid Input";
    }

    const { challengeId, problems } = challengeConfig;

    if (
        typeof challengeId !== "string" ||
        challengeId.trim() === "" ||
        !Array.isArray(problems) ||
        problems.length === 0
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: SOLVE EACH PROBLEM ---

    // Each problem in `problems` has:
    //   type   (string)
    //   input  (any)
    //   params (object or null)

    // We dispatch to the matching solver below. If a problem's own
    // input is invalid, its result becomes "Invalid Input".

    const problemLog = [];
    let successCount = 0;

    const patternUsage = {
        frequencyCounter: 0,
        twoPointer: 0,
        grouping: 0,
        slidingWindow: 0
    };

    for (const problem of problems) {

        if (
            typeof problem !== "object" ||
            problem === null ||
            Array.isArray(problem) ||
            typeof problem.type !== "string"
        ) {
            return "Invalid Input";
        }

        const { type, input, params } = problem;

        // Count this problem under its pattern category.

        if (
            type === "CHAR_FREQUENCY" ||
            type === "ANAGRAM_CHECK" ||
            type === "FIRST_UNIQUE"
        ) {
            patternUsage.frequencyCounter++;
        } else if (
            type === "TWO_SUM" ||
            type === "THREE_SUM" ||
            type === "SUBARRAY_SUM"
        ) {
            patternUsage.twoPointer++;
        } else if (
            type === "GROUP_ANAGRAMS" ||
            type === "TOP_K_FREQUENT" ||
            type === "LONGEST_CONSECUTIVE"
        ) {
            patternUsage.grouping++;
        } else if (
            type === "LONGEST_UNIQUE_SUBSTR" ||
            type === "MIN_WINDOW_SUBSTR" ||
            type === "MAX_WINDOW_SUM"
        ) {
            patternUsage.slidingWindow++;
        } else {
            return "Invalid Input";
        }

        // Solve the individual problem.

        const result = solveProblem(type, input, params);

        // Track problems that produced a real result (not an error).

        if (result !== "Invalid Input") {
            successCount++;
        }

        problemLog.push({
            type,
            input,
            params: params ?? null,
            result
        });
    }

    // --- STEP 3: BUILD SUMMARY ---

    const summary = {
        totalProblems: problems.length,
        successCount,
        patternUsage
    };

    // --- ORCHESTRATOR RESULT ---

    return {
        challengeId,
        problemLog,
        summary
    };
}

// Internal dispatcher: solves a single problem by its type.
// Reuses the exact same logic as Problems 01–04.

function solveProblem(type, input, params) {

    // --- CHAR_FREQUENCY (from Problem 01) ---

    if (type === "CHAR_FREQUENCY") {

        if (typeof input !== "string" || input.length === 0) {
            return "Invalid Input";
        }

        const frequencyMap = {};

        for (const char of input) {
            frequencyMap[char] = (frequencyMap[char] ?? 0) + 1;
        }

        const entries = Object.entries(frequencyMap);

        const sortedDesc = [...entries].sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return a[0].localeCompare(b[0]);
        });

        const sortedAsc = [...entries].sort((a, b) => {
            if (a[1] !== b[1]) return a[1] - b[1];
            return a[0].localeCompare(b[0]);
        });

        return {
            input,
            frequencyMap,
            mostFrequent: { char: sortedDesc[0][0], count: sortedDesc[0][1] },
            leastFrequent: { char: sortedAsc[0][0], count: sortedAsc[0][1] },
            uniqueChars: entries.length
        };
    }

    // --- TWO_SUM (from Problem 02) ---

    if (type === "TWO_SUM") {

        if (
            !Array.isArray(input) ||
            input.length === 0 ||
            !input.every(n => typeof n === "number" && Number.isInteger(n))
        ) {
            return "Invalid Input";
        }

        if (
            typeof params !== "object" ||
            params === null ||
            Array.isArray(params) ||
            typeof params.target !== "number"
        ) {
            return "Invalid Input";
        }

        const { target } = params;
        const seen = {};

        for (let i = 0; i < input.length; i++) {
            const num = input[i];
            const complement = target - num;

            if (seen[complement] !== undefined) {
                return {
                    target,
                    indices: [seen[complement], i]
                };
            }

            seen[num] = i;
        }

        return {
            target,
            indices: null,
            reason: "No pair found"
        };
    }

    // --- SUBARRAY_SUM (from Problem 02) ---

    if (type === "SUBARRAY_SUM") {

        if (
            !Array.isArray(input) ||
            input.length === 0 ||
            !input.every(n => typeof n === "number" && Number.isInteger(n))
        ) {
            return "Invalid Input";
        }

        if (
            typeof params !== "object" ||
            params === null ||
            Array.isArray(params) ||
            typeof params.target !== "number"
        ) {
            return "Invalid Input";
        }

        const { target } = params;

        const prefixMap = { 0: [-1] };
        const subarrays = [];
        let prefixSum = 0;
        let count = 0;

        for (let j = 0; j < input.length; j++) {

            prefixSum += input[j];
            const needed = prefixSum - target;

            if (prefixMap[needed] !== undefined) {
                for (const i of prefixMap[needed]) {
                    subarrays.push([i + 1, j]);
                    count++;
                }
            }

            if (prefixMap[prefixSum] === undefined) {
                prefixMap[prefixSum] = [];
            }

            prefixMap[prefixSum].push(j);
        }

        return {
            target,
            count,
            subarrays
        };
    }

    // --- GROUP_ANAGRAMS (from Problem 03) ---

    if (type === "GROUP_ANAGRAMS") {

        if (
            !Array.isArray(input) ||
            input.length === 0 ||
            !input.every(s => typeof s === "string" && s.length > 0)
        ) {
            return "Invalid Input";
        }

        const groups = {};

        for (const word of input) {
            const key = word.split("").sort().join("");

            if (groups[key] === undefined) {
                groups[key] = [];
            }

            groups[key].push(word);
        }

        return {
            groups,
            groupCount: Object.keys(groups).length
        };
    }

    // --- TOP_K_FREQUENT (from Problem 03) ---

    if (type === "TOP_K_FREQUENT") {

        if (
            typeof input !== "object" ||
            input === null ||
            Array.isArray(input) ||
            !Array.isArray(input.nums) ||
            input.nums.length === 0 ||
            !input.nums.every(n => typeof n === "number" && Number.isInteger(n))
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

        const freqMap = {};

        for (const num of nums) {
            freqMap[num] = (freqMap[num] ?? 0) + 1;
        }

        const sorted = Object.entries(freqMap).sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return Number(a[0]) - Number(b[0]);
        });

        const topKEntries = sorted.slice(0, k);
        const topK = topKEntries.map(entry => Number(entry[0]));
        const frequencies = {};

        for (const [val, count] of topKEntries) {
            frequencies[val] = count;
        }

        return {
            topK,
            frequencies
        };
    }

    // --- LONGEST_UNIQUE_SUBSTR (from Problem 04) ---

    if (type === "LONGEST_UNIQUE_SUBSTR") {

        if (typeof input !== "string" || input.length === 0) {
            return "Invalid Input";
        }

        const lastSeen = {};
        let left = 0;
        let longest = 0;
        let bestStart = 0;

        for (let right = 0; right < input.length; right++) {

            const char = input[right];

            if (lastSeen[char] !== undefined && lastSeen[char] >= left) {
                left = lastSeen[char] + 1;
            }

            lastSeen[char] = right;

            if (right - left + 1 > longest) {
                longest = right - left + 1;
                bestStart = left;
            }
        }

        return {
            input,
            longestLength: longest,
            substring: input.slice(bestStart, bestStart + longest)
        };
    }

    // Unknown / unsupported type → treated as an invalid problem.

    return "Invalid Input";
}


// ------ EXAMPLE USAGE ------

// --- Full challenge (matches readme sample) ---
console.log(runHashMapChallenge({
    challengeId: "HM-01",
    problems: [
        { type: "CHAR_FREQUENCY", input: "hello", params: null },
        { type: "TWO_SUM", input: [2, 7, 11, 15], params: { target: 9 } },
        { type: "GROUP_ANAGRAMS", input: ["eat", "tea", "tan", "ate"], params: null },
        { type: "LONGEST_UNIQUE_SUBSTR", input: "abcabcbb", params: null }
    ]
}));


// --- Challenge with a failing problem ---
console.log(runHashMapChallenge({
    challengeId: "HM-02",
    problems: [
        { type: "TOP_K_FREQUENT", input: { nums: [1, 1, 1, 2, 2, 3], k: 2 }, params: null },
        { type: "SUBARRAY_SUM", input: [1, 1, 1], params: { target: 2 } },
        { type: "CHAR_FREQUENCY", input: 12345, params: null }
    ]
}));

// --- INVALID: empty problems array ---
console.log(runHashMapChallenge({ challengeId: "HM-03", problems: [] }));


// --- INVALID: unknown problem type ---
console.log(runHashMapChallenge({
    challengeId: "HM-04",
    problems: [{ type: "BUCKET_SORT", input: [1], params: null }]
}));


// --- INVALID: missing challengeId ---
console.log(runHashMapChallenge({ problems: [{ type: "TWO_SUM", input: [1, 2], params: { target: 3 } }] }));