# 🎓 JS DAILY PRACTICE – DAY-243

📅 **Goal:** JWT Generator & Validator (Security & Auth Patterns)
🎯 **Focus:** JWT Structure • Token Generation • Signature Validation • Claims Verification • Token Lifecycle

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🏗️ JWT Structure Builder

⚠️ **Function Name:** `buildJWTStructure()`

| Input      | `tokenConfig` (object) |
| :--------- | :--------------------- |
| **Output** | object                 |

**Rules:**

`tokenConfig` object:

- `header` (object):
  - `alg` (string: `"HS256"`, `"HS384"`, `"HS512"`) — signing algorithm
  - `typ` (string: `"JWT"`)
- `payload` (object):
  - `sub` (string, non-empty) — subject (user id)
  - `iss` (string, non-empty) — issuer
  - `aud` (string, non-empty) — audience
  - `iat` (number) — issued at (Unix timestamp ms)
  - `exp` (number) — expiration (Unix timestamp ms, must be > iat)
  - `...additionalClaims` — any extra fields

**JWT Structure Rules:**

- Simulate Base64URL encoding: replace real encoding with a deterministic simulation
  - `simulateBase64(str)` → reverse the string + prefix with `"b64_"` (e.g. `"hello"` → `"b64_olleh"`)
- Build three parts:
  - `encodedHeader` = `simulateBase64(JSON.stringify(header))`
  - `encodedPayload` = `simulateBase64(JSON.stringify(payload))`
  - `signature` = `"sig_" + (charCodeSum of encodedHeader + "." + encodedPayload).toString(16)` — sum of all char codes in hex
- `token` = `encodedHeader + "." + encodedPayload + "." + signature`

Returns:

```javascript
{
  header,
  payload,
  encodedHeader,
  encodedPayload,
  signature,
  token,
  tokenParts: { header: encodedHeader, payload: encodedPayload, signature }
}
```

**Validation:** invalid `tokenConfig` or missing required fields → return `"Invalid Input"`

| Challenge 📢 | Return the full JWT structure object. |
| :----------- | :------------------------------------ |

**Sample Input & Output:**

- `buildJWTStructure({
  header: { alg: "HS256", typ: "JWT" },
  payload: { sub: "U1", iss: "myapp", aud: "web", iat: 1000000, exp: 1003600, role: "ADMIN" }
})` →

  **Manual Verify:**
  - encodedHeader = `simulateBase64('{"alg":"HS256","typ":"JWT"}')` = `"b64_" + reversed`
  - encodedPayload = `simulateBase64('{"sub":"U1","iss":"myapp","aud":"web","iat":1000000,"exp":1003600,"role":"ADMIN"}')`
  - signature = `"sig_" + charCodeSum.toString(16)`
  - token = `encodedHeader + "." + encodedPayload + "." + signature`

  `{
  header: { alg: "HS256", typ: "JWT" },
  payload: { sub: "U1", iss: "myapp", aud: "web", iat: 1000000, exp: 1003600, role: "ADMIN" },
  encodedHeader: "b64_}\"TWJ\":\"gla\",...",
  encodedPayload: "b64_...",
  signature: "sig_<hex>",
  token: "<encodedHeader>.<encodedPayload>.<signature>",
  tokenParts: { header: "<encodedHeader>", payload: "<encodedPayload>", signature: "sig_<hex>" }
}`

---

## 🧩 PROBLEM–02: 🔑 JWT Generator

⚠️ **Function Name:** `createJWTGenerator()`

| Input      | `generatorConfig` (object) |
| :--------- | :------------------------- |
| **Output** | object (JWT generator)     |

**Rules:**

`generatorConfig` object:

- `secret` (string, non-empty) — signing secret
- `issuer` (string, non-empty) — token issuer
- `defaultExpiryMs` (number, > 0) — default token lifetime in ms

Return a JWT generator object with:

