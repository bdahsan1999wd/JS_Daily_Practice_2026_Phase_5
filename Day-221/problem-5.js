// 🧩 PROBLEM–05: runEventDrivenAppOrchestrator()
//
// Logic: Simulates a complete event-driven application.

// Combines:

// 1. Request Lifecycle
// 2. Service Bus
// 3. State Machine
// 4. Plugin System
// 5. Request orchestration

// Each incoming request passes through the complete event-driven application pipeline.

function runEventDrivenAppOrchestrator(appBlueprint) {

    // --- STEP 1: VALIDATION ---
    // Validate appBlueprint object.

    if (
        typeof appBlueprint !== "object" ||
        appBlueprint === null ||
        Array.isArray(appBlueprint)
    ) {
        return "Invalid Input";
    }

    const {
        appId,
        services,
        stateMachine,
        plugins,
        availableHooks,
        incomingRequests
    } = appBlueprint;

    // Validate required top-level fields.

    if (
        typeof appId !== "string" ||
        appId.trim() === "" ||
        !Array.isArray(services) ||
        !Array.isArray(plugins) ||
        !Array.isArray(availableHooks) ||
        !Array.isArray(incomingRequests) ||
        typeof stateMachine !== "object" ||
        stateMachine === null ||
        Array.isArray(stateMachine)
    ) {
        return "Invalid Input";
    }


    // --- STEP 2: VALIDATE SERVICES ---
    // Every service must contain:
    // serviceId, subscribedEvents and isOnline.

    const validServices = services.every(service =>
        typeof service === "object" &&
        service !== null &&
        !Array.isArray(service) &&
        typeof service.serviceId === "string" &&
        service.serviceId.trim() !== "" &&
        Array.isArray(service.subscribedEvents) &&
        service.subscribedEvents.every(
            event =>
                typeof event === "string" &&
                event.trim() !== ""
        ) &&
        typeof service.isOnline === "boolean"
    );

    if (!validServices) {
        return "Invalid Input";
    }


    // --- STEP 3: VALIDATE STATE MACHINE ---
    // Validate initial state and transition definitions.

    if (
        typeof stateMachine.initialState !== "string" ||
        stateMachine.initialState.trim() === "" ||
        !Array.isArray(stateMachine.transitions)
    ) {
        return "Invalid Input";
    }

    const validTransitions =
        stateMachine.transitions.every(transition =>
            typeof transition === "object" &&
            transition !== null &&
            !Array.isArray(transition) &&
            typeof transition.from === "string" &&
            transition.from.trim() !== "" &&
            typeof transition.event === "string" &&
            transition.event.trim() !== "" &&
            typeof transition.to === "string" &&
            transition.to.trim() !== "" &&
            typeof transition.action === "string"
        );

    if (!validTransitions) {
        return "Invalid Input";
    }


    // --- STEP 4: VALIDATE AVAILABLE HOOKS ---
    // Every available hook must be a non-empty string.

    if (
        !availableHooks.every(
            hook =>
                typeof hook === "string" &&
                hook.trim() !== ""
        )
    ) {
        return "Invalid Input";
    }


    // --- STEP 5: VALIDATE PLUGINS ---
    // Every plugin must contain:
    // pluginId, name, priority and hooks.

    const validPlugins = plugins.every(plugin =>
        typeof plugin === "object" &&
        plugin !== null &&
        !Array.isArray(plugin) &&
        typeof plugin.pluginId === "string" &&
        plugin.pluginId.trim() !== "" &&
        typeof plugin.name === "string" &&
        plugin.name.trim() !== "" &&
        Number.isInteger(plugin.priority) &&
        typeof plugin.hooks === "object" &&
        plugin.hooks !== null &&
        !Array.isArray(plugin.hooks)
    );

    if (!validPlugins) {
        return "Invalid Input";
    }


    // --- STEP 6: VALIDATE INCOMING REQUESTS ---
    // Validate every incoming request.

    const validRequests = incomingRequests.every(request =>
        typeof request === "object" &&
        request !== null &&
        !Array.isArray(request) &&

        typeof request.requestId === "string" &&
        request.requestId.trim() !== "" &&

        ["GET", "POST", "PUT", "DELETE"].includes(
            request.method
        ) &&

        typeof request.path === "string" &&
        request.path.trim() !== "" &&
        request.path.startsWith("/") &&

        (
            request.body === null ||
            (
                typeof request.body === "object" &&
                !Array.isArray(request.body)
            )
        ) &&

        typeof request.headers === "object" &&
        request.headers !== null &&
        !Array.isArray(request.headers) &&

        typeof request.eventType === "string" &&
        request.eventType.trim() !== "" &&

        typeof request.payload === "object" &&
        request.payload !== null &&
        !Array.isArray(request.payload)
    );

    if (!validRequests) {
        return "Invalid Input";
    }


    // --- STEP 7: SETUP SERVICE BUS ---
    // Register all services into the service registry.

    const serviceRegistry = [];

    for (const service of services) {

        serviceRegistry.push({
            serviceId: service.serviceId,
            subscribedEvents: [...service.subscribedEvents],
            isOnline: service.isOnline
        });

    }


    // --- STEP 8: SETUP STATE MACHINE ---
    // Start the state machine from the initial state.

    let currentState = stateMachine.initialState;


    // --- STEP 9: SETUP PLUGIN SYSTEM ---
    // Register plugins and sort them by priority.
    // Higher priority plugins execute first.

    const registeredPlugins = [...plugins].sort(
        (a, b) => b.priority - a.priority
    );


    // --- STEP 10: INTERNAL STATISTICS ---
    // Track application-level processing statistics.

    let completedRequests = 0;
    let blockedRequests = 0;
    let totalEventsPublished = 0;
    let pluginExecutions = 0;


    // --- STEP 11: REQUEST LIFECYCLE ---
    // Simulates Problem-01 request lifecycle.
    //
    // Orchestrator always enables:
    // requireAuth: true
    // validateBody: true
    // logRequest: true

    function simulateRequestLifecycle(request) {

        // Stores lifecycle stages.

        const stages = [];


        // --- RECEIVED STAGE ---
        // Request enters the application.

        stages.push({
            stage: "RECEIVED",
            requestId: request.requestId,
            method: request.method,
            path: request.path
        });


        // --- AUTHENTICATION STAGE ---
        // Authorization header is required.

        if (
            typeof request.headers.Authorization !== "string" ||
            request.headers.Authorization.trim() === ""
        ) {

            stages.push({
                stage: "AUTH",
                status: "FAILED",
                reason: "Authorization header missing"
            });

            return {
                requestId: request.requestId,
                lifecycleStatus: "BLOCKED",
                stages,
                stagesCompleted: stages.length
            };

        }

        // Authentication successful.

        stages.push({
            stage: "AUTH",
            status: "PASSED"
        });


        // --- BODY VALIDATION STAGE ---
        // POST and PUT requests require a body.

        if (
            ["POST", "PUT"].includes(request.method) &&
            request.body === null
        ) {

            stages.push({
                stage: "VALIDATION",
                status: "FAILED",
                reason: "Request body required"
            });

            return {
                requestId: request.requestId,
                lifecycleStatus: "BLOCKED",
                stages,
                stagesCompleted: stages.length
            };

        }

        // Add validation stage for POST and PUT.

        if (
            ["POST", "PUT"].includes(request.method)
        ) {

            stages.push({
                stage: "VALIDATION",
                status: "PASSED"
            });

        }


        // --- PROCESSING STAGE ---
        // Process request after all validations pass.

        stages.push({
            stage: "PROCESSING",
            status: "COMPLETED",
            result: `processed_${request.requestId}`
        });


        // --- LOGGING STAGE ---
        // Log every successfully processed request.

        stages.push({
            stage: "LOGGING",
            logged: true,
            logMessage:
                `[INFO] ${request.method} ${request.path} → COMPLETED`
        });


        // Return completed lifecycle.

        return {
            requestId: request.requestId,
            lifecycleStatus: "COMPLETED",
            stages,
            stagesCompleted: stages.length
        };

    }


    // --- STEP 12: PLUGIN HOOK EXECUTION ---
    // Execute a specific hook on every plugin
    // that provides that hook.

    function executePluginHook(hookName) {

        // Ignore unavailable hooks.

        if (!availableHooks.includes(hookName)) {
            return;
        }

        // Execute hook according to plugin priority.

        for (const plugin of registeredPlugins) {

            if (
                Object.prototype.hasOwnProperty.call(
                    plugin.hooks,
                    hookName
                )
            ) {

                pluginExecutions++;

            }

        }

    }


    // --- STEP 13: EVENT PUBLISHING ---
    // Publish an event to online services
    // subscribed to that event type.

    function publishEvent(event) {

        // Find matching online subscribers.

        const subscribers = serviceRegistry.filter(
            service =>
                service.isOnline === true &&
                service.subscribedEvents.includes(
                    event.eventType
                )
        );

        // Count the event when at least one
        // online service receives it.

        if (subscribers.length > 0) {
            totalEventsPublished++;
        }

    }


    // --- STEP 14: STATE MACHINE DISPATCH ---
    // Dispatch event to the current state machine state.

    function dispatchEvent(eventType) {

        // Find transition matching:
        // current state + event type.

        const transition =
            stateMachine.transitions.find(
                transition =>
                    transition.from === currentState &&
                    transition.event === eventType
            );

        // Ignore event if no valid transition exists.

        if (!transition) {
            return;
        }

        // Move state machine to the next state.

        currentState = transition.to;

    }


    // --- STEP 15: PROCESS INCOMING REQUESTS ---
    // Process requests in their original order.

    for (const request of incomingRequests) {

        // Run complete request lifecycle.

        const lifecycleResult =
            simulateRequestLifecycle(request);


        // --- BLOCKED REQUEST ---
        // If lifecycle failed, execute onError hook
        // and stop processing this request.

        if (
            lifecycleResult.lifecycleStatus === "BLOCKED"
        ) {

            blockedRequests++;

            executePluginHook("onError");

            continue;

        }


        // --- COMPLETED REQUEST ---
        // Continue the complete event-driven pipeline.

        completedRequests++;


        // Execute onRequest plugin hook.

        executePluginHook("onRequest");


        // Publish request event through service bus.

        publishEvent({
            eventId: request.requestId,
            eventType: request.eventType,
            payload: request.payload
        });


        // Dispatch event to state machine.

        dispatchEvent(request.eventType);


        // Execute onResponse plugin hook.

        executePluginHook("onResponse");

    }


    // --- STEP 16: FINAL RESULT ---
    // Build the final application summary.

    return {
        appId,
        totalRequests: incomingRequests.length,
        completedRequests,
        blockedRequests,
        finalFSMState: currentState,
        totalEventsPublished,
        pluginExecutions
    };

}


