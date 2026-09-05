# 🎓 JS DAILY PRACTICE – DAY-248

📅 **Goal:** CORS Policy Simulator (Security & Auth Patterns)
🎯 **Focus:** CORS Headers • Origin Validation • Preflight Requests • Policy Configuration • Cross-Origin Security

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🌐 Origin Validator

⚠️ **Function Name:** `createOriginValidator()`

| Input      | `validatorConfig` (object) |
| :--------- | :------------------------- |
| **Output** | object (origin validator)  |

**Rules:**

`validatorConfig` object:

- `allowedOrigins` (array of strings) — exact origins e.g. `["https://myapp.com", "https://admin.myapp.com"]`
- `allowedPatterns` (array of strings) — wildcard patterns e.g. `["https://*.myapp.com", "http://localhost:*"]`
- `allowCredentials` (boolean) — if true, cannot use `"*"` for origin
- `allowAllOrigins` (boolean) — if true, all origins allowed (only when `allowCredentials: false`)

Return an origin validator object with:

- `validate(origin)` — check if origin is allowed
- `matchPattern(origin, pattern)` — check if origin matches a wildcard pattern
- `getEffectiveOrigin(origin)` — return what to put in `Access-Control-Allow-Origin` header
- `listAllowedOrigins()` — return full list of allowed origins and patterns
- `addOrigin(origin)` — dynamically add an allowed origin
- `removeOrigin(origin)` — remove an allowed origin

**Pattern Matching Rules:**

- `"https://*.myapp.com"` → matches any subdomain of myapp.com over HTTPS
  - `*` matches any sequence of non-dot characters
  - Replace `*` with regex `[^.]+` for matching
- `"http://localhost:*"` → matches any port on localhost
  - Port `*` → matches any number

**Operation Rules:**

- `validate(origin)`:
  - `origin` must be non-empty string
  - If `allowAllOrigins && !allowCredentials` → `{ allowed: true, origin, matchType: "WILDCARD_ALL" }`
  - Check exact match in `allowedOrigins`
  - Check pattern match in `allowedPatterns`
  - Returns `{ allowed: boolean, origin, matchType: "EXACT"/"PATTERN"/"NONE", matchedRule: string or null }`

- `matchPattern(origin, pattern)` → `{ matches: boolean, pattern, origin }`

- `getEffectiveOrigin(origin)`:
  - If `allowAllOrigins && !allowCredentials` → `"*"`
  - If origin is allowed → return the exact origin (for credential support)
  - If not allowed → `null`
  - Returns `{ effectiveOrigin: string or null, varyHeader: boolean }` (`varyHeader: true` if not `"*"`)

- `addOrigin(origin)` → `{ added: true, origin }` or `{ added: false, reason: "Already exists" }`
- `removeOrigin(origin)` → `{ removed: true, origin }` or `{ error: "Origin not found" }`
- `listAllowedOrigins()` → `{ exact: [strings], patterns: [strings], allowAllOrigins, allowCredentials }`

**Validation:** invalid `validatorConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the origin validator object with all 6 methods. |
| :----------- | :----------------------------------------------------- |

**Sample Input & Output:**

```javascript
const ov = createOriginValidator({
  allowedOrigins: ["https://myapp.com", "https://admin.myapp.com"],
  allowedPatterns: ["https://*.staging.myapp.com", "http://localhost:*"],
  allowCredentials: true,
  allowAllOrigins: false
});

ov.validate("https://myapp.com");
// → { allowed: true, origin: "https://myapp.com", matchType: "EXACT", matchedRule: "https://myapp.com" }

ov.validate("https://feature.staging.myapp.com");
// → { allowed: true, origin: "https://feature.staging.myapp.com", matchType: "PATTERN", matchedRule: "https://*.staging.myapp.com" }

ov.validate("http://localhost:3000");
// → { allowed: true, origin: "http://localhost:3000", matchType: "PATTERN", matchedRule: "http://localhost:*" }

ov.validate("https://evil.com");
// → { allowed: false, origin: "https://evil.com", matchType: "NONE", matchedRule: null }

ov.getEffectiveOrigin("https://myapp.com");
// → { effectiveOrigin: "https://myapp.com", varyHeader: true }

