// 🧩 PROBLEM–03: createDecoratedContainer()

// Logic: Extends the DI container (Problem-02) with decorators + interceptors.
//   register(name, factory, lifetime, dependencies) — same as Problem-02
//   decorate(name, decoratorFn)  — wrap a registered service
//   intercept(name, methodName, interceptorFn) — intercept a method
//   resolve(name)                — return decorated + intercepted service
//   getDecorators(name)          — decorators applied to a service

// Multiple decorators applied in registration order. interceptorFn receives
// (originalMethod, ...args) and may transform the return value.


function createDecoratedContainer() {

    // --- STEP 1: INTERNAL STATE ---

    const registry = {};   // name -> { factory, lifetime, dependencies }
    const cache = {};   // name -> cached SINGLETON instance
    const decorators = {}; // name -> [decoratorFn]
    const interceptors = {}; // name -> [{ methodName, interceptorFn }]

    const validLifetimes = ["TRANSIENT", "SINGLETON", "SCOPED"];

    // --- STEP 2: RESOLUTION WITH DEPENDENCIES (Problem-02 logic) ---

    function resolveInternal(name, visiting) {

        const entry = registry[name];

        if (!entry) return { error: "Service not found: " + name };

        if (visiting.includes(name)) {
            const cycle = [...visiting.slice(visiting.indexOf(name)), name].join(" → ");
            return { error: "Circular dependency detected: " + cycle };
        }

        if (entry.lifetime === "SINGLETON" && cache[name] !== undefined) {
            return cache[name];
        }

        visiting.push(name);

        const depInstances = [];

        for (const dep of entry.dependencies) {
            const depResult = resolveInternal(dep, visiting);
            if (depResult && depResult.error) {
                visiting.pop();
                return depResult;
            }
            depInstances.push(depResult);
        }

        visiting.pop();

        let instance = entry.factory(...depInstances);

        if (entry.lifetime === "SINGLETON") cache[name] = instance;

        return instance;
    }

    // --- STEP 3: APPLY DECORATORS + INTERCEPTORS ---

    function applyDecorations(name, instance) {

        let result = instance;

        // Decorators in registration order.
        if (decorators[name]) {
            for (const fn of decorators[name]) {
                result = fn(result);
            }
        }

        // Interceptors wrap specific methods.
        if (interceptors[name]) {
            for (const inter of interceptors[name]) {
                const originalMethod = result[inter.methodName];
                if (typeof originalMethod === "function") {
                    result[inter.methodName] = (...args) => {
                        const bound = originalMethod.bind(result);
                        return inter.interceptorFn(bound, ...args);
                    };
                }
            }
        }

        return result;
    }

    // --- STEP 4: RETURN CONTAINER OBJECT ---

    return {

        register(name, factory, lifetime, dependencies) {

            if (
                typeof name !== "string" || name.trim() === "" ||
                typeof factory !== "function" ||
                !validLifetimes.includes(lifetime) ||
                !Array.isArray(dependencies)
            ) {
                return "Invalid Input";
            }

            if (registry[name]) {
                return { registered: false, reason: "Service already registered: " + name };
            }

            registry[name] = { factory, lifetime, dependencies };

            return { registered: true, name, lifetime };
        },

        decorate(name, decoratorFn) {

            if (
                typeof name !== "string" || name.trim() === "" ||
                typeof decoratorFn !== "function"
            ) {
                return "Invalid Input";
            }

            if (!registry[name]) return { error: "Service not found: " + name };

            if (!decorators[name]) decorators[name] = [];
            decorators[name].push(decoratorFn);

            return { decorated: true, name, decoratorCount: decorators[name].length };
        },

        intercept(name, methodName, interceptorFn) {

            if (
                typeof name !== "string" || name.trim() === "" ||
                typeof methodName !== "string" || methodName.trim() === "" ||
                typeof interceptorFn !== "function"
            ) {
                return "Invalid Input";
            }

            if (!registry[name]) return { error: "Service not found: " + name };

            if (!interceptors[name]) interceptors[name] = [];
            interceptors[name].push({ methodName, interceptorFn });

            return { intercepted: true, name, methodName };
        },

        resolve(name) {

            if (typeof name !== "string" || name.trim() === "") return "Invalid Input";

            const base = resolveInternal(name, []);

            if (base && base.error) return base;

            return applyDecorations(name, base);
        },

        getDecorators(name) {

            if (typeof name !== "string" || name.trim() === "") return "Invalid Input";

            if (!registry[name]) return { error: "Service not found: " + name };

            return {
                name,
                decorators: decorators[name] ? decorators[name].length : 0,
                interceptors: interceptors[name]
                    ? interceptors[name].map(i => ({ methodName: i.methodName }))
                    : []
            };
        },

        has(name) {

            if (typeof name !== "string" || name.trim() === "") return "Invalid Input";

            return { name, registered: Boolean(registry[name]) };
        },

        listServices() {

            return Object.keys(registry).map(name => ({
                name,
                lifetime: registry[name].lifetime,
                isSingleton: registry[name].lifetime === "SINGLETON"
            }));
        }
    };
}


// ------ EXAMPLE USAGE ------

const container = createDecoratedContainer();

container.register("userService", () => ({
    getUser: (id) => ({ id, name: "Rahim" }),
    createUser: (data) => ({ id: "U1", ...data })
}), "SINGLETON", []);


// Add logging decorator
container.decorate("userService", (service) => ({
    ...service,
    _decorated: true,
    _decoratorName: "LoggingDecorator"
}));


// Intercept getUser method
container.intercept("userService", "getUser", (originalMethod, id) => {
    const result = originalMethod(id);
    return { ...result, fetchedAt: "2025-01-01T00:00:00Z" };
});

const service = container.resolve("userService");
console.log(service);


console.log(service.getUser("U1"));


console.log(container.getDecorators("userService"));


// --- INVALID ---
console.log(container.decorate("missing", (s) => s));