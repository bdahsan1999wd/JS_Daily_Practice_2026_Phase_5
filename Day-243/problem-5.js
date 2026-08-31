// 🧩 PROBLEM–05: runJWTOrchestrator()

// Logic: End-to-end JWT flow.
//   1. Setup generator (P2), validator (P3), claims manager (P4) from jwtConfig
//   2. Process tokenRequests: build claims (P4) → generate token (P2)
//   3. Process validationRequests: find source token → validate (P3) → permission check (P4)
//   4. Build summary of issued/failed/validated/denied counts

//   Note: literal dots are escaped as "%2E" so token parts never contain ".".


function simulateBase64(str) {
    const escaped = str.replace(/\./g, "%2E");
    return "b64_" + escaped.split("").reverse().join("");
}

function runJWTOrchestrator(jwtConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof jwtConfig !== "object" ||
        jwtConfig === null ||
        Array.isArray(jwtConfig) ||
        typeof jwtConfig.orchestratorId !== "string" || jwtConfig.orchestratorId.length === 0 ||
        typeof jwtConfig.secret !== "string" || jwtConfig.secret.length === 0 ||
        typeof jwtConfig.issuer !== "string" || jwtConfig.issuer.length === 0 ||
        typeof jwtConfig.audience !== "string" || jwtConfig.audience.length === 0 ||
        typeof jwtConfig.defaultExpiryMs !== "number" || jwtConfig.defaultExpiryMs <= 0 ||
        !Array.isArray(jwtConfig.allowedRoles) ||
        !Array.isArray(jwtConfig.allowedScopes) ||
        !Array.isArray(jwtConfig.requiredClaims) ||
        !Array.isArray(jwtConfig.tokenRequests) ||
        !Array.isArray(jwtConfig.validationRequests)
    ) {
        return "Invalid Input";
    }

    const orchestratorId = jwtConfig.orchestratorId;
    const secret = jwtConfig.secret;
    const issuer = jwtConfig.issuer;
    const audience = jwtConfig.audience;
    const defaultExpiryMs = jwtConfig.defaultExpiryMs;

    const allowedRoles = jwtConfig.allowedRoles;
    const allowedScopes = jwtConfig.allowedScopes;
    const requiredClaims = jwtConfig.requiredClaims;

    // --- STEP 2: SETUP helper primitives (self-contained) ---

    function reverseSimulateBase64(encoded) {
        const withoutPrefix = encoded.startsWith("b64_") ? encoded.slice(4) : encoded;
        return withoutPrefix.split("").reverse().join("").replace(/%2E/g, ".");
    }

    function buildSignature(encodedHeader, encodedPayload) {
        const base = encodedHeader + "." + encodedPayload;
        let charCodeSum = 0;
        for (const ch of base) charCodeSum += ch.charCodeAt(0);
        return "sig_" + charCodeSum.toString(16);
    }

    function encodeToken(claims) {
        const header = { alg: "HS256", typ: "JWT" };
        const encodedHeader = simulateBase64(JSON.stringify(header));
        const encodedPayload = simulateBase64(JSON.stringify(claims));
        const signature = buildSignature(encodedHeader, encodedPayload);
        return encodedHeader + "." + encodedPayload + "." + signature;
    }

    function decodeToken(token) {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        try {
            return {
                header: JSON.parse(reverseSimulateBase64(parts[0])),
                payload: JSON.parse(reverseSimulateBase64(parts[1]))
            };
        } catch (e) {
            return null;
        }
    }

    // Claims builder (Problem-04 inline)

    function buildClaims(userInfo, customClaims, expiryOverrideMs) {

        const role = userInfo.role;
        const scopes = Array.isArray(userInfo.scopes) ? userInfo.scopes : [];

        if (!allowedRoles.includes(role)) {
            return { error: "Invalid role: " + role };
        }

        for (const scope of scopes) {
            if (!allowedScopes.includes(scope)) {
                return { error: "Invalid scope: " + scope };
            }
        }

        const expiryMs = typeof expiryOverrideMs === "number" ? expiryOverrideMs : defaultExpiryMs;

        return {
            sub: userInfo.userId,
            role,
            scopes,
            aud: audience,
            iat: 1000000,
            exp: 1000000 + expiryMs,
            ...(customClaims || {})
        };
    }

    // Validator (Problem-03 inline)

    function validateToken(token, currentTimeMs) {

        const parts = token.split(".");

        if (parts.length !== 3) return { valid: false, reason: "INVALID_FORMAT" };

        const decoded = decodeToken(token);

        if (!decoded) return { valid: false, reason: "INVALID_FORMAT" };

        const expectedSig = buildSignature(parts[0], parts[1]);

        if (parts[2] !== expectedSig) return { valid: false, reason: "INVALID_SIGNATURE" };

        const payload = decoded.payload;

        if (currentTimeMs > payload.exp) return { valid: false, reason: "TOKEN_EXPIRED" };

        if (payload.iss !== issuer) return { valid: false, reason: "INVALID_ISSUER" };

        if (payload.aud !== audience) return { valid: false, reason: "INVALID_AUDIENCE" };

        return { valid: true, payload, reason: null };
    }

    // Permission check (Problem-04 inline)

    function checkPermission(payload, requiredRole, requiredScope) {

        const tokenRole = payload.role || null;
        const scopes = Array.isArray(payload.scopes) ? payload.scopes : [];

        const needRole = requiredRole !== null && requiredRole !== undefined;
        const needScope = requiredScope !== null && requiredScope !== undefined;

        const roleOk = !needRole || tokenRole === requiredRole;
        const scopeOk = !needScope || scopes.includes(requiredScope);

        if (!roleOk) {
            return { permitted: false, reason: "Required role " + requiredRole + " but token has " + tokenRole };
        }

        if (!scopeOk) {
            return { permitted: false, reason: "Required scope " + requiredScope + " but token does not have it" };
        }

        return { permitted: true, reason: null };
    }

    // --- STEP 3: PROCESS TOKEN REQUESTS ---

    const tokenLog = [];
    const tokensByRequest = {};

    for (const req of jwtConfig.tokenRequests) {

        const claimsResult = buildClaims(req.userInfo, req.customClaims, req.expiryOverrideMs);

        if (claimsResult.error) {
            tokenLog.push({ requestId: req.requestId, success: false, error: claimsResult.error });
            continue;
        }

        const claims = {
            ...claimsResult,
            iss: issuer,
            aud: audience
        };

        const token = encodeToken(claims);

        tokensByRequest[req.requestId] = token;

        tokenLog.push({ requestId: req.requestId, success: true, token, claims });
    }

    // --- STEP 4: PROCESS VALIDATION REQUESTS ---

    const validationLog = [];

    for (const req of jwtConfig.validationRequests) {

        const sourceToken = tokensByRequest[req.tokenSource];

        let entry;

        if (!sourceToken) {

            entry = {
                requestId: req.requestId,
                tokenSource: req.tokenSource,
                valid: false,
                reason: "SOURCE_TOKEN_MISSING",
                permitted: false,
                permissionReason: "Token validation failed"
            };

        } else {

            const vResult = validateToken(sourceToken, req.currentTimeMs);

            if (vResult.valid) {

                const pResult = checkPermission(vResult.payload, req.requiredRole, req.requiredScope);

                entry = {
                    requestId: req.requestId,
                    tokenSource: req.tokenSource,
                    valid: true,
                    reason: null,
                    permitted: pResult.permitted,
                    permissionReason: pResult.reason
                };

            } else {

                entry = {
                    requestId: req.requestId,
                    tokenSource: req.tokenSource,
                    valid: false,
                    reason: vResult.reason,
                    permitted: false,
                    permissionReason: "Token validation failed"
                };
            }
        }

        validationLog.push(entry);
    }

    // --- STEP 5: BUILD SUMMARY ---

    const tokensIssued = tokenLog.filter(e => e.success).length;
    const tokensFailed = tokenLog.filter(e => !e.success).length;
    const validationsTotal = validationLog.length;
    const validationsPassed = validationLog.filter(e => e.valid && e.permitted).length;
    const validationsFailed = validationLog.filter(e => !e.valid).length;
    const permissionDenied = validationLog.filter(e => e.valid && !e.permitted).length;

    return {
        orchestratorId,
        tokenLog,
        validationLog,
        summary: {
            tokensIssued,
            tokensFailed,
            validationsTotal,
            validationsPassed,
            validationsFailed,
            permissionDenied
        }
    };
}



