// 🧩 PROBLEM–03: createDataLayer()

// Logic: Returns a data layer object.
//   getRepository(entityName)         — CRUD repository for an entity
//   seed(entityName, records)         — pre-populate entity with records
//   getWithRelations(entityName, id, includeRelations) — entity + related data
//   getDataStats()                    — counts per entity

// getWithRelations:
//   HAS_MANY    → all records in related entity where foreignKey === id
//   BELONGS_TO  → one record in related entity where id === entity[foreignKey]


function createDataLayer(dataConfig) {

    // --- STEP 1: VALIDATE dataConfig ---

    if (
        typeof dataConfig !== "object" || dataConfig === null || Array.isArray(dataConfig) ||
        !Array.isArray(dataConfig.entities)
    ) {
        return "Invalid Input";
    }

    for (const e of dataConfig.entities) {
        if (
            typeof e.name !== "string" || e.name.trim() === "" ||
            typeof e.fields !== "object" || e.fields === null ||
            (e.relations !== null && !Array.isArray(e.relations))
        ) {
            return "Invalid Input";
        }
    }

    // --- STEP 2: INTERNAL STATE ---

    // entityConfig: name -> { fields, relations }
    const entityConfig = {};

    // store: name -> array of records
    const store = {};

    for (const e of dataConfig.entities) {
        entityConfig[e.name] = { fields: e.fields, relations: e.relations || [] };
        store[e.name] = [];
    }

    // --- STEP 3: CRUD REPOSITORY FACTORY ---

    function createRepository(entityName) {

        // Generic CRUD over store[entityName].

        return {
            create(record) {
                store[entityName].push({ ...record });
                return { created: true, id: record.id, entity: entityName };
            },
            findById(id) {
                const rec = store[entityName].find(r => r.id === id);
                return rec ? { found: true, record: { ...rec } } : { found: false, error: "Record not found" };
            },
            findAll() {
                return store[entityName].map(r => ({ ...r }));
            },
            update(id, changes) {
                const idx = store[entityName].findIndex(r => r.id === id);
                if (idx === -1) return { updated: false, error: "Record not found" };
                store[entityName][idx] = { ...store[entityName][idx], ...changes };
                return { updated: true, id, record: { ...store[entityName][idx] } };
            },
            delete(id) {
                const idx = store[entityName].findIndex(r => r.id === id);
                if (idx === -1) return { deleted: false, error: "Record not found" };
                store[entityName].splice(idx, 1);
                return { deleted: true, id };
            }
        };
    }

    // --- STEP 4: RETURN DATA LAYER OBJECT ---

    return {

        getRepository(entityName) {

            if (typeof entityName !== "string" || entityName.trim() === "") return "Invalid Input";

            if (!entityConfig[entityName]) {
                return { error: "Entity not registered: " + entityName };
            }

            return createRepository(entityName);
        },

        seed(entityName, records) {

            if (
                typeof entityName !== "string" || entityName.trim() === "" ||
                !Array.isArray(records)
            ) {
                return "Invalid Input";
            }

            if (!entityConfig[entityName]) return { error: "Entity not registered: " + entityName };

            for (const rec of records) store[entityName].push({ ...rec });

            return { entityName, seeded: records.length };
        },

        getWithRelations(entityName, id, includeRelations) {

            if (
                typeof entityName !== "string" || entityName.trim() === "" ||
                typeof id !== "string" ||
                !Array.isArray(includeRelations)
            ) {
                return "Invalid Input";
            }

            if (!entityConfig[entityName]) return { error: "Entity not registered: " + entityName };

            const mainRecord = store[entityName].find(r => r.id === id);

            if (!mainRecord) return { error: "Record not found" };

            const relations = {};

            for (const relName of includeRelations) {

                const relConfig = entityConfig[entityName].relations.find(r => r.entity === relName);

                if (!relConfig) {
                    relations[relName] = null;
                    continue;
                }

                if (relConfig.type === "HAS_MANY") {
                    relations[relName] = store[relName].filter(r => r[relConfig.foreignKey] === id).map(r => ({ ...r }));
                } else if (relConfig.type === "BELONGS_TO") {
                    const fkValue = mainRecord[relConfig.foreignKey];
                    const linked = store[relName].find(r => r.id === fkValue);
                    relations[relName] = linked ? { ...linked } : null;
                }
            }

            return { entity: { ...mainRecord }, relations };
        },

        getDataStats() {

            const entities = {};

            for (const name of Object.keys(store)) {
                entities[name] = store[name].length;
            }

            return { entities };
        }
    };
}



// ------ EXAMPLE USAGE ------

const dataLayer = createDataLayer({
    entities: [
        {
            name: "User",
            fields: { id: { type: "string", required: true, default: null }, name: { type: "string", required: true, default: null } },
            relations: [{ type: "HAS_MANY", entity: "Order", foreignKey: "userId" }]
        },
        {
            name: "Order",
            fields: { id: { type: "string", required: true, default: null }, userId: { type: "string", required: true, default: null }, amount: { type: "number", required: true, default: null } },
            relations: [{ type: "BELONGS_TO", entity: "User", foreignKey: "userId" }]
        }
    ]
});


console.log(dataLayer.seed("User", [{ id: "U1", name: "Rahim" }, { id: "U2", name: "Karim" }]));


console.log(dataLayer.seed("Order", [
    { id: "O1", userId: "U1", amount: 500 },
    { id: "O2", userId: "U1", amount: 300 },
    { id: "O3", userId: "U2", amount: 800 }
]));

console.log(dataLayer.getWithRelations("User", "U1", ["Order"]));


console.log(dataLayer.getWithRelations("Order", "O1", ["User"]));


console.log(dataLayer.getDataStats());


// --- repository CRUD ---
const userRepo = dataLayer.getRepository("User");
console.log(userRepo.findById("U1"));


// --- INVALID ---
console.log(dataLayer.getRepository("Missing"));