# 🎓 JS DAILY PRACTICE – DAY-231

📅 **Goal:** DTO Transformer Engine (Full Stack Integration Patterns)
🎯 **Focus:** Data Transfer Objects • Request DTO • Response DTO • DTO Validation • DTO Mapping Pipeline

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 📥 Request DTO Transformer

⚠️ **Function Name:** `createRequestDTO()`

| Input      | `dtoConfig` (object)    |
| :--------- | :---------------------- |
| **Output** | object (DTO factory)    |

**Rules:**

`dtoConfig` object:

- `dtoName` (string, non-empty)
- `fields` (array of objects):
  - `name` (string) — field name in incoming request
  - `type` (string: `"string"`, `"number"`, `"boolean"`, `"array"`, `"object"`)
  - `required` (boolean)
  - `default` (any or null)
  - `transform` (string or null): `"trim"`, `"lowercase"`, `"uppercase"`, `"toNumber"`, `"toBoolean"` — apply to value after extraction

Return a DTO factory object with these methods:

- `fromRequest(rawData)` — extract, validate, and transform fields from raw request data
- `validate(data)` — validate already-extracted data against field rules
- `getSchema()` — return the field definitions

**fromRequest Rules:**

- For each field in `fields`:
  1. Extract value from `rawData[field.name]`
  2. If missing and `required: true` → add to errors: `"${name}: required field missing"`
  3. If missing and not required → use `default` value
  4. If present → apply `transform` if specified:
     - `"trim"` → `value.trim()` (strings only)
     - `"lowercase"` → `value.toLowerCase()` (strings only)
     - `"uppercase"` → `value.toUpperCase()` (strings only)
     - `"toNumber"` → `Number(value)`
     - `"toBoolean"` → `value === "true" || value === true`
  5. After transform, validate type
- If any errors → `{ valid: false, errors, dto: null }`
- If all pass → `{ valid: true, errors: [], dto: { ...extractedFields } }`

- `validate(data)` → same validation logic but skip extraction/transform step
- `getSchema()` → returns `{ dtoName, fields }`

**Validation:** invalid `dtoConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the DTO factory object with all 3 methods. |
| :----------- | :------------------------------------------------ |

**Sample Input & Output:**

```javascript
const CreateUserDTO = createRequestDTO({
  dtoName: "CreateUserDTO",
  fields: [
    { name: "username", type: "string", required: true, default: null, transform: "trim" },
    { name: "email", type: "string", required: true, default: null, transform: "lowercase" },
    { name: "age", type: "number", required: false, default: 18, transform: "toNumber" },
    { name: "active", type: "boolean", required: false, default: true, transform: "toBoolean" }
  ]
});

CreateUserDTO.fromRequest({ username: "  Rahim  ", email: "RAHIM@MAIL.COM", age: "25" });
// → {
//   valid: true,
//   errors: [],
//   dto: { username: "Rahim", email: "rahim@mail.com", age: 25, active: true }
// }

CreateUserDTO.fromRequest({ username: "Karim" });
// → {
//   valid: false,
//   errors: ["email: required field missing"],
//   dto: null
// }

CreateUserDTO.getSchema();
// → { dtoName: "CreateUserDTO", fields: [...] }
```

---

## 🧩 PROBLEM–02: 📤 Response DTO Transformer

⚠️ **Function Name:** `createResponseDTO()`

| Input      | `dtoConfig` (object)  |
| :--------- | :-------------------- |
| **Output** | object (DTO factory)  |

**Rules:**

`dtoConfig` object:

- `dtoName` (string, non-empty)
- `fields` (array of objects):
  - `source` (string) — field name in the raw entity/DB record
  - `target` (string) — field name in the output DTO
  - `type` (string: `"string"`, `"number"`, `"boolean"`, `"array"`, `"object"`)
  - `include` (boolean) — if false, exclude this field from output
  - `mask` (boolean) — if true, replace value with `"***"` (for sensitive fields)
  - `format` (string or null): `"currency"`, `"uppercase"`, `"date"` — apply formatting
    - `"currency"` → `"৳" + value.toFixed(2)`
    - `"uppercase"` → `value.toUpperCase()`
    - `"date"` → `"2025-01-01"` (fixed formatted date string — just use the value as-is with this label)

Return a DTO factory object with:

- `fromEntity(entity)` — transform a single entity to response DTO
- `fromEntityList(entities)` — transform array of entities to response DTOs
- `getOutputFields()` — return array of `target` field names that are included

**fromEntity Rules:**

- For each field where `include: true`:
  1. Extract `entity[source]`
  2. If `mask: true` → value = `"***"`
  3. Else if `format` specified → apply formatting
  4. Map to `target` field name in output
- Fields where `include: false` → excluded entirely
- If `source` field missing in entity → use `null`

- `fromEntity(entity)` → returns the transformed DTO object
- `fromEntityList(entities)` → `{ dtos: [transformed objects], count }`
- `getOutputFields()` → array of included `target` field names

**Validation:** invalid `dtoConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the DTO factory object with all 3 methods. |
| :----------- | :------------------------------------------------ |

