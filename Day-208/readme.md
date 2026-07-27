# 🎓 JS DAILY PRACTICE – DAY-208

📅 **Goal:** REST API Response Builder (API Design & Data Transformation)
🎯 **Focus:** REST Response Shaping • HTTP Status Codes • Error Formatting • Response Envelope Pattern • Data Serialization

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 📦 Success Response Builder

⚠️ **Function Name:** `buildSuccessResponse()`

| Input      | `data` (any), `statusCode` (number), `meta` (object) |
| :--------- | :--------------------------------------------------- |
| **Output** | object                                               |

**Rules:**

`statusCode` must be one of: 200, 201, 204
`meta` object (optional fields — use `??`):

- `page` (number) — fallback: `null`
- `totalCount` (number) — fallback: `null`
- `requestId` (string) — fallback: `"N/A"`

**Response Envelope Rules:**

- `success: true`
- `statusCode`
- `data` — the payload (if `statusCode === 204` → `data` must be `null`, regardless of input)
- `meta` → `{ page, totalCount, requestId }`
- `timestamp: "2025-01-01T00:00:00Z"` (fixed string)

| Challenge 📢 | Return the response envelope object. If `statusCode` invalid → return `"Invalid Input"` |
| :----------- | :-------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `buildSuccessResponse(
  { userId: "U1", name: "Rahim" },
  200,
  { page: 1, totalCount: 50, requestId: "REQ-001" }
)` ➔

  `{
  success: true,
  statusCode: 200,
  data: { userId: "U1", name: "Rahim" },
  meta: { page: 1, totalCount: 50, requestId: "REQ-001" },
  timestamp: "2025-01-01T00:00:00Z"
}`

- `buildSuccessResponse(null, 204, {})` ➔

  `{
  success: true,
  statusCode: 204,
  data: null,
  meta: { page: null, totalCount: null, requestId: "N/A" },
  timestamp: "2025-01-01T00:00:00Z"
}`

---

## 🧩 PROBLEM–02: ❌ Error Response Builder

⚠️ **Function Name:** `buildErrorResponse()`

| Input      | `statusCode` (number), `errorCode` (string), `message` (string), `details` (array or null) |
| :--------- | :----------------------------------------------------------------------------------------- |
| **Output** | object                                                                                     |

**Rules:**

`statusCode` must be one of: 400, 401, 403, 404, 409, 422, 500
`errorCode` must be a non-empty string (e.g. "VALIDATION_ERROR", "NOT_FOUND")
`message` must be a non-empty string
`details` — array of strings describing specific issues, or `null`

**Error Envelope Rules:**

- `success: false`
- `statusCode`
- `error`:
  - `code: errorCode`
  - `message`
  - `details: details ?? []`
- `timestamp: "2025-01-01T00:00:00Z"`

| Challenge 📢 | Return the error envelope object. If `statusCode` invalid or required fields missing → return `"Invalid Input"` |
| :----------- | :-------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `buildErrorResponse(
  422,
  "VALIDATION_ERROR",
  "Request validation failed",
  ["email is required", "password too short"]
)` ➔

  `{
  success: false,
  statusCode: 422,
  error: {
    code: "VALIDATION_ERROR",
    message: "Request validation failed",
    details: ["email is required", "password too short"]
  },
  timestamp: "2025-01-01T00:00:00Z"
}`

---

## 🧩 PROBLEM–03: 🔄 Response Transformer

⚠️ **Function Name:** `transformResponseData()`

| Input      | `rawData` (array of objects), `fieldMap` (object), `excludeFields` (array of strings) |
| :--------- | :------------------------------------------------------------------------------------ |
| **Output** | array of objects                                                                      |

**Rules:**

`rawData` — non-empty array of objects (raw DB-like records)
`fieldMap` — object: `{ oldFieldName: newFieldName }` — rename fields
`excludeFields` — array of field names to REMOVE from output

**Transformation Rules:**

- For each record in `rawData`:
  1. **Rename fields** using `fieldMap` (old key → new key, value stays same)
  2. **Exclude fields** listed in `excludeFields` (after renaming)
  3. Fields not in `fieldMap` stay with original name
  4. Fields in `excludeFields` are dropped entirely

| Challenge 📢 | Return transformed array. If invalid → return `"Invalid Input"` |
| :----------- | :-------------------------------------------------------------- |

**Sample Input & Output:**

