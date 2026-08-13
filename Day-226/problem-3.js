// 🧩 PROBLEM–03: solveTreeRecursion()

// Logic: Implements three recursive binary tree algorithms:
// 1. MAX_DEPTH — maximum depth (height) of the binary tree
// 2. PATH_SUM  — checks if any root-to-leaf path sums to target
// 3. INORDER   — inorder traversal (left → root → right)

// Each algorithm tracks the total number of recursive calls made.

function solveTreeRecursion(tree, problemType, params) {

    // --- STEP 1: VALIDATE problemType ---
    // Must be a non-empty string and one of the accepted values.

    if (
        typeof problemType !== "string" ||
        problemType.trim() === ""
    ) {
        return "Invalid Input";
    }

    if (
        problemType !== "MAX_DEPTH" &&
        problemType !== "PATH_SUM" &&
        problemType !== "INORDER"
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: VALIDATE tree ---
    // A valid tree node must be a non-null object with a numeric value
    // and left/right that are either null or valid tree nodes themselves.

    function isValidNode(node) {

        // null is a valid "empty" child — not an invalid tree.

        if (node === null) return true;

        // Must be a plain non-array object.

        if (
            typeof node !== "object" ||
            Array.isArray(node)
        ) {
            return false;
        }

        // Must have a numeric value property.

        if (typeof node.value !== "number") return false;

        // Must have left and right properties (null or another valid node).

        if (!("left" in node) || !("right" in node)) return false;

        // Recursively validate children.

        return isValidNode(node.left) && isValidNode(node.right);
    }

    // The root tree itself must be a valid non-null node.

    if (tree === null || !isValidNode(tree)) {
        return "Invalid Input";
    }

    // --- STEP 3: MAX DEPTH ---

    if (problemType === "MAX_DEPTH") {

        const counter = { calls: 0 };

        // Inner recursive function.
        // Returns the depth of the subtree rooted at node.

        function maxDepth(node) {

            // Count this function invocation.

            counter.calls++;

            // Base case: null node contributes 0 depth.
            // (This call is still counted because the function was invoked.)

            if (node === null) return 0;

            // Recursively find depth of left and right subtrees.
            // Add 1 for the current node itself.

            const leftDepth = maxDepth(node.left);
            const rightDepth = maxDepth(node.right);

            return 1 + Math.max(leftDepth, rightDepth);
        }

        const depth = maxDepth(tree);

        // --- MAX_DEPTH RESULT ---

        return {
            maxDepth: depth,
            calls: counter.calls
        };
    }

    // --- STEP 4: PATH SUM ---

    if (problemType === "PATH_SUM") {

        // params is required for PATH_SUM and must contain a numeric target.

        if (
            typeof params !== "object" ||
            params === null ||
            Array.isArray(params) ||
            typeof params.target !== "number"
        ) {
            return "Invalid Input";
        }

        const { target } = params;
        const counter = { calls: 0 };

        // Inner recursive function.
        // Checks whether any root-to-leaf path sums to `remaining`.
        // At each level, the current node's value is subtracted from remaining.
        // If we reach a LEAF node with remaining === 0, the path exists.

        function hasPath(node, remaining) {

            // Count this function invocation.

            counter.calls++;

            // Base case: null node — no path possible here.

            if (node === null) return false;

            // Subtract the current node's value from the remaining sum.

            const newRemaining = remaining - node.value;

            // Check if this is a leaf node (no children).
            // A leaf is reached only when both left and right are null.

            const isLeaf = node.left === null && node.right === null;

            // If we are at a leaf and remaining is exactly 0,
            // this path sums to the target.

            if (isLeaf) return newRemaining === 0;

            // Otherwise, continue searching in both subtrees.
            // If either subtree has a valid path, return true.

            return (
                hasPath(node.left, newRemaining) ||
                hasPath(node.right, newRemaining)
            );
        }

        const hasPathSum = hasPath(tree, target);

        // --- PATH_SUM RESULT ---

        return {
            target,
            hasPathSum,
            calls: counter.calls
        };
    }

    // --- STEP 5: INORDER TRAVERSAL ---

    if (problemType === "INORDER") {

        const counter = { calls: 0 };
        const traversal = [];

        // Inner recursive function.
        // Inorder = visit LEFT subtree first, then ROOT, then RIGHT subtree.
        // This produces values in ascending order for a binary search tree.

        function inorder(node) {

            // Count this function invocation.

            counter.calls++;

            // Base case: null node — nothing to visit.

            if (node === null) return;

            // 1. Traverse left subtree first.

            inorder(node.left);

            // 2. Visit current node (push its value to result).

            traversal.push(node.value);

            // 3. Traverse right subtree last.

            inorder(node.right);
        }

        inorder(tree);

        // --- INORDER RESULT ---

        return {
            traversal,
            calls: counter.calls
        };
    }
}


// ------ EXAMPLE USAGE ------

// --- MAX_DEPTH ---
console.log(solveTreeRecursion(
    {
        value: 3,
        left: { value: 9, left: null, right: null },
        right: {
            value: 20,
            left: { value: 15, left: null, right: null },
            right: { value: 7, left: null, right: null }
        }
    },
    "MAX_DEPTH"
));


// --- PATH_SUM ---
console.log(solveTreeRecursion(
    {
        value: 5,
        left: {
            value: 4,
            left: {
                value: 11,
                left: { value: 7, left: null, right: null },
                right: { value: 2, left: null, right: null }
            },
            right: null
        },
        right: {
            value: 8,
            left: { value: 13, left: null, right: null },
            right: {
                value: 4,
                left: null,
                right: { value: 1, left: null, right: null }
            }
        }
    },
    "PATH_SUM",
    { target: 22 }
));


// --- INORDER ---
console.log(solveTreeRecursion(
    {
        value: 4,
        left: {
            value: 2,
            left: { value: 1, left: null, right: null },
            right: { value: 3, left: null, right: null }
        },
        right: {
            value: 6,
            left: { value: 5, left: null, right: null },
            right: { value: 7, left: null, right: null }
        }
    },
    "INORDER"
));


// --- INVALID: missing target for PATH_SUM ---
console.log(solveTreeRecursion(
    { value: 1, left: null, right: null },
    "PATH_SUM"
));

// --- INVALID: bad tree node ---
console.log(solveTreeRecursion(
    { value: "abc", left: null, right: null },
    "INORDER"
));