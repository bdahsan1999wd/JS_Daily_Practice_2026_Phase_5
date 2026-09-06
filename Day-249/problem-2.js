// 🧩 PROBLEM–02: createRoleInheritanceManager()

// Logic: Transitive role inheritance.
//   child inherits from parent (all parent permissions recursively).
//   detect circular before adding rules.

function createRoleInheritanceManager(inheritanceConfig) {

    // --- STEP 1: VALIDATE ---

    if (
        typeof inheritanceConfig !== "object" ||
        inheritanceConfig === null ||
        Array.isArray(inheritanceConfig) ||
        !Array.isArray(inheritanceConfig.roles) ||
        !Array.isArray(inheritanceConfig.inheritanceRules)
    ) {
        return "Invalid Input";
    }

    const roles = {};
    const ruleMap = {}; // child -> [parent names]

    for (const role of inheritanceConfig.roles) {
        if (typeof role !== "object" || role === null || Array.isArray(role) ||
            typeof role.name !== "string" || role.name.length === 0) {
            return "Invalid Input";
        }
        roles[role.name] = {
            name: role.name,
            description: role.description,
            level: role.level,
            permissions: Array.isArray(role.permissions) ? [...role.permissions] : []
        };
        ruleMap[role.name] = [];
    }

    for (const rule of inheritanceConfig.inheritanceRules) {
        if (typeof rule !== "object" || rule === null || Array.isArray(rule) ||
            typeof rule.child !== "string" || rule.child.length === 0 ||
            typeof rule.parent !== "string" || rule.parent.length === 0) {
            return "Invalid Input";
        }
        if (!roles[rule.child] || !roles[rule.parent]) return "Invalid Input";
        ruleMap[rule.child].push(rule.parent);
    }

    // --- HELPERS ---

    function allAncestors(roleName, seen) {
        // transitive parent set
        seen.add(roleName);
        const result = [];
        for (const parent of ruleMap[roleName] || []) {
            if (!seen.has(parent)) {
                result.push(parent);
                result.push(...allAncestors(parent, seen));
            }
        }
        return result;
    }

    function orderedAncestors(roleName) {
        // BFS-ish: nearest parent first
        const result = [];
        const queue = [...(ruleMap[roleName] || [])];
        const seen = new Set([roleName]);
        while (queue.length > 0) {
            const current = queue.shift();
            if (seen.has(current)) continue;
            seen.add(current);
            result.push(current);
            queue.push(...(ruleMap[current] || []));
        }
        return result;
    }

    function hasCycle() {
        // DFS cycle detection over rule graph
        const WHITE = 0, GRAY = 1, BLACK = 2;
        const color = {};
        for (const name of Object.keys(roles)) color[name] = WHITE;

        const cycles = [];
        const stack = [];

        function dfs(node) {
            color[node] = GRAY;
            stack.push(node);
            for (const parent of ruleMap[node] || []) {
                if (color[parent] === GRAY) {
                    const idx = stack.indexOf(parent);
                    const cycle = stack.slice(idx).concat(parent);
                    cycles.push(cycle);
                } else if (color[parent] === WHITE) {
                    dfs(parent);
                }
            }
            stack.pop();
            color[node] = BLACK;
        }

        for (const name of Object.keys(roles)) {
            if (color[name] === WHITE) dfs(name);
        }

        return { hasCircular: cycles.length > 0, cycles };
    }

    // --- PUBLIC API ---

    return {

        getEffectivePermissions(roleName) {

            if (typeof roleName !== "string" || roleName.length === 0) return "Invalid Input";
            if (!roles[roleName]) return { error: "Role not found" };

            const own = [...roles[roleName].permissions];

            const inheritedPerms = [];
            const inheritedFrom = [];

            const ancestors = orderedAncestors(roleName);
            for (const ancestor of ancestors) {
                inheritedFrom.push(ancestor);
                for (const perm of roles[ancestor].permissions) {
                    if (!inheritedPerms.includes(perm)) inheritedPerms.push(perm);
                }
            }

            const effective = [];
            for (const perm of own) effective.push(perm);
            for (const perm of inheritedPerms) effective.push(perm);

            return {
                roleName,
                ownPermissions: own,
                inheritedPermissions: inheritedPerms,
                effectivePermissions: effective,
                inheritedFrom
            };
        },

        addInheritance(child, parent) {

            if (typeof child !== "string" || child.length === 0 ||
                typeof parent !== "string" || parent.length === 0) {
                return "Invalid Input";
            }

            if (!roles[child] || !roles[parent]) return { error: "Role not found" };

            if (child === parent) return { error: "Circular inheritance detected" };

            // check circularity if we add this edge
            ruleMap[child].push(parent);
            const { hasCircular } = hasCycle();
            if (hasCircular) {
                ruleMap[child].pop();
                return { error: "Circular inheritance detected" };
            }

            return { added: true, child, parent };
        },

        removeInheritance(child, parent) {

            if (typeof child !== "string" || child.length === 0 ||
                typeof parent !== "string" || parent.length === 0) {
                return "Invalid Input";
            }

            const list = ruleMap[child] || [];
            const idx = list.indexOf(parent);
            if (idx === -1) return { error: "Rule not found" };

            list.splice(idx, 1);

            return { removed: true, child, parent };
        },

        getInheritanceChain(roleName) {

            if (typeof roleName !== "string" || roleName.length === 0) return "Invalid Input";
            if (!roles[roleName]) return { error: "Role not found" };

            const chain = [roleName];

            let current = roleName;
            const seen = new Set([roleName]);
            while (true) {
                const parents = ruleMap[current] || [];
                const next = parents.find(p => !seen.has(p));
                if (next === undefined) break;
                seen.add(next);
                chain.push(next);
                current = next;
            }

            return { roleName, chain, depth: chain.length - 1 };
        },

        detectCircular() {
            return hasCycle();
        },

        compareRoles(roleA, roleB) {

            if (typeof roleA !== "string" || roleA.length === 0 ||
                typeof roleB !== "string" || roleB.length === 0) {
                return "Invalid Input";
            }

            if (!roles[roleA] || !roles[roleB]) return { error: "Role not found" };

            const a = this.getEffectivePermissions(roleA).effectivePermissions;
            const b = this.getEffectivePermissions(roleB).effectivePermissions;

            const onlyInA = a.filter(p => !b.includes(p));
            const onlyInB = b.filter(p => !a.includes(p));
            const inBoth = a.filter(p => b.includes(p));

            return {
                roleA,
                roleB,
                onlyInA,
                onlyInB,
                inBoth,
                roleAIsSuperset: onlyInB.length === 0,
                roleBIsSuperset: onlyInA.length === 0
            };
        }
    };
}


// ------ EXAMPLE USAGE ------

const im = createRoleInheritanceManager({
    roles: [
        { name: "USER", description: "Basic", level: 10, permissions: ["users:read", "orders:read"] },
        { name: "MOD", description: "Moderator", level: 50, permissions: ["users:write", "orders:write"] },
        { name: "ADMIN", description: "Admin", level: 100, permissions: ["users:delete", "orders:delete"] }
    ],
    inheritanceRules: [
        { child: "MOD", parent: "USER" },
        { child: "ADMIN", parent: "MOD" }
    ]
});

console.log(im.getEffectivePermissions("ADMIN"));

console.log(im.getInheritanceChain("ADMIN"));

console.log(im.compareRoles("MOD", "USER"));

console.log(im.addInheritance("USER", "ADMIN"));

console.log(im.detectCircular());


// --- INVALID ---
console.log(createRoleInheritanceManager(null));