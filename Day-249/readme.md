# 🎓 JS DAILY PRACTICE – DAY-249

📅 **Goal:** Role-Based Access Control (Security & Auth Patterns)
🎯 **Focus:** Roles & Permissions • Permission Inheritance • Policy Engine • Resource-Level Access • RBAC Audit

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 🏷️ Role & Permission Registry

⚠️ **Function Name:** `createRoleRegistry()`

| Input      | None (factory function) |
| :--------- | :---------------------- |
| **Output** | object (role registry)  |

**Rules:**

Return a role registry object with:

- `defineRole(roleConfig)` — define a new role
- `definePermission(permConfig)` — define a new permission
- `assignPermission(roleName, permissionName)` — assign permission to role
- `revokePermission(roleName, permissionName)` — remove permission from role
- `getRolePermissions(roleName)` — get all permissions for a role
- `listRoles()` — list all defined roles
- `listPermissions()` — list all defined permissions

**Role Config:**

```javascript
{
  name: string,          // unique role name e.g. "ADMIN", "USER", "MOD"
  description: string,
  level: number          // hierarchy level (higher = more powerful, e.g. ADMIN=100, USER=10)
}
```

**Permission Config:**

```javascript
{
  name: string,          // e.g. "users:read", "users:write", "orders:delete"
  description: string,
  resource: string,      // e.g. "users", "orders", "products"
  action: string         // e.g. "read", "write", "delete", "admin"
}
```

**Operation Rules:**

- `defineRole(roleConfig)`:
  - If role name already exists → `{ defined: false, reason: "Role already exists: " + name }`
  - Else → `{ defined: true, name, level }`

- `definePermission(permConfig)`:
  - If permission name already exists → `{ defined: false, reason: "Permission already exists: " + name }`
  - Else → `{ defined: true, name, resource, action }`

- `assignPermission(roleName, permissionName)`:
  - Both must exist
  - If already assigned → `{ assigned: false, reason: "Already assigned" }`
  - Else → `{ assigned: true, roleName, permissionName }`

- `revokePermission(roleName, permissionName)` → `{ revoked: true, roleName, permissionName }` or `{ error: "Assignment not found" }`

- `getRolePermissions(roleName)` → `{ roleName, permissions: [permission objects], count }` or `{ error: "Role not found" }`

- `listRoles()` → array of `{ name, description, level, permissionCount }`
- `listPermissions()` → array of `{ name, description, resource, action }`

**Validation:** method-level invalid → return `"Invalid Input"`

| Challenge 📢 | Return the role registry object maintaining internal state. |
| :----------- | :---------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const registry = createRoleRegistry();

registry.defineRole({ name: "ADMIN", description: "Full access", level: 100 });
registry.defineRole({ name: "USER", description: "Basic access", level: 10 });
registry.definePermission({
  name: "users:read",
  description: "Read users",
  resource: "users",
  action: "read",
});
registry.definePermission({
  name: "users:write",
  description: "Write users",
  resource: "users",
  action: "write",
});
registry.definePermission({
  name: "orders:read",
  description: "Read orders",
  resource: "orders",
  action: "read",
});

registry.assignPermission("ADMIN", "users:read");
registry.assignPermission("ADMIN", "users:write");
registry.assignPermission("ADMIN", "orders:read");
registry.assignPermission("USER", "users:read");
registry.assignPermission("USER", "orders:read");

registry.getRolePermissions("USER");
// → { roleName: "USER", permissions: [{ name: "users:read", ... }, { name: "orders:read", ... }], count: 2 }

