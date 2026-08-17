// 🧩 PROBLEM–02: createView()

// Logic: Implements the View layer of a Mini MVC framework.

// Builds a view object from a viewConfig with these methods:

//   render(templateName, data)          — replace {{placeholders}} with data
//   renderList(templateName, dataArray) — render for each item
//   renderError(statusCode, message)    — standard error view
//   renderSuccess(data, message)        — standard success view
//   listTemplates()                     — available template names

function createView(viewConfig) {

    // --- STEP 1: VALIDATE viewConfig ---

    if (
        typeof viewConfig !== "object" ||
        viewConfig === null ||
        Array.isArray(viewConfig)
    ) {
        return "Invalid Input";
    }

    const { viewName, templates } = viewConfig;

    // viewName must be a non-empty string.

    if (
        typeof viewName !== "string" ||
        viewName.trim() === ""
    ) {
        return "Invalid Input";
    }

    // templates must be a non-null plain object of strings.

    if (
        typeof templates !== "object" ||
        templates === null ||
        Array.isArray(templates)
    ) {
        return "Invalid Input";
    }

    for (const key of Object.keys(templates)) {
        if (typeof templates[key] !== "string") {
            return "Invalid Input";
        }
    }

    // --- STEP 2: RENDER HELPER ---
    // Replace every {{fieldName}} placeholder in the template.
    // Missing data keys become "" (empty string).

    function renderTemplate(templateString, data) {
        return templateString.replace(/\{\{(\w+)\}\}/g, (match, fieldName) => {
            return data && data[fieldName] !== undefined ? String(data[fieldName]) : "";
        });
    }

    // --- STEP 3: VIEW METHODS ---

    return {
        // render(templateName, data): render one template.
        render(templateName, data) {

            if (typeof templates[templateName] !== "string") {
                return { error: "Template not found: " + templateName };
            }

            const rendered = renderTemplate(templates[templateName], data);

            return { viewName, templateName, rendered };
        },

        // renderList(templateName, dataArray): render template for each item.
        renderList(templateName, dataArray) {

            if (
                !Array.isArray(dataArray) ||
                typeof templates[templateName] !== "string"
            ) {
                return "Invalid Input";
            }

            const rendered = dataArray.map(
                item => renderTemplate(templates[templateName], item)
            );

            return { viewName, templateName, rendered, count: rendered.length };
        },

        // renderError(statusCode, message): standard error view.
        renderError(statusCode, message) {
            return {
                viewName,
                type: "ERROR",
                statusCode,
                message,
                rendered: "[ERROR " + statusCode + "] " + message
            };
        },

        // renderSuccess(data, message): standard success view.
        renderSuccess(data, message) {
            return {
                viewName,
                type: "SUCCESS",
                message,
                data,
                rendered: "[SUCCESS] " + message
            };
        },

        // listTemplates(): array of template names.
        listTemplates() {
            return Object.keys(templates);
        }
    };
}


// ------ EXAMPLE USAGE ------

// --- Build a User view ---
const UserView = createView({
    viewName: "UserView",
    templates: {
        "userCard": "Name: {{name}}, Age: {{age}}, Active: {{active}}",
        "userSummary": "User {{name}} has ID {{id}}"
    }
});

// --- render ---
console.log(UserView.render("userCard", { name: "Rahim", age: 25, active: true }));

// --- render: missing data key becomes empty string ---
console.log(UserView.render("userSummary", { name: "Karim" }));

// --- render: template not found ---
console.log(UserView.render("nope", { name: "Rahim" }));

// --- renderList ---
console.log(UserView.renderList("userSummary", [
    { id: "User_1", name: "Rahim" },
    { id: "User_2", name: "Karim" }
]));

// --- renderError ---
console.log(UserView.renderError(404, "User not found"));


// --- renderSuccess ---
console.log(UserView.renderSuccess({ id: "User_1" }, "User created"));

// --- listTemplates ---
console.log(UserView.listTemplates());


// --- INVALID: bad viewConfig ---
console.log(createView({ viewName: "", templates: {} }));