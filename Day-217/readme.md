# 🎓 JS DAILY PRACTICE – DAY-217

📅 **Goal:** Config Loader Engine (Node.js Core Concepts Simulation)
🎯 **Focus:** Environment Config • Config Merging • Secret Masking • Validation • Dynamic Config Reload

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: ⚙️ Basic Config Loader

⚠️ **Function Name:** `loadConfig()`

| Input      | `rawConfig` (object), `environment` (string) |
| :--------- | :------------------------------------------- |
| **Output** | object                                       |

**Rules:**

`rawConfig` object — may contain these top-level keys:

- `default` (object) — base config applied to all environments
- `development` (object) — overrides for dev
- `staging` (object) — overrides for staging
- `production` (object) — overrides for production

`environment` must be one of: `"development"`, `"staging"`, `"production"`

**Loading Rules:**

- Start with `default` config (use `{}` if not present)
- Deep-merge the environment-specific config ON TOP of default (environment values win on conflict)
- Add `_meta` field to result: `{ environment, loadedAt: "2025-01-01T00:00:00Z" }`
- If a key exists in `default` but NOT in environment config → keep default value
- If a key exists in BOTH → environment value wins

**Deep Merge:** for nested objects, merge recursively (not shallow overwrite)

| Challenge 📢 | Return merged config object with `_meta`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------ |

**Sample Input & Output:**

- `loadConfig({
  default: {
    port: 3000,
    db: { host: "localhost", port: 5432 },
    logLevel: "info"
  },
  production: {
    port: 8080,
    db: { host: "prod-db.server.com" }
  }
}, "production")` →

  `{
  port: 8080,
  db: { host: "prod-db.server.com", port: 5432 },
  logLevel: "info",
  _meta: { environment: "production", loadedAt: "2025-01-01T00:00:00Z" }
}`

---

## 🧩 PROBLEM–02: 🔐 Secret Masker & Sanitizer

⚠️ **Function Name:** `sanitizeConfig()`

| Input      | `config` (object), `secretKeys` (array of strings) |
| :--------- | :------------------------------------------------- |
| **Output** | object                                             |

**Rules:**

`config` — flat or nested config object
`secretKeys` — array of key names whose values should be masked (e.g. `["password", "apiKey", "secret"]`)

**Sanitization Rules:**

- Traverse ALL levels of the config object (deep traversal)
- If a key name (case-insensitive) matches any entry in `secretKeys` → replace value with `"***MASKED***"`
- Non-secret fields stay unchanged
- Return a NEW object (do not mutate original)
- Also return `maskedCount` → total number of fields that were masked

| Challenge 📢 | Return `{ sanitized, maskedCount }`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------- |

**Sample Input & Output:**

- `sanitizeConfig(
  {
    port: 3000,
    db: {
      host: "localhost",
      password: "super-secret-123",
      port: 5432
    },
    apiKey: "key-abc-xyz",
    appName: "MyApp",
    auth: {
      secret: "jwt-secret-token",
      expiresIn: "7d"
    }
  },
  ["password", "apiKey", "secret"]
)` →

  `{
  sanitized: {
    port: 3000,
    db: { host: "localhost", password: "***MASKED***", port: 5432 },
    apiKey: "***MASKED***",
    appName: "MyApp",
    auth: { secret: "***MASKED***", expiresIn: "7d" }
  },
  maskedCount: 3
}`

---

## 🧩 PROBLEM–03: ✅ Config Schema Validator

⚠️ **Function Name:** `validateConfig()`

| Input      | `config` (object), `schema` (object) |
| :--------- | :----------------------------------- |
| **Output** | object                               |

**Rules:**

`config` — the config object to validate
`schema` — object where each key maps to a rule object:

- `required` (boolean)
- `type` (string: `"string"`, `"number"`, `"boolean"`, `"object"`, `"array"`)
- `allowedValues` (array or null) — if provided, value must be one of these
- `min` (number or null) — for numbers: value must be `>= min`
- `max` (number or null) — for numbers: value must be `<= max`

**Validation Rules:**

- Check TOP-LEVEL keys only (no deep schema validation needed)
- For each key in schema:
  - If `required: true` and key missing → error: `"${key}: required field missing"`
  - If key present and type wrong → error: `"${key}: expected ${type}, got ${actualType}"`
  - If `allowedValues` set and value not in list → error: `"${key}: value '${value}' not allowed"`
  - If `min` set and value `< min` → error: `"${key}: must be >= ${min}"`
  - If `max` set and value `> max` → error: `"${key}: must be <= ${max}"`
- `isValid` → true if no errors
- `warnings` → array of non-blocking notices:
  - If a key exists in `config` but NOT in `schema` → `"${key}: unknown config key (not in schema)"`

| Challenge 📢 | Return `{ isValid, errors, warnings, checkedFields }`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `validateConfig(
  {
    port: 8080,
    environment: "production",
    logLevel: "verbose",
    maxConnections: 5,
    undocumentedKey: "someValue"
  },
  {
    port: { required: true, type: "number", min: 1024, max: 65535, allowedValues: null },
    environment: { required: true, type: "string", allowedValues: ["development", "staging", "production"], min: null, max: null },
    logLevel: { required: true, type: "string", allowedValues: ["info", "warn", "error"], min: null, max: null },
    maxConnections: { required: false, type: "number", min: 1, max: 100, allowedValues: null },
    dbHost: { required: true, type: "string", allowedValues: null, min: null, max: null }
  }
)` →

  `{
  isValid: false,
  errors: [
    "logLevel: value 'verbose' not allowed",
    "dbHost: required field missing"
  ],
  warnings: ["undocumentedKey: unknown config key (not in schema)"],
  checkedFields: 5
}`

