// 🧩 PROBLEM–04: createUsageTracker()

// Logic: API usage tracking with sliding-window rate limits.
//   recordUsage() — append request to log
//   checkRateLimit() — count requests in last 60s / 24h vs per-scope limits
//   getUsageStats() / getTopKeys() / resetUsage() / generateUsageReport()


function createUsageTracker(trackerConfig) {

    // --- STEP 1: VALIDATE inputs ---
    if (
        typeof trackerConfig !== "object" ||
        trackerConfig === null ||
        Array.isArray(trackerConfig) ||
        typeof trackerConfig.rateLimits !== "object" ||
        trackerConfig.rateLimits === null ||
        typeof trackerConfig.trackingWindowMs !== "number" ||
        trackerConfig.trackingWindowMs <= 0
    ) {
        return "Invalid Input";
    }

    const rateLimits = trackerConfig.rateLimits;
    const trackingWindowMs = trackerConfig.trackingWindowMs;

    const usage = {}; // keyId -> { totalRequests, requestLog: [{scope, timestamp}] }


    // --- STEP 2: HELPERS ---
    function getOrCreate(keyId) {
        if (!usage[keyId]) {
            usage[keyId] = { totalRequests: 0, requestLog: [] };
        }
        return usage[keyId];
    }

    function countInWindow(keyId, windowMs, currentTimeMs) {
        const record = usage[keyId];
        if (!record) return 0;
        const cutoff = currentTimeMs - windowMs;
        return record.requestLog.filter(req => req.timestamp > cutoff).length;
    }

    function getLimit(scope) {
        if (rateLimits.hasOwnProperty(scope)) return rateLimits[scope];
        if (rateLimits.hasOwnProperty("default")) return rateLimits["default"];
        return { requestsPerMinute: Infinity, requestsPerDay: Infinity };
    }


    // --- STEP 3: PUBLIC API ---
    return {

        recordUsage(keyId, scope, currentTimeMs) {

            if (typeof keyId !== "string" || keyId.length === 0 ||
                typeof scope !== "string" || scope.length === 0) {
                return "Invalid Input";
            }

            const record = getOrCreate(keyId);

            record.totalRequests++;
            record.requestLog.push({ scope, timestamp: currentTimeMs });

            return { recorded: true, keyId, scope, currentTimeMs };
        },

        checkRateLimit(keyId, scope, currentTimeMs) {

            if (typeof keyId !== "string" || keyId.length === 0 ||
                typeof scope !== "string" || scope.length === 0) {
                return "Invalid Input";
            }

            const record = getOrCreate(keyId);

            const limit = getLimit(scope);

            const minuteCount = countInWindow(keyId, 60000, currentTimeMs);
            const dailyCount = countInWindow(keyId, 86400000, currentTimeMs);

            if (limit.requestsPerMinute !== Infinity && minuteCount >= limit.requestsPerMinute) {

                const oldestInMinute = record.requestLog
                    .filter(req => req.timestamp > currentTimeMs - 60000)
                    .map(req => req.timestamp)
                    .sort((a, b) => a - b)[0];

                const retryAfterMs = Math.max(0, oldestInMinute + 60000 - currentTimeMs);

                return { allowed: false, reason: "RATE_LIMIT_MINUTE", retryAfterMs };
            }

            if (limit.requestsPerDay !== Infinity && dailyCount >= limit.requestsPerDay) {
                return { allowed: false, reason: "RATE_LIMIT_DAY" };
            }

            return {
                allowed: true,
                minuteCount,
                dailyCount,
                remainingMinute: limit.requestsPerMinute === Infinity ? Infinity : limit.requestsPerMinute - minuteCount,
                remainingDay: limit.requestsPerDay === Infinity ? Infinity : limit.requestsPerDay - dailyCount
            };
        },

        getUsageStats(keyId) {

            if (typeof keyId !== "string" || keyId.length === 0) return "Invalid Input";

            const record = usage[keyId];

            if (!record) {
                return {
                    keyId,
                    totalRequests: 0,
                    last24hRequests: 0,
                    lastMinuteRequests: 0,
                    topScopes: [],
                    firstUsedAt: null,
                    lastUsedAt: null
                };
            }

            const now = record.requestLog[record.requestLog.length - 1].timestamp;

            const last24h = countInWindow(keyId, 86400000, now);
            const lastMinute = countInWindow(keyId, 60000, now);

            const scopeCounts = {};

            for (const req of record.requestLog) {
                if (!scopeCounts[req.scope]) scopeCounts[req.scope] = 0;
                scopeCounts[req.scope]++;
            }

            const topScopes = Object.entries(scopeCounts)
                .map(([scope, count]) => ({ scope, count }))
                .sort((a, b) => b.count - a.count);

            return {
                keyId,
                totalRequests: record.totalRequests,
                last24hRequests: last24h,
                lastMinuteRequests: lastMinute,
                topScopes,
                firstUsedAt: record.requestLog[0].timestamp,
                lastUsedAt: now
            };
        },

        getTopKeys(n) {

            if (typeof n !== "number") return "Invalid Input";

            return Object.entries(usage)
                .map(([keyId, record]) => ({ keyId, totalRequests: record.totalRequests }))
                .sort((a, b) => b.totalRequests - a.totalRequests)
                .slice(0, n);
        },

        resetUsage(keyId) {

            if (typeof keyId !== "string" || keyId.length === 0) return "Invalid Input";

            const record = usage[keyId];

            if (!record) return { reset: false, keyId, previousTotal: 0 };

            const previousTotal = record.totalRequests;

            record.totalRequests = 0;
            record.requestLog = [];

            return { reset: true, keyId, previousTotal };
        },

        generateUsageReport() {

            const keyIds = Object.keys(usage);

            let totalRequests = 0;
            let peakUsageKey = null;
            let peakCount = -1;

            const scopeBreakdown = {};

            for (const keyId of keyIds) {
                const record = usage[keyId];
                totalRequests += record.totalRequests;
                if (record.totalRequests > peakCount) {
                    peakCount = record.totalRequests;
                    peakUsageKey = keyId;
                }
                for (const req of record.requestLog) {
                    if (!scopeBreakdown[req.scope]) scopeBreakdown[req.scope] = 0;
                    scopeBreakdown[req.scope]++;
                }
            }

            const avgRequestsPerKey = keyIds.length > 0
                ? Math.round((totalRequests / keyIds.length) * 100) / 100
                : 0;

            return {
                totalKeys: keyIds.length,
                totalRequests,
                avgRequestsPerKey,
                peakUsageKey,
                scopeBreakdown
            };
        }
    };
}


// ------ EXAMPLE USAGE ------

const tracker = createUsageTracker({
    rateLimits: {
        "read:users": { requestsPerMinute: 2, requestsPerDay: 100 },
        "default": { requestsPerMinute: 10, requestsPerDay: 1000 }
    },
    trackingWindowMs: 60000
});

tracker.recordUsage("KEY-1", "read:users", 1000000);
tracker.recordUsage("KEY-1", "read:users", 1010000);
tracker.recordUsage("KEY-1", "read:users", 1020000);


console.log(tracker.checkRateLimit("KEY-1", "read:users", 1030000));

console.log(tracker.checkRateLimit("KEY-1", "read:users", 1070000));

console.log(tracker.getUsageStats("KEY-1"));

// --- INVALID ---
console.log(createUsageTracker({ rateLimits: null, trackingWindowMs: 0 }));