// 🧩 PROBLEM–10: runPhase5GrandOrchestrator()

//  Logic: ULTIMATE capstone. Composes all 9 modules inline and builds the
//  grand report. Validates, runs each module, aggregates summary metrics.


const __gReverse = (s) => String(s).split("").reverse().join("");
const __gDeepCopy = (v) => JSON.parse(JSON.stringify(v));
const __gCharCodeSum = (str) => { let s = 0; for (let i = 0; i < str.length; i++) s += str.charCodeAt(i); return s; };



// ================= MODULE: AUTH SYSTEM =================
function __moduleAuth(authBlueprint) {

    const userStore = [];
    for (const user of authBlueprint.users) {
        userStore.push({ userId: user.userId, role: user.role, passwordHash: "hash_" + __gReverse(user.password) + "_" + user.password.length });
    }

    const eventLog = [];

    for (const event of authBlueprint.authEvents) {

        let result;

        if (event.type === "REGISTER") {
            const violations = [];
            if (event.password.length < authBlueprint.passwordPolicy.minLength) violations.push("Password too short");
            if (authBlueprint.passwordPolicy.requireUppercase && !/[A-Z]/.test(event.password)) violations.push("Needs uppercase");
            if (authBlueprint.passwordPolicy.requireNumbers && !/[0-9]/.test(event.password)) violations.push("Needs number");
            if (authBlueprint.passwordPolicy.requireSpecialChars && !/[^A-Za-z0-9]/.test(event.password)) violations.push("Needs special");

            if (violations.length > 0) {
                result = { success: false, violations };
            } else {
                const passwordHash = "hash_" + __gReverse(event.password) + "_" + event.password.length;
                userStore.push({ userId: event.userId, role: "USER", passwordHash });
                result = { success: true, userId: event.userId, passwordHash };
            }

        } else if (event.type === "LOGIN") {
            const user = userStore.find(u => u.userId === event.userId);
            const valid = user && user.passwordHash === "hash_" + __gReverse(event.password) + "_" + event.password.length;

            if (!valid) {
                result = { success: false, reason: "INVALID_CREDENTIALS" };
            } else {
                const encoded = "jwt_" + event.userId + "_" + user.role + "_" + (1000000 + authBlueprint.jwtExpiryMs);
                const token = encoded + ".sig_" + __gCharCodeSum(encoded + authBlueprint.jwtSecret).toString(16);
                result = { success: true, userId: event.userId, token, expiresAt: 1000000 + authBlueprint.jwtExpiryMs };
            }
        } else if (event.type === "VERIFY_TOKEN") {
            const parts = String(event.token).split(".");
            const valid = parts.length === 2 && parts[1] === "sig_" + __gCharCodeSum(parts[0] + authBlueprint.jwtSecret).toString(16);
            const seg = parts.length === 2 ? parts[0].replace(/^jwt_/, "").split("_") : [];
            result = valid
                ? { success: true, userId: seg[0], role: seg[1], reason: null }
                : { success: false, userId: null, role: null, reason: "INVALID_TOKEN" };
        } else {
            continue;
        }

        eventLog.push({ eventId: event.eventId, type: event.type, result });
    }

    const successCount = eventLog.filter(e => e.result.success === true).length;

    return {
        summary: { totalEvents: eventLog.length, successCount, failureCount: eventLog.length - successCount },
        userStore
    };
}



