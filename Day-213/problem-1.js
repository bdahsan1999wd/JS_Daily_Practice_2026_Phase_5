// 🧩 PROBLEM–01: matchRoute()

// Logic: Matches a request path against available route patterns. Returns the first matched route along with extracted path parameters.

function matchRoute(requestPath, routeDefinitions) {

    // --- STEP 1: VALIDATION ---
    // Request path must be a string and route definitions
    // must be a non-empty array of valid route objects.

    if (
        typeof requestPath !== "string" ||
        requestPath.trim() === "" ||
        !Array.isArray(routeDefinitions) ||
        routeDefinitions.length === 0
    ) {
        return "Invalid Input";
    }

    const isValidRoutes = routeDefinitions.every(route =>
        typeof route === "object" &&
        route !== null &&
        typeof route.pattern === "string" &&
        route.pattern.startsWith("/") &&
        typeof route.method === "string" &&
        typeof route.handler === "string"
    );

    if (!isValidRoutes) {
        return "Invalid Input";
    }

    // --- STEP 2: SPLIT REQUEST PATH ---
    // Break the request path into individual segments.

    const requestSegments = requestPath
        .split("/")
        .filter(Boolean);

    // --- STEP 3: MATCH ROUTES ---
    // Compare the request path against each route pattern.
    // Return the first successful match.

    for (const route of routeDefinitions) {

        const patternSegments = route.pattern
            .split("/")
            .filter(Boolean);

        // Segment count must be identical.
        if (patternSegments.length !== requestSegments.length) {
            continue;
        }

        let matched = true;
        const params = {};

        for (let i = 0; i < patternSegments.length; i++) {

            const pattern = patternSegments[i];
            const current = requestSegments[i];

            // Extract path parameter.
            if (pattern.startsWith(":")) {

                const paramName = pattern.slice(1);
                params[paramName] = current;

                continue;
            }

            // Static segments must match exactly.
            if (pattern !== current) {

                matched = false;
                break;

            }

        }

        if (matched) {

            return {
                matched: true,
                handler: route.handler,
                params
            };

        }

    }

    // --- STEP 4: RETURN RESULT ---

    return {
        matched: false
    };

}

// --- EXAMPLE USAGE ---
console.log(
    matchRoute(
        "/api/users/U123/orders",
        [
            {
                pattern: "/api/products/:productId",
                method: "GET",
                handler: "getProduct"
            },
            {
                pattern: "/api/users/:userId/orders",
                method: "GET",
                handler: "getUserOrders"
            },
            {
                pattern: "/api/users/:userId",
                method: "GET",
                handler: "getUser"
            }
        ]
    )
);