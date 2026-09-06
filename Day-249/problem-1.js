// 🧩 PROBLEM–01: createRoleRegistry()

// Logic: Central registry of roles, permissions, and their assignments.
//   defineRole / definePermission / assign / revoke / queries

function createRoleRegistry() {

    const roles = {};
    const permissions = {};
    const assignments = {}; // roleName -> Set(permissionName)

    // --- PUBLIC API ---

    return {

        defineRole(roleConfig) {

            if (typeof roleConfig !== "object" || roleConfig === null || Array.isArray(roleConfig)) {
                return "Invalid Input";
            }

            if (typeof roleConfig.name !== "string" || roleConfig.name.length === 0) return "Invalid Input";

            if (roles[roleConfig.name]) {
                return { defined: false, reason: "Role already exists: " + roleConfig.name };
            }

            roles[roleConfig.name] = {
                name: roleConfig.name,
                description: roleConfig.description,
                level: roleConfig.level
            };

            if (!assignments[roleConfig.name]) assignments[roleConfig.name] = new Set();

            return { defined: true, name: roleConfig.name, level: roleConfig.level };
        },

        definePermission(permConfig) {

            if (typeof permConfig !== "object" || permConfig === null || Array.isArray(permConfig)) {
                return "Invalid Input";
            }

            if (typeof permConfig.name !== "string" || permConfig.name.length === 0) return "Invalid Input";

            if (permissions[permConfig.name]) {
                return { defined: false, reason: "Permission already exists: " + permConfig.name };
            }

            permissions[permConfig.name] = {
                name: permConfig.name,
                description: permConfig.description,
                resource: permConfig.resource,
                action: permConfig.action
            };

            return { defined: true, name: permConfig.name, resource: permConfig.resource, action: permConfig.action };
        },

        assignPermission(roleName, permissionName) {

            if (typeof roleName !== "string" || roleName.length === 0 ||
                typeof permissionName !== "string" || permissionName.length === 0) {
                return "Invalid Input";
            }

            if (!roles[roleName]) return { error: "Role not found: " + roleName };
            if (!permissions[permissionName]) return { error: "Permission not found: " + permissionName };

            if (assignments[roleName].has(permissionName)) {
                return { assigned: false, reason: "Already assigned" };
            }

            assignments[roleName].add(permissionName);

            return { assigned: true, roleName, permissionName };
        },

        revokePermission(roleName, permissionName) {

            if (typeof roleName !== "string" || roleName.length === 0 ||
                typeof permissionName !== "string" || permissionName.length === 0) {
                return "Invalid Input";
            }

            if (!assignments[roleName] || !assignments[roleName].has(permissionName)) {
                return { error: "Assignment not found" };
            }

            assignments[roleName].delete(permissionName);

            return { revoked: true, roleName, permissionName };
        },

        getRolePermissions(roleName) {

            if (typeof roleName !== "string" || roleName.length === 0) return "Invalid Input";

            if (!roles[roleName]) return { error: "Role not found" };

            const permObjects = Array.from(assignments[roleName] || []).map(name => ({ ...permissions[name] }));

            return { roleName, permissions: permObjects, count: permObjects.length };
        },

        listRoles() {
            return Object.values(roles).map(role => ({
                name: role.name,
                description: role.description,
                level: role.level,
                permissionCount: (assignments[role.name] || new Set()).size
            }));
        },

        listPermissions() {
            return Object.values(permissions).map(perm => ({ ...perm }));
        }
    };
}


// ------ EXAMPLE USAGE ------

const registry = createRoleRegistry();

registry.defineRole({ name: "ADMIN", description: "Full access", level: 100 });
registry.defineRole({ name: "USER", description: "Basic access", level: 10 });

registry.definePermission({ name: "users:read", description: "Read users", resource: "users", action: "read" });

registry.definePermission({ name: "users:write", description: "Write users", resource: "users", action: "write" });

registry.definePermission({ name: "orders:read", description: "Read orders", resource: "orders", action: "read" });

registry.assignPermission("ADMIN", "users:read");
registry.assignPermission("ADMIN", "users:write");
registry.assignPermission("ADMIN", "orders:read");
registry.assignPermission("USER", "users:read");
registry.assignPermission("USER", "orders:read");

console.log(registry.getRolePermissions("USER"));

console.log(registry.listRoles());

console.log(registry.defineRole({ name: "ADMIN", description: "dup", level: 1 }));

// --- INVALID ---
console.log(registry.defineRole(null));

console.log(registry.assignPermission("", ""));