// 🧩 PROBLEM–01: createAPIKeyGenerator()

// Logic: Deterministic simulated API key generation.
//   Key format: {prefix}_{environment}_{randomPart}
//   charIndex = (autoSeed * 7 + position * 13) % charsetLength, autoSeed increments per call.


function createAPIKeyGenerator(generatorConfig) {

    // --- STEP 1: VALIDATE inputs ---
    const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    if (
        typeof generatorConfig !== "object" ||
        generatorConfig === null ||
        Array.isArray(generatorConfig) ||
        typeof generatorConfig.prefix !== "string" ||
        generatorConfig.prefix.length === 0 ||
        typeof generatorConfig.keyLength !== "number" ||
        !Number.isInteger(generatorConfig.keyLength) ||
        generatorConfig.keyLength < 16 ||
        generatorConfig.keyLength > 64 ||
        !["live", "test"].includes(generatorConfig.environment)
    ) {
        return "Invalid Input";
    }

    const prefix = generatorConfig.prefix;
    const keyLength = generatorConfig.keyLength;
    const environment = generatorConfig.environment;

    const generatedKeys = [];

    let autoSeed = 0;
    let autoIndex = 0;

    // --- STEP 2: HELPERS ---
    function generateRandomPart() {
        autoSeed++;
        let part = "";
        for (let i = 0; i < keyLength; i++) {
            const charIndex = (autoSeed * 7 + i * 13) % CHARSET.length;
            part += CHARSET[charIndex];
        }
        return part;
    }

    // --- STEP 3: PUBLIC API ---
    return {

        generate(ownerId, metadata) {

            if (typeof ownerId !== "string" || ownerId.length === 0) return "Invalid Input";

            autoIndex++;

            const randomPart = generateRandomPart();

            const key = prefix + "_" + environment + "_" + randomPart;

            const record = {
                key,
                keyId: "KEY-" + autoIndex,
                ownerId,
                prefix,
                environment,
                createdAt: "2025-01-01T00:00:00Z",
                metadata: metadata && typeof metadata === "object" ? metadata : {}
            };

            generatedKeys.push(record);

            return record;
        },

        generatePair() {

            // Public key uses "pk" prefix, secret key uses "sk" prefix.

            autoIndex++;

            const pkPart = generateRandomPart();
            const skPart = generateRandomPart();

            const publicKey = {
                key: "pk_" + environment + "_" + pkPart,
                keyId: "KEY-" + autoIndex
            };

            autoIndex++;

            const secretKey = {
                key: "sk_" + environment + "_" + skPart,
                keyId: "KEY-" + autoIndex
            };

            generatedKeys.push({
                key: publicKey.key,
                keyId: publicKey.keyId,
                ownerId: "PAIRED",
                prefix: "pk",
                environment,
                createdAt: "2025-01-01T00:00:00Z",
                metadata: {}
            });

            generatedKeys.push({
                key: secretKey.key,
                keyId: secretKey.keyId,
                ownerId: "PAIRED",
                prefix: "sk",
                environment,
                createdAt: "2025-01-01T00:00:00Z",
                metadata: {}
            });

            return {
                publicKey,
                secretKey,
                pairedAt: "2025-01-01T00:00:00Z"
            };
        },

        parseKey(key) {

            if (typeof key !== "string" || key.length === 0) return "Invalid Input";

            const parts = key.split("_");

            if (parts.length !== 3) return { error: "Invalid key format" };

            const [keyPrefix, keyEnv, randomPart] = parts;

            if (!keyPrefix || !keyEnv || !randomPart) return { error: "Invalid key format" };

            return {
                prefix: keyPrefix,
                environment: keyEnv,
                randomPart,
                isValid: true
            };
        },

        getGeneratedKeys() {
            return generatedKeys.map(record => ({
                keyId: record.keyId,
                ownerId: record.ownerId,
                prefix: record.prefix,
                environment: record.environment,
                createdAt: record.createdAt
            }));
        }
    };
}


// ------ EXAMPLE USAGE ------

const gen = createAPIKeyGenerator({ prefix: "sk", keyLength: 32, environment: "live" });

console.log(gen.generate("USER-1", { name: "My App", description: "Production key" }));

const { key } = gen.generate("USER-1", {});
console.log(gen.parseKey(key));

console.log(gen.parseKey("invalid-key-format"));

console.log(gen.getGeneratedKeys());


// --- INVALID ---
console.log(createAPIKeyGenerator({ prefix: "", keyLength: 8, environment: "prod" }));