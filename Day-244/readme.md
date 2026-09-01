# 🎓 JS DAILY PRACTICE – DAY-244

📅 **Goal:** Refresh Token Manager (Security & Auth Patterns)
🎯 **Focus:** Refresh Token Flow • Token Rotation • Token Family • Reuse Detection • Session Management

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🔄 Basic Refresh Token Store

⚠️ **Function Name:** `createRefreshTokenStore()`

| Input      | `storeConfig` (object)       |
| :--------- | :--------------------------- |
| **Output** | object (refresh token store) |

**Rules:**

`storeConfig` object:

- `tokenTTLMs` (number, > 0) — refresh token time-to-live in milliseconds
- `maxTokensPerUser` (number, integer, ≥ 1) — max active refresh tokens per user

Return a refresh token store object with:

- `issue(userId, metadata)` — issue a new refresh token
- `validate(token, currentTimeMs)` — check if token is valid
- `revoke(token)` — revoke a specific token
- `revokeAllForUser(userId)` — revoke all tokens for a user
- `getActiveTokens(userId)` — return active tokens for a user
- `getStoreStats()` — return store statistics

**Token Structure:**

```javascript
{
  token: "RT-" + autoIndex + "-" + userId,
  userId,
  issuedAt: 1000000,  // simulated fixed time
  expiresAt: issuedAt + tokenTTLMs,
  metadata: { ...userMetadata },
  status: "ACTIVE" | "REVOKED" | "EXPIRED" | "REPLACED"
}
```

**Operation Rules:**

- `issue(userId, metadata)`:
  - `userId` must be non-empty string
  - Check active token count for user
  - If at `maxTokensPerUser` → revoke oldest active token first (FIFO), then issue new one
  - Returns `{ token: tokenString, userId, expiresAt, issuedAt, metadata }`

- `validate(token, currentTimeMs)`:
  - If not found → `{ valid: false, reason: "TOKEN_NOT_FOUND" }`
  - If `status === "REVOKED"` → `{ valid: false, reason: "TOKEN_REVOKED" }`
  - If `status === "REPLACED"` → `{ valid: false, reason: "TOKEN_REPLACED" }`
  - If `currentTimeMs > expiresAt` → update status to `"EXPIRED"`, return `{ valid: false, reason: "TOKEN_EXPIRED" }`
  - Else → `{ valid: true, userId, metadata, expiresAt }`

- `revoke(token)` → `{ revoked: true, token }` or `{ error: "Token not found" }`
- `revokeAllForUser(userId)` → `{ revokedCount: N, userId }`
- `getActiveTokens(userId)` → `{ userId, tokens: [token objects], count }`
- `getStoreStats()` → `{ totalIssued, active, revoked, expired, replaced, uniqueUsers }`

**Validation:** invalid `storeConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the refresh token store object with all 6 methods. |
| :----------- | :-------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const store = createRefreshTokenStore({
  tokenTTLMs: 86400000,
  maxTokensPerUser: 2,
});

store.issue("U1", { device: "mobile", ip: "192.168.1.1" });
// → { token: "RT-1-U1", userId: "U1", expiresAt: 1000000 + 86400000, issuedAt: 1000000, metadata: { device: "mobile", ip: "192.168.1.1" } }

store.issue("U1", { device: "desktop", ip: "192.168.1.2" });
// → { token: "RT-2-U1", ... }

store.issue("U1", { device: "tablet", ip: "192.168.1.3" });
// maxTokensPerUser=2 → revoke RT-1-U1 (oldest), issue RT-3-U1
// → { token: "RT-3-U1", ... }

store.validate("RT-1-U1", 1001000);
// → { valid: false, reason: "TOKEN_REVOKED" }

store.validate("RT-2-U1", 1001000);
// → { valid: true, userId: "U1", metadata: { device: "desktop", ip: "192.168.1.2" }, expiresAt: 87400000 }

store.validate("RT-2-U1", 9999999999);
// expired
// → { valid: false, reason: "TOKEN_EXPIRED" }

store.getStoreStats();
// → { totalIssued: 3, active: 1, revoked: 1, expired: 1, replaced: 0, uniqueUsers: 1 }
```

---

## 🧩 PROBLEM–02: 🔃 Token Rotation Engine

⚠️ **Function Name:** `createTokenRotationEngine()`

| Input      | `rotationConfig` (object) |
| :--------- | :------------------------ |
| **Output** | object (rotation engine)  |