- `generate(claims, options)` — generate a JWT token
- `decode(token)` — decode token WITHOUT verifying signature
- `parse(token)` — split token into parts and return structure
- `getIssuedTokens()` — return list of all issued tokens (metadata only)

**Generation Rules:**

- `generate(claims, options)`:
  - `claims` object: `{ sub, role, ...extra }` — user-specific claims
  - `options` (optional): `{ expiryMs: override, audience: string }`
  - Auto-set: `iat = Date.now()` (simulate as `1000000`), `exp = iat + expiryMs`, `iss = issuer`
  - Build JWT using Problem-01 logic (use `simulateBase64` encoding)
  - Add to issued tokens log
  - Returns `{ token, claims: fullPayload, expiresAt: exp, issuedAt: iat }`

- `decode(token)`:
  - Split by `"."`, reverse the `simulateBase64` encoding (remove `"b64_"` prefix, reverse string)
  - Parse JSON
  - Returns `{ header, payload }` or `{ error: "Invalid token format" }`

- `parse(token)`:
  - Returns `{ parts: { header: string, payload: string, signature: string }, isWellFormed: boolean }`
  - `isWellFormed: true` if token has exactly 3 parts separated by `"."`

- `getIssuedTokens()` → array of `{ sub, iat, exp, role, tokenPreview: first 20 chars of token + "..." }`

**Validation:** invalid `generatorConfig` → return `"Invalid Input"` from factory. Method-level invalid → return `"Invalid Input"`

| Challenge 📢 | Return the JWT generator object with all 4 methods. |
| :----------- | :-------------------------------------------------- |

**Sample Input & Output:**

```javascript
const generator = createJWTGenerator({
  secret: "my-secret-key",
  issuer: "myapp.com",
  defaultExpiryMs: 3600000, // 1 hour
});

generator.generate({ sub: "U1", role: "ADMIN" });
// → {
//   token: "<encodedHeader>.<encodedPayload>.<signature>",
//   claims: { sub: "U1", role: "ADMIN", iss: "myapp.com", iat: 1000000, exp: 1003600000 },
//   expiresAt: 1003600000,
//   issuedAt: 1000000
// }

generator.parse("abc.def.ghi");
// → { parts: { header: "abc", payload: "def", signature: "ghi" }, isWellFormed: true }

generator.parse("invalid-token");
// → { parts: null, isWellFormed: false }

generator.decode(generatedToken);
// → { header: { alg: "HS256", typ: "JWT" }, payload: { sub: "U1", role: "ADMIN", iss: "myapp.com", ... } }
```

---

## 🧩 PROBLEM–03: ✅ JWT Validator

⚠️ **Function Name:** `createJWTValidator()`

| Input      | `validatorConfig` (object) |
| :--------- | :------------------------- |
| **Output** | object (JWT validator)     |

**Rules:**

`validatorConfig` object:

- `secret` (string, non-empty)
- `expectedIssuer` (string, non-empty)
- `expectedAudience` (string or null)
- `clockSkewMs` (number, ≥ 0) — tolerance for time checks

Return a JWT validator object with:

- `validate(token, currentTimeMs)` — full validation
- `verifySignature(token)` — only check signature
- `verifyClaims(token, currentTimeMs)` — only check claims (exp, iss, aud)
- `getValidationLog()` — return history of all validations

**Validation Steps (run in order):**

1. **Format Check** — must have 3 parts separated by `"."`
2. **Decode** — decode header and payload using `simulateBase64` reverse
3. **Signature Verification** — recompute signature from header+payload parts, compare
   - Recompute: `"sig_" + charCodeSum(header + "." + payload).toString(16)`
   - If mismatch → `{ valid: false, reason: "INVALID_SIGNATURE" }`
