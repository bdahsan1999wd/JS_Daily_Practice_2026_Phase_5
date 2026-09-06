// 🧩 PROBLEM–03: createPermissionChecker()

// Logic: Effective permissions including inheritance, wildcard matching,
// ownership override, multi-checks, access matrix, decision explanation.

function createPermissionChecker(checkerConfig) {

    // --- STEP 1: VALIDATE ---

    if (
        typeof checkerConfig !== "object" ||
        checkerConfig === null ||
        Array.isArray(checkerConfig) ||
        typeof checkerConfig.roles !== "object" ||
        checkerConfig.roles === null ||
        Array.isArray(checkerConfig.roles) ||
        !Array.isArray(checkerConfig.resources)
    ) {
        return "Invalid Input";
    }

    const resources = [];
    const resourceMap = {};

    for (const res of checkerConfig.resources) {
        if (typeof res !== "object" || res === null || Array.isArray(res) ||
            typeof res.name !== "string" || res.name.length === 0 ||
            !Array.isArray(res.actions)) {
            return "Invalid Input";
        }
        resources.push({
            name: res.name,
            actions: [...res.actions],
            ownershipRequired: res.ownershipRequired === true
        });
        resourceMap[res.name] = resources[resources.length - 1];
    }

    const roles = {}; // name -> { permissions, inherits }

    for (const [name, cfg] of Object.entries(checkerConfig.roles)) {
        if (typeof cfg !== "object" || cfg === null || Array.isArray(cfg)) return "Invalid Input";
        roles[name] = {
            permissions: Array.isArray(cfg.permissions) ? [...cfg.permissions] : [],
            inherits: Array.isArray(cfg.inherits) ? [...cfg.inherits] : []
        };
    }

    // --- HELPERS ---

    function effectivePermissions(roleName) {
        const result = [];
        const queue = [roleName];
        const seen = new Set();

        while (queue.length > 0) {
            const current = queue.shift();
            if (seen.has(current)) continue;
            seen.add(current);
            const cfg = roles[current];
            if (!cfg) continue;
            for (const perm of cfg.permissions) {
                if (!result.includes(perm)) result.push(perm);
            }
            queue.push(...cfg.inherits);
        }

        return result;
    }

    function matchPermission(perms, resource, action) {
        const candidates = [
            resource + ":" + action,
            resource + ":*",
            "*:" + action,
            "*:*"
        ];
        for (const candidate of candidates) {
            if (perms.includes(candidate)) return candidate;
        }
        return null;
    }

    // --- PUBLIC API ---

    return {

        check(userId, roleName, resource, action) {

            if (typeof userId !== "string" || userId.length === 0 ||
                typeof roleName !== "string" || roleName.length === 0 ||
                typeof resource !== "string" || resource.length === 0 ||
                typeof action !== "string" || action.length === 0) {
                return "Invalid Input";
            }

            if (!roles[roleName]) return { error: "Role not found" };

            const perms = effectivePermissions(roleName);
            const matched = matchPermission(perms, resource, action);

            if (matched) {
                const isWildcard = matched.includes("*");
                return {
                    permitted: true,
                    userId,
                    roleName,
                    resource,
                    action,
                    matchedPermission: matched,
                    reason: isWildcard ? "Wildcard permission match" : "Direct permission match"
                };
            }

            return {
                permitted: false,
                userId,
                roleName,
                resource,
                action,
                matchedPermission: null,
                reason: "No matching permission found"
            };
        },

        checkWithOwnership(userId, roleName, resource, action, resourceOwnerId) {

            if (typeof userId !== "string" || userId.length === 0 ||
                typeof roleName !== "string" || roleName.length === 0 ||
                typeof resource !== "string" || resource.length === 0 ||
                typeof action !== "string" || action.length === 0) {
                return "Invalid Input";
            }

            const res = resourceMap[resource];

            const perms = effectivePermissions(roleName);
            const matched = matchPermission(perms, resource, action);

            let ownershipGranted = false;

            if (res && res.ownershipRequired && (action === "write" || action === "delete")) {
                if (typeof resourceOwnerId === "string" && resourceOwnerId.length > 0 && userId === resourceOwnerId) {
                    ownershipGranted = true;
                }
            }

            const roleGranted = matched !== null;

            if (ownershipGranted || roleGranted) {
                return {
                    permitted: true,
                    ownershipGranted,
                    roleGranted,
                    reason: ownershipGranted ? "Permitted via resource ownership" : "Permitted via role permission"
                };
            }

            return {
                permitted: false,
                ownershipGranted: false,
                roleGranted: false,
                reason: "No permission and no ownership"
            };
        },

        checkMultiple(userId, roleName, checks) {

            if (typeof userId !== "string" || userId.length === 0 ||
                typeof roleName !== "string" || roleName.length === 0 ||
                !Array.isArray(checks)) {
                return "Invalid Input";
            }

            const results = checks.map(({ resource, action }) => {
                const decision = this.check(userId, roleName, resource, action);
                return { resource, action, permitted: decision.permitted === true };
            });

            const denied = results.filter(r => !r.permitted).length;

            return {
                results,
                allPermitted: denied === 0,
                deniedCount: denied
            };
        },

        getAccessMatrix(roleName) {

            if (typeof roleName !== "string" || roleName.length === 0) return "Invalid Input";
            if (!roles[roleName]) return { error: "Role not found" };

            const matrix = {};

            for (const res of resources) {
                matrix[res.name] = {};
                for (const action of res.actions) {
                    matrix[res.name][action] = this.check("sys", roleName, res.name, action).permitted;
                }
            }

            return { roleName, matrix };
        },

        explainDecision(userId, roleName, resource, action) {

            if (typeof userId !== "string" || userId.length === 0 ||
                typeof roleName !== "string" || roleName.length === 0 ||
                typeof resource !== "string" || resource.length === 0 ||
                typeof action !== "string" || action.length === 0) {
                return "Invalid Input";
            }

            if (!roles[roleName]) return { error: "Role not found" };

            const steps = [];
            const perms = effectivePermissions(roleName);

            steps.push("Role '" + roleName + "' has effective permissions: [" + perms.join(", ") + "]");

            const matched = matchPermission(perms, resource, action);

            if (matched) {
                steps.push("Permission '" + matched + "' matches for resource '" + resource + "' and action '" + action + "'");
                steps.push("Access granted");
                return { permitted: true, steps, matchedPermission: matched };
            }

            steps.push("No permission matches '" + resource + ":" + action + "'");
            steps.push("Access denied");

            return { permitted: false, steps, matchedPermission: null };
        }
    };
}


// ------ EXAMPLE USAGE ------

const checker = createPermissionChecker({
    roles: {
        "USER": { permissions: ["users:read", "orders:read"], inherits: [] },
        "MOD": { permissions: ["users:write", "orders:write"], inherits: ["USER"] },
        "ADMIN": { permissions: ["*:*"], inherits: [] }
    },
    resources: [
        { name: "users", actions: ["read", "write", "delete"], ownershipRequired: false },
        { name: "orders", actions: ["read", "write", "delete"], ownershipRequired: true }
    ]
});

console.log(checker.check("U1", "USER", "users", "read"));

console.log(checker.check("U1", "USER", "users", "delete"));

console.log(checker.check("U1", "ADMIN", "orders", "delete"));

console.log(checker.checkWithOwnership("U1", "USER", "orders", "write", "U1"));

console.log(checker.getAccessMatrix("MOD"));


// --- INVALID ---
console.log(checker.check("", "USER", "users", "read"));