ov.matchPattern("https://feature.staging.myapp.com", "https://*.staging.myapp.com");
// → { matches: true, pattern: "https://*.staging.myapp.com", origin: "https://feature.staging.myapp.com" }
```

---

## 🧩 PROBLEM–02: ✈️ Preflight Request Handler

⚠️ **Function Name:** `createPreflightHandler()`

| Input      | `preflightConfig` (object) |
| :--------- | :------------------------- |
| **Output** | object (preflight handler) |

**Rules:**

`preflightConfig` object:

- `allowedMethods` (array of strings) — e.g. `["GET", "POST", "PUT", "DELETE", "PATCH"]`
- `allowedHeaders` (array of strings) — e.g. `["Content-Type", "Authorization", "X-Custom-Header"]`
- `exposedHeaders` (array of strings) — headers browser can access
- `maxAgeSeconds` (number, integer, ≥ 0) — preflight cache duration
- `allowCredentials` (boolean)

Return a preflight handler object with:

- `handlePreflight(request)` — process an OPTIONS preflight request
- `buildResponseHeaders(origin, method)` — build CORS response headers for actual request
- `isPreflightRequired(request)` — check if a request requires preflight
- `validatePreflightRequest(request)` — validate the preflight request fields

**Preflight Request Object:**

```javascript
{
  method: "OPTIONS",
  origin: string,
  accessControlRequestMethod: string,    // the actual method being requested
  accessControlRequestHeaders: [string]  // headers the actual request will send
}
```

**Operation Rules:**

- `handlePreflight(request)`:
  - Validate origin (use Problem-01 logic — pass origin validator as dependency or reimplement)
  - Check `accessControlRequestMethod` is in `allowedMethods`
  - Check all `accessControlRequestHeaders` are in `allowedHeaders`
  - If all pass → `{ allowed: true, responseHeaders: { ... }, statusCode: 204 }`
  - If origin blocked → `{ allowed: false, reason: "ORIGIN_NOT_ALLOWED", statusCode: 403 }`
  - If method not allowed → `{ allowed: false, reason: "METHOD_NOT_ALLOWED", statusCode: 405 }`
  - If header not allowed → `{ allowed: false, reason: "HEADER_NOT_ALLOWED", blockedHeader: string, statusCode: 403 }`

  **Response Headers (when allowed):**
  ```javascript
  {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": allowedMethods.join(", "),
    "Access-Control-Allow-Headers": allowedHeaders.join(", "),
    "Access-Control-Max-Age": maxAgeSeconds.toString(),
    "Access-Control-Allow-Credentials": allowCredentials.toString()
  }
  ```

- `buildResponseHeaders(origin, method)`:
  - For non-preflight responses
  - Returns object with `Access-Control-*` headers appropriate for the actual response

- `isPreflightRequired(request)`:
  - `request`: `{ method, headers: object }`
  - Simple requests (no preflight): GET/HEAD/POST with only simple headers (`Accept`, `Content-Type: text/plain or multipart/form-data or application/x-www-form-urlencoded`)
  - Complex requests: any other method or custom headers → preflight required
  - Returns `{ preflightRequired: boolean, reason: string }`

- `validatePreflightRequest(request)`:
  - Returns `{ valid: boolean, errors: [string] }`

**Validation:** invalid `preflightConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the preflight handler object with all 4 methods. |
| :----------- | :------------------------------------------------------ |

**Sample Input & Output:**

```javascript
const pfh = createPreflightHandler({
  allowedMethods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Request-Id"],
  maxAgeSeconds: 86400,
  allowCredentials: true
});

pfh.handlePreflight({
  method: "OPTIONS",
  origin: "https://myapp.com",
  accessControlRequestMethod: "PUT",
  accessControlRequestHeaders: ["Content-Type", "Authorization"]
});
// → {
//   allowed: true,
//   responseHeaders: {
//     "Access-Control-Allow-Origin": "https://myapp.com",
//     "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
//     "Access-Control-Allow-Headers": "Content-Type, Authorization",
//     "Access-Control-Max-Age": "86400",
//     "Access-Control-Allow-Credentials": "true"
//   },
//   statusCode: 204
// }

pfh.handlePreflight({
  method: "OPTIONS",
  origin: "https://myapp.com",
  accessControlRequestMethod: "DELETE",
  accessControlRequestHeaders: ["X-Evil-Header"]
});
// → { allowed: false, reason: "HEADER_NOT_ALLOWED", blockedHeader: "X-Evil-Header", statusCode: 403 }

pfh.isPreflightRequired({ method: "GET", headers: { "Accept": "application/json" } });
// → { preflightRequired: false, reason: "Simple request: safe method with simple headers" }

pfh.isPreflightRequired({ method: "PUT", headers: { "Content-Type": "application/json", "Authorization": "Bearer token" } });
// → { preflightRequired: true, reason: "Non-simple method: PUT" }
```

