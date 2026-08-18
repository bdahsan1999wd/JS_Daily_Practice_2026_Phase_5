// 🧩 PROBLEM–02: createSpecializedRepository()

// Logic: Extends the base repository (Problem-01 logic) with extra methods:

//   findByField(fieldName, value)         — exact field match
//   findByRange(fieldName, min, max)      — min <= field <= max (null = no bound)
//   findWithPagination(page, limit, sortBy, sortOrder) — paged + sorted
//   bulkSave(entities)                    — insert/update many at once
//   bulkDelete(ids)                       — delete many by id array

function createSpecializedRepository(repoConfig) {

    // --- STEP 1: VALIDATE repoConfig ---

    if (
        typeof repoConfig !== "object" ||
        repoConfig === null ||
        Array.isArray(repoConfig)
    ) {
        return "Invalid Input";
    }

    const { entityName, primaryKey, indexes } = repoConfig;

    if (
        typeof entityName !== "string" || entityName.trim() === "" ||
        typeof primaryKey !== "string" || primaryKey.trim() === "" ||
        !Array.isArray(indexes) ||
        !indexes.every(i => typeof i === "string")
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL ENTITY STORE ---

    const entities = [];

    function indexOfId(id) {
        return entities.findIndex(e => e[primaryKey] === id);
    }

    // --- STEP 3: BASE REPOSITORY METHODS ---

    function save(entity) {

        if (typeof entity !== "object" || entity === null || Array.isArray(entity)) {
            return "Invalid Input";
        }

        if (entity[primaryKey] === undefined) {
            return { error: "Primary key field missing: " + primaryKey };
        }

        const index = indexOfId(entity[primaryKey]);

        if (index !== -1) {
            Object.assign(entities[index], entity);
            return { operation: "UPDATE", entity: entities[index] };
        }

        entities.push(entity);

        return { operation: "INSERT", entity };
    }

    function deleteById(id) {

        const index = indexOfId(id);

        if (index === -1) return { error: "Entity not found" };

        entities.splice(index, 1);

        return { deleted: true, id };
    }

    // --- STEP 4: ADDITIONAL METHODS ---

    return {
        save,
        findById(id) {
            const index = indexOfId(id);
            if (index === -1) return { found: false, id };
            return { found: true, entity: entities[index] };
        },
        findAll(filterFn) {
            if (filterFn !== undefined && typeof filterFn !== "function") return "Invalid Input";
            const result = filterFn ? entities.filter(filterFn) : [...entities];
            return { entities: result, count: result.length };
        },
        deleteById,
        exists(id) {
            return { id, exists: indexOfId(id) !== -1 };
        },
        count(filterFn) {
            if (filterFn !== undefined && typeof filterFn !== "function") return "Invalid Input";
            return filterFn ? entities.filter(filterFn).length : entities.length;
        },

        // findByField: exact field match.
        findByField(fieldName, value) {

            if (typeof fieldName !== "string" || fieldName.trim() === "") {
                return "Invalid Input";
            }

            const result = entities.filter(e => e[fieldName] === value);

            return { fieldName, value, entities: result, count: result.length };
        },

        // findByRange: min <= field <= max (null bounds allowed).
        findByRange(fieldName, min, max) {

            if (typeof fieldName !== "string" || fieldName.trim() === "") {
                return "Invalid Input";
            }

            const result = entities.filter(e => {
                const v = e[fieldName];
                if (typeof v !== "number") return false;
                if (min !== null && v < min) return false;
                if (max !== null && v > max) return false;
                return true;
            });

            return { fieldName, min, max, entities: result, count: result.length };
        },

        // findWithPagination: page + limit + sort.
        findWithPagination(page, limit, sortBy, sortOrder) {

            if (
                !Number.isInteger(page) || page < 1 ||
                !Number.isInteger(limit) || limit < 1
            ) {
                return "Invalid Input";
            }

            // Sort (default asc).

            const direction = sortOrder === "desc" ? -1 : 1;
            let sorted = [...entities];

            if (sortBy) {
                sorted.sort((a, b) => {
                    if (a[sortBy] < b[sortBy]) return -1 * direction;
                    if (a[sortBy] > b[sortBy]) return 1 * direction;
                    return 0;
                });
            }

            // Paginate.

            const totalItems = sorted.length;
            const totalPages = Math.ceil(totalItems / limit);
            const startIndex = (page - 1) * limit;
            const pagedData = sorted.slice(startIndex, startIndex + limit);

            return {
                entities: pagedData,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            };
        },

        // bulkSave: insert/update multiple entities.
        bulkSave(bulkEntities) {

            if (!Array.isArray(bulkEntities)) return "Invalid Input";

            const results = [];

            for (const entity of bulkEntities) {
                const r = save(entity);
                if (r === "Invalid Input") return "Invalid Input";
                if (r.error) return r;
                results.push({ operation: r.operation, entity: r.entity });
            }

            return { saved: results.length, results };
        },

        // bulkDelete: delete multiple entities by id.
        bulkDelete(ids) {

            if (!Array.isArray(ids)) return "Invalid Input";

            const results = [];
            let deleted = 0;
            let failed = 0;

            for (const id of ids) {
                const r = deleteById(id);

                if (r.deleted) {
                    deleted++;
                    results.push({ id, deleted: true });
                } else {
                    failed++;
                    results.push({ id, deleted: false });
                }
            }

            return { deleted, failed, results };
        }
    };
}



// ------ EXAMPLE USAGE ------

// --- Build a specialized Product repository ---
const productRepo = createSpecializedRepository({
    entityName: "Product",
    primaryKey: "id",
    indexes: ["category", "price"]
});


// --- bulkSave ---
console.log(productRepo.bulkSave([
    { id: "P1", name: "JS Book", category: "TECH", price: 500 },
    { id: "P2", name: "CSS Guide", category: "TECH", price: 300 },
    { id: "P3", name: "Design Basics", category: "DESIGN", price: 450 }
]));


// --- findByField ---
console.log(productRepo.findByField("category", "TECH"));


// --- findByRange ---
console.log(productRepo.findByRange("price", 350, 600));


// --- findWithPagination ---
console.log(productRepo.findWithPagination(1, 2, "price", "asc"));


// --- bulkDelete ---
console.log(productRepo.bulkDelete(["P1", "P99"]));


// --- INVALID: bad indexes ---
console.log(createSpecializedRepository({ entityName: "X", primaryKey: "id", indexes: "not-an-array" }));