# 🎓 JS DAILY PRACTICE – DAY-245

📅 **Goal:** Password Hash Engine (Security & Auth Patterns)
🎯 **Focus:** Password Hashing • Salt Generation • Hash Verification • Password Policy • Breach Detection

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🧂 Salt Generator

⚠️ **Function Name:** `createSaltGenerator()`

| Input      | `saltConfig` (object)   |
| :--------- | :---------------------- |
| **Output** | object (salt generator) |

**Rules:**

`saltConfig` object:

- `saltLength` (number, integer, 8–32) — length of salt in characters
- `charset` (string: `"alphanumeric"`, `"hex"`, `"base64"`) — character set for salt

Return a salt generator object with:

- `generate()` — generate a new random-like salt
- `generateBatch(count)` — generate multiple salts
- `validate(salt)` — check if a salt is valid for this config
- `getStats()` — return generation statistics

**Generation Rules (simulated — deterministic):**

- `"alphanumeric"` charset: use chars `"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"`
- `"hex"` charset: use chars `"0123456789abcdef"`
- `"base64"` charset: use chars `"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"`

**Simulated randomness:** use auto-incrementing seed:

- `charIndex = (autoSeed * 7 + position * 13) % charsetLength` for each character position
- `autoSeed` starts at 1 and increments by 1 for each `generate()` call

- `generate()` → `{ salt: generatedSalt, length: saltLength, charset, generatedAt: "2025-01-01T00:00:00Z" }`

- `generateBatch(count)`:
  - `count` must be integer, 1–100
  - Returns `{ salts: [salt strings], count, charset }`

- `validate(salt)`:
  - Check length matches `saltLength`
  - Check all chars are in the charset
  - Returns `{ valid: boolean, length: salt.length, expectedLength: saltLength, invalidChars: [chars not in charset] }`

- `getStats()` → `{ totalGenerated, charset, saltLength, lastGeneratedAt: "2025-01-01T00:00:00Z" }`

**Validation:** invalid `saltConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the salt generator object with all 4 methods. |
| :----------- | :--------------------------------------------------- |

**Sample Input & Output:**

```javascript
const sg = createSaltGenerator({ saltLength: 16, charset: "hex" });

sg.generate();
// seed=1: for each position i: charIndex = (1*7 + i*13) % 16
// pos0: (7+0)%16=7 → '7'
// pos1: (7+13)%16=4 → '4'
// pos2: (7+26)%16=1 → '1'
// ... continues for 16 chars
// → { salt: "7419c6af38e52b0d", length: 16, charset: "hex", generatedAt: "2025-01-01T00:00:00Z" }

sg.generate();
// seed=2: (2*7 + i*13) % 16
// → { salt: "<different salt>", length: 16, charset: "hex", generatedAt: "2025-01-01T00:00:00Z" }

sg.validate("7419c6af38e52b0d");
// → { valid: true, length: 16, expectedLength: 16, invalidChars: [] }

sg.validate("ZZZZ");
// Wrong length, invalid chars for hex
// → { valid: false, length: 4, expectedLength: 16, invalidChars: ["Z"] }

