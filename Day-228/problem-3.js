// 🧩 PROBLEM–03: createBST()

// Logic: Factory function that returns a Binary Search Tree object.
// BST property: left subtree values < node value < right subtree values.

// Methods:
//   insert(value)  → insert maintaining BST property
//   search(value)  → find if value exists
//   delete(value)  → remove a node (leaf / one child / two children cases)
//   toSortedArray()→ inorder traversal → ascending values
//   isValidBST()   → verify tree is a valid BST
//   getStats()     → { nodeCount, height, minValue, maxValue }

function createBST() {

    // Internal root node. A node is { value, left, right }.
    // depth of a node = number of nodes on the path from root to it (root=1).

    let root = null;

    // ---------- INSERT ----------
    // Walk down the tree following the BST ordering rule.
    // Inserting duplicate values is rejected.

    function insert(value) {

        if (typeof value !== "number") {
            return "Invalid Input";
        }

        // Empty tree → new node becomes root at depth 1.

        if (root === null) {
            root = { value, left: null, right: null };
            return { inserted: true, value, depth: 1 };
        }

        let current = root;
        let depth = 1;

        while (true) {

            // Duplicate → reject.

            if (value === current.value) {
                return { inserted: false, reason: "Duplicate value" };
            }

            depth++;

            if (value < current.value) {

                // Found the empty spot on the left.

                if (current.left === null) {
                    current.left = { value, left: null, right: null };
                    return { inserted: true, value, depth };
                }

                current = current.left;

            } else {

                // Found the empty spot on the right.

                if (current.right === null) {
                    current.right = { value, left: null, right: null };
                    return { inserted: true, value, depth };
                }

                current = current.right;
            }
        }
    }

    // ---------- SEARCH ----------

    function search(value) {

        if (typeof value !== "number") {
            return "Invalid Input";
        }

        let current = root;
        let depth = 1;

        while (current !== null) {

            if (value === current.value) {
                return { found: true, value, depth };
            }

            depth++;

            if (value < current.value) {
                current = current.left;
            } else {
                current = current.right;
            }
        }

        // Reached a null branch → value not present.

        return { found: false, value };
    }

    // ---------- DELETE ------------
    //
    // Case 1: leaf node        → just remove it
    // Case 2: one child        → replace node with its child
    // Case 3: two children     → replace node with its inorder successor
    //                            (smallest value in the right subtree)

    function deleteValue(value) {

        if (typeof value !== "number") {
            return "Invalid Input";
        }

        const deleted = deleteNode(root, value);

        // deleteNode returns [newRoot, wasDeleted].
        // top-level call keeps hold of a possibly new root.

        if (deleted[1]) {
            root = deleted[0];
            return { deleted: true, value };
        }

        return { deleted: false, reason: "Value not found" };
    }

    // Internal recursive deletion. Returns [node, wasDeleted].
    // `node` represents the replacement to be linked back to the parent.

    function deleteNode(node, value) {

        if (node === null) {
            return [null, false];
        }

        if (value < node.value) {

            const [newLeft, wasDeleted] = deleteNode(node.left, value);
            node.left = newLeft;
            return [node, wasDeleted];

        } else if (value > node.value) {

            const [newRight, wasDeleted] = deleteNode(node.right, value);
            node.right = newRight;
            return [node, wasDeleted];

        }

        // --- value === node.value → found the node to delete ---

        // Case 1: leaf → nothing to link back.

        if (node.left === null && node.right === null) {
            return [null, true];
        }

        // Case 2: one child → replace node with that child.

        if (node.left === null) {
            return [node.right, true];
        }

        if (node.right === null) {
            return [node.left, true];
        }

        // Case 3: two children → find inorder successor.
        // Successor = leftmost node of the right subtree
        // (smallest value greater than node.value).

        let successorParent = node;
        let successor = node.right;

        while (successor.left !== null) {
            successorParent = successor;
            successor = successor.left;
        }

        // Copy successor's value into the current node.

        node.value = successor.value;

        // Remove the successor node itself from its original position.
        // If successor was directly under node → node.right becomes its right.
        // Otherwise → successorParent.left becomes successor.right.

        if (successorParent === node) {
            node.right = successor.right;
        } else {
            successorParent.left = successor.right;
        }

        return [node, true];
    }

    // ---------- TO SORTED ARRAY (inorder) ----------

    function toSortedArray() {

        const result = [];

        function inOrder(node) {
            if (node === null) return;
            inOrder(node.left);
            result.push(node.value);
            inOrder(node.right);
        }

        inOrder(root);
        return result;
    }

    // ---------- IS VALID BST ----------
    // Verify that every node satisfies:
    //   left subtree values < node value < right subtree values
    // Use bounded recursion passing allowed (min, max) range.

    function isValidBST() {

        function validate(node, min, max) {

            if (node === null) return true;

            if (node.value <= min || node.value >= max) {
                return false;
            }

            return (
                validate(node.left, min, node.value) &&
                validate(node.right, node.value, max)
            );
        }

        return {
            isValid: validate(root, -Infinity, Infinity)
        };
    }

    // ---------- GET STATS ----------

    function getStats() {

        // nodeCount → total number of nodes (inorder walk).

        const values = toSortedArray();
        const nodeCount = values.length;

        if (nodeCount === 0) {
            return {
                nodeCount: 0,
                height: 0,
                minValue: null,
                maxValue: null
            };
        }

        // height → number of nodes on the longest root-to-leaf path.
        // minValue / maxValue → from the sorted array.

        function height(node) {
            if (node === null) return 0;
            return 1 + Math.max(height(node.left), height(node.right));
        }

        return {
            nodeCount,
            height: height(root),
            minValue: values[0],
            maxValue: values[values.length - 1]
        };
    }

    // Return the BST object.

    return {
        insert,
        search,
        delete: deleteValue,
        toSortedArray,
        isValidBST,
        getStats
    };
}


// ------ EXAMPLE USAGE ------

const bst = createBST();

// --- INSERT sequence from the readme ---
console.log(bst.insert(5));

console.log(bst.insert(3));

console.log(bst.insert(7));

console.log(bst.insert(1));

console.log(bst.insert(4));

console.log(bst.insert(5));


// --- SEARCH ---
console.log(bst.search(3));

console.log(bst.search(9));


// --- SORTED ARRAY ---
console.log(bst.toSortedArray());


// --- DELETE (two children → inorder successor) ---
console.log(bst.delete(3));

console.log(bst.toSortedArray());


// --- STATS + VALIDITY ---
console.log(bst.getStats());

console.log(bst.isValidBST());


// --- INVALID: non-number value ---
console.log(bst.insert("5"));


// --- DELETE missing value ---
console.log(bst.delete(100));