---

## 🧩 PROBLEM–04: 🔄 Dynamic Config Reloader

⚠️ **Function Name:** `createConfigReloader()`

| Input      | `initialConfig` (object), `schema` (object) |
| :--------- | :------------------------------------------ |
| **Output** | object (config reloader)                    |

**Rules:**

`initialConfig` — starting config object
`schema` — same schema shape as Problem-03

Return a config reloader object with:

- `getConfig()` — return current active config
- `reload(newConfig)` — validate new config against schema, if valid → replace active config, else reject
- `getHistory()` — return array of all past configs (before each reload)
- `rollback()` — revert to the previous config version
- `getVersion()` — return current version number (starts at 1, increments on each successful reload)

**Reload Rules:**

- `reload(newConfig)`:
  - Validate using Problem-03 logic
  - If `isValid: true` → store old config in history, set new config as active, increment version
  - Returns `{ reloaded: true, version: newVersion }` or `{ reloaded: false, errors }`
- `rollback()`:
  - If history is empty → `{ rolledBack: false, reason: "No previous version available" }`
  - Else → pop last history entry, set as active, decrement version
  - Returns `{ rolledBack: true, version: currentVersion }`
- `getHistory()` → array of past config objects (oldest first)

**Validation:** `initialConfig` and `schema` must be non-null objects. Invalid → return `"Invalid Input"` from factory.

| Challenge 📢 | Return the config reloader object with all 5 methods. |
| :----------- | :---------------------------------------------------- |

**Sample Input & Output:**

```javascript
const reloader = createConfigReloader(
  { port: 3000, logLevel: "info" },
  {
    port: {
      required: true,
      type: "number",
      min: 1024,
      max: 65535,
      allowedValues: null,
    },
    logLevel: {
      required: true,
      type: "string",
      allowedValues: ["info", "warn", "error"],
      min: null,
      max: null,
    },
  },
);

reloader.getVersion(); // → 1
reloader.getConfig(); // → { port: 3000, logLevel: "info" }

reloader.reload({ port: 4000, logLevel: "warn" });
// → { reloaded: true, version: 2 }

reloader.reload({ port: 99, logLevel: "info" });
// → { reloaded: false, errors: ["port: must be >= 1024"] }

reloader.getVersion(); // → 2 (failed reload didn't increment)

reloader.rollback();
// → { rolledBack: true, version: 1 }

reloader.getConfig();
// → { port: 3000, logLevel: "info" }

reloader.getHistory();
// → [] (after rollback, history is empty again)
```

---

## 🧩 PROBLEM–05: 🏗️ Full Config Orchestrator

⚠️ **Function Name:** `runConfigOrchestrator()`

| Input      | `orchestratorConfig` (object) |
| :--------- | :---------------------------- |
| **Output** | object                        |

**Rules:**

`orchestratorConfig` object:

- `configId` (string, non-empty)
- `rawConfig` (object) — multi-environment config (same shape as Problem-01)
- `environment` (string: `"development"`, `"staging"`, `"production"`)
- `schema` (object) — validation schema (same shape as Problem-03)
- `secretKeys` (array of strings) — keys to mask
- `reloadWith` (object or null) — if provided, attempt a config reload after initial load

**Orchestration Rules (compose all previous concepts):**

1. **Load** — merge config for the given environment (Problem-01 logic)
2. **Validate** — validate merged config against schema (Problem-03 logic)
   - If invalid → stop, return `{ status: "VALIDATION_FAILED", errors }`
3. **Sanitize** — mask secret keys in the merged config (Problem-02 logic)
4. **Reload** — if `reloadWith` is provided, attempt reload (Problem-04 logic):
   - Validate `reloadWith` against schema
   - If valid → use `reloadWith` as active config (sanitized), `reloadStatus: "SUCCESS"`
   - If invalid → keep original, `reloadStatus: "FAILED"`, include reload errors
5. **Build final output:**
   - `activeConfig` → sanitized version of the current active config
   - `validationResult` → from step 2
   - `reloadResult` → from step 4 (or `null` if `reloadWith` is null)

**Validation:** invalid `orchestratorConfig` or missing required fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ configId, status, activeConfig, validationResult, reloadResult }`. |
| :----------- | :--------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runConfigOrchestrator({
  configId: "CFG-01",
  rawConfig: {
    default: { port: 3000, logLevel: "info", db: { host: "localhost", password: "dev-pass" } },
    production: { port: 8080, db: { host: "prod-db.com" } }
  },
  environment: "production",
  schema: {
    port: { required: true, type: "number", min: 1024, max: 65535, allowedValues: null },
    logLevel: { required: true, type: "string", allowedValues: ["info", "warn", "error"], min: null, max: null }
  },
  secretKeys: ["password"],
  reloadWith: { port: 9090, logLevel: "warn", db: { host: "prod-db.com", password: "new-pass" } }
})` →

  `{
  configId: "CFG-01",
  status: "SUCCESS",
  activeConfig: {
    port: 9090,
    logLevel: "warn",
    db: { host: "prod-db.com", password: "***MASKED***" },
    _meta: { environment: "production", loadedAt: "2025-01-01T00:00:00Z" }
  },
  validationResult: {
    isValid: true,
    errors: [],
    warnings: [],
    checkedFields: 2
  },
  reloadResult: {
    reloadStatus: "SUCCESS",
    version: 2
  }
}`

---
