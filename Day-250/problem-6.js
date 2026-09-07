// 🧩 PROBLEM–06: runSecurityAudit()

//  Logic: Security audit engine. Event analysis, alert detection (last 60s),
//  breach password check, security score (0-100), recommendation.

function runSecurityAudit(auditConfig) {

    // --- STEP 1: VALIDATE ---

    if (
        typeof auditConfig !== "object" ||
        auditConfig === null ||
        Array.isArray(auditConfig) ||
        !Array.isArray(auditConfig.events) ||
        typeof auditConfig.alertThresholds !== "object" ||
        auditConfig.alertThresholds === null ||
        Array.isArray(auditConfig.alertThresholds) ||
        !Array.isArray(auditConfig.breachedPasswords) ||
        !Array.isArray(auditConfig.passwordsToCheck)
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: EVENT ANALYSIS ---

    const byType = {};
    const bySeverity = {};
    const userCounts = {};
    const criticalEvents = [];
    const buckets = {};

    let maxTimestamp = -Infinity;

    for (const event of auditConfig.events) {
        if (!byType[event.eventType]) byType[event.eventType] = 0;
        byType[event.eventType]++;

        if (!bySeverity[event.severity]) bySeverity[event.severity] = 0;
        bySeverity[event.severity]++;

        if (event.userId != null) {
            if (!userCounts[event.userId]) userCounts[event.userId] = 0;
            userCounts[event.userId]++;
        }

        if (event.severity === "CRITICAL") {
            criticalEvents.push({ ...event });
        }

        if (typeof event.timestamp === "number" && event.timestamp > maxTimestamp) {
            maxTimestamp = event.timestamp;
        }

        const bucketStart = Math.floor(event.timestamp / 10000) * 10000;
        if (!buckets[bucketStart]) buckets[bucketStart] = 0;
        buckets[bucketStart]++;
    }

    const topUsers = Object.entries(userCounts)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count || a.userId.localeCompare(b.userId))
        .slice(0, 3);

    const timeline = Object.entries(buckets)
        .map(([bucket, count]) => ({ bucket: Number(bucket), count }))
        .sort((a, b) => a.bucket - b.bucket);

    const eventAnalysis = {
        byType,
        bySeverity,
        topUsers,
        criticalEvents,
        timeline
    };

    // --- STEP 3: ALERT DETECTION (last 60 seconds from max timestamp) ---

    const alerts = [];

    if (maxTimestamp !== -Infinity) {
        const windowStart = maxTimestamp - 60000;

        const countInWindow = (type) =>
            auditConfig.events.filter(e => e.eventType === type && e.timestamp >= windowStart).length;

        const authFailureCount = countInWindow("AUTH_FAILURE");
        const threatCount = countInWindow("THREAT_DETECTED");
        const rateLimitedCount = countInWindow("RATE_LIMITED");

        if (authFailureCount >= auditConfig.alertThresholds.authFailuresPerMinute) {
            alerts.push({ type: "HIGH_AUTH_FAILURE_RATE", count: authFailureCount, threshold: auditConfig.alertThresholds.authFailuresPerMinute, severity: "HIGH" });
        }

        if (threatCount >= auditConfig.alertThresholds.threatsPerMinute) {
            alerts.push({ type: "HIGH_THREAT_RATE", count: threatCount, threshold: auditConfig.alertThresholds.threatsPerMinute, severity: "HIGH" });
        }

        if (rateLimitedCount >= auditConfig.alertThresholds.rateLimitedPerMinute) {
            alerts.push({ type: "HIGH_RATE_LIMIT_RATE", count: rateLimitedCount, threshold: auditConfig.alertThresholds.rateLimitedPerMinute, severity: "HIGH" });
        }
    }

    // --- STEP 4: BREACH CHECK ---

    const breachedLower = auditConfig.breachedPasswords.map(p => String(p).toLowerCase());

    const breachCheckResults = auditConfig.passwordsToCheck.map(password => {
        const isBreached = breachedLower.includes(String(password).toLowerCase());
        return {
            password: "***",
            breached: isBreached,
            riskLevel: isBreached ? "CRITICAL" : "SAFE"
        };
    });

    // --- STEP 5: SECURITY SCORE ---

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

    // --- STEP 6: RECOMMENDATION ---

    const hasCriticalThreat = auditConfig.events.some(e => e.eventType === "THREAT_DETECTED");
    const hasCriticalSeverity = criticalEvents.length > 0;

    let recommendation;

    if (hasCriticalThreat || hasCriticalSeverity) {
        recommendation = "Critical threats detected. Immediate security review required.";
    } else if (score >= 80) {
        recommendation = "System is in a healthy security state.";
    } else {
        recommendation = "Security concerns detected. Review the audit report.";
    }

    return {
        eventAnalysis,
        alerts,
        breachCheckResults,
        securityScore: score,
        recommendation
    };
}


// ------ EXAMPLE USAGE ------

console.log(JSON.stringify(runSecurityAudit({
    events: [
        { eventId: "E1", eventType: "AUTH_FAILURE", userId: "U1", resource: null, severity: "WARN", timestamp: 1000000, details: {} },
        { eventId: "E2", eventType: "AUTH_SUCCESS", userId: "U1", resource: null, severity: "INFO", timestamp: 1001000, details: {} },
        { eventId: "E3", eventType: "THREAT_DETECTED", userId: null, resource: "/api/data", severity: "CRITICAL", timestamp: 1002000, details: { type: "SQLI" } }
    ],
    alertThresholds: { authFailuresPerMinute: 5, threatsPerMinute: 1, rateLimitedPerMinute: 10 },
    breachedPasswords: ["password", "123456", "qwerty"],
    passwordsToCheck: ["password", "Secure@Pass123"]
}), null, 2));


// --- INVALID ---
console.log(runSecurityAudit(null));