registry.listRoles();
// → [
//   { name: "ADMIN", description: "Full access", level: 100, permissionCount: 3 },
//   { name: "USER", description: "Basic access", level: 10, permissionCount: 2 }
// ]
```

---

## 🧩 PROBLEM–02: 🔗 Role Inheritance Manager

⚠️ **Function Name:** `createRoleInheritanceManager()`

| Input      | `inheritanceConfig` (object) |
| :--------- | :--------------------------- |
| **Output** | object (inheritance manager) |

**Rules:**

`inheritanceConfig` object:

- `roles` (array of role objects: `{ name, description, level, permissions: [permName] }`)
- `inheritanceRules` (array of objects: `{ child, parent }`) — child inherits all parent permissions

Return an inheritance manager object with:

- `getEffectivePermissions(roleName)` — get all permissions including inherited
- `addInheritance(child, parent)` — add a new inheritance rule
- `removeInheritance(child, parent)` — remove inheritance rule
- `getInheritanceChain(roleName)` — return full inheritance chain
- `detectCircular()` — detect circular inheritance
- `compareRoles(roleA, roleB)` — compare two roles' effective permissions

**Inheritance Rules:**

- Inheritance is transitive: if A inherits B and B inherits C → A gets C's permissions too
- No circular inheritance allowed

**Operation Rules:**

- `getEffectivePermissions(roleName)`:
  - Get role's own permissions + all inherited permissions (deduplicated)
  - Returns `{ roleName, ownPermissions: [], inheritedPermissions: [], effectivePermissions: [], inheritedFrom: [roleNames] }`

- `addInheritance(child, parent)`:
  - Check for circular dependency before adding
  - Returns `{ added: true, child, parent }` or `{ error: "Circular inheritance detected" }` or `{ error: "Role not found" }`

- `removeInheritance(child, parent)` → `{ removed: true, child, parent }` or `{ error: "Rule not found" }`

- `getInheritanceChain(roleName)` → `{ roleName, chain: [roleNames in order from self to root], depth: N }`

- `detectCircular()` → `{ hasCircular: boolean, cycles: [[roleName cycle path]] }`

- `compareRoles(roleA, roleB)` → `{ roleA, roleB, onlyInA: [perms], onlyInB: [perms], inBoth: [perms], roleAIsSuperset: boolean, roleBIsSuperset: boolean }`

**Validation:** invalid `inheritanceConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the inheritance manager object with all 6 methods. |
| :----------- | :-------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const im = createRoleInheritanceManager({
  roles: [
    {
      name: "USER",
      description: "Basic",
      level: 10,
      permissions: ["users:read", "orders:read"],
    },
    {
      name: "MOD",
      description: "Moderator",
      level: 50,
      permissions: ["users:write", "orders:write"],
    },
    {
      name: "ADMIN",
      description: "Admin",
      level: 100,
      permissions: ["users:delete", "orders:delete"],
    },
  ],
  inheritanceRules: [
    { child: "MOD", parent: "USER" },
    { child: "ADMIN", parent: "MOD" },
  ],
});

im.getEffectivePermissions("ADMIN");
// ADMIN owns: [users:delete, orders:delete]
// inherits from MOD: [users:write, orders:write]
// inherits from USER (via MOD): [users:read, orders:read] →

// {
//   roleName: "ADMIN",
//   ownPermissions: ["users:delete", "orders:delete"],
//   inheritedPermissions: ["users:write", "orders:write", "users:read", "orders:read"],
//   effectivePermissions: ["users:delete", "orders:delete", "users:write", "orders:write", "users:read", "orders:read"],
//   inheritedFrom: ["MOD", "USER"]
// }

im.getInheritanceChain("ADMIN");
// → { roleName: "ADMIN", chain: ["ADMIN", "MOD", "USER"], depth: 2 }

im.compareRoles("MOD", "USER");
// → { roleA: "MOD", roleB: "USER", onlyInA: ["users:write", "orders:write"], onlyInB: [], inBoth: ["users:read", "orders:read"], roleAIsSuperset: true, roleBIsSuperset: false }

