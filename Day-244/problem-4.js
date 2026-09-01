// 🧩 PROBLEM–04: createSessionManager()

// Logic: Session lifecycle with sliding window + absolute timeout.
//   createSession — destroy oldest if at maxSessionsPerUser
//   touchSession — extend expiresAt = now + slidingWindowMs, capped at absoluteExpiresAt
//   validateSession — status + sliding expiry + absolute expiry
//   destroy / stats


function createSessionManager(sessionConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof sessionConfig !== "object" ||
        sessionConfig === null ||
        Array.isArray(sessionConfig) ||
        typeof sessionConfig.sessionTTLMs !== "number" ||
        sessionConfig.sessionTTLMs <= 0 ||
        typeof sessionConfig.maxSessionsPerUser !== "number" ||
        !Number.isInteger(sessionConfig.maxSessionsPerUser) ||
        sessionConfig.maxSessionsPerUser < 1 ||
        typeof sessionConfig.absoluteTimeoutMs !== "number" ||
        sessionConfig.absoluteTimeoutMs <= 0 ||
        typeof sessionConfig.slidingWindowMs !== "number" ||
        sessionConfig.slidingWindowMs <= 0
    ) {
        return "Invalid Input";
    }

    const sessionTTLMs = sessionConfig.sessionTTLMs;
    const maxSessionsPerUser = sessionConfig.maxSessionsPerUser;
    const absoluteTimeoutMs = sessionConfig.absoluteTimeoutMs;
    const slidingWindowMs = sessionConfig.slidingWindowMs;

    const sessions = [];

    let autoIndex = 0;

    // --- STEP 2: HELPERS ---

    function findSession(sessionId) {
        return sessions.find(s => s.sessionId === sessionId);
    }

    // --- STEP 3: PUBLIC API ---

    return {

        createSession(userId, metadata) {

            if (typeof userId !== "string" || userId.length === 0) return "Invalid Input";

            const actives = sessions.filter(s => s.userId === userId && s.status === "ACTIVE");

            while (actives.length >= maxSessionsPerUser) {
                const oldest = actives[0];
                oldest.status = "DESTROYED";
                actives.shift();
            }

            autoIndex++;

            const session = {
                sessionId: "SES-" + autoIndex + "-" + userId,
                userId,
                metadata: metadata && typeof metadata === "object" ? metadata : {},
                createdAt: 1000000,
                lastActivityAt: 1000000,
                expiresAt: 1000000 + sessionTTLMs,
                absoluteExpiresAt: 1000000 + absoluteTimeoutMs,
                status: "ACTIVE"
            };

            sessions.push(session);

            return {
                sessionId: session.sessionId,
                userId,
                expiresAt: session.expiresAt,
                absoluteExpiresAt: session.absoluteExpiresAt,
                metadata: session.metadata
            };
        },

        touchSession(sessionId, currentTimeMs) {

            if (typeof sessionId !== "string" || sessionId.length === 0) return "Invalid Input";

            const session = findSession(sessionId);

            if (!session || session.status !== "ACTIVE") {
                return { error: "Session not found/expired" };
            }

            const extendedTo = currentTimeMs + slidingWindowMs;

            const newExpiresAt = Math.min(extendedTo, session.absoluteExpiresAt);

            const extended = newExpiresAt > session.expiresAt;

            session.expiresAt = newExpiresAt;
            session.lastActivityAt = currentTimeMs;

            return { sessionId, newExpiresAt, extended };
        },

        validateSession(sessionId, currentTimeMs) {

            if (typeof sessionId !== "string" || sessionId.length === 0) return "Invalid Input";

            const session = findSession(sessionId);

            if (!session) {
                return { valid: false, sessionId, userId: null, reason: "NOT_FOUND" };
            }

            if (session.status === "DESTROYED") {
                return { valid: false, sessionId, userId: session.userId, reason: "DESTROYED" };
            }

            if (currentTimeMs > session.absoluteExpiresAt) {
                session.status = "EXPIRED";
                return { valid: false, sessionId, userId: session.userId, reason: "ABSOLUTE_TIMEOUT" };
            }

            if (currentTimeMs > session.expiresAt) {
                session.status = "EXPIRED";
                return { valid: false, sessionId, userId: session.userId, reason: "EXPIRED" };
            }

            return { valid: true, sessionId, userId: session.userId, reason: null };
        },

        destroySession(sessionId) {

            if (typeof sessionId !== "string" || sessionId.length === 0) return "Invalid Input";

            const session = findSession(sessionId);

            if (!session) return { error: "Session not found" };

            session.status = "DESTROYED";

            return { destroyed: true, sessionId };
        },

        destroyAllSessions(userId) {

            if (typeof userId !== "string" || userId.length === 0) return "Invalid Input";

            let destroyedCount = 0;

            for (const s of sessions) {
                if (s.userId === userId && s.status === "ACTIVE") {
                    s.status = "DESTROYED";
                    destroyedCount++;
                }
            }

            return { destroyedCount, userId };
        },

        getActiveSessions(userId) {

            if (typeof userId !== "string" || userId.length === 0) return "Invalid Input";

            const active = sessions.filter(s => s.userId === userId && s.status === "ACTIVE");

            return { userId, sessions: active.map(s => ({ ...s })), count: active.length };
        },

        getSessionStats() {

            const totalCreated = sessions.length;
            const active = sessions.filter(s => s.status === "ACTIVE").length;
            const expired = sessions.filter(s => s.status === "EXPIRED").length;
            const destroyed = sessions.filter(s => s.status === "DESTROYED").length;
            const uniqueUsers = new Set(sessions.map(s => s.userId)).size;

            return { totalCreated, active, expired, destroyed, uniqueUsers };
        }
    };
}



// ------ EXAMPLE USAGE ------

const sm = createSessionManager({
    sessionTTLMs: 1800000,       // 30 min
    maxSessionsPerUser: 3,
    absoluteTimeoutMs: 86400000, // 24 hours
    slidingWindowMs: 1800000     // 30 min sliding
});


console.log(sm.createSession("U1", { device: "chrome", ip: "10.0.0.1" }));

console.log(sm.validateSession("SES-1-U1", 1500000));

console.log(sm.touchSession("SES-1-U1", 1500000));

console.log(sm.validateSession("SES-1-U1", 9999999999));


// --- INVALID ---
console.log(createSessionManager({ sessionTTLMs: 0, maxSessionsPerUser: 0, absoluteTimeoutMs: 0, slidingWindowMs: 0 }));