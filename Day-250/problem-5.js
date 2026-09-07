// 🧩 PROBLEM–05: buildTokenVault()

//  Logic: Refresh token vault + session manager. Tokens stored encrypted.
//  ISSUE / VALIDATE / REFRESH / REVOKE / CREATE_SESSION / DESTROY_SESSION.

const __vaultReverse = (s) => s.split("").reverse().join("");

function __encryptToken(value, encryptionKey) {
    return "ENC:" + __vaultReverse(value + encryptionKey);
}

function buildTokenVault(vaultBlueprint) {

    // --- STEP 1: VALIDATE ---

    if (
        typeof vaultBlueprint !== "object" ||
        vaultBlueprint === null ||
        Array.isArray(vaultBlueprint) ||
        typeof vaultBlueprint.encryptionKey !== "string" ||
        vaultBlueprint.encryptionKey.length === 0 ||
        typeof vaultBlueprint.refreshTokenTTLMs !== "number" ||
        vaultBlueprint.refreshTokenTTLMs <= 0 ||
        typeof vaultBlueprint.sessionTTLMs !== "number" ||
        vaultBlueprint.sessionTTLMs <= 0 ||
        typeof vaultBlueprint.maxSessionsPerUser !== "number" ||
        !Number.isInteger(vaultBlueprint.maxSessionsPerUser) ||
        vaultBlueprint.maxSessionsPerUser < 1 ||
        !Array.isArray(vaultBlueprint.events)
    ) {
        return "Invalid Input";
    }

    const encryptionKey = vaultBlueprint.encryptionKey;
    const refreshTokenTTLMs = vaultBlueprint.refreshTokenTTLMs;
    const sessionTTLMs = vaultBlueprint.sessionTTLMs;
    const maxSessionsPerUser = vaultBlueprint.maxSessionsPerUser;
    const rotateOnRefresh = vaultBlueprint.rotateOnRefresh === true;

    // --- STEP 2: INTERNAL STATE ---

    const tokens = [];   // { eventId, userId, value, encrypted, expiresAt, status }
    const sessions = []; // { eventId, userId, sessionId, expiresAt, status }

    let refreshIndex = 0;
    let sessionIndex = 0;

    function findTokenByEvent(eventId) {
        return tokens.find(t => t.eventId === eventId);
    }

    function findSessionByEvent(eventId) {
        return sessions.find(s => s.eventId === eventId);
    }

    function issueRefreshToken(userId, currentTimeMs) {
        refreshIndex++;
        const value = "RT-" + refreshIndex + "-" + userId;
        const entry = {
            eventId: null,
            userId,
            value,
            encrypted: __encryptToken(value, encryptionKey),
            expiresAt: currentTimeMs + refreshTokenTTLMs,
            status: "ACTIVE"
        };
        return entry;
    }

    function validateToken(entry, currentTimeMs) {
        if (!entry) return { valid: false, reason: "NOT_FOUND" };
        if (entry.status === "REVOKED") return { valid: false, reason: "REVOKED" };
        if (entry.status === "REPLACED") return { valid: false, reason: "REPLACED" };
        if (currentTimeMs > entry.expiresAt) return { valid: false, reason: "EXPIRED" };
        return { valid: true, reason: null };
    }

    // --- STEP 3: PROCESS EVENTS ---

    const eventLog = [];

    for (const event of vaultBlueprint.events) {

        let result;

        switch (event.type) {

            case "ISSUE": {
                const entry = issueRefreshToken(event.userId, event.currentTimeMs);
                entry.eventId = event.eventId;
                tokens.push(entry);
                result = { token: entry.value, expiresAt: entry.expiresAt };
                break;
            }

            case "VALIDATE": {
                const entry = findTokenByEvent(event.tokenRef);
                const validation = validateToken(entry, event.currentTimeMs);
                result = { valid: validation.valid, reason: validation.valid ? null : validation.reason };
                break;
            }

            case "REFRESH": {
                const entry = findTokenByEvent(event.tokenRef);
                const validation = validateToken(entry, event.currentTimeMs);

                if (!validation.valid) {
                    result = { refreshed: false, reason: validation.reason };
                    break;
                }

                if (rotateOnRefresh) {
                    entry.status = "REPLACED";
                    const fresh = issueRefreshToken(event.userId, event.currentTimeMs);
                    fresh.eventId = event.eventId;
                    tokens.push(fresh);
                    result = { refreshed: true, newToken: fresh.value };
                } else {
                    result = { refreshed: true, newToken: null };
                }
                break;
            }

            case "REVOKE": {
                const entry = findTokenByEvent(event.tokenRef);
                if (entry) {
                    entry.status = "REVOKED";
                    result = { revoked: true, tokenRef: event.tokenRef };
                } else {
                    result = { error: "Token not found" };
                }
                break;
            }

            case "CREATE_SESSION": {
                sessionIndex++;
                const sessionId = "SES-" + sessionIndex + "-" + event.userId;

                const userSessions = sessions.filter(s => s.userId === event.userId && s.status === "ACTIVE");

                if (userSessions.length >= maxSessionsPerUser) {
                    const oldest = userSessions.sort((a, b) => a.expiresAt - b.expiresAt)[0];
                    oldest.status = "REVOKED";
                }

                sessions.push({
                    eventId: event.eventId,
                    userId: event.userId,
                    sessionId,
                    expiresAt: event.currentTimeMs + sessionTTLMs,
                    status: "ACTIVE"
                });

                result = { sessionId, expiresAt: event.currentTimeMs + sessionTTLMs };
                break;
            }

            case "DESTROY_SESSION": {
                const session = findSessionByEvent(event.tokenRef);
                if (session) {
                    session.status = "DESTROYED";
                    result = { destroyed: true, sessionId: session.sessionId };
                } else {
                    result = { error: "Session not found" };
                }
                break;
            }

            default:
                continue;
        }

        eventLog.push({ eventId: event.eventId, type: event.type, userId: event.userId, result });
    }

    // --- STEP 4: SUMMARY ---

    const activeTokens = tokens.filter(t => t.status === "ACTIVE").length;
    const activeSessions = sessions.filter(s => s.status === "ACTIVE").length;
    const revokedCount = tokens.filter(t => t.status === "REVOKED").length;

    return {
        eventLog,
        summary: {
            totalEvents: eventLog.length,
            activeTokens,
            activeSessions,
            revokedCount
        }
    };
}


// ------ EXAMPLE USAGE ------

console.log(JSON.stringify(buildTokenVault({
    encryptionKey: "vault-key",
    refreshTokenTTLMs: 86400000,
    sessionTTLMs: 1800000,
    maxSessionsPerUser: 2,
    rotateOnRefresh: true,
    events: [
        { eventId: "EV1", type: "ISSUE", userId: "U1", tokenRef: null, currentTimeMs: 1000000 },
        { eventId: "EV2", type: "VALIDATE", userId: "U1", tokenRef: "EV1", currentTimeMs: 1001000 },
        { eventId: "EV3", type: "REFRESH", userId: "U1", tokenRef: "EV1", currentTimeMs: 1002000 },
        { eventId: "EV4", type: "REVOKE", userId: "U1", tokenRef: "EV3", currentTimeMs: 1003000 }
    ]
}), null, 2));


// --- INVALID ---
console.log(buildTokenVault(null));