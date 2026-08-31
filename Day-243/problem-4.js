// 🧩 PROBLEM–04: createClaimsManager()

// Logic: Claims builder/validator/extractor/merger/permission checker.
//   buildClaims(userInfo, options) — validate role+scopes, build full claims
//   validateClaims(claims) — check required claims, role, scopes
//   extractClaims(token, fields) — decode token, pull only specified fields
//   mergeClaims(base, additional) — additional overrides base
//   checkPermission(token, requiredRole, requiredScope) — role/scope gate

//   Note: literal dots are escaped as "%2E" so token parts never contain ".".j


function simulateBase64(str) {
    const escaped = str.replace(/\./g, "%2E");
    return "b64_" + escaped.split("").reverse().join("");
}

function createClaimsManager(claimsConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof claimsConfig !== "object" ||
        claimsConfig === null ||
        Array.isArray(claimsConfig) ||
        !Array.isArray(claimsConfig.allowedRoles) ||
        !Array.isArray(claimsConfig.allowedScopes) ||
        !Array.isArray(claimsConfig.requiredClaims)
    ) {
        return "Invalid Input";
    }

    const allowedRoles = claimsConfig.allowedRoles;
    const allowedScopes = claimsConfig.allowedScopes;
    const requiredClaims = claimsConfig.requiredClaims;

    // --- STEP 2: HELPERS ---

    function reverseSimulateBase64(encoded) {
        const withoutPrefix = encoded.startsWith("b64_") ? encoded.slice(4) : encoded;
        return withoutPrefix.split("").reverse().join("").replace(/%2E/g, ".");
    }

    function decodeToken(token) {

        const parts = token.split(".");

        if (parts.length !== 3) return null;

        try {
            return JSON.parse(reverseSimulateBase64(parts[1]));
        } catch (e) {
            return null;
        }
    }

    // --- STEP 3: PUBLIC API ---

    return {

        buildClaims(userInfo, options) {

            if (typeof userInfo !== "object" || userInfo === null || Array.isArray(userInfo)) {
                return "Invalid Input";
            }

            const opts = options && typeof options === "object" ? options : {};

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

            const expiryMs = typeof opts.expiryMs === "number" ? opts.expiryMs : 3600000;

            return {
                sub: userInfo.userId,
                role,
                scopes,
                aud: opts.audience,
                iat: 1000000,
                exp: 1000000 + expiryMs,
                ...(opts.customClaims || {})
            };
        },

        validateClaims(claims) {

            if (typeof claims !== "object" || claims === null || Array.isArray(claims)) {
                return "Invalid Input";
            }

            const errors = [];

            for (const req of requiredClaims) {
                if (claims[req] === undefined) {
                    errors.push(req + ": required claim missing");
                }
            }

            if (claims.role !== undefined && !allowedRoles.includes(claims.role)) {
                errors.push("role: invalid role " + claims.role);
            }

            if (Array.isArray(claims.scopes)) {
                for (const scope of claims.scopes) {
                    if (!allowedScopes.includes(scope)) {
                        errors.push("scope: invalid scope " + scope);
                    }
                }
            }

            return { valid: errors.length === 0, errors };
        },

        extractClaims(token, fields) {

            if (typeof token !== "string" || token.length === 0 || !Array.isArray(fields)) {
                return "Invalid Input";
            }

            const payload = decodeToken(token);

            if (!payload) return { error: "Invalid token" };

            const extracted = {};
            const missingFields = [];

            for (const field of fields) {
                if (payload[field] !== undefined) {
                    extracted[field] = payload[field];
                } else {
                    missingFields.push(field);
                }
            }

            return { extracted, missingFields };
        },

        mergeClaims(baseClaims, additionalClaims) {

            if (
                typeof baseClaims !== "object" || baseClaims === null || Array.isArray(baseClaims) ||
                typeof additionalClaims !== "object" || additionalClaims === null || Array.isArray(additionalClaims)
            ) {
                return "Invalid Input";
            }

            const overriddenFields = [];

            for (const key of Object.keys(additionalClaims)) {
                if (baseClaims[key] !== undefined) {
                    overriddenFields.push(key);
                }
            }

            return {
                merged: { ...baseClaims, ...additionalClaims },
                overriddenFields
            };
        },

        checkPermission(token, requiredRole, requiredScope) {

            if (typeof token !== "string" || token.length === 0) {
                return "Invalid Input";
            }

            const payload = decodeToken(token);

            if (!payload) {
                return { permitted: false, tokenRole: null, requiredRole, hasScope: false, reason: "Invalid token" };
            }

            const tokenRole = payload.role || null;
            const scopes = Array.isArray(payload.scopes) ? payload.scopes : [];

            let roleOk = true;
            let scopeOk = true;

            if (requiredRole !== null && requiredRole !== undefined && requiredRole !== "") {
                roleOk = tokenRole === requiredRole;
            }

            if (requiredScope !== null && requiredScope !== undefined && requiredScope !== "") {
                scopeOk = scopes.includes(requiredScope);
            }

            const permitted = roleOk && scopeOk;

            let reason = null;

            if (!roleOk) {
                reason = "Required role " + requiredRole + " but token has " + tokenRole;
            } else if (!scopeOk) {
                reason = "Required scope " + requiredScope + " but token does not have it";
            }

            return { permitted, tokenRole, requiredRole, hasScope: scopeOk, reason };
        }
    };
}



// ------ EXAMPLE USAGE ------

const cm = createClaimsManager({
    allowedRoles: ["ADMIN", "USER", "MOD"],
    allowedScopes: ["read:users", "write:users", "read:orders"],
    requiredClaims: ["sub", "role", "iat", "exp"]
});


console.log(cm.buildClaims(
    { userId: "U1", role: "ADMIN", scopes: ["read:users", "write:users"] },
    { expiryMs: 3600000, audience: "web", customClaims: { department: "IT" } }
));

console.log(cm.buildClaims(
    { userId: "U2", role: "SUPERADMIN", scopes: [] },
    { expiryMs: 3600000, audience: "web", customClaims: {} }
));

console.log(cm.validateClaims({ sub: "U1", role: "ADMIN", iat: 1000000 }));

console.log(cm.mergeClaims(
    { sub: "U1", role: "USER", iat: 1000000 },
    { role: "ADMIN", department: "IT" }
));


// --- INVALID ---
console.log(createClaimsManager({ allowedRoles: "ADMIN", allowedScopes: [], requiredClaims: [] }));