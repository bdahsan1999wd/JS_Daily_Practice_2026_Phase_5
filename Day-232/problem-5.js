// 🧩 PROBLEM–05: runMiddlewareAppOrchestrator()

// Logic: Full Middleware App Orchestrator — composes Problems 01–04.

// 1. Build a global conditional middleware stack from globalMiddlewares
// 2. Build a router — each registered route responds with its action
// 3. Process each request: run global stack → if not stopped, dispatch to router
// 4. Build summary (totalRequests, successCount, errorCount, routeNotFoundCount)


function runMiddlewareAppOrchestrator(appConfig) {

    // --- STEP 1: VALIDATE appConfig ---

    if (
        typeof appConfig !== "object" ||
        appConfig === null ||
        Array.isArray(appConfig)
    ) {
        return "Invalid Input";
    }

    const { appId, globalMiddlewares, routes, requests } = appConfig;

    if (
        typeof appId !== "string" || appId.trim() === "" ||
        !Array.isArray(globalMiddlewares) ||
        !Array.isArray(routes) || routes.length === 0 ||
        !Array.isArray(requests)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: MIDDLEWARE ACTION FACTORIES ---

    function makeMiddleware(action) {

        switch (action) {
            case "log":
                return (ctx, next) => { ctx.logged = true; next(); };
            case "auth":
                return (ctx, next) => {
                    if (ctx.token) {
                        ctx.authenticated = true;
                        next();
                    } else {
                        ctx.error = "Unauthorized";
                    }
                };
            case "parse":
                return (ctx, next) => {
                    if (ctx.body) ctx.parsed = true;
                    next();
                };
            case "respond":
                return (ctx, next) => {
                    ctx.response = { action: "response", status: "OK" };
                    next();
                };
            default:
                return null;
        }
    }

    // --- STEP 3: BUILD GLOBAL CONDITIONAL STACK (Problem-02 logic) ---

    function buildGlobalStack(globalMiddlewares) {

        const middlewares = [];

        for (const mw of globalMiddlewares) {

            const fn = makeMiddleware(mw.action);

            if (fn === null) return null;

            middlewares.push({
                name: mw.name,
                kind: mw.type,
                fn,
                condition: mw.condition,
                methods: mw.methods
            });
        }

        return {
            execute(context) {

                const executionLog = [];
                let index = 0;
                let completed = true;

                const next = () => { index++; runNext(); };

                const runNext = () => {

                    if (index >= middlewares.length) return;

                    const entry = middlewares[index];
                    const logEntry = { name: entry.name, called: false, skipped: false, calledNext: true };

                    // Evaluate condition.

                    let shouldRun = true;

                    switch (entry.kind) {
                        case "ifCondition":
                            shouldRun = Boolean(context[entry.condition]);
                            break;
                        case "forMethods":
                            shouldRun = Array.isArray(entry.methods) && entry.methods.includes(context.method);
                            break;
                        case "always":
                        default:
                            shouldRun = true;
                    }

                    if (!shouldRun) {
                        logEntry.skipped = true;
                        executionLog.push(logEntry);
                        next();
                        return;
                    }

                    logEntry.called = true;
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
                    executed: executionLog.filter(e => e.called).length,
                    skipped: executionLog.filter(e => e.skipped).length,
                    completed
                };
            }
        };
    }

    const globalStack = buildGlobalStack(globalMiddlewares);

    if (globalStack === null) return "Invalid Input";

    // --- STEP 4: BUILD ROUTER (Problem-04 logic) ---

    function matchPath(pattern, path) {

        const ps = pattern.split("/");
        const vs = path.split("/");

        if (ps.length !== vs.length) return null;

        const params = {};

        for (let i = 0; i < ps.length; i++) {
            if (ps[i].startsWith(":")) params[ps[i].slice(1)] = vs[i];
            else if (ps[i] !== vs[i]) return null;
        }

        return params;
    }

    function dispatchRoute(context) {

        // Exact match first.

        const exact = routes.find(r => r.method === context.method && r.path === context.path);

        if (exact) {
            context.response = { action: exact.action, status: "OK" };
            return true;
        }

        // Param-pattern match.

        for (const route of routes) {
            if (route.method !== context.method) continue;
            const params = matchPath(route.path, context.path);
            if (params !== null) {
                context.params = params;
                context.response = { action: route.action, status: "OK" };
                return true;
            }
        }

        return false;
    }

    // --- STEP 5: PROCESS REQUESTS ---

    const requestLog = [];
    let successCount = 0;
    let errorCount = 0;
    let routeNotFoundCount = 0;

    for (const request of requests) {

        const context = {
            requestId: request.requestId,
            method: request.method,
            path: request.path,
            token: request.token,
            body: request.body
        };

        // Run the global middleware stack.

        const globalResult = globalStack.execute(context);

        const middlewaresExecuted = globalResult.executionLog.length;
        const completed = globalResult.completed;

        // If not stopped → dispatch to the router.

        let routeNotFound = false;

        if (completed) {
            const dispatched = dispatchRoute(context);
            if (!dispatched) {
                routeNotFound = true;
                routeNotFoundCount++;
            }
        }

        // Categorize.

        if (!completed) {
            errorCount++;
        } else if (!routeNotFound) {
            successCount++;
        }

        requestLog.push({
            requestId: request.requestId,
            finalContext: context,
            completed,
            middlewaresExecuted
        });
    }

    // --- STEP 6: BUILD SUMMARY ---

    const summary = {
        totalRequests: requests.length,
        successCount,
        errorCount,
        routeNotFoundCount
    };

    return { appId, requestLog, summary };
}


// ------ EXAMPLE USAGE ------

// --- Full middleware app (matches readme sample) ---
console.log(runMiddlewareAppOrchestrator({
    appId: "MW-APP-01",
    globalMiddlewares: [
        { name: "logger", type: "always", condition: null, methods: null, action: "log" },
        { name: "auth", type: "always", condition: null, methods: null, action: "auth" },
        { name: "bodyParser", type: "forMethods", condition: null, methods: ["POST", "PUT"], action: "parse" }
    ],
    routes: [
        { method: "GET", path: "/users", action: "getUsers" },
        { method: "POST", path: "/users", action: "createUser" }
    ],
    requests: [
        { requestId: "REQ-1", method: "GET", path: "/users", token: "valid-token", body: null },
        { requestId: "REQ-2", method: "POST", path: "/users", token: "valid-token", body: { name: "Rahim" } },
        { requestId: "REQ-3", method: "GET", path: "/users", token: null, body: null }
    ]
}));


// --- INVALID: missing routes ---
console.log(runMiddlewareAppOrchestrator({ appId: "X", globalMiddlewares: [], routes: [], requests: [] }));