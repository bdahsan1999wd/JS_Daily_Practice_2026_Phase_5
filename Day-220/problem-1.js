// 🧩 PROBLEM–01: createModuleRegistry()

// Logic: Creates a basic Module Registry.

// Supports:

// 1. Register a module
// 2. Get a registered module
// 3. Unregister a module
// 4. List all registered modules
// 5. Check whether a module exists

function createModuleRegistry() {

    // --- STEP 1: INTERNAL STORAGE ---
    // Stores all registered modules.

    const registry = {};

    // Fixed timestamp for simulation.

    const timestamp = "2025-01-01T00:00:00Z";

    // --- STEP 2: RETURN REGISTRY METHODS ---

    return {

        // -----------------------------
        // Register a new module
        // -----------------------------
        register(moduleData) {

            // Validate module object.

            if (
                typeof moduleData !== "object" ||
                moduleData === null ||
                Array.isArray(moduleData)
            ) {
                return "Invalid Input";
            }

            const {
                name,
                version,
                exports,
                dependencies
            } = moduleData;

            if (
                typeof name !== "string" ||
                name.trim() === "" ||
                typeof version !== "string" ||
                version.trim() === "" ||
                typeof exports !== "object" ||
                exports === null ||
                Array.isArray(exports) ||
                !Array.isArray(dependencies) ||
                !dependencies.every(dep =>
                    typeof dep === "string" &&
                    dep.trim() !== ""
                )
            ) {
                return "Invalid Input";
            }

            // Prevent duplicate modules.

            if (registry[name]) {

                return {
                    registered: false,
                    reason: `Module already exists: ${name}`
                };

            }

            // Store module.

            registry[name] = {
                ...moduleData,
                registeredAt: timestamp,
                status: "REGISTERED"
            };

            return {
                registered: true,
                name,
                version
            };

        },

        // -----------------------------
        // Get a module
        // -----------------------------
        get(moduleName) {

            // Validate module name.

            if (
                typeof moduleName !== "string" ||
                moduleName.trim() === ""
            ) {
                return "Invalid Input";
            }

            if (!registry[moduleName]) {

                return {
                    error: `Module not found: ${moduleName}`
                };

            }

            return registry[moduleName];

        },

        // -----------------------------
        // Unregister a module
        // -----------------------------
        unregister(moduleName) {

            // Validate module name.

            if (
                typeof moduleName !== "string" ||
                moduleName.trim() === ""
            ) {
                return "Invalid Input";
            }

            if (!registry[moduleName]) {

                return {
                    error: `Module not found: ${moduleName}`
                };

            }

            delete registry[moduleName];

            return {
                unregistered: true,
                name: moduleName
            };

        },

        // -----------------------------
        // List all modules
        // -----------------------------
        listModules() {

            return Object.values(registry).map(module => ({

                name: module.name,

                version: module.version,

                status: module.status

            }));

        },

        // -----------------------------
        // Check module existence
        // -----------------------------
        has(moduleName) {

            // Validate module name.

            if (
                typeof moduleName !== "string" ||
                moduleName.trim() === ""
            ) {
                return "Invalid Input";
            }

            return {

                name: moduleName,

                exists: Object.hasOwn(registry, moduleName)

            };

        }

    };

}

// --- EXAMPLE USAGE ---
const registry = createModuleRegistry();

console.log(

    registry.register({

        name: "logger",

        version: "1.0.0",

        exports: {

            log: "fn",

            warn: "fn"

        },

        dependencies: []

    })

);

console.log(

    registry.register({

        name: "logger",

        version: "2.0.0",

        exports: {},

        dependencies: []

    })

);

console.log(

    registry.has("logger")

);

console.log(

    registry.get("logger")

);

console.log(

    registry.listModules()

);

console.log(

    registry.unregister("logger")

);