// 🧩 PROBLEM–02: createConditionalStack()

// Logic: Extends the middleware stack (Problem-01 logic) with conditions.

//   useIf(name, conditionFn, middlewareFn)     — runs only if conditionFn(ctx) === true
//   useUnless(name, conditionFn, middlewareFn) — runs only if conditionFn(ctx) === false
//   useFor(name, methods, middlewareFn)        — runs only if ctx.method is in methods
//   use(name, middlewareFn)                    — always runs

// Skipped middlewares are recorded (called:false, skipped:true) and next() auto-called.

function createConditionalStack() {

    // --- STEP 1: INTERNAL STATE ---

    const middlewares = []; // { name, kind, fn, conditionFn, methods }

    // --- STEP 2: EXECUTION ---

    function execute(context) {

        if (typeof context !== "object" || context === null || Array.isArray(context)) {
            return "Invalid Input";
        }

        const executionLog = [];
        let index = 0;
        let executed = 0;
        let skipped = 0;
        let completed = true;

        const next = () => {
            index++;
            runNext();
        };

        const runNext = () => {

            if (index >= middlewares.length) return;

            const entry = middlewares[index];
            const logEntry = { name: entry.name, called: false, skipped: false, calledNext: true };

            // --- EVALUATE CONDITION ---

            let shouldRun = true;

            switch (entry.kind) {
                case "useIf":
                    shouldRun = entry.conditionFn(context) === true;
                    break;
                case "useUnless":
                    shouldRun = entry.conditionFn(context) === false;
                    break;
                case "useFor":
                    shouldRun = Array.isArray(entry.methods) && entry.methods.includes(context.method);
                    break;
                case "use":
                default:
                    shouldRun = true;
            }

            // --- SKIPPED: record and auto-call next ---

            if (!shouldRun) {
                logEntry.skipped = true;
                skipped++;
                executionLog.push(logEntry);
                next();
                return;
            }

            // --- EXECUTE ---

            logEntry.called = true;
            executed++;
            executionLog.push(logEntry);

            const wrappedNext = () => {
                logEntry.calledNext = true;
                next();
            };

            entry.fn(context, wrappedNext);

            // Chain stops if this middleware didn't call next().

            if (!logEntry.calledNext) {
                completed = false;
            }
        };

        runNext();

        if (executionLog.length < middlewares.length) {
            completed = false;
        }

        return { finalContext: context, executionLog, executed, skipped, completed };
    }

    // --- STEP 3: REGISTRATION HELPERS ---

    function validate(name, fn) {
        if (
            typeof name !== "string" || name.trim() === "" ||
            typeof fn !== "function"
        ) {
            return "Invalid Input";
        }

        if (middlewares.some(m => m.name === name)) {
            return { registered: false, reason: "Middleware already exists: " + name };
        }

        return null;
    }

    // --- STEP 4: CONDITIONAL STACK METHODS ---

    return {
        // use(name, middlewareFn): always runs.
        use(name, middlewareFn) {

            const invalid = validate(name, middlewareFn);
            if (invalid) return invalid;

            middlewares.push({ name, kind: "use", fn: middlewareFn, conditionFn: null, methods: null });

            return { registered: true, name };
        },

        // useIf(name, conditionFn, middlewareFn): runs if condition is true.
        useIf(name, conditionFn, middlewareFn) {

            const invalid = validate(name, middlewareFn);
            if (invalid) return invalid;

            if (typeof conditionFn !== "function") return "Invalid Input";

            middlewares.push({ name, kind: "useIf", fn: middlewareFn, conditionFn, methods: null });

            return { registered: true, name };
        },

        // useUnless(name, conditionFn, middlewareFn): runs unless condition is true.
        useUnless(name, conditionFn, middlewareFn) {

            const invalid = validate(name, middlewareFn);
            if (invalid) return invalid;

            if (typeof conditionFn !== "function") return "Invalid Input";

            middlewares.push({ name, kind: "useUnless", fn: middlewareFn, conditionFn, methods: null });

            return { registered: true, name };
        },

        // useFor(name, methods, middlewareFn): runs only for matching methods.
        useFor(name, methods, middlewareFn) {

            const invalid = validate(name, middlewareFn);
            if (invalid) return invalid;

            if (!Array.isArray(methods)) return "Invalid Input";

            middlewares.push({ name, kind: "useFor", fn: middlewareFn, conditionFn: null, methods });

            return { registered: true, name };
        },

        // execute(context): run all middlewares respecting conditions.
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

// --- Build a conditional stack ---
const stack = createConditionalStack();

stack.use("logger", (ctx, next) => { ctx.logged = true; next(); });
stack.useIf("adminOnly", (ctx) => ctx.role === "ADMIN", (ctx, next) => { ctx.adminAccess = true; next(); });
stack.useFor("postOnly", ["POST", "PUT"], (ctx, next) => { ctx.bodyParsed = true; next(); });
stack.useUnless("skipForInternal", (ctx) => ctx.isInternal, (ctx, next) => { ctx.publicProcessed = true; next(); });


// --- execute: all conditions met → all 4 execute ---
console.log(stack.execute({ role: "ADMIN", method: "POST", isInternal: false }));


// --- execute: several skipped ---
console.log(stack.execute({ role: "USER", method: "GET", isInternal: true }));


// --- INVALID: bad conditionFn ---
console.log(stack.useIf("bad", "not-fn", (ctx, next) => { }));