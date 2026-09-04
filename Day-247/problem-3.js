// 🧩 PROBLEM–03: createInputValidator()

// Logic: Schema-based validation + type coercion.
//   validate(value, schema) — required/type/min/max/pattern/enum/custom rules
//   validateBatch() — multiple fields
//   coerce(value, targetType) — safe coercion
//   sanitizeAndValidate() — trim/truncate then validate


function createInputValidator(validatorConfig) {

    // --- STEP 1: VALIDATE inputs ---
    if (
        typeof validatorConfig !== "object" ||
        validatorConfig === null ||
        Array.isArray(validatorConfig) ||
        typeof validatorConfig.strictTypes !== "boolean" ||
        typeof validatorConfig.maxStringLength !== "number" ||
        !Number.isInteger(validatorConfig.maxStringLength) ||
        validatorConfig.maxStringLength < 1 ||
        typeof validatorConfig.allowNull !== "boolean" ||
        !Array.isArray(validatorConfig.customRules)
    ) {
        return "Invalid Input";
    }

    const strictTypes = validatorConfig.strictTypes;
    const maxStringLength = validatorConfig.maxStringLength;
    const allowNull = validatorConfig.allowNull;

    const customRulesMap = {};

    for (const rule of validatorConfig.customRules) {
        if (rule && typeof rule.name === "string" && typeof rule.test === "function" && typeof rule.message === "string") {
            customRulesMap[rule.name] = rule;
        }
    }

    // --- STEP 2: HELPERS ---
    function typeMatches(value, type) {

        if (type === "string") return typeof value === "string";
        if (type === "number") return typeof value === "number";
        if (type === "boolean") return typeof value === "boolean";
        if (type === "array") return Array.isArray(value);
        if (type === "object") return typeof value === "object" && value !== null && !Array.isArray(value);
        if (type === "email") return typeof value === "string";
        if (type === "url") return typeof value === "string";
        if (type === "date") return typeof value === "string";
        return true;
    }

    function checkSpecialType(value, type) {

        if (typeof value !== "string") return null;

        if (type === "email") {
            const atIndex = value.indexOf("@");
            const dotIndex = value.indexOf(".", atIndex + 1);
            return atIndex > 0 && dotIndex > atIndex + 1 ? null : "Invalid email format";
        }

        if (type === "url") {
            if (!value.startsWith("http://") && !value.startsWith("https://")) {
                return "Invalid URL format";
            }
            return null;
        }

        if (type === "date") {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                return "Invalid date format";
            }
            return null;
        }

        return null;
    }

    // --- STEP 3: PUBLIC API ---
    return {

        validate(value, schema) {

            if (typeof schema !== "object" || schema === null || Array.isArray(schema)) {
                return "Invalid Input";
            }

            const errors = [];
            const warnings = [];

            const isNullish = value === null || value === undefined;

            if (schema.required && isNullish) {
                errors.push("Value is required");
                return { valid: false, value, errors, warnings };
            }

            if (isNullish) {
                if (allowNull) return { valid: true, value, errors, warnings };
                errors.push("Value must not be null");
                return { valid: false, value, errors, warnings };
            }

            const type = schema.type || "string";

            // Type check.

            if (strictTypes) {

                if (!typeMatches(value, type)) {
                    errors.push("Expected type " + type + " but got " + typeof value);
                }

            } else {

                // Coerce loose values for number/boolean if they look convertible.

                if (type === "number" && typeof value === "string") {
                    const n = Number(value);
                    if (!isNaN(n) && value.trim() !== "") value = n;
                }

                if (type === "boolean" && typeof value === "string") {
                    if (value === "true" || value === "1") value = true;
                    else if (value === "false" || value === "0") value = false;
                }

                if (!typeMatches(value, type)) {
                    errors.push("Expected type " + type);
                }
            }

            if (errors.length > 0) {
                return { valid: false, value, errors, warnings };
            }

            // Special type formats.

            const specialError = checkSpecialType(value, type);

            if (specialError) {
                errors.push(specialError);
                return { valid: false, value, errors, warnings };
            }

            // min / max.

            if (schema.min !== null && schema.min !== undefined) {
                if (type === "number") {
                    if (value < schema.min) errors.push("Value must be at least " + schema.min);
                } else if (type === "string") {
                    if (value.length < schema.min) errors.push("Must be at least " + schema.min + " characters");
                }
            }

            if (schema.max !== null && schema.max !== undefined) {
                if (type === "number") {
                    if (value > schema.max) errors.push("Value must be at most " + schema.max);
                } else if (type === "string") {
                    if (value.length > schema.max) errors.push("Must be at most " + schema.max + " characters");
                }
            }

            // pattern.

            if (schema.pattern) {
                const re = new RegExp(schema.pattern);
                if (typeof value === "string" && !re.test(value)) {
                    errors.push("Value does not match pattern");
                }
            }

            // enum.

            if (schema.enum && Array.isArray(schema.enum)) {
                if (!schema.enum.includes(value)) {
                    errors.push("Value not in allowed set");
                }
            }

            // custom rule.

            if (schema.customRule && customRulesMap.hasOwnProperty(schema.customRule)) {
                const rule = customRulesMap[schema.customRule];
                if (!rule.test(value)) {
                    errors.push(rule.message);
                }
            }

            return { valid: errors.length === 0, value, errors, warnings };
        },

        validateBatch(inputs) {

            if (!Array.isArray(inputs)) return "Invalid Input";

            const results = [];
            let invalidCount = 0;

            for (const entry of inputs) {

                const field = entry.field;
                const result = this.validate(entry.value, entry.schema);

                results.push({ field, valid: result.valid, errors: result.errors });

                if (!result.valid) invalidCount++;
            }

            return {
                results,
                allValid: invalidCount === 0,
                invalidCount
            };
        },

        coerce(value, targetType) {

            if (typeof targetType !== "string") return "Invalid Input";

            let coerced;
            let success = true;

            if (targetType === "number") {
                if (typeof value === "number") {
                    coerced = value;
                } else if (typeof value === "string" && value.trim() !== "") {
                    const n = Number(value);
                    if (isNaN(n)) {
                        return { original: value, coerced: null, targetType, success: false, error: "Cannot coerce to number" };
                    }
                    coerced = n;
                } else {
                    return { original: value, coerced: null, targetType, success: false, error: "Cannot coerce to number" };
                }
            } else if (targetType === "boolean") {
                if (value === true || value === "true" || value === "1") coerced = true;
                else if (value === false || value === "false" || value === "0") coerced = false;
                else {
                    return { original: value, coerced: null, targetType, success: false, error: "Cannot coerce to boolean" };
                }
            } else if (targetType === "string") {
                coerced = String(value);
            } else if (targetType === "array") {
                if (Array.isArray(value)) {
                    coerced = value;
                } else if (typeof value === "string") {
                    try {
                        const parsed = JSON.parse(value);
                        if (!Array.isArray(parsed)) {
                            return { original: value, coerced: null, targetType, success: false, error: "Cannot coerce to array" };
                        }
                        coerced = parsed;
                    } catch (e) {
                        return { original: value, coerced: null, targetType, success: false, error: "Cannot coerce to array" };
                    }
                } else {
                    return { original: value, coerced: null, targetType, success: false, error: "Cannot coerce to array" };
                }
            } else {
                return "Invalid Input";
            }

            return { original: value, coerced, targetType, success };
        },

        sanitizeAndValidate(value, schema) {

            let sanitized = value;

            if (typeof value === "string") {
                sanitized = value.trim();
                if (sanitized.length > maxStringLength) {
                    sanitized = sanitized.slice(0, maxStringLength);
                }
            }

            const validation = this.validate(sanitized, schema);

            return { original: value, sanitized, validation };
        }
    };
}


