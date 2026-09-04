# 🎓 JS DAILY PRACTICE – DAY-247

📅 **Goal:** Input Sanitizer (Security & Auth Patterns)
🎯 **Focus:** XSS Prevention • SQL Injection Prevention • Input Validation • Data Sanitization • Threat Detection

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🛡️ XSS Sanitizer

⚠️ **Function Name:** `createXSSSanitizer()`

| Input      | `sanitizerConfig` (object) |
| :--------- | :------------------------- |
| **Output** | object (XSS sanitizer)     |

**Rules:**

`sanitizerConfig` object:

- `allowedTags` (array of strings) — HTML tags allowed to remain e.g. `["b", "i", "p"]`
- `allowedAttributes` (object) — `{ tagName: [allowedAttr] }` e.g. `{ "a": ["href"] }`
- `mode` (string: `"STRIP"`, `"ESCAPE"`, `"ENCODE"`) — how to handle dangerous content
  - `"STRIP"` → remove dangerous tags/content entirely
  - `"ESCAPE"` → convert `<` `>` `&` `"` `'` to HTML entities
  - `"ENCODE"` → encode all HTML special chars

Return an XSS sanitizer object with:

- `sanitize(input)` — sanitize a string
- `sanitizeObject(obj)` — sanitize all string values in an object (deep)
- `detectThreats(input)` — detect XSS patterns without sanitizing
- `getBatchReport(inputs)` — sanitize and report on multiple inputs

**Sanitization Rules:**

**HTML Entity Mapping:**
- `<` → `&lt;`
- `>` → `&gt;`
- `&` → `&amp;`
- `"` → `&quot;`
- `'` → `&#x27;`
- `/` → `&#x2F;`

- `sanitize(input)`:
  - `input` must be string
  - Detect dangerous patterns:
    - `<script>`, `javascript:`, `onerror=`, `onload=`, `onclick=`, `eval(`, `alert(`, `document.cookie`
  - Apply mode:
    - `"STRIP"` → remove all HTML tags not in `allowedTags`; remove dangerous attributes
    - `"ESCAPE"` → escape all `< > & " '` characters
    - `"ENCODE"` → encode all special chars to HTML entities
  - Returns `{ original, sanitized, threatsDetected: boolean, threatCount: N, mode }`

- `sanitizeObject(obj)`:
  - Recursively traverse all string values, apply `sanitize()` to each
  - Returns `{ sanitized: newObject, totalFieldsSanitized: N, threatsFound: N }`

- `detectThreats(input)`:
  - Scan for XSS patterns
  - Returns `{ hasThreats: boolean, threats: [{ pattern, location: index, severity: "LOW"/"MEDIUM"/"HIGH"/"CRITICAL" }] }`
  - Severity: `<script>` → CRITICAL, `javascript:` → HIGH, `onerror=` → HIGH, `alert(` → MEDIUM, `eval(` → CRITICAL

- `getBatchReport(inputs)`:
  - Array of strings
  - Returns `{ total, threatsDetected: count, cleanInputs: count, results: [{ index, sanitized, threatsDetected }] }`

**Validation:** invalid `sanitizerConfig` → return `"Invalid Input"` from factory. Method-level invalid → return `"Invalid Input"`

| Challenge 📢 | Return the XSS sanitizer object with all 4 methods. |
| :----------- | :-------------------------------------------------- |

**Sample Input & Output:**

```javascript
const xss = createXSSSanitizer({
  allowedTags: ["b", "i", "p"],
  allowedAttributes: { "a": ["href"] },
  mode: "ESCAPE"
});

xss.sanitize('<script>alert("XSS")</script><b>Hello</b>');
// → {
//   original: '<script>alert("XSS")</script><b>Hello</b>',
//   sanitized: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;&lt;b&gt;Hello&lt;/b&gt;',
//   threatsDetected: true,
//   threatCount: 2,
//   mode: "ESCAPE"
// }

xss.detectThreats('Hello <script>document.cookie</script> world');
// → {
//   hasThreats: true,
//   threats: [
//     { pattern: "<script>", location: 6, severity: "CRITICAL" },
//     { pattern: "document.cookie", location: 14, severity: "HIGH" }
//   ]
// }

xss.sanitizeObject({
  name: "Rahim",
  comment: '<img onerror="alert(1)" src="x">',
  nested: { bio: "<script>evil()</script>" }
});
// → {
//   sanitized: {
//     name: "Rahim",
//     comment: '&lt;img onerror=&quot;alert(1)&quot; src=&quot;x&quot;&gt;',
//     nested: { bio: '&lt;script&gt;evil()&lt;/script&gt;' }
//   },
//   totalFieldsSanitized: 3,
//   threatsFound: 2
// }
```