**Rules:**

`rotationConfig` object:

- `accessTokenTTLMs` (number, > 0) — access token lifetime
- `refreshTokenTTLMs` (number, > 0) — refresh token lifetime
- `rotateOnUse` (boolean) — if true, issue new refresh token on each use (token rotation)

Return a rotation engine object with:

- `login(userId, metadata)` — issue initial access + refresh token pair
- `refresh(refreshToken, currentTimeMs)` — use refresh token to get new access token
- `logout(refreshToken)` — invalidate refresh token
- `getTokenPair(refreshToken)` — return current token pair info
- `getRotationHistory(userId)` — return rotation history for a user

**Token Pair:**

```javascript
{
  accessToken: "AT-" + autoIndex + "-" + userId,
  refreshToken: "RT-" + autoIndex + "-" + userId,
  accessTokenExpiresAt: issuedAt + accessTokenTTLMs,
  refreshTokenExpiresAt: issuedAt + refreshTokenTTLMs,
  userId,
  issuedAt: 1000000
}
```

**Rotation Rules:**

- `login(userId, metadata)`:
  - Issue new AT + RT pair
  - Returns `{ tokenPair, userId, loginAt: "2025-01-01T00:00:00Z" }`

- `refresh(refreshToken, currentTimeMs)`:
  - Validate refresh token (not expired, not revoked/replaced)
  - If `rotateOnUse: true`:
    - Mark old RT as `"REPLACED"`
    - Issue NEW RT + new AT
    - Returns `{ newTokenPair, oldRefreshToken: refreshToken, rotated: true }`
  - If `rotateOnUse: false`:
    - Issue only new AT (keep same RT)
    - Returns `{ newAccessToken, refreshToken: (same), rotated: false }`
  - If invalid → `{ error: reason }`

- `logout(refreshToken)` → revoke the RT, return `{ loggedOut: true, userId }`

- `getTokenPair(refreshToken)` → `{ refreshToken, accessToken, userId, status, expiresAt }` or `{ error: "Not found" }`

- `getRotationHistory(userId)` → array of `{ event: "LOGIN"/"REFRESH"/"LOGOUT", timestamp: "2025-01-01T00:00:00Z", tokenId }` ordered by event

**Validation:** invalid `rotationConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the rotation engine object with all 5 methods. |
| :----------- | :---------------------------------------------------- |

**Sample Input & Output:**

```javascript
const engine = createTokenRotationEngine({
  accessTokenTTLMs: 900000, // 15 min
  refreshTokenTTLMs: 86400000, // 24 hours
  rotateOnUse: true,
});

engine.login("U1", { device: "chrome" });
// → { tokenPair: { accessToken: "AT-1-U1", refreshToken: "RT-1-U1", accessTokenExpiresAt: 1900000, refreshTokenExpiresAt: 87400000, userId: "U1", issuedAt: 1000000 }, userId: "U1", loginAt: "2025-01-01T00:00:00Z" }

engine.refresh("RT-1-U1", 1500000);
// rotateOnUse=true → old RT replaced, new RT+AT issued
// → { newTokenPair: { accessToken: "AT-2-U1", refreshToken: "RT-2-U1", ... }, oldRefreshToken: "RT-1-U1", rotated: true }

engine.refresh("RT-1-U1", 1600000);
// RT-1-U1 already REPLACED
// → { error: "TOKEN_REPLACED" }

