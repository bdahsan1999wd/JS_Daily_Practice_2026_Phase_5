// 🧩 PROBLEM–03: detectCircularDependencies()

// Logic: Detects circular dependencies in a module graph.

// Features:
// 1. Detect all circular dependency chains
// 2. Record each unique cycle only once
// 3. Identify safe modules
// 4. Identify affected modules

function detectCircularDependencies(moduleGraph) {

    // --- STEP 1: VALIDATION ---
    // moduleGraph must be a valid object.

    if (
        typeof moduleGraph !== "object" ||
        moduleGraph === null ||
        Array.isArray(moduleGraph)
    ) {
        return "Invalid Input";
    }

    const moduleNames = Object.keys(moduleGraph);

    // Validate every dependency list.

    const isValidGraph = moduleNames.every(name =>
        Array.isArray(moduleGraph[name]) &&
        moduleGraph[name].every(dep =>
            typeof dep === "string" &&
            dep.trim() !== ""
        )
    );

    if (!isValidGraph) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STATE ---

    const visited = new Set();

    const recursionStack = new Set();

    const path = [];

    const cycles = [];

    const cycleKeys = new Set();

    const affectedModules = new Set();

    // --- STEP 3: DEPTH-FIRST SEARCH ---

    function dfs(moduleName) {

        visited.add(moduleName);

        recursionStack.add(moduleName);

        path.push(moduleName);

        const dependencies =
            moduleGraph[moduleName] || [];

        for (const dependency of dependencies) {

            if (!(dependency in moduleGraph)) {
                continue;
            }

            if (!visited.has(dependency)) {

                dfs(dependency);

            } else if (
                recursionStack.has(dependency)
            ) {

                const startIndex =
                    path.indexOf(dependency);

                const cycle =
                    path.slice(startIndex);

                cycle.push(dependency);

                // Build unique key.

                const uniqueNodes =
                    [...new Set(cycle)]
                        .sort()
                        .join("|");

                if (!cycleKeys.has(uniqueNodes)) {

                    cycleKeys.add(uniqueNodes);

                    cycles.push(cycle);

                    cycle.forEach(module =>
                        affectedModules.add(module)
                    );

                }

            }

        }

        recursionStack.delete(moduleName);

        path.pop();

    }

    // --- STEP 4: RUN DFS FOR ALL MODULES ---

    for (const moduleName of moduleNames) {

        if (!visited.has(moduleName)) {
            dfs(moduleName);
        }

    }

    // --- STEP 5: BUILD SAFE MODULE LIST ---

    const safeModules =
        moduleNames.filter(module =>
            !affectedModules.has(module)
        );

    // --- STEP 6: RETURN RESULT ---

    return {
        hasCycles: cycles.length > 0,
        cycles,
        safeModules,
        affectedModules:
            [...affectedModules]
    };

}

// --- EXAMPLE USAGE ---
console.log(

    detectCircularDependencies({

        app: ["router", "db"],

        router: ["logger"],

        db: ["cache"],

        cache: ["db"],

        logger: []

    })

);

console.log(

    detectCircularDependencies({

        app: ["router"],

        router: ["logger"],

        logger: []

    })

);