---

## 🧩 PROBLEM–02: 💉 SQL Injection Preventer

⚠️ **Function Name:** `createSQLInjectionPreventer()`

| Input      | `preventerConfig` (object) |
| :--------- | :------------------------- |
| **Output** | object (SQL preventer)     |

**Rules:**

`preventerConfig` object:

- `strictMode` (boolean) — if true, reject inputs with ANY SQL keywords
- `allowedKeywords` (array of strings) — SQL keywords allowed (only used if `strictMode: false`)

Return a SQL injection preventer object with:

- `sanitize(input)` — clean/escape input for safe SQL use
- `detectInjection(input)` — detect SQL injection patterns
- `buildParameterizedQuery(template, params)` — safely build a query
- `validateQueryInput(inputs)` — validate a set of inputs

**SQL Injection Patterns to detect:**

- `' OR '1'='1` style conditions
- `--` (comment injection)
- `; DROP TABLE` or any `; + SQL_KEYWORD`
- `UNION SELECT`
- `INSERT INTO`, `DELETE FROM`, `UPDATE ... SET` (when in user input)
- `xp_cmdshell`, `EXEC(`, `EXECUTE(`
- `0x` (hex encoding)
- `WAITFOR DELAY` (time-based injection)

**Severity levels:**
- CRITICAL: `DROP`, `TRUNCATE`, `xp_cmdshell`, `EXEC(`
- HIGH: `UNION SELECT`, `INSERT INTO`, `DELETE FROM`
- MEDIUM: `--`, `; `, `OR '1'='1`
- LOW: SQL keywords in unusual positions

**Operation Rules:**

- `sanitize(input)`:
  - `input` must be string
  - Escape single quotes: `'` → `''` (double single quote)
  - Escape backslashes: `\` → `\\`
  - Remove `--` comments
  - Remove `;` terminators
  - Returns `{ original, sanitized, escapedChars: N, removedPatterns: [string] }`

- `detectInjection(input)`:
  - Returns `{ hasInjection: boolean, patterns: [{ pattern, severity, location }], riskScore: 0-100 }`
  - `riskScore = min(100, sum of: CRITICAL×40 + HIGH×20 + MEDIUM×10 + LOW×5)`

- `buildParameterizedQuery(template, params)`:
  - `template`: SQL template with `?` placeholders e.g. `"SELECT * FROM users WHERE id = ? AND role = ?"`
  - `params`: array of values to safely substitute
  - Sanitize each param, replace `?` in order
  - Returns `{ query: finalQuery, paramCount, sanitizedParams: [strings] }`

- `validateQueryInput(inputs)`:
  - `inputs`: object `{ fieldName: value }`
  - Check each value for injection
  - Returns `{ valid: boolean, fieldResults: { fieldName: { safe: boolean, riskScore } }, overallRisk: "LOW"/"MEDIUM"/"HIGH"/"CRITICAL" }`

**Validation:** invalid `preventerConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the SQL injection preventer object with all 4 methods. |
| :----------- | :------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const sqli = createSQLInjectionPreventer({ strictMode: false, allowedKeywords: [] });

sqli.detectInjection("' OR '1'='1' --");
// → {
//   hasInjection: true,
//   patterns: [
//     { pattern: "OR '1'='1", severity: "MEDIUM", location: 2 },
//     { pattern: "--", severity: "MEDIUM", location: 14 }
//   ],
//   riskScore: 20
// }

sqli.detectInjection("'; DROP TABLE users; --");
// → {
//   hasInjection: true,
//   patterns: [
//     { pattern: "DROP", severity: "CRITICAL", location: 3 },
//     { pattern: "--", severity: "MEDIUM", location: 21 }
//   ],
//   riskScore: 50
// }

sqli.sanitize("Robert'); DROP TABLE students; --");
// → {
//   original: "Robert'); DROP TABLE students; --",
//   sanitized: "Robert'') DROP TABLE students",
//   escapedChars: 1,
//   removedPatterns: ["--", ";"]
// }

