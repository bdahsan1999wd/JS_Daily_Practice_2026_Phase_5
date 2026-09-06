// 🧩 PROBLEM–04: createRBACPolicyEngine()

// Logic: Policy matching (roles/resources/actions with wildcard "*"),
//   condition enforcement (time, IP, MFA), DENY-overrides-ALLOW, default deny.

function createRBACPolicyEngine(policyConfig) {

    // --- STEP 1: VALIDATE ---

    if (
        typeof policyConfig !== "object" ||
        policyConfig === null ||
        Array.isArray(policyConfig) ||
        typeof policyConfig.engineId !== "string" ||
        policyConfig.engineId.length === 0 ||
        !Array.isArray(policyConfig.policies)
    ) {
        return "Invalid Input";
    }

    const policies = [];

    for (const policy of policyConfig.policies) {
        if (typeof policy !== "object" || policy === null || Array.isArray(policy)) return "Invalid Input";
        policies.push({
            policyId: policy.policyId,
            effect: policy.effect,
            roles: [...policy.roles],
            resources: [...policy.resources],
            actions: [...policy.actions],
            conditions: policy.conditions
        });
    }

    // --- HELPERS ---

    function listMatches(list, value) {
        return list.includes("*") || list.includes(value);
    }

    function conditionMet(conditions, context) {
        if (!conditions) return true;

        if (conditions.timeRange) {
            const hour = context.currentHour;
            if (typeof hour !== "number" || hour === null) return false;
            if (hour < conditions.timeRange.startHour || hour > conditions.timeRange.endHour) return false;
        }

        if (conditions.ipWhitelist && conditions.ipWhitelist.length > 0) {
            if (!conditions.ipWhitelist.includes(context.ip)) return false;
        }

        if (conditions.requireMFA === true) {
            if (context.mfaVerified !== true) return false;
        }

        return true;
    }

    function matchPolicy(policy, context) {
        const rolesMatch = policy.roles.includes("*") || policy.roles.some(r => context.roles.includes(r));
        const resourceMatch = listMatches(policy.resources, context.resource);
        const actionMatch = listMatches(policy.actions, context.action);
        return rolesMatch && resourceMatch && actionMatch;
    }

    function evaluateInternal(context) {

        const appliedPolicies = [];
        let matchedButConditionFailed = false;

        for (const policy of policies) {
            if (!matchPolicy(policy, context)) continue;

            if (!conditionMet(policy.conditions, context)) {
                matchedButConditionFailed = true;
                continue;
            }

            appliedPolicies.push(policy.policyId);
        }

        const denyPolicies = appliedPolicies.filter(id => {
            const p = policies.find(x => x.policyId === id);
            return p.effect === "DENY";
        });

        if (denyPolicies.length > 0) {
            return { permitted: false, appliedPolicies: denyPolicies, reason: "EXPLICIT_DENY" };
        }

        if (appliedPolicies.length > 0) {
            return { permitted: true, appliedPolicies, reason: "EXPLICIT_ALLOW" };
        }

        if (matchedButConditionFailed) {
            return { permitted: false, appliedPolicies: [], reason: "CONDITION_NOT_MET" };
        }

        return { permitted: false, appliedPolicies: [], reason: "DEFAULT_DENY" };
    }

    // --- PUBLIC API ---

    return {

        evaluate(context) {

            if (typeof context !== "object" || context === null || Array.isArray(context) ||
                typeof context.userId !== "string" || context.userId.length === 0 ||
                !Array.isArray(context.roles) ||
                typeof context.resource !== "string" || context.resource.length === 0 ||
                typeof context.action !== "string" || context.action.length === 0) {
                return "Invalid Input";
            }

            return evaluateInternal(context);
        },

        addPolicy(policy) {

            if (typeof policy !== "object" || policy === null || Array.isArray(policy)) return "Invalid Input";

            if (policies.some(p => p.policyId === policy.policyId)) {
                return { error: "Policy already exists" };
            }

            policies.push({
                policyId: policy.policyId,
                effect: policy.effect,
                roles: [...policy.roles],
                resources: [...policy.resources],
                actions: [...policy.actions],
                conditions: policy.conditions
            });

            return { added: true, policyId: policy.policyId };
        },

        removePolicy(policyId) {

            if (typeof policyId !== "string" || policyId.length === 0) return "Invalid Input";

            const idx = policies.findIndex(p => p.policyId === policyId);
            if (idx === -1) return { error: "Policy not found" };

            policies.splice(idx, 1);

            return { removed: true, policyId };
        },

        listPolicies() {
            return policies.map(p => ({ ...p }));
        },

        simulateAccess(scenarios) {

            if (!Array.isArray(scenarios)) return "Invalid Input";

            return scenarios.map(scenario => ({
                scenario,
                result: evaluateInternal(scenario)
            }));
        }
    };
}


// ------ EXAMPLE USAGE ------

const engine = createRBACPolicyEngine({
    engineId: "ENGINE-01",
    policies: [
        {
            policyId: "P1",
            effect: "ALLOW",
            roles: ["USER", "MOD"],
            resources: ["articles"],
            actions: ["read"],
            conditions: null
        },
        {
            policyId: "P2",
            effect: "ALLOW",
            roles: ["ADMIN"],
            resources: ["*"],
            actions: ["*"],
            conditions: null
        },
        {
            policyId: "P3",
            effect: "DENY",
            roles: ["*"],
            resources: ["admin-panel"],
            actions: ["*"],
            conditions: {
                timeRange: { startHour: 9, endHour: 17 },
                ipWhitelist: ["10.0.0.1", "10.0.0.2"],
                requireMFA: true
            }
        }
    ]
});


console.log(engine.evaluate({ userId: "U1", roles: ["USER"], resource: "articles", action: "read", ip: null, currentHour: 10, mfaVerified: false }));


console.log(engine.evaluate({ userId: "U1", roles: ["USER"], resource: "articles", action: "delete", ip: null, currentHour: 10, mfaVerified: false }));


console.log(engine.evaluate({ userId: "U2", roles: ["ADMIN"], resource: "admin-panel", action: "read", ip: "192.168.1.1", currentHour: 14, mfaVerified: false }));


console.log(engine.evaluate({ userId: "U2", roles: ["ADMIN"], resource: "admin-panel", action: "read", ip: "10.0.0.1", currentHour: 14, mfaVerified: false }));


// --- INVALID ---
console.log(engine.evaluate({}));