sg.getStats();
// → { totalGenerated: 2, charset: "hex", saltLength: 16, lastGeneratedAt: "2025-01-01T00:00:00Z" }
```

---

## 🧩 PROBLEM–02: 🔒 Password Hasher

⚠️ **Function Name:** `createPasswordHasher()`

| Input      | `hasherConfig` (object)  |
| :--------- | :----------------------- |
| **Output** | object (password hasher) |

**Rules:**

`hasherConfig` object:

- `algorithm` (string: `"bcrypt-sim"`, `"argon2-sim"`, `"pbkdf2-sim"`) — hashing algorithm to simulate
- `costFactor` (number, integer, 4–14) — work factor (higher = more secure, slower)
- `saltLength` (number, integer, 8–32)

Return a password hasher object with:

- `hash(password)` — hash a password with auto-generated salt
- `hashWithSalt(password, salt)` — hash with provided salt
- `verify(password, storedHash)` — verify password against stored hash
- `needsRehash(storedHash, newCostFactor)` — check if hash needs upgrading
- `getHashInfo(storedHash)` — extract metadata from hash string

**Hash Format (simulated):**

```
$algorithm$cost$salt$hashValue
```

Example: `$bcrypt-sim$10$abc123def456$<computed hash>`

**Hash Computation (simulated):**

- `hashValue = algorithmPrefix + "_" + reverseString(password + salt) + "_" + sumOfCharCodes(password + salt).toString(16) + "_" + costFactor`
  - `algorithmPrefix`: `"bc"` for bcrypt-sim, `"ar"` for argon2-sim, `"pb"` for pbkdf2-sim

**Salt Generation:** use same logic as Problem-01 (hex charset, `saltLength`)

**Operation Rules:**

- `hash(password)`:
  - `password` must be non-empty string
  - Auto-generate salt (using Problem-01 logic)
  - Compute hash
  - Returns `{ hash: fullHashString, algorithm, costFactor, salt, computedAt: "2025-01-01T00:00:00Z" }`

- `hashWithSalt(password, salt)`:
  - Use provided salt
  - Returns same structure as `hash()`

- `verify(password, storedHash)`:
  - Parse `storedHash` to extract algorithm, cost, salt
  - Recompute hash with same salt
  - Compare
  - Returns `{ verified: boolean, algorithm, costFactor }`

- `needsRehash(storedHash, newCostFactor)`:
  - Parse stored hash, compare costFactor
  - Returns `{ needsRehash: boolean, reason: null or "COST_FACTOR_UPGRADED" or "ALGORITHM_CHANGED", currentCost, targetCost }`

- `getHashInfo(storedHash)`:
  - Parse hash string
  - Returns `{ algorithm, costFactor, saltLength: salt.length, hashLength: hashValue.length }` or `{ error: "Invalid hash format" }`

**Validation:** invalid `hasherConfig` → return `"Invalid Input"` from factory. Invalid `password` → return `"Invalid Input"`

| Challenge 📢 | Return the password hasher object with all 5 methods. |
| :----------- | :---------------------------------------------------- |

**Sample Input & Output:**

```javascript
const hasher = createPasswordHasher({
  algorithm: "bcrypt-sim",
  costFactor: 10,
  saltLength: 16,
});

const result = hasher.hash("mySecurePassword123");
// → {
//   hash: "$bcrypt-sim$10$<salt>$bc_<reversed(pass+salt)>_<hexCharSum>_10",
//   algorithm: "bcrypt-sim",
//   costFactor: 10,
//   salt: "<16-char hex salt>",
//   computedAt: "2025-01-01T00:00:00Z"
// }

hasher.verify("mySecurePassword123", result.hash);
// → { verified: true, algorithm: "bcrypt-sim", costFactor: 10 }

hasher.verify("wrongPassword", result.hash);
// → { verified: false, algorithm: "bcrypt-sim", costFactor: 10 }

hasher.needsRehash(result.hash, 12);
// → { needsRehash: true, reason: "COST_FACTOR_UPGRADED", currentCost: 10, targetCost: 12 }

hasher.needsRehash(result.hash, 10);
// → { needsRehash: false, reason: null, currentCost: 10, targetCost: 10 }

