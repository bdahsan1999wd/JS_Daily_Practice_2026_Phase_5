// 🧩 PROBLEM–01: bootstrapApp()

// Logic: Returns a bootstrapped app object.
//   getConfig()         — full app configuration
//   isFeatureEnabled(featureName) — check a feature
//   getStatus()         — app health status
//   registerModule(moduleName, moduleConfig) — register an app module
//   listModules()       — all registered modules
//   shutdown()          — simulate graceful shutdown

// Config includes startedAt: "2025-01-01T00:00:00Z". getStatus reports RUNNING with moduleCount. shutdown reports modulesUnloaded count.


function bootstrapApp(appConfig) {

    // --- STEP 1: VALIDATE appConfig ---

    if (
        typeof appConfig !== "object" || appConfig === null || Array.isArray(appConfig) ||
        typeof appConfig.appName !== "string" || appConfig.appName.trim() === "" ||
        typeof appConfig.version !== "string" || appConfig.version.trim() === "" ||
        !["development", "staging", "production"].includes(appConfig.environment) ||
        !Number.isInteger(appConfig.port) || appConfig.port < 1024 || appConfig.port > 65535 ||
        typeof appConfig.features !== "object" || appConfig.features === null ||
        typeof appConfig.features.auth !== "boolean" ||
        typeof appConfig.features.rateLimit !== "boolean" ||
        typeof appConfig.features.logging !== "boolean" ||
        typeof appConfig.features.errorHandling !== "boolean"
    ) {
        return "Invalid Input";
    }

    const { appName, version, environment, port, features } = appConfig;

    // --- STEP 2: INTERNAL STATE ---

    const startedAt = "2025-01-01T00:00:00Z";

    const modules = {}; // moduleName -> { moduleConfig, registeredAt }

    // --- STEP 3: RETURN APP OBJECT ---

    return {

        getConfig() {
            return { appName, version, environment, port, features, startedAt };
        },

        isFeatureEnabled(featureName) {

            if (typeof featureName !== "string" || featureName.trim() === "") return "Invalid Input";

            if (!(featureName in features)) return { error: "Unknown feature" };

            return { feature: featureName, enabled: features[featureName] };
        },

        getStatus() {
            return {
                status: "RUNNING",
                appName,
                version,
                environment,
                uptime: "0s",
                moduleCount: Object.keys(modules).length
            };
        },

        registerModule(moduleName, moduleConfig) {

            if (
                typeof moduleName !== "string" || moduleName.trim() === "" ||
                typeof moduleConfig !== "object" || moduleConfig === null
            ) {
                return "Invalid Input";
            }

            if (modules[moduleName]) {
                return { registered: false, reason: "Module already registered" };
            }

            modules[moduleName] = { moduleConfig, registeredAt: "2025-01-01T00:00:00Z" };

            return { registered: true, moduleName };
        },

        listModules() {

            return Object.keys(modules).map(name => ({
                moduleName: name,
                registeredAt: modules[name].registeredAt
            }));
        },

        shutdown() {

            const modulesUnloaded = Object.keys(modules).length;

            for (const key of Object.keys(modules)) delete modules[key];

            return { shutdown: true, appName, modulesUnloaded };
        }
    };
}



// ------ EXAMPLE USAGE ------

const app = bootstrapApp({
    appName: "ShopAPI",
    version: "1.0.0",
    environment: "production",
    port: 8080,
    features: { auth: true, rateLimit: true, logging: true, errorHandling: true }
});

console.log(app.getConfig());


console.log(app.isFeatureEnabled("auth"));


console.log(app.isFeatureEnabled("cache"));


console.log(app.registerModule("UserModule", { entities: ["User"], routes: ["/users"] }));


console.log(app.registerModule("UserModule", {}));


console.log(app.getStatus());


console.log(app.listModules());


console.log(app.shutdown());


// --- INVALID ---
console.log(bootstrapApp({ appName: "", version: "1", environment: "prod", port: 100, features: {} }));