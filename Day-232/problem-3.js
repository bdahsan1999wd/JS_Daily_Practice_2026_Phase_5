// 🧩 PROBLEM–03: createErrorAwareStack()

// Logic: Extends the middleware stack with error handling.
//   use(name, middlewareFn)        — normal middleware
//   useError(name, errorHandlerFn) — error-handling middleware
//   execute(context)               — run stack with error propagation

// Errors can be thrown by a normal middleware OR signaled by setting
// context.error without calling next(). When an error occurs:

//   - remaining normal middlewares are skipped
//   - error handlers run in registration order
//   - error handlers may call next() (pass along) or resolve the error
//   - setting context.errorHandled = true stops the error chain


function createErrorAwareStack() {

    // --- STEP 1: INTERNAL STATE ---

    const middlewares = []; // { name, fn, type }

    // --- STEP 2: EXECUTION ---

    function execute(context) {

        if (typeof context !== "object" || context === null || Array.isArray(context)) {
            return "Invalid Input";
        }

        // Prebuild one log entry per middleware (registration order),
        // so even never-called middlewares appear with called: false.

        const log = middlewares.map(m => ({
            name: m.name,
            type: m.type,
            called: false,
            threw: false,
            calledNext: false
        }));

        let error = null;
        let errorHandled = false;
        let completed = true;

        function nextFrom(i) {

            if (i >= middlewares.length) return;

            const mw = middlewares[i];
            const entry = log[i];

            // --- NORMAL MODE (no error yet) ---

            if (error === null) {

                if (mw.type === "ERROR_HANDLER") {
                    // Error handlers are skipped in normal mode.
                    nextFrom(i + 1);
                    return;
                }

                entry.called = true;

                let threw = false;

                try {
                    mw.fn(context, () => { entry.calledNext = true; nextFrom(i + 1); });
                } catch (e) {
                    threw = true;
                    entry.threw = true;
                    error = e;
                    completed = false;
                    nextFrom(i + 1);
                    return;
                }

                // Middleware neither threw nor called next().

                if (!entry.calledNext) {
                    // If it signaled an error via context.error → error mode.

                    if (context.error !== undefined) {
                        error = context.error;
                        completed = false;
                        nextFrom(i + 1);
                        return;
                    }

                    // Otherwise the chain simply stopped.

                    completed = false;
                }

                return;
            }

            // --- ERROR MODE ---

            if (mw.type === "NORMAL") {
                // Remaining normal middlewares are skipped.
                nextFrom(i + 1);
                return;
            }

            // Run an error handler.

            entry.called = true;

            try {
                mw.fn(error, context, () => { entry.calledNext = true; nextFrom(i + 1); });
            } catch (e) {
                // Error handler itself failed → stop.
                errorHandled = context.errorHandled === true;
                return;
            }

            // Error handler resolved the error.

            if (context.errorHandled === true) {
                errorHandled = true;
                return;
            }

            // If the error handler didn't call next(), the chain stops.

            if (!entry.calledNext) {
                return;
            }
        }

        nextFrom(0);

        return {
            finalContext: context,
            executionLog: log,
            errorOccurred: error !== null,
            errorHandled,
            completed
        };
    }

    // --- STEP 3: STACK METHODS ---

    return {
        // use(name, middlewareFn): register a normal middleware.
        use(name, middlewareFn) {

            if (typeof name !== "string" || name.trim() === "" || typeof middlewareFn !== "function") {
                return "Invalid Input";
            }

            if (middlewares.some(m => m.name === name)) {
                return { registered: false, reason: "Middleware already exists: " + name };
            }

            middlewares.push({ name, fn: middlewareFn, type: "NORMAL" });

            return { registered: true, name };
        },

        // useError(name, errorHandlerFn): register an error handler.
        useError(name, errorHandlerFn) {

            if (typeof name !== "string" || name.trim() === "" || typeof errorHandlerFn !== "function") {
                return "Invalid Input";
            }

            if (middlewares.some(m => m.name === name)) {
                return { registered: false, reason: "Middleware already exists: " + name };
            }

            middlewares.push({ name, fn: errorHandlerFn, type: "ERROR_HANDLER" });

            return { registered: true, name };
        },

        // execute(context): run the stack with error propagation.
        execute,

        // listMiddlewares(): registered names in order.
        listMiddlewares() {
            return middlewares.map(m => m.name);
        },

        // size(): count of registered middlewares.
        size() {
            return middlewares.length;
        },

        // remove(name): remove a middleware.
        remove(name) {
            const index = middlewares.findIndex(m => m.name === name);
            if (index === -1) return { error: "Middleware not found: " + name };
            middlewares.splice(index, 1);
            return { removed: true, name };
        }
    };
}


// ------ EXAMPLE USAGE ------

// --- Build an error-aware stack ---
const stack = createErrorAwareStack();

stack.use("step1", (ctx, next) => { ctx.step1 = true; next(); });
stack.use("step2", (ctx, next) => {
    if (ctx.triggerError) throw new Error("Something went wrong");
    ctx.step2 = true;
    next();
});
stack.use("step3", (ctx, next) => { ctx.step3 = true; next(); });
stack.useError("errorLogger", (err, ctx, next) => {
    ctx.errorLog = "Caught: " + err.message;
    next();
});
stack.useError("errorResolver", (err, ctx, next) => {
    ctx.errorHandled = true;
    ctx.recoveredFrom = err.message;
});


// --- No error ---
console.log(stack.execute({ triggerError: false }));


// --- With error: step2 throws, error handlers run ---
console.log(stack.execute({ triggerError: true }));


// --- INVALID: bad middleware fn ---
console.log(stack.use("bad", "not-fn"));