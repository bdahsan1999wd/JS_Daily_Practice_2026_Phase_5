// 🧩 PROBLEM–05: runTreeChallenge()

// Logic: Full tree orchestrator composing Problems 01–04.
//   1. Build a BST from `values`.
//   2. Run requested traversals on the initial BST.
//   3. Apply BST operations sequentially and log results.
//   4. Solve tree problems on the FINAL tree state.
//   5. Build a summary.

function runTreeChallenge(challengeConfig) {

    // --- STEP 1: VALIDATE challengeConfig ---

    if (
        typeof challengeConfig !== "object" ||
        challengeConfig === null ||
        Array.isArray(challengeConfig)
    ) {
        return "Invalid Input";
    }

    const { challengeId, values, traversals, operations, treeProblems } = challengeConfig;

    if (
        typeof challengeId !== "string" ||
        challengeId.trim() === "" ||
        !Array.isArray(values) ||
        values.length === 0 ||
        !values.every(v => typeof v === "number")
    ) {
        return "Invalid Input";
    }

    if (
        !Array.isArray(traversals) ||
        !Array.isArray(operations) ||
        !Array.isArray(treeProblems)
    ) {
        return "Invalid Input";
    }

    // Validate every traversal string.

    const validTraversals = [
        "INORDER", "PREORDER", "POSTORDER",
        "LEVEL_ORDER", "ZIGZAG_ORDER", "RIGHT_SIDE_VIEW"
    ];

    for (const t of traversals) {
        if (!validTraversals.includes(t)) {
            return "Invalid Input";
        }
    }

    // Validate every operation.

    for (const op of operations) {

        if (
            typeof op !== "object" ||
            op === null ||
            Array.isArray(op) ||
            (op.type !== "INSERT" && op.type !== "DELETE" && op.type !== "SEARCH") ||
            typeof op.value !== "number"
        ) {
            return "Invalid Input";
        }
    }

    // Validate every tree problem.

    for (const tp of treeProblems) {

        if (
            typeof tp !== "object" ||
            tp === null ||
            Array.isArray(tp) ||
            (tp.type !== "DIAMETER" && tp.type !== "LOWEST_COMMON_ANCESTOR" && tp.type !== "FLATTEN")
        ) {
            return "Invalid Input";
        }
    }

    // --- STEP 2: BUILD BST ---

    let root = null;

    function insertValue(value) {
        const newNode = { value, left: null, right: null };

        if (root === null) {
            root = newNode;
            return { inserted: true, value, depth: 1 };
        }

        let current = root;
        let depth = 1;

        while (true) {
            if (value === current.value) {
                return { inserted: false, reason: "Duplicate value" };
            }

            depth++;

            if (value < current.value) {
                if (current.left === null) {
                    current.left = newNode;
                    return { inserted: true, value, depth };
                }
                current = current.left;
            } else {
                if (current.right === null) {
                    current.right = newNode;
                    return { inserted: true, value, depth };
                }
                current = current.right;
            }
        }
    }

    function deleteValue(value) {

        function del(node) {
            if (node === null) return [null, false];

            if (value < node.value) {
                const [newLeft, ok] = del(node.left);
                node.left = newLeft;
                return [node, ok];
            }

            if (value > node.value) {
                const [newRight, ok] = del(node.right);
                node.right = newRight;
                return [node, ok];
            }

            if (node.left === null && node.right === null) return [null, true];
            if (node.left === null) return [node.right, true];
            if (node.right === null) return [node.left, true];

            let successorParent = node;
            let successor = node.right;

            while (successor.left !== null) {
                successorParent = successor;
                successor = successor.left;
            }

            node.value = successor.value;

            if (successorParent === node) {
                node.right = successor.right;
            } else {
                successorParent.left = successor.right;
            }

            return [node, true];
        }

        const [newRoot, wasDeleted] = del(root);

        if (wasDeleted) {
            root = newRoot;
            return { deleted: true, value };
        }

        return { deleted: false, reason: "Value not found" };
    }

    // Build the initial tree from all values (duplicates ignored).

    for (const v of values) {
        insertValue(v);
    }

    const initialNodeCount = countNodes(root);

    // --- STEP 3: RUN TRAVERSALS (Problems 01 & 02 logic) ---

    const traversalResults = [];

    for (const t of traversals) {
        traversalResults.push(runTraversal(root, t));
    }

    // --- STEP 4: APPLY OPERATIONS (Problem 03 logic) ---

    const operationLog = [];

    for (const op of operations) {
        let result;

        if (op.type === "INSERT") {
            result = insertValue(op.value);
        } else if (op.type === "SEARCH") {
            result = searchValue(root, op.value);
        } else {
            result = deleteValue(op.value);
        }

        operationLog.push({ type: op.type, value: op.value, result });
    }

    // --- STEP 5: SOLVE TREE PROBLEMS (Problem 04 logic) ---

    const treeProblemResults = [];

    for (const tp of treeProblems) {
        let result;

        if (tp.type === "DIAMETER") {
            result = diameterOf(root);
        } else if (tp.type === "LOWEST_COMMON_ANCESTOR") {
            result = lowestCommonAncestor(root, tp.params);
        } else {
            result = flattenOrder(root);
        }

        treeProblemResults.push({ type: tp.type, result });
    }

    // --- STEP 6: SUMMARY ---

    const summary = {
        initialNodeCount,
        finalNodeCount: countNodes(root),
        treeHeight: heightOf(root),
        isBSTValid: isValidBST(root)
    };

    return {
        challengeId,
        traversalResults,
        operationLog,
        treeProblemResults,
        summary
    };
}