// Circular detection:
im.addInheritance("USER", "ADMIN");
// → { error: "Circular inheritance detected" }
```

---

## 🧩 PROBLEM–03: 🔐 Permission Checker

⚠️ **Function Name:** `createPermissionChecker()`

| Input      | `checkerConfig` (object)    |
| :--------- | :-------------------------- |
| **Output** | object (permission checker) |

**Rules:**

`checkerConfig` object:

- `roles` (object) — `{ roleName: { permissions: [string], inherits: [roleName] } }`
- `resources` (array of objects):
  - `name` (string) — resource name
  - `actions` (array of strings) — allowed actions on this resource
  - `ownershipRequired` (boolean) — if true, user must own the resource for write operations

Return a permission checker object with:

- `check(userId, roleName, resource, action)` — check if role can perform action
- `checkWithOwnership(userId, roleName, resource, action, resourceOwnerId)` — check with ownership
- `checkMultiple(userId, roleName, checks)` — check multiple resource+action pairs
- `getAccessMatrix(roleName)` — return full access matrix for a role
- `explainDecision(userId, roleName, resource, action)` — detailed explanation of decision

**Permission Naming Convention:** `"resource:action"` e.g. `"users:read"`, `"orders:delete"`

**Check Rules:**

- `check(userId, roleName, resource, action)`:
  - Get effective permissions (including inherited)
  - Check if `"resource:action"` OR `"resource:*"` OR `"*:action"` OR `"*:*"` is in permissions
  - Returns `{ permitted: boolean, userId, roleName, resource, action, matchedPermission: string or null, reason: string }`

- `checkWithOwnership(userId, roleName, resource, action, resourceOwnerId)`:
  - If `ownershipRequired: true` for this resource AND action is write/delete:
    - Check if `userId === resourceOwnerId` (owner gets permission even without explicit perm)
    - OR if role has the permission
  - Returns `{ permitted: boolean, ownershipGranted: boolean, roleGranted: boolean, reason: string }`

- `checkMultiple(userId, roleName, checks)`:
  - `checks`: array of `{ resource, action }`
  - Returns `{ results: [{ resource, action, permitted }], allPermitted: boolean, deniedCount: N }`

- `getAccessMatrix(roleName)`:
  - For each resource and its actions, show if permitted
  - Returns `{ roleName, matrix: { resourceName: { action: boolean } } }`

- `explainDecision(userId, roleName, resource, action)`:
  - Step-by-step explanation
  - Returns `{ permitted: boolean, steps: [string explanations], matchedPermission: string or null }`

**Validation:** invalid `checkerConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the permission checker object with all 5 methods. |
| :----------- | :------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const checker = createPermissionChecker({
  roles: {
    USER: { permissions: ["users:read", "orders:read"], inherits: [] },
    MOD: { permissions: ["users:write", "orders:write"], inherits: ["USER"] },
    ADMIN: { permissions: ["*:*"], inherits: [] },
  },
  resources: [
    {
      name: "users",
      actions: ["read", "write", "delete"],
      ownershipRequired: false,
    },
    {
      name: "orders",
      actions: ["read", "write", "delete"],
      ownershipRequired: true,
    },
  ],
});

checker.check("U1", "USER", "users", "read");
// → { permitted: true, userId: "U1", roleName: "USER", resource: "users", action: "read", matchedPermission: "users:read", reason: "Direct permission match" }

checker.check("U1", "USER", "users", "delete");
// → { permitted: false, userId: "U1", roleName: "USER", resource: "users", action: "delete", matchedPermission: null, reason: "No matching permission found" }

checker.check("U1", "ADMIN", "orders", "delete");
// ADMIN has "*:*"
// → { permitted: true, userId: "U1", roleName: "ADMIN", resource: "orders", action: "delete", matchedPermission: "*:*", reason: "Wildcard permission match" }

checker.checkWithOwnership("U1", "USER", "orders", "write", "U1");
// USER doesn't have orders:write but U1 owns the order
// → { permitted: true, ownershipGranted: true, roleGranted: false, reason: "Permitted via resource ownership" }

