// 🧩 PROBLEM–02: routeByVersion()

// Logic: Routes an API request based on its version. Version is detected from the path first, then request headers, otherwise defaults to "v1".

function routeByVersion(request, versionHandlers) {

    // --- STEP 1: VALIDATION ---
    // Request must be a valid object and versionHandlers
    // must be a non-empty object.

    if (
        typeof request !== "object" ||
        request === null ||
        Array.isArray(request) ||
        typeof versionHandlers !== "object" ||
        versionHandlers === null ||
        Array.isArray(versionHandlers) ||
        Object.keys(versionHandlers).length === 0
    ) {
        return "Invalid Input";
    }

    const {
        path,
        method,
        headers
    } = request;

    if (
        typeof path !== "string" ||
        !path.startsWith("/") ||
        typeof method !== "string" ||
        typeof headers !== "object" ||
        headers === null ||
        Array.isArray(headers)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: DETECT API VERSION ---
    // Priority:
    // 1. Version from path
    // 2. API-Version header
    // 3. Default to "v1"

    const versionMatch = path.match(/^\/api\/(v\d+)/);

    const version = versionMatch
        ? versionMatch[1]
        : headers["API-Version"] || "v1";

    // Version not supported.

    if (!(version in versionHandlers)) {

        return {
            routed: false,
            reason: `Version not supported: ${version}`
        };

    }

    // --- STEP 3: BUILD RESOURCE PATH ---
    // Remove "/api/vX" from the path.

    const resourcePath = versionMatch
        ? path.replace(/^\/api\/v\d+/, "") || "/"
        : path;

    // Build lookup key.

    const lookupKey = `${method}_${resourcePath}`;

    // --- STEP 4: FIND HANDLER ---

    const handler = versionHandlers[version][lookupKey];

    if (!handler) {

        return {
            routed: false,
            reason: `Route not found in ${version}`
        };

    }

    // --- STEP 5: RETURN RESULT ---

    return {
        routed: true,
        version,
        handler,
        resourcePath
    };

}

// --- EXAMPLE USAGE ---
console.log(
    routeByVersion(
        {
            path: "/api/v2/users",
            method: "GET",
            headers: {}
        },
        {
            v1: {
                "GET_/users": "getUsersV1",
                "POST_/users": "createUserV1"
            },
            v2: {
                "GET_/users": "getUsersV2",
                "GET_/users/profile": "getUserProfileV2"
            }
        }
    )
);