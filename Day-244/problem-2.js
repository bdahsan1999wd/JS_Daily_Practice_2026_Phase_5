// 🧩 PROBLEM–02: createTokenRotationEngine()

// Logic: Access/refresh token pair lifecycle with optional rotation.
//   login() — issue initial AT+RT pair
//   refresh() — rotateOnUse: replace RT & issue new AT; else keep RT, new AT
//   logout() — revoke RT
//   getTokenPair() / getRotationHistory()


function createTokenRotationEngine(rotationConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof rotationConfig !== "object" ||
        rotationConfig === null ||
        Array.isArray(rotationConfig) ||
        typeof rotationConfig.accessTokenTTLMs !== "number" ||
        rotationConfig.accessTokenTTLMs <= 0 ||
        typeof rotationConfig.refreshTokenTTLMs !== "number" ||
        rotationConfig.refreshTokenTTLMs <= 0 ||
        typeof rotationConfig.rotateOnUse !== "boolean"
    ) {
        return "Invalid Input";
    }

    const accessTokenTTLMs = rotationConfig.accessTokenTTLMs;
    const refreshTokenTTLMs = rotationConfig.refreshTokenTTLMs;
    const rotateOnUse = rotationConfig.rotateOnUse;

    const tokenPairs = [];
    const history = [];

    let autoIndex = 0;

    // --- STEP 2: PUBLIC API ---

    return {

        login(userId, metadata) {

            if (typeof userId !== "string" || userId.length === 0) return "Invalid Input";

            autoIndex++;

            const pair = {
                accessToken: "AT-" + autoIndex + "-" + userId,
                refreshToken: "RT-" + autoIndex + "-" + userId,
                accessTokenExpiresAt: 1000000 + accessTokenTTLMs,
                refreshTokenExpiresAt: 1000000 + refreshTokenTTLMs,
                userId,
                issuedAt: 1000000,
                status: "ACTIVE",
                metadata: metadata && typeof metadata === "object" ? metadata : {}
            };

            tokenPairs.push(pair);

            history.push({ event: "LOGIN", timestamp: "2025-01-01T00:00:00Z", tokenId: pair.refreshToken });

            return {
                tokenPair: {
                    accessToken: pair.accessToken,
                    refreshToken: pair.refreshToken,
                    accessTokenExpiresAt: pair.accessTokenExpiresAt,
                    refreshTokenExpiresAt: pair.refreshTokenExpiresAt,
                    userId: pair.userId,
                    issuedAt: pair.issuedAt
                },
                userId,
                loginAt: "2025-01-01T00:00:00Z"
            };
        },

        refresh(refreshToken, currentTimeMs) {

            if (typeof refreshToken !== "string" || refreshToken.length === 0) return "Invalid Input";

            const pair = tokenPairs.find(p => p.refreshToken === refreshToken);

            if (!pair) return { error: "TOKEN_NOT_FOUND" };

            if (pair.status === "REPLACED") return { error: "TOKEN_REPLACED" };

            if (pair.status === "REVOKED") return { error: "TOKEN_REVOKED" };

            if (currentTimeMs > pair.refreshTokenExpiresAt) return { error: "TOKEN_EXPIRED" };

            const userId = pair.userId;

            if (rotateOnUse) {

                pair.status = "REPLACED";

                autoIndex++;

                const newPair = {
                    accessToken: "AT-" + autoIndex + "-" + userId,
                    refreshToken: "RT-" + autoIndex + "-" + userId,
                    accessTokenExpiresAt: 1000000 + accessTokenTTLMs,
                    refreshTokenExpiresAt: 1000000 + refreshTokenTTLMs,
                    userId,
                    issuedAt: 1000000,
                    status: "ACTIVE",
                    metadata: pair.metadata
                };

                tokenPairs.push(newPair);

                history.push({ event: "REFRESH", timestamp: "2025-01-01T00:00:00Z", tokenId: newPair.refreshToken });

                return {
                    newTokenPair: {
                        accessToken: newPair.accessToken,
                        refreshToken: newPair.refreshToken,
                        accessTokenExpiresAt: newPair.accessTokenExpiresAt,
                        refreshTokenExpiresAt: newPair.refreshTokenExpiresAt,
                        userId,
                        issuedAt: newPair.issuedAt
                    },
                    oldRefreshToken: refreshToken,
                    rotated: true
                };
            }

            // rotateOnUse=false: new AT only, same RT.

            const newAccessToken = "AT-" + autoIndex + "-" + userId;

            pair.accessToken = newAccessToken;
            pair.accessTokenExpiresAt = 1000000 + accessTokenTTLMs;

            history.push({ event: "REFRESH", timestamp: "2025-01-01T00:00:00Z", tokenId: pair.refreshToken });

            return {
                newAccessToken,
                refreshToken: pair.refreshToken,
                rotated: false
            };
        },

        logout(refreshToken) {

            if (typeof refreshToken !== "string" || refreshToken.length === 0) return "Invalid Input";

            const pair = tokenPairs.find(p => p.refreshToken === refreshToken);

            if (!pair) return { error: "TOKEN_NOT_FOUND" };

            pair.status = "REVOKED";

            history.push({ event: "LOGOUT", timestamp: "2025-01-01T00:00:00Z", tokenId: pair.refreshToken });

            return { loggedOut: true, userId: pair.userId };
        },

        getTokenPair(refreshToken) {

            if (typeof refreshToken !== "string" || refreshToken.length === 0) return "Invalid Input";

            const pair = tokenPairs.find(p => p.refreshToken === refreshToken);

            if (!pair) return { error: "Not found" };

            return {
                refreshToken: pair.refreshToken,
                accessToken: pair.accessToken,
                userId: pair.userId,
                status: pair.status,
                expiresAt: pair.refreshTokenExpiresAt
            };
        },

        getRotationHistory(userId) {

            if (typeof userId !== "string" || userId.length === 0) return "Invalid Input";

            const relevant = tokenPairs.filter(p => p.userId === userId).map(p => p.refreshToken);

            return history.filter(h => relevant.includes(h.tokenId));
        }
    };
}



// ------ EXAMPLE USAGE ------

const engine = createTokenRotationEngine({
    accessTokenTTLMs: 900000,   // 15 min
    refreshTokenTTLMs: 86400000, // 24 hours
    rotateOnUse: true
});


console.log(engine.login("U1", { device: "chrome" }));

console.log(engine.refresh("RT-1-U1", 1500000));

console.log(engine.refresh("RT-1-U1", 1600000));

console.log(engine.getRotationHistory("U1"));


// --- INVALID ---
console.log(createTokenRotationEngine({ accessTokenTTLMs: 0, refreshTokenTTLMs: 0, rotateOnUse: "yes" }));