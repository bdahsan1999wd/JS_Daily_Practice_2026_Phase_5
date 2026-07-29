// 🧩 PROBLEM–01: runMiddlewareChain()

// Logic: Simulates a middleware pipeline. Each middleware receives the current request and context, may modify them, or block the request. Execution stops immediately if any middleware blocks the request.

function runMiddlewareChain(request, middlewares) {

    // --- STEP 1: VALIDATION ---
    if (
        typeof request !== "object" ||
        request === null ||
        !["GET", "POST", "PUT", "DELETE"].includes(request.method) ||
        typeof request.path !== "string" ||
        request.path.trim() === "" ||
        typeof request.headers !== "object" ||
        request.headers === null ||
        !(
            request.body === null ||
            (
                typeof request.body === "object" &&
                !Array.isArray(request.body)
            )
        ) ||
        !Array.isArray(middlewares) ||
        middlewares.length === 0 ||
        !middlewares.every(middleware => typeof middleware === "function")
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INITIALIZE CONTEXT ---
    let currentRequest = { ...request };

    let context = {
        logs: [],
        startTime: "2025-01-01T00:00:00Z"
    };

    let middlewaresRun = 0;

    // --- STEP 3: EXECUTE MIDDLEWARE CHAIN ---
    for (const middleware of middlewares) {

        middlewaresRun++;

        const result = middleware(currentRequest, context);

        currentRequest = result.req;
        context = result.context;

        if (result.blocked) {

            return {
                finalRequest: currentRequest,
                context,
                blocked: true,
                blockReason: result.blockReason,
                middlewaresRun
            };

        }

    }

    // --- STEP 4: RETURN RESULT ---
    return {
        finalRequest: currentRequest,
        context,
        blocked: false,
        blockReason: null,
        middlewaresRun
    };

}

// --- EXAMPLE USAGE ---
console.log(
    runMiddlewareChain(
        {
            method: "GET",
            path: "/api/users",
            headers: {
                "x-api-key": "valid-key"
            },
            body: null
        },
        [
            (req, ctx) => {

                ctx.logs.push(
                    `Logger: ${req.method} ${req.path}`
                );

                return {
                    req,
                    context: ctx,
                    blocked: false,
                    blockReason: null
                };

            },

            (req, ctx) => {

                if (!req.headers["x-api-key"]) {

                    return {
                        req,
                        context: ctx,
                        blocked: true,
                        blockReason: "Missing API key"
                    };

                }

                ctx.logs.push("Auth: API key validated");

                return {
                    req,
                    context: ctx,
                    blocked: false,
                    blockReason: null
                };

            }
        ]
    )
);