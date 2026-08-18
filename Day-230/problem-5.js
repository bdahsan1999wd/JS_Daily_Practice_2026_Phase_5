// 🧩 PROBLEM–05: runRepoServiceOrchestrator()

// Logic: Full Repository-Service Orchestrator — composes Problems 01–04.


// 1. Create a repository + service for each entity (with business rules)

// 2. Wrap all repositories in a Unit of Work

// 3. Process each transaction: begin → run operations via services → rollback if shouldRollback OR any operation reports violations → else commit

// 4. Build summary (totalTransactions, committedCount, rolledBackCount, finalEntityCounts)

function runRepoServiceOrchestrator(orchestratorConfig) {

    // --- STEP 1: VALIDATE orchestratorConfig ---

    if (
        typeof orchestratorConfig !== "object" ||
        orchestratorConfig === null ||
        Array.isArray(orchestratorConfig)
    ) {
        return "Invalid Input";
    }

    const { orchestratorId, entities, transactions } = orchestratorConfig;

    if (
        typeof orchestratorId !== "string" || orchestratorId.trim() === "" ||
        !Array.isArray(entities) || entities.length === 0 ||
        !Array.isArray(transactions)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: SETUP — build stores, repositories, services ---
    //
    // entityStore: { entityName: { primaryKey, records: [] } }
    // repository:  standard CRUD on the store
    // service:     applies business rules before create/update

    const entityStore = {};

    for (const entityConfig of entities) {

        const { entityName, primaryKey, businessRules } = entityConfig;

        if (
            typeof entityName !== "string" || entityName.trim() === "" ||
            typeof primaryKey !== "string" || primaryKey.trim() === "" ||
            !Array.isArray(businessRules)
        ) {
            return "Invalid Input";
        }

        entityStore[entityName] = {
            primaryKey,
            records: []
        };
    }

    // Repository factory over a store.

    function createRepository(entityName) {

        const store = entityStore[entityName];

        return {
            save(entity) {
                const index = store.records.findIndex(r => r[store.primaryKey] === entity[store.primaryKey]);
                if (index !== -1) {
                    Object.assign(store.records[index], entity);
                    return { operation: "UPDATE", entity: store.records[index] };
                }
                store.records.push(entity);
                return { operation: "INSERT", entity };
            },
            findById(id) {
                const index = store.records.findIndex(r => r[store.primaryKey] === id);
                if (index === -1) return { found: false, id };
                return { found: true, entity: store.records[index] };
            },
            findAll() {
                return { entities: store.records, count: store.records.length };
            },
            deleteById(id) {
                const index = store.records.findIndex(r => r[store.primaryKey] === id);
                if (index === -1) return { error: "Entity not found" };
                store.records.splice(index, 1);
                return { deleted: true, id };
            },
            count() {
                return store.records.length;
            }
        };
    }

    // Service factory over a repository + business rules.

    function createService(entityConfig, repository) {

        const { businessRules } = entityConfig;

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

        return {
            create(data) {
                const check = applyBusinessRules(data);
                if (!check.valid) return { created: false, violations: check.violations };
                const saved = repository.save(data);
                return { created: true, entity: saved.entity };
            },
            update(id, data) {
                const existing = repository.findById(id);
                if (!existing.found) return { updated: false, reason: "Entity not found" };
                const merged = { ...existing.entity, ...data };
                const check = applyBusinessRules(merged);
                if (!check.valid) return { updated: false, violations: check.violations };
                const saved = repository.save(merged);
                return { updated: true, entity: saved.entity };
            },
            remove(id) {
                return repository.deleteById(id);
            }
        };
    }

    const repositories = {};
    const services = {};

    for (const entityConfig of entities) {
        repositories[entityConfig.entityName] = createRepository(entityConfig.entityName);
        services[entityConfig.entityName] = createService(entityConfig, repositories[entityConfig.entityName]);
    }

    // --- STEP 3: UNIT OF WORK (Problem-04 logic) ---
    // Snapshot = deep copy of every store's records.

    function takeSnapshot() {
        const snapshot = {};
        for (const name of Object.keys(entityStore)) {
            snapshot[name] = entityStore[name].records.map(r => ({ ...r }));
        }
        return snapshot;
    }

    function restoreSnapshot(snapshot) {
        for (const name of Object.keys(entityStore)) {
            entityStore[name].records = snapshot[name];
        }
    }

    // --- STEP 4: PROCESS TRANSACTIONS ---

    const transactionLog = [];
    let committedCount = 0;
    let rolledBackCount = 0;

    for (const transaction of transactions) {

        const { transactionId, operations, shouldRollback } = transaction;

        // Begin: snapshot current state.

        const snapshot = takeSnapshot();
        const operationResults = [];
        let needsRollback = shouldRollback === true;

        for (const operation of operations) {

            const { entityName, type, data, id } = operation;
            const service = services[entityName];

            let result;

            if (type === "CREATE") {
                result = service.create(data);

                if (result.created) {
                    operationResults.push({ type, created: true, entity: result.entity });
                } else {
                    operationResults.push({ type, created: false, violations: result.violations });
                    needsRollback = true;
                }
            } else if (type === "UPDATE") {
                result = service.update(id, data);

                if (result.updated) {
                    operationResults.push({ type, updated: true, entity: result.entity });
                } else {
                    operationResults.push({ type, updated: false, ...(result.violations ? { violations: result.violations } : { reason: result.reason }) });
                    needsRollback = true;
                }
            } else if (type === "DELETE") {
                result = service.remove(id);

                if (result.deleted) {
                    operationResults.push({ type, deleted: true, id });
                } else {
                    operationResults.push({ type, deleted: false, reason: result.error });
                    needsRollback = true;
                }
            } else {
                needsRollback = true;
                operationResults.push({ type, error: "Unknown operation type" });
            }
        }

        // Commit or rollback.

        if (needsRollback) {
            restoreSnapshot(snapshot);
            rolledBackCount++;
            transactionLog.push({ transactionId, status: "ROLLED_BACK", operationResults });
        } else {
            committedCount++;
            transactionLog.push({ transactionId, status: "COMMITTED", operationResults });
        }
    }

    // --- STEP 5: BUILD SUMMARY ---

    const finalEntityCounts = {};

    for (const name of Object.keys(entityStore)) {
        finalEntityCounts[name] = entityStore[name].records.length;
    }

    const summary = {
        totalTransactions: transactions.length,
        committedCount,
        rolledBackCount,
        finalEntityCounts
    };

    return { orchestratorId, transactionLog, summary };
}


// ------ EXAMPLE USAGE ------

// --- Full orchestrator (matches readme sample) ---
console.log(runRepoServiceOrchestrator({
    orchestratorId: "ORCH-01",
    entities: [
        {
            entityName: "User",
            primaryKey: "id",
            businessRules: [
                { ruleName: "AgeRule", validate: (d) => d.age >= 18 ? { valid: true, reason: null } : { valid: false, reason: "Must be 18+" } }
            ]
        }
    ],
    transactions: [
        {
            transactionId: "TXN-A",
            operations: [
                { entityName: "User", type: "CREATE", data: { id: "U1", name: "Rahim", age: 25 } },
                { entityName: "User", type: "CREATE", data: { id: "U2", name: "Karim", age: 30 } }
            ],
            shouldRollback: false
        },
        {
            transactionId: "TXN-B",
            operations: [
                { entityName: "User", type: "CREATE", data: { id: "U3", name: "Nadia", age: 15 } }
            ],
            shouldRollback: false
        }
    ]
}));


// --- INVALID: empty entities ---
console.log(runRepoServiceOrchestrator({ orchestratorId: "X", entities: [], transactions: [] }));