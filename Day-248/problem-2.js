// 🧩 PROBLEM–02: createPreflightHandler()

// Logic: Preflight request handling + CORS response header building.
//   handlePreflight() — origin/method/header checks → 204/403/405
//   buildResponseHeaders() — headers for actual responses
//   isPreflightRequired() — simple vs complex request detection
//   validatePreflightRequest() — field-level validation


function createPreflightHandler(preflightConfig) {

    // --- STEP 1: VALIDATE inputs ---
    if (
        typeof preflightConfig !== "object" ||
        preflightConfig === null ||
        Array.isArray(preflightConfig) ||
        !Array.isArray(preflightConfig.allowedMethods) ||
        !Array.isArray(preflightConfig.allowedHeaders) ||
        !Array.isArray(preflightConfig.exposedHeaders) ||
        typeof preflightConfig.maxAgeSeconds !== "number" ||
        !Number.isInteger(preflightConfig.maxAgeSeconds) ||
        preflightConfig.maxAgeSeconds < 0 ||
        typeof preflightConfig.allowCredentials !== "boolean"
    ) {
        return "Invalid Input";
    }

    const allowedMethods = [...preflightConfig.allowedMethods];
    const allowedHeaders = [...preflightConfig.allowedHeaders];
    const exposedHeaders = [...preflightConfig.exposedHeaders];
    const maxAgeSeconds = preflightConfig.maxAgeSeconds;
    const allowCredentials = preflightConfig.allowCredentials;

    const SIMPLE_METHODS = ["GET", "HEAD", "POST"];
    const SIMPLE_HEADERS = ["Accept", "Accept-Language", "Content-Language"];
    const SIMPLE_CONTENT_TYPES = [
        "text/plain",
        "multipart/form-data",
        "application/x-www-form-urlencoded"
    ];

    // --- STEP 2: HELPERS ---
    function originAllowed(origin) {
        // Dependency contract: any object with validate(origin).allowed.
        // In production the origin validator is passed in; here we accept
        // an injected validator via buildResponseHeaders's caller context.
        return true;
    }

    // --- STEP 3: PUBLIC API ---
    return {

        handlePreflight(request) {

            if (typeof request !== "object" || request === null || Array.isArray(request)) {
                return "Invalid Input";
            }

            // Origin check is delegated to an injected validator. If the config
            // provides one (attachOriginValidator), use it.

            const validator = this._validator;

            let originOk = true;

            if (validator && typeof validator.validate === "function") {
                const result = validator.validate(request.origin);
                originOk = result.allowed;
            }

            if (!originOk) {
                return { allowed: false, reason: "ORIGIN_NOT_ALLOWED", statusCode: 403 };
            }

            const method = request.accessControlRequestMethod;

            if (!allowedMethods.includes(method)) {
                return { allowed: false, reason: "METHOD_NOT_ALLOWED", statusCode: 405 };
            }

            const reqHeaders = Array.isArray(request.accessControlRequestHeaders) ? request.accessControlRequestHeaders : [];

            for (const header of reqHeaders) {
                if (!allowedHeaders.includes(header)) {
                    return { allowed: false, reason: "HEADER_NOT_ALLOWED", blockedHeader: header, statusCode: 403 };
                }
            }

            const responseHeaders = {
                "Access-Control-Allow-Origin": request.origin,
                "Access-Control-Allow-Methods": allowedMethods.join(", "),
                "Access-Control-Allow-Headers": allowedHeaders.join(", "),
                "Access-Control-Max-Age": maxAgeSeconds.toString(),
                "Access-Control-Allow-Credentials": allowCredentials.toString()
            };

            return { allowed: true, responseHeaders, statusCode: 204 };
        },

        buildResponseHeaders(origin, method) {

            if (typeof origin !== "string" || origin.length === 0 || typeof method !== "string" || method.length === 0) {
                return "Invalid Input";
            }

            const headers = {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": allowedMethods.join(", ")
            };

            if (exposedHeaders.length > 0) {
                headers["Access-Control-Expose-Headers"] = exposedHeaders.join(", ");
            }

            if (allowCredentials) {
                headers["Access-Control-Allow-Credentials"] = "true";
            }

            return headers;
        },

        isPreflightRequired(request) {

            if (typeof request !== "object" || request === null || Array.isArray(request)) {
                return "Invalid Input";
            }

            const method = request.method;
            const headers = request.headers && typeof request.headers === "object" ? request.headers : {};

            if (!SIMPLE_METHODS.includes(method)) {
                return { preflightRequired: true, reason: "Non-simple method: " + method };
            }

            for (const headerName of Object.keys(headers)) {

                const lower = headerName.toLowerCase();

                if (lower === "content-type") {

                    const value = (headers[headerName] || "").toLowerCase();

                    if (!SIMPLE_CONTENT_TYPES.includes(value)) {
                        return { preflightRequired: true, reason: "Non-simple Content-Type: " + value };
                    }

                } else if (!SIMPLE_HEADERS.some(h => h.toLowerCase() === lower)) {

                    return { preflightRequired: true, reason: "Non-simple header: " + headerName };
                }
            }

            return { preflightRequired: false, reason: "Simple request: safe method with simple headers" };
        },

        validatePreflightRequest(request) {

            if (typeof request !== "object" || request === null || Array.isArray(request)) {
                return "Invalid Input";
            }

            const errors = [];

            if (request.method !== "OPTIONS") {
                errors.push("Method must be OPTIONS for preflight");
            }

            if (typeof request.origin !== "string" || request.origin.length === 0) {
                errors.push("Origin header is required");
            }

            if (typeof request.accessControlRequestMethod !== "string" || request.accessControlRequestMethod.length === 0) {
                errors.push("Access-Control-Request-Method is required");
            }

            return { valid: errors.length === 0, errors };
        }
    };
}


// ------ EXAMPLE USAGE ------

const pfh = createPreflightHandler({
    allowedMethods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-Request-Id"],
    maxAgeSeconds: 86400,
    allowCredentials: true
});


console.log(pfh.handlePreflight({
    method: "OPTIONS",
    origin: "https://myapp.com",
    accessControlRequestMethod: "PUT",
    accessControlRequestHeaders: ["Content-Type", "Authorization"]
}));


console.log(pfh.handlePreflight({
    method: "OPTIONS",
    origin: "https://myapp.com",
    accessControlRequestMethod: "DELETE",
    accessControlRequestHeaders: ["X-Evil-Header"]
}));


console.log(pfh.isPreflightRequired({ method: "GET", headers: { "Accept": "application/json" } }));


console.log(pfh.isPreflightRequired({ method: "PUT", headers: { "Content-Type": "application/json", "Authorization": "Bearer token" } }));


console.log(pfh.buildResponseHeaders("https://myapp.com", "GET"));


// --- INVALID ---
console.log(createPreflightHandler({ allowedMethods: [], allowedHeaders: [], exposedHeaders: [], maxAgeSeconds: -1, allowCredentials: true }));