checker.getAccessMatrix("MOD");
// MOD effective: users:read, orders:read (inherited), users:write, orders:write (own)
// → {
//   roleName: "MOD",
//   matrix: {
//     users: { read: true, write: true, delete: false },
//     orders: { read: true, write: true, delete: false }
//   }
// }
```

---

## 🧩 PROBLEM–04: 📋 RBAC Policy Engine

⚠️ **Function Name:** `createRBACPolicyEngine()`

| Input      | `policyConfig` (object) |
| :--------- | :---------------------- |
| **Output** | object (policy engine)  |

**Rules:**

`policyConfig` object:

- `engineId` (string, non-empty)
- `policies` (array of objects):
  - `policyId` (string)
  - `effect` (string: `"ALLOW"`, `"DENY"`) — DENY takes precedence over ALLOW
  - `roles` (array of strings) — which roles this policy applies to (`"*"` = all roles)
  - `resources` (array of strings) — which resources (`"*"` = all)
  - `actions` (array of strings) — which actions (`"*"` = all)
  - `conditions` (object or null):
    - `timeRange` (object or null): `{ startHour: 0-23, endHour: 0-23 }` — only allow during these hours
    - `ipWhitelist` (array or null): allowed IP addresses
    - `requireMFA` (boolean or null): require MFA to be verified

Return a policy engine object with:

- `evaluate(context)` — evaluate policies for a given access context
- `addPolicy(policy)` — add a new policy at runtime
- `removePolicy(policyId)` — remove a policy
- `listPolicies()` — list all policies
- `simulateAccess(scenarios)` — run multiple access scenarios

**Context Object:**

```javascript
{
  userId: string,
  roles: [string],
  resource: string,
  action: string,
  ip: string or null,
  currentHour: number or null,  // 0-23
  mfaVerified: boolean
}
```

**Evaluation Rules:**

- Collect all matching policies (role matches, resource matches, action matches)
- Apply conditions: if condition not met → policy doesn't apply
- **DENY overrides ALLOW**: if ANY matching policy is DENY → access denied
- If no matching ALLOW policy → access denied (default deny)
- Returns `{ permitted: boolean, appliedPolicies: [policyIds], reason: "EXPLICIT_ALLOW"/"EXPLICIT_DENY"/"DEFAULT_DENY"/"CONDITION_NOT_MET" }`

- `addPolicy(policy)` → `{ added: true, policyId }` or `{ error: "Policy already exists" }`
- `removePolicy(policyId)` → `{ removed: true, policyId }` or `{ error: "Policy not found" }`
- `listPolicies()` → array of policy objects
- `simulateAccess(scenarios)` → array of `{ scenario, result }` where each scenario is a context object

**Validation:** invalid `policyConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the RBAC policy engine object with all 5 methods. |
| :----------- | :------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const engine = createRBACPolicyEngine({
  engineId: "ENGINE-01",
  policies: [
    {
      policyId: "P1",
      effect: "ALLOW",
      roles: ["USER", "MOD"],
      resources: ["articles"],
      actions: ["read"],
      conditions: null,
    },
    {
      policyId: "P2",
      effect: "ALLOW",
      roles: ["ADMIN"],
      resources: ["*"],
      actions: ["*"],
      conditions: null,
    },
    {
      policyId: "P3",
      effect: "DENY",
      roles: ["*"],
      resources: ["admin-panel"],
      actions: ["*"],
      conditions: {
        timeRange: { startHour: 9, endHour: 17 },
        ipWhitelist: ["10.0.0.1", "10.0.0.2"],
        requireMFA: true,
      },
    },
  ],
});

engine.evaluate({
  userId: "U1",
  roles: ["USER"],
  resource: "articles",
  action: "read",
  ip: null,
  currentHour: 10,
  mfaVerified: false,
});
// P1 matches (USER, articles, read) → ALLOW
// → { permitted: true, appliedPolicies: ["P1"], reason: "EXPLICIT_ALLOW" }

