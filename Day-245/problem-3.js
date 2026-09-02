// 🧩 PROBLEM–03: createPasswordPolicyEngine()

// Logic: Password policy enforcement.
//   validate() — collect all violations + passed checks
//   calculateStrength() — score 0-100 with label + breakdown
//   generateSuggestions() — missing-requirement based advice
//   checkHistory() — reuse against previous hashes via hasher.verify()


function createPasswordPolicyEngine(policyConfig) {

    // --- STEP 1: VALIDATE inputs ---
    if (
        typeof policyConfig !== "object" ||
        policyConfig === null ||
        Array.isArray(policyConfig) ||
        typeof policyConfig.minLength !== "number" ||
        !Number.isInteger(policyConfig.minLength) ||
        policyConfig.minLength < 1 ||
        typeof policyConfig.maxLength !== "number" ||
        !Number.isInteger(policyConfig.maxLength) ||
        policyConfig.maxLength < policyConfig.minLength ||
        typeof policyConfig.requireUppercase !== "boolean" ||
        typeof policyConfig.requireLowercase !== "boolean" ||
        typeof policyConfig.requireNumbers !== "boolean" ||
        typeof policyConfig.requireSpecialChars !== "boolean" ||
        typeof policyConfig.specialChars !== "string" ||
        !Array.isArray(policyConfig.forbiddenPatterns) ||
        typeof policyConfig.minUniqueChars !== "number" ||
        !Number.isInteger(policyConfig.minUniqueChars) ||
        policyConfig.minUniqueChars < 1
    ) {
        return "Invalid Input";
    }

    const minLength = policyConfig.minLength;
    const maxLength = policyConfig.maxLength;
    const requireUppercase = policyConfig.requireUppercase;
    const requireLowercase = policyConfig.requireLowercase;
    const requireNumbers = policyConfig.requireNumbers;
    const requireSpecialChars = policyConfig.requireSpecialChars;
    const specialChars = policyConfig.specialChars;
    const forbiddenPatterns = policyConfig.forbiddenPatterns;
    const minUniqueChars = policyConfig.minUniqueChars;


    // --- STEP 2: HELPERS ---
    function hasUppercase(pw) { return /[A-Z]/.test(pw); }
    function hasLowercase(pw) { return /[a-z]/.test(pw); }
    function hasNumbers(pw) { return /[0-9]/.test(pw); }
    function hasSpecial(pw) { return pw.split("").some(ch => specialChars.includes(ch)); }
    function uniqueChars(pw) { return new Set(pw.split("")).size; }

    function findForbiddenPattern(pw) {
        for (const pattern of forbiddenPatterns) {
            if (pw.toLowerCase().includes(pattern.toLowerCase())) {
                return pattern;
            }
        }
        return null;
    }


    // --- STEP 3: PUBLIC API ---
    return {

        validate(password) {

            if (typeof password !== "string") return "Invalid Input";

            const violations = [];
            const passedChecks = [];

            if (password.length >= minLength) {
                passedChecks.push("Length OK");
            } else {
                violations.push("Too short: minimum " + minLength + " characters");
            }

            if (password.length <= maxLength) {
                passedChecks.push("Max length OK");
            } else {
                violations.push("Too long: maximum " + maxLength + " characters");
            }

            if (requireUppercase) {
                if (hasUppercase(password)) passedChecks.push("Has uppercase");
                else violations.push("Missing uppercase letter");
            }

            if (requireLowercase) {
                if (hasLowercase(password)) passedChecks.push("Has lowercase");
                else violations.push("Missing lowercase letter");
            }

            if (requireNumbers) {
                if (hasNumbers(password)) passedChecks.push("Has numbers");
                else violations.push("Missing number");
            }

            if (requireSpecialChars) {
                if (hasSpecial(password)) passedChecks.push("Has special chars");
                else violations.push("Missing special character");
            }

            const forbidden = findForbiddenPattern(password);

            if (forbidden) {
                violations.push("Contains forbidden pattern: " + forbidden);
            } else {
                passedChecks.push("No forbidden patterns");
            }

            if (uniqueChars(password) >= minUniqueChars) {
                passedChecks.push("Sufficient unique chars");
            } else {
                violations.push("Not enough unique characters: minimum " + minUniqueChars);
            }

            return { valid: violations.length === 0, violations, passedChecks };
        },

        calculateStrength(password) {

            if (typeof password !== "string") return "Invalid Input";

            let lengthPoints = 0;
            if (password.length >= 16) lengthPoints = 30;
            else if (password.length >= 12) lengthPoints = 20;
            else if (password.length >= 8) lengthPoints = 10;

            const upper = hasUppercase(password) ? 10 : 0;
            const lower = hasLowercase(password) ? 10 : 0;
            const numbers = hasNumbers(password) ? 10 : 0;
            const special = hasSpecial(password) ? 20 : 0;

            const uc = uniqueChars(password);
            let uniqueness = 0;
            if (uc >= 12) uniqueness = 20;
            else if (uc >= 8) uniqueness = 10;

            const score = lengthPoints + upper + lower + numbers + special + uniqueness;

            let label;
            if (score >= 81) label = "VERY_STRONG";
            else if (score >= 61) label = "STRONG";
            else if (score >= 41) label = "MODERATE";
            else if (score >= 21) label = "WEAK";
            else label = "VERY_WEAK";

            return {
                score,
                label,
                breakdown: {
                    length: lengthPoints,
                    uppercase: upper,
                    lowercase: lower,
                    numbers,
                    special,
                    uniqueness
                }
            };
        },

        generateSuggestions(password) {

            if (typeof password !== "string") return "Invalid Input";

            const suggestions = [];

            if (password.length < minLength) {
                suggestions.push("Increase length to at least " + minLength + " characters");
            } else if (password.length < 12) {
                suggestions.push("Increase length to at least 12 characters");
            }

            if (requireUppercase && !hasUppercase(password)) {
                suggestions.push("Add at least one uppercase letter (A-Z)");
            }

            if (requireLowercase && !hasLowercase(password)) {
                suggestions.push("Add at least one lowercase letter (a-z)");
            }

            if (requireNumbers && !hasNumbers(password)) {
                suggestions.push("Add at least one number (0-9)");
            }

            if (requireSpecialChars && !hasSpecial(password)) {
                suggestions.push("Add at least one special character (" + specialChars + ")");
            }

            const forbidden = findForbiddenPattern(password);

            if (forbidden) {
                suggestions.push("Remove forbidden pattern: " + forbidden);
            }

            if (uniqueChars(password) < minUniqueChars) {
                suggestions.push("Use at least " + minUniqueChars + " unique characters");
            }

            return {
                suggestions,
                prioritySuggestion: suggestions.length > 0 ? suggestions[0] : null
            };
        },

        checkHistory(password, previousHashes, hasher) {

            if (typeof password !== "string") return "Invalid Input";

            if (!Array.isArray(previousHashes)) return "Invalid Input";

            if (hasher === null || hasher === undefined || typeof hasher.verify !== "function") {
                return "Invalid Input";
            }

            for (let i = 0; i < previousHashes.length; i++) {
                const res = hasher.verify(password, previousHashes[i]);
                if (res.verified) {
                    return {
                        isReused: true,
                        matchedIndex: i,
                        reason: "PASSWORD_PREVIOUSLY_USED"
                    };
                }
            }

            return { isReused: false, matchedIndex: null, reason: null };
        }
    };
}


// ------ EXAMPLE USAGE ------
const policy = createPasswordPolicyEngine({
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: "!@#$%^&*",
    forbiddenPatterns: ["password", "123456"],
    minUniqueChars: 6
});


console.log(policy.validate("Secure@123"));

console.log(policy.validate("password123"));

console.log(policy.calculateStrength("Secure@Password123!"));

console.log(policy.calculateStrength("abc123"));

console.log(policy.generateSuggestions("abc123"));


// --- INVALID ---
console.log(createPasswordPolicyEngine({ minLength: 0, maxLength: 0, requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSpecialChars: true, specialChars: "", forbiddenPatterns: [], minUniqueChars: 0 }));