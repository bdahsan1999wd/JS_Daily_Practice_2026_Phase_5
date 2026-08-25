// 🧩 PROBLEM–03: simulateJoins()

// Logic: Simulates SQL-style joins between two tables.
//   INNER — rows where tableA[onA] === tableB[onB]
//   LEFT  — all rows from A; unmatched B fields are null
//   RIGHT — all rows from B; unmatched A fields are null
//   FULL  — all rows from both; unmatched sides filled with null

// Output rows prefix fields with table name: "tableA.field", "tableB.field".
// If selectFields provided, only those (dot-notation keys) are included.


function simulateJoins(tables, joinConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof tables !== "object" || tables === null || Array.isArray(tables) ||
        typeof joinConfig !== "object" || joinConfig === null || Array.isArray(joinConfig)
    ) {
        return "Invalid Input";
    }

    const { joinType, tableA, tableB, onA, onB, selectFields } = joinConfig;

    if (
        !["INNER", "LEFT", "RIGHT", "FULL"].includes(joinType) ||
        typeof tableA !== "string" || typeof tableB !== "string" ||
        typeof onA !== "string" || typeof onB !== "string" ||
        !Array.isArray(tables[tableA]) ||
        !Array.isArray(tables[tableB]) ||
        (selectFields !== null && !Array.isArray(selectFields))
    ) {
        return "Invalid Input";
    }

    const rowsA = tables[tableA];
    const rowsB = tables[tableB];

    // Column keys for each side (for null-filling unmatched rows).
    const allKeysA = rowsA.length > 0 ? Object.keys(rowsA[0]) : [];
    const allKeysB = rowsB.length > 0 ? Object.keys(rowsB[0]) : [];

    // --- STEP 2: BUILD MERGED ROW ---

    function buildRow(a, b) {

        const merged = {};

        if (a) {
            for (const key of Object.keys(a)) merged[tableA + "." + key] = a[key];
        } else {
            // Unmatched side → fill A fields with null.
            for (const key of allKeysA) merged[tableA + "." + key] = null;
        }

        if (b) {
            for (const key of Object.keys(b)) merged[tableB + "." + key] = b[key];
        } else {
            // Unmatched side → fill B fields with null.
            for (const key of allKeysB) merged[tableB + "." + key] = null;
        }

        // Apply selectFields filter if provided.

        if (selectFields) {
            const filtered = {};
            for (const f of selectFields) {
                if (merged[f] !== undefined) filtered[f] = merged[f];
            }
            return filtered;
        }

        return merged;
    }

    // --- STEP 3: COMPUTE JOIN ---

    const rows = [];

    const aMatches = (a, b) => a[onA] === b[onB];

    switch (joinType) {

        case "INNER": {
            for (const a of rowsA) {
                for (const b of rowsB) {
                    if (aMatches(a, b)) rows.push(buildRow(a, b));
                }
            }
            break;
        }

        case "LEFT": {
            for (const a of rowsA) {
                const matched = rowsB.filter(b => aMatches(a, b));
                if (matched.length > 0) {
                    for (const b of matched) rows.push(buildRow(a, b));
                } else {
                    rows.push(buildRow(a, null));
                }
            }
            break;
        }

        case "RIGHT": {
            for (const b of rowsB) {
                const matched = rowsA.filter(a => aMatches(a, b));
                if (matched.length > 0) {
                    for (const a of matched) rows.push(buildRow(a, b));
                } else {
                    rows.push(buildRow(null, b));
                }
            }
            break;
        }

        case "FULL": {
            // LEFT part.
            for (const a of rowsA) {
                const matched = rowsB.filter(b => aMatches(a, b));
                if (matched.length > 0) {
                    for (const b of matched) rows.push(buildRow(a, b));
                } else {
                    rows.push(buildRow(a, null));
                }
            }

            // RIGHT part: only rows in B that matched nothing in A.
            for (const b of rowsB) {
                const matched = rowsA.filter(a => aMatches(a, b));
                if (matched.length === 0) rows.push(buildRow(null, b));
            }
            break;
        }
    }

    return { joinType, rowCount: rows.length, rows };
}



// ------ EXAMPLE USAGE ------

console.log(simulateJoins(
    {
        users: [
            { id: "U1", name: "Rahim", deptId: "D1" },
            { id: "U2", name: "Karim", deptId: "D2" },
            { id: "U3", name: "Nadia", deptId: "D3" }
        ],
        departments: [
            { id: "D1", deptName: "IT" },
            { id: "D2", deptName: "HR" }
        ]
    },
    { joinType: "LEFT", tableA: "users", tableB: "departments", onA: "deptId", onB: "id", selectFields: null }
));


console.log(simulateJoins(
    {
        users: [{ id: "U1", name: "Rahim", deptId: "D1" }],
        departments: [{ id: "D1", deptName: "IT" }, { id: "D2", deptName: "HR" }]
    },
    { joinType: "INNER", tableA: "users", tableB: "departments", onA: "deptId", onB: "id", selectFields: ["users.name", "departments.deptName"] }
));


// --- INVALID ---
console.log(simulateJoins({ users: [] }, { joinType: "BAD", tableA: "users", tableB: "x", onA: "id", onB: "id", selectFields: null }));