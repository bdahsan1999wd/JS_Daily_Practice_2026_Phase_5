// 🧩 PROBLEM–03: createCORSPolicyBuilder()

// Logic: Fluent CORS policy builder with method chaining.
// Build-time validation: wildcard+credentials conflict, at least one method.

function createCORSPolicyBuilder() {

    let allowedOrigins = [];
    let allowedPatterns = [];
    let allowAllOrigins = false;
    let allowedMethods = [];
    let allowedHeaders = [];
    let exposedHeaders = [];
    let allowCredentials = false;
    let maxAgeSeconds = 0;

    // --- HELPERS ---
    function pushUnique(arr, value) {
        if (!arr.includes(value)) arr.push(value);
        return arr;
    }

    // --- PUBLIC API (chainable) ---
    return {

        allowOrigin(origin) {
            if (typeof origin !== "string" || origin.length === 0) return "Invalid Input";
            pushUnique(allowedOrigins, origin);
            return this;
        },

        allowOriginPattern(pattern) {
            if (typeof pattern !== "string" || pattern.length === 0) return "Invalid Input";
            pushUnique(allowedPatterns, pattern);
            return this;
        },

        allowAllOrigins() {
            allowAllOrigins = true;
            return this;
        },

        allowMethod(method) {
            if (typeof method !== "string" || method.length === 0) return "Invalid Input";
            pushUnique(allowedMethods, method);
            return this;
        },

        allowMethods(methods) {
            if (!Array.isArray(methods)) return "Invalid Input";
            for (const method of methods) {
                if (typeof method !== "string" || method.length === 0) return "Invalid Input";
                pushUnique(allowedMethods, method);
            }
            return this;
        },

        allowHeader(header) {
            if (typeof header !== "string" || header.length === 0) return "Invalid Input";
            pushUnique(allowedHeaders, header);
            return this;
        },

        allowHeaders(headers) {
            if (!Array.isArray(headers)) return "Invalid Input";
            for (const header of headers) {
                if (typeof header !== "string" || header.length === 0) return "Invalid Input";
                pushUnique(allowedHeaders, header);
            }
            return this;
        },

        exposeHeader(header) {
            if (typeof header !== "string" || header.length === 0) return "Invalid Input";
            pushUnique(exposedHeaders, header);
            return this;
        },

        withCredentials(bool) {
            if (typeof bool !== "boolean") return "Invalid Input";
            allowCredentials = bool;
            return this;
        },

        maxAge(seconds) {
            if (typeof seconds !== "number" || !Number.isInteger(seconds) || seconds < 0) return "Invalid Input";
            maxAgeSeconds = seconds;
            return this;
        },

        build() {

            const validationErrors = [];

            if (allowAllOrigins && allowCredentials) {
                validationErrors.push("Cannot use wildcard origin with credentials");
            }

            if (allowedMethods.length === 0) {
                validationErrors.push("At least one method must be allowed");
            }

            return {
                allowedOrigins: [...allowedOrigins],
                allowedPatterns: [...allowedPatterns],
                allowAllOrigins,
                allowedMethods: [...allowedMethods],
                allowedHeaders: [...allowedHeaders],
                exposedHeaders: [...exposedHeaders],
                allowCredentials,
                maxAgeSeconds,
                isValid: validationErrors.length === 0,
                validationErrors
            };
        },

        buildMiddlewareConfig() {

            const policy = this.build();

            return {
                cors: {
                    origin: allowAllOrigins ? "*" : [...allowedOrigins, ...allowedPatterns],
                    methods: [...allowedMethods],
                    allowedHeaders: [...allowedHeaders],
                    exposedHeaders: [...exposedHeaders],
                    credentials: allowCredentials,
                    maxAge: maxAgeSeconds
                },
                isValid: policy.isValid,
                validationErrors: [...policy.validationErrors]
            };
        },

        reset() {
            allowedOrigins = [];
            allowedPatterns = [];
            allowAllOrigins = false;
            allowedMethods = [];
            allowedHeaders = [];
            exposedHeaders = [];
            allowCredentials = false;
            maxAgeSeconds = 0;
            return this;
        }
    };
}


// ------ EXAMPLE USAGE ------

const builder = createCORSPolicyBuilder();

const policy = builder
    .allowOrigin("https://myapp.com")
    .allowOriginPattern("https://*.staging.myapp.com")
    .allowMethod("GET")
    .allowMethods(["POST", "PUT", "DELETE"])
    .allowHeaders(["Content-Type", "Authorization"])
    .exposeHeader("X-Request-Id")
    .withCredentials(true)
    .maxAge(86400)
    .build();

console.log(policy);

// Invalid: wildcard + credentials
builder.reset();
console.log(builder.allowAllOrigins().withCredentials(true).allowMethod("GET").build());


// --- INVALID ---
console.log(createCORSPolicyBuilder().allowOrigin(""));