engine.getRotationHistory("U1");
// → [
//   { event: "LOGIN", timestamp: "2025-01-01T00:00:00Z", tokenId: "RT-1-U1" },
//   { event: "REFRESH", timestamp: "2025-01-01T00:00:00Z", tokenId: "RT-2-U1" }
// ]
```

---

## 🧩 PROBLEM–03: 👨‍👩‍👧 Token Family & Reuse Detection

⚠️ **Function Name:** `createTokenFamilyManager()`

| Input      | `familyConfig` (object) |
| :--------- | :---------------------- |
| **Output** | object (family manager) |

**Rules:**

`familyConfig` object:

- `reuseDetectionEnabled` (boolean) — if true, detect and respond to token reuse
- `familyCompromiseAction` (string: `"REVOKE_FAMILY"`, `"ALERT_ONLY"`) — what to do when reuse detected

Return a token family manager object with:

- `createFamily(userId)` — create a new token family
- `addToFamily(familyId, token)` — add a token to a family
- `useToken(familyId, token, currentTimeMs)` — attempt to use a token
- `getFamilyStatus(familyId)` — return family info
- `detectCompromise(familyId)` — check if family is compromised
- `getCompromiseLog()` — return all detected compromises

**Token Family Concept:**

- A "family" is created at login; each rotation creates a new member of the same family
- If a REPLACED token is used → signals theft → entire family is compromised
- Family structure:

```javascript
{
  familyId: "FAM-" + autoIndex + "-" + userId,
  userId,
  tokens: [{ token, status: "ACTIVE"|"REPLACED"|"REVOKED"|"USED", addedAt: 1000000 }],
  status: "ACTIVE" | "COMPROMISED" | "TERMINATED",
  createdAt: 1000000
}
```

**Operation Rules:**

- `createFamily(userId)` → `{ familyId, userId, status: "ACTIVE", createdAt: 1000000 }`

- `addToFamily(familyId, token)`:
  - If family is `"COMPROMISED"` or `"TERMINATED"` → `{ error: "Family is " + status }`
  - Adds token with status `"ACTIVE"`
  - Returns `{ added: true, familyId, token, familySize: total token count }`

- `useToken(familyId, token, currentTimeMs)`:
  - Find token in family
  - If token status is `"ACTIVE"` → mark as `"USED"`, return `{ used: true, token, familyId }`
  - If token status is `"REPLACED"` or `"USED"`:
    - **REUSE DETECTED** → this is a stolen token being reused
    - If `reuseDetectionEnabled`:
      - If `familyCompromiseAction === "REVOKE_FAMILY"` → mark ALL tokens `"REVOKED"`, family `"COMPROMISED"`
      - If `familyCompromiseAction === "ALERT_ONLY"` → log alert, don't revoke
    - Returns `{ used: false, reuseDetected: true, action: familyCompromiseAction, familyId }`
  - If not found → `{ error: "Token not in family" }`

- `getFamilyStatus(familyId)` → `{ familyId, userId, status, tokenCount, activeCount, compromisedAt: timestamp or null }`

- `detectCompromise(familyId)` → `{ familyId, isCompromised: boolean, reason: null or explanation }`

- `getCompromiseLog()` → array of `{ familyId, userId, detectedAt: "2025-01-01T00:00:00Z", reuseToken, action }`

**Validation:** invalid `familyConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the token family manager object with all 6 methods. |
| :----------- | :--------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const fm = createTokenFamilyManager({
  reuseDetectionEnabled: true,
  familyCompromiseAction: "REVOKE_FAMILY",
});

const { familyId } = fm.createFamily("U1");
// familyId = "FAM-1-U1"

fm.addToFamily("FAM-1-U1", "RT-1");
fm.addToFamily("FAM-1-U1", "RT-2");

// Normal use:
fm.useToken("FAM-1-U1", "RT-1", 1000000);
// → { used: true, token: "RT-1", familyId: "FAM-1-U1" }

// RT-1 is now USED, simulate rotation: mark RT-1 as REPLACED, RT-2 is current
// Now attacker tries to reuse RT-1:
fm.useToken("FAM-1-U1", "RT-1", 1001000);
// Reuse detected! → REVOKE_FAMILY
// → { used: false, reuseDetected: true, action: "REVOKE_FAMILY", familyId: "FAM-1-U1" }

fm.getFamilyStatus("FAM-1-U1");
// → { familyId: "FAM-1-U1", userId: "U1", status: "COMPROMISED", tokenCount: 2, activeCount: 0, compromisedAt: "2025-01-01T00:00:00Z" }

