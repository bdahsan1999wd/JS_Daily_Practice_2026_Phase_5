// 🧩 PROBLEM–04: createRouter()

// Logic: Implements the Router of a Mini MVC framework.

// Supports dynamic path params (:id style) and returns:

//   register(method, path, handler) — register a route
//   dispatch(method, path, payload) — match + execute a route handler
//   listRoutes()                    — all registered routes
//   unregister(method, path)        — remove a route

function createRouter() {

    // --- STEP 1: INTERNAL ROUTE STORE ---
    // Route key = method + "_" + path. Each entry also keeps its
    // path segments for param matching.

    const routes = new Map();

    // Helper: validate a method.

    function isValidMethod(method) {
        return method === "GET" || method === "POST" || method === "PUT" || method === "DELETE";
    }

    // Helper: validate a path (non-empty string starting with "/").

    function isValidPath(path) {
        return typeof path === "string" && path.length > 0 && path.startsWith("/");
    }

    // Helper: try to match a concrete path against a route path pattern.
    // Route pattern may contain :param segments. Returns params object
    // or null if no match.

    function matchPath(pattern, path) {

        const patternSegments = pattern.split("/");
        const pathSegments = path.split("/");

        if (patternSegments.length !== pathSegments.length) return null;

        const params = {};

        for (let i = 0; i < patternSegments.length; i++) {

            const p = patternSegments[i];
            const v = pathSegments[i];

            // :param segment captures the value.

            if (p.startsWith(":")) {
                params[p.slice(1)] = v;
            } else if (p !== v) {
                return null;
            }
        }

        return params;
    }

    // --- STEP 2: ROUTER METHODS ---

    return {
        // register(method, path, handler): add a route.
        register(method, path, handler) {

            if (
                !isValidMethod(method) ||
                !isValidPath(path) ||
                typeof handler !== "function"
            ) {
                return "Invalid Input";
            }

            const key = method + "_" + path;

            if (routes.has(key)) {
                return { registered: false, reason: "Route already exists" };
            }

            routes.set(key, { method, path, handler });

            return { registered: true, method, path };
        },

        // dispatch(method, path, payload): match + execute.
        dispatch(method, path, payload) {

            if (
                !isValidMethod(method) ||
                !isValidPath(path)
            ) {
                return "Invalid Input";
            }

            // 1. Exact route match.

            const exactKey = method + "_" + path;

            if (routes.has(exactKey)) {
                const route = routes.get(exactKey);
                const result = route.handler({ params: {}, payload });
                return { dispatched: true, method, path, result };
            }

            // 2. Pattern match (path params).

            for (const route of routes.values()) {
                if (route.method !== method) continue;

                const params = matchPath(route.path, path);

                if (params !== null) {
                    const result = route.handler({ params, payload });
                    return { dispatched: true, method, path, result };
                }
            }

            // 3. No match.

            return { dispatched: false, reason: "No route found for " + method + " " + path };
        },

        // listRoutes(): array of { method, path }.
        listRoutes() {
            const result = [];

            for (const route of routes.values()) {
                result.push({ method: route.method, path: route.path });
            }

            return result;
        },

        // unregister(method, path): remove a route.
        unregister(method, path) {

            if (!isValidMethod(method) || !isValidPath(path)) {
                return "Invalid Input";
            }

            const key = method + "_" + path;

            if (!routes.has(key)) {
                return { error: "Route not found" };
            }

            routes.delete(key);

            return { unregistered: true, method, path };
        }
    };
}



// ------ EXAMPLE USAGE ------

// --- Build a router ---
const router = createRouter();


// --- register routes ---
console.log(router.register("GET", "/users", ({ payload }) => ({ action: "list users", payload })));


console.log(router.register("GET", "/users/:id", ({ params }) => ({ action: "get user", id: params.id })));


console.log(router.register("POST", "/users", ({ payload }) => ({ action: "create user", data: payload })));



// --- register duplicate ---
console.log(router.register("GET", "/users", () => ({})));

// --- listRoutes ---
console.log(router.listRoutes());

// --- dispatch exact route ---
console.log(router.dispatch("GET", "/users", { page: 1 }));

// --- dispatch with path param ---
console.log(router.dispatch("GET", "/users/User_1", null));

// --- dispatch no match ---
console.log(router.dispatch("DELETE", "/users", null));

// --- unregister ---
console.log(router.unregister("POST", "/users"));

// --- unregister not found ---
console.log(router.unregister("POST", "/users"));

// --- INVALID: bad method ---
console.log(router.register("PATCH", "/x", () => ({})));