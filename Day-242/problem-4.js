// 🧩 PROBLEM–04: createMigrationEngine()

// Logic: Versioned schema migrations.
//   addMigration — register a migration (positive, unique version)
//   runMigrations(targetVersion) — apply pending migrations in ascending order
//   rollbackMigration(version) — undo the LATEST applied migration only
//   getMigrationStatus / getCurrentVersion


function createMigrationEngine(migrationConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof migrationConfig !== "object" ||
        migrationConfig === null ||
        Array.isArray(migrationConfig) ||
        typeof migrationConfig.engineId !== "string" ||
        migrationConfig.engineId.length === 0 ||
        typeof migrationConfig.currentVersion !== "number" ||
        !Number.isInteger(migrationConfig.currentVersion) ||
        migrationConfig.currentVersion < 0
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STATE ---

    let currentVersion = migrationConfig.currentVersion;

    const migrations = new Map(); // version -> migration object

    // Track applied / rolled-back state.

    const applied = new Set();   // versions currently applied
    const rolledBack = new Set(); // versions registered but rolled back

    // DB state object passed to up/down functions.

    const db = { tables: {}, indexes: {} };

    // --- STEP 3: PUBLIC API ---

    return {

        addMigration(migration) {

            if (
                typeof migration !== "object" ||
                migration === null ||
                typeof migration.version !== "number" ||
                !Number.isInteger(migration.version) ||
                migration.version <= 0 ||
                typeof migration.name !== "string" ||
                typeof migration.up !== "function" ||
                typeof migration.down !== "function"
            ) {
                return "Invalid Input";
            }

            if (migrations.has(migration.version)) {
                return { added: false, reason: "Version already registered: " + migration.version };
            }

            migrations.set(migration.version, migration);

            return { added: true, version: migration.version, name: migration.name };
        },

        runMigrations(targetVersion) {

            if (typeof targetVersion !== "number" || !Number.isInteger(targetVersion)) {
                return "Invalid Input";
            }

            const versions = Array.from(migrations.keys()).sort((a, b) => a - b);

            const toRun = versions.filter(v => v > currentVersion && v <= targetVersion);

            const fromVersion = currentVersion;
            const log = [];

            for (const version of toRun) {

                const migration = migrations.get(version);

                let changes = [];
                let status = "SUCCESS";

                try {
                    const result = migration.up(db);
                    changes = result.changes;
                } catch (e) {
                    status = "FAILED";
                }

                if (status === "SUCCESS") {
                    currentVersion = version;
                    applied.add(version);
                    rolledBack.delete(version);
                }

                log.push({ version, name: migration.name, changes, status });
            }

            return { migrationsRun: log.length, fromVersion, toVersion: currentVersion, log };
        },

        rollbackMigration(version) {

            if (typeof version !== "number" || !Number.isInteger(version)) return "Invalid Input";

            // Can only rollback the LATEST applied migration.

            if (version !== currentVersion) {
                return { error: "Can only rollback latest version: " + currentVersion };
            }

            const migration = migrations.get(version);

            if (!migration) return { error: "Migration not found: " + version };

            const result = migration.down(db);

            applied.delete(version);
            rolledBack.add(version);
            currentVersion--;

            return { rolledBack: true, version, changes: result.changes };
        },

        getMigrationStatus() {

            const versions = Array.from(migrations.keys()).sort((a, b) => a - b);

            return versions.map(version => {

                let status = "PENDING";

                if (applied.has(version)) status = "APPLIED";
                else if (rolledBack.has(version)) status = "ROLLED_BACK";

                return { version, name: migrations.get(version).name, status };
            });
        },

        getCurrentVersion() {
            return currentVersion;
        }
    };
}


// ------ EXAMPLE USAGE ------

const engine = createMigrationEngine({ engineId: "MIG-01", currentVersion: 0 });

console.log(engine.addMigration({
    version: 1,
    name: "CreateUsersTable",
    up: (db) => { db.tables.users = []; return { changes: ["Created table: users"] }; },
    down: (db) => { delete db.tables.users; return { changes: ["Dropped table: users"] }; }
}));


console.log(engine.addMigration({
    version: 2,
    name: "AddEmailIndex",
    up: (db) => { db.indexes.users = ["email"]; return { changes: ["Added index on users.email"] }; },
    down: (db) => { db.indexes.users = []; return { changes: ["Removed index on users.email"] }; }
}));

console.log(engine.addMigration({
    version: 3,
    name: "CreateOrdersTable",
    up: (db) => { db.tables.orders = []; return { changes: ["Created table: orders"] }; },
    down: (db) => { delete db.tables.orders; return { changes: ["Dropped table: orders"] }; }
}));


console.log(engine.runMigrations(2));

console.log(engine.getCurrentVersion());

console.log(engine.rollbackMigration(2));

console.log(engine.getCurrentVersion());

console.log(engine.getMigrationStatus());


// --- INVALID ---
console.log(createMigrationEngine(null));