- `transformResponseData(
  [
    { user_id: "U1", user_name: "Rahim", password_hash: "abc123", created_at: "2025-01-01" },
    { user_id: "U2", user_name: "Karim", password_hash: "xyz789", created_at: "2025-01-02" }
  ],
  { user_id: "id", user_name: "name", created_at: "createdAt" },
  ["password_hash"]
)` ➔

  `[
  { id: "U1", name: "Rahim", createdAt: "2025-01-01" },
  { id: "U2", name: "Karim", createdAt: "2025-01-02" }
]`

---

## 🧩 PROBLEM–04: 📋 Paginated List Response Builder

⚠️ **Function Name:** `buildPaginatedResponse()`

| Input      | `allData` (array), `queryParams` (object) |
| :--------- | :---------------------------------------- |
| **Output** | object                                    |

**Rules:**

`allData` — non-empty array of any items
`queryParams` object (use `??` for fallbacks):

- `page` (number, ≥ 1) — fallback: `1`
- `limit` (number, 1–100) — fallback: `10`
- `sortBy` (string or null) — field name to sort by
- `sortOrder` (string: "asc" or "desc") — fallback: `"asc"`

**Pagination Rules:**

- If `sortBy` is provided and items are objects, sort by that field (`sortOrder`)
- Apply pagination: `startIndex = (page-1) × limit`, `endIndex = startIndex + limit`
- `pagedData` → `allData.slice(startIndex, endIndex)`
- `totalItems` → `allData.length`
- `totalPages` → `Math.ceil(totalItems / limit)`
- `hasNextPage` → `page < totalPages`
- `hasPrevPage` → `page > 1`

| Challenge 📢 | Return `{ data: pagedData, pagination: { page, limit, totalItems, totalPages, hasNextPage, hasPrevPage } }`. If invalid → return `"Invalid Input"` |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `buildPaginatedResponse(
  [
    { name: "C", score: 70 },
    { name: "A", score: 90 },
    { name: "B", score: 80 }
  ],
  { page: 1, limit: 2, sortBy: "score", sortOrder: "desc" }
)` ➔

  `{
  data: [
    { name: "A", score: 90 },
    { name: "B", score: 80 }
  ],
  pagination: {
    page: 1,
    limit: 2,
    totalItems: 3,
    totalPages: 2,
    hasNextPage: true,
    hasPrevPage: false
  }
}`

---

## 🧩 PROBLEM–05: 🏗️ Full API Response Pipeline

⚠️ **Function Name:** `buildAPIResponsePipeline()`

| Input      | `rawRecords` (array of objects), `requestConfig` (object) |
| :--------- | :-------------------------------------------------------- |
| **Output** | object                                                    |

**Rules:**

`rawRecords` — non-empty array of raw DB-like objects
`requestConfig` object:

- `statusCode` (number: 200 or 201)
- `fieldMap` (object) — field rename map
- `excludeFields` (array of strings)
- `queryParams` (object: `{ page, limit, sortBy, sortOrder }`)
- `requestId` (string)

**Pipeline Rules (compose Problems 01, 03, 04):**

1. **Transform** raw records using Problem-03 logic (`fieldMap` + `excludeFields`)
2. **Paginate** transformed records using Problem-04 logic (`queryParams`)
3. **Wrap** in success response envelope using Problem-01 logic:
   - `data` = `pagedData` from step 2
   - `meta` = `{ page, totalCount: totalItems, requestId }`

| Challenge 📢 | Return the full response envelope. If invalid → return `"Invalid Input"` |
| :----------- | :----------------------------------------------------------------------- |

**Sample Input & Output:**

- `buildAPIResponsePipeline(
  [
    { user_id: "U1", user_name: "Rahim", password_hash: "h1", score: 85 },
    { user_id: "U2", user_name: "Karim", password_hash: "h2", score: 92 },
    { user_id: "U3", user_name: "Nadia", password_hash: "h3", score: 78 }
  ],
  {
    statusCode: 200,
    fieldMap: { user_id: "id", user_name: "name" },
    excludeFields: ["password_hash"],
    queryParams: { page: 1, limit: 2, sortBy: "score", sortOrder: "desc" },
    requestId: "REQ-999"
  }
)` ➔

  `{
  success: true,
  statusCode: 200,
  data: [
    { id: "U2", name: "Karim", score: 92 },
    { id: "U1", name: "Rahim", score: 85 }
  ],
  meta: { page: 1, totalCount: 3, requestId: "REQ-999" },
  timestamp: "2025-01-01T00:00:00Z"
}`

---