---

## 🧩 PROBLEM–03: ⚙️ CORS Policy Builder

⚠️ **Function Name:** `createCORSPolicyBuilder()`

| Input      | None (factory function)     |
| :--------- | :-------------------------- |
| **Output** | object (CORS policy builder)|

**Rules:**

Return a CORS policy builder with **method chaining**:

- `allowOrigin(origin)` — add allowed origin (exact)
- `allowOriginPattern(pattern)` — add wildcard pattern
- `allowAllOrigins()` — allow all origins (sets `*`)
- `allowMethod(method)` — add allowed HTTP method
- `allowMethods(methods)` — add multiple methods
- `allowHeader(header)` — add allowed request header
- `allowHeaders(headers)` — add multiple headers
- `exposeHeader(header)` — add exposed response header
- `withCredentials(bool)` — set credentials flag
- `maxAge(seconds)` — set preflight cache duration
- `build()` — build and return the final CORS policy object
- `buildMiddlewareConfig()` — build config ready for middleware use
- `reset()` — reset all settings

**Build Output:**

```javascript
{
  allowedOrigins: [],
  allowedPatterns: [],
  allowAllOrigins: boolean,
  allowedMethods: [],
  allowedHeaders: [],
  exposedHeaders: [],
  allowCredentials: boolean,
  maxAgeSeconds: number,
  isValid: boolean,
  validationErrors: []
}
```

**Validation Rules on `build()`:**

- If `allowAllOrigins && allowCredentials` → error: `"Cannot use wildcard origin with credentials"`
- If no methods allowed → error: `"At least one method must be allowed"`
- Returns policy with `isValid` flag

**Validation:** method-level invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the CORS policy builder object with all methods supporting chaining. |
| :----------- | :-------------------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const builder = createCORSPolicyBuilder();

const policy = builder
  .allowOrigin("https://myapp.com")
  .allowOriginPattern("https://*.staging.myapp.com")
  .allowMethod("GET")
  .allowMethods(["POST", "PUT", "DELETE"])
  .allowHeaders(["Content-Type", "Authorization"])
  .exposeHeader("X-Request-Id")
  .withCredentials(true)
  .maxAge(86400)
  .build();

// → {
//   allowedOrigins: ["https://myapp.com"],
//   allowedPatterns: ["https://*.staging.myapp.com"],
//   allowAllOrigins: false,
//   allowedMethods: ["GET", "POST", "PUT", "DELETE"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   exposedHeaders: ["X-Request-Id"],
//   allowCredentials: true,
//   maxAgeSeconds: 86400,
//   isValid: true,
//   validationErrors: []
// }

