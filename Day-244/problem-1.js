// 🧩 PROBLEM–01: createRefreshTokenStore()

// Logic: Refresh token store with TTL, FIFO eviction, validate/revoke/stats.
//   issue() — enforce maxTokensPerUser by revoking oldest active token first
//   validate() — check status + expiry (updates EXPIRED on the fly)
//   Token format: "RT-" + autoIndex + "-" + userId


function createRefreshTokenStore(storeConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof storeConfig !== "object" ||
        storeConfig === null ||
        Array.isArray(storeConfig) ||
        typeof storeConfig.tokenTTLMs !== "number" ||
        storeConfig.tokenTTLMs <= 0 ||
        typeof storeConfig.maxTokensPerUser !== "number" ||
        !Number.isInteger(storeConfig.maxTokensPerUser) ||
        storeConfig.maxTokensPerUser < 1
    ) {
        return "Invalid Input";
    }

    const tokenTTLMs = storeConfig.tokenTTLMs;
    const maxTokensPerUser = storeConfig.maxTokensPerUser;

    const tokens = [];

    let autoIndex = 0;

    // --- STEP 2: HELPERS ---

    function activeTokensForUser(userId) {
        return tokens.filter(t => t.userId === userId && t.status === "ACTIVE");
    }

    // --- STEP 3: PUBLIC API ---

    return {

        issue(userId, metadata) {

            if (typeof userId !== "string" || userId.length === 0) return "Invalid Input";

            const meta = metadata && typeof metadata === "object" ? metadata : {};

            // FIFO eviction: revoke oldest active token if at limit.

            const actives = activeTokensForUser(userId);

            while (actives.length >= maxTokensPerUser) {

                const oldest = actives[0];

                oldest.status = "REVOKED";

                actives.shift();
            }

            autoIndex++;

            const token = {
                token: "RT-" + autoIndex + "-" + userId,
                userId,
                issuedAt: 1000000,
                expiresAt: 1000000 + tokenTTLMs,
                metadata: { ...meta },
                status: "ACTIVE"
            };

            tokens.push(token);

            return {
                token: token.token,
                userId,
                expiresAt: token.expiresAt,
                issuedAt: token.issuedAt,
                metadata: token.metadata
            };
        },

        validate(token, currentTimeMs) {

            if (typeof token !== "string" || token.length === 0) return "Invalid Input";

            const entry = tokens.find(t => t.token === token);

            if (!entry) return { valid: false, reason: "TOKEN_NOT_FOUND" };

            if (entry.status === "REVOKED") return { valid: false, reason: "TOKEN_REVOKED" };

            if (entry.status === "REPLACED") return { valid: false, reason: "TOKEN_REPLACED" };

            if (currentTimeMs > entry.expiresAt) {
                entry.status = "EXPIRED";
                return { valid: false, reason: "TOKEN_EXPIRED" };
            }

            return {
                valid: true,
                userId: entry.userId,
                metadata: entry.metadata,
                expiresAt: entry.expiresAt
            };
        },

        revoke(token) {

            if (typeof token !== "string" || token.length === 0) return "Invalid Input";

            const entry = tokens.find(t => t.token === token);

            if (!entry) return { error: "Token not found" };

            entry.status = "REVOKED";

            return { revoked: true, token };
        },

        revokeAllForUser(userId) {

            if (typeof userId !== "string" || userId.length === 0) return "Invalid Input";

            let revokedCount = 0;

            for (const t of tokens) {
                if (t.userId === userId && t.status === "ACTIVE") {
                    t.status = "REVOKED";
                    revokedCount++;
                }
            }

            return { revokedCount, userId };
        },

        getActiveTokens(userId) {

            if (typeof userId !== "string" || userId.length === 0) return "Invalid Input";

            const active = tokens.filter(t => t.userId === userId && t.status === "ACTIVE");

            return { userId, tokens: active.map(t => ({ ...t })), count: active.length };
        },

        getStoreStats() {

            const totalIssued = tokens.length;
            const active = tokens.filter(t => t.status === "ACTIVE").length;
            const revoked = tokens.filter(t => t.status === "REVOKED").length;
            const expired = tokens.filter(t => t.status === "EXPIRED").length;
            const replaced = tokens.filter(t => t.status === "REPLACED").length;
            const uniqueUsers = new Set(tokens.map(t => t.userId)).size;

            return { totalIssued, active, revoked, expired, replaced, uniqueUsers };
        }
    };
}



// ------ EXAMPLE USAGE ------

const store = createRefreshTokenStore({ tokenTTLMs: 86400000, maxTokensPerUser: 2 });


console.log(store.issue("U1", { device: "mobile", ip: "192.168.1.1" }));

console.log(store.issue("U1", { device: "desktop", ip: "192.168.1.2" }));

console.log(store.issue("U1", { device: "tablet", ip: "192.168.1.3" }));

console.log(store.validate("RT-1-U1", 1001000));

console.log(store.validate("RT-2-U1", 1001000));

console.log(store.validate("RT-2-U1", 9999999999));

console.log(store.getStoreStats());


// --- INVALID ---
console.log(createRefreshTokenStore({ tokenTTLMs: 0, maxTokensPerUser: 0 }));