sqli.buildParameterizedQuery(
  "SELECT * FROM users WHERE username = ? AND password = ?",
  ["admin' --", "pass123"]
);
// → {
//   query: "SELECT * FROM users WHERE username = 'admin'' ' AND password = 'pass123'",
//   paramCount: 2,
//   sanitizedParams: ["admin'' ", "pass123"]
// }
```

---

## 🧩 PROBLEM–03: 📝 Input Validation & Type Coercion

⚠️ **Function Name:** `createInputValidator()`

| Input      | `validatorConfig` (object) |
| :--------- | :------------------------- |
| **Output** | object (input validator)   |

**Rules:**

`validatorConfig` object:

- `strictTypes` (boolean) — if true, reject type coercion; require exact types
- `maxStringLength` (number, integer, ≥ 1)
- `allowNull` (boolean)
- `customRules` (array of objects):
  - `name` (string)
  - `test` (function) — `(value) => boolean`
  - `message` (string)

Return an input validator object with:

- `validate(value, schema)` — validate a single value against a schema
- `validateBatch(inputs)` — validate multiple `{ field, value, schema }` objects
- `coerce(value, targetType)` — safely coerce value to target type
- `sanitizeAndValidate(value, schema)` — sanitize first then validate

**Schema Object:**

```javascript
{
  type: "string" | "number" | "boolean" | "array" | "object" | "email" | "url" | "date",
  required: boolean,
  min: number or null,         // for numbers: min value; for strings: min length
  max: number or null,         // for numbers: max value; for strings: max length
  pattern: regex string or null, // regex pattern string
  enum: [values] or null,       // allowed values
  customRule: string or null    // name of custom rule to apply
}
```

**Operation Rules:**

- `validate(value, schema)`:
  - Check required, type, min/max, pattern, enum, custom rules
  - Special types:
    - `"email"` → must match `contains @ and .`
    - `"url"` → must start with `http://` or `https://`
    - `"date"` → must match `YYYY-MM-DD` format
  - Returns `{ valid: boolean, value, errors: [string], warnings: [string] }`

- `validateBatch(inputs)`:
  - Returns `{ results: [{ field, valid, errors }], allValid: boolean, invalidCount: N }`

- `coerce(value, targetType)`:
  - `"number"` → `Number(value)` if valid, else `{ error: "Cannot coerce to number" }`
  - `"boolean"` → `"true"/"1"/true` → `true`, `"false"/"0"/false` → `false`
  - `"string"` → `String(value)`
  - `"array"` → if string, try `JSON.parse`; if already array, return as-is
  - Returns `{ original: value, coerced: result, targetType, success: boolean }`

- `sanitizeAndValidate(value, schema)`:
  - If string: trim whitespace, truncate to `maxStringLength`
  - Then run `validate()`
  - Returns `{ original, sanitized, validation: validateResult }`

**Validation:** invalid `validatorConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the input validator object with all 4 methods. |
| :----------- | :----------------------------------------------------- |

**Sample Input & Output:**

```javascript
const iv = createInputValidator({
  strictTypes: false,
  maxStringLength: 255,
  allowNull: false,
  customRules: [
    { name: "noSpaces", test: (v) => !v.includes(" "), message: "Value must not contain spaces" }
  ]
});

iv.validate("rahim@example.com", { type: "email", required: true, min: null, max: null, pattern: null, enum: null, customRule: null });
// → { valid: true, value: "rahim@example.com", errors: [], warnings: [] }

iv.validate("not-an-email", { type: "email", required: true, min: null, max: null, pattern: null, enum: null, customRule: null });
// → { valid: false, value: "not-an-email", errors: ["Invalid email format"], warnings: [] }

iv.validate("admin user", { type: "string", required: true, min: 3, max: 20, pattern: null, enum: null, customRule: "noSpaces" });
// → { valid: false, value: "admin user", errors: ["Value must not contain spaces"], warnings: [] }

iv.coerce("42", "number");
// → { original: "42", coerced: 42, targetType: "number", success: true }

iv.sanitizeAndValidate("  hello@world.com  ", { type: "email", required: true, min: null, max: null, pattern: null, enum: null, customRule: null });
// → { original: "  hello@world.com  ", sanitized: "hello@world.com", validation: { valid: true, value: "hello@world.com", errors: [], warnings: [] } }

