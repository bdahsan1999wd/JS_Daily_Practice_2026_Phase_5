// 🧩 PROBLEM–02: createJWTGenerator()

// Logic: JWT generator with simulated base64 encoding.
//   generate(claims, options) — builds full token (Problem-01 logic inline)
//   decode(token) — reverse encoding, parse JSON, NO signature check
//   parse(token) — split into parts, well-formed check
//   getIssuedTokens() — metadata of all issued tokens

//   Note: literal dots are escaped as "%2E" so token parts never contain ".".


function simulateBase64(str) {
    const escaped = str.replace(/\./g, "%2E");
    return "b64_" + escaped.split("").reverse().join("");
}

function reverseSimulateBase64(encoded) {
    const withoutPrefix = encoded.startsWith("b64_") ? encoded.slice(4) : encoded;
    return withoutPrefix.split("").reverse().join("").replace(/%2E/g, ".");
}

function createJWTGenerator(generatorConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof generatorConfig !== "object" ||
        generatorConfig === null ||
        Array.isArray(generatorConfig) ||
        typeof generatorConfig.secret !== "string" ||
        generatorConfig.secret.length === 0 ||
        typeof generatorConfig.issuer !== "string" ||
        generatorConfig.issuer.length === 0 ||
        typeof generatorConfig.defaultExpiryMs !== "number" ||
        generatorConfig.defaultExpiryMs <= 0
    ) {
        return "Invalid Input";
    }

    const secret = generatorConfig.secret;
    const issuer = generatorConfig.issuer;
    const defaultExpiryMs = generatorConfig.defaultExpiryMs;

    const issuedTokens = [];

    // Simulated current time.

    const SIM_IAT = 1000000;

    // --- STEP 2: HELPERS ---

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

        generate(claims, options) {

            if (typeof claims !== "object" || claims === null || Array.isArray(claims)) {
                return "Invalid Input";
            }

            const opts = options && typeof options === "object" ? options : {};

            const expiryMs = typeof opts.expiryMs === "number" ? opts.expiryMs : defaultExpiryMs;

            const header = { alg: "HS256", typ: "JWT" };

            const payload = {
                sub: claims.sub,
                ...Object.fromEntries(Object.entries(claims).filter(([k]) => k !== "sub")),
                iss: issuer,
                aud: opts.audience,
                iat: SIM_IAT,
                exp: SIM_IAT + expiryMs
            };

            const encodedHeader = simulateBase64(JSON.stringify(header));
            const encodedPayload = simulateBase64(JSON.stringify(payload));
            const signature = buildSignature(encodedHeader, encodedPayload);

            const token = encodedHeader + "." + encodedPayload + "." + signature;

            issuedTokens.push({
                sub: payload.sub,
                iat: payload.iat,
                exp: payload.exp,
                role: payload.role || null,
                token
            });

            return {
                token,
                claims: payload,
                expiresAt: payload.exp,
                issuedAt: payload.iat
            };
        },

        decode(token) {

            if (typeof token !== "string" || token.length === 0) return "Invalid Input";

            const parts = token.split(".");

            if (parts.length !== 3) return { error: "Invalid token format" };

            let header;
            let payload;

            try {
                header = JSON.parse(reverseSimulateBase64(parts[0]));
                payload = JSON.parse(reverseSimulateBase64(parts[1]));
            } catch (e) {
                return { error: "Invalid token format" };
            }

            return { header, payload };
        },

        parse(token) {

            if (typeof token !== "string" || token.length === 0) return "Invalid Input";

            const parts = token.split(".");

            if (parts.length === 3) {
                return {
                    parts: { header: parts[0], payload: parts[1], signature: parts[2] },
                    isWellFormed: true
                };
            }

            return { parts: null, isWellFormed: false };
        },

        getIssuedTokens() {

            return issuedTokens.map(entry => ({
                sub: entry.sub,
                iat: entry.iat,
                exp: entry.exp,
                role: entry.role,
                tokenPreview: entry.token.slice(0, 20) + "..."
            }));
        }
    };
}


// ------ EXAMPLE USAGE ------

const generator = createJWTGenerator({
    secret: "my-secret-key",
    issuer: "myapp.com",
    defaultExpiryMs: 3600000 // 1 hour
});


const genResult = generator.generate({ sub: "U1", role: "ADMIN" });
console.log(genResult);


console.log(generator.parse("abc.def.ghi"));

console.log(generator.parse("invalid-token"));

console.log(generator.decode(genResult.token));

console.log(generator.getIssuedTokens());


// --- INVALID ---
console.log(createJWTGenerator({ secret: "", issuer: "", defaultExpiryMs: 0 }));