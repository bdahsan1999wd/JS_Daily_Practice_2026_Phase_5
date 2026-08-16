// 🧩 PROBLEM–01: dfsTraversal()

// Logic: Implements three depth-first traversal orders of a binary tree:
// 1. INORDER   → Left → Root → Right
// 2. PREORDER  → Root → Left → Right
// 3. POSTORDER → Left → Right → Root
// Each is implemented recursively. `calls` counts every recursive visit.

function dfsTraversal(tree, traversalType) {

    // --- STEP 1: VALIDATE tree ---
    // tree must be a binary tree node object with a numeric value
    // and left/right children that are null or node objects.

    if (!isValidTreeNode(tree)) {
        return "Invalid Input";
    }

    // --- STEP 2: VALIDATE traversalType ---

    if (
        typeof traversalType !== "string" ||
        traversalType.trim() === ""
    ) {
        return "Invalid Input";
    }

    if (
        traversalType !== "INORDER" &&
        traversalType !== "PREORDER" &&
        traversalType !== "POSTORDER"
    ) {
        return "Invalid Input";
    }

    // --- STEP 3: RECURSIVE TRAVERSAL ---
    //
    // Recursion pattern:
    //   PREORDER  → push root, visit left, visit right
    //   INORDER   → visit left, push root, visit right
    //   POSTORDER → visit left, visit right, push root
    //
    // Each call to `traverse` on a node represents one visit (calls++).

    const result = [];
    let calls = 0;

    function traverse(node) {

        // Every visited node counts as one recursive call.

        calls++;

        if (traversalType === "PREORDER") {
            result.push(node.value);
        }

        if (node.left !== null) {
            traverse(node.left);
        }

        if (traversalType === "INORDER") {
            result.push(node.value);
        }

        if (node.right !== null) {
            traverse(node.right);
        }

        if (traversalType === "POSTORDER") {
            result.push(node.value);
        }
    }

    traverse(tree);

    // --- DFS TRAVERSAL RESULT ---

    return {
        traversalType,
        result,
        nodeCount: result.length,
        calls
    };
}

// Validates that a value is a proper binary tree node object.
// Checks the root node and recursively validates its children.

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

    // left / right must be null or a valid node object.

    if (node.left !== null) {
        if (!isValidTreeNode(node.left)) return false;
    }

    if (node.right !== null) {
        if (!isValidTreeNode(node.right)) return false;
    }

    return true;
}


// ------ EXAMPLE USAGE ------

const dfsTree = {
    value: 1,
    left: {
        value: 2,
        left: { value: 4, left: null, right: null },
        right: { value: 5, left: null, right: null }
    },
    right: { value: 3, left: null, right: null }
};

// --- INORDER ---
console.log(dfsTraversal(dfsTree, "INORDER"));


// --- PREORDER ---
console.log(dfsTraversal(dfsTree, "PREORDER"));


// --- POSTORDER ---
console.log(dfsTraversal(dfsTree, "POSTORDER"));


// --- INVALID: wrong traversal type ---
console.log(dfsTraversal(dfsTree, "LEVEL_ORDER"));


// --- INVALID: not a tree node ---
console.log(dfsTraversal({ value: "a", left: null, right: null }, "INORDER"));