fm.getCompromiseLog();
// → [{ familyId: "FAM-1-U1", userId: "U1", detectedAt: "2025-01-01T00:00:00Z", reuseToken: "RT-1", action: "REVOKE_FAMILY" }]
```

---

## 🧩 PROBLEM–04: 📱 Session Manager

⚠️ **Function Name:** `createSessionManager()`

| Input      | `sessionConfig` (object) |
| :--------- | :----------------------- |
| **Output** | object (session manager) |

**Rules:**

`sessionConfig` object:

- `sessionTTLMs` (number, > 0)
- `maxSessionsPerUser` (number, integer, ≥ 1)
- `absoluteTimeoutMs` (number, > 0) — max session lifetime regardless of activity
- `slidingWindowMs` (number, > 0) — extend session on each activity

Return a session manager object with:

- `createSession(userId, metadata)` — create a new session
- `touchSession(sessionId, currentTimeMs)` — update last activity (sliding window)
- `validateSession(sessionId, currentTimeMs)` — check if session is valid
- `destroySession(sessionId)` — end a session
- `destroyAllSessions(userId)` — end all sessions for a user
- `getActiveSessions(userId)` — list active sessions
- `getSessionStats()` — return overall stats

**Session Structure:**

```javascript
{
  sessionId: "SES-" + autoIndex + "-" + userId,
  userId,
  metadata: {},
  createdAt: 1000000,
  lastActivityAt: 1000000,
  expiresAt: 1000000 + sessionTTLMs,
  absoluteExpiresAt: 1000000 + absoluteTimeoutMs,
  status: "ACTIVE" | "EXPIRED" | "DESTROYED"
}
```

**Session Rules:**

- `createSession(userId, metadata)`:
  - If user has `maxSessionsPerUser` active sessions → destroy oldest
  - Returns `{ sessionId, userId, expiresAt, absoluteExpiresAt, metadata }`

- `touchSession(sessionId, currentTimeMs)`:
  - Extend `expiresAt = currentTimeMs + slidingWindowMs`
  - BUT: `expiresAt` cannot exceed `absoluteExpiresAt`
  - Returns `{ sessionId, newExpiresAt, extended: boolean }` or `{ error: "Session not found/expired" }`

- `validateSession(sessionId, currentTimeMs)`:
  - Check status, sliding expiry, absolute expiry
  - Returns `{ valid: boolean, sessionId, userId, reason: null or "EXPIRED"/"ABSOLUTE_TIMEOUT"/"DESTROYED" }`

- `destroySession(sessionId)` → `{ destroyed: true, sessionId }` or `{ error: "Session not found" }`
- `destroyAllSessions(userId)` → `{ destroyedCount: N, userId }`
- `getActiveSessions(userId)` → `{ userId, sessions: [session objects], count }`
- `getSessionStats()` → `{ totalCreated, active, expired, destroyed, uniqueUsers }`

**Validation:** invalid `sessionConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the session manager object with all 7 methods. |
| :----------- | :---------------------------------------------------- |

**Sample Input & Output:**

```javascript
const sm = createSessionManager({
  sessionTTLMs: 1800000, // 30 min
  maxSessionsPerUser: 3,
  absoluteTimeoutMs: 86400000, // 24 hours
  slidingWindowMs: 1800000, // 30 min sliding
});

sm.createSession("U1", { device: "chrome", ip: "10.0.0.1" });
// → { sessionId: "SES-1-U1", userId: "U1", expiresAt: 1000000+1800000, absoluteExpiresAt: 1000000+86400000, metadata: { device: "chrome", ip: "10.0.0.1" } }

sm.validateSession("SES-1-U1", 1500000);
// → { valid: true, sessionId: "SES-1-U1", userId: "U1", reason: null }

sm.touchSession("SES-1-U1", 1500000);
// Extend: expiresAt = 1500000 + 1800000 = 3300000 (within absolute limit)
// → { sessionId: "SES-1-U1", newExpiresAt: 3300000, extended: true }

sm.validateSession("SES-1-U1", 9999999999);
// currentTime > absoluteExpiresAt
// → { valid: false, sessionId: "SES-1-U1", userId: "U1", reason: "ABSOLUTE_TIMEOUT" }
```

---

## 🧩 PROBLEM–05: 🏗️ Full Refresh Token Orchestrator

⚠️ **Function Name:** `runRefreshTokenOrchestrator()`

| Input      | `orchestratorConfig` (object) |
| :--------- | :---------------------------- |
| **Output** | object                        |

**Rules:**

`orchestratorConfig` object:

- `orchestratorId` (string, non-empty)
- `tokenConfig` (object):
  - `accessTokenTTLMs` (number)
  - `refreshTokenTTLMs` (number)
  - `maxTokensPerUser` (number)
  - `rotateOnUse` (boolean)
- `sessionConfig` (object) — same shape as Problem-04
- `familyConfig` (object) — same shape as Problem-03
- `authEvents` (array of objects):
  - `eventId` (string)
  - `type` (string: `"LOGIN"`, `"REFRESH"`, `"LOGOUT"`, `"REUSE_ATTACK"`)
  - `userId` (string)
  - `currentTimeMs` (number)
  - `metadata` (object or null)
  - `tokenRef` (string or null) — references a previous event's token

