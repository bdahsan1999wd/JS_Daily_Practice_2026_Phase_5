// 🧩 PROBLEM–03: createScopeManager()

// Logic: Scope validation, hierarchy expansion, permission checks.
//   validateScopes() — against availableScopes + risk assessment
//   expandScopes() — add children of parent scopes
//   checkPermission() — expand then check membership
//   getScopeInfo() / buildScopeSet()


function createScopeManager(scopeConfig) {

    // --- STEP 1: VALIDATE inputs ---
    if (
        typeof scopeConfig !== "object" ||
        scopeConfig === null ||
        Array.isArray(scopeConfig) ||
        !Array.isArray(scopeConfig.availableScopes) ||
        typeof scopeConfig.scopeHierarchy !== "object" ||
        scopeConfig.scopeHierarchy === null
    ) {
        return "Invalid Input";
    }

    const availableScopes = scopeConfig.availableScopes;
    const scopeHierarchy = scopeConfig.scopeHierarchy;

    const scopeMap = {};

    for (const entry of availableScopes) {
        if (
            typeof entry === "object" && entry !== null &&
            typeof entry.scope === "string" &&
            typeof entry.description === "string" &&
            ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(entry.riskLevel)
        ) {
            scopeMap[entry.scope] = { scope: entry.scope, description: entry.description, riskLevel: entry.riskLevel };
        }
    }

    // --- STEP 2: HELPERS ---
    function expandScopeList(scopes) {

        const result = [];
        const added = new Set();

        for (const scope of scopes) {
            if (!result.includes(scope)) result.push(scope);
            const children = scopeHierarchy[scope];
            if (Array.isArray(children)) {
                for (const child of children) {
                    if (!result.includes(child)) {
                        result.push(child);
                        added.add(child);
                    }
                }
            }
        }

        return { expanded: result, addedScopes: Array.from(added) };
    }

    // --- STEP 3: PUBLIC API ---

    return {

        validateScopes(requestedScopes) {

            if (!Array.isArray(requestedScopes)) return "Invalid Input";

            const validScopes = [];
            const invalidScopes = [];
            const riskAssessment = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

            for (const scope of requestedScopes) {
                if (scopeMap.hasOwnProperty(scope)) {
                    validScopes.push(scope);
                    riskAssessment[scopeMap[scope].riskLevel]++;
                } else {
                    invalidScopes.push(scope);
                }
            }

            return {
                valid: invalidScopes.length === 0,
                validScopes,
                invalidScopes,
                riskAssessment
            };
        },

        expandScopes(scopes) {

            if (!Array.isArray(scopes)) return "Invalid Input";

            const { expanded, addedScopes } = expandScopeList(scopes);

            return { original: scopes, expanded, addedScopes };
        },

        checkPermission(keyScopes, requiredScope) {

            if (!Array.isArray(keyScopes) || typeof requiredScope !== "string") return "Invalid Input";

            const { expanded } = expandScopeList(keyScopes);

            const permitted = expanded.includes(requiredScope);

            return {
                permitted,
                requiredScope,
                keyScopes: expanded,
                reason: permitted ? null : "SCOPE_NOT_GRANTED"
            };
        },

        getScopeInfo(scope) {

            if (typeof scope !== "string" || scope.length === 0) return "Invalid Input";

            if (scopeMap.hasOwnProperty(scope)) {
                return { ...scopeMap[scope] };
            }

            return { error: "Unknown scope: " + scope };
        },

        buildScopeSet(template) {

            if (typeof template !== "string") return "Invalid Input";

            let scopes = [];

            if (template === "READ_ONLY") {
                scopes = availableScopes.map(e => e.scope).filter(s => s.startsWith("read:"));
            } else if (template === "READ_WRITE") {
                scopes = availableScopes.map(e => e.scope).filter(s => s.startsWith("read:") || s.startsWith("write:"));
            } else if (template === "ADMIN") {
                scopes = availableScopes.map(e => e.scope);
            } else if (template === "MINIMAL") {
                scopes = availableScopes.filter(e => e.riskLevel === "LOW").map(e => e.scope);
            } else {
                return "Invalid Input";
            }

            return { template, scopes, count: scopes.length };
        }
    };
}


// ------ EXAMPLE USAGE ------

const sm = createScopeManager({
    availableScopes: [
        { scope: "read:users", description: "Read user data", riskLevel: "LOW" },
        { scope: "write:users", description: "Modify user data", riskLevel: "HIGH" },
        { scope: "read:orders", description: "Read orders", riskLevel: "LOW" },
        { scope: "write:orders", description: "Create/modify orders", riskLevel: "MEDIUM" },
        { scope: "admin", description: "Full admin access", riskLevel: "CRITICAL" }
    ],
    scopeHierarchy: {
        "admin": ["read:users", "write:users", "read:orders", "write:orders"]
    }
});


console.log(sm.validateScopes(["read:users", "write:orders", "unknown:scope"]));

console.log(sm.expandScopes(["admin", "read:orders"]));

console.log(sm.checkPermission(["admin"], "write:users"));

console.log(sm.buildScopeSet("READ_ONLY"));


// --- INVALID ---
console.log(createScopeManager({ availableScopes: "read:users", scopeHierarchy: null }));