// ================= MODULE: TOKEN VAULT =================
function __moduleTokenVault(vaultBlueprint) {

    const tokens = [];
    const sessions = [];
    let refreshIndex = 0;
    let sessionIndex = 0;

    const eventLog = [];

    for (const event of vaultBlueprint.events) {

        let result;

        if (event.type === "ISSUE") {
            refreshIndex++;
            const value = "RT-" + refreshIndex + "-" + event.userId;
            tokens.push({ eventId: event.eventId, userId: event.userId, value, encrypted: "ENC:" + __gReverse(value + vaultBlueprint.encryptionKey), expiresAt: event.currentTimeMs + vaultBlueprint.refreshTokenTTLMs, status: "ACTIVE" });
            result = { token: value, expiresAt: event.currentTimeMs + vaultBlueprint.refreshTokenTTLMs };
        } else if (event.type === "VALIDATE") {
            const t = tokens.find(x => x.eventId === event.tokenRef);
            let valid = false;
            let reason = "NOT_FOUND";
            if (t) {
                if (t.status === "REVOKED") reason = "REVOKED";
                else if (t.status === "REPLACED") reason = "REPLACED";
                else if (event.currentTimeMs > t.expiresAt) reason = "EXPIRED";
                else { valid = true; reason = null; }
            }
            result = { valid, reason };
        } else if (event.type === "REFRESH") {
            const t = tokens.find(x => x.eventId === event.tokenRef);
            let refreshed = false;
            let reason = "NOT_FOUND";
            let newToken = null;

            if (t && t.status === "ACTIVE" && event.currentTimeMs <= t.expiresAt) {
                refreshed = true;
                if (vaultBlueprint.rotateOnRefresh) {
                    t.status = "REPLACED";
                    refreshIndex++;
                    const value = "RT-" + refreshIndex + "-" + event.userId;
                    tokens.push({ eventId: event.eventId, userId: event.userId, value, encrypted: "ENC:" + __gReverse(value + vaultBlueprint.encryptionKey), expiresAt: event.currentTimeMs + vaultBlueprint.refreshTokenTTLMs, status: "ACTIVE" });
                    newToken = value;
                }
            } else if (t && t.status === "REVOKED") {
                reason = "REVOKED";
            } else if (t && event.currentTimeMs > t.expiresAt) {
                reason = "EXPIRED";
            }

            result = refreshed ? { refreshed: true, newToken } : { refreshed: false, reason };
        } else if (event.type === "REVOKE") {
            const t = tokens.find(x => x.eventId === event.tokenRef);
            if (t) { t.status = "REVOKED"; result = { revoked: true, tokenRef: event.tokenRef }; }
            else result = { error: "Token not found" };
        } else if (event.type === "CREATE_SESSION") {
            sessionIndex++;
            const sessionId = "SES-" + sessionIndex + "-" + event.userId;

            const userSessions = sessions.filter(s => s.userId === event.userId && s.status === "ACTIVE");
            if (userSessions.length >= vaultBlueprint.maxSessionsPerUser) {
                const oldest = userSessions.sort((a, b) => a.expiresAt - b.expiresAt)[0];
                oldest.status = "REVOKED";
            }

            sessions.push({ eventId: event.eventId, userId: event.userId, sessionId, expiresAt: event.currentTimeMs + vaultBlueprint.sessionTTLMs, status: "ACTIVE" });
            result = { sessionId, expiresAt: event.currentTimeMs + vaultBlueprint.sessionTTLMs };
        } else if (event.type === "DESTROY_SESSION") {
            const s = sessions.find(x => x.eventId === event.tokenRef);
            if (s) { s.status = "DESTROYED"; result = { destroyed: true, sessionId: s.sessionId }; }
            else result = { error: "Session not found" };
        } else {
            continue;
        }

        eventLog.push({ eventId: event.eventId, type: event.type, userId: event.userId, result });
    }

    return {
        summary: {
            totalEvents: eventLog.length,
            activeTokens: tokens.filter(t => t.status === "ACTIVE").length,
            activeSessions: sessions.filter(s => s.status === "ACTIVE").length,
            revokedCount: tokens.filter(t => t.status === "REVOKED").length
        }
    };
}