hasher.getHashInfo(result.hash);
// → { algorithm: "bcrypt-sim", costFactor: 10, saltLength: 16, hashLength: <length of hash value part> }
```

---

## 🧩 PROBLEM–03: 📋 Password Policy Engine

⚠️ **Function Name:** `createPasswordPolicyEngine()`

| Input      | `policyConfig` (object) |
| :--------- | :---------------------- |
| **Output** | object (policy engine)  |

**Rules:**

`policyConfig` object:

- `minLength` (number, integer, ≥ 1)
- `maxLength` (number, integer, ≥ minLength)
- `requireUppercase` (boolean)
- `requireLowercase` (boolean)
- `requireNumbers` (boolean)
- `requireSpecialChars` (boolean)
- `specialChars` (string) — e.g. `"!@#$%^&*()_+-=[]{}|;:,.<>?"`
- `forbiddenPatterns` (array of strings) — e.g. `["password", "123456", "qwerty"]`
- `minUniqueChars` (number, integer, ≥ 1)

Return a policy engine object with:

- `validate(password)` — check password against all rules
- `calculateStrength(password)` — return strength score and label
- `generateSuggestions(password)` — return improvement suggestions
- `checkHistory(password, previousHashes, hasher)` — ensure not same as recent passwords

**Validation Rules:**

- `validate(password)`:
  - Check each rule, collect all violations
  - Returns `{ valid: boolean, violations: [string], passedChecks: [string] }`
  - Violations format: `"Too short: minimum ${minLength} characters"`, `"Missing uppercase letter"`, `"Contains forbidden pattern: ${pattern}"`, etc.

- `calculateStrength(password)`:
  - Score starts at 0, add points:
    - length ≥ 8: +10, ≥ 12: +20, ≥ 16: +30
    - has uppercase: +10
    - has lowercase: +10
    - has numbers: +10
    - has special chars: +20
    - uniqueChars ≥ 8: +10, ≥ 12: +20
  - `label`: `"VERY_WEAK"` (0–20), `"WEAK"` (21–40), `"MODERATE"` (41–60), `"STRONG"` (61–80), `"VERY_STRONG"` (81–100)
  - Returns `{ score, label, breakdown: { length: N, uppercase: N, lowercase: N, numbers: N, special: N, uniqueness: N } }`

- `generateSuggestions(password)`:
  - Based on missing requirements
  - Returns `{ suggestions: [string], prioritySuggestion: string or null }`
  - e.g. `"Add at least one special character (!@#$...)"`, `"Increase length to at least 12 characters"`

- `checkHistory(password, previousHashes, hasher)`:
  - `previousHashes` — array of previously used hash strings
  - `hasher` — a hasher instance with `verify()` method
  - Check if `password` matches any previous hash
  - Returns `{ isReused: boolean, matchedIndex: N or null, reason: null or "PASSWORD_PREVIOUSLY_USED" }`

**Validation:** invalid `policyConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the policy engine object with all 4 methods. |
| :----------- | :-------------------------------------------------- |

**Sample Input & Output:**

```javascript
const policy = createPasswordPolicyEngine({
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: "!@#$%^&*",
  forbiddenPatterns: ["password", "123456"],
  minUniqueChars: 6,
});

policy.validate("Secure@123");
// → {
//   valid: true,
//   violations: [],
//   passedChecks: ["Length OK", "Has uppercase", "Has lowercase", "Has numbers", "Has special chars", "No forbidden patterns", "Sufficient unique chars"]
// }

policy.validate("password123");
// → {
//   valid: false,
//   violations: ["Missing uppercase letter", "Missing special character", "Contains forbidden pattern: password"],
//   passedChecks: ["Length OK", "Has lowercase", "Has numbers", "Sufficient unique chars"]
// }

policy.calculateStrength("Secure@Password123!");
// length>=16(+30), upper(+10), lower(+10), number(+10), special(+20), uniqueChars>12(+20) = 100
// → { score: 100, label: "VERY_STRONG", breakdown: { length: 30, uppercase: 10, lowercase: 10, numbers: 10, special: 20, uniqueness: 20 } }

policy.calculateStrength("abc123");
// length<8(+0), no upper(+0), lower(+10), number(+10), no special(+0), unique=5<8(+0) = 20
// → { score: 20, label: "VERY_WEAK", breakdown: { length: 0, uppercase: 0, lowercase: 10, numbers: 10, special: 0, uniqueness: 0 } }

policy.generateSuggestions("abc123");
// → {
//   suggestions: [
//     "Increase length to at least 8 characters",
//     "Add at least one uppercase letter (A-Z)",
//     "Add at least one special character (!@#$%^&*)"
//   ],
//   prioritySuggestion: "Increase length to at least 8 characters"
// }
```

---

## 🧩 PROBLEM–04: 🚨 Breach Detection Engine

⚠️ **Function Name:** `createBreachDetectionEngine()`

| Input      | `breachConfig` (object)   |
| :--------- | :------------------------ |
| **Output** | object (breach detection) |

**Rules:**

`breachConfig` object:

- `knownBreachedPasswords` (array of strings) — list of commonly breached passwords
- `knownBreachedHashes` (array of strings) — list of breached hash values
- `hibpSimulation` (boolean) — simulate HaveIBeenPwned-style k-anonymity check

Return a breach detection engine object with:

- `checkPassword(password)` — check if password is in breach list
- `checkHash(hashValue)` — check if hash prefix matches breached hashes
- `checkPasswordStrength(password, hasher)` — combined strength + breach check
- `getBatchBreachReport(passwords)` — check multiple passwords
- `getBreachStats()` — return statistics about the breach database

**Detection Rules:**

