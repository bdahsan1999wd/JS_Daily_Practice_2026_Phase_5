// 🧩 PROBLEM–02: createPasswordHasher()

// Logic: Simulated password hashing.
//   Hash format: $algorithm$cost$salt$hashValue
//   hashValue = algorithmPrefix + "_" + reverse(password+salt) + "_" + hex(sumOfCharCode      (password+salt)) + "_" + costFactor

//   Salt uses Problem-01 hex logic.


function createSaltGeneratorForHasher(saltLength) {

    const CHARSET = "0123456789abcdef";
    let autoSeed = 0;

    return {
        generate() {
            autoSeed++;
            let salt = "";
            for (let i = 0; i < saltLength; i++) {
                const charIndex = (autoSeed * 7 + i * 13) % CHARSET.length;
                salt += CHARSET[charIndex];
            }
            return salt;
        }
    };
}

function createPasswordHasher(hasherConfig) {

    // --- STEP 1: VALIDATE inputs ---

    const ALGORITHMS = { "bcrypt-sim": "bc", "argon2-sim": "ar", "pbkdf2-sim": "pb" };

    if (
        typeof hasherConfig !== "object" ||
        hasherConfig === null ||
        Array.isArray(hasherConfig) ||
        typeof hasherConfig.algorithm !== "string" ||
        !ALGORITHMS.hasOwnProperty(hasherConfig.algorithm) ||
        typeof hasherConfig.costFactor !== "number" ||
        !Number.isInteger(hasherConfig.costFactor) ||
        hasherConfig.costFactor < 4 ||
        hasherConfig.costFactor > 14 ||
        typeof hasherConfig.saltLength !== "number" ||
        !Number.isInteger(hasherConfig.saltLength) ||
        hasherConfig.saltLength < 8 ||
        hasherConfig.saltLength > 32
    ) {
        return "Invalid Input";
    }

    const algorithm = hasherConfig.algorithm;
    const costFactor = hasherConfig.costFactor;
    const saltLength = hasherConfig.saltLength;
    const algoPrefix = ALGORITHMS[algorithm];

    const saltGen = createSaltGeneratorForHasher(saltLength);

    // --- STEP 2: HELPERS ---

    function computeHashValue(password, salt) {

        const combined = password + salt;

        const reversed = combined.split("").reverse().join("");

        let sum = 0;

        for (const ch of combined) {
            sum += ch.charCodeAt(0);
        }

        return algoPrefix + "_" + reversed + "_" + sum.toString(16) + "_" + costFactor;
    }

    function buildHashString(password, salt) {
        return "$" + algorithm + "$" + costFactor + "$" + salt + "$" + computeHashValue(password, salt);
    }

    function parseHash(storedHash) {

        if (typeof storedHash !== "string") return null;

        const parts = storedHash.split("$");

        // ["", algorithm, cost, salt, hashValue]

        if (parts.length !== 5) return null;

        const [, alg, cost, salt, hashValue] = parts;

        if (!alg || !/^\d+$/.test(cost) || !salt || !hashValue) return null;

        return { algorithm: alg, costFactor: Number(cost), salt, hashValue };
    }

    // --- STEP 3: PUBLIC API ---

    return {

        hash(password) {

            if (typeof password !== "string" || password.length === 0) return "Invalid Input";

            const salt = saltGen.generate();

            const hash = buildHashString(password, salt);

            return {
                hash,
                algorithm,
                costFactor,
                salt,
                computedAt: "2025-01-01T00:00:00Z"
            };
        },

        hashWithSalt(password, salt) {

            if (typeof password !== "string" || password.length === 0) return "Invalid Input";
            if (typeof salt !== "string" || salt.length === 0) return "Invalid Input";

            const hash = buildHashString(password, salt);

            return {
                hash,
                algorithm,
                costFactor,
                salt,
                computedAt: "2025-01-01T00:00:00Z"
            };
        },

        verify(password, storedHash) {

            if (typeof password !== "string" || password.length === 0) return "Invalid Input";

            const parsed = parseHash(storedHash);

            if (!parsed) return { verified: false, algorithm: null, costFactor: null };

            const recomputed = buildHashString(password, parsed.salt);

            return {
                verified: recomputed === storedHash,
                algorithm: parsed.algorithm,
                costFactor: parsed.costFactor
            };
        },

        needsRehash(storedHash, newCostFactor) {

            if (typeof newCostFactor !== "number") return "Invalid Input";

            const parsed = parseHash(storedHash);

            if (!parsed) return { needsRehash: false, reason: null, currentCost: null, targetCost: newCostFactor };

            let needsRehash = false;
            let reason = null;

            if (parsed.algorithm !== algorithm) {
                needsRehash = true;
                reason = "ALGORITHM_CHANGED";
            } else if (parsed.costFactor < newCostFactor) {
                needsRehash = true;
                reason = "COST_FACTOR_UPGRADED";
            }

            return {
                needsRehash,
                reason,
                currentCost: parsed.costFactor,
                targetCost: newCostFactor
            };
        },

        getHashInfo(storedHash) {

            const parsed = parseHash(storedHash);

            if (!parsed) return { error: "Invalid hash format" };

            return {
                algorithm: parsed.algorithm,
                costFactor: parsed.costFactor,
                saltLength: parsed.salt.length,
                hashLength: parsed.hashValue.length
            };
        }
    };
}



// ------ EXAMPLE USAGE ------

const hasher = createPasswordHasher({ algorithm: "bcrypt-sim", costFactor: 10, saltLength: 16 });


const result = hasher.hash("mySecurePassword123");
console.log(result);

console.log(hasher.verify("mySecurePassword123", result.hash));

console.log(hasher.verify("wrongPassword", result.hash));

console.log(hasher.needsRehash(result.hash, 12));

console.log(hasher.needsRehash(result.hash, 10));

console.log(hasher.getHashInfo(result.hash));


// --- INVALID ---
console.log(createPasswordHasher({ algorithm: "md5", costFactor: 10, saltLength: 16 }));

console.log(hasher.hash(""));