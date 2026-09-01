// 🧩 PROBLEM–05: runRefreshTokenOrchestrator()

// Logic: Full refresh-token lifecycle orchestrator.
//   1. Setup inline token store (P1), rotation engine (P2), family manager (P3), session manager (P4)
//   2. Process authEvents in order (LOGIN / REFRESH / LOGOUT / REUSE_ATTACK)
//   3. Build summary counts


function runRefreshTokenOrchestrator(orchestratorConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof orchestratorConfig !== "object" ||
        orchestratorConfig === null ||
        Array.isArray(orchestratorConfig) ||
        typeof orchestratorConfig.orchestratorId !== "string" ||
        orchestratorConfig.orchestratorId.length === 0 ||
        typeof orchestratorConfig.tokenConfig !== "object" || orchestratorConfig.tokenConfig === null ||
        typeof orchestratorConfig.sessionConfig !== "object" || orchestratorConfig.sessionConfig === null ||
        typeof orchestratorConfig.familyConfig !== "object" || orchestratorConfig.familyConfig === null ||
        !Array.isArray(orchestratorConfig.authEvents)
    ) {
        return "Invalid Input";
    }

    const orchestratorId = orchestratorConfig.orchestratorId;

    const tc = orchestratorConfig.tokenConfig;
    const sc = orchestratorConfig.sessionConfig;
    const fc = orchestratorConfig.familyConfig;

    if (
        typeof tc.accessTokenTTLMs !== "number" || tc.accessTokenTTLMs <= 0 ||
        typeof tc.refreshTokenTTLMs !== "number" || tc.refreshTokenTTLMs <= 0 ||
        typeof tc.maxTokensPerUser !== "number" || tc.maxTokensPerUser < 1 ||
        typeof tc.rotateOnUse !== "boolean" ||
        typeof sc.sessionTTLMs !== "number" || sc.sessionTTLMs <= 0 ||
        typeof sc.maxSessionsPerUser !== "number" || sc.maxSessionsPerUser < 1 ||
        typeof sc.absoluteTimeoutMs !== "number" || sc.absoluteTimeoutMs <= 0 ||
        typeof sc.slidingWindowMs !== "number" || sc.slidingWindowMs <= 0 ||
        typeof fc.reuseDetectionEnabled !== "boolean" ||
        !["REVOKE_FAMILY", "ALERT_ONLY"].includes(fc.familyCompromiseAction)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: SETUP inline components (self-contained) ---

    const tokenRecords = [];
    let tokenAutoIndex = 0;

    function issueRefreshToken(userId) {
        tokenAutoIndex++;
        const rec = {
            refreshToken: "RT-" + tokenAutoIndex + "-" + userId,
            accessToken: "AT-" + tokenAutoIndex + "-" + userId,
            userId,
            status: "ACTIVE",
            accessTokenExpiresAt: 1000000 + tc.accessTokenTTLMs,
            refreshTokenExpiresAt: 1000000 + tc.refreshTokenTTLMs
        };
        tokenRecords.push(rec);
        return rec;
    }

    function findTokenRecord(refreshToken) {
        return tokenRecords.find(r => r.refreshToken === refreshToken);
    }

    function rotationEngineRefresh(refreshToken) {

        const rec = findTokenRecord(refreshToken);

        if (!rec) return { error: "TOKEN_NOT_FOUND" };
        if (rec.status === "REPLACED") return { error: "TOKEN_REPLACED" };
        if (rec.status === "REVOKED") return { error: "TOKEN_REVOKED" };

        if (tc.rotateOnUse) {

            rec.status = "REPLACED";

            const newRec = issueRefreshToken(rec.userId);

            return {
                newTokenPair: {
                    accessToken: newRec.accessToken,
                    refreshToken: newRec.refreshToken,
                    accessTokenExpiresAt: newRec.accessTokenExpiresAt,
                    refreshTokenExpiresAt: newRec.refreshTokenExpiresAt
                },
                oldRefreshToken: refreshToken,
                rotated: true,
                newRefreshToken: newRec.refreshToken
            };
        }

        return {
            newAccessToken: rec.accessToken,
            refreshToken,
            rotated: false
        };
    }

    function rotationEngineLogout(refreshToken) {
        const rec = findTokenRecord(refreshToken);
        if (!rec) return { error: "TOKEN_NOT_FOUND" };
        rec.status = "REVOKED";
        return { loggedOut: true, userId: rec.userId };
    }

    // Session manager inline.

    const sessions = [];
    let sessionAutoIndex = 0;

    function createSession(userId, metadata) {
        const actives = sessions.filter(s => s.userId === userId && s.status === "ACTIVE");
        while (actives.length >= sc.maxSessionsPerUser) {
            actives[0].status = "DESTROYED";
            actives.shift();
        }
        sessionAutoIndex++;
        const session = {
            sessionId: "SES-" + sessionAutoIndex + "-" + userId,
            userId,
            metadata: metadata && typeof metadata === "object" ? metadata : {},
            createdAt: 1000000,
            lastActivityAt: 1000000,
            expiresAt: 1000000 + sc.sessionTTLMs,
            absoluteExpiresAt: 1000000 + sc.absoluteTimeoutMs,
            status: "ACTIVE"
        };
        sessions.push(session);
        return session;
    }

    function touchSession(sessionId, currentTimeMs) {
        const session = sessions.find(s => s.sessionId === sessionId);
        if (!session || session.status !== "ACTIVE") return { error: "Session not found/expired" };
        const extendedTo = currentTimeMs + sc.slidingWindowMs;
        const newExpiresAt = Math.min(extendedTo, session.absoluteExpiresAt);
        const extended = newExpiresAt > session.expiresAt;
        session.expiresAt = newExpiresAt;
        session.lastActivityAt = currentTimeMs;
        return { sessionId, newExpiresAt, extended };
    }

    function destroySession(sessionId) {
        const session = sessions.find(s => s.sessionId === sessionId);
        if (!session) return { error: "Session not found" };
        session.status = "DESTROYED";
        return { destroyed: true, sessionId };
    }

    // Family manager inline.

    const families = [];
    let familyAutoIndex = 0;

    function createFamily(userId) {
        familyAutoIndex++;
        const family = {
            familyId: "FAM-" + familyAutoIndex + "-" + userId,
            userId,
            tokens: [],
            status: "ACTIVE",
            createdAt: 1000000
        };
        families.push(family);
        return family;
    }

    function familyAdd(familyId, token) {
        const family = families.find(f => f.familyId === familyId);
        if (!family) return { error: "Family not found" };
        if (family.status === "COMPROMISED" || family.status === "TERMINATED") {
            return { error: "Family is " + family.status };
        }
        family.tokens.push({ token, status: "ACTIVE", addedAt: 1000000 });
        return { added: true, familyId, token, familySize: family.tokens.length };
    }

    function familyUse(familyId, token) {
        const family = families.find(f => f.familyId === familyId);
        if (!family) return { error: "Family not found" };
        const member = family.tokens.find(t => t.token === token);
        if (!member) return { error: "Token not in family" };
        if (member.status === "ACTIVE") {
            member.status = "USED";
            return { used: true, token, familyId };
        }
        if (fc.reuseDetectionEnabled) {
            if (fc.familyCompromiseAction === "REVOKE_FAMILY") {
                for (const t of family.tokens) t.status = "REVOKED";
                family.status = "COMPROMISED";
            }
            return { used: false, reuseDetected: true, action: fc.familyCompromiseAction, familyId };
        }
        return { used: false, reuseDetected: false, familyId };
    }

    function familyMarkReplaced(familyId, token) {
        const family = families.find(f => f.familyId === familyId);
        if (!family) return;
        const member = family.tokens.find(t => t.token === token);
        if (member && member.status === "ACTIVE") {
            member.status = "REPLACED";
        }
    }

    // --- STEP 3: PROCESS AUTH EVENTS ---

    const eventLog = [];

    // Track per-event refresh tokens and session/family ids.

    const eventRefreshToken = {};
    const eventSessionId = {};
    const eventFamilyId = {};

    for (const ev of orchestratorConfig.authEvents) {

        const { eventId, type, userId, currentTimeMs, metadata, tokenRef } = ev;

        let result;

        if (type === "LOGIN") {

            const rec = issueRefreshToken(userId);

            const session = createSession(userId, metadata);

            const family = createFamily(userId);

            familyAdd(family.familyId, rec.refreshToken);

            eventRefreshToken[eventId] = rec.refreshToken;
            eventSessionId[eventId] = session.sessionId;
            eventFamilyId[eventId] = family.familyId;

            result = {
                tokenPair: {
                    accessToken: rec.accessToken,
                    refreshToken: rec.refreshToken,
                    accessTokenExpiresAt: rec.accessTokenExpiresAt,
                    refreshTokenExpiresAt: rec.refreshTokenExpiresAt
                },
                sessionId: session.sessionId,
                familyId: family.familyId
            };

        } else if (type === "REFRESH") {

            const sourceRefreshToken = eventRefreshToken[tokenRef];

            const refreshResult = sourceRefreshToken ? rotationEngineRefresh(sourceRefreshToken) : { error: "TOKEN_NOT_FOUND" };

            if (refreshResult.error) {

                result = refreshResult;

            } else {

                const sessionId = eventSessionId[tokenRef];
                const familyId = eventFamilyId[tokenRef];

                const touchResult = sessionId ? touchSession(sessionId, currentTimeMs) : { error: "Session not found/expired" };

                if (refreshResult.rotated && familyId) {
                    familyAdd(familyId, refreshResult.newRefreshToken);
                    familyMarkReplaced(familyId, sourceRefreshToken);
                }

                eventRefreshToken[eventId] = refreshResult.rotated ? refreshResult.newRefreshToken : refreshResult.refreshToken;
                eventSessionId[eventId] = sessionId;
                eventFamilyId[eventId] = familyId;

                result = {
                    newTokenPair: refreshResult.newTokenPair,
                    oldRefreshToken: refreshResult.oldRefreshToken,
                    rotated: true,
                    sessionExtended: touchResult.extended === true
                };
            }

        } else if (type === "REUSE_ATTACK") {

            const sourceRefreshToken = eventRefreshToken[tokenRef];
            const familyId = eventFamilyId[tokenRef];

            result = (sourceRefreshToken && familyId)
                ? familyUse(familyId, sourceRefreshToken)
                : { error: "Family not found" };

        } else if (type === "LOGOUT") {

            const sourceRefreshToken = eventRefreshToken[tokenRef];

            const logoutResult = sourceRefreshToken ? rotationEngineLogout(sourceRefreshToken) : { error: "TOKEN_NOT_FOUND" };

            const sessionId = eventSessionId[tokenRef];

            const sessionResult = sessionId ? destroySession(sessionId) : null;

            result = {
                loggedOut: logoutResult.loggedOut === true,
                userId,
                sessionDestroyed: sessionResult ? sessionResult.destroyed === true : false
            };

        } else {
            result = { error: "UNKNOWN_EVENT_TYPE" };
        }

        eventLog.push({ eventId, type, userId, result });
    }

    // --- STEP 4: BUILD SUMMARY ---

    const totalEvents = eventLog.length;
    const loginCount = eventLog.filter(e => e.type === "LOGIN").length;
    const refreshCount = eventLog.filter(e => e.type === "REFRESH").length;
    const logoutCount = eventLog.filter(e => e.type === "LOGOUT").length;
    const reuseAttackCount = eventLog.filter(e => e.type === "REUSE_ATTACK").length;
    const compromisedFamilies = families.filter(f => f.status === "COMPROMISED").length;
    const activeSessions = sessions.filter(s => s.status === "ACTIVE").length;
    const activeRefreshTokens = tokenRecords.filter(r => r.status === "ACTIVE").length;

    return {
        orchestratorId,
        eventLog,
        summary: {
            totalEvents,
            loginCount,
            refreshCount,
            logoutCount,
            reuseAttackCount,
            compromisedFamilies,
            activeSessions,
            activeRefreshTokens
        }
    };
}



