// 🧩 PROBLEM–04: buildAPIRegistry()

// Logic: Builds a registry of APIs grouped by version. Also tracks deprecated routes and generates a summary for each API version.

function buildAPIRegistry(apiDefinitions) {

    // --- STEP 1: VALIDATION ---
    // Input must be a non-empty array of valid API definitions.

    if (
        !Array.isArray(apiDefinitions) ||
        apiDefinitions.length === 0
    ) {
        return "Invalid Input";
    }

    const isValidDefinitions = apiDefinitions.every(api =>
        typeof api === "object" &&
        api !== null &&
        typeof api.version === "string" &&
        typeof api.method === "string" &&
        typeof api.path === "string" &&
        api.path.startsWith("/") &&
        typeof api.handler === "string" &&
        typeof api.deprecated === "boolean"
    );

    if (!isValidDefinitions) {
        return "Invalid Input";
    }

    // --- STEP 2: BUILD REGISTRY ---
    // Group routes by version while collecting
    // deprecated routes and summary statistics.

    const registry = {};
    const deprecatedRoutes = [];
    const versionSummary = {};

    for (const api of apiDefinitions) {

        // Create version entry if it doesn't exist.

        if (!registry[api.version]) {

            registry[api.version] = [];

            versionSummary[api.version] = {
                total: 0,
                deprecated: 0,
                active: 0
            };

        }

        registry[api.version].push(api);

        versionSummary[api.version].total++;

        if (api.deprecated) {

            deprecatedRoutes.push({
                version: api.version,
                method: api.method,
                path: api.path
            });

            versionSummary[api.version].deprecated++;

        } else {

            versionSummary[api.version].active++;

        }

    }

    // --- STEP 3: RETURN RESULT ---

    return {
        registry,
        deprecatedRoutes,
        routeCount: apiDefinitions.length,
        versionSummary
    };

}

// --- EXAMPLE USAGE ---
console.log(
    buildAPIRegistry([
        {
            version: "v1",
            method: "GET",
            path: "/users",
            handler: "getUsersV1",
            deprecated: true
        },
        {
            version: "v1",
            method: "POST",
            path: "/users",
            handler: "createUserV1",
            deprecated: false
        },
        {
            version: "v2",
            method: "GET",
            path: "/users",
            handler: "getUsersV2",
            deprecated: false
        }
    ])
);