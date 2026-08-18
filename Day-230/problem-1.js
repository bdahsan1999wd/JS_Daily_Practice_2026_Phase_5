// 🧩 PROBLEM–01: createRepository()

// Logic: Implements the base Repository pattern.

// Maintains an internal entity store keyed by a primaryKey field.

// Methods:
//   save(entity)      — upsert (INSERT or UPDATE)
//   findById(id)      — find entity by primary key value
//   findAll(filterFn) — all entities, optionally filtered
//   deleteById(id)    — remove entity by primary key
//   exists(id)        — check existence
//   count(filterFn)   — count (filtered or total)

function createRepository(repoConfig) {

    // --- STEP 1: VALIDATE repoConfig ---

    if (
        typeof repoConfig !== "object" ||
        repoConfig === null ||
        Array.isArray(repoConfig)
    ) {
        return "Invalid Input";
    }

    const { entityName, primaryKey } = repoConfig;

    // entityName and primaryKey must be non-empty strings.

    if (
        typeof entityName !== "string" || entityName.trim() === "" ||
        typeof primaryKey !== "string" || primaryKey.trim() === ""
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL ENTITY STORE ---

    const entities = [];

    // Helper: find the index of an entity by its primary key value.

    function indexOfId(id) {
        return entities.findIndex(e => e[primaryKey] === id);
    }

    // --- STEP 3: REPOSITORY METHODS ---

    return {
        // save(entity): upsert.
        save(entity) {

            if (typeof entity !== "object" || entity === null || Array.isArray(entity)) {
                return "Invalid Input";
            }

            // Primary key field must be present.

            if (entity[primaryKey] === undefined) {
                return { error: "Primary key field missing: " + primaryKey };
            }

            const index = indexOfId(entity[primaryKey]);

            // UPDATE: merge fields into existing entity.

            if (index !== -1) {
                Object.assign(entities[index], entity);
                return { operation: "UPDATE", entity: entities[index] };
            }

            // INSERT: push new entity.

            entities.push(entity);

            return { operation: "INSERT", entity };
        },

        // findById(id): find entity by primary key.
        findById(id) {

            const index = indexOfId(id);

            if (index === -1) return { found: false, id };

            return { found: true, entity: entities[index] };
        },

        // findAll(filterFn): all or filtered entities.
        findAll(filterFn) {

            // filterFn (if provided) must be a function.

            if (filterFn !== undefined && typeof filterFn !== "function") {
                return "Invalid Input";
            }

            const result = filterFn
                ? entities.filter(filterFn)
                : [...entities];

            return { entities: result, count: result.length };
        },

        // deleteById(id): remove entity by primary key.
        deleteById(id) {

            const index = indexOfId(id);

            if (index === -1) return { error: "Entity not found" };

            entities.splice(index, 1);

            return { deleted: true, id };
        },

        // exists(id): check existence.
        exists(id) {

            return { id, exists: indexOfId(id) !== -1 };
        },

        // count(filterFn): count (filtered or total).
        count(filterFn) {

            if (filterFn !== undefined && typeof filterFn !== "function") {
                return "Invalid Input";
            }

            return filterFn
                ? entities.filter(filterFn).length
                : entities.length;
        }
    };
}


// ------ EXAMPLE USAGE ------

// --- Build a User repository ---
const userRepo = createRepository({ entityName: "User", primaryKey: "id" });


// --- INSERT ---
console.log(userRepo.save({ id: "U1", name: "Rahim", age: 25 }));


// --- INSERT ---
console.log(userRepo.save({ id: "U2", name: "Karim", age: 30 }));


// --- UPDATE (same id, merge) ---
console.log(userRepo.save({ id: "U1", age: 26 }));


// --- findById ---
console.log(userRepo.findById("U1"));


// --- findAll with filter ---
console.log(userRepo.findAll(e => e.age > 25));


// --- exists ---
console.log(userRepo.exists("U3"));


// --- count ---
console.log(userRepo.count());


console.log(userRepo.count(e => e.age >= 26));


// --- deleteById ---
console.log(userRepo.deleteById("U2"));


// --- deleteById not found ---
console.log(userRepo.deleteById("U99"));


// --- save: missing primary key ---
console.log(userRepo.save({ name: "Nadia" }));


// --- INVALID: bad repoConfig ---
console.log(createRepository({ entityName: "", primaryKey: "id" }));