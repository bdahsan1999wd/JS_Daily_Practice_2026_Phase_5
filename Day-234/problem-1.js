// 🧩 PROBLEM–01: createDIContainer()

// Logic: Returns a basic DI container object.
//   register(name, factory, lifetime) — register a service
//   resolve(name)    — get a service instance
//   has(name)        — check if service is registered
//   unregister(name) — remove a service
//   listServices()   — all registered service names

// Lifetimes:
//   TRANSIENT — new instance every resolve
//   SINGLETON — same cached instance (created on first resolve)
//   SCOPED    — new instance per scope (treated as TRANSIENT here)


function createDIContainer() {

    // --- STEP 1: INTERNAL STATE ---

    const registry = {};  // name -> { factory, lifetime }
    const cache = {};  // name -> cached SINGLETON instance

    const validLifetimes = ["TRANSIENT", "SINGLETON", "SCOPED"];

    // --- STEP 2: RETURN CONTAINER OBJECT ---

    return {

        register(name, factory, lifetime) {

            if (
                typeof name !== "string" || name.trim() === "" ||
                typeof factory !== "function" ||
                !validLifetimes.includes(lifetime)
            ) {
                return "Invalid Input";
            }

            if (registry[name]) {
                return { registered: false, reason: "Service already registered: " + name };
            }

            registry[name] = { factory, lifetime };

            return { registered: true, name, lifetime };
        },

        resolve(name) {

            if (typeof name !== "string" || name.trim() === "") return "Invalid Input";

            const entry = registry[name];

            if (!entry) return { error: "Service not found: " + name };

            if (entry.lifetime === "SINGLETON") {
                if (!cache[name]) cache[name] = entry.factory();
                return cache[name];
            }

            // TRANSIENT or SCOPED → new instance each time.
            return entry.factory();
        },

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

const container = createDIContainer();

container.register("logger", () => ({ log: (msg) => "[LOG] " + msg }), "SINGLETON");
container.register("userRepo", () => ({ findAll: () => [] }), "TRANSIENT");

// Singleton — same instance both times
const logger1 = container.resolve("logger");
const logger2 = container.resolve("logger");
console.log(logger1 === logger2);


// Transient — different instance each time
const repo1 = container.resolve("userRepo");
const repo2 = container.resolve("userRepo");
console.log(repo1 !== repo2);


console.log(container.has("logger"));


console.log(container.listServices());


console.log(container.unregister("userRepo"));


console.log(container.resolve("userRepo"));


// --- INVALID ---
console.log(container.register("", () => ({}), "SINGLETON"));