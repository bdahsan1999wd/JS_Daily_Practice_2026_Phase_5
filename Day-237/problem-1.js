// 🧩 PROBLEM–01: createOneToManyRelation()

// Logic: Returns a one-to-many relation manager.
//   addParent(doc)         — add a parent record (auto-id "Parent_N")
//   addChild(doc)          — add a child (must have valid foreignKey parent)
//   getChildren(parentId)  — children belonging to a parent
//   getParent(childId)     — parent of a child
//   deleteParent(parentId, cascade) — delete parent (+ children if cascade)
//   getRelationStats()     — counts + orphan info

// Child id auto-generated "Child_N"; foreignKey must reference a real parent.


function createOneToManyRelation(relationConfig) {

    // --- STEP 1: VALIDATE relationConfig ---

    if (
        typeof relationConfig !== "object" || relationConfig === null || Array.isArray(relationConfig) ||
        typeof relationConfig.parentEntity !== "string" || relationConfig.parentEntity.trim() === "" ||
        typeof relationConfig.childEntity !== "string" || relationConfig.childEntity.trim() === "" ||
        typeof relationConfig.foreignKey !== "string" || relationConfig.foreignKey.trim() === ""
    ) {
        return "Invalid Input";
    }

    const { parentEntity, childEntity, foreignKey } = relationConfig;

    // --- STEP 2: INTERNAL STATE ---

    const parents = []; // { id, ...doc }
    const children = []; // { id, ...doc }

    let parentAutoIndex = 0;
    let childAutoIndex = 0;

    // --- STEP 3: RETURN RELATION MANAGER ---

    return {

        addParent(doc) {

            if (typeof doc !== "object" || doc === null || Array.isArray(doc)) return "Invalid Input";

            parentAutoIndex++;
            const newDoc = { id: parentEntity + "_" + parentAutoIndex, ...doc };

            parents.push(newDoc);

            return { inserted: true, doc: { ...newDoc } };
        },

        addChild(doc) {

            if (typeof doc !== "object" || doc === null || Array.isArray(doc)) return "Invalid Input";

            if (doc[foreignKey] === undefined) return "Invalid Input";

            const parentId = doc[foreignKey];

            const parent = parents.find(p => p.id === parentId);

            if (!parent) return { error: "Parent not found: " + parentId };

            childAutoIndex++;
            const newDoc = { id: childEntity + "_" + childAutoIndex, ...doc };

            children.push(newDoc);

            return { inserted: true, doc: { ...newDoc } };
        },

        getChildren(parentId) {

            if (typeof parentId !== "string") return "Invalid Input";

            const matches = children.filter(c => c[foreignKey] === parentId).map(c => ({ ...c }));

            return { parentId, children: matches, count: matches.length };
        },

        getParent(childId) {

            if (typeof childId !== "string") return "Invalid Input";

            const child = children.find(c => c.id === childId);

            if (!child) return { error: "Child not found" };

            const parent = parents.find(p => p.id === child[foreignKey]);

            return { childId, parent: parent ? { ...parent } : null };
        },

        deleteParent(parentId, cascade) {

            if (typeof parentId !== "string" || typeof cascade !== "boolean") return "Invalid Input";

            const parentIdx = parents.findIndex(p => p.id === parentId);

            if (parentIdx === -1) return { error: "Parent not found" };

            const childMatches = children.filter(c => c[foreignKey] === parentId);

            if (!cascade && childMatches.length > 0) {
                return { error: "Cannot delete parent with children. Use cascade: true" };
            }

            parents.splice(parentIdx, 1);

            const childrenDeleted = childMatches.length;

            if (cascade) {
                for (const child of childMatches) {
                    const idx = children.findIndex(c => c.id === child.id);
                    if (idx !== -1) children.splice(idx, 1);
                }
            }

            return { deleted: true, parentId, childrenDeleted };
        },

        getRelationStats() {

            const parentsWithNoChildren = parents.filter(p =>
                !children.some(c => c[foreignKey] === p.id)
            ).length;

            const avg = parents.length === 0
                ? 0
                : Number((children.length / parents.length).toFixed(2));

            return {
                parentCount: parents.length,
                childCount: children.length,
                avgChildrenPerParent: avg,
                parentsWithNoChildren
            };
        }
    };
}


// ------ EXAMPLE USAGE ------

const rel = createOneToManyRelation({
    parentEntity: "User",
    childEntity: "Order",
    foreignKey: "userId"
});


console.log(rel.addParent({ name: "Rahim" }));

console.log(rel.addParent({ name: "Karim" }));

console.log(rel.addChild({ userId: "User_1", amount: 500 }));

console.log(rel.addChild({ userId: "User_1", amount: 300 }));

console.log(rel.addChild({ userId: "User_99", amount: 100 }));

console.log(rel.getChildren("User_1"));

console.log(rel.getParent("Order_1"));

console.log(rel.deleteParent("User_1", false));

console.log(rel.deleteParent("User_1", true));

console.log(rel.getRelationStats());


// --- INVALID ---
console.log(createOneToManyRelation({ parentEntity: "", childEntity: "Order", foreignKey: "userId" }));