// ------ EXAMPLE USAGE ------

console.log(JSON.stringify(runRefreshTokenOrchestrator({
    orchestratorId: "RT-ORCH-01",
    tokenConfig: { accessTokenTTLMs: 900000, refreshTokenTTLMs: 86400000, maxTokensPerUser: 3, rotateOnUse: true },
    sessionConfig: { sessionTTLMs: 1800000, maxSessionsPerUser: 3, absoluteTimeoutMs: 86400000, slidingWindowMs: 1800000 },
    familyConfig: { reuseDetectionEnabled: true, familyCompromiseAction: "REVOKE_FAMILY" },
    authEvents: [
        { eventId: "EV-1", type: "LOGIN", userId: "U1", currentTimeMs: 1000000, metadata: { device: "chrome" }, tokenRef: null },
        { eventId: "EV-2", type: "REFRESH", userId: "U1", currentTimeMs: 1500000, metadata: null, tokenRef: "EV-1" },
        { eventId: "EV-3", type: "REUSE_ATTACK", userId: "U1", currentTimeMs: 1600000, metadata: null, tokenRef: "EV-1" },
        { eventId: "EV-4", type: "LOGOUT", userId: "U1", currentTimeMs: 1700000, metadata: null, tokenRef: "EV-2" }
    ]
}), null, 2));


// --- INVALID ---
console.log(runRefreshTokenOrchestrator({ orchestratorId: "", tokenConfig: null, sessionConfig: null, familyConfig: null, authEvents: [] }));