// 🧩 PROBLEM–01: createMiddlewareStack()

// Logic: Implements a core middleware stack.

// Middlewares run in registration order; each receives (context, next).

// If next() is NOT called, the chain stops at that middleware.

// Methods:
//   use(name, middlewareFn) — register a middleware
//   remove(name)            — remove a middleware by name
//   execute(context)        — run all middlewares in order
//   listMiddlewares()       — registered names in order
//   size()                  — count of registered middlewares


function createMiddlewareStack() {

    // --- STEP 1: INTERNAL STATE ---

    const middlewares = []; // array of { name, fn }

    // --- STEP 2: STACK METHODS ---

    return {
        // use(name, middlewareFn): register a middleware.
        use(name, middlewareFn) {

            if (
                typeof name !== "string" || name.trim() === "" ||
                typeof middlewareFn !== "function"
            ) {
                return "Invalid Input";
            }

            if (middlewares.some(m => m.name === name)) {
                return { registered: false, reason: "Middleware already exists: " + name };
            }

            middlewares.push({ name, fn: middlewareFn });

            return { registered: true, name, position: middlewares.length - 1 };
        },

        // remove(name): remove a middleware by name.
        remove(name) {

            if (typeof name !== "string" || name.trim() === "") {
                return "Invalid Input";
            }

            const index = middlewares.findIndex(m => m.name === name);

            if (index === -1) {
                return { error: "Middleware not found: " + name };
            }

            middlewares.splice(index, 1);

            return { removed: true, name };
        },

        // execute(context): run all middlewares in order.
        execute(context) {

            if (typeof context !== "object" || context === null || Array.isArray(context)) {
                return "Invalid Input";
            }

            const executionLog = [];
            let index = 0;
            let completed = true;

            // next() advances the chain. We use a recursive helper so a
            // middleware can decide whether to keep going (or stop).

            const next = () => {
                index++;
                runNext();
            };

            const runNext = () => {

                if (index >= middlewares.length) return;

                const entry = middlewares[index];
                const logEntry = { name: entry.name, called: true, calledNext: false };

                executionLog.push(logEntry);

                // Wrap next() so we can record whether it was called.

                const wrappedNext = () => {
                    logEntry.calledNext = true;
                    next();
                };

                entry.fn(context, wrappedNext);

                // If this middleware did NOT call next() → chain stops.

                if (!logEntry.calledNext) {
                    completed = false;
                }
            };

            runNext();

            // If we never called next on the LAST middleware, the chain is
            // complete only when all middlewares were executed.

            if (executionLog.length < middlewares.length) {
                completed = false;
            }

            return {
                finalContext: context,
                executionLog,
                middlewaresExecuted: executionLog.length,
                completed
            };
        },

        // listMiddlewares(): registered names in order.
        listMiddlewares() {
            return middlewares.map(m => m.name);
        },

        // size(): count of registered middlewares.
        size() {
            return middlewares.length;
        }
    };
}


// ------ EXAMPLE USAGE ------

// --- Build a middleware stack ---
const stack = createMiddlewareStack();


// --- register middlewares ---
console.log(stack.use("logger", (ctx, next) => {
    ctx.logs = ctx.logs || [];
    ctx.logs.push("Logger: request received");
    next();
}));


console.log(stack.use("auth", (ctx, next) => {
    if (!ctx.token) {
        ctx.error = "Unauthorized";
        // does NOT call next() → chain stops
    } else {
        ctx.user = "AuthenticatedUser";
        next();
    }
}));


console.log(stack.use("handler", (ctx, next) => {
    ctx.response = "Hello " + ctx.user;
    next();
}));


// --- execute: full chain ---
console.log(stack.execute({ token: "valid-token" }));


// --- execute: chain stops at auth ---
console.log(stack.execute({ token: null }));


// --- remove ---
console.log(stack.remove("handler"));


// --- size ---
console.log(stack.size());


// --- INVALID: bad middleware fn ---
console.log(stack.use("bad", "not-a-function"));