4. **Expiry Check** — `currentTimeMs > payload.exp` → `{ valid: false, reason: "TOKEN_EXPIRED", expiredAt: exp }`
5. **Not Before** — if `nbf` claim exists: `currentTimeMs < payload.nbf` → `{ valid: false, reason: "TOKEN_NOT_YET_VALID" }`
6. **Issuer Check** — `payload.iss !== expectedIssuer` → `{ valid: false, reason: "INVALID_ISSUER" }`
7. **Audience Check** — if `expectedAudience` set: `payload.aud !== expectedAudience` → `{ valid: false, reason: "INVALID_AUDIENCE" }`

- `validate(token, currentTimeMs)` → `{ valid: boolean, payload: decoded payload or null, reason: null or failure reason, checksPerformed: [check names] }`
- `verifySignature(token)` → `{ valid: boolean, reason: "SIGNATURE_VALID" or "INVALID_SIGNATURE" or "INVALID_FORMAT" }`
- `verifyClaims(token, currentTimeMs)` → `{ valid: boolean, claims: { exp: boolean, iss: boolean, aud: boolean }, reason: null or failure reason }`
- `getValidationLog()` → array of `{ token: first 20 chars, valid, reason, validatedAt: "2025-01-01T00:00:00Z" }`

**Validation:** invalid `validatorConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the JWT validator object with all 4 methods. |
| :----------- | :-------------------------------------------------- |

**Sample Input & Output:**

```javascript
const generator = createJWTGenerator({
  secret: "my-secret",
  issuer: "myapp.com",
  defaultExpiryMs: 3600000,
});
const validator = createJWTValidator({
  secret: "my-secret",
  expectedIssuer: "myapp.com",
  expectedAudience: null,
  clockSkewMs: 0,
});

const { token } = generator.generate({ sub: "U1", role: "ADMIN" });

// Valid token, current time within expiry:
validator.validate(token, 1000000 + 1000);
// → { valid: true, payload: { sub: "U1", role: "ADMIN", iss: "myapp.com", iat: 1000000, exp: 1003600000 }, reason: null, checksPerformed: ["FORMAT", "DECODE", "SIGNATURE", "EXPIRY", "ISSUER"] }

// Expired token (currentTime > exp):
validator.validate(token, 9999999999);
// → { valid: false, payload: null, reason: "TOKEN_EXPIRED", checksPerformed: ["FORMAT", "DECODE", "SIGNATURE", "EXPIRY"] }

// Tampered token:
validator.validate("tampered.token.here", 1000000);
// → { valid: false, payload: null, reason: "INVALID_SIGNATURE" or "INVALID_FORMAT", checksPerformed: [...] }
```

---

## 🧩 PROBLEM–04: 🔐 JWT Claims Manager

⚠️ **Function Name:** `createClaimsManager()`

| Input      | `claimsConfig` (object) |
| :--------- | :---------------------- |
| **Output** | object (claims manager) |

**Rules:**

`claimsConfig` object:

- `allowedRoles` (array of strings) — valid role values
- `allowedScopes` (array of strings) — valid scope values
- `requiredClaims` (array of strings) — claim names that must be present

Return a claims manager object with:

- `buildClaims(userInfo, options)` — build a complete claims object
- `validateClaims(claims)` — validate claims against config rules
- `extractClaims(token, fields)` — extract specific fields from a token's payload
- `mergeClaims(baseClaims, additionalClaims)` — merge two claim sets (additional overrides base)
- `checkPermission(token, requiredRole, requiredScope)` — check if token has required role/scope

**Rules:**

- `buildClaims(userInfo, options)`:
  - `userInfo`: `{ userId, role, scopes: [] }`
  - `options`: `{ expiryMs, audience, customClaims: {} }`
  - Validate `role` against `allowedRoles`
  - Validate each scope against `allowedScopes`
  - Build: `{ sub: userId, role, scopes, aud: audience, iat: 1000000, exp: 1000000 + expiryMs, ...customClaims }`
  - If invalid role → `{ error: "Invalid role: " + role }`
  - If invalid scope → `{ error: "Invalid scope: " + scope }`

- `validateClaims(claims)`:
  - Check all `requiredClaims` are present
  - Check role is in `allowedRoles` if present
  - Check all scopes are in `allowedScopes` if present
  - Returns `{ valid: boolean, errors: [string] }`

- `extractClaims(token, fields)`:
  - Decode token (using simulateBase64 reverse), extract only specified fields
  - Returns `{ extracted: { field: value }, missingFields: [fields not in payload] }`

- `mergeClaims(baseClaims, additionalClaims)`:
  - Merge objects: additional overrides base
  - Returns `{ merged: combinedObject, overriddenFields: [field names that were overridden] }`

- `checkPermission(token, requiredRole, requiredScope)`:
  - Decode token, check role and scope
  - Returns `{ permitted: boolean, tokenRole, requiredRole, hasScope: boolean, reason: null or explanation }`

**Validation:** invalid `claimsConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the claims manager object with all 5 methods. |
| :----------- | :--------------------------------------------------- |