- `checkPassword(password)`:
  - Direct comparison (case-insensitive) against `knownBreachedPasswords`
  - Returns `{ breached: boolean, password: "***" (masked), matchType: "EXACT"/"NONE", riskLevel: "CRITICAL"/"SAFE" }`

- `checkHash(hashValue)`:
  - If `hibpSimulation: true` → simulate k-anonymity:
    - Take first 5 chars of hashValue as prefix
    - Check if any breachedHash starts with same prefix
    - Returns `{ breached: boolean, prefix: first5Chars, matchCount: how many breached hashes share prefix, riskLevel }`
  - If `hibpSimulation: false` → exact hash comparison
  - Returns `{ breached: boolean, matchType: "PREFIX"/"EXACT"/"NONE", riskLevel }`

- `checkPasswordStrength(password, hasher)`:
  - Hash the password using `hasher.hash(password).hash`
  - Check both password and hash
  - Returns `{ breached: boolean, hashBreached: boolean, combinedRisk: "CRITICAL"/"HIGH"/"LOW", recommendation: string }`

- `getBatchBreachReport(passwords)`:
  - Check each password
  - Returns `{ total, breachedCount, safeCount, results: [{ index, breached, riskLevel }] }`

- `getBreachStats()` → `{ totalKnownPasswords, totalKnownHashes, lastUpdated: "2025-01-01T00:00:00Z" }`

**Validation:** invalid `breachConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the breach detection engine object with all 5 methods. |
| :----------- | :------------------------------------------------------------ |

**Sample Input & Output:**

```javascript
const bde = createBreachDetectionEngine({
  knownBreachedPasswords: ["password", "123456", "qwerty", "admin", "letmein"],
  knownBreachedHashes: [
    "5baa61e4c9b93f3f0682250b6cf8331b",
    "7c4a8d09ca3762af61e59520943dc264",
  ],
  hibpSimulation: true,
});

bde.checkPassword("password");
// → { breached: true, password: "***", matchType: "EXACT", riskLevel: "CRITICAL" }

bde.checkPassword("MySecureP@ss123");
// → { breached: false, password: "***", matchType: "NONE", riskLevel: "SAFE" }

bde.checkHash("5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8");
// hibpSimulation: prefix = "5baa6" → matches "5baa61e4..." → breached
// → { breached: true, prefix: "5baa6", matchCount: 1, riskLevel: "CRITICAL" }

bde.getBatchBreachReport(["password", "securePa$$1", "123456", "MyStr0ng!"]);
// → {
//   total: 4,
//   breachedCount: 2,
//   safeCount: 2,
//   results: [
//     { index: 0, breached: true, riskLevel: "CRITICAL" },
//     { index: 1, breached: false, riskLevel: "SAFE" },
//     { index: 2, breached: true, riskLevel: "CRITICAL" },
//     { index: 3, breached: false, riskLevel: "SAFE" }
//   ]
// }