// Invalid: wildcard + credentials
builder.reset();
builder.allowAllOrigins().withCredentials(true).allowMethod("GET").build();
// → { ..., isValid: false, validationErrors: ["Cannot use wildcard origin with credentials"] }
```

---

## 🧩 PROBLEM–04: 🔄 CORS Request Processor

⚠️ **Function Name:** `createCORSProcessor()`

| Input      | `corsPolicy` (object)      |
| :--------- | :------------------------- |
| **Output** | object (CORS processor)    |

**Rules:**

`corsPolicy` — a CORS policy object (same shape as Problem-03 `build()` output)

Return a CORS processor object with:

- `processRequest(request)` — process a cross-origin request
- `processRequestBatch(requests)` — process multiple requests
- `getAccessLog()` — return log of all processed requests
- `getBlockedRequests()` — return only blocked requests
- `generateCORSReport()` — comprehensive CORS usage report

**Request Object:**

```javascript
{
  requestId: string,
  method: string,
  origin: string,
  headers: object,
  path: string,
  isPreflight: boolean
}
```

**Processing Rules:**

- `processRequest(request)`:
  1. If no `Origin` header (same-origin) → pass through: `{ allowed: true, reason: "SAME_ORIGIN", corsHeaders: {} }`
  2. Validate origin against policy
  3. If preflight (`isPreflight: true` OR `method === "OPTIONS"`) → handle as preflight
  4. If simple request → add CORS response headers
  5. Build response:
     ```javascript
     {
       requestId,
       allowed: boolean,
       reason: "ORIGIN_ALLOWED"/"ORIGIN_BLOCKED"/"METHOD_BLOCKED"/"PREFLIGHT_OK"/"SAME_ORIGIN",
       corsHeaders: { "Access-Control-Allow-Origin": ..., ... },
       statusCode: 200 or 403 or 204
     }
     ```
  6. Log the request

- `processRequestBatch(requests)` → `{ results: [process results], allowedCount, blockedCount }`

- `getAccessLog()` → array of `{ requestId, origin, method, allowed, reason, processedAt: "2025-01-01T00:00:00Z" }`

- `getBlockedRequests()` → filtered access log (only blocked)

- `generateCORSReport()` → `{ totalRequests, allowedCount, blockedCount, blockRate: percentage, topOrigins: [{ origin, count }], topBlockedOrigins: [{ origin, count }] }`

**Validation:** invalid `corsPolicy` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the CORS processor object with all 5 methods. |
| :----------- | :---------------------------------------------------- |

**Sample Input & Output:**

```javascript
const policy = {
  allowedOrigins: ["https://myapp.com"],
  allowedPatterns: [],
  allowAllOrigins: false,
  allowedMethods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  exposedHeaders: [],
  allowCredentials: true,
  maxAgeSeconds: 3600,
  isValid: true
};

const processor = createCORSProcessor(policy);

processor.processRequest({ requestId: "R1", method: "GET", origin: "https://myapp.com", headers: {}, path: "/api/users", isPreflight: false });
// → { requestId: "R1", allowed: true, reason: "ORIGIN_ALLOWED", corsHeaders: { "Access-Control-Allow-Origin": "https://myapp.com", "Access-Control-Allow-Credentials": "true" }, statusCode: 200 }

processor.processRequest({ requestId: "R2", method: "GET", origin: "https://evil.com", headers: {}, path: "/api/data", isPreflight: false });
// → { requestId: "R2", allowed: false, reason: "ORIGIN_BLOCKED", corsHeaders: {}, statusCode: 403 }