// ------ EXAMPLE USAGE ------

console.log(JSON.stringify(runJWTOrchestrator({
    orchestratorId: "JWT-ORCH-01",
    secret: "super-secret-key",
    issuer: "myapp.com",
    audience: "web",
    defaultExpiryMs: 3600000,
    allowedRoles: ["ADMIN", "USER"],
    allowedScopes: ["read:users", "write:users"],
    requiredClaims: ["sub", "role", "iat", "exp"],
    tokenRequests: [
        { requestId: "TR-1", userInfo: { userId: "U1", role: "ADMIN", scopes: ["read:users", "write:users"] }, customClaims: { dept: "IT" }, expiryOverrideMs: null },
        { requestId: "TR-2", userInfo: { userId: "U2", role: "USER", scopes: ["read:users"] }, customClaims: null, expiryOverrideMs: null },
        { requestId: "TR-3", userInfo: { userId: "U3", role: "SUPERADMIN", scopes: [] }, customClaims: null, expiryOverrideMs: null }
    ],
    validationRequests: [
        { requestId: "VR-1", tokenSource: "TR-1", currentTimeMs: 1001000, requiredRole: "ADMIN", requiredScope: "write:users" },
        { requestId: "VR-2", tokenSource: "TR-2", currentTimeMs: 1001000, requiredRole: "ADMIN", requiredScope: null },
        { requestId: "VR-3", tokenSource: "TR-1", currentTimeMs: 9999999999, requiredRole: null, requiredScope: null }
    ]
}), null, 2));


// --- INVALID ---
console.log(runJWTOrchestrator({ orchestratorId: "", secret: "", issuer: "", audience: "", defaultExpiryMs: 0, allowedRoles: [], allowedScopes: [], requiredClaims: [], tokenRequests: [], validationRequests: [] }));