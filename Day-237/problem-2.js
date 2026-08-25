// 🧩 PROBLEM–02: createManyToManyRelation()

// Logic: Returns a many-to-many relation manager with a junction table.
//   addEntityA(doc)      — add entity A record
//   addEntityB(doc)      — add entity B record
//   link(aId, bId, meta) — create junction record
//   unlink(aId, bId)     — remove junction record
//   getLinkedB(aId)      — all B records linked to an A
//   getLinkedA(bId)      — all A records linked to a B
//   getJunctionStats()   — junction stats

// Junction doc: { junctionId: "Junction_N", entityAId, entityBId, ...metadata, linkedAt: "2025-01-01T00:00:00Z" }


function createManyToManyRelation(relationConfig) {

    // --- STEP 1: VALIDATE relationConfig ---

    if (
        typeof relationConfig !== "object" || relationConfig === null || Array.isArray(relationConfig) ||
        typeof relationConfig.entityA !== "string" || relationConfig.entityA.trim() === "" ||
        typeof relationConfig.entityB !== "string" || relationConfig.entityB.trim() === "" ||
        typeof relationConfig.junctionTable !== "string" || relationConfig.junctionTable.trim() === ""
    ) {
        return "Invalid Input";
    }

    const { entityA, entityB, junctionTable } = relationConfig;

    // --- STEP 2: INTERNAL STATE ---

    const storeA = []; // entity A records { id, ... }
    const storeB = []; // entity B records { id, ... }
    const junctions = []; // junction records

    let indexA = 0;
    let indexB = 0;
    let indexJ = 0;

    // --- STEP 3: RETURN RELATION MANAGER ---

    return {

        addEntityA(doc) {

            if (typeof doc !== "object" || doc === null || Array.isArray(doc)) return "Invalid Input";

            indexA++;
            const newDoc = { id: entityA + "_" + indexA, ...doc };

            storeA.push(newDoc);

            return { inserted: true, doc: { ...newDoc } };
        },

        addEntityB(doc) {

            if (typeof doc !== "object" || doc === null || Array.isArray(doc)) return "Invalid Input";

            indexB++;
            const newDoc = { id: entityB + "_" + indexB, ...doc };

            storeB.push(newDoc);

            return { inserted: true, doc: { ...newDoc } };
        },

        link(entityAId, entityBId, metadata) {

            if (typeof entityAId !== "string" || typeof entityBId !== "string") return "Invalid Input";

            const a = storeA.find(x => x.id === entityAId);
            const b = storeB.find(x => x.id === entityBId);

            if (!a || !b) return { error: "Both entities must exist" };

            if (junctions.some(j => j.entityAId === entityAId && j.entityBId === entityBId)) {
                return { linked: false, reason: "Link already exists" };
            }

            indexJ++;

            const junctionDoc = {
                junctionId: junctionTable + "_" + indexJ,
                entityAId,
                entityBId,
                ...(metadata || {}),
                linkedAt: "2025-01-01T00:00:00Z"
            };

            junctions.push(junctionDoc);

            return { linked: true, junction: { ...junctionDoc } };
        },

        unlink(entityAId, entityBId) {

            if (typeof entityAId !== "string" || typeof entityBId !== "string") return "Invalid Input";

            const idx = junctions.findIndex(j => j.entityAId === entityAId && j.entityBId === entityBId);

            if (idx === -1) return { error: "Link not found" };

            junctions.splice(idx, 1);

            return { unlinked: true, entityAId, entityBId };
        },

        getLinkedB(entityAId) {

            if (typeof entityAId !== "string") return "Invalid Input";

            const linkedB = junctions
                .filter(j => j.entityAId === entityAId)
                .map(j => {
                    const b = storeB.find(x => x.id === j.entityBId);
                    return b
                        ? { ...b, junction: { ...j, junctionId: undefined, entityAId: undefined, entityBId: undefined, linkedAt: undefined } }
                        : null;
                })
                .filter(x => x !== null);

            return { entityAId, linkedB, count: linkedB.length };
        },

        getLinkedA(entityBId) {

            if (typeof entityBId !== "string") return "Invalid Input";

            const linkedA = junctions
                .filter(j => j.entityBId === entityBId)
                .map(j => {
                    const a = storeA.find(x => x.id === j.entityAId);
                    return a
                        ? { ...a, junction: { ...j, junctionId: undefined, entityAId: undefined, entityBId: undefined, linkedAt: undefined } }
                        : null;
                })
                .filter(x => x !== null);

            return { entityBId, linkedA, count: linkedA.length };
        },

        getJunctionStats() {

            const uniqueA = new Set(junctions.map(j => j.entityAId)).size;
            const uniqueB = new Set(junctions.map(j => j.entityBId)).size;

            const avg = uniqueA === 0
                ? 0
                : Number((junctions.length / uniqueA).toFixed(2));

            return { totalLinks: junctions.length, uniqueAIds: uniqueA, uniqueBIds: uniqueB, avgLinksPerA: avg };
        }
    };
}



// ------ EXAMPLE USAGE ------

const rel = createManyToManyRelation({
    entityA: "Student",
    entityB: "Course",
    junctionTable: "StudentCourse"
});

console.log(rel.addEntityA({ name: "Rahim" }));

console.log(rel.addEntityA({ name: "Karim" }));

console.log(rel.addEntityB({ title: "JavaScript" }));

console.log(rel.addEntityB({ title: "Python" }));

console.log(rel.link("Student_1", "Course_1", { grade: null }));


rel.link("Student_1", "Course_2", { grade: null });
rel.link("Student_2", "Course_1", { grade: "A" });

console.log(rel.getLinkedB("Student_1"));
console.log(rel.getLinkedA("Course_1"));


console.log("----------------");
console.log(rel.getJunctionStats());
console.log("----------------");


// --- INVALID ---
console.log(createManyToManyRelation({ entityA: "", entityB: "Course", junctionTable: "SC" }));