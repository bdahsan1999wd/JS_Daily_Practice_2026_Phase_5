// 🧩 PROBLEM–04: createScopedContainer()

// Logic: Returns a scoped container that inherits services from a parent.
//   createScope()   — create a new child scope
//   resolve(name)   — resolve within this scope
//   getScopeId()    — unique scope identifier
//   getScopeStats() — stats about this scope
//   dispose()       — end the scope, clear all SCOPED instances

// SCOPED    → one instance per scope (cached in scope)
// SINGLETON → shared from parent (same instance)
// TRANSIENT → new instance each time (same as parent)


function createScopedContainer(parentContainer) {

    // --- STEP 1: VALIDATE parentContainer ---

    if (
        typeof parentContainer !== "object" || parentContainer === null ||
        Array.isArray(parentContainer) ||
        typeof parentContainer.resolve !== "function" ||
        typeof parentContainer.listServices !== "function"
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: BUILD SCOPE FACTORY ---

    // Shared auto-increment counter across all scopes from this root.

    let scopeIndex = 0;

    const rootId = "SCOPE-" + scopeIndex; // root scope id (not used as parent ref)

    function createScope(parentScopeId) {

        scopeIndex++;

        const scopeId = "SCOPE-" + scopeIndex;

        // Cache: name -> SCOPED instance for this scope.
        const scopedInstances = {};

        // Distinct service names resolved in this scope (for stats).
        const resolvedNames = new Set();

        // Lifetime lookup derived from parent.
        const lifetimeOf = {};

        for (const s of parentContainer.listServices()) {
            lifetimeOf[s.name] = s.lifetime;
        }

        return {

            createScope() {
                return createScope(scopeId);
            },

            resolve(name) {

                if (typeof name !== "string" || name.trim() === "") return "Invalid Input";

                resolvedNames.add(name);

                if (lifetimeOf[name] === "SCOPED") {
                    if (scopedInstances[name] === undefined) {
                        scopedInstances[name] = parentContainer.resolve(name);
                    }
                    return scopedInstances[name];
                }

                // SINGLETON (shared from parent) or TRANSIENT (new each time).
                return parentContainer.resolve(name);
            },

            getScopeId() {
                return scopeId;
            },

            getScopeStats() {
                return {
                    scopeId,
                    resolvedServices: resolvedNames.size,
                    scopedInstances: Object.keys(scopedInstances).length,
                    parentScopeId: parentScopeId ?? null
                };
            },

            dispose() {

                const scopedInstancesCleared = Object.keys(scopedInstances).length;

                for (const key of Object.keys(scopedInstances)) {
                    delete scopedInstances[key];
                }

                return { disposed: true, scopeId, scopedInstancesCleared };
            }
        };
    }

    // --- STEP 3: RETURN ROOT SCOPED CONTAINER ---

    return {
        createScope() {
            // Root is the parent — its children have no parent scope id.
            return createScope(null);
        },

        resolve(name) {

            if (typeof name !== "string" || name.trim() === "") return "Invalid Input";

            return parentContainer.resolve(name);
        },

        getScopeId() {
            return rootId;
        },

        getScopeStats() {
            return { scopeId: rootId, resolvedServices: 0, scopedInstances: 0, parentScopeId: null };
        },

        dispose() {
            return { disposed: true, scopeId: rootId, scopedInstancesCleared: 0 };
        }
    };
}


// ------ EXAMPLE USAGE ------

// Inline stub of Problem-01 container (self-contained example, no cross-import).

function createDIContainer() {
    const registry = {};
    const cache = {};
    return {
        register(name, factory, lifetime) {
            if (registry[name]) return { registered: false, reason: "Service already registered: " + name };
            registry[name] = { factory, lifetime };
            return { registered: true, name, lifetime };
        },
        resolve(name) {
            if (!registry[name]) return { error: "Service not found: " + name };
            if (registry[name].lifetime === "SINGLETON") {
                if (!cache[name]) cache[name] = registry[name].factory();
                return cache[name];
            }
            return registry[name].factory();
        },
        has(name) { return { name, registered: Boolean(registry[name]) }; },
        unregister(name) {
            if (!registry[name]) return { error: "Service not found: " + name };
            delete registry[name]; delete cache[name];
            return { unregistered: true, name };
        },
        listServices() {
            return Object.keys(registry).map(name => ({
                name, lifetime: registry[name].lifetime, isSingleton: registry[name].lifetime === "SINGLETON"
            }));
        }
    };
}


const parent = createDIContainer();
parent.register("logger", () => ({ id: Math.random(), log: (m) => m }), "SINGLETON");
parent.register("requestContext", () => ({ requestId: "REQ-" + Math.random() }), "SCOPED");
parent.register("userService", () => ({ getUser: (id) => id }), "TRANSIENT");


const scopedContainer = createScopedContainer(parent);


const scope1 = scopedContainer.createScope();
console.log(scope1.getScopeId());


// Within scope1, SCOPED services return same instance
const ctx1a = scope1.resolve("requestContext");
const ctx1b = scope1.resolve("requestContext");
console.log(ctx1a === ctx1b);


const scope2 = scopedContainer.createScope();
const ctx2 = scope2.resolve("requestContext");
console.log(ctx2 !== ctx1a);


// SINGLETON shared across scopes
const logger1 = scope1.resolve("logger");
const logger2 = scope2.resolve("logger");
console.log(logger1 === logger2);


console.log(scope1.getScopeStats());


console.log(scope1.dispose());


// --- INVALID ---
console.log(createScopedContainer({}));