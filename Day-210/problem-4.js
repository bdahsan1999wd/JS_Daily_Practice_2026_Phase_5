// 🧩 PROBLEM–04: simulateLoggerMiddleware()

// Logic: Simulates a request logger middleware. Generates log entries based on response status codes and returns logging statistics.

function simulateLoggerMiddleware(requests) {

    // --- STEP 1: VALIDATION ---
    if (
        !Array.isArray(requests) ||
        requests.length === 0 ||
        !requests.every(request =>
            typeof request === "object" &&
            request !== null &&
            typeof request.requestId === "string" &&
            ["GET", "POST", "PUT", "DELETE"].includes(request.method) &&
            typeof request.path === "string" &&
            [200, 201, 400, 401, 403, 404, 500].includes(request.statusCode) &&
            typeof request.durationMs === "number" &&
            request.durationMs >= 0
        )
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: CREATE LOGS ---
    const logs = [];
    let infoCount = 0;
    let warnCount = 0;
    let errorCount = 0;
    let totalDuration = 0;

    let slowestRequest = requests[0];

    for (const request of requests) {

        let level = "";

        if (request.statusCode < 400) {
            level = "INFO";
            infoCount++;
        } else if (request.statusCode < 500) {
            level = "WARN";
            warnCount++;
        } else {
            level = "ERROR";
            errorCount++;
        }

        logs.push({
            requestId: request.requestId,
            level,
            logMessage: `[${level}] ${request.method} ${request.path} ${request.statusCode} (${request.durationMs}ms)`
        });

        totalDuration += request.durationMs;

        if (request.durationMs > slowestRequest.durationMs) {
            slowestRequest = request;
        }

    }

    // --- STEP 3: BUILD SUMMARY ---
    const summary = {
        totalRequests: requests.length,
        infoCount,
        warnCount,
        errorCount,
        avgDurationMs: Number(
            (totalDuration / requests.length).toFixed(2)
        ),
        slowestRequest: slowestRequest.requestId
    };

    // --- STEP 4: RETURN RESULT ---
    return {
        logs,
        summary
    };

}

// --- EXAMPLE USAGE ---
console.log(
    simulateLoggerMiddleware([
        {
            requestId: "R1",
            method: "GET",
            path: "/users",
            statusCode: 200,
            durationMs: 120
        },
        {
            requestId: "R2",
            method: "POST",
            path: "/orders",
            statusCode: 400,
            durationMs: 45
        },
        {
            requestId: "R3",
            method: "DELETE",
            path: "/items",
            statusCode: 500,
            durationMs: 300
        }
    ])
);