**Sample Input & Output:**

```javascript
const UserResponseDTO = createResponseDTO({
  dtoName: "UserResponseDTO",
  fields: [
    { source: "user_id", target: "id", type: "string", include: true, mask: false, format: null },
    { source: "user_name", target: "name", type: "string", include: true, mask: false, format: "uppercase" },
    { source: "email", target: "email", type: "string", include: true, mask: false, format: null },
    { source: "password_hash", target: "password", type: "string", include: false, mask: true, format: null },
    { source: "salary", target: "salary", type: "number", include: true, mask: false, format: "currency" }
  ]
});

UserResponseDTO.fromEntity({
  user_id: "U1",
  user_name: "rahim",
  email: "rahim@mail.com",
  password_hash: "hashed_secret",
  salary: 50000
});
// → { id: "U1", name: "RAHIM", email: "rahim@mail.com", salary: "৳50000.00" }
// (password excluded because include: false)

UserResponseDTO.fromEntityList([
  { user_id: "U1", user_name: "rahim", email: "r@mail.com", password_hash: "h1", salary: 50000 },
  { user_id: "U2", user_name: "karim", email: "k@mail.com", password_hash: "h2", salary: 60000 }
]);
// → {
//   dtos: [
//     { id: "U1", name: "RAHIM", email: "r@mail.com", salary: "৳50000.00" },
//     { id: "U2", name: "KARIM", email: "k@mail.com", salary: "৳60000.00" }
//   ],
//   count: 2
// }

UserResponseDTO.getOutputFields();
// → ["id", "name", "email", "salary"]
```

---

## 🧩 PROBLEM–03: 🔄 DTO Mapper

⚠️ **Function Name:** `createDTOMapper()`

| Input      | `mapperConfig` (object) |
| :--------- | :---------------------- |
| **Output** | object (DTO mapper)     |

**Rules:**

`mapperConfig` object:

- `mapperId` (string, non-empty)
- `mappings` (array of objects):
  - `mappingName` (string, non-empty) — e.g. `"entityToDTO"`, `"dtoToEntity"`
  - `rules` (array of objects):
    - `from` (string) — source field path (supports dot notation: `"address.city"`)
    - `to` (string) — target field path (supports dot notation: `"location.cityName"`)
    - `transform` (function or null) — optional value transformation

Return a mapper object with:

- `map(mappingName, sourceObject)` — apply a named mapping to an object
- `mapList(mappingName, sourceObjects)` — apply mapping to array of objects
- `addMapping(mappingName, rules)` — add a new mapping at runtime
- `listMappings()` — return all mapping names

**Mapping Rules:**

- `map(mappingName, sourceObject)`:
  - If `mappingName` not found → `{ error: "Mapping not found: " + mappingName }`
  - For each rule: extract value at `from` path (support dot notation), apply `transform` if present, set value at `to` path in result object
  - Dot notation: `"address.city"` → `sourceObject.address?.city`
  - Returns the mapped object

- Dot notation for `to` path: `"location.cityName"` → creates nested `{ location: { cityName: value } }`
- `mapList(mappingName, sourceObjects)` → `{ mappingName, results: [mapped objects], count }`
- `addMapping(mappingName, rules)` → `{ added: true, mappingName }` or `{ error: "Mapping already exists" }`
- `listMappings()` → array of mapping name strings

**Validation:** invalid `mapperConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the mapper object with all 4 methods. |
| :----------- | :------------------------------------------- |

**Sample Input & Output:**

```javascript
const mapper = createDTOMapper({
  mapperId: "UserMapper",
  mappings: [
    {
      mappingName: "entityToDTO",
      rules: [
        { from: "user_id", to: "id", transform: null },
        { from: "user_name", to: "name", transform: (v) => v.toUpperCase() },
        { from: "address.city", to: "location.cityName", transform: null },
        { from: "address.zip", to: "location.zipCode", transform: null }
      ]
    }
  ]
});

mapper.map("entityToDTO", {
  user_id: "U1",
  user_name: "rahim",
  address: { city: "Dhaka", zip: "1200" }
});
// → { id: "U1", name: "RAHIM", location: { cityName: "Dhaka", zipCode: "1200" } }

mapper.mapList("entityToDTO", [
  { user_id: "U1", user_name: "rahim", address: { city: "Dhaka", zip: "1200" } },
  { user_id: "U2", user_name: "karim", address: { city: "Ctg", zip: "4000" } }
]);
// → {
//   mappingName: "entityToDTO",
//   results: [
//     { id: "U1", name: "RAHIM", location: { cityName: "Dhaka", zipCode: "1200" } },
//     { id: "U2", name: "KARIM", location: { cityName: "Ctg", zipCode: "4000" } }
//   ],
//   count: 2
// }

