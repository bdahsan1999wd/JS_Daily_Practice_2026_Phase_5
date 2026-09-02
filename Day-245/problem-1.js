// 🧩 PROBLEM–01: createSaltGenerator()

// Logic: Deterministic simulated salt generation.
//   charIndex = (autoSeed * 7 + position * 13) % charsetLength
//   autoSeed starts at 1, increments per generate() call.


function createSaltGenerator(saltConfig) {

    // --- STEP 1: VALIDATE inputs ---

    const CHARSETS = {
        alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        hex: "0123456789abcdef",
        base64: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    };

    if (
        typeof saltConfig !== "object" ||
        saltConfig === null ||
        Array.isArray(saltConfig) ||
        typeof saltConfig.saltLength !== "number" ||
        !Number.isInteger(saltConfig.saltLength) ||
        saltConfig.saltLength < 8 ||
        saltConfig.saltLength > 32 ||
        typeof saltConfig.charset !== "string" ||
        !CHARSETS.hasOwnProperty(saltConfig.charset)
    ) {
        return "Invalid Input";
    }

    const saltLength = saltConfig.saltLength;
    const charset = saltConfig.charset;
    const charsetStr = CHARSETS[charset];

    let autoSeed = 0;
    let totalGenerated = 0;
    let lastGeneratedAt = null;

    // --- STEP 2: HELPERS ---

    function generateSalt() {
        autoSeed++;
        let salt = "";
        for (let i = 0; i < saltLength; i++) {
            const charIndex = (autoSeed * 7 + i * 13) % charsetStr.length;
            salt += charsetStr[charIndex];
        }
        return salt;
    }

    // --- STEP 3: PUBLIC API ---

    return {

        generate() {
            const salt = generateSalt();
            totalGenerated++;
            lastGeneratedAt = "2025-01-01T00:00:00Z";
            return { salt, length: saltLength, charset, generatedAt: "2025-01-01T00:00:00Z" };
        },

        generateBatch(count) {

            if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || count > 100) {
                return "Invalid Input";
            }

            const salts = [];

            for (let i = 0; i < count; i++) {
                salts.push(generateSalt());
                totalGenerated++;
            }

            lastGeneratedAt = "2025-01-01T00:00:00Z";

            return { salts, count, charset };
        },

        validate(salt) {

            if (typeof salt !== "string") return "Invalid Input";

            const invalidChars = [];

            for (const ch of salt) {
                if (!charsetStr.includes(ch) && !invalidChars.includes(ch)) {
                    invalidChars.push(ch);
                }
            }

            return {
                valid: salt.length === saltLength && invalidChars.length === 0,
                length: salt.length,
                expectedLength: saltLength,
                invalidChars
            };
        },

        getStats() {
            return {
                totalGenerated,
                charset,
                saltLength,
                lastGeneratedAt
            };
        }
    };
}


// ------ EXAMPLE USAGE ------

const sg = createSaltGenerator({ saltLength: 16, charset: "hex" });


console.log(sg.generate());

console.log(sg.generate());

console.log(sg.validate("7419c6af38e52b0d"));

console.log(sg.validate("ZZZZ"));

console.log(sg.getStats());

console.log(sg.generateBatch(3));


// --- INVALID ---
console.log(createSaltGenerator({ saltLength: 5, charset: "hex" }));

console.log(createSaltGenerator({ saltLength: 16, charset: "emoji" }));