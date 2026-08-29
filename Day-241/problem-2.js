// 🧩 PROBLEM–02: createBTreeIndex()

// Logic: Simulates a B-tree using a sorted array of { value, _id } pairs.

//   rangeSearch  — min <= field <= max (null = unbounded), binary search
//   exactSearch  — exact value lookup
//   prefixSearch — case-insensitive prefix match for string fields
//   getMin/getMax/getNth/getIndexSize


function createBTreeIndex(collection, fieldName) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        !Array.isArray(collection) ||
        collection.length === 0 ||
        !collection.every(doc => typeof doc === "object" && doc !== null && !Array.isArray(doc)) ||
        !collection.every(doc => doc[fieldName] !== undefined) ||
        typeof fieldName !== "string" ||
        fieldName.length === 0
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: BUILD SORTED STRUCTURE ---

    const sorted = collection
        .map(doc => ({ value: doc[fieldName], _id: doc._id }))
        .sort((a, b) => {
            if (a.value < b.value) return -1;
            if (a.value > b.value) return 1;
            return 0;
        });

    // --- STEP 3: HELPERS ---

    function findDocById(id) {
        return collection.find(doc => doc._id === id) || null;
    }

    function binarySearch(target, isMin) {

        // Find first index where condition holds.

        let lo = 0;
        let hi = sorted.length;

        while (lo < hi) {

            const mid = Math.floor((lo + hi) / 2);

            const cmp = isMin ? sorted[mid].value < target : sorted[mid].value > target;

            if (cmp) lo = mid + 1;
            else hi = mid;
        }

        return lo;
    }

    // --- STEP 4: PUBLIC API ---

    return {

        rangeSearch(min, max) {

            const start = min === null || min === undefined ? 0 : binarySearch(min, true);
            const end = max === null || max === undefined ? sorted.length : binarySearch(max, false);

            const matches = [];

            for (let i = start; i < end; i++) {

                const value = sorted[i].value;

                if (min !== null && min !== undefined && value < min) continue;
                if (max !== null && max !== undefined && value > max) continue;

                matches.push(findDocById(sorted[i]._id));
            }

            return {
                min,
                max,
                results: matches,
                count: matches.length,
                scanType: "RANGE_SCAN"
            };
        },

        exactSearch(value) {

            const matches = sorted
                .filter(pair => pair.value === value)
                .map(pair => findDocById(pair._id));

            return { value, results: matches, count: matches.length, scanType: "INDEX_SCAN" };
        },

        prefixSearch(prefix) {

            if (typeof prefix !== "string") return "Invalid Input";

            const lower = prefix.toLowerCase();

            const matches = [];

            for (const doc of collection) {

                const value = doc[fieldName];

                if (typeof value === "string" && value.toLowerCase().startsWith(lower)) {
                    matches.push(doc);
                }
            }

            return { prefix, results: matches, count: matches.length };
        },

        getMin() {

            const pair = sorted[0];

            return { fieldName, minValue: pair.value, doc: findDocById(pair._id) };
        },

        getMax() {

            const pair = sorted[sorted.length - 1];

            return { fieldName, maxValue: pair.value, doc: findDocById(pair._id) };
        },

        getNth(n) {

            if (typeof n !== "number" || n < 1) return "Invalid Input";

            if (n > sorted.length) return { error: "Index out of range" };

            const pair = sorted[n - 1];

            return { n, value: pair.value, doc: findDocById(pair._id) };
        },

        getIndexSize() {
            return sorted.length;
        }
    };
}



// ------ EXAMPLE USAGE ------

const btree = createBTreeIndex([
    { _id: "1", name: "Rahim", salary: 70000 },
    { _id: "2", name: "Karim", salary: 50000 },
    { _id: "3", name: "Nadia", salary: 80000 },
    { _id: "4", name: "Sadia", salary: 60000 },
    { _id: "5", name: "Rafiq", salary: 90000 }
], "salary");



console.log(btree.rangeSearch(55000, 80000));

console.log(btree.exactSearch(70000));

console.log(btree.getMin());

console.log(btree.getMax());

console.log(btree.getNth(2));

console.log(btree.getIndexSize());


// String B-tree:
const nameBtree = createBTreeIndex([
    { _id: "1", name: "Rahim" }, { _id: "2", name: "Rafiq" }, { _id: "3", name: "Nadia" }
], "name");

console.log(nameBtree.prefixSearch("ra"));


// --- INVALID ---
console.log(createBTreeIndex([], "salary"));