bde.getBreachStats();
// → { totalKnownPasswords: 5, totalKnownHashes: 2, lastUpdated: "2025-01-01T00:00:00Z" }
```

---

## 🧩 PROBLEM–05: 🏗️ Full Password Security Orchestrator

⚠️ **Function Name:** `runPasswordSecurityOrchestrator()`

| Input      | `securityConfig` (object) |
| :--------- | :------------------------ |
| **Output** | object                    |

**Rules:**

`securityConfig` object:

- `orchestratorId` (string, non-empty)
- `hasherConfig` (object) — same shape as Problem-02
- `policyConfig` (object) — same shape as Problem-03
- `breachConfig` (object) — same shape as Problem-04
- `saltConfig` (object) — same shape as Problem-01
- `passwordOperations` (array of objects):
  - `operationId` (string)
  - `type` (string: `"REGISTER"`, `"CHANGE_PASSWORD"`, `"VERIFY"`, `"AUDIT"`)
  - `userId` (string)
  - `password` (string or null)
  - `newPassword` (string or null, for CHANGE_PASSWORD)
  - `storedHash` (string or null, for VERIFY/AUDIT)
  - `previousHashes` (array of strings or null, for CHANGE_PASSWORD)

**Operation Rules:**

- `"REGISTER"`:
  1. Validate password against policy (Problem-03)
  2. Check breach database (Problem-04)
  3. If policy invalid OR breached → fail with reason
  4. Hash password (Problem-02)
  5. Returns `{ success: boolean, userId, hash: hashedPassword or null, policyResult, breachResult }`

- `"CHANGE_PASSWORD"`:
  1. Validate `newPassword` against policy
  2. Check breach database
  3. Check history: `checkHistory(newPassword, previousHashes, hasher)`
  4. If any check fails → fail
  5. Hash new password
  6. Returns `{ success: boolean, userId, newHash or null, policyResult, breachResult, historyResult }`

- `"VERIFY"`:
  1. Verify `password` against `storedHash` using hasher
  2. Returns `{ success: boolean, userId, verified: boolean }`

- `"AUDIT"`:
  1. Get hash info from `storedHash`
  2. Check if needs rehash (compare against current hasher costFactor)
  3. Returns `{ success: boolean, userId, hashInfo, needsRehash: boolean, recommendation: string or null }`

**Summary:**

- `totalOperations`
- `successCount`
- `failureCount`
- `failureBreakdown` → `{ policyViolations, breachDetected, historyReused, verificationFailed }`

**Validation:** invalid `securityConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ orchestratorId, operationLog, summary }` where `operationLog` is array of `{ operationId, type, userId, result }`. |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runPasswordSecurityOrchestrator({
  orchestratorId: "PWD-ORCH-01",
  hasherConfig: { algorithm: "bcrypt-sim", costFactor: 10, saltLength: 16 },
  policyConfig: {
    minLength: 8, maxLength: 128,
    requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSpecialChars: true,
    specialChars: "!@#$%^&*", forbiddenPatterns: ["password", "123456"], minUniqueChars: 6
  },
  breachConfig: { knownBreachedPasswords: ["password", "123456"], knownBreachedHashes: [], hibpSimulation: false },
  saltConfig: { saltLength: 16, charset: "hex" },
  passwordOperations: [
    { operationId: "OP-1", type: "REGISTER", userId: "U1", password: "Secure@Pass123", newPassword: null, storedHash: null, previousHashes: null },
    { operationId: "OP-2", type: "REGISTER", userId: "U2", password: "password", newPassword: null, storedHash: null, previousHashes: null },
    { operationId: "OP-3", type: "VERIFY", userId: "U1", password: "Secure@Pass123", newPassword: null, storedHash: null, previousHashes: null },
    { operationId: "OP-4", type: "AUDIT", userId: "U1", password: null, newPassword: null, storedHash: null, previousHashes: null }
  ]
})` →

  **Manual Verify:**
  - OP-1: REGISTER "Secure@Pass123" → policy✓, not breached✓ → hash & store → SUCCESS
  - OP-2: REGISTER "password" → policy violations(no upper, no special, forbidden pattern) AND breached → FAIL
  - OP-3: VERIFY "Secure@Pass123" against OP-1's hash → verified=true → SUCCESS
  - OP-4: AUDIT OP-1's hash → costFactor=10, current=10 → needsRehash=false → SUCCESS
  - failureBreakdown: policyViolations:1, breachDetected:1 (both apply to OP-2)

  `{
  orchestratorId: "PWD-ORCH-01",
  operationLog: [
    { operationId: "OP-1", type: "REGISTER", userId: "U1", result: { success: true, userId: "U1", hash: "$bcrypt-sim$10$<salt>$<hash>", policyResult: { valid: true, violations: [] }, breachResult: { breached: false, riskLevel: "SAFE" } } },
    { operationId: "OP-2", type: "REGISTER", userId: "U2", result: { success: false, userId: "U2", hash: null, policyResult: { valid: false, violations: ["Missing uppercase letter", "Missing special character", "Contains forbidden pattern: password"] }, breachResult: { breached: true, riskLevel: "CRITICAL" } } },
    { operationId: "OP-3", type: "VERIFY", userId: "U1", result: { success: true, userId: "U1", verified: true } },
    { operationId: "OP-4", type: "AUDIT", userId: "U1", result: { success: true, userId: "U1", hashInfo: { algorithm: "bcrypt-sim", costFactor: 10, saltLength: 16 }, needsRehash: false, recommendation: null } }
  ],
  summary: {
    totalOperations: 4,
    successCount: 3,
    failureCount: 1,
    failureBreakdown: { policyViolations: 1, breachDetected: 1, historyReused: 0, verificationFailed: 0 }
  }
}`

---
