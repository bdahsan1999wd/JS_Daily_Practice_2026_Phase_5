// 🧩 PROBLEM–01: buildAuthSystem()

// Logic: Full auth pipeline. Password hashing + JWT (simulated).
//   Processes REGISTER / LOGIN / VERIFY_TOKEN events against a user store.

const __authReverse = (s) => s.split("").reverse().join("");


function __authHash(password) {
    return "hash_" + __authReverse(password) + "_" + password.length;
}

function __authVerify(password, hash) {
    return hash === "hash_" + __authReverse(password) + "_" + password.length;
}

function __charCodeSum(str) {
    let sum = 0;
    for (let i = 0; i < str.length; i++) sum += str.charCodeAt(i);
    return sum;
}

function __generateToken(userId, role, secret, expiryMs) {
    const encodedPayload = "jwt_" + userId + "_" + role + "_" + (1000000 + expiryMs);
    const signature = "sig_" + __charCodeSum(encodedPayload + secret).toString(16);
    return encodedPayload + "." + signature;
}

function __verifyToken(token, secret) {
    const parts = String(token).split(".");
    if (parts.length !== 2) {
        return { valid: false, userId: null, role: null, expired: false };
    }

    const encodedPayload = parts[0];
    const signature = parts[1];

    const expected = "sig_" + __charCodeSum(encodedPayload + secret).toString(16);
    if (signature !== expected) {
        return { valid: false, userId: null, role: null, expired: false };
    }

    const seg = encodedPayload.replace(/^jwt_/, "").split("_");
    const userId = seg[0] || null;
    const role = seg[1] || null;
    const exp = Number(seg[2]) || 0;

    const expired = exp <= 1000000;

    return { valid: true, userId, role, expired };
}

function __checkPasswordPolicy(password, policy) {
    const violations = [];

    if (typeof password !== "string" || password.length < policy.minLength) {
        violations.push("Password must be at least " + policy.minLength + " characters");
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
        violations.push("Password must contain at least one uppercase letter");
    }

    if (policy.requireNumbers && !/[0-9]/.test(password)) {
        violations.push("Password must contain at least one number");
    }

    if (policy.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
        violations.push("Password must contain at least one special character");
    }

    return { valid: violations.length === 0, violations };
}


function buildAuthSystem(authBlueprint) {

    // --- STEP 1: VALIDATE ---
    if (
        typeof authBlueprint !== "object" ||
        authBlueprint === null ||
        Array.isArray(authBlueprint) ||
        !Array.isArray(authBlueprint.users) ||
        typeof authBlueprint.jwtSecret !== "string" ||
        authBlueprint.jwtSecret.length === 0 ||
        typeof authBlueprint.jwtExpiryMs !== "number" ||
        authBlueprint.jwtExpiryMs <= 0 ||
        typeof authBlueprint.passwordPolicy !== "object" ||
        authBlueprint.passwordPolicy === null ||
        Array.isArray(authBlueprint.passwordPolicy) ||
        !Array.isArray(authBlueprint.authEvents)
    ) {
        return "Invalid Input";
    }

    const jwtSecret = authBlueprint.jwtSecret;
    const jwtExpiryMs = authBlueprint.jwtExpiryMs;
    const passwordPolicy = authBlueprint.passwordPolicy;

    // --- STEP 2: INITIALIZE USER STORE ---
    const userStore = [];

    for (const user of authBlueprint.users) {
        userStore.push({
            userId: user.userId,
            role: user.role,
            passwordHash: __authHash(user.password)
        });
    }

    function findUser(userId) {
        return userStore.find(u => u.userId === userId);
    }

    // --- STEP 3: PROCESS EVENTS ---
    const eventLog = [];

    for (const event of authBlueprint.authEvents) {

        let result;

        if (event.type === "REGISTER") {

            const policyResult = __checkPasswordPolicy(event.password, passwordPolicy);

            if (!policyResult.valid) {
                result = { success: false, violations: policyResult.violations };
            } else {
                const passwordHash = __authHash(event.password);
                if (!findUser(event.userId)) {
                    userStore.push({
                        userId: event.userId,
                        role: "USER",
                        passwordHash
                    });
                } else {
                    findUser(event.userId).passwordHash = passwordHash;
                }
                result = { success: true, userId: event.userId, passwordHash };
            }

        } else if (event.type === "LOGIN") {

            const user = findUser(event.userId);

            if (!user || !__authVerify(event.password, user.passwordHash)) {
                result = { success: false, reason: "INVALID_CREDENTIALS" };
            } else {
                const token = __generateToken(event.userId, user.role, jwtSecret, jwtExpiryMs);
                result = {
                    success: true,
                    userId: event.userId,
                    token,
                    expiresAt: 1000000 + jwtExpiryMs
                };
            }

        } else if (event.type === "VERIFY_TOKEN") {

            const verified = __verifyToken(event.token, jwtSecret);

            if (!verified.valid) {
                result = { success: false, userId: null, role: null, reason: "INVALID_TOKEN" };
            } else if (verified.expired) {
                result = { success: false, userId: verified.userId, role: verified.role, reason: "EXPIRED_TOKEN" };
            } else {
                result = { success: true, userId: verified.userId, role: verified.role, reason: null };
            }

        } else {
            continue;
        }

        eventLog.push({ eventId: event.eventId, type: event.type, result });
    }

    // --- STEP 4: SUMMARY ---
    const successCount = eventLog.filter(e => e.result.success === true).length;

    return {
        eventLog,
        summary: {
            totalEvents: eventLog.length,
            successCount,
            failureCount: eventLog.length - successCount
        },
        userStore
    };
}


// ------ EXAMPLE USAGE ------
console.log(JSON.stringify(buildAuthSystem({
    users: [],
    jwtSecret: "secret-2025",
    jwtExpiryMs: 3600000,
    passwordPolicy: { minLength: 8, requireUppercase: true, requireNumbers: true, requireSpecialChars: false },
    authEvents: [
        { eventId: "E1", type: "REGISTER", userId: "U1", password: "Secure123", token: null },
        { eventId: "E2", type: "LOGIN", userId: "U1", password: "Secure123", token: null },
        { eventId: "E3", type: "VERIFY_TOKEN", userId: null, password: null, token: "jwt_U1_USER_3601000000.sig_" + __charCodeSum("jwt_U1_USER_3601000000secret-2025").toString(16) }
    ]
}), null, 2));


// --- INVALID ---
console.log(buildAuthSystem(null));