**Sample Input & Output:**

```javascript
const cm = createClaimsManager({
  allowedRoles: ["ADMIN", "USER", "MOD"],
  allowedScopes: ["read:users", "write:users", "read:orders"],
  requiredClaims: ["sub", "role", "iat", "exp"],
});

cm.buildClaims(
  { userId: "U1", role: "ADMIN", scopes: ["read:users", "write:users"] },
  { expiryMs: 3600000, audience: "web", customClaims: { department: "IT" } },
);
// → { sub: "U1", role: "ADMIN", scopes: ["read:users", "write:users"], aud: "web", iat: 1000000, exp: 1003600000, department: "IT" }

cm.buildClaims(
  { userId: "U2", role: "SUPERADMIN", scopes: [] },
  { expiryMs: 3600000, audience: "web", customClaims: {} },
);
// → { error: "Invalid role: SUPERADMIN" }

cm.validateClaims({ sub: "U1", role: "ADMIN", iat: 1000000 });
// exp missing (required)
// → { valid: false, errors: ["exp: required claim missing"] }

cm.mergeClaims(
  { sub: "U1", role: "USER", iat: 1000000 },
  { role: "ADMIN", department: "IT" },
);
// → { merged: { sub: "U1", role: "ADMIN", iat: 1000000, department: "IT" }, overriddenFields: ["role"] }
```

---

## 🧩 PROBLEM–05: 🏗️ Full JWT Orchestrator

⚠️ **Function Name:** `runJWTOrchestrator()`

| Input      | `jwtConfig` (object) |
| :--------- | :------------------- |
| **Output** | object               |

**Rules:**

`jwtConfig` object:

- `orchestratorId` (string, non-empty)
- `secret` (string, non-empty)
- `issuer` (string, non-empty)
- `audience` (string, non-empty)
- `defaultExpiryMs` (number, > 0)
- `allowedRoles` (array of strings)
- `allowedScopes` (array of strings)
- `requiredClaims` (array of strings)
- `tokenRequests` (array of objects):
  - `requestId` (string)
  - `userInfo` (object: `{ userId, role, scopes }`)
  - `customClaims` (object or null)
  - `expiryOverrideMs` (number or null)
- `validationRequests` (array of objects):
  - `requestId` (string)
  - `tokenSource` (string) — references a `tokenRequests.requestId` whose token to validate
  - `currentTimeMs` (number)
  - `requiredRole` (string or null)
  - `requiredScope` (string or null)

**Orchestration Rules (compose all previous concepts):**

1. **Setup** — create generator (Problem-02), validator (Problem-03), claims manager (Problem-04)
2. **Process Token Requests:**
   - For each request: build claims (Problem-04) → generate JWT (Problem-02)
   - If claims invalid → record error
3. **Process Validation Requests:**
   - Find the token from the corresponding tokenRequest
   - Validate token (Problem-03)
   - If `requiredRole` or `requiredScope` → check permission (Problem-04)
   - Record result
