// 🧩 PROBLEM–03: createController()

// Logic: Implements the Controller layer of a Mini MVC framework.

// Wires a model + view and exposes REST-like handlers:

//   handleCreate(requestBody)      — create a record via model, render response via view
//   handleGetAll()                 — get all records
//   handleGetById(id)              — get one record
//   handleUpdate(id, requestBody)  — update a record
//   handleDelete(id)               — delete a record
//   getActionLog()                 — full log of controller actions

function createController(controllerConfig) {

    // --- STEP 1: VALIDATE controllerConfig ---

    if (
        typeof controllerConfig !== "object" ||
        controllerConfig === null ||
        Array.isArray(controllerConfig)
    ) {
        return "Invalid Input";
    }

    const { controllerName, model, view } = controllerConfig;

    // controllerName must be a non-empty string.
    // model and view must be non-null objects.

    if (
        typeof controllerName !== "string" ||
        controllerName.trim() === "" ||
        typeof model !== "object" ||
        model === null ||
        typeof view !== "object" ||
        view === null
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: ACTION LOG ---

    const actionLog = [];

    // Helper: record an action and return the view response.
    // timestamp is a fixed deterministic value for reproducibility.

    function logAndRespond(action, success, response) {
        actionLog.push({
            action,
            timestamp: "2025-01-01T00:00:00Z",
            success
        });

        return response;
    }

    // --- STEP 3: CONTROLLER METHODS ---

    return {
        // handleCreate(requestBody): create via model.
        handleCreate(requestBody) {

            const result = model.create(requestBody);

            // Model error → renderError 400.

            if (result.error) {
                return logAndRespond(
                    "CREATE",
                    false,
                    view.renderError(400, result.error)
                );
            }

            // Success → renderSuccess.

            return logAndRespond(
                "CREATE",
                true,
                view.renderSuccess(result.record, controllerName + " created")
            );
        },

        // handleGetAll(): get all records. Always success.
        handleGetAll() {

            const { records, count } = model.findAll();

            return logAndRespond(
                "GET_ALL",
                true,
                view.renderSuccess({ records, count }, "Fetched all " + controllerName + "s")
            );
        },

        // handleGetById(id): get one record.
        handleGetById(id) {

            const result = model.findById(id);

            // Not found → renderError 404.

            if (!result.found) {
                return logAndRespond(
                    "GET_BY_ID",
                    false,
                    view.renderError(404, controllerName + " not found")
                );
            }

            // Found → renderSuccess.

            return logAndRespond(
                "GET_BY_ID",
                true,
                view.renderSuccess(result.record, controllerName + " found")
            );
        },

        // handleUpdate(id, requestBody): update a record.
        handleUpdate(id, requestBody) {

            const result = model.update(id, requestBody);

            // Error → renderError 404.

            if (result.error) {
                return logAndRespond(
                    "UPDATE",
                    false,
                    view.renderError(404, "Record not found")
                );
            }

            // Success → renderSuccess.

            return logAndRespond(
                "UPDATE",
                true,
                view.renderSuccess(result.record, controllerName + " updated")
            );
        },

        // handleDelete(id): delete a record.
        handleDelete(id) {

            const result = model.delete(id);

            // Error → renderError 404.

            if (result.error) {
                return logAndRespond(
                    "DELETE",
                    false,
                    view.renderError(404, "Record not found")
                );
            }

            // Success → renderSuccess with { id }.

            return logAndRespond(
                "DELETE",
                true,
                view.renderSuccess({ id }, controllerName + " deleted")
            );
        },

        // getActionLog(): return full action log.
        getActionLog() {
            return actionLog;
        }
    };
}




// ------ EXAMPLE USAGE ------


// --- Mini stubs for the demo (full versions live in problem-1.js / problem-2.js) ---

function createModel(cfg) {
    const records = [];
    let n = 0;
    return {
        create(data) {
            if (data.name === undefined) return { error: "Missing required field: name" };
            n++;
            const record = { id: "User_" + n, ...data };
            records.push(record);
            return { created: true, record };
        },
        findById(id) {
            const index = records.findIndex(r => r.id === id);
            if (index === -1) return { found: false, id };
            return { found: true, record: records[index] };
        },
        findAll() { return { records, count: records.length }; },
        update(id, data) {
            const index = records.findIndex(r => r.id === id);
            if (index === -1) return { error: "Record not found" };
            Object.assign(records[index], data);
            return { updated: true, record: records[index] };
        },
        delete(id) {
            const index = records.findIndex(r => r.id === id);
            if (index === -1) return { error: "Record not found" };
            records.splice(index, 1);
            return { deleted: true, id };
        },
        count() { return records.length; }
    };
}

function createView(cfg) {
    return {
        renderError(statusCode, message) {
            return { viewName: cfg.viewName, type: "ERROR", statusCode, message, rendered: "[ERROR " + statusCode + "] " + message };
        },
        renderSuccess(data, message) {
            return { viewName: cfg.viewName, type: "SUCCESS", message, data, rendered: "[SUCCESS] " + message };
        }
    };
}


// --- Build model + view + controller ---
const UserModel = createModel({
    modelName: "User",
    schema: { name: { type: "string", required: true, default: null } }
});

const UserView = createView({
    viewName: "UserView",
    templates: { "user": "User: {{name}}" }
});


const UserController = createController({
    controllerName: "User",
    model: UserModel,
    view: UserView
});

// --- handleCreate: success ---
console.log(UserController.handleCreate({ name: "Rahim" }));


// --- handleCreate: model error → 400 ---
console.log(UserController.handleCreate({}));


// --- handleGetById: found ---
console.log(UserController.handleGetById("User_1"));


// --- handleGetById: not found → 404 ---
console.log(UserController.handleGetById("User_99"));


// --- handleUpdate: success ---
console.log(UserController.handleUpdate("User_1", { name: "Karim" }));


// --- handleDelete: success ---
console.log(UserController.handleDelete("User_1"));


// --- getActionLog ---
console.log(UserController.getActionLog());


// --- INVALID: bad controllerConfig ---
console.log(createController({ controllerName: "", model: {}, view: {} }));