// 🧩 PROBLEM–04: createThreatDetectionEngine()

// Logic: Multi-detector threat scanning.
//   scan(input) — run enabled detectors (XSS / SQLI / PATH_TRAVERSAL / COMMAND_INJECTION / LDAP_INJECTION / XML_INJECTION)
//   scanRequest(request) — scan path / queryParams / headers / body string values
//   getThreatLog() / getStats()


function createThreatDetectionEngine(engineConfig) {


    // --- STEP 1: VALIDATE inputs ---
    const VALID_DETECTORS = [
        "XSS", "SQLI", "PATH_TRAVERSAL", "COMMAND_INJECTION", "LDAP_INJECTION", "XML_INJECTION"
    ];

    if (
        typeof engineConfig !== "object" ||
        engineConfig === null ||
        Array.isArray(engineConfig) ||
        !Array.isArray(engineConfig.enabledDetectors) ||
        engineConfig.enabledDetectors.some(d => !VALID_DETECTORS.includes(d)) ||
        typeof engineConfig.blockOnThreat !== "boolean" ||
        typeof engineConfig.logThreats !== "boolean"
    ) {
        return "Invalid Input";
    }

    const enabledDetectors = engineConfig.enabledDetectors;
    const blockOnThreat = engineConfig.blockOnThreat;
    const logThreats = engineConfig.logThreats;

    const threatLog = [];

    let totalScans = 0;
    let threatsDetected = 0;
    let blocks = 0;

    const byType = {};
    const bySeverity = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };


    // --- STEP 2: DETECTOR PATTERNS ---
    const DETECTORS = {
        XSS: {
            severity: "MEDIUM",
            patterns: ["<script>", "javascript:", "onerror=", "alert(", "eval("]
        },
        SQLI: {
            severity: "HIGH",
            patterns: ["' OR", "UNION SELECT", "DROP TABLE", "--", "; SELECT"]
        },
        PATH_TRAVERSAL: {
            severity: "HIGH",
            patterns: ["../", "..\\", "%2e%2e", "/etc/passwd", "C:\\Windows"]
        },
        COMMAND_INJECTION: {
            severity: "CRITICAL",
            patterns: ["; ls", "| cat", "&& rm", "`", "$(", "> /dev/null"]
        },
        LDAP_INJECTION: {
            severity: "MEDIUM",
            patterns: ["*)(uid=", ")(|(", "\\2a", "\\28", "\\29"]
        },
        XML_INJECTION: {
            severity: "LOW",
            patterns: ["<!ENTITY", "<!DOCTYPE", "]]>", "<![CDATA["]
        }
    };


    // --- STEP 3: HELPERS ---
    function scanInput(input) {

        const threats = [];

        for (const detector of enabledDetectors) {

            const config = DETECTORS[detector];

            for (const pattern of config.patterns) {

                let idx = input.indexOf(pattern);

                while (idx !== -1) {
                    threats.push({ type: detector, pattern, severity: config.severity, location: idx });
                    idx = input.indexOf(pattern, idx + 1);
                }
            }
        }

        threats.sort((a, b) => a.location - b.location);

        return threats;
    }

    function highestSeverity(threats) {
        if (threats.length === 0) return null;
        const order = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
        let max = "LOW";
        for (const t of threats) {
            if (order[t.severity] > order[max]) max = t.severity;
        }
        return max;
    }

    function preview(input, len) {
        return input.length > len ? input.slice(0, len) + "..." : input;
    }

    // --- STEP 4: PUBLIC API ---
    return {

        scan(input) {

            if (typeof input !== "string") return "Invalid Input";

            totalScans++;

            const threats = scanInput(input);

            const threatCount = threats.length;

            if (threatCount > 0) {
                threatsDetected += threatCount;
                for (const t of threats) {
                    if (!byType[t.type]) byType[t.type] = 0;
                    byType[t.type]++;
                    bySeverity[t.severity]++;
                }
            }

            const severity = highestSeverity(threats);

            const blocked = blockOnThreat && threatCount > 0;

            if (blocked) blocks++;

            if (logThreats) {
                threatLog.push({
                    scannedAt: "2025-01-01T00:00:00Z",
                    input: preview(input, 30),
                    threatCount,
                    highestSeverity: severity
                });
            }

            return {
                input: preview(input, 50),
                threats,
                threatCount,
                highestSeverity: severity,
                blocked
            };
        },

        scanRequest(request) {

            if (typeof request !== "object" || request === null || Array.isArray(request)) {
                return "Invalid Input";
            }

            const result = {};
            let highest = "LOW";
            const order = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
            let anyThreat = false;

            function scanValue(key, value, container) {

                if (typeof value === "string") {

                    const scanRes = this.scan(value);

                    container[key] = {
                        threats: scanRes.threats.map(t => ({ type: t.type, pattern: t.pattern, severity: t.severity, location: t.location })),
                        threatCount: scanRes.threatCount,
                        blocked: scanRes.blocked
                    };

                    if (scanRes.threatCount > 0) {
                        anyThreat = true;
                        const sev = scanRes.highestSeverity;
                        if (order[sev] > order[highest]) highest = sev;
                    }

                } else if (typeof value === "object" && value !== null) {

                    for (const subKey of Object.keys(value)) {
                        scanValue.call(this, subKey, value[subKey], container);
                    }
                }
            }

            // path.

            result.path = { threats: [], threatCount: 0, blocked: false };

            if (typeof request.path === "string") {
                const pathScan = this.scan(request.path);
                result.path = {
                    threats: pathScan.threats.map(t => ({ type: t.type, pattern: t.pattern, severity: t.severity, location: t.location })),
                    threatCount: pathScan.threatCount,
                    blocked: pathScan.blocked
                };
                if (pathScan.threatCount > 0) {
                    anyThreat = true;
                    if (order[pathScan.highestSeverity] > order[highest]) highest = pathScan.highestSeverity;
                }
            }

            // queryParams.

            result.queryParams = {};
            if (request.queryParams && typeof request.queryParams === "object") {
                for (const field of Object.keys(request.queryParams)) {
                    scanValue.call(this, field, request.queryParams[field], result.queryParams);
                }
            }

            // headers.

            result.headers = { threats: [], threatCount: 0, blocked: false };

            if (request.headers && typeof request.headers === "object") {
                const allValues = Object.values(request.headers).join(" ");
                const headerScan = this.scan(allValues);
                result.headers = {
                    threats: headerScan.threats.map(t => ({ type: t.type, pattern: t.pattern, severity: t.severity, location: t.location })),
                    threatCount: headerScan.threatCount,
                    blocked: headerScan.blocked
                };
                if (headerScan.threatCount > 0) {
                    anyThreat = true;
                    if (order[headerScan.highestSeverity] > order[highest]) highest = headerScan.highestSeverity;
                }
            }

            // body.

            result.body = {};
            if (request.body && typeof request.body === "object") {
                for (const field of Object.keys(request.body)) {
                    scanValue.call(this, field, request.body[field], result.body);
                }
            }

            const overallThreatLevel = anyThreat ? highest : null;
            const blocked = blockOnThreat && anyThreat;

            return {
                path: result.path,
                queryParams: result.queryParams,
                headers: result.headers,
                body: result.body,
                overallThreatLevel,
                blocked
            };
        },

        getThreatLog() {
            return threatLog.map(entry => ({ ...entry }));
        },

        getStats() {
            return {
                totalScans,
                threatsDetected,
                byType: { ...byType },
                bySeverity: { ...bySeverity },
                blockRate: totalScans > 0 ? Math.round((blocks / totalScans) * 100) : 0
            };
        }
    };
}



// ------ EXAMPLE USAGE ------
const tde = createThreatDetectionEngine({
    enabledDetectors: ["XSS", "SQLI", "PATH_TRAVERSAL"],
    blockOnThreat: true,
    logThreats: true
});


console.log(tde.scan("Hello World"));

console.log(tde.scan("'; DROP TABLE users; -- <script>alert(1)</script>"));

console.log(tde.scanRequest({
    path: "/api/users/../admin",
    queryParams: { search: "' OR 1=1 --", page: "1" },
    headers: { "Authorization": "Bearer token123" },
    body: { name: "Rahim", comment: "<script>steal()</script>" }
}));

console.log(tde.getThreatLog());


// --- INVALID ---
console.log(createThreatDetectionEngine({ enabledDetectors: ["XSS", "BAD"], blockOnThreat: true, logThreats: true }));