processor.processRequest({ requestId: "R3", method: "OPTIONS", origin: "https://myapp.com", headers: { "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "Content-Type" }, path: "/api/users", isPreflight: true });
// → { requestId: "R3", allowed: true, reason: "PREFLIGHT_OK", corsHeaders: { "Access-Control-Allow-Origin": "https://myapp.com", "Access-Control-Allow-Methods": "GET, POST", ... }, statusCode: 204 }

processor.generateCORSReport();
// → { totalRequests: 3, allowedCount: 2, blockedCount: 1, blockRate: 33.33, topOrigins: [{ origin: "https://myapp.com", count: 2 }, { origin: "https://evil.com", count: 1 }], topBlockedOrigins: [{ origin: "https://evil.com", count: 1 }] }
```

---

## 🧩 PROBLEM–05: 🏗️ Full CORS Orchestrator

⚠️ **Function Name:** `runCORSOrchestrator()`

| Input      | `corsConfig` (object) |
| :--------- | :-------------------- |
| **Output** | object                |

**Rules:**

`corsConfig` object:

- `orchestratorId` (string, non-empty)
- `policies` (array of objects):
  - `policyId` (string)
  - `name` (string)
  - `environment` (string: `"development"`, `"staging"`, `"production"`)
  - `policyConfig` (object) — builder config:
    - `allowedOrigins` (array)
    - `allowedPatterns` (array)
    - `allowAllOrigins` (boolean)
    - `allowedMethods` (array)
    - `allowedHeaders` (array)
    - `exposedHeaders` (array)
    - `allowCredentials` (boolean)
    - `maxAgeSeconds` (number)
- `activeEnvironment` (string) — which policy environment to use
- `incomingRequests` (array of objects) — same shape as Problem-04 request object

**Orchestration Rules (compose all previous concepts):**

1. **Build Policies** — use Problem-03 builder to build each policy config
2. **Select Active Policy** — find policy matching `activeEnvironment`
3. **Validate Origins** — use Problem-01 origin validator with active policy
4. **Handle Preflights** — use Problem-02 preflight handler for OPTIONS requests
5. **Process All Requests** — use Problem-04 processor
6. **Generate Report:**
   - `activePolicyId` → which policy was used
   - `policyValidation` → `{ isValid, validationErrors }`
   - `requestSummary` → from `generateCORSReport()`
   - `preflightCount` → OPTIONS requests count
   - `credentialRequests` → requests with `Origin` that allowed credentials

**Validation:** invalid `corsConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ orchestratorId, activePolicyId, requestLog, report }`. |
| :----------- | :--------------------------------------------------------------- |

**Sample Input & Output:**

- `runCORSOrchestrator({
  orchestratorId: "CORS-ORCH-01",
  policies: [
    {
      policyId: "POL-DEV",
      name: "Development Policy",
      environment: "development",
      policyConfig: {
        allowedOrigins: [], allowedPatterns: [],
        allowAllOrigins: true, allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: [], allowCredentials: false, maxAgeSeconds: 0
      }
    },
    {
      policyId: "POL-PROD",
      name: "Production Policy",
      environment: "production",
      policyConfig: {
        allowedOrigins: ["https://myapp.com", "https://admin.myapp.com"],
        allowedPatterns: [],
        allowAllOrigins: false, allowedMethods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["X-Request-Id"], allowCredentials: true, maxAgeSeconds: 86400
      }
    }
  ],
  activeEnvironment: "production",
  incomingRequests: [
    { requestId: "REQ-1", method: "GET", origin: "https://myapp.com", headers: {}, path: "/api/users", isPreflight: false },
    { requestId: "REQ-2", method: "OPTIONS", origin: "https://myapp.com", headers: { "Access-Control-Request-Method": "POST" }, path: "/api/users", isPreflight: true },
    { requestId: "REQ-3", method: "GET", origin: "https://evil.com", headers: {}, path: "/api/data", isPreflight: false },
    { requestId: "REQ-4", method: "DELETE", origin: "https://myapp.com", headers: {}, path: "/api/users/1", isPreflight: false }
  ]
})` →

  **Manual Verify:**
  - Active policy: POL-PROD (production)
  - REQ-1: GET from myapp.com → allowed ✓
  - REQ-2: OPTIONS preflight from myapp.com, method=POST → POST in allowed ✓ → preflight OK
  - REQ-3: GET from evil.com → origin blocked ✗
  - REQ-4: DELETE from myapp.com → DELETE not in allowed methods ✗
  - allowedCount: 2, blockedCount: 2

  `{
  orchestratorId: "CORS-ORCH-01",
  activePolicyId: "POL-PROD",
  requestLog: [
    { requestId: "REQ-1", allowed: true, reason: "ORIGIN_ALLOWED", statusCode: 200, corsHeaders: { "Access-Control-Allow-Origin": "https://myapp.com", "Access-Control-Allow-Credentials": "true" } },
    { requestId: "REQ-2", allowed: true, reason: "PREFLIGHT_OK", statusCode: 204, corsHeaders: { "Access-Control-Allow-Origin": "https://myapp.com", "Access-Control-Allow-Methods": "GET, POST", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400", "Access-Control-Allow-Credentials": "true" } },
    { requestId: "REQ-3", allowed: false, reason: "ORIGIN_BLOCKED", statusCode: 403, corsHeaders: {} },
    { requestId: "REQ-4", allowed: false, reason: "METHOD_BLOCKED", statusCode: 405, corsHeaders: {} }
  ],
  report: {
    activePolicyId: "POL-PROD",
    policyValidation: { isValid: true, validationErrors: [] },
    requestSummary: { totalRequests: 4, allowedCount: 2, blockedCount: 2, blockRate: 50.00, topOrigins: [{ origin: "https://myapp.com", count: 3 }, { origin: "https://evil.com", count: 1 }], topBlockedOrigins: [{ origin: "https://evil.com", count: 1 }, { origin: "https://myapp.com", count: 1 }] },
    preflightCount: 1,
    credentialRequests: 2
  }
}`

---