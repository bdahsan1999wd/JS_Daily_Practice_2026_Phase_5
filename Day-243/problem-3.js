// 🧩 PROBLEM–03: createJWTValidator()

// Logic: Full JWT validation in a fixed order of checks.
//   1 FORMAT → 2 DECODE → 3 SIGNATURE → 4 EXPIRY → 5 NBF → 6 ISSUER → 7 AUDIENCE
//   verifySignature — only the signature check
//   verifyClaims — only exp/iss/aud checks
//   getValidationLog — history of validations


function simulateBase64(str) {
    const escaped = str.replace(/\./g, "%2E");
    return "b64_" + escaped.split("").reverse().join("");
}

function createJWTValidator(validatorConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof validatorConfig !== "object" ||
        validatorConfig === null ||
        Array.isArray(validatorConfig) ||
        typeof validatorConfig.secret !== "string" ||
        validatorConfig.secret.length === 0 ||
        typeof validatorConfig.expectedIssuer !== "string" ||
        validatorConfig.expectedIssuer.length === 0 ||
        typeof validatorConfig.clockSkewMs !== "number" ||
        validatorConfig.clockSkewMs < 0
    ) {
        return "Invalid Input";
    }

    const expectedIssuer = validatorConfig.expectedIssuer;
    const expectedAudience = validatorConfig.expectedAudience || null;

    const validationLog = [];

    // --- STEP 2: HELPERS ---

    function reverseSimulateBase64(encoded) {
        const withoutPrefix = encoded.startsWith("b64_") ? encoded.slice(4) : encoded;
        return withoutPrefix.split("").reverse().join("").replace(/%2E/g, ".");
    }

    function buildSignature(encodedHeader, encodedPayload) {

        const base = encodedHeader + "." + encodedPayload;

        let charCodeSum = 0;

        for (const ch of base) {
            charCodeSum += ch.charCodeAt(0);
        }

        return "sig_" + charCodeSum.toString(16);
    }

    // --- STEP 3: PUBLIC API ---

    return {

        validate(token, currentTimeMs) {

            if (typeof token !== "string" || token.length === 0) return "Invalid Input";

            const checksPerformed = [];
            let payload = null;

            // 1. FORMAT

            const parts = token.split(".");

            if (parts.length !== 3) {
                return { valid: false, payload: null, reason: "INVALID_FORMAT", checksPerformed: ["FORMAT"] };
            }

            checksPerformed.push("FORMAT");

            // 2. DECODE

            let header;
            let decodedPayload;

            try {
                header = JSON.parse(reverseSimulateBase64(parts[0]));
                decodedPayload = JSON.parse(reverseSimulateBase64(parts[1]));
            } catch (e) {
                return { valid: false, payload: null, reason: "INVALID_FORMAT", checksPerformed: checksPerformed.concat("DECODE") };
            }

            checksPerformed.push("DECODE");
            payload = decodedPayload;

            // 3. SIGNATURE

            const expectedSig = buildSignature(parts[0], parts[1]);

            if (parts[2] !== expectedSig) {
                checksPerformed.push("SIGNATURE");
                return { valid: false, payload: null, reason: "INVALID_SIGNATURE", checksPerformed };
            }

            checksPerformed.push("SIGNATURE");

            // 4. EXPIRY

            if (currentTimeMs > payload.exp) {
                checksPerformed.push("EXPIRY");
                return { valid: false, payload: null, reason: "TOKEN_EXPIRED", expiredAt: payload.exp, checksPerformed };
            }

            checksPerformed.push("EXPIRY");

            // 5. NOT BEFORE

            if (payload.nbf !== undefined && currentTimeMs < payload.nbf) {
                checksPerformed.push("NOT_BEFORE");
                return { valid: false, payload: null, reason: "TOKEN_NOT_YET_VALID", checksPerformed };
            }

            checksPerformed.push("NOT_BEFORE");

            // 6. ISSUER

            if (payload.iss !== expectedIssuer) {
                checksPerformed.push("ISSUER");
                return { valid: false, payload: null, reason: "INVALID_ISSUER", checksPerformed };
            }

            checksPerformed.push("ISSUER");

            // 7. AUDIENCE

            if (expectedAudience !== null && payload.aud !== expectedAudience) {
                checksPerformed.push("AUDIENCE");
                return { valid: false, payload: null, reason: "INVALID_AUDIENCE", checksPerformed };
            }

            checksPerformed.push("AUDIENCE");

            validationLog.push({
                token: token.slice(0, 20),
                valid: true,
                reason: null,
                validatedAt: "2025-01-01T00:00:00Z"
            });

            return { valid: true, payload, reason: null, checksPerformed };
        },

        verifySignature(token) {

            if (typeof token !== "string" || token.length === 0) return "Invalid Input";

            const parts = token.split(".");

            if (parts.length !== 3) return { valid: false, reason: "INVALID_FORMAT" };

            const expectedSig = buildSignature(parts[0], parts[1]);

            if (parts[2] === expectedSig) {
                return { valid: true, reason: "SIGNATURE_VALID" };
            }

            return { valid: false, reason: "INVALID_SIGNATURE" };
        },

        verifyClaims(token, currentTimeMs) {

            if (typeof token !== "string" || token.length === 0) return "Invalid Input";

            const parts = token.split(".");

            if (parts.length !== 3) return { valid: false, claims: { exp: false, iss: false, aud: false }, reason: "INVALID_FORMAT" };

            let payload;

            try {
                payload = JSON.parse(reverseSimulateBase64(parts[1]));
            } catch (e) {
                return { valid: false, claims: { exp: false, iss: false, aud: false }, reason: "INVALID_FORMAT" };
            }

            const expOk = currentTimeMs <= payload.exp;
            const issOk = payload.iss === expectedIssuer;
            const audOk = expectedAudience === null || payload.aud === expectedAudience;

            const claims = { exp: expOk, iss: issOk, aud: audOk };

            if (expOk && issOk && audOk) {
                return { valid: true, claims, reason: null };
            }

            let reason = null;

            if (!expOk) reason = "TOKEN_EXPIRED";
            else if (!issOk) reason = "INVALID_ISSUER";
            else reason = "INVALID_AUDIENCE";

            return { valid: false, claims, reason };
        },

        getValidationLog() {
            return validationLog.map(entry => ({ ...entry }));
        }
    };
}



