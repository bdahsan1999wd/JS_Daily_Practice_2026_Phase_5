// 🧩 PROBLEM–02: resolveDependencies()

// Logic: Resolves module dependencies using DFS.

// Features:
// 1. Resolve only the requested module and its dependencies
// 2. Load dependencies before parent module
// 3. Detect missing modules
// 4. Return load order

function resolveDependencies(moduleName, moduleGraph) {

    // --- STEP 1: VALIDATION ---
    // Validate moduleName.

    if (
        typeof moduleName !== "string" ||
        moduleName.trim() === ""
    ) {
        return "Invalid Input";
    }

    // Validate moduleGraph.

    if (
        typeof moduleGraph !== "object" ||
        moduleGraph === null ||
        Array.isArray(moduleGraph)
    ) {
        return "Invalid Input";
    }

    // Validate every graph entry.

    const isValidGraph = Object.entries(moduleGraph).every(
        ([key, value]) =>
            typeof key === "string" &&
            key.trim() !== "" &&
            Array.isArray(value) &&
            value.every(
                dep =>
                    typeof dep === "string" &&
                    dep.trim() !== ""
            )
    );

    if (!isValidGraph) {
        return "Invalid Input";
    }

    // Entry module must exist.

    if (!(moduleName in moduleGraph)) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STORAGE ---

    const visited = new Set();
    const loadOrder = [];
    const errors = [];

    // --- STEP 3: DFS HELPER ---

    function dfs(currentModule) {

        if (visited.has(currentModule)) {
            return;
        }

        visited.add(currentModule);

        for (const dependency of moduleGraph[currentModule]) {

            // Missing dependency.

            if (!(dependency in moduleGraph)) {

                const message =
                    `Missing module: ${dependency}`;

                if (!errors.includes(message)) {
                    errors.push(message);
                }

                continue;

            }

            dfs(dependency);

        }

        loadOrder.push(currentModule);

    }

    // --- STEP 4: RESOLVE DEPENDENCIES ---

    dfs(moduleName);

    // --- STEP 5: RETURN RESULT ---

    return {
        moduleName,
        loadOrder,
        resolvedCount: loadOrder.length,
        errors
    };

}

// --- EXAMPLE USAGE ---
console.log(

    resolveDependencies(

        "app",

        {

            app: ["router", "db"],

            router: ["logger"],

            db: ["logger", "config"],

            logger: [],

            config: []

        }

    )

);

console.log(

    resolveDependencies(

        "api",

        {

            api: ["auth", "database"],

            auth: ["logger"],

            logger: []

        }

    )

);