// ================= MODULE: API GATEWAY =================
function __moduleGateway(gatewayConfig) {

    const clientHistory = {};
    const requestLog = [];

    for (const req of gatewayConfig.requests) {

        let blockedStage = null;

        if (req.origin != null && !gatewayConfig.allowedOrigins.includes(req.origin)) {
            blockedStage = "CORS";
        }

        if (!blockedStage) {
            if (!clientHistory[req.clientId]) clientHistory[req.clientId] = [];
            clientHistory[req.clientId].push(req.timestampMs);
            const windowStart = req.timestampMs - gatewayConfig.rateLimitConfig.windowMs;
            if (clientHistory[req.clientId].filter(t => t >= windowStart).length > gatewayConfig.rateLimitConfig.maxRequests) {
                blockedStage = "RATE_LIMIT";
            }
        }

        if (!blockedStage) {
            const route = gatewayConfig.routes.find(r => r.method === req.method && r.path === req.path);
            if (route && route.requiresAuth === true && !gatewayConfig.validAPIKeys.includes(req.apiKey)) {
                blockedStage = "AUTH";
            }
        }

        if (!blockedStage) {
            const route = gatewayConfig.routes.find(r => r.method === req.method && r.path === req.path);
            if (!route) blockedStage = "ROUTE";
        }

        requestLog.push({
            requestId: req.requestId,
            passed: blockedStage === null,
            blockedAt: blockedStage,
            stage: blockedStage || "HANDLER"
        });
    }

    const passedCount = requestLog.filter(r => r.passed).length;

    return { summary: { totalRequests: requestLog.length, passedCount, blockedCount: requestLog.length - passedCount } };
}


// ================= MODULE: ACCESS CONTROL =================
function __moduleAccessControl(acConfig) {

    const roles = {};
    for (const role of acConfig.roles) {
        roles[role.name] = { permissions: [...(role.permissions || [])], inherits: [...(role.inherits || [])] };
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
            for (const perm of cfg.permissions) if (!result.includes(perm)) result.push(perm);
            queue.push(...cfg.inherits);
        }
        return result;
    }

    function matchPermission(perms, resource, action) {
        for (const candidate of [resource + ":" + action, resource + ":*", "*:" + action, "*:*"]) {
            if (perms.includes(candidate)) return candidate;
        }
        return null;
    }

    function listMatches(list, value) {
        return list.includes("*") || list.includes(value);
    }

    const accessLog = [];

    for (const req of acConfig.accessRequests) {

        const matched = matchPermission(effectivePermissions(req.userRole), req.resource, req.action);
        const checkerPermitted = matched !== null;

        let denyMatched = false;
        let allowMatched = false;

        for (const policy of acConfig.policies) {
            const roleMatch = policy.roles.includes("*") || policy.roles.includes(req.userRole);
            const resourceMatch = listMatches(policy.resources, req.resource);
            const actionMatch = listMatches(policy.actions, req.action);
            if (!roleMatch || !resourceMatch || !actionMatch) continue;
            if (policy.effect === "DENY") denyMatched = true;
            else allowMatched = true;
        }

        const policyPermitted = denyMatched ? false : allowMatched;

        const permitted = checkerPermitted && policyPermitted;

        let reason;
        if (permitted) reason = "BOTH_CHECKS_PASSED";
        else if (!checkerPermitted) reason = "NO_PERMISSION";
        else if (denyMatched) reason = "POLICY_DENY";
        else reason = "DEFAULT_DENY";

        accessLog.push({ requestId: req.requestId, userId: req.userId, resource: req.resource, action: req.action, permitted, reason });
    }

    const permittedCount = accessLog.filter(e => e.permitted).length;

    return { summary: { totalRequests: accessLog.length, permittedCount, deniedCount: accessLog.length - permittedCount } };
}


// ================= MODULE: INPUT SECURITY =================
const __THREATS = {
    XSS: ["<script>", "javascript:", "onerror=", "alert(", "eval("],
    SQLI: ["' OR", "UNION SELECT", "DROP TABLE", "--", "; SELECT"],
    PATH_TRAVERSAL: ["../", "/etc/passwd", "C:\\Windows"],
    COMMAND_INJECTION: ["; ls", "| cat", "&& rm", "$(", "`"]
};

