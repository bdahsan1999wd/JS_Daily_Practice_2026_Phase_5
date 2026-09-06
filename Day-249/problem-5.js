// 🧩 PROBLEM–05: runRBACOrchestrator()

//  Logic: Full RBAC pipeline composing Problems 01-04 inline:
//  role registry, inheritance, permission checker, policy engine.
//  Final decision = checker permitted AND policy engine permitted.

function runRBACOrchestrator(rbacConfig) {

    // --- STEP 1: VALIDATE ---

    if (
        typeof rbacConfig !== "object" ||
        rbacConfig === null ||
        Array.isArray(rbacConfig) ||
        typeof rbacConfig.orchestratorId !== "string" ||
        rbacConfig.orchestratorId.length === 0 ||
        !Array.isArray(rbacConfig.roles) ||
        !Array.isArray(rbacConfig.resources) ||
        !Array.isArray(rbacConfig.policies) ||
        !Array.isArray(rbacConfig.users) ||
        !Array.isArray(rbacConfig.accessRequests)
    ) {
        return "Invalid Input";
    }

    const orchestratorId = rbacConfig.orchestratorId;

    // --- STEP 2: PERMISSION CHECKER (Problems 01-03 logic inline) ---

    const roles = {}; // roleName -> { permissions, inherits }

    for (const role of rbacConfig.roles) {
        if (typeof role !== "object" || role === null || Array.isArray(role)) return "Invalid Input";
        roles[role.name] = {
            permissions: Array.isArray(role.permissions) ? [...role.permissions] : [],
            inherits: Array.isArray(role.inherits) ? [...role.inherits] : []
        };
    }

    const resourceMap = {};

    for (const res of rbacConfig.resources) {
        if (typeof res !== "object" || res === null || Array.isArray(res)) return "Invalid Input";
        resourceMap[res.name] = {
            name: res.name,
            actions: Array.isArray(res.actions) ? [...res.actions] : [],
            ownershipRequired: res.ownershipRequired === true
        };
    }

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

    function checkerCheck(userId, roleName, resource, action) {
        const perms = effectivePermissions(roleName);
        const matched = matchPermission(perms, resource, action);
        return {
            permitted: matched !== null,
            matchedPermission: matched
        };
    }

    function checkerCheckWithOwnership(userId, roleName, resource, action, resourceOwnerId) {
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

        if (ownershipGranted) {
            return { permitted: true, matchedPermission: null, ownershipGranted: true, roleGranted: false };
        }
        if (roleGranted) {
            return { permitted: true, matchedPermission: matched, ownershipGranted: false, roleGranted: true };
        }
        return { permitted: false, matchedPermission: null, ownershipGranted: false, roleGranted: false };
    }

    // --- STEP 3: POLICY ENGINE (Problem-04 logic inline) ---

    const policies = rbacConfig.policies.map(policy => ({
        policyId: policy.policyId,
        effect: policy.effect,
        roles: [...policy.roles],
        resources: [...policy.resources],
        actions: [...policy.actions],
        conditions: policy.conditions
    }));

    function listMatches(list, value) {
        return list.includes("*") || list.includes(value);
    }

    function conditionMet(conditions, context) {
        if (!conditions) return true;

        if (conditions.timeRange) {
            const hour = context.currentHour;
            if (typeof hour !== "number") return false;
            if (hour < conditions.timeRange.startHour || hour > conditions.timeRange.endHour) return false;
        }

        if (conditions.ipWhitelist && conditions.ipWhitelist.length > 0) {
            if (!conditions.ipWhitelist.includes(context.ip)) return false;
        }

        if (conditions.requireMFA === true && context.mfaVerified !== true) return false;

        return true;
    }

    function policyEvaluate(context) {
        const applied = [];
        let matchedButConditionFailed = false;

        for (const policy of policies) {
            const rolesMatch = policy.roles.includes("*") || policy.roles.some(r => context.roles.includes(r));
            const resourceMatch = listMatches(policy.resources, context.resource);
            const actionMatch = listMatches(policy.actions, context.action);

            if (!rolesMatch || !resourceMatch || !actionMatch) continue;

            if (!conditionMet(policy.conditions, context)) {
                matchedButConditionFailed = true;
                continue;
            }

            applied.push(policy.policyId);
        }

        const denyIds = applied.filter(id => policies.find(p => p.policyId === id).effect === "DENY");

        if (denyIds.length > 0) {
            return { permitted: false, appliedPolicies: denyIds, reason: "EXPLICIT_DENY" };
        }
        if (applied.length > 0) {
            return { permitted: true, appliedPolicies: applied, reason: "EXPLICIT_ALLOW" };
        }
        if (matchedButConditionFailed) {
            return { permitted: false, appliedPolicies: [], reason: "CONDITION_NOT_MET" };
        }
        return { permitted: false, appliedPolicies: [], reason: "DEFAULT_DENY" };
    }

    // --- STEP 4: PROCESS ACCESS REQUESTS ---

    const accessLog = [];

    for (const req of rbacConfig.accessRequests) {
        if (typeof req !== "object" || req === null || Array.isArray(req)) return "Invalid Input";

        const user = rbacConfig.users.find(u => u.userId === req.userId);
        const roleName = user && Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : null;

        let checkerResult;

        const res = resourceMap[req.resource];
        const ownershipRelevant = res && res.ownershipRequired && (req.action === "write" || req.action === "delete");

        if (ownershipRelevant) {
            checkerResult = checkerCheckWithOwnership(req.userId, roleName, req.resource, req.action, req.resourceOwnerId);
        } else {
            checkerResult = checkerCheck(req.userId, roleName, req.resource, req.action);
        }

        const policyResult = policyEvaluate({
            userId: req.userId,
            roles: user && Array.isArray(user.roles) ? user.roles : [],
            resource: req.resource,
            action: req.action,
            ip: req.ip,
            currentHour: req.currentHour,
            mfaVerified: req.mfaVerified
        });

        const permitted = checkerResult.permitted === true && policyResult.permitted === true;

        let reason;

        if (permitted) {
            reason = "BOTH_CHECKS_PASSED";
        } else if (policyResult.reason === "EXPLICIT_DENY") {
            reason = "POLICY_DENY";
        } else if (checkerResult.permitted === false) {
            reason = "NO_PERMISSION";
        } else if (policyResult.reason === "DEFAULT_DENY") {
            reason = "DEFAULT_DENY";
        } else {
            reason = "DENIED";
        }

        accessLog.push({
            requestId: req.requestId,
            userId: req.userId,
            resource: req.resource,
            action: req.action,
            permitted,
            reason,
            checkerResult: { permitted: checkerResult.permitted, matchedPermission: checkerResult.matchedPermission },
            policyResult
        });
    }

    // --- STEP 5: BUILD SUMMARY ---

    const totalRequests = accessLog.length;
    const permittedCount = accessLog.filter(entry => entry.permitted).length;
    const deniedCount = totalRequests - permittedCount;

    const denialReasons = { NO_PERMISSION: 0, POLICY_DENY: 0, DEFAULT_DENY: 0 };

    for (const entry of accessLog) {
        if (entry.permitted) continue;
        if (entry.reason === "NO_PERMISSION") denialReasons.NO_PERMISSION++;
        else if (entry.reason === "POLICY_DENY") denialReasons.POLICY_DENY++;
        else if (entry.reason === "DEFAULT_DENY") denialReasons.DEFAULT_DENY++;
    }

    const deniedResourceCounts = {};
    const userRequestCounts = {};

    let mostDeniedResource = null;
    let mostDeniedResourceCount = 0;
    let mostActiveUser = null;
    let mostActiveUserCount = 0;

    for (const entry of accessLog) {
        if (!entry.permitted) {
            if (!deniedResourceCounts[entry.resource]) deniedResourceCounts[entry.resource] = 0;
            deniedResourceCounts[entry.resource]++;
            if (deniedResourceCounts[entry.resource] > mostDeniedResourceCount) {
                mostDeniedResourceCount = deniedResourceCounts[entry.resource];
                mostDeniedResource = entry.resource;
            }
        }

        if (!userRequestCounts[entry.userId]) userRequestCounts[entry.userId] = 0;
        userRequestCounts[entry.userId]++;
        if (userRequestCounts[entry.userId] > mostActiveUserCount) {
            mostActiveUserCount = userRequestCounts[entry.userId];
            mostActiveUser = entry.userId;
        }
    }

    return {
        orchestratorId,
        accessLog,
        summary: {
            totalRequests,
            permittedCount,
            deniedCount,
            denialReasons,
            mostDeniedResource,
            mostActiveUser
        }
    };
}