engine.evaluate({
  userId: "U1",
  roles: ["USER"],
  resource: "articles",
  action: "delete",
  ip: null,
  currentHour: 10,
  mfaVerified: false,
});
// No matching ALLOW policy → DEFAULT_DENY
// → { permitted: false, appliedPolicies: [], reason: "DEFAULT_DENY" }

engine.evaluate({
  userId: "U2",
  roles: ["ADMIN"],
  resource: "admin-panel",
  action: "read",
  ip: "192.168.1.1",
  currentHour: 14,
  mfaVerified: false,
});
// P2 matches (ADMIN, *, *) → ALLOW
// P3 matches (* roles, admin-panel, *) but ip not in whitelist + mfa not verified → condition not met → P3 doesn't apply
// → { permitted: true, appliedPolicies: ["P2"], reason: "EXPLICIT_ALLOW" }

engine.evaluate({
  userId: "U2",
  roles: ["ADMIN"],
  resource: "admin-panel",
  action: "read",
  ip: "10.0.0.1",
  currentHour: 14,
  mfaVerified: false,
});
// P2 ALLOW, P3 DENY (ip matches but mfa not verified → condition partially met but requireMFA fails → still not fully met)
// → { permitted: true, appliedPolicies: ["P2"], reason: "EXPLICIT_ALLOW" }
```

---

## 🧩 PROBLEM–05: 🏗️ Full RBAC Orchestrator

⚠️ **Function Name:** `runRBACOrchestrator()`

| Input      | `rbacConfig` (object) |
| :--------- | :-------------------- |
| **Output** | object                |

**Rules:**

`rbacConfig` object:

- `orchestratorId` (string, non-empty)
- `roles` (array of objects): `{ name, description, level, permissions: [string], inherits: [string] }`
- `resources` (array of objects): `{ name, actions: [string], ownershipRequired: boolean }`
- `policies` (array of policy objects — same as Problem-04)
- `users` (array of objects): `{ userId, roles: [string], mfaEnabled: boolean }`
- `accessRequests` (array of objects):
  - `requestId` (string)
  - `userId` (string)
  - `resource` (string)
  - `action` (string)
  - `resourceOwnerId` (string or null)
  - `ip` (string or null)
  - `currentHour` (number or null)
  - `mfaVerified` (boolean)

**Orchestration Rules (compose all previous concepts):**

1. **Setup Registry** (Problem-01) — define all roles and permissions
2. **Setup Inheritance** (Problem-02) — apply inheritance rules
3. **Setup Checker** (Problem-03) — configure permission checker
4. **Setup Policy Engine** (Problem-04) — load policies
5. **Process Access Requests:**
   - Get user's roles from `users` array
   - Run `permissionChecker.check()` (Problem-03)
   - Run `policyEngine.evaluate()` (Problem-04)
   - Final decision: BOTH checker AND policy engine must permit
   - If ownership relevant → run `checkWithOwnership()`
6. **Build Summary:**
   - `totalRequests`
   - `permittedCount`
   - `deniedCount`
   - `denialReasons` → `{ NO_PERMISSION: N, POLICY_DENY: N, DEFAULT_DENY: N }`
   - `mostDeniedResource` → resource with most denials
   - `mostActiveUser` → userId with most requests

**Validation:** invalid `rbacConfig` or missing fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ orchestratorId, accessLog, summary }` where `accessLog` is array of `{ requestId, userId, resource, action, permitted, reason, checkerResult, policyResult }`. |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runRBACOrchestrator({
  orchestratorId: "RBAC-ORCH-01",
  roles: [
    { name: "USER", description: "Basic user", level: 10, permissions: ["articles:read", "comments:write"], inherits: [] },
    { name: "ADMIN", description: "Administrator", level: 100, permissions: ["*:*"], inherits: [] }
  ],
  resources: [
    { name: "articles", actions: ["read", "write", "delete"], ownershipRequired: false },
    { name: "comments", actions: ["read", "write", "delete"], ownershipRequired: true },
    { name: "admin-panel", actions: ["read", "write"], ownershipRequired: false }
  ],
  policies: [
    { policyId: "P1", effect: "ALLOW", roles: ["USER"], resources: ["articles"], actions: ["read"], conditions: null },
    { policyId: "P2", effect: "ALLOW", roles: ["ADMIN"], resources: ["*"], actions: ["*"], conditions: null },
    { policyId: "P3", effect: "DENY", roles: ["USER"], resources: ["admin-panel"], actions: ["*"], conditions: null }
  ],
  users: [
    { userId: "U1", roles: ["USER"], mfaEnabled: false },
    { userId: "U2", roles: ["ADMIN"], mfaEnabled: true }
  ],
  accessRequests: [
    { requestId: "AR-1", userId: "U1", resource: "articles", action: "read", resourceOwnerId: null, ip: null, currentHour: 10, mfaVerified: false },
    { requestId: "AR-2", userId: "U1", resource: "admin-panel", action: "read", resourceOwnerId: null, ip: null, currentHour: 10, mfaVerified: false },
    { requestId: "AR-3", userId: "U2", resource: "admin-panel", action: "write", resourceOwnerId: null, ip: null, currentHour: 10, mfaVerified: true },
    { requestId: "AR-4", userId: "U1", resource: "articles", action: "delete", resourceOwnerId: null, ip: null, currentHour: 10, mfaVerified: false }
  ]
})` →

  **Manual Verify:**
  - AR-1: U1(USER) → articles:read → checker✓(has perm) + policy✓(P1 ALLOW) → PERMITTED
  - AR-2: U1(USER) → admin-panel:read → checker✗(no perm) + policy✗(P3 DENY) → DENIED
  - AR-3: U2(ADMIN) → admin-panel:write → checker✓(_:_) + policy✓(P2 ALLOW) → PERMITTED
  - AR-4: U1(USER) → articles:delete → checker✗(no delete perm) → DENIED (NO_PERMISSION)
  - permittedCount: 2, deniedCount: 2

  `{
  orchestratorId: "RBAC-ORCH-01",
  accessLog: [
    { requestId: "AR-1", userId: "U1", resource: "articles", action: "read", permitted: true, reason: "BOTH_CHECKS_PASSED", checkerResult: { permitted: true, matchedPermission: "articles:read" }, policyResult: { permitted: true, appliedPolicies: ["P1"], reason: "EXPLICIT_ALLOW" } },
    { requestId: "AR-2", userId: "U1", resource: "admin-panel", action: "read", permitted: false, reason: "POLICY_DENY", checkerResult: { permitted: false, matchedPermission: null }, policyResult: { permitted: false, appliedPolicies: ["P3"], reason: "EXPLICIT_DENY" } },
    { requestId: "AR-3", userId: "U2", resource: "admin-panel", action: "write", permitted: true, reason: "BOTH_CHECKS_PASSED", checkerResult: { permitted: true, matchedPermission: "*:*" }, policyResult: { permitted: true, appliedPolicies: ["P2"], reason: "EXPLICIT_ALLOW" } },
    { requestId: "AR-4", userId: "U1", resource: "articles", action: "delete", permitted: false, reason: "NO_PERMISSION", checkerResult: { permitted: false, matchedPermission: null }, policyResult: { permitted: false, appliedPolicies: [], reason: "DEFAULT_DENY" } }
  ],
  summary: {
    totalRequests: 4,
    permittedCount: 2,
    deniedCount: 2,
    denialReasons: { NO_PERMISSION: 1, POLICY_DENY: 1, DEFAULT_DENY: 0 },
    mostDeniedResource: "admin-panel",
    mostActiveUser: "U1"
  }
}`

---
