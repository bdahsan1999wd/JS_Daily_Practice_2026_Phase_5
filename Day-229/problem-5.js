// 🧩 PROBLEM–05: runMVCOrchestrator()

// Logic: Full MVC App Orchestrator — composes Problems 01–04.

// 1. Build Model (Problem-01) from modelConfig
// 2. Build View (Problem-02) from viewConfig
// 3. Build Controller (Problem-03) wiring model + view
// 4. Build Router (Problem-04) — register routes mapping to controller actions
// 5. Process each request through the router and collect responses
// 6. Build summary (totalRequests, successCount, errorCount, actionLog)

function runMVCOrchestrator(appConfig) {

    // --- STEP 1: VALIDATE appConfig ---

    if (
        typeof appConfig !== "object" ||
        appConfig === null ||
        Array.isArray(appConfig)
    ) {
        return "Invalid Input";
    }

    const { appId, modelConfig, viewConfig, routes, requests } = appConfig;

    if (
        typeof appId !== "string" || appId.trim() === "" ||
        typeof modelConfig !== "object" || modelConfig === null ||
        typeof viewConfig !== "object" || viewConfig === null ||
        !Array.isArray(routes) || routes.length === 0 ||
        !Array.isArray(requests) || requests.length === 0
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: BUILD MODEL (Problem-01 logic) ---

    function buildModel(modelConfig) {

        const { modelName, schema } = modelConfig;

        const records = [];
        let autoIndex = 0;

        function buildRecord(data) {

            if (typeof data !== "object" || data === null || Array.isArray(data)) {
                return { error: "Invalid Input" };
            }

            const record = {};

            for (const fieldName of Object.keys(schema)) {
                const def = schema[fieldName];
                let value = data[fieldName];

                if (value === undefined) {
                    if (def.required) return { error: "Missing required field: " + fieldName };
                    value = def.default;
                }

                if (value !== null && typeof value !== def.type) {
                    return { error: "Invalid type for field: " + fieldName };
                }

                record[fieldName] = value;
            }

            return { record };
        }

        return {
            create(data) {
                const built = buildRecord(data);
                if (built.error) return { error: built.error };
                autoIndex++;
                const record = { id: modelName + "_" + autoIndex, ...built.record };
                records.push(record);
                return { created: true, record };
            },
            findById(id) {
                const index = records.findIndex(r => r.id === id);
                if (index === -1) return { found: false, id };
                return { found: true, record: records[index] };
            },
            findAll() {
                return { records, count: records.length };
            },
            update(id, data) {
                const index = records.findIndex(r => r.id === id);
                if (index === -1) return { error: "Record not found" };
                for (const fieldName of Object.keys(schema)) {
                    if (data[fieldName] !== undefined) records[index][fieldName] = data[fieldName];
                }
                return { updated: true, record: records[index] };
            },
            delete(id) {
                const index = records.findIndex(r => r.id === id);
                if (index === -1) return { error: "Record not found" };
                records.splice(index, 1);
                return { deleted: true, id };
            },
            count() {
                return records.length;
            }
        };
    }

    // --- STEP 3: BUILD VIEW (Problem-02 logic) ---

    function buildView(viewConfig) {

        const { viewName, templates } = viewConfig;

        function renderTemplate(templateString, data) {
            return templateString.replace(/\{\{(\w+)\}\}/g, (m, f) => {
                return data && data[f] !== undefined ? String(data[f]) : "";
            });
        }

        return {
            render(templateName, data) {
                if (typeof templates[templateName] !== "string") {
                    return { error: "Template not found: " + templateName };
                }
                return { viewName, templateName, rendered: renderTemplate(templates[templateName], data) };
            },
            renderError(statusCode, message) {
                return { viewName, type: "ERROR", statusCode, message };
            },
            renderSuccess(data, message) {
                return { viewName, type: "SUCCESS", message, data };
            }
        };
    }

    // --- STEP 4: BUILD CONTROLLER (Problem-03 logic) ---
    // Responses are built in the compact format used by the sample:
    //   SUCCESS → { type, message, data }
    //   ERROR   → { type, statusCode, message }

    function buildController(controllerName, model, view) {

        const actionLog = [];

        function record(action, success, response) {
            actionLog.push({ action, timestamp: "2025-01-01T00:00:00Z", success });
            return response;
        }

        return {
            handleCreate(body) {
                const r = model.create(body);
                if (r.error) return record("CREATE", false, view.renderError(400, r.error));
                return record("CREATE", true, view.renderSuccess(r.record, controllerName + " created"));
            },
            handleGetAll() {
                const { records, count } = model.findAll();
                return record("GET_ALL", true, view.renderSuccess({ records, count }, "Fetched all " + controllerName + "s"));
            },
            handleGetById(id) {
                const r = model.findById(id);
                if (!r.found) return record("GET_BY_ID", false, view.renderError(404, controllerName + " not found"));
                return record("GET_BY_ID", true, view.renderSuccess(r.record, controllerName + " found"));
            },
            handleUpdate(id, body) {
                const r = model.update(id, body);
                if (r.error) return record("UPDATE", false, view.renderError(404, "Record not found"));
                return record("UPDATE", true, view.renderSuccess(r.record, controllerName + " updated"));
            },
            handleDelete(id) {
                const r = model.delete(id);
                if (r.error) return record("DELETE", false, view.renderError(404, "Record not found"));
                return record("DELETE", true, view.renderSuccess({ id }, controllerName + " deleted"));
            },
            getActionLog() {
                return actionLog;
            }
        };
    }

    // --- STEP 5: BUILD ROUTER (Problem-04 logic) ---

    function buildRouter() {

        const routeMap = new Map();

        function isValidMethod(method) {
            return method === "GET" || method === "POST" || method === "PUT" || method === "DELETE";
        }

        function matchPath(pattern, path) {

            const ps = pattern.split("/");
            const vs = path.split("/");

            if (ps.length !== vs.length) return null;

            const params = {};

            for (let i = 0; i < ps.length; i++) {
                if (ps[i].startsWith(":")) params[ps[i].slice(1)] = vs[i];
                else if (ps[i] !== vs[i]) return null;
            }

            return params;
        }

        return {
            register(method, path, handler) {

                if (!isValidMethod(method) || typeof path !== "string" || !path.startsWith("/") || typeof handler !== "function") {
                    return "Invalid Input";
                }

                const key = method + "_" + path;

                if (routeMap.has(key)) return { registered: false, reason: "Route already exists" };

                routeMap.set(key, { method, path, handler });

                return { registered: true, method, path };
            },
            dispatch(method, path, payload) {

                const exactKey = method + "_" + path;

                if (routeMap.has(exactKey)) {
                    const r = routeMap.get(exactKey);
                    return { dispatched: true, result: r.handler({ params: {}, payload }) };
                }

                for (const r of routeMap.values()) {
                    if (r.method !== method) continue;
                    const params = matchPath(r.path, path);
                    if (params !== null) {
                        return { dispatched: true, result: r.handler({ params, payload }) };
                    }
                }

                return { dispatched: false };
            }
        };
    }

    // --- STEP 6: WIRE EVERYTHING TOGETHER ---

    const model = buildModel(modelConfig);
    const view = buildView(viewConfig);
    const name = modelConfig.modelName;
    const controller = buildController(name, model, view);
    const router = buildRouter();

    // Map each route to the appropriate controller action.

    for (const route of routes) {

        const { method, path, action } = route;

        let handler = null;

        switch (action) {
            case "CREATE": handler = ({ payload }) => controller.handleCreate(payload); break;
            case "GET_ALL": handler = () => controller.handleGetAll(); break;
            case "GET_BY_ID": handler = ({ params }) => controller.handleGetById(params.id); break;
            case "UPDATE": handler = ({ params, payload }) => controller.handleUpdate(params.id, payload); break;
            case "DELETE": handler = ({ params }) => controller.handleDelete(params.id); break;
            default: handler = null;
        }

        if (handler === null) return "Invalid Input";

        router.register(method, path, handler);
    }

    // --- STEP 7: PROCESS REQUESTS ---

    const requestLog = [];
    let successCount = 0;
    let errorCount = 0;

    for (const request of requests) {

        const { requestId, method, path, payload } = request;

        const dispatched = router.dispatch(method, path, payload);

        let response;

        if (dispatched.dispatched) {
            response = dispatched.result;

            if (response.type === "SUCCESS") successCount++;
            else if (response.type === "ERROR") errorCount++;
        } else {
            response = { type: "ERROR", statusCode: 404, message: "No route found for " + method + " " + path };
            errorCount++;
        }

        requestLog.push({ requestId, method, path, response });
    }

    // --- STEP 8: BUILD SUMMARY ---

    const summary = {
        totalRequests: requests.length,
        successCount,
        errorCount,
        actionLog: controller.getActionLog()
    };

    return { appId, requestLog, summary };
}


// ------ EXAMPLE USAGE ------

// --- Full MVC app (matches readme sample) ---
console.log(runMVCOrchestrator({
    appId: "APP-MVC-01",
    modelConfig: {
        modelName: "Product",
        schema: {
            name: { type: "string", required: true, default: null },
            price: { type: "number", required: true, default: null }
        }
    },
    viewConfig: {
        viewName: "ProductView",
        templates: { "product": "Product: {{name}} - ৳{{price}}" }
    },
    routes: [
        { method: "POST", path: "/products", action: "CREATE" },
        { method: "GET", path: "/products", action: "GET_ALL" },
        { method: "GET", path: "/products/:id", action: "GET_BY_ID" }
    ],
    requests: [
        { requestId: "REQ-1", method: "POST", path: "/products", payload: { name: "JS Book", price: 500 } },
        { requestId: "REQ-2", method: "POST", path: "/products", payload: { name: "CSS Guide", price: 300 } },
        { requestId: "REQ-3", method: "GET", path: "/products", payload: null },
        { requestId: "REQ-4", method: "GET", path: "/products/Product_1", payload: null },
        { requestId: "REQ-5", method: "GET", path: "/products/Product_99", payload: null }
    ]
}));


// --- INVALID: empty requests ---
console.log(runMVCOrchestrator({
    appId: "X",
    modelConfig: { modelName: "A", schema: {} },
    viewConfig: { viewName: "V", templates: {} },
    routes: [{ method: "GET", path: "/a", action: "GET_ALL" }],
    requests: []
}));