// --------------- TRAVERSAL HELPERS ---------------

function countNodes(node) {
    if (node === null) return 0;
    return 1 + countNodes(node.left) + countNodes(node.right);
}

function runTraversal(root, type) {

    if (type === "INORDER" || type === "PREORDER" || type === "POSTORDER") {

        const result = [];
        let calls = 0;

        function dfs(node) {
            if (node === null) return;
            calls++;
            if (type === "PREORDER") result.push(node.value);
            dfs(node.left);
            if (type === "INORDER") result.push(node.value);
            dfs(node.right);
            if (type === "POSTORDER") result.push(node.value);
        }

        dfs(root);

        return {
            traversalType: type,
            result,
            nodeCount: result.length,
            calls
        };
    }

    // BFS based traversals.

    const levels = [];
    const queue = [[root, 0]];

    while (queue.length > 0) {
        const [node, level] = queue.shift();

        if (levels[level] === undefined) {
            levels[level] = [];
        }

        levels[level].push(node.value);

        if (node.left !== null) queue.push([node.left, level + 1]);
        if (node.right !== null) queue.push([node.right, level + 1]);
    }

    let nodeCount = 0;
    for (const l of levels) nodeCount += l.length;

    if (type === "LEVEL_ORDER") {
        return { levels, totalLevels: levels.length, nodeCount };
    }

    if (type === "ZIGZAG_ORDER") {
        const zigzag = levels.map((l, i) => (i % 2 === 1 ? [...l].reverse() : l));
        return { levels: zigzag, totalLevels: levels.length, nodeCount };
    }

    const rightView = levels.map(l => l[l.length - 1]);
    return { rightView, totalLevels: levels.length };
}

// --------------- BST OPERATION HELPERS ---------------

function searchValue(root, value) {
    let current = root;
    let depth = 1;

    while (current !== null) {
        if (value === current.value) return { found: true, value, depth };
        depth++;
        current = value < current.value ? current.left : current.right;
    }

    return { found: false, value };
}

// --------------- TREE PROBLEM HELPERS ---------------

function diameterOf(root) {
    let diameter = 0;

    function height(node) {
        if (node === null) return 0;

        const leftHeight = height(node.left);
        const rightHeight = height(node.right);

        diameter = Math.max(diameter, leftHeight + rightHeight);

        return 1 + Math.max(leftHeight, rightHeight);
    }

    height(root);

    return { diameter, longestPath: diameter + 1 };
}

function lowestCommonAncestor(root, params) {

    if (
        typeof params !== "object" ||
        params === null ||
        Array.isArray(params) ||
        typeof params.p !== "number" ||
        typeof params.q !== "number"
    ) {
        return "Invalid Input";
    }

    const { p, q } = params;

    if (!containsValue(root, p) || !containsValue(root, q)) {
        return { error: "Node not found" };
    }

    let lcaValue = null;
    let lcaDepth = 0;

    function walk(node, depth) {
        if (node === null) return;

        if (p < node.value && q < node.value) {
            walk(node.left, depth + 1);
        } else if (p > node.value && q > node.value) {
            walk(node.right, depth + 1);
        } else {
            lcaValue = node.value;
            lcaDepth = depth;
        }
    }

    walk(root, 1);

    return {
        p,
        q,
        lca: lcaValue,
        depth: lcaDepth
    };
}

function flattenOrder(root) {
    const order = [];
    let prev = null;

    function flatten(node) {
        if (node === null) return;

        order.push(node.value);

        const left = node.left;
        const right = node.right;

        node.left = null;

        if (prev !== null) prev.right = node;
        prev = node;

        flatten(left);
        flatten(right);
    }

    flatten(root);

    return {
        flattenedOrder: order,
        nodeCount: order.length
    };
}

function containsValue(node, value) {
    if (node === null) return false;
    if (node.value === value) return true;
    return containsValue(node.left, value) || containsValue(node.right, value);
}

function heightOf(root) {
    if (root === null) return 0;
    return 1 + Math.max(heightOf(root.left), heightOf(root.right));
}

function isValidBST(root) {
    function validate(node, min, max) {
        if (node === null) return true;
        if (node.value <= min || node.value >= max) return false;
        return validate(node.left, min, node.value) && validate(node.right, node.value, max);
    }

    return validate(root, -Infinity, Infinity);
}


// ----------- EXAMPLE USAGE -----------

// --- Full challenge (matches readme sample) ---
console.log(runTreeChallenge({
    challengeId: "TREE-01",
    values: [5, 3, 7, 1, 4],
    traversals: ["INORDER", "LEVEL_ORDER"],
    operations: [
        { type: "INSERT", value: 6 },
        { type: "DELETE", value: 3 },
        { type: "SEARCH", value: 4 }
    ],
    treeProblems: [
        { type: "DIAMETER", params: null }
    ]
}));


// --- INVALID: empty values ---
console.log(runTreeChallenge({
    challengeId: "TREE-02",
    values: [],
    traversals: [],
    operations: [],
    treeProblems: []
}));


// --- INVALID: bad operation type ---
console.log(runTreeChallenge({
    challengeId: "TREE-03",
    values: [5],
    traversals: [],
    operations: [{ type: "UPDATE", value: 5 }],
    treeProblems: []
}));