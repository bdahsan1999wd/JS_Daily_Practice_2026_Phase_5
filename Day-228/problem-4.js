// 🧩 PROBLEM–04: solveTreeProblem()

// Logic: Solves three common tree problems:
// 1. LOWEST_COMMON_ANCESTOR — LCA of two nodes in a BST
// 2. DIAMETER               — longest path between any two nodes (edges)
// 3. FLATTEN                — flatten binary tree to a linked list (preorder)

function solveTreeProblem(tree, problemType, params) {

    // --- STEP 1: VALIDATE tree ---

    if (!isValidTreeNode(tree)) {
        return "Invalid Input";
    }

    // --- STEP 2: VALIDATE problemType ---

    if (
        typeof problemType !== "string" ||
        problemType.trim() === ""
    ) {
        return "Invalid Input";
    }

    if (
        problemType !== "LOWEST_COMMON_ANCESTOR" &&
        problemType !== "DIAMETER" &&
        problemType !== "FLATTEN"
    ) {
        return "Invalid Input";
    }

    // --- STEP 3: LOWEST COMMON ANCESTOR ---

    if (problemType === "LOWEST_COMMON_ANCESTOR") {

        // params must be an object with numeric p and q.

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

        // First ensure both values actually exist in the tree.

        if (!containsValue(tree, p) || !containsValue(tree, q)) {
            return { error: "Node not found" };
        }

        // --- BST LCA LOGIC ---

        function findLCA(node) {
            if (node === null) return null;

            if (p < node.value && q < node.value) {
                return findLCA(node.left);
            }

            if (p > node.value && q > node.value) {
                return findLCA(node.right);
            }

            return node;
        }

        const lcaNode = findLCA(tree);

        // depth of the LCA node (root = 1).

        const depth = depthOf(tree, lcaNode.value);

        return {
            p,
            q,
            lca: lcaNode.value,
            depth
        };
    }

    // --- STEP 4: DIAMETER ---

    if (problemType === "DIAMETER") {

        // params must be null (or undefined) for this type.

        if (params !== null && params !== undefined) {
            return "Invalid Input";
        }

        // --- RECURSIVE DFS ---
        //
        // height(node) = longest path in EDGES from node to a leaf.
        // diameter = maximum of (height(left) + height(right)) over all nodes.

        // longestPath = diameter + 1 → counts NODES on that path.

        let diameter = 0;

        function height(node) {

            if (node === null) return 0;

            const leftHeight = height(node.left);
            const rightHeight = height(node.right);

            // The path passing through this node connects its deepest
            // left descendant to its deepest right descendant.

            diameter = Math.max(diameter, leftHeight + rightHeight);

            return 1 + Math.max(leftHeight, rightHeight);
        }

        height(tree);

        return {
            diameter,
            longestPath: diameter + 1
        };
    }

    // --- STEP 5: FLATTEN ---

    if (problemType === "FLATTEN") {

        // params must be null (or undefined) for this type.

        if (params !== null && params !== undefined) {
            return "Invalid Input";
        }

        // --- FLATTEN IN-PLACE (preorder) ---
        //
        // Rearrange so each node's `right` points to the next preorder
        // node and every `left` becomes null. We walk the tree in
        // preorder using a `prev` pointer that links nodes together.
        //
        // flattenedOrder collects the preorder values.

        const flattenedOrder = [];
        let nodeCount = 0;
        let prev = null;

        function flatten(node) {

            if (node === null) return;

            nodeCount++;
            flattenedOrder.push(node.value);

            // Save children BEFORE rewiring pointers.

            const left = node.left;
            const right = node.right;

            // Detach left pointer.

            node.left = null;

            // Link previous flattened node to this node via `right`.

            if (prev !== null) {
                prev.right = node;
            }

            prev = node;

            flatten(left);
            flatten(right);
        }

        flatten(tree);

        return {
            flattenedOrder,
            nodeCount
        };
    }
}

// Reused from Problem-01: validates a binary tree node object.

function isValidTreeNode(node) {

    if (
        node === null ||
        typeof node !== "object" ||
        Array.isArray(node)
    ) {
        return false;
    }

    if (typeof node.value !== "number") {
        return false;
    }

    if (node.left !== null) {
        if (!isValidTreeNode(node.left)) return false;
    }

    if (node.right !== null) {
        if (!isValidTreeNode(node.right)) return false;
    }

    return true;
}

// Checks whether a value exists anywhere in the tree.

function containsValue(node, value) {

    if (node === null) return false;

    if (node.value === value) return true;

    return containsValue(node.left, value) || containsValue(node.right, value);
}

// Returns the depth (root = 1) of the first node found with the value.

function depthOf(node, value) {

    let current = node;
    let depth = 1;

    while (current !== null) {

        if (current.value === value) return depth;

        if (value < current.value) {
            current = current.left;
        } else {
            current = current.right;
        }

        depth++;
    }

    return null;
}


// ----------- EXAMPLE USAGE -----------

// --- LOWEST_COMMON_ANCESTOR sample BST ---
const lcaTree = {
    value: 6,
    left: {
        value: 2,
        left: { value: 0, left: null, right: null },
        right: {
            value: 4,
            left: { value: 3, left: null, right: null },
            right: { value: 5, left: null, right: null }
        }
    },
    right: {
        value: 8,
        left: { value: 7, left: null, right: null },
        right: { value: 9, left: null, right: null }
    }
};

console.log(solveTreeProblem(lcaTree, "LOWEST_COMMON_ANCESTOR", { p: 2, q: 8 }));

console.log(solveTreeProblem(lcaTree, "LOWEST_COMMON_ANCESTOR", { p: 2, q: 4 }));

// --- DIAMETER on the 1-2-3-4-5 tree ---
const diaTree = {
    value: 1,
    left: {
        value: 2,
        left: { value: 4, left: null, right: null },
        right: { value: 5, left: null, right: null }
    },
    right: { value: 3, left: null, right: null }
};

console.log(solveTreeProblem(diaTree, "DIAMETER", null));

// --- FLATTEN on the 1-2-3-4-5 tree ---
console.log(solveTreeProblem(diaTree, "FLATTEN", null));

// --- INVALID: missing node in LCA ---
console.log(solveTreeProblem(lcaTree, "LOWEST_COMMON_ANCESTOR", { p: 2, q: 99 }));

// --- INVALID: wrong problemType ---
console.log(solveTreeProblem(diaTree, "HEIGHT", null));