// ------ EXAMPLE USAGE ------

console.log(JSON.stringify(runRBACOrchestrator({
    orchestratorId: "RBAC-ORCH-01",
    roles: [
        { name: "USER", description: "Basic user", level: 10, permissions: ["articles:read", "comments:write"], inherits: [] },
        { name: "ADMIN", description: "Administrator", level: 100, permissions: ["*:*"], inherits: [] }
    ],
    resources: [
        { name: "articles", actions: ["read", "write", "delete"], ownershipRequired: false },
        { name: "comments", actions: ["read", "write", "delete"], ownershipRequired: true },
        { name: "admin-panel", actions: ["read", "write"], ownershipRequired: false }
    ],
    policies: [
        { policyId: "P1", effect: "ALLOW", roles: ["USER"], resources: ["articles"], actions: ["read"], conditions: null },
        { policyId: "P2", effect: "ALLOW", roles: ["ADMIN"], resources: ["*"], actions: ["*"], conditions: null },
        { policyId: "P3", effect: "DENY", roles: ["USER"], resources: ["admin-panel"], actions: ["*"], conditions: null }
    ],
    users: [
        { userId: "U1", roles: ["USER"], mfaEnabled: false },
        { userId: "U2", roles: ["ADMIN"], mfaEnabled: true }
    ],
    accessRequests: [
        { requestId: "AR-1", userId: "U1", resource: "articles", action: "read", resourceOwnerId: null, ip: null, currentHour: 10, mfaVerified: false },
        { requestId: "AR-2", userId: "U1", resource: "admin-panel", action: "read", resourceOwnerId: null, ip: null, currentHour: 10, mfaVerified: false },
        { requestId: "AR-3", userId: "U2", resource: "admin-panel", action: "write", resourceOwnerId: null, ip: null, currentHour: 10, mfaVerified: true },
        { requestId: "AR-4", userId: "U1", resource: "articles", action: "delete", resourceOwnerId: null, ip: null, currentHour: 10, mfaVerified: false }
    ]
}), null, 2));


// --- INVALID ---
console.log(runRBACOrchestrator({ orchestratorId: "" }));