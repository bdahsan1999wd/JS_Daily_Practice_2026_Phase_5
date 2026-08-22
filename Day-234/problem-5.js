// 🧩 PROBLEM–05: runDIOrchestrator()

// Logic: Full DI App Orchestrator — composes Problems 01–04.

// 1. Build container (dependency resolution, Problem-02 logic)
// 2. Register all services with factories, lifetimes, dependencies
// 3. Apply decorators + interceptors (Problem-03 logic)
// 4. Process resolutions: optional new scope → resolve → optional method call
// 5. Summary: totalServices, totalResolutions, singletonCount, dependencyGraph


function runDIOrchestrator(diConfig) {

    // --- STEP 1: VALIDATE diConfig ---

    if (
        typeof diConfig !== "object" || diConfig === null || Array.isArray(diConfig) ||
        typeof diConfig.appId !== "string" || diConfig.appId.trim() === "" ||
        !Array.isArray(diConfig.services) ||
        !Array.isArray(diConfig.resolutions)
    ) {
        return "Invalid Input";
    }

    const { appId, services, resolutions } = diConfig;

    const validLifetimes = ["TRANSIENT", "SINGLETON", "SCOPED"];

    for (const s of services) {
        if (
            typeof s.name !== "string" || s.name.trim() === "" ||
            !validLifetimes.includes(s.lifetime) ||
            !Array.isArray(s.dependencies) ||
            (typeof s.factoryResult !== "object" || s.factoryResult === null)
        ) {
            return "Invalid Input";
        }
    }

    // --- STEP 2: INTERNAL CONTAINER (Problem-02 logic) ---

    const registry = {};  // name -> { factoryResult, lifetime, dependencies }
    const cache = {};  // SINGLETON cache
    const decoratorLists = {}; // name -> [decoratorFn]
    const interceptorLists = {}; // name -> [{ methodName, addToResult }]

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

        let instance = { ...entry.factoryResult };

        if (entry.lifetime === "SINGLETON") cache[name] = instance;

        return instance;
    }

    function applyDecorations(name, instance) {

        let result = instance;

        // Decorators (Problem-03): addFields merge.
        if (decoratorLists[name]) {
            for (const fn of decoratorLists[name]) {
                result = fn(result);
            }
        }

        // Interceptors (Problem-03): wrap methods to add fields to result.
        if (interceptorLists[name]) {
            for (const inter of interceptorLists[name]) {
                const originalMethod = result[inter.methodName];
                if (typeof originalMethod === "function") {
                    result[inter.methodName] = (...args) => ({
                        ...originalMethod(...args),
                        ...inter.addToResult
                    });
                }
            }
        }

        return result;
    }

    // --- STEP 3: REGISTER SERVICES ---

    for (const s of services) {
        registry[s.name] = {
            factoryResult: s.factoryResult,
            lifetime: s.lifetime,
            dependencies: s.dependencies
        };
    }

    // --- STEP 4: APPLY DECORATORS + INTERCEPTORS ---

    for (const s of services) {

        if (s.decorators) {
            for (const dec of s.decorators) {
                if (!decoratorLists[s.name]) decoratorLists[s.name] = [];
                decoratorLists[s.name].push((service) => ({ ...service, ...dec.addFields }));
            }
        }

        if (s.interceptors) {
            interceptorLists[s.name] = s.interceptors.slice();
        }
    }

    // --- STEP 5: PROCESS RESOLUTIONS ---

    const resolutionLog = [];

    // Scope manager (Problem-04 logic, simplified).

    let scopeIndex = 0;

    function createScope() {
        scopeIndex++;
        const scopeId = "SCOPE-" + scopeIndex;
        const scopedInstances = {};
        return {
            scopeId,
            resolve(name) {
                if (registry[name].lifetime === "SCOPED") {
                    if (scopedInstances[name] === undefined) {
                        scopedInstances[name] = resolveInternal(name, []);
                    }
                    return scopedInstances[name];
                }
                return resolveInternal(name, []);
            }
        };
    }

    for (const r of resolutions) {

        let scope = null;

        if (r.useScope === true) {
            scope = createScope();
        }

        // Resolve (with decorators + interceptors applied).

        let instance = scope ? scope.resolve(r.serviceName) : resolveInternal(r.serviceName, []);

        if (instance && instance.error) {
            resolutionLog.push({
                resolutionId: r.resolutionId,
                serviceName: r.serviceName,
                instance: null,
                methodCallResult: null,
                scopeId: scope ? scope.scopeId : null
            });
            continue;
        }

        instance = applyDecorations(r.serviceName, instance);

        // Optional method call.

        let methodCallResult = null;

        if (r.methodCall) {
            const methodFn = instance[r.methodCall.method];
            methodCallResult = typeof methodFn === "function"
                ? methodFn(...(r.methodCall.args || []))
                : r.methodCall.args;
        }

        resolutionLog.push({
            resolutionId: r.resolutionId,
            serviceName: r.serviceName,
            instance,
            methodCallResult,
            scopeId: scope ? scope.scopeId : null
        });
    }

    // --- STEP 6: BUILD SUMMARY ---

    const dependencyGraph = {};

    for (const name of Object.keys(registry)) {
        dependencyGraph[name] = {
            lifetime: registry[name].lifetime,
            dependencies: registry[name].dependencies.slice()
        };
    }

    const summary = {
        totalServices: services.length,
        totalResolutions: resolutions.length,
        singletonCount: services.filter(s => s.lifetime === "SINGLETON").length,
        dependencyGraph
    };

    return { appId, resolutionLog, summary };
}


// ------ EXAMPLE USAGE ------

console.log(runDIOrchestrator({
    appId: "DI-APP-01",
    services: [
        {
            name: "config",
            lifetime: "SINGLETON",
            dependencies: [],
            factoryResult: { env: "production", version: "1.0.0" },
            decorators: null,
            interceptors: null
        },
        {
            name: "logger",
            lifetime: "SINGLETON",
            dependencies: ["config"],
            factoryResult: { level: "info", prefix: "[LOG]" },
            decorators: [{ addFields: { decorated: true } }],
            interceptors: null
        },
        {
            name: "userService",
            lifetime: "TRANSIENT",
            dependencies: ["logger"],
            factoryResult: { getUser: "fn", createUser: "fn" },
            decorators: null,
            interceptors: [{ methodName: "getUser", addToResult: { cached: false } }]
        }
    ],
    resolutions: [
        { resolutionId: "R1", serviceName: "config", useScope: false, methodCall: null },
        { resolutionId: "R2", serviceName: "logger", useScope: false, methodCall: null },
        { resolutionId: "R3", serviceName: "userService", useScope: true, methodCall: null }
    ]
}));


// --- INVALID ---
console.log(runDIOrchestrator({ appId: "", services: [], resolutions: [] }));