function __escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}


function __moduleInputSecurity(securityConfig) {

    let cleanInputs = 0;
    let threatenedInputs = 0;
    const threatBreakdown = {};

    for (const input of securityConfig.inputs) {
        let inputHasThreat = false;

        for (const value of Object.values(input.data)) {
            const str = typeof value === "string" ? value : String(value);

            for (const detector of securityConfig.enabledDetectors) {
                for (const pattern of (__THREATS[detector] || [])) {
                    if (str.includes(pattern)) {
                        inputHasThreat = true;
                        if (!threatBreakdown[detector]) threatBreakdown[detector] = 0;
                        threatBreakdown[detector]++;
                    }
                }
            }
        }

        if (inputHasThreat) threatenedInputs++;
        else cleanInputs++;
    }

    return {
        overallSummary: {
            totalInputs: securityConfig.inputs.length,
            cleanInputs,
            threatenedInputs,
            threatBreakdown
        }
    };
}


// ================= MODULE: DB SECURITY LAYER =================
const __SQLI = ["' OR", "--", "UNION SELECT", "DROP TABLE", "DROP"];


function __hasSQLIValue(value) {
    const str = String(value).toUpperCase();
    return __SQLI.some(p => str.includes(p.toUpperCase()));
}


function __moduleDB(dbConfig) {

    const tables = {};
    for (const [name, records] of Object.entries(dbConfig.tables)) {
        tables[name] = __gDeepCopy(records);
    }

    const indexMap = {};
    for (const index of dbConfig.indexes) {
        indexMap[index.table + "." + index.field] = index;
    }

    let committed = 0;
    let rolledBack = 0;

    for (const txn of dbConfig.transactions) {
        if (txn.shouldRollback) {
            rolledBack++;
        } else {
            committed++;
            const working = __gDeepCopy(tables);
            for (const op of txn.operations) {
                if (op.type === "WRITE") {
                    const records = working[op.table];
                    const existing = records.find(r => r.id === op.data.id);
                    if (existing) Object.assign(existing, op.data);
                    else records.push(__gDeepCopy(op.data));
                } else if (op.type === "DELETE") {
                    const records = working[op.table];
                    const idx = records.findIndex(r => r.id === op.id);
                    if (idx !== -1) records.splice(idx, 1);
                }
            }
            for (const [name, records] of Object.entries(working)) tables[name] = records;
        }
    }

    let indexScans = 0;
    let fullScans = 0;
    let blocked = 0;

    for (const query of dbConfig.queries) {
        const hasIndex = indexMap[query.table + "." + query.filter.field] != null;
        if (hasIndex) indexScans++;
        else fullScans++;

        if (query.sanitize === true && __hasSQLIValue(query.filter.value)) {
            blocked++;
        }
    }

    return {
        summary: {
            transactionSummary: { committed, rolledBack },
            querySummary: { total: dbConfig.queries.length, indexScans, fullScans, blocked }
        }
    };
}


