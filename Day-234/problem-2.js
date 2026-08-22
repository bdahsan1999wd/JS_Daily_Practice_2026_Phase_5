// 🧩 PROBLEM–02: createDIContainerWithDeps()

// Logic: Extends the basic DI container (Problem-01) with dependency injection.
//   register(name, factory, lifetime, dependencies) — explicit deps
//   resolve(name)             — auto-resolve deps before creating the service
//   getResolutionOrder(name)  — order in which services are resolved
//   getDependencyGraph()      — full dependency graph (+ all Problem-01 methods)


// Factory receives resolved dependency instances as arguments:

// factory(dep1, dep2, ...) Circular dependency detection: A depends on B depends on A → error.


function createDIContainerWithDeps() {

    // --- STEP 1: INTERNAL STATE ---

    const registry = {};  // name -> { factory, lifetime, dependencies }
    const cache = {};  // name -> cached SINGLETON instance

    const validLifetimes = ["TRANSIENT", "SINGLETON", "SCOPED"];

    // --- STEP 2: RESOLUTION WITH DEPENDENCIES ---

    // Resolve a service; track the resolution order along the current chain.

    function resolveInternal(name, visiting, order) {

        const entry = registry[name];

        if (!entry) return { error: "Service not found: " + name };

        // Circular dependency detection.

        if (visiting.includes(name)) {
            const cycle = [...visiting.slice(visiting.indexOf(name)), name].join(" → ");
            return { error: "Circular dependency detected: " + cycle };
        }

        // SINGLETON cache.

        if (entry.lifetime === "SINGLETON" && cache[name] !== undefined) {
            order.push(name);
            return cache[name];
        }

        visiting.push(name);

        // Resolve dependencies recursively.

        const depInstances = [];

        for (const dep of entry.dependencies) {
            const depResult = resolveInternal(dep, visiting, order);

            if (depResult && depResult.error) {
                visiting.pop();
                return depResult;
            }

            depInstances.push(depResult);
        }

        visiting.pop();

        // Create the service.

        const instance = entry.factory(...depInstances);

        order.push(name);

        if (entry.lifetime === "SINGLETON") cache[name] = instance;

        return instance;
    }

    // --- STEP 3: RETURN CONTAINER OBJECT ---

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

        resolve(name) {

            if (typeof name !== "string" || name.trim() === "") return "Invalid Input";

            const result = resolveInternal(name, [], []);

            return result;
        },

        getResolutionOrder(name) {

            if (typeof name !== "string" || name.trim() === "") return "Invalid Input";

            if (!registry[name]) return { error: "Service not found: " + name };

            // Pure graph traversal (ignores singleton cache) → full transitive order.

            const order = [];
            const visited = new Set();
            const inStack = [];
            let cycle = null;

            const dfs = (current) => {

                if (visited.has(current)) return;

                if (inStack.includes(current)) {
                    cycle = [...inStack.slice(inStack.indexOf(current)), current].join(" → ");
                    return;
                }

                inStack.push(current);

                for (const dep of registry[current].dependencies) {
                    dfs(dep);
                    if (cycle) return;
                }

                inStack.pop();
                visited.add(current);
                order.push(current);
            };

            dfs(name);

            if (cycle) return { error: "Circular dependency detected: " + cycle };

            return {
                name,
                resolutionOrder: order,
                totalDeps: registry[name].dependencies.length
            };
        },

        getDependencyGraph() {

            const graph = {};

            for (const name of Object.keys(registry)) {
                graph[name] = {
                    lifetime: registry[name].lifetime,
                    dependencies: registry[name].dependencies.slice()
                };
            }

            return graph;
        },

        // --- Problem-01 passthrough methods ---

        has(name) {

            if (typeof name !== "string" || name.trim() === "") return "Invalid Input";

            return { name, registered: Boolean(registry[name]) };
        },

        unregister(name) {

            if (typeof name !== "string" || name.trim() === "") return "Invalid Input";

            if (!registry[name]) return { error: "Service not found: " + name };

            delete registry[name];
            delete cache[name];

            return { unregistered: true, name };
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

const container = createDIContainerWithDeps();

container.register("config", () => ({ env: "production", dbUrl: "db://localhost" }), "SINGLETON", []);
container.register("logger", (config) => ({ log: (msg) => "[" + config.env + "] " + msg }), "SINGLETON", ["config"]);
container.register("db", (config, logger) => ({ query: (sql) => { logger.log(sql); return []; }, url: config.dbUrl }), "SINGLETON", ["config", "logger"]);
container.register("userRepo", (db) => ({ findAll: () => db.query("SELECT * FROM users") }), "TRANSIENT", ["db"]);


const userRepo = container.resolve("userRepo");
// Resolution order: config → logger → db → userRepo

console.log(userRepo.findAll());


console.log(container.getResolutionOrder("userRepo"));


console.log(container.getDependencyGraph());


// Circular dependency:
container.register("A", (b) => b, "TRANSIENT", ["B"]);
container.register("B", (a) => a, "TRANSIENT", ["A"]);
console.log(container.resolve("A"));


// --- INVALID ---
console.log(container.register("x", null, "SINGLETON", []));