// --- EXAMPLE USAGE ---

console.log(

    runEventDrivenAppOrchestrator({

        appId: "APP-01",

        services: [

            {
                serviceId: "order-service",
                subscribedEvents: ["PAY"],
                isOnline: true
            },

            {
                serviceId: "email-service",
                subscribedEvents: ["PAY", "SHIP"],
                isOnline: true
            }

        ],

        stateMachine: {

            initialState: "PENDING",

            transitions: [

                {
                    from: "PENDING",
                    event: "PAY",
                    to: "PAID",
                    action: "Process payment"
                },

                {
                    from: "PAID",
                    event: "SHIP",
                    to: "SHIPPED",
                    action: "Ship order"
                }

            ]

        },

        plugins: [

            {
                pluginId: "P-1",
                name: "LoggerPlugin",
                priority: 8,

                hooks: {
                    onRequest: "fn:log",
                    onResponse: "fn:log",
                    onError: "fn:logError"
                }

            }

        ],

        availableHooks: [
            "onRequest",
            "onResponse",
            "onError"
        ],

        incomingRequests: [

            {
                requestId: "REQ-1",
                method: "POST",
                path: "/pay",

                body: {
                    amount: 500
                },

                headers: {
                    Authorization: "Bearer t1"
                },

                eventType: "PAY",

                payload: {
                    amount: 500
                }

            },

            {
                requestId: "REQ-2",
                method: "POST",
                path: "/ship",

                body: null,

                headers: {},

                eventType: "SHIP",

                payload: {
                    trackingId: "TRK-1"
                }

            }

        ]

    })

);