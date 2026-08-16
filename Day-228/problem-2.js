// 🧩 PROBLEM–02: bfsTraversal()

// Logic: Implements three breadth-first tree traversals using a queue:
// 1. LEVEL_ORDER     — standard BFS, values grouped by level
// 2. ZIGZAG_ORDER    — BFS but alternating direction per level
// 3. RIGHT_SIDE_VIEW — the last node value at each level

function bfsTraversal(tree, problemType) {

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
        problemType !== "LEVEL_ORDER" &&
        problemType !== "ZIGZAG_ORDER" &&
        problemType !== "RIGHT_SIDE_VIEW"
    ) {
        return "Invalid Input";
    }

    // --- STEP 3: BREADTH-FIRST LEVEL COLLECTION ---
    //
    // Use a queue of [node, level] pairs.
    // Process nodes in FIFO order so all nodes of a level are
    // enqueued and processed before the next level begins.
    //
    // We collect `levels` as arrays of values per level.

    const levels = [];
    const queue = [[tree, 0]];

    while (queue.length > 0) {

        const [node, level] = queue.shift();

        // Initialize the bucket for this level if needed.

        if (levels[level] === undefined) {
            levels[level] = [];
        }

        levels[level].push(node.value);

        if (node.left !== null) {
            queue.push([node.left, level + 1]);
        }

        if (node.right !== null) {
            queue.push([node.right, level + 1]);
        }
    }

    // nodeCount = total number of visited nodes.

    let nodeCount = 0;

    for (const level of levels) {
        nodeCount += level.length;
    }

    // --- LEVEL ORDER ---

    if (problemType === "LEVEL_ORDER") {
        return {
            levels,
            totalLevels: levels.length,
            nodeCount
        };
    }

    // --- ZIGZAG ORDER ---
    // Reverse every odd-indexed level (level 1, 3, 5, ... go right→left).

    if (problemType === "ZIGZAG_ORDER") {

        const zigzag = levels.map((level, index) => {
            return index % 2 === 1 ? [...level].reverse() : level;
        });

        return {
            levels: zigzag,
            totalLevels: levels.length,
            nodeCount
        };
    }

    // --- RIGHT SIDE VIEW ---
    // The node "seen from the right" at each level is the last value of that level's bucket.

    const rightView = levels.map(level => level[level.length - 1]);

    return {
        rightView,
        totalLevels: levels.length
    };
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


// ------ EXAMPLE USAGE ------

const bfsTree = {
    value: 3,
    left: { value: 9, left: null, right: null },
    right: {
        value: 20,
        left: { value: 15, left: null, right: null },
        right: { value: 7, left: null, right: null }
    }
};

// --- LEVEL_ORDER ---
console.log(bfsTraversal(bfsTree, "LEVEL_ORDER"));


// --- ZIGZAG_ORDER ---
console.log(bfsTraversal(bfsTree, "ZIGZAG_ORDER"));


// --- RIGHT_SIDE_VIEW ---
console.log(bfsTraversal(bfsTree, "RIGHT_SIDE_VIEW"));


// --- INVALID: wrong problemType ---
console.log(bfsTraversal(bfsTree, "DFS"));


// --- INVALID: single-node tree edge case ---
console.log(bfsTraversal({ value: 1, left: null, right: null }, "LEVEL_ORDER"));