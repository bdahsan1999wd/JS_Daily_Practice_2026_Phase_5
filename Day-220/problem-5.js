// 🧩 PROBLEM–05: runModuleSystemOrchestrator()

// Logic: Simulates a complete module system.

// Steps:
// 1. Register all modules
// 2. Detect circular dependencies (optional)
// 3. Resolve dependency load order
// 4. Lazy-load modules
// 5. Build final report

function runModuleSystemOrchestrator(systemConfig) {

    // --- STEP 1: VALIDATION ---
    // systemConfig must be a valid object.

    if (
        typeof systemConfig !== "object" ||
        systemConfig === null ||
        Array.isArray(systemConfig)
    ) {
        return "Invalid Input";
    }

    const {
        systemId,
        modules,
        entryModule,
        checkForCycles
    } = systemConfig;

    if (
        typeof systemId !== "string" ||
        systemId.trim() === "" ||
        !Array.isArray(modules) ||
        modules.length === 0 ||
        typeof entryModule !== "string" ||
        entryModule.trim() === "" ||
        typeof checkForCycles !== "boolean"
    ) {
        return "Invalid Input";
    }

    const isValidModules = modules.every(module =>
        typeof module === "object" &&
        module !== null &&
        !Array.isArray(module) &&
        typeof module.name === "string" &&
        module.name.trim() !== "" &&
        typeof module.version === "string" &&
        module.version.trim() !== "" &&
        Array.isArray(module.dependencies) &&
        module.dependencies.every(dep =>
            typeof dep === "string" &&
            dep.trim() !== ""
        ) &&
        typeof module.exports === "object" &&
        module.exports !== null &&
        !Array.isArray(module.exports)
    );

    if (!isValidModules) {
        return "Invalid Input";
    }

    // --- STEP 2: BUILD REGISTRY & GRAPH ---

    const registry = new Map();

    const graph = {};

    for (const module of modules) {

        registry.set(
            module.name,
            module
        );

        graph[module.name] =
            [...module.dependencies];

    }

    // --- STEP 3: CIRCULAR DEPENDENCY CHECK ---

    let cycleCheckResult = null;

    if (checkForCycles) {

        const visited = new Set();

        const stack = new Set();

        const path = [];

        const cycles = [];

        const cycleKeys = new Set();

        function dfs(moduleName) {

            visited.add(moduleName);

            stack.add(moduleName);

            path.push(moduleName);

            for (const dependency of graph[moduleName] || []) {

                if (!(dependency in graph)) {
                    continue;
                }

                if (!visited.has(dependency)) {

                    dfs(dependency);

                } else if (stack.has(dependency)) {

                    const start =
                        path.indexOf(dependency);

                    const cycle =
                        path.slice(start);

                    cycle.push(dependency);

                    const key =
                        [...new Set(cycle)]
                            .sort()
                            .join("|");

                    if (!cycleKeys.has(key)) {

                        cycleKeys.add(key);

                        cycles.push(cycle);

                    }

                }

            }

            stack.delete(moduleName);

            path.pop();

        }

        for (const moduleName of Object.keys(graph)) {

            if (!visited.has(moduleName)) {
                dfs(moduleName);
            }

        }

        cycleCheckResult = {
            hasCycles: cycles.length > 0,
            cycles
        };

        if (cycleCheckResult.hasCycles) {

            return {
                systemId,
                status: "CYCLE_DETECTED",
                cycles
            };

        }

    }

    // --- STEP 4: RESOLVE DEPENDENCIES ---

    const loadOrder = [];

    const resolved = new Set();

    function resolve(moduleName) {

        if (
            resolved.has(moduleName) ||
            !(moduleName in graph)
        ) {
            return;
        }

        for (const dependency of graph[moduleName]) {

            resolve(dependency);

        }

        resolved.add(moduleName);

        loadOrder.push(moduleName);

    }

    resolve(entryModule);

    // --- STEP 5: LAZY LOAD MODULES ---

    const loadedModules = [];

    const cache = new Map();

    function load(moduleName) {

        if (cache.has(moduleName)) {
            return;
        }

        const module =
            registry.get(moduleName);

        for (const dependency of module.dependencies) {

            load(dependency);

        }

        cache.set(
            moduleName,
            module.exports
        );

        loadedModules.push(moduleName);

    }

    load(entryModule);

    // --- STEP 6: RETURN RESULT ---

    return {
        systemId,
        status: "SUCCESS",
        registeredModules:
            registry.size,
        loadOrder,
        loadedModules,
        cycleCheckResult
    };

}

// --- EXAMPLE USAGE ---
console.log(

    runModuleSystemOrchestrator({

        systemId: "SYS-01",

        modules: [

            {
                name: "config",
                version: "1.0.0",
                dependencies: [],
                exports: {
                    env: "production"
                }
            },

            {
                name: "logger",
                version: "1.2.0",
                dependencies: ["config"],
                exports: {
                    log: "fn"
                }
            },

            {
                name: "db",
                version: "2.0.0",
                dependencies: [
                    "config",
                    "logger"
                ],
                exports: {
                    query: "fn"
                }
            },

            {
                name: "app",
                version: "3.1.0",
                dependencies: [
                    "logger",
                    "db"
                ],
                exports: {
                    start: "fn"
                }
            }

        ],

        entryModule: "app",

        checkForCycles: true

    })

);

console.log(

    runModuleSystemOrchestrator({

        systemId: "SYS-02",

        modules: [

            {
                name: "A",
                version: "1.0.0",
                dependencies: ["B"],
                exports: {}
            },

            {
                name: "B",
                version: "1.0.0",
                dependencies: ["A"],
                exports: {}
            }

        ],

        entryModule: "A",

        checkForCycles: true

    })

);