**Orchestration Rules (compose all previous concepts):**

1. **Setup** — create token store (Problem-01), rotation engine (Problem-02), family manager (Problem-03), session manager (Problem-04)
2. **Process auth events** in order:
   - `"LOGIN"` → `rotationEngine.login()` + `sessionManager.createSession()` + `familyManager.createFamily()`
   - `"REFRESH"` → `rotationEngine.refresh()` (use `tokenRef` to find refresh token) + `sessionManager.touchSession()`
   - `"LOGOUT"` → `rotationEngine.logout()` + `sessionManager.destroySession()`
   - `"REUSE_ATTACK"` → simulate reuse: try to use an already-used/replaced token via `familyManager.useToken()`
3. **Build Summary:**
   - `totalEvents`
   - `loginCount`, `refreshCount`, `logoutCount`, `reuseAttackCount`
   - `compromisedFamilies` → count of families with `"COMPROMISED"` status
   - `activeSessions` → total active sessions across all users
   - `activeRefreshTokens` → total active refresh tokens

**Validation:** invalid `orchestratorConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ orchestratorId, eventLog, summary }` where `eventLog` is array of `{ eventId, type, userId, result }`. |
| :----------- | :--------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runRefreshTokenOrchestrator({
  orchestratorId: "RT-ORCH-01",
  tokenConfig: { accessTokenTTLMs: 900000, refreshTokenTTLMs: 86400000, maxTokensPerUser: 3, rotateOnUse: true },
  sessionConfig: { sessionTTLMs: 1800000, maxSessionsPerUser: 3, absoluteTimeoutMs: 86400000, slidingWindowMs: 1800000 },
  familyConfig: { reuseDetectionEnabled: true, familyCompromiseAction: "REVOKE_FAMILY" },
  authEvents: [
    { eventId: "EV-1", type: "LOGIN", userId: "U1", currentTimeMs: 1000000, metadata: { device: "chrome" }, tokenRef: null },
    { eventId: "EV-2", type: "REFRESH", userId: "U1", currentTimeMs: 1500000, metadata: null, tokenRef: "EV-1" },
    { eventId: "EV-3", type: "REUSE_ATTACK", userId: "U1", currentTimeMs: 1600000, metadata: null, tokenRef: "EV-1" },
    { eventId: "EV-4", type: "LOGOUT", userId: "U1", currentTimeMs: 1700000, metadata: null, tokenRef: "EV-2" }
  ]
})` →

  **Manual Verify:**
  - EV-1: LOGIN → issue RT-1+AT-1, create session SES-1-U1, create family FAM-1-U1, add RT-1 to family
  - EV-2: REFRESH with RT-1 → rotateOnUse → RT-1 replaced, issue RT-2+AT-2, touch session
  - EV-3: REUSE_ATTACK with RT-1 (from EV-1) → RT-1 is REPLACED → reuse detected → REVOKE_FAMILY
  - EV-4: LOGOUT with RT-2 (from EV-2) → revoke RT-2, destroy session
  - compromisedFamilies: 1 (FAM-1-U1)
  - activeSessions: 0 (logged out)

  `{
  orchestratorId: "RT-ORCH-01",
  eventLog: [
    { eventId: "EV-1", type: "LOGIN", userId: "U1", result: { tokenPair: { accessToken: "AT-1-U1", refreshToken: "RT-1-U1", accessTokenExpiresAt: 1900000, refreshTokenExpiresAt: 87400000 }, sessionId: "SES-1-U1", familyId: "FAM-1-U1" } },
    { eventId: "EV-2", type: "REFRESH", userId: "U1", result: { newTokenPair: { accessToken: "AT-2-U1", refreshToken: "RT-2-U1" }, oldRefreshToken: "RT-1-U1", rotated: true, sessionExtended: true } },
    { eventId: "EV-3", type: "REUSE_ATTACK", userId: "U1", result: { used: false, reuseDetected: true, action: "REVOKE_FAMILY", familyId: "FAM-1-U1" } },
    { eventId: "EV-4", type: "LOGOUT", userId: "U1", result: { loggedOut: true, userId: "U1", sessionDestroyed: true } }
  ],
  summary: {
    totalEvents: 4,
    loginCount: 1,
    refreshCount: 1,
    logoutCount: 1,
    reuseAttackCount: 1,
    compromisedFamilies: 1,
    activeSessions: 0,
    activeRefreshTokens: 0
  }
}`

---
