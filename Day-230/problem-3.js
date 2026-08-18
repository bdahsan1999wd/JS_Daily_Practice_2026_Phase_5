// 🧩 PROBLEM–03: createService()

// Logic: Implements the Service layer — business logic on top of a repository.

// Methods:
//   create(data)             — apply business rules then save via repository
//   getById(id)              — fetch from repository
//   getAll(filterFn)         — fetch all with optional filter
//   update(id, data)         — validate merged entity + update via repository
//   remove(id)               — delete via repository
//   applyBusinessRules(data) — run all rules, return validation result

function createService(serviceConfig) {

    // --- STEP 1: VALIDATE serviceConfig ---

    if (
        typeof serviceConfig !== "object" ||
        serviceConfig === null ||
        Array.isArray(serviceConfig)
    ) {
        return "Invalid Input";
    }

    const { serviceName, repository, businessRules } = serviceConfig;

    if (
        typeof serviceName !== "string" || serviceName.trim() === "" ||
        typeof repository !== "object" || repository === null ||
        !Array.isArray(businessRules)
    ) {
        return "Invalid Input";
    }

    // Each business rule: { ruleName: string, validate: function }.

    for (const rule of businessRules) {
        if (
            typeof rule !== "object" || rule === null ||
            typeof rule.ruleName !== "string" ||
            typeof rule.validate !== "function"
        ) {
            return "Invalid Input";
        }
    }

    // --- STEP 2: APPLY BUSINESS RULES ---

    function applyBusinessRules(data) {

        const violations = [];

        for (const rule of businessRules) {
            const result = rule.validate(data);
            if (!result.valid) {
                violations.push({ ruleName: rule.ruleName, reason: result.reason });
            }
        }

        return { valid: violations.length === 0, violations };
    }

    // --- STEP 3: SERVICE METHODS ---

    return {
        // create(data): validate rules then save.
        create(data) {

            const check = applyBusinessRules(data);

            if (!check.valid) {
                return { created: false, violations: check.violations };
            }

            const saved = repository.save(data);

            if (saved.error) return { created: false, violations: [saved.error] };

            return { created: true, entity: saved.entity };
        },

        // getById(id): repository result directly.
        getById(id) {
            return repository.findById(id);
        },

        // getAll(filterFn): repository result directly.
        getAll(filterFn) {
            return repository.findAll(filterFn);
        },

        // update(id, data): merge + validate + save.
        update(id, data) {

            const existing = repository.findById(id);

            // Entity must exist.

            if (!existing.found) {
                return { updated: false, reason: "Entity not found" };
            }

            // Merge existing entity with new data, then validate.

            const merged = { ...existing.entity, ...data };

            const check = applyBusinessRules(merged);

            if (!check.valid) {
                return { updated: false, violations: check.violations };
            }

            const saved = repository.save(merged);

            return { updated: true, entity: saved.entity };
        },

        // remove(id): repository result directly.
        remove(id) {
            return repository.deleteById(id);
        },

        // applyBusinessRules(data): run all rules against data.
        applyBusinessRules
    };
}



// ------ EXAMPLE USAGE ------

// --- Mini repository stub (full version in problem-1.js) ---
function createRepository(cfg) {
    const entities = [];
    return {
        save(entity) {
            const i = entities.findIndex(e => e[cfg.primaryKey] === entity[cfg.primaryKey]);
            if (i !== -1) { Object.assign(entities[i], entity); return { operation: "UPDATE", entity: entities[i] }; }
            entities.push(entity);
            return { operation: "INSERT", entity };
        },
        findById(id) {
            const i = entities.findIndex(e => e[cfg.primaryKey] === id);
            if (i === -1) return { found: false, id };
            return { found: true, entity: entities[i] };
        },
        findAll(fn) {
            const r = fn ? entities.filter(fn) : [...entities];
            return { entities: r, count: r.length };
        },
        deleteById(id) {
            const i = entities.findIndex(e => e[cfg.primaryKey] === id);
            if (i === -1) return { error: "Entity not found" };
            entities.splice(i, 1);
            return { deleted: true, id };
        },
        count() { return entities.length; }
    };
}


// --- Build a User service with business rules ---
const userRepo = createRepository({ entityName: "User", primaryKey: "id" });

const userService = createService({
    serviceName: "UserService",
    repository: userRepo,
    businessRules: [
        {
            ruleName: "AgeRule",
            validate: (data) => data.age >= 18
                ? { valid: true, reason: null }
                : { valid: false, reason: "User must be at least 18 years old" }
        },
        {
            ruleName: "NameRule",
            validate: (data) => data.name && data.name.length >= 3
                ? { valid: true, reason: null }
                : { valid: false, reason: "Name must be at least 3 characters" }
        }
    ]
});


// --- create: all rules pass ---
console.log(userService.create({ id: "U1", name: "Rahim", age: 25 }));


// --- create: both rules fail ---
console.log(userService.create({ id: "U2", name: "Al", age: 15 }));


// --- update: AgeRule fails on merged entity ---
console.log(userService.update("U1", { age: 17 }));


// --- applyBusinessRules: valid ---
console.log(userService.applyBusinessRules({ id: "U3", name: "Nadia", age: 22 }));



// --- INVALID: bad businessRules ---
console.log(createService({ serviceName: "X", repository: {}, businessRules: [{ ruleName: 5 }] }));