// ================= MODULE: FULL STACK PIPELINE =================
function __modulePipeline(pipelineBlueprint) {

    const entityStore = [];
    let autoIndex = 0;
    const rateLimitCounts = {};
    const requestLog = [];

    for (const req of pipelineBlueprint.requests) {

        let blockedAt = null;

        for (const mw of pipelineBlueprint.middlewares) {
            if (blockedAt) break;

            if (mw.type === "RATE_LIMIT") {
                const clientId = req.requestId.slice(0, 2);
                if (!rateLimitCounts[clientId]) rateLimitCounts[clientId] = 0;
                rateLimitCounts[clientId]++;
                if (rateLimitCounts[clientId] > mw.config.maxRequests) blockedAt = mw.name;
            } else if (mw.type === "AUTH") {
                const header = req.headers && req.headers["Authorization"];
                const token = typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7) : null;
                if (!(mw.config.validTokens || []).includes(token)) blockedAt = mw.name;
            } else if (mw.type === "VALIDATION") {
                for (const [field, rule] of Object.entries(pipelineBlueprint.modelConfig.schema)) {
                    const value = req.body == null ? undefined : req.body[field];
                    if (rule.required === true && (value === undefined || value === null)) {
                        blockedAt = mw.name;
                        break;
                    }
                    if (value !== undefined && value !== null && rule.type === "number" && typeof value !== "number") {
                        blockedAt = mw.name;
                        break;
                    }
                }
            }
        }

        let modelResult = null;

        if (!blockedAt && req.operation) {
            const op = req.operation;
            if (op.type === "CREATE") {
                autoIndex++;
                const id = pipelineBlueprint.modelConfig.entityName + "_" + autoIndex;
                const record = { id, ...(op.data || {}) };
                entityStore.push(record);
                modelResult = { success: true, result: { ...record } };
            } else if (op.type === "READ") {
                const record = entityStore.find(r => r.id === op.id) || null;
                modelResult = { success: record !== null, result: record ? { ...record } : null };
            } else if (op.type === "UPDATE") {
                const record = entityStore.find(r => r.id === op.id);
                if (record) { Object.assign(record, op.data || {}); modelResult = { success: true, result: { ...record } }; }
                else modelResult = { success: false, result: null };
            } else if (op.type === "DELETE") {
                const idx = entityStore.findIndex(r => r.id === op.id);
                if (idx !== -1) { const record = entityStore[idx]; entityStore.splice(idx, 1); modelResult = { success: true, result: { ...record } }; }
                else modelResult = { success: false, result: null };
            }
        }

        requestLog.push({ requestId: req.requestId, passed: blockedAt === null, blockedAt, modelResult });
    }

    const passedCount = requestLog.filter(r => r.passed).length;

    return { summary: { totalRequests: requestLog.length, passedCount, blockedCount: requestLog.length - passedCount } };
}



// ================= MODULE: SECURITY AUDIT =================
function __moduleAudit(auditConfig) {

    let score = 100;

    for (const event of auditConfig.events) {
        if (event.severity === "CRITICAL") score -= 15;
        if (event.eventType === "AUTH_FAILURE") score -= 10;
        if (event.eventType === "THREAT_DETECTED") score -= 20;
        if (event.eventType === "ACCESS_DENIED") score -= 5;
        if (event.eventType === "AUTH_SUCCESS") score += 5;
    }

    if (score < 0) score = 0;
    if (score > 100) score = 100;

    return { securityScore: score };
}


// ================= MODULE: ASYNC SECURITY ENGINE =================
const __gDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function __moduleAsyncEngine(asyncTasks) {

    const taskLog = [];

    for (const task of asyncTasks) {

        let result = null;
        let status = "EXHAUSTED";
        let attempts = 0;

        for (let i = 1; i <= task.maxRetries; i++) {
            attempts++;
            const shouldFail = task.shouldFail === true && i <= 2;
            await __gDelay(1);
            if (shouldFail) continue;

            if (task.type === "HASH_PASSWORD") {
                const p = String(task.input);
                result = { hash: "hash_" + __gReverse(p) + "_" + p.length };
            } else if (task.type === "VERIFY_TOKEN") {
                result = { valid: String(task.input).startsWith("jwt_") };
            } else if (task.type === "CHECK_BREACH") {
                const breached = ["password", "123456", "qwerty"].map(p => p.toLowerCase()).includes(String(task.input).toLowerCase());
                result = { breached, riskLevel: breached ? "CRITICAL" : "SAFE" };
            } else if (task.type === "SCAN_INPUT") {
                const v = String(task.input);
                result = { threatDetected: v.includes("<script>") || v.includes("' OR") || v.includes("../") };
            } else if (task.type === "VALIDATE_API_KEY") {
                const v = String(task.input);
                result = { valid: v.startsWith("key-") && v.length >= 10 };
            }

            status = "COMPLETED";
            break;
        }

        taskLog.push({ taskId: task.taskId, type: task.type, status, result, attempts });
    }

    const completedCount = taskLog.filter(t => t.status === "COMPLETED").length;

    return { summary: { totalTasks: taskLog.length, completedCount, exhaustedCount: taskLog.length - completedCount } };
}


