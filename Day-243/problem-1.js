// 🧩 PROBLEM–01: buildJWTStructure()

// Logic: Builds a simulated JWT structure.
//   simulateBase64(str) = "b64_" + reversed(str)
//   signature = "sig_" + charCodeSum(encodedHeader + "." + encodedPayload).toString(16)
//   token = encodedHeader + "." + encodedPayload + "." + signature

//   Note: literal dots are escaped as "%2E" so token parts never contain ".".


function simulateBase64(str) {
    const escaped = str.replace(/\./g, "%2E");
    return "b64_" + escaped.split("").reverse().join("");
}

function buildJWTStructure(tokenConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof tokenConfig !== "object" ||
        tokenConfig === null ||
        Array.isArray(tokenConfig)
    ) {
        return "Invalid Input";
    }

    const header = tokenConfig.header;
    const payload = tokenConfig.payload;

    if (
        typeof header !== "object" || header === null ||
        !["HS256", "HS384", "HS512"].includes(header.alg) ||
        header.typ !== "JWT" ||
        typeof payload !== "object" || payload === null
    ) {
        return "Invalid Input";
    }

    if (
        typeof payload.sub !== "string" || payload.sub.length === 0 ||
        typeof payload.iss !== "string" || payload.iss.length === 0 ||
        typeof payload.aud !== "string" || payload.aud.length === 0 ||
        typeof payload.iat !== "number" ||
        typeof payload.exp !== "number" ||
        payload.exp <= payload.iat
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: ENCODE PARTS ---

    const encodedHeader = simulateBase64(JSON.stringify(header));
    const encodedPayload = simulateBase64(JSON.stringify(payload));

    // --- STEP 3: SIGNATURE ---

    const base = encodedHeader + "." + encodedPayload;

    let charCodeSum = 0;

    for (const ch of base) {
        charCodeSum += ch.charCodeAt(0);
    }

    const signature = "sig_" + charCodeSum.toString(16);

    const token = encodedHeader + "." + encodedPayload + "." + signature;

    return {
        header,
        payload,
        encodedHeader,
        encodedPayload,
        signature,
        token,
        tokenParts: { header: encodedHeader, payload: encodedPayload, signature }
    };
}



// ------ EXAMPLE USAGE ------

console.log(buildJWTStructure({
    header: { alg: "HS256", typ: "JWT" },
    payload: { sub: "U1", iss: "myapp", aud: "web", iat: 1000000, exp: 1003600, role: "ADMIN" }
}));


// --- INVALID ---
console.log(buildJWTStructure(null));

console.log(buildJWTStructure({
    header: { alg: "HS256", typ: "JWT" },
    payload: { sub: "U1", iss: "myapp", aud: "web", iat: 1000000, exp: 500000 } // exp < iat
}));