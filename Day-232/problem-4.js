// 🧩 PROBLEM–04: createMiddlewareRouter()

// Logic: Implements a middleware router — a "stack of stacks".

//   mount(path, stack)            — mount a middleware stack at a path prefix
//   route(method, path, ...fns)   — register exact route with inline middlewares
//   dispatch(context)             — route a request to the right stack
//   listRoutes()                  — all routes and mounts

// Dispatch order: exact routes → param-pattern routes → mounted stacks.
// If no route matches, context.routeError is set.

// Helper: build a small middleware stack (Problem-01 logic).
// Self-contained so the router (and its example) never cross-import.


function createMiddlewareStack() {

    const middlewares = [];

    return {
        use(name, fn) {
            if (typeof name !== "string" || typeof fn !== "function") return "Invalid Input";
            if (middlewares.some(m => m.name === name)) {
                return { registered: false, reason: "Middleware already exists: " + name };
            }
            middlewares.push({ name, fn });
            return { registered: true, name };
        },
        execute(context) {

            const executionLog = [];
            let index = 0;
            let completed = true;

            const next = () => { index++; runNext(); };

            const runNext = () => {

                if (index >= middlewares.length) return;

                const entry = middlewares[index];
                const logEntry = { name: entry.name, called: true, calledNext: false };

                executionLog.push(logEntry);

                const wrappedNext = () => { logEntry.calledNext = true; next(); };

                entry.fn(context, wrappedNext);

                if (!logEntry.calledNext) completed = false;
            };

            runNext();

            if (executionLog.length < middlewares.length) completed = false;

            return {
                finalContext: context,
                executionLog,
                middlewaresExecuted: executionLog.length,
                completed
            };
        }
    };
}

function createMiddlewareRouter() {

    // --- STEP 1: INTERNAL STATE ---

    const routes = []; // { method, path, stack }
    const mounts = []; // { path, stack }

    // Helper: match a route path pattern against a concrete path.

    function matchPath(pattern, path) {

        const patternSegments = pattern.split("/");
        const pathSegments = path.split("/");

        if (patternSegments.length !== pathSegments.length) return null;

        const params = {};

        for (let i = 0; i < patternSegments.length; i++) {
            if (patternSegments[i].startsWith(":")) {
                params[patternSegments[i].slice(1)] = pathSegments[i];
            } else if (patternSegments[i] !== pathSegments[i]) {
                return null;
            }
        }

        return params;
    }

    // Helper: find the best matching route for a method + path.

    function findRoute(method, path) {

        // 1. Exact match.

        const exact = routes.find(r => r.method === method && r.path === path);
        if (exact) return { route: exact, params: {} };

        // 2. Param-pattern match.

        for (const route of routes) {
            if (route.method !== method) continue;
            const params = matchPath(route.path, path);
            if (params !== null) return { route, params };
        }

        return null;
    }

    // --- STEP 2: ROUTER METHODS ---

    return {
        // mount(path, stack): mount a stack at a path prefix.
        mount(path, stack) {

            if (
                typeof path !== "string" || !path.startsWith("/") ||
                typeof stack !== "object" || stack === null ||
                typeof stack.execute !== "function"
            ) {
                return "Invalid Input";
            }

            mounts.push({ path, stack });

            return { mounted: true, path };
        },

        // route(method, path, ...middlewareFns): register an exact route.
        route(method, path, ...middlewareFns) {

            const validMethods = ["GET", "POST", "PUT", "DELETE"];

            if (
                !validMethods.includes(method) ||
                typeof path !== "string" || !path.startsWith("/") ||
                middlewareFns.length === 0 ||
                !middlewareFns.every(fn => typeof fn === "function")
            ) {
                return "Invalid Input";
            }

            // Build an internal stack from the inline middlewares.

            const stack = createMiddlewareStack();

            middlewareFns.forEach((fn, i) => {
                stack.use("mw" + (i + 1), fn);
            });

            routes.push({ method, path, stack });

            return { registered: true, method, path };
        },

        // dispatch(context): route a request through the right stacks.
        dispatch(context) {

            if (
                typeof context !== "object" || context === null || Array.isArray(context) ||
                typeof context.method !== "string" ||
                typeof context.path !== "string" || !context.path.startsWith("/")
            ) {
                return "Invalid Input";
            }

            const match = findRoute(context.method, context.path);

            // --- NO MATCH ---

            if (match === null) {
                context.routeError = "No route matched: " + context.method + " " + context.path;
                return { finalContext: context, matchedRoute: null, completed: false };
            }

            // Attach extracted path params.

            context.params = match.params;

            // Run all mounted stacks whose prefix matches the path.

            for (const mount of mounts) {
                if (context.path.startsWith(mount.path)) {
                    mount.stack.execute(context);
                }
            }

            // Run the matched route's stack.

            const result = match.route.stack.execute(context);

            return {
                ...result,
                finalContext: context,
                matchedRoute: { method: match.route.method, path: match.route.path }
            };
        },

        // listRoutes(): routes + mounts.
        listRoutes() {

            return {
                routes: routes.map(r => ({ type: "ROUTE", method: r.method, path: r.path })),
                mounts: mounts.map(m => ({ type: "MOUNT", path: m.path }))
            };
        }
    };
}


// ------ EXAMPLE USAGE ------

// --- Build a middleware router ---
const router = createMiddlewareRouter();

// Mount a logging stack at /api
const apiStack = createMiddlewareStack();
apiStack.use("apiLogger", (ctx, next) => { ctx.apiLogged = true; next(); });
console.log(router.mount("/api", apiStack));


// Register exact routes
console.log(router.route("GET", "/api/users", (ctx, next) => { ctx.result = "list of users"; next(); }));


console.log(router.route("GET", "/api/users/:id", (ctx, next) => { ctx.result = "user " + ctx.params.id; next(); }));


console.log(router.route("POST", "/api/users", (ctx, next) => { ctx.result = "user created"; next(); }));


// --- dispatch with mount + route + path param ---
console.log(router.dispatch({ method: "GET", path: "/api/users/U1" }));


// --- dispatch no match ---
console.log(router.dispatch({ method: "DELETE", path: "/api/orders" }));


// --- listRoutes ---
console.log(router.listRoutes());

// --- INVALID: bad method ---
console.log(router.route("PATCH", "/x", (ctx, next) => { }));