// ================= GRAND ORCHESTRATOR =================
async function runPhase5GrandOrchestrator(systemBlueprint) {

    // --- STEP 1: VALIDATE ---

    if (
        typeof systemBlueprint !== "object" ||
        systemBlueprint === null ||
        Array.isArray(systemBlueprint) ||
        typeof systemBlueprint.systemId !== "string" ||
        systemBlueprint.systemId.length === 0 ||
        typeof systemBlueprint.authConfig !== "object" ||
        typeof systemBlueprint.gatewayConfig !== "object" ||
        typeof systemBlueprint.accessControlConfig !== "object" ||
        typeof systemBlueprint.inputSecurityConfig !== "object" ||
        typeof systemBlueprint.tokenVaultConfig !== "object" ||
        typeof systemBlueprint.auditConfig !== "object" ||
        typeof systemBlueprint.dbConfig !== "object" ||
        typeof systemBlueprint.pipelineConfig !== "object" ||
        !Array.isArray(systemBlueprint.asyncTasks)
    ) {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: RUN ALL MODULES (in specified order) ---

    const auth = __moduleAuth(systemBlueprint.authConfig);
    const tokenVault = __moduleTokenVault(systemBlueprint.tokenVaultConfig);
    const gateway = __moduleGateway(systemBlueprint.gatewayConfig);
    const accessControl = __moduleAccessControl(systemBlueprint.accessControlConfig);
    const inputSecurity = __moduleInputSecurity(systemBlueprint.inputSecurityConfig);
    const db = __moduleDB(systemBlueprint.dbConfig);
    const pipeline = __modulePipeline(systemBlueprint.pipelineConfig);
    const asyncEngine = await __moduleAsyncEngine(systemBlueprint.asyncTasks);
    const audit = __moduleAudit(systemBlueprint.auditConfig);

    // --- STEP 3: BUILD GRAND REPORT ---

    const securityScore = audit.securityScore;

    const moduleResults = {
        auth: { summary: auth.summary },
        tokenVault: { summary: tokenVault.summary },
        gateway: { summary: gateway.summary },
        accessControl: { summary: accessControl.summary },
        inputSecurity: { overallSummary: inputSecurity.overallSummary },
        db: { summary: db.summary },
        pipeline: { summary: pipeline.summary },
        asyncEngine: { summary: asyncEngine.summary },
        audit: { securityScore }
    };

    const grandSummary = {
        totalAuthEvents: auth.summary.totalEvents,
        totalGatewayRequests: gateway.summary.totalRequests,
        totalAccessRequests: accessControl.summary.totalRequests,
        totalInputsScanned: inputSecurity.overallSummary.totalInputs,
        totalTransactions: db.summary.transactionSummary.committed + db.summary.transactionSummary.rolledBack,
        totalPipelineRequests: pipeline.summary.totalRequests,
        totalAsyncTasks: asyncEngine.summary.totalTasks,
        securityScore
    };

    let systemHealthStatus;
    if (securityScore >= 80) systemHealthStatus = "HEALTHY";
    else if (securityScore >= 50) systemHealthStatus = "DEGRADED";
    else systemHealthStatus = "CRITICAL";

    return {
        systemId: systemBlueprint.systemId,
        moduleResults,
        grandSummary,
        systemHealthStatus,
        phase5Complete: true
    };
}



// ------ EXAMPLE USAGE ------
runPhase5GrandOrchestrator({
    systemId: "PHASE5-FINAL-01",
    authConfig: {
        users: [],
        jwtSecret: "grand-secret",
        jwtExpiryMs: 3600000,
        passwordPolicy: { minLength: 8, requireUppercase: true, requireNumbers: true, requireSpecialChars: false },
        authEvents: [
            { eventId: "AE1", type: "REGISTER", userId: "U1", password: "Secure123", token: null },
            { eventId: "AE2", type: "LOGIN", userId: "U1", password: "Secure123", token: null }
        ]
    },
    gatewayConfig: {
        validAPIKeys: ["key-grand-2025"],
        allowedOrigins: ["https://phase5app.com"],
        rateLimitConfig: { maxRequests: 10, windowMs: 60000 },
        routes: [{ method: "GET", path: "/api/health", requiresAuth: false }],
        requests: [{ requestId: "GR1", method: "GET", path: "/api/health", origin: "https://phase5app.com", apiKey: null, clientId: "C1", timestampMs: 1000 }]
    },
    accessControlConfig: {
        roles: [{ name: "USER", permissions: ["health:read"], inherits: [] }],
        policies: [{ policyId: "P1", effect: "ALLOW", roles: ["USER"], resources: ["health"], actions: ["read"] }],
        accessRequests: [{ requestId: "AC1", userId: "U1", userRole: "USER", resource: "health", action: "read" }]
    },
    inputSecurityConfig: {
        mode: "ESCAPE",
        enabledDetectors: ["XSS", "SQLI"],
        inputs: [{ inputId: "II1", data: { search: "hello world" } }]
    },
    tokenVaultConfig: {
        encryptionKey: "grand-vault-key",
        refreshTokenTTLMs: 86400000,
        sessionTTLMs: 1800000,
        maxSessionsPerUser: 3,
        rotateOnRefresh: true,
        events: [{ eventId: "TV1", type: "ISSUE", userId: "U1", tokenRef: null, currentTimeMs: 1000000 }]
    },
    auditConfig: {
        events: [
            { eventId: "AU1", eventType: "AUTH_SUCCESS", userId: "U1", resource: null, severity: "INFO", timestamp: 1000000, details: {} },
            { eventId: "AU2", eventType: "AUTH_SUCCESS", userId: "U1", resource: null, severity: "INFO", timestamp: 1001000, details: {} }
        ],
        alertThresholds: { authFailuresPerMinute: 5, threatsPerMinute: 3, rateLimitedPerMinute: 10 },
        breachedPasswords: ["password", "123456"],
        passwordsToCheck: ["Secure123"]
    },
    dbConfig: {
        tables: { products: [{ id: "P1", name: "JS Book", price: 500 }] },
        indexes: [{ table: "products", field: "id", type: "HASH" }],
        transactions: [{ txnId: "DT1", isolationLevel: "READ_COMMITTED", operations: [{ type: "READ", table: "products", id: "P1", data: null }], shouldRollback: false }],
        queries: [{ queryId: "DQ1", table: "products", filter: { field: "id", operator: "=", value: "P1" }, sanitize: true }]
    },
    pipelineConfig: {
        modelConfig: { entityName: "Order", schema: { product: { type: "string", required: true, default: null }, qty: { type: "number", required: true, default: null } } },
        middlewares: [{ name: "logger", type: "LOGGER", config: {} }],
        requests: [{ requestId: "PR1", method: "POST", path: "/orders", headers: {}, body: { product: "JS Book", qty: 2 }, operation: { type: "CREATE", id: null, data: { product: "JS Book", qty: 2 } } }]
    },
    asyncTasks: [
        { taskId: "AT1", type: "HASH_PASSWORD", input: "Secure123", maxRetries: 3, shouldFail: false },
        { taskId: "AT2", type: "CHECK_BREACH", input: "Secure123", maxRetries: 3, shouldFail: false }
    ]
}).then(result => console.log(JSON.stringify(result, null, 2)));


// --- INVALID (rejected promise) ---
runPhase5GrandOrchestrator(null).catch(err => console.log(err));