// ------ EXAMPLE USAGE ------
const iv = createInputValidator({
    strictTypes: false,
    maxStringLength: 255,
    allowNull: false,
    customRules: [
        { name: "noSpaces", test: (v) => !v.includes(" "), message: "Value must not contain spaces" }
    ]
});


console.log(iv.validate("rahim@example.com", { type: "email", required: true, min: null, max: null, pattern: null, enum: null, customRule: null }));

console.log(iv.validate("not-an-email", { type: "email", required: true, min: null, max: null, pattern: null, enum: null, customRule: null }));

console.log(iv.validate("admin user", { type: "string", required: true, min: 3, max: 20, pattern: null, enum: null, customRule: "noSpaces" }));

console.log(iv.coerce("42", "number"));

console.log(iv.sanitizeAndValidate("  hello@world.com  ", { type: "email", required: true, min: null, max: null, pattern: null, enum: null, customRule: null }));

console.log(iv.validateBatch([
    { field: "username", value: "Rahim", schema: { type: "string", required: true, min: 3, max: 20, pattern: null, enum: null, customRule: null } },
    { field: "age", value: "17", schema: { type: "number", required: true, min: 18, max: 120, pattern: null, enum: null, customRule: null } }
]));


// --- INVALID ---
console.log(createInputValidator({ strictTypes: false, maxStringLength: 0, allowNull: false, customRules: [] }));