// ------ EXAMPLE USAGE ------

function simulateBase64ForTest(str) {
    const escaped = str.replace(/\./g, "%2E");
    return "b64_" + escaped.split("").reverse().join("");
}

function makeGenerator(secret, issuer, defaultExpiryMs) {

    const issuedTokens = [];
    const SIM_IAT = 1000000;

    return {
        generate(claims, options) {
            const opts = options && typeof options === "object" ? options : {};
            const expiryMs = typeof opts.expiryMs === "number" ? opts.expiryMs : defaultExpiryMs;
            const header = { alg: "HS256", typ: "JWT" };
            const payload = {
                sub: claims.sub,
                role: claims.role || undefined,
                iss: issuer,
                aud: opts.audience,
                iat: SIM_IAT,
                exp: SIM_IAT + expiryMs
            };
            for (const k of Object.keys(payload)) if (payload[k] === undefined) delete payload[k];
            const encodedHeader = simulateBase64ForTest(JSON.stringify(header));
            const encodedPayload = simulateBase64ForTest(JSON.stringify(payload));
            let sum = 0;
            const base = encodedHeader + "." + encodedPayload;
            for (const ch of base) sum += ch.charCodeAt(0);
            const signature = "sig_" + sum.toString(16);
            const token = encodedHeader + "." + encodedPayload + "." + signature;
            issuedTokens.push(token);
            return { token, claims: payload, expiresAt: payload.exp, issuedAt: payload.iat };
        },
        _last() { return issuedTokens[issuedTokens.length - 1]; }
    };
}


const generator = makeGenerator("my-secret", "myapp.com", 3600000);
const validator = createJWTValidator({ secret: "my-secret", expectedIssuer: "myapp.com", expectedAudience: null, clockSkewMs: 0 });

const { token } = generator.generate({ sub: "U1", role: "ADMIN" });


// Valid token, current time within expiry:
console.log(validator.validate(token, 1000000 + 1000));

// Expired token (currentTime > exp):
console.log(validator.validate(token, 9999999999));

// Tampered token:
console.log(validator.validate("tampered.token.here", 1000000));

console.log(validator.verifySignature(token));

console.log(validator.getValidationLog());


// --- INVALID ---
console.log(createJWTValidator({ secret: "", expectedIssuer: "", expectedAudience: null, clockSkewMs: -1 }));