iv.validateBatch([
  { field: "username", value: "Rahim", schema: { type: "string", required: true, min: 3, max: 20, pattern: null, enum: null, customRule: null } },
  { field: "age", value: "17", schema: { type: "number", required: true, min: 18, max: 120, pattern: null, enum: null, customRule: null } }
]);
// → { results: [{ field: "username", valid: true, errors: [] }, { field: "age", valid: false, errors: ["Value must be at least 18"] }], allValid: false, invalidCount: 1 }
```

---

## 🧩 PROBLEM–04: 🔍 Threat Detection Engine

⚠️ **Function Name:** `createThreatDetectionEngine()`

| Input      | `engineConfig` (object)     |
| :--------- | :-------------------------- |
| **Output** | object (threat engine)      |

**Rules:**

`engineConfig` object:

- `enabledDetectors` (array of strings):
  - `"XSS"`, `"SQLI"`, `"PATH_TRAVERSAL"`, `"COMMAND_INJECTION"`, `"LDAP_INJECTION"`, `"XML_INJECTION"`
- `blockOnThreat` (boolean) — if true, block input when threat detected
- `logThreats` (boolean) — if true, maintain threat log

Return a threat detection engine object with:

- `scan(input)` — scan input for all enabled threat types
- `scanRequest(request)` — scan entire HTTP-like request object
- `getThreatLog()` — return all detected threats
- `getStats()` — return detection statistics

**Threat Patterns:**

- **XSS**: `<script>`, `javascript:`, `onerror=`, `alert(`, `eval(`
- **SQLI**: `' OR`, `UNION SELECT`, `DROP TABLE`, `--`, `; SELECT`
- **PATH_TRAVERSAL**: `../`, `..\`, `%2e%2e`, `/etc/passwd`, `C:\Windows`
- **COMMAND_INJECTION**: `; ls`, `| cat`, `&& rm`, `` ` ``, `$(`, `> /dev/null`
- **LDAP_INJECTION**: `*)(uid=`, `)(|(`, `\2a`, `\28`, `\29`
- **XML_INJECTION**: `<!ENTITY`, `<!DOCTYPE`, `]]>`, `<![CDATA[`

**Severity Mapping:**
- COMMAND_INJECTION → CRITICAL
- PATH_TRAVERSAL → HIGH
- SQLI → HIGH
- XSS → MEDIUM
- LDAP_INJECTION → MEDIUM
- XML_INJECTION → LOW

**Operation Rules:**

- `scan(input)`:
  - Run each enabled detector
  - Returns `{ input: first 50 chars + "...", threats: [{ type, pattern, severity, location }], threatCount, highestSeverity, blocked: boolean }`

- `scanRequest(request)`:
  - `request`: `{ path, queryParams: object, headers: object, body: object }`
  - Scan all string values across all parts
  - Returns `{ path: scan result, queryParams: { field: scan result }, headers: scan result, body: scan result, overallThreatLevel, blocked: boolean }`

- `getThreatLog()` → array of `{ scannedAt: "2025-01-01T00:00:00Z", input: first 30 chars, threatCount, highestSeverity }`

- `getStats()` → `{ totalScans, threatsDetected, byType: { threatType: count }, bySeverity: { severity: count }, blockRate: percentage }`

**Validation:** invalid `engineConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the threat detection engine object with all 4 methods. |
| :----------- | :------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const tde = createThreatDetectionEngine({
  enabledDetectors: ["XSS", "SQLI", "PATH_TRAVERSAL"],
  blockOnThreat: true,
  logThreats: true
});

tde.scan("Hello World");
// → { input: "Hello World", threats: [], threatCount: 0, highestSeverity: null, blocked: false }

tde.scan("'; DROP TABLE users; -- <script>alert(1)</script>");
// → {
//   input: "'; DROP TABLE users; -- <script>alert(1)</script>...",
//   threats: [
//     { type: "SQLI", pattern: "DROP TABLE", severity: "HIGH", location: 3 },
//     { type: "SQLI", pattern: "--", severity: "MEDIUM", location: 21 },
//     { type: "XSS", pattern: "<script>", severity: "MEDIUM", location: 24 },
//     { type: "XSS", pattern: "alert(", severity: "MEDIUM", location: 32 }
//   ],
//   threatCount: 4,
//   highestSeverity: "HIGH",
//   blocked: true
// }

tde.scanRequest({
  path: "/api/users/../admin",
  queryParams: { search: "' OR 1=1 --", page: "1" },
  headers: { "Authorization": "Bearer token123" },
  body: { name: "Rahim", comment: "<script>steal()</script>" }
});
// → {
//   path: { threats: [{ type: "PATH_TRAVERSAL", pattern: "../", severity: "HIGH" }], threatCount: 1 },
//   queryParams: { search: { threats: [{ type: "SQLI", ... }], threatCount: 1 }, page: { threats: [], threatCount: 0 } },
//   headers: { threats: [], threatCount: 0 },
//   body: { comment: { threats: [{ type: "XSS", ... }], threatCount: 1 }, name: { threats: [], threatCount: 0 } },
//   overallThreatLevel: "HIGH",
//   blocked: true
// }
```

---

## 🧩 PROBLEM–05: 🏗️ Full Input Security Orchestrator

⚠️ **Function Name:** `runInputSecurityOrchestrator()`

| Input      | `securityConfig` (object) |
| :--------- | :------------------------ |
| **Output** | object                    |

**Rules:**

`securityConfig` object:

- `orchestratorId` (string, non-empty)
- `xssConfig` (object) — same shape as Problem-01
- `sqliConfig` (object) — same shape as Problem-02
- `validatorConfig` (object) — same shape as Problem-03
- `threatConfig` (object) — same shape as Problem-04
- `inputRequests` (array of objects):
  - `requestId` (string)
  - `source` (string: `"WEB_FORM"`, `"API"`, `"WEBHOOK"`)
  - `data` (object) — raw input data with field values
  - `schema` (object) — `{ fieldName: schemaObject }` for validation
  - `sanitizationMode` (string: `"XSS_ONLY"`, `"SQLI_ONLY"`, `"FULL"`)

**Orchestration Rules (compose all previous concepts):**

1. For each input request:
   - **Threat Detection** (Problem-04) — scan all string values
   - If threats found AND `blockOnThreat: true` → block request, skip remaining steps
   - **XSS Sanitization** (Problem-01) — if `sanitizationMode` includes XSS
   - **SQL Injection Prevention** (Problem-02) — if `sanitizationMode` includes SQLI
   - **Validation** (Problem-03) — validate sanitized values against schema
   - Build result per request

2. **Summary:**
   - `totalRequests`
   - `blocked` → threat-blocked count
   - `sanitized` → processed count
   - `validationPassed` → passed validation
   - `validationFailed` → failed validation
   - `threatBreakdown` → `{ XSS: N, SQLI: N, PATH_TRAVERSAL: N, ... }`

**Validation:** invalid `securityConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ orchestratorId, requestLog, summary }` where `requestLog` is array of `{ requestId, source, blocked, threatCount, sanitized, validationResult }`. |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runInputSecurityOrchestrator({
  orchestratorId: "INPUT-SEC-01",
  xssConfig: { allowedTags: [], allowedAttributes: {}, mode: "ESCAPE" },
  sqliConfig: { strictMode: false, allowedKeywords: [] },
  validatorConfig: { strictTypes: false, maxStringLength: 255, allowNull: false, customRules: [] },
  threatConfig: { enabledDetectors: ["XSS", "SQLI"], blockOnThreat: true, logThreats: true },
  inputRequests: [
    {
      requestId: "REQ-1",
      source: "WEB_FORM",
      data: { name: "Rahim", email: "rahim@mail.com", age: "25" },
      schema: {
        name: { type: "string", required: true, min: 2, max: 50, pattern: null, enum: null, customRule: null },
        email: { type: "email", required: true, min: null, max: null, pattern: null, enum: null, customRule: null },
        age: { type: "number", required: true, min: 18, max: 120, pattern: null, enum: null, customRule: null }
      },
      sanitizationMode: "FULL"
    },
    {
      requestId: "REQ-2",
      source: "API",
      data: { username: "<script>alert(1)</script>", query: "' OR 1=1 --" },
      schema: {
        username: { type: "string", required: true, min: 3, max: 30, pattern: null, enum: null, customRule: null },
        query: { type: "string", required: true, min: 1, max: 100, pattern: null, enum: null, customRule: null }
      },
      sanitizationMode: "FULL"
    }
  ]
})` →

  **Manual Verify:**
  - REQ-1: no threats detected → XSS sanitize (clean) → SQLI sanitize (clean) → validate(name✓, email✓, age coerce "25"→25✓) → PASSED
  - REQ-2: threats detected (<script>→XSS, OR 1=1→SQLI) → blockOnThreat=true → BLOCKED
  - blocked: 1, sanitized: 1, validationPassed: 1, validationFailed: 0

  `{
  orchestratorId: "INPUT-SEC-01",
  requestLog: [
    {
      requestId: "REQ-1",
      source: "WEB_FORM",
      blocked: false,
      threatCount: 0,
      sanitized: { name: "Rahim", email: "rahim@mail.com", age: "25" },
      validationResult: { allValid: true, invalidCount: 0, results: [{ field: "name", valid: true, errors: [] }, { field: "email", valid: true, errors: [] }, { field: "age", valid: true, errors: [] }] }
    },
    {
      requestId: "REQ-2",
      source: "API",
      blocked: true,
      threatCount: 3,
      sanitized: null,
      validationResult: null
    }
  ],
  summary: {
    totalRequests: 2,
    blocked: 1,
    sanitized: 1,
    validationPassed: 1,
    validationFailed: 0,
    threatBreakdown: { XSS: 1, SQLI: 2 }
  }
}`

---