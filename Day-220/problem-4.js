// 🧩 PROBLEM–04: createLazyLoader()

// Logic: Simulates a lazy module loader.

// Features:
// 1. Load modules on demand
// 2. Automatically load dependencies
// 3. Cache loaded modules
// 4. Unload modules
// 5. Track loading statistics

function createLazyLoader(moduleDefinitions) {

    // --- STEP 1: VALIDATION ---
    // moduleDefinitions must be a non-empty array.

    if (
        !Array.isArray(moduleDefinitions) ||
        moduleDefinitions.length === 0
    ) {
        return "Invalid Input";
    }

    const isValidDefinitions =
        moduleDefinitions.every(module =>
            typeof module === "object" &&
            module !== null &&
            !Array.isArray(module) &&
            typeof module.name === "string" &&
            module.name.trim() !== "" &&
            Array.isArray(module.dependencies) &&
            module.dependencies.every(dep =>
                typeof dep === "string" &&
                dep.trim() !== ""
            ) &&
            typeof module.factory === "function"
        );

    if (!isValidDefinitions) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STORAGE ---

    const definitions = new Map();

    const cache = new Map();

    let totalLoadCalls = 0;

    let cacheHits = 0;

    // Store module definitions.

    for (const module of moduleDefinitions) {

        definitions.set(
            module.name,
            module
        );

    }

    // --- STEP 3: HELPER FUNCTION ---
    // Recursively load modules.

    function loadModule(moduleName, loadedDependencies) {

        if (!definitions.has(moduleName)) {

            return {
                error:
                    "Module not defined: " +
                    moduleName
            };

        }

        if (cache.has(moduleName)) {

            cacheHits++;

            return {
                exports:
                    cache.get(moduleName),
                cached: true
            };

        }

        const module =
            definitions.get(moduleName);

        for (const dependency of module.dependencies) {

            const result =
                loadModule(
                    dependency,
                    loadedDependencies
                );

            if (result.error) {
                return result;
            }

            if (
                !loadedDependencies.includes(
                    dependency
                )
            ) {

                loadedDependencies.push(
                    dependency
                );

            }

        }

        const exports =
            module.factory();

        cache.set(
            moduleName,
            exports
        );

        return {
            exports,
            cached: false
        };

    }

    // --- STEP 4: RETURN LOADER OBJECT ---

    return {

        // -----------------------------
        // Load a module
        // -----------------------------
        load(moduleName) {

            if (
                typeof moduleName !== "string" ||
                moduleName.trim() === ""
            ) {
                return "Invalid Input";
            }

            totalLoadCalls++;

            if (!definitions.has(moduleName)) {

                return {
                    error:
                        "Module not defined: " +
                        moduleName
                };

            }

            if (cache.has(moduleName)) {

                cacheHits++;

                return {
                    name: moduleName,
                    source: "CACHE",
                    exports:
                        cache.get(moduleName)
                };

            }

            const loadedDependencies = [];

            const result =
                loadModule(
                    moduleName,
                    loadedDependencies
                );

            if (result.error) {
                return result;
            }

            return {
                name: moduleName,
                source: "LOADED",
                exports: result.exports,
                loadedDependencies
            };

        },

        // -----------------------------
        // Check if module is loaded
        // -----------------------------
        isLoaded(moduleName) {

            if (
                typeof moduleName !== "string" ||
                moduleName.trim() === ""
            ) {
                return "Invalid Input";
            }

            return {
                name: moduleName,
                loaded:
                    cache.has(moduleName)
            };

        },

        // -----------------------------
        // Get loaded modules
        // -----------------------------
        getLoadedModules() {

            return [...cache.keys()];

        },

        // -----------------------------
        // Unload a module
        // -----------------------------
        unload(moduleName) {

            if (
                typeof moduleName !== "string" ||
                moduleName.trim() === ""
            ) {
                return "Invalid Input";
            }

            if (
                !cache.has(moduleName)
            ) {

                return {
                    error:
                        "Module not loaded"
                };

            }

            cache.delete(moduleName);

            return {
                name: moduleName,
                unloaded: true
            };

        },

        // -----------------------------
        // Get loading statistics
        // -----------------------------
        getLoadStats() {

            const cacheHitRate =
                totalLoadCalls === 0
                    ? 0
                    : Number(
                        (
                            (cacheHits /
                                totalLoadCalls) *
                            100
                        ).toFixed(2)
                    );

            return {
                totalDefined:
                    definitions.size,
                totalLoaded:
                    cache.size,
                cacheHitRate
            };

        }

    };

}

// --- EXAMPLE USAGE ---
const loader = createLazyLoader([

    {
        name: "config",
        dependencies: [],
        factory: () => ({
            env: "production"
        })
    },

    {
        name: "logger",
        dependencies: ["config"],
        factory: () => ({
            log: "fn",
            warn: "fn"
        })
    },

    {
        name: "app",
        dependencies: ["logger"],
        factory: () => ({
            start: "fn"
        })
    }

]);

console.log(
    loader.isLoaded("logger")
);

console.log(
    loader.load("app")
);

console.log(
    loader.isLoaded("config")
);

console.log(
    loader.load("logger")
);

console.log(
    loader.getLoadedModules()
);

console.log(
    loader.getLoadStats()
);

console.log(
    loader.unload("logger")
);

console.log(
    loader.getLoadedModules()
);