mapper.addMapping("dtoToEntity", [
  { from: "id", to: "user_id", transform: null },
  { from: "name", to: "user_name", transform: (v) => v.toLowerCase() }
]);
// → { added: true, mappingName: "dtoToEntity" }

mapper.listMappings();
// → ["entityToDTO", "dtoToEntity"]
```

---

## 🧩 PROBLEM–04: ✅ DTO Validation Pipeline

⚠️ **Function Name:** `createDTOValidationPipeline()`

| Input      | `pipelineConfig` (object) |
| :--------- | :------------------------ |
| **Output** | object (validation pipeline) |

**Rules:**

`pipelineConfig` object:

- `pipelineId` (string, non-empty)
- `stages` (array of objects) — validation stages run in order:
  - `stageName` (string)
  - `validators` (array of objects):
    - `field` (string) — field to validate
    - `rule` (string: `"required"`, `"minLength"`, `"maxLength"`, `"min"`, `"max"`, `"pattern"`, `"custom"`)
    - `value` (any) — rule parameter (e.g. minLength: 3, pattern: "email")
    - `message` (string) — error message if rule fails
    - `customFn` (function or null) — for `"custom"` rule, takes field value, returns boolean

Return a pipeline object with:

- `run(data)` — run all stages sequentially
- `runStage(stageName, data)` — run a single stage
- `addStage(stage)` — add a new stage
- `getStageNames()` — return array of stage names

**Validation Rules:**

- `"required"` → value must not be null/undefined/empty string
- `"minLength"` → string length >= `value`
- `"maxLength"` → string length <= `value`
- `"min"` → number >= `value`
- `"max"` → number <= `value`
- `"pattern"` → predefined patterns:
  - `"email"` → must contain `@` and `.`
  - `"phone"` → must start with `+` and be 10–15 chars
- `"custom"` → `customFn(fieldValue)` returns true (pass) or false (fail)

- `runStage(stageName, data)`:
  - If stage not found → `{ error: "Stage not found: " + stageName }`
  - Run each validator, collect failures
  - Returns `{ stageName, passed: boolean, errors: [{ field, message }] }`

- `run(data)`:
  - Run stages in order; if a stage fails → stop pipeline (fail-fast)
  - Returns `{ pipelineId, passed: boolean, stagesRun, failedStage: stageName or null, errors }`

- `addStage(stage)` → `{ added: true, stageName }` or `{ error: "Stage already exists" }`
- `getStageNames()` → array of stage name strings

**Validation:** invalid `pipelineConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the pipeline object with all 4 methods. |
| :----------- | :--------------------------------------------- |

**Sample Input & Output:**

```javascript
const pipeline = createDTOValidationPipeline({
  pipelineId: "UserValidation",
  stages: [
    {
      stageName: "BasicValidation",
      validators: [
        { field: "username", rule: "required", value: null, message: "Username is required", customFn: null },
        { field: "username", rule: "minLength", value: 3, message: "Username must be at least 3 chars", customFn: null },
        { field: "email", rule: "pattern", value: "email", message: "Invalid email format", customFn: null }
      ]
    },
    {
      stageName: "AgeValidation",
      validators: [
        { field: "age", rule: "min", value: 18, message: "Must be at least 18", customFn: null },
        { field: "age", rule: "max", value: 100, message: "Age cannot exceed 100", customFn: null }
      ]
    }
  ]
});

pipeline.run({ username: "Rahim", email: "rahim@mail.com", age: 25 });
// All pass:
// → { pipelineId: "UserValidation", passed: true, stagesRun: 2, failedStage: null, errors: [] }

pipeline.run({ username: "Al", email: "invalid-email", age: 25 });
// BasicValidation fails (minLength + pattern):
// → { pipelineId: "UserValidation", passed: false, stagesRun: 1, failedStage: "BasicValidation",
//     errors: [{ field: "username", message: "Username must be at least 3 chars" }, { field: "email", message: "Invalid email format" }] }

pipeline.runStage("AgeValidation", { age: 15 });
// → { stageName: "AgeValidation", passed: false, errors: [{ field: "age", message: "Must be at least 18" }] }
```

---

## 🧩 PROBLEM–05: 🏗️ Full DTO Pipeline Orchestrator

⚠️ **Function Name:** `runDTOPipelineOrchestrator()`

| Input      | `orchestratorConfig` (object) |
| :--------- | :---------------------------- |
| **Output** | object                        |

**Rules:**

`orchestratorConfig` object:

- `orchestratorId` (string, non-empty)
- `requestDTOConfig` (object) — same shape as Problem-01 `dtoConfig`
- `responseDTOConfig` (object) — same shape as Problem-02 `dtoConfig`
- `mapperConfig` (object) — same shape as Problem-03 `mapperConfig`
- `validationPipelineConfig` (object) — same shape as Problem-04 `pipelineConfig`
- `requests` (array of objects) — raw incoming request data to process

**Orchestration Rules (compose all previous concepts):**

1. **Request DTO** — for each request, run `fromRequest` (Problem-01) to extract + validate + transform
2. **Validation Pipeline** — run `pipeline.run()` (Problem-04) on the extracted DTO
   - If validation fails → stop processing this request, record error
3. **DTO Mapping** — map validated DTO to entity format using `"dtoToEntity"` mapping (Problem-03)
4. **Response DTO** — transform the mapped entity back using `fromEntity` (Problem-02)
5. **Build request log** — for each request: `{ requestIndex, stages: { extraction, validation, mapping, response }, finalOutput or error }`
6. **Summary:**
   - `totalRequests`
   - `successCount` → fully processed
   - `failedCount` → failed at any stage
   - `failureBreakdown` → `{ extractionFailed, validationFailed, mappingFailed }`

**Validation:** invalid `orchestratorConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ orchestratorId, requestLog, summary }`. |
| :----------- | :------------------------------------------------- |

**Sample Input & Output:**

- `runDTOPipelineOrchestrator({
  orchestratorId: "DTO-ORCH-01",
  requestDTOConfig: {
    dtoName: "CreateUserDTO",
    fields: [
      { name: "username", type: "string", required: true, default: null, transform: "trim" },
      { name: "email", type: "string", required: true, default: null, transform: "lowercase" },
      { name: "age", type: "number", required: false, default: 18, transform: "toNumber" }
    ]
  },
  responseDTOConfig: {
    dtoName: "UserResponseDTO",
    fields: [
      { source: "username", target: "name", type: "string", include: true, mask: false, format: "uppercase" },
      { source: "email", target: "email", type: "string", include: true, mask: false, format: null },
      { source: "age", target: "age", type: "number", include: true, mask: false, format: null }
    ]
  },
  mapperConfig: {
    mapperId: "UserMapper",
    mappings: [
      {
        mappingName: "dtoToEntity",
        rules: [
          { from: "username", to: "username", transform: null },
          { from: "email", to: "email", transform: null },
          { from: "age", to: "age", transform: null }
        ]
      }
    ]
  },
  validationPipelineConfig: {
    pipelineId: "UserValidation",
    stages: [
      {
        stageName: "BasicValidation",
        validators: [
          { field: "username", rule: "minLength", value: 3, message: "Username min 3 chars", customFn: null },
          { field: "email", rule: "pattern", value: "email", message: "Invalid email", customFn: null }
        ]
      }
    ]
  },
  requests: [
    { username: "  Rahim  ", email: "RAHIM@MAIL.COM", age: "25" },
    { username: "Al", email: "invalid", age: "20" }
  ]
})` →

  **Manual Verify:**
  - Request 1:
    - Extraction: username→"Rahim"(trim), email→"rahim@mail.com"(lowercase), age→25(toNumber) ✓
    - Validation: minLength(6≥3)✓, email pattern(has @ and .)✓ → passed
    - Mapping: dtoToEntity → same fields
    - Response: name→"RAHIM"(uppercase), email, age → SUCCESS
  - Request 2:
    - Extraction: username→"Al", email→"invalid", age→20 ✓
    - Validation: minLength("Al"=2 < 3)✗, email pattern(no @)✗ → FAILED
  - successCount: 1, failedCount: 1

  `{
  orchestratorId: "DTO-ORCH-01",
  requestLog: [
    {
      requestIndex: 0,
      stages: {
        extraction: { valid: true, dto: { username: "Rahim", email: "rahim@mail.com", age: 25 } },
        validation: { passed: true, stagesRun: 1, errors: [] },
        mapping: { username: "Rahim", email: "rahim@mail.com", age: 25 },
        response: { name: "RAHIM", email: "rahim@mail.com", age: 25 }
      },
      finalOutput: { name: "RAHIM", email: "rahim@mail.com", age: 25 }
    },
    {
      requestIndex: 1,
      stages: {
        extraction: { valid: true, dto: { username: "Al", email: "invalid", age: 20 } },
        validation: { passed: false, stagesRun: 1, failedStage: "BasicValidation", errors: [{ field: "username", message: "Username min 3 chars" }, { field: "email", message: "Invalid email" }] },
        mapping: null,
        response: null
      },
      finalOutput: null,
      error: "Validation failed at stage: BasicValidation"
    }
  ],
  summary: {
    totalRequests: 2,
    successCount: 1,
    failedCount: 1,
    failureBreakdown: { extractionFailed: 0, validationFailed: 1, mappingFailed: 0 }
  }
}`

---