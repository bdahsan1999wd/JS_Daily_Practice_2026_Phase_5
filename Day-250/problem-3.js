// 🧩 PROBLEM–03: buildAccessControl()

// Logic: RBAC access control. Effective permissions (with inheritance),
//   permission check, policy evaluation, final = both must permit.

function buildAccessControl(acConfig) {

    // --- STEP 1: VALIDATE ---

    if (
        typeof acConfig !== "object" ||
        acConfig === null ||
        Array.isArray(acConfig) ||
        !Array.isArray(acConfig.roles) ||
        !Array.isArray(acConfig.policies) ||
        !Array.isArray(acConfig.accessRequests)
    ) {
        return "Invalid Input";
    }

    const roles = {};

    for (const role of acConfig.roles) {
        roles[role.name] = {
            permissions: Array.isArray(role.permissions) ? [...role.permissions] : [],
            inherits: Array.isArray(role.inherits) ? [...role.inherits] : []
        };
    }

    // --- STEP 2: HELPERS ---

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
        const candidates = [resource + ":" + action, resource + ":*", "*:" + action, "*:*"];
        for (const candidate of candidates) {
            if (perms.includes(candidate)) return candidate;
        }
        return null;
    }

    function listMatches(list, value) {
        return list.includes("*") || list.includes(value);
    }

    function evaluatePolicy(request) {
        let matchedDeny = false;

        for (const policy of acConfig.policies) {
            const roleMatch = policy.roles.includes("*") || policy.roles.includes(request.userRole);
            const resourceMatch = listMatches(policy.resources, request.resource);
            const actionMatch = listMatches(policy.actions, request.action);

            if (!roleMatch || !resourceMatch || !actionMatch) continue;

            if (policy.effect === "DENY") {
                matchedDeny = true;
            }
        }

        if (matchedDeny) {
            return { permitted: false, reason: "EXPLICIT_DENY" };
        }

        let matchedAllow = false;
        for (const policy of acConfig.policies) {
            const roleMatch = policy.roles.includes("*") || policy.roles.includes(request.userRole);
            const resourceMatch = listMatches(policy.resources, request.resource);
            const actionMatch = listMatches(policy.actions, request.action);

            if (!roleMatch || !resourceMatch || !actionMatch) continue;

            if (policy.effect === "ALLOW") {
                matchedAllow = true;
            }
        }

        if (matchedAllow) {
            return { permitted: true, reason: "EXPLICIT_ALLOW" };
        }

        return { permitted: false, reason: "DEFAULT_DENY" };
    }

    // --- STEP 3: PROCESS ACCESS REQUESTS ---

    const accessLog = [];

    for (const req of acConfig.accessRequests) {

        const perms = effectivePermissions(req.userRole);
        const matched = matchPermission(perms, req.resource, req.action);
        const checkerPermitted = matched !== null;

        const policyResult = evaluatePolicy(req);

        const permitted = checkerPermitted && policyResult.permitted;

        let reason;

        if (permitted) {
            reason = "BOTH_CHECKS_PASSED";
        } else if (!checkerPermitted) {
            reason = "NO_PERMISSION";
        } else if (policyResult.reason === "EXPLICIT_DENY") {
            reason = "POLICY_DENY";
        } else {
            reason = "DEFAULT_DENY";
        }

        accessLog.push({
            requestId: req.requestId,
            userId: req.userId,
            resource: req.resource,
            action: req.action,
            permitted,
            reason
        });
    }

    // --- STEP 4: SUMMARY ---

    const permittedCount = accessLog.filter(e => e.permitted).length;
    const deniedCount = accessLog.length - permittedCount;

    const denialBreakdown = { NO_PERMISSION: 0, POLICY_DENY: 0, DEFAULT_DENY: 0 };

    for (const entry of accessLog) {
        if (entry.permitted) continue;
        if (entry.reason === "NO_PERMISSION") denialBreakdown.NO_PERMISSION++;
        else if (entry.reason === "POLICY_DENY") denialBreakdown.POLICY_DENY++;
        else if (entry.reason === "DEFAULT_DENY") denialBreakdown.DEFAULT_DENY++;
    }

    return {
        accessLog,
        summary: {
            totalRequests: accessLog.length,
            permittedCount,
            deniedCount,
            denialBreakdown
        }
    };
}


// ------ EXAMPLE USAGE ------
console.log(JSON.stringify(buildAccessControl({
    roles: [
        { name: "USER", permissions: ["articles:read"], inherits: [] },
        { name: "ADMIN", permissions: ["*:*"], inherits: ["USER"] }
    ],
    policies: [
        { policyId: "P1", effect: "ALLOW", roles: ["USER", "ADMIN"], resources: ["articles"], actions: ["read"] },
        { policyId: "P2", effect: "ALLOW", roles: ["ADMIN"], resources: ["*"], actions: ["*"] }
    ],
    accessRequests: [
        { requestId: "AR1", userId: "U1", userRole: "USER", resource: "articles", action: "read" },
        { requestId: "AR2", userId: "U1", userRole: "USER", resource: "articles", action: "delete" },
        { requestId: "AR3", userId: "U2", userRole: "ADMIN", resource: "users", action: "delete" }
    ]
}), null, 2));


// --- INVALID ---
console.log(buildAccessControl(null));