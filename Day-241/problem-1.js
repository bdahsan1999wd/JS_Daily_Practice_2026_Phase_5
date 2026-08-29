// 🧩 PROBLEM–01: createIndexBuilder()

// Logic: Basic index builder supporting HASH and BTREE indexes.

//   HASH — maps exact values to [_ids]: { value: [_ids] } (equality only)
//   BTREE — sorted array of { value, _id } pairs (equality + range)
//   search() uses the index if present, else falls back to full scan.


function createIndexBuilder(collection) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        !Array.isArray(collection) ||
        collection.length === 0 ||
        !collection.every(doc => typeof doc === "object" && doc !== null && !Array.isArray(doc)) ||
        !collection.every(doc => "_id" in doc)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STATE ---

    const TIMESTAMP = "2025-01-01T00:00:00Z";

    // indexes: fieldName -> { indexType, entriesIndexed, createdAt, structure }
    //   structure for HASH: Map(value -> [_ids])
    //   structure for BTREE: sorted array of { value, _id }

    const indexes = new Map();

    // --- STEP 3: HELPERS ---

    function findDocById(id) {
        return collection.find(doc => doc._id === id) || null;
    }

    function buildStructure(fieldName, indexType) {

        if (indexType === "HASH") {

            const map = new Map();

            for (const doc of collection) {

                const value = doc[fieldName];

                if (!map.has(value)) map.set(value, []);
                map.get(value).push(doc._id);
            }

            return map;
        }

        // BTREE

        const pairs = collection
            .filter(doc => doc[fieldName] !== undefined)
            .map(doc => ({ value: doc[fieldName], _id: doc._id }))
            .sort((a, b) => {
                if (a.value < b.value) return -1;
                if (a.value > b.value) return 1;
                return 0;
            });

        return pairs;
    }

    // --- STEP 4: PUBLIC API ---

    return {

        buildIndex(fieldName, indexType) {

            if (typeof fieldName !== "string" || fieldName.length === 0) return "Invalid Input";

            if (indexType !== "HASH" && indexType !== "BTREE") return "Invalid Input";

            if (indexes.has(fieldName)) {
                return { built: false, reason: "Index already exists on: " + fieldName };
            }

            indexes.set(fieldName, {
                fieldName,
                indexType,
                entriesIndexed: collection.length,
                createdAt: TIMESTAMP,
                structure: buildStructure(fieldName, indexType)
            });

            return { built: true, fieldName, indexType, entriesIndexed: collection.length, buildTimeSimulated: "O(n)" };
        },

        dropIndex(fieldName) {

            if (typeof fieldName !== "string" || fieldName.length === 0) return "Invalid Input";

            if (!indexes.has(fieldName)) {
                return { error: "Index not found: " + fieldName };
            }

            indexes.delete(fieldName);

            return { dropped: true, fieldName };
        },

        listIndexes() {

            const list = [];

            for (const entry of indexes.values()) {
                list.push({
                    fieldName: entry.fieldName,
                    indexType: entry.indexType,
                    entriesIndexed: entry.entriesIndexed,
                    createdAt: entry.createdAt
                });
            }

            return list;
        },

        search(fieldName, value) {

            if (typeof fieldName !== "string" || fieldName.length === 0) return "Invalid Input";

            const idx = indexes.get(fieldName);

            if (idx) {

                let ids;

                if (idx.indexType === "HASH") {

                    const structure = idx.structure;
                    ids = structure.get(value) || [];

                } else { // BTREE

                    ids = idx.structure
                        .filter(pair => pair.value === value)
                        .map(pair => pair._id);
                }

                const results = ids.map(findDocById);

                return {
                    fieldName,
                    value,
                    results,
                    count: results.length,
                    usedIndex: true,
                    scanType: "INDEX_SCAN"
                };
            }

            // Full scan fallback.

            const results = collection.filter(doc => doc[fieldName] === value);

            return {
                fieldName,
                value,
                results,
                count: results.length,
                usedIndex: false,
                scanType: "FULL_SCAN"
            };
        },

        getIndexStats(fieldName) {

            if (typeof fieldName !== "string" || fieldName.length === 0) return "Invalid Input";

            const idx = indexes.get(fieldName);

            if (!idx) return { error: "No index on: " + fieldName };

            let uniqueValues;

            if (idx.indexType === "HASH") {
                uniqueValues = idx.structure.size;
            } else {
                const seen = new Set(idx.structure.map(p => p.value));
                uniqueValues = seen.size;
            }

            const totalEntries = idx.entriesIndexed;

            return {
                fieldName,
                indexType: idx.indexType,
                totalEntries,
                uniqueValues,
                avgDocsPerValue: Number((totalEntries / uniqueValues).toFixed(2)),
                selectivity: Number((uniqueValues / totalEntries).toFixed(2))
            };
        }
    };
}



// ------ EXAMPLE USAGE ------

const ib = createIndexBuilder([
    { _id: "1", name: "Rahim", dept: "IT", age: 25 },
    { _id: "2", name: "Karim", dept: "HR", age: 30 },
    { _id: "3", name: "Nadia", dept: "IT", age: 22 },
    { _id: "4", name: "Sadia", dept: "HR", age: 28 },
    { _id: "5", name: "Rafiq", dept: "IT", age: 35 }
]);

console.log(ib.buildIndex("dept", "HASH"));

console.log(ib.buildIndex("age", "BTREE"));

console.log(ib.search("dept", "IT"));

console.log(ib.search("name", "Rahim"));

console.log(ib.getIndexStats("dept"));

console.log(ib.getIndexStats("age"));

console.log(ib.listIndexes());


// --- INVALID ---
console.log(createIndexBuilder([]));