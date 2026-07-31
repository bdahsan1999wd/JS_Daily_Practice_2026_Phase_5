// 🧩 PROBLEM–05: runAPIGateway()

// Logic: Simulates an API Gateway by routing every incoming request.
// For each request:
// 1. Detect API version
// 2. Match the route and extract params
// 3. Check deprecation status
// 4. Store the gateway result

function runAPIGateway(incomingRequests, gatewayConfig) {

    // --- STEP 1: VALIDATION ---
    // Requests must be a non-empty array and
    // gatewayConfig must contain all required properties.

    if (
        !Array.isArray(incomingRequests) ||
        incomingRequests.length === 0 ||
        typeof gatewayConfig !== "object" ||
        gatewayConfig === null ||
        Array.isArray(gatewayConfig)
    ) {
        return "Invalid Input";
    }

    const {
        versionHandlers,
        routeDefinitions,
        deprecatedPaths
    } = gatewayConfig;

    if (
        typeof versionHandlers !== "object" ||
        versionHandlers === null ||
        Array.isArray(versionHandlers) ||
        !Array.isArray(routeDefinitions) ||
        !Array.isArray(deprecatedPaths)
    ) {
        return "Invalid Input";
    }

    const isValidRequests = incomingRequests.every(request =>
        typeof request === "object" &&
        request !== null &&
        typeof request.requestId === "string" &&
        typeof request.path === "string" &&
        typeof request.method === "string" &&
        typeof request.headers === "object" &&
        request.headers !== null &&
        !Array.isArray(request.headers)
    );

    if (!isValidRequests) {
        return "Invalid Input";
    }

    // --- STEP 2: PROCESS REQUESTS ---
    // Execute the gateway pipeline for every request.

    const gatewayLog = [];

    for (const request of incomingRequests) {

        // -------- Version Routing --------

        const versionMatch = request.path.match(/^\/api\/(v\d+)/);

        const version = versionMatch
            ? versionMatch[1]
            : request.headers["API-Version"] || "v1";

        let routed = false;
        let handler = null;

        if (versionHandlers[version]) {

            const resourcePath = versionMatch
                ? request.path.replace(/^\/api\/v\d+/, "") || "/"
                : request.path;

            const lookupKey = `${request.method}_${resourcePath}`;

            if (versionHandlers[version][lookupKey]) {

                routed = true;
                handler = versionHandlers[version][lookupKey];

            }

        }

        // -------- Route Matching --------

        const params = {};

        for (const route of routeDefinitions) {

            if (route.method !== request.method) {
                continue;
            }

            const requestSegments = request.path
                .split("/")
                .filter(Boolean);

            const patternSegments = route.pattern
                .split("/")
                .filter(Boolean);

            if (requestSegments.length !== patternSegments.length) {
                continue;
            }

            let matched = true;

            for (let i = 0; i < patternSegments.length; i++) {

                const pattern = patternSegments[i];
                const current = requestSegments[i];

                if (pattern.startsWith(":")) {

                    params[pattern.slice(1)] = current;

                } else if (pattern !== current) {

                    matched = false;
                    break;

                }

            }

            if (matched) {
                break;
            }

        }

        // -------- Deprecation Check --------

        const warning = deprecatedPaths.includes(request.path)
            ? "This route is deprecated"
            : null;

        gatewayLog.push({
            requestId: request.requestId,
            routed,
            version,
            handler,
            params,
            warning
        });

    }

    // --- STEP 3: RETURN RESULT ---

    return {
        gatewayLog
    };

}

// --- EXAMPLE USAGE ---
console.log(
    runAPIGateway(
        [
            {
                requestId: "REQ-1",
                path: "/api/v2/users/U123",
                method: "GET",
                headers: {}
            },
            {
                requestId: "REQ-2",
                path: "/api/v1/products",
                method: "GET",
                headers: {}
            }
        ],
        {
            versionHandlers: {
                v1: {
                    "GET_/products": "getProductsV1"
                },
                v2: {
                    "GET_/users/U123": "getUserV2"
                }
            },
            routeDefinitions: [
                {
                    pattern: "/api/v2/users/:userId",
                    method: "GET",
                    handler: "getUserV2"
                },
                {
                    pattern: "/api/v1/products",
                    method: "GET",
                    handler: "getProductsV1"
                }
            ],
            deprecatedPaths: [
                "/api/v1/products"
            ]
        }
    )
);