4. **Build Summary:**
   - `tokensIssued` → successfully generated count
   - `tokensFailed` → failed generation count (invalid claims)
   - `validationsTotal`
   - `validationsPassed`
   - `validationsFailed`
   - `permissionDenied` → valid tokens but wrong role/scope

**Validation:** invalid `jwtConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ orchestratorId, tokenLog, validationLog, summary }`. |
| :----------- | :------------------------------------------------------------- |

**Sample Input & Output:**

- `runJWTOrchestrator({
  orchestratorId: "JWT-ORCH-01",
  secret: "super-secret-key",
  issuer: "myapp.com",
  audience: "web",
  defaultExpiryMs: 3600000,
  allowedRoles: ["ADMIN", "USER"],
  allowedScopes: ["read:users", "write:users"],
  requiredClaims: ["sub", "role", "iat", "exp"],
  tokenRequests: [
    { requestId: "TR-1", userInfo: { userId: "U1", role: "ADMIN", scopes: ["read:users", "write:users"] }, customClaims: { dept: "IT" }, expiryOverrideMs: null },
    { requestId: "TR-2", userInfo: { userId: "U2", role: "USER", scopes: ["read:users"] }, customClaims: null, expiryOverrideMs: null },
    { requestId: "TR-3", userInfo: { userId: "U3", role: "SUPERADMIN", scopes: [] }, customClaims: null, expiryOverrideMs: null }
  ],
  validationRequests: [
    { requestId: "VR-1", tokenSource: "TR-1", currentTimeMs: 1001000, requiredRole: "ADMIN", requiredScope: "write:users" },
    { requestId: "VR-2", tokenSource: "TR-2", currentTimeMs: 1001000, requiredRole: "ADMIN", requiredScope: null },
    { requestId: "VR-3", tokenSource: "TR-1", currentTimeMs: 9999999999, requiredRole: null, requiredScope: null }
  ]
})` →

  **Manual Verify:**
  - TR-1: role=ADMIN ✓, scopes valid ✓ → token generated
  - TR-2: role=USER ✓, scope valid ✓ → token generated
  - TR-3: role=SUPERADMIN ✗ → error
  - VR-1: TR-1 token valid, role=ADMIN ✓, scope write:users ✓ → permitted
  - VR-2: TR-2 token valid BUT role=USER ≠ ADMIN → permission denied
  - VR-3: TR-1 token expired (currentTime > exp) → validation failed
  - tokensIssued: 2, tokensFailed: 1
  - validationsPassed: 1, validationsFailed: 1 (expired), permissionDenied: 1

  `{
  orchestratorId: "JWT-ORCH-01",
  tokenLog: [
    { requestId: "TR-1", success: true, token: "<token>", claims: { sub: "U1", role: "ADMIN", scopes: ["read:users", "write:users"], dept: "IT", iss: "myapp.com", aud: "web", iat: 1000000, exp: 1003600000 } },
    { requestId: "TR-2", success: true, token: "<token>", claims: { sub: "U2", role: "USER", scopes: ["read:users"], iss: "myapp.com", aud: "web", iat: 1000000, exp: 1003600000 } },
    { requestId: "TR-3", success: false, error: "Invalid role: SUPERADMIN" }
  ],
  validationLog: [
    { requestId: "VR-1", tokenSource: "TR-1", valid: true, reason: null, permitted: true, permissionReason: null },
    { requestId: "VR-2", tokenSource: "TR-2", valid: true, reason: null, permitted: false, permissionReason: "Required role ADMIN but token has USER" },
    { requestId: "VR-3", tokenSource: "TR-1", valid: false, reason: "TOKEN_EXPIRED", permitted: false, permissionReason: "Token validation failed" }
  ],
  summary: {
    tokensIssued: 2,
    tokensFailed: 1,
    validationsTotal: 3,
    validationsPassed: 1,
    validationsFailed: 1,
    permissionDenied: 1
  }
}`

---
