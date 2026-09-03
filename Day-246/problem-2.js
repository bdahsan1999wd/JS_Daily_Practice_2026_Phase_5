// 🧩 PROBLEM–02: createAPIKeyStore()

// Logic: API key storage with expiry, revocation, owner limits, stats.
//   store() — enforce maxKeysPerOwner, apply default expiry when expiresAt null
//   validate() — status + expiry, update lastUsedAt/usageCount on success


function createAPIKeyStore(storeConfig) {

    // --- STEP 1: VALIDATE inputs ---
    if (
        typeof storeConfig !== "object" ||
        storeConfig === null ||
        Array.isArray(storeConfig) ||
        typeof storeConfig.defaultExpiryMs !== "number" ||
        storeConfig.defaultExpiryMs <= 0 ||
        typeof storeConfig.maxKeysPerOwner !== "number" ||
        !Number.isInteger(storeConfig.maxKeysPerOwner) ||
        storeConfig.maxKeysPerOwner < 1
    ) {
        return "Invalid Input";
    }

    const defaultExpiryMs  = storeConfig.defaultExpiryMs;
    const maxKeysPerOwner  = storeConfig.maxKeysPerOwner;

    const keys = [];

    // --- STEP 2: HELPERS ---
    function findKey(key) {
        return keys.find(k => k.key === key);
    }

    // --- STEP 3: PUBLIC API ---
    return {

        store(keyData) {

            if (typeof keyData !== "object" || keyData === null || Array.isArray(keyData)) {
                return "Invalid Input";
            }

            if (typeof keyData.key !== "string" || keyData.key.length === 0) return "Invalid Input";

            const activeCount = keys.filter(k => k.ownerId === keyData.ownerId && k.status === "ACTIVE").length;

            if (activeCount >= maxKeysPerOwner) {
                return { stored: false, reason: "Max keys reached for owner" };
            }

            const record = {
                key: keyData.key,
                keyId: keyData.keyId,
                ownerId: keyData.ownerId,
                scopes: Array.isArray(keyData.scopes) ? keyData.scopes : [],
                expiresAt: keyData.expiresAt !== null && keyData.expiresAt !== undefined
                    ? keyData.expiresAt
                    : 1000000 + defaultExpiryMs,
                status: "ACTIVE",
                revokedReason: null,
                createdAt: keyData.createdAt || "2025-01-01T00:00:00Z",
                lastUsedAt: null,
                usageCount: 0
            };

            keys.push(record);

            return { stored: true, keyId: record.keyId, expiresAt: record.expiresAt };
        },

        retrieve(key) {

            if (typeof key !== "string" || key.length === 0) return "Invalid Input";

            const entry = findKey(key);

            if (!entry) return { error: "Key not found" };

            return { ...entry };
        },

        validate(key, currentTimeMs) {

            if (typeof key !== "string" || key.length === 0) return "Invalid Input";

            const entry = findKey(key);

            if (!entry) return { valid: false, reason: "KEY_NOT_FOUND" };

            if (entry.status === "REVOKED") {
                return { valid: false, reason: "KEY_REVOKED", revokedReason: entry.revokedReason };
            }

            if (entry.expiresAt !== null && currentTimeMs > entry.expiresAt) {
                entry.status = "EXPIRED";
                return { valid: false, reason: "KEY_EXPIRED" };
            }

            entry.lastUsedAt = currentTimeMs;
            entry.usageCount++;

            return { valid: true, keyId: entry.keyId, ownerId: entry.ownerId, scopes: entry.scopes };
        },

        revoke(key, reason) {

            if (typeof key !== "string" || key.length === 0) return "Invalid Input";

            const entry = findKey(key);

            if (!entry) return { error: "Key not found" };

            entry.status = "REVOKED";
            entry.revokedReason = reason || null;

            return { revoked: true, key, reason: reason || null };
        },

        listByOwner(ownerId) {

            if (typeof ownerId !== "string" || ownerId.length === 0) return "Invalid Input";

            const ownerKeys = keys.filter(k => k.ownerId === ownerId);

            return {
                ownerId,
                keys: ownerKeys.map(k => ({ ...k })),
                totalCount: ownerKeys.length,
                activeCount: ownerKeys.filter(k => k.status === "ACTIVE").length
            };
        },

        getStoreStats() {

            return {
                totalKeys: keys.length,
                active: keys.filter(k => k.status === "ACTIVE").length,
                revoked: keys.filter(k => k.status === "REVOKED").length,
                expired: keys.filter(k => k.status === "EXPIRED").length,
                uniqueOwners: new Set(keys.map(k => k.ownerId)).size
            };
        }
    };
}


// ------ EXAMPLE USAGE ------

const store = createAPIKeyStore({ defaultExpiryMs: 2592000000, maxKeysPerOwner: 5 });

console.log(store.store({
    key: "sk_live_abc123",
    keyId: "KEY-1",
    ownerId: "U1",
    scopes: ["read:data", "write:data"],
    expiresAt: null,
    createdAt: "2025-01-01T00:00:00Z"
}));


console.log(store.validate("sk_live_abc123", 1000000));

console.log(store.validate("sk_live_abc123", 9999999999));

console.log(store.revoke("sk_live_abc123", "Security breach suspected"));

console.log(store.getStoreStats());

// --- INVALID ---
console.log(createAPIKeyStore({ defaultExpiryMs: 0, maxKeysPerOwner: 0 }));