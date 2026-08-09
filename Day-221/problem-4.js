// 🧩 PROBLEM–04: createPluginSystem()

// Logic: Simulates a plugin system.

// Supports:

// 1. Register plugins with hook handlers
// 2. Unregister plugins
// 3. Execute hooks based on priority
// 4. List registered plugins
// 5. View hook subscription report


function createPluginSystem(appConfig) {

    // --- STEP 1: VALIDATION ---
    // appConfig must be a valid object.

    if (
        typeof appConfig !== "object" ||
        appConfig === null ||
        Array.isArray(appConfig)
    ) {
        return "Invalid Input";
    }

    const {
        appId,
        hooks
    } = appConfig;

    // Validate app configuration.

    if (
        typeof appId !== "string" ||
        appId.trim() === "" ||
        !Array.isArray(hooks) ||
        hooks.length === 0 ||
        !hooks.every(hook =>
            typeof hook === "string" &&
            hook.trim() !== ""
        )
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STORAGE ---

    // Stores all registered plugins.

    const plugins = [];


    // --- STEP 3: RETURN PLUGIN SYSTEM OBJECT ---

    return {

        // -----------------------------
        // Register a new plugin
        // -----------------------------
        registerPlugin(pluginData) {

            // Validate plugin object.

            if (
                typeof pluginData !== "object" ||
                pluginData === null ||
                Array.isArray(pluginData)
            ) {
                return "Invalid Input";
            }

            const {
                pluginId,
                name,
                priority,
                hooks: pluginHooks
            } = pluginData;

            // Validate plugin data.

            if (
                typeof pluginId !== "string" ||
                pluginId.trim() === "" ||
                typeof name !== "string" ||
                name.trim() === "" ||
                !Number.isInteger(priority) ||
                priority < 1 ||
                priority > 10 ||
                typeof pluginHooks !== "object" ||
                pluginHooks === null ||
                Array.isArray(pluginHooks)
            ) {
                return "Invalid Input";
            }

            // Check duplicate plugin.

            const existingPlugin = plugins.find(plugin =>
                plugin.pluginId === pluginId
            );

            if (existingPlugin) {

                return {
                    registered: false,
                    reason:
                        "Plugin already exists: " + pluginId
                };

            }

            // Keep only valid hooks.

            const registeredHooks = {};

            for (const hookName of hooks) {

                if (
                    Object.prototype.hasOwnProperty.call(
                        pluginHooks,
                        hookName
                    )
                ) {

                    const handler = pluginHooks[hookName];

                    // Handler description must be a string.

                    if (typeof handler === "string") {

                        registeredHooks[hookName] = handler;

                    }

                }

            }

            // Store plugin.

            plugins.push({
                pluginId,
                name,
                priority,
                hooks: registeredHooks
            });

            return {
                registered: true,
                pluginId,
                registeredHooks: Object.keys(
                    registeredHooks
                )
            };

        },


        // -----------------------------
        // Unregister a plugin
        // -----------------------------
        unregisterPlugin(pluginId) {

            // Validate pluginId.

            if (
                typeof pluginId !== "string" ||
                pluginId.trim() === ""
            ) {
                return "Invalid Input";
            }

            const index = plugins.findIndex(plugin =>
                plugin.pluginId === pluginId
            );

            if (index === -1) {

                return {
                    error: "Plugin not found"
                };

            }

            plugins.splice(index, 1);

            return {
                unregistered: true,
                pluginId
            };

        },


        // -----------------------------
        // Execute a hook
        // -----------------------------
        executeHook(hookName, context) {

            // Validate hookName.

            if (
                typeof hookName !== "string" ||
                hookName.trim() === ""
            ) {
                return "Invalid Input";
            }

            // Validate context.

            if (
                typeof context !== "object" ||
                context === null ||
                Array.isArray(context)
            ) {
                return "Invalid Input";
            }

            // Check whether hook exists.

            if (!hooks.includes(hookName)) {

                return {
                    error: "Unknown hook: " + hookName
                };

            }

            // Find plugins subscribed to this hook.

            const subscribedPlugins = plugins
                .filter(plugin =>
                    Object.prototype.hasOwnProperty.call(
                        plugin.hooks,
                        hookName
                    )
                )
                .sort((a, b) =>
                    b.priority - a.priority
                );

            // Simulate hook execution.

            const executionLog = subscribedPlugins.map(plugin => ({
                pluginId: plugin.pluginId,
                priority: plugin.priority,
                status: "EXECUTED"
            }));

            return {
                hookName,
                context,
                executionLog,
                executedCount: executionLog.length
            };

        },


        // -----------------------------
        // List all plugins
        // -----------------------------
        listPlugins() {

            return plugins.map(plugin => ({
                pluginId: plugin.pluginId,
                name: plugin.name,
                priority: plugin.priority,
                registeredHooks: Object.keys(
                    plugin.hooks
                )
            }));

        },


        // -----------------------------
        // Get hook subscription report
        // -----------------------------
        getHookReport() {

            const report = {};

            for (const hookName of hooks) {

                const subscribedPlugins = plugins.filter(
                    plugin =>
                        Object.prototype.hasOwnProperty.call(
                            plugin.hooks,
                            hookName
                        )
                );

                report[hookName] = {
                    subscribedPlugins:
                        subscribedPlugins.length,

                    pluginIds:
                        subscribedPlugins.map(plugin =>
                            plugin.pluginId
                        )
                };

            }

            return report;

        }

    };

}


// --- EXAMPLE USAGE ---
const ps = createPluginSystem({

    appId: "my-app",

    hooks: [
        "onRequest",
        "onResponse",
        "onError"
    ]

});


console.log(
    ps.registerPlugin({

        pluginId: "P-1",

        name: "AuthPlugin",

        priority: 9,

        hooks: {
            onRequest: "fn:checkAuth",
            onError: "fn:logError"
        }

    })
);


console.log(
    ps.registerPlugin({

        pluginId: "P-2",

        name: "LoggerPlugin",

        priority: 5,

        hooks: {
            onRequest: "fn:logRequest",
            onResponse: "fn:logResponse",
            onUnknown: "fn:x"
        }

    })
);


console.log(
    ps.executeHook(
        "onRequest",
        {
            path: "/api/users"
        }
    )
);


console.log(
    ps.getHookReport()
);


console.log(
    ps.listPlugins()
);


console.log(
    ps.unregisterPlugin("P-1")
);