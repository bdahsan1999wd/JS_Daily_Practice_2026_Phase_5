// 🧩 PROBLEM–03: createCompositeIndex()

// Logic: Composite (multi-field) index with uniqueness and sparsity.

//   Composite key = field values joined with "|" (e.g. "IT|Rahim").
//   unique: true → enforce unique key combination
//   sparse: true → skip docs where any indexed field is null/undefined
//   search(query) supports partial keys (first N fields only).


function createCompositeIndex(collection, indexConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        !Array.isArray(collection) ||
        collection.length === 0 ||
        !collection.every(doc => typeof doc === "object" && doc !== null && !Array.isArray(doc)) ||
        !collection.every(doc => "_id" in doc) ||
        typeof indexConfig !== "object" ||
        indexConfig === null ||
        !Array.isArray(indexConfig.fields) ||
        indexConfig.fields.length === 0 ||
        indexConfig.fields.length > 3 ||
        !indexConfig.fields.every(f => typeof f === "string" && f.length > 0)
    ) {
        return "Invalid Input";
    }

    const fields = indexConfig.fields;
    const unique = indexConfig.unique === true;
    const sparse = indexConfig.sparse === true;

    // --- STEP 2: COMPOSITE KEY LOGIC ---

    function buildKey(doc, fieldList) {

        return fieldList
            .map(f => String(doc[f]))
            .join("|");
    }

    function isSparseDoc(doc) {
        return fields.some(f => doc[f] === null || doc[f] === undefined);
    }

    // --- STEP 3: BUILD INDEX FROM COLLECTION ---

    // entries: Map(compositeKey -> [_ids])

    const entries = new Map();

    for (const doc of collection) {

        if (sparse && isSparseDoc(doc)) continue;

        const key = buildKey(doc, fields);

        if (!entries.has(key)) entries.set(key, []);
        entries.get(key).push(doc._id);
    }

    // --- STEP 4: PUBLIC API ---

    return {

        search(query) {

            if (typeof query !== "object" || query === null || Array.isArray(query)) return "Invalid Input";

            // Determine which of the indexed fields were provided (leading subset).

            let provided = [];

            for (const f of fields) {
                if (f in query) provided.push(f);
                else break;
            }

            if (provided.length === 0) return "Invalid Input";

            const key = buildKey(query, provided);

            const results = collection.filter(doc => {

                // Must match all provided fields.

                return provided.every(f => doc[f] === query[f]);
            });

            return { query, results, count: results.length, compositeKey: key };
        },

        insert(doc) {

            if (typeof doc !== "object" || doc === null || Array.isArray(doc)) return "Invalid Input";

            if (sparse && isSparseDoc(doc)) {
                return { indexed: false, reason: "Sparse: null field skipped" };
            }

            const key = buildKey(doc, fields);

            if (unique && entries.has(key)) {
                return { inserted: false, reason: "Unique constraint violation: " + key };
            }

            collection.push(doc);

            if (!entries.has(key)) entries.set(key, []);

            entries.get(key).push(doc._id);

            return { inserted: true, compositeKey: key };
        },

        validateCollection() {

            const violations = [];

            for (const [key, ids] of entries) {

                if (ids.length > 1) {
                    violations.push({ compositeKey: key, conflictingIds: [...ids] });
                }
            }

            return { valid: violations.length === 0, violations };
        },

        getIndexInfo() {

            return {
                fields,
                unique,
                sparse,
                totalEntries: collection.length,
                uniqueKeys: entries.size
            };
        }
    };
}



// ------ EXAMPLE USAGE ------

const ci = createCompositeIndex([
    { _id: "1", dept: "IT", name: "Rahim", level: "SR" },
    { _id: "2", dept: "HR", name: "Karim", level: "JR" },
    { _id: "3", dept: "IT", name: "Nadia", level: "SR" },
    { _id: "4", dept: "IT", name: "Rahim", level: "JR" }  // same dept+name as _id:1
], { fields: ["dept", "name"], unique: true, sparse: false });

console.log(ci.validateCollection());


console.log(ci.search({ dept: "IT" }));

console.log(ci.insert({ _id: "5", dept: "HR", name: "Sadia", level: "MID" }));

console.log(ci.insert({ _id: "6", dept: "HR", name: "Karim", level: "SR" }));

console.log(ci.getIndexInfo());


// --- INVALID ---
console.log(createCompositeIndex([], { fields: [] }));