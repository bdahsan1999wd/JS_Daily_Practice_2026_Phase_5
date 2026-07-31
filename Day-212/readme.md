# 🎓 JS DAILY PRACTICE – DAY-212

📅 **Goal:** API Data Serializer & Deserializer (API Design & Data Transformation)
🎯 **Focus:** Data Serialization • Deserialization • Schema Mapping • Type Coercion • Data Contract Validation

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 📤 Object to Query String Serializer

⚠️ **Function Name:** `serializeToQueryString()`

| Input      | `params` (object) |
| :--------- | :---------------- |
| **Output** | string            |

**Rules:**

`params` — non-empty flat object (no nested objects), values can be string, number, boolean, or array

**Serialization Rules:**

- Convert object to URL query string format: `key=value&key2=value2`
- For **arrays** → repeat the key: `tags=js&tags=node&tags=react`
- For **booleans** → use lowercase string: `true`/`false`
- For **numbers** → convert to string as-is
- Sort keys alphabetically for consistent output
- Encode spaces as `%20`

| Challenge 📢 | Return query string (without leading `?`). If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `serializeToQueryString({
  page: 1,
  limit: 10,
  search: "hello world",
  tags: ["js", "node"],
  active: true
})` ➔

  `"active=true&limit=10&page=1&search=hello%20world&tags=js&tags=node"`

---

## 🧩 PROBLEM–02: 📥 Query String Deserializer

⚠️ **Function Name:** `deserializeQueryString()`

| Input      | `queryString` (string), `schema` (object) |
| :--------- | :---------------------------------------- |
| **Output** | object                                    |

**Rules:**

`queryString` — URL query string (without leading `?`), e.g. `"page=1&active=true&tags=js&tags=node"`
`schema` — object defining expected types:

- Each key maps to `{ type: "string" | "number" | "boolean" | "array", required: boolean }`

**Deserialization Rules:**

- Parse `key=value` pairs
- For repeated keys → collect into array
- Apply type coercion based on schema:
  - `number` → `Number(value)`
  - `boolean` → `value === "true"`
  - `array` → array of strings (already handled by repeated keys)
  - `string` → keep as string, decode `%20` back to space
- If a `required` field is missing → add to `errors`
- `parsedData` → coerced object

| Challenge 📢 | Return `{ parsedData, errors }`. If invalid → return `"Invalid Input"` |
| :----------- | :--------------------------------------------------------------------- |

**Sample Input & Output:**

- `deserializeQueryString(
  "page=2&limit=20&active=true&tags=js&tags=node&search=hello%20world",
  {
    page: { type: "number", required: true },
    limit: { type: "number", required: true },
    active: { type: "boolean", required: false },
    tags: { type: "array", required: false },
    search: { type: "string", required: false },
    sortBy: { type: "string", required: true }
  }
)` ➔

  `{
  parsedData: { page: 2, limit: 20, active: true, tags: ["js", "node"], search: "hello world" },
  errors: ["sortBy is required"]
}`

---

## 🧩 PROBLEM–03: 🔄 Deep Object Serializer

⚠️ **Function Name:** `serializeNestedObject()`

| Input      | `data` (object), `serializationRules` (object) |
| :--------- | :--------------------------------------------- |
| **Output** | object                                         |

**Rules:**

`data` — nested object (may have nested objects and arrays)
`serializationRules` object:

- `dateFields` (array of strings) — field names whose values should be wrapped: `{ $date: value }`
- `omitFields` (array of strings) — field names to remove entirely
- `renameFields` (object) — `{ oldName: newName }` pairs
- `flattenArrays` (boolean) — if true, convert arrays to comma-separated strings

**Serialization Rules (apply in this order):**

1. Omit fields listed in `omitFields`
2. Rename fields listed in `renameFields`
3. Wrap date fields with `{ $date: value }` (after rename if field was renamed)
4. If `flattenArrays` → convert any array value to comma-separated string

**Note:** Apply rules to TOP-LEVEL fields only (no deep recursion needed)

| Challenge 📢 | Return serialized object. If invalid → return `"Invalid Input"` |
| :----------- | :-------------------------------------------------------------- |

**Sample Input & Output:**

- `serializeNestedObject(
  { user_id: "U1", full_name: "Rahim", created_at: "2025-01-01", password: "secret", tags: ["js", "node"] },
  {
    dateFields: ["createdAt"],
    omitFields: ["password"],
    renameFields: { user_id: "id", full_name: "name", created_at: "createdAt" },
    flattenArrays: true
  }
)` ➔

  `{
  id: "U1",
  name: "Rahim",
  createdAt: { "$date": "2025-01-01" },
  tags: "js,node"
}`

---

## 🧩 PROBLEM–04: 📋 API Response Schema Validator

⚠️ **Function Name:** `validateResponseSchema()`

| Input      | `response` (object), `expectedSchema` (object) |
| :--------- | :--------------------------------------------- |
| **Output** | object                                         |

**Rules:**

`response` — the API response object to validate
`expectedSchema` — object defining expected structure:

- Each key maps to `{ type: string, required: boolean, nullable: boolean }`
- Supported types: `"string"`, `"number"`, `"boolean"`, `"array"`, `"object"`

**Validation Rules:**

- For each key in `expectedSchema`:
  - If `required: true` and field missing → error: `"${key}: field is required"`
  - If field exists and value is `null`:
    - If `nullable: true` → OK
    - If `nullable: false` → error: `"${key}: field cannot be null"`
  - If field exists, not null, but wrong type → error: `"${key}: expected ${type}, got ${actualType}"`
- `isValid` → true if no errors

| Challenge 📢 | Return `{ isValid, errors, checkedFields }` where `checkedFields` is count of schema fields checked. If invalid → return `"Invalid Input"` |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `validateResponseSchema(
  { id: "U1", name: "Rahim", age: "twenty-five", email: null, tags: ["js"] },
  {
    id: { type: "string", required: true, nullable: false },
    name: { type: "string", required: true, nullable: false },
    age: { type: "number", required: true, nullable: false },
    email: { type: "string", required: true, nullable: true },
    tags: { type: "array", required: false, nullable: false },
    role: { type: "string", required: true, nullable: false }
  }
)` ➔

  `{
  isValid: false,
  errors: [
    "age: expected number, got string",
    "role: field is required"
  ],
  checkedFields: 6
}`

---

## 🧩 PROBLEM–05: 🏗️ Full API Data Contract Pipeline

⚠️ **Function Name:** `runDataContractPipeline()`

| Input      | `rawInput` (object), `contractConfig` (object) |
| :--------- | :--------------------------------------------- |
| **Output** | object                                         |

**Rules:**

`rawInput` — raw incoming data object
`contractConfig` object:

- `deserializationSchema` (object) — same shape as Problem-02's schema (type + required per field)
- `serializationRules` (object) — same shape as Problem-03's rules
- `responseSchema` (object) — same shape as Problem-04's expectedSchema

**Pipeline Rules (compose Problems 02, 03, 04):**

1. **Deserialize/Coerce** `rawInput` using Problem-02 logic (treat rawInput values as strings for coercion)
2. **Serialize/Transform** the deserialized data using Problem-03 logic
3. **Validate** the serialized output against `responseSchema` using Problem-04 logic
4. Return pipeline result

| Challenge 📢 | Return `{ pipelineStatus, deserializedData, serializedData, validationResult }` where `pipelineStatus` is `"SUCCESS"` if validation passes else `"VALIDATION_FAILED"`. If invalid → return `"Invalid Input"` |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runDataContractPipeline(
  { user_id: "U1", full_name: "Rahim", age: "25", active: "true" },
  {
    deserializationSchema: {
      user_id: { type: "string", required: true },
      full_name: { type: "string", required: true },
      age: { type: "number", required: true },
      active: { type: "boolean", required: true }
    },
    serializationRules: {
      dateFields: [],
      omitFields: [],
      renameFields: { user_id: "id", full_name: "name" },
      flattenArrays: false
    },
    responseSchema: {
      id: { type: "string", required: true, nullable: false },
      name: { type: "string", required: true, nullable: false },
      age: { type: "number", required: true, nullable: false },
      active: { type: "boolean", required: true, nullable: false }
    }
  }
)` ➔

  `{
  pipelineStatus: "SUCCESS",
  deserializedData: { user_id: "U1", full_name: "Rahim", age: 25, active: true },
  serializedData: { id: "U1", name: "Rahim", age: 25, active: true },
  validationResult: { isValid: true, errors: [], checkedFields: 4 }
}`

---
