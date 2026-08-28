// 🧩 PROBLEM–02: createLockManager()

// Logic: Shared/Exclusive lock manager with wait graph tracking.

//   SHARED + SHARED → compatible (multiple holders)
//   SHARED + EXCLUSIVE / EXCLUSIVE + anything → incompatible (blocked)
//   Blocked requests record a wait edge (waiter → holder) used by detectDeadlock()
//   to find cycles.


function createLockManager() {

    // --- INTERNAL STATE ---

    // locks: resourceId -> { lockType, heldBy: [txnIds], waitingBy: [txnIds] }
    // blockedBy: resourceId -> { waiterTxnId: holderTxnId }

    const locks = new Map();
    const blockedBy = new Map();

    // --- HELPERS ---

    function isCompatible(requestType, heldType) {
        return requestType === "SHARED" && heldType === "SHARED";
    }

    function getLock(resourceId) {

        if (!locks.has(resourceId)) {
            locks.set(resourceId, { lockType: null, heldBy: [], waitingBy: [] });
        }

        return locks.get(resourceId);
    }

    // --- PUBLIC API ---

    return {

        acquireLock(txnId, resourceId, lockType) {

            if (typeof txnId !== "string" || txnId.length === 0 ||
                typeof resourceId !== "string" || resourceId.length === 0 ||
                !["SHARED", "EXCLUSIVE"].includes(lockType)) {
                return "Invalid Input";
            }

            const lock = getLock(resourceId);

            // A transaction never blocks itself (re-acquire / upgrade).

            const incompatibleHolder = lock.heldBy.find(
                holder => holder !== txnId && !isCompatible(lockType, lock.lockType)
            );

            if (incompatibleHolder !== undefined) {

                if (!lock.waitingBy.includes(txnId)) lock.waitingBy.push(txnId);

                // Record the blocking holder for deadlock detection.

                if (!blockedBy.has(resourceId)) blockedBy.set(resourceId, {});
                blockedBy.get(resourceId)[txnId] = incompatibleHolder;

                return {
                    granted: false,
                    txnId,
                    resourceId,
                    lockType,
                    blockedBy: incompatibleHolder
                };
            }

            // Compatible → grant.

            if (!lock.heldBy.includes(txnId)) lock.heldBy.push(txnId);

            if (lock.lockType === null || lock.lockType === "SHARED") {
                lock.lockType = lockType;
            }

            const waitingIdx = lock.waitingBy.indexOf(txnId);
            if (waitingIdx !== -1) lock.waitingBy.splice(waitingIdx, 1);

            return { granted: true, txnId, resourceId, lockType };
        },

        releaseLock(txnId, resourceId) {

            if (typeof txnId !== "string" || txnId.length === 0 ||
                typeof resourceId !== "string" || resourceId.length === 0) {
                return "Invalid Input";
            }

            const lock = locks.get(resourceId);

            if (!lock) return { error: "Lock not found" };

            const idx = lock.heldBy.indexOf(txnId);

            if (idx === -1) return { error: "Lock not found" };

            lock.heldBy.splice(idx, 1);

            if (lock.heldBy.length === 0) {
                lock.lockType = null;
            } else if (lock.heldBy.every(h => lock.lockType !== "SHARED")) {
                // If only SHARED remain, keep SHARED; otherwise recalc.
            }

            // Clear recorded block for this txn on this resource.

            if (blockedBy.has(resourceId)) {
                delete blockedBy.get(resourceId)[txnId];
            }

            return { released: true, txnId, resourceId };
        },

        releaseAllLocks(txnId) {

            if (typeof txnId !== "string" || txnId.length === 0) return "Invalid Input";

            let count = 0;

            for (const [resourceId, lock] of locks) {

                const idx = lock.heldBy.indexOf(txnId);

                if (idx !== -1) {
                    lock.heldBy.splice(idx, 1);
                    count++;
                }

                const widx = lock.waitingBy.indexOf(txnId);
                if (widx !== -1) lock.waitingBy.splice(widx, 1);

                if (blockedBy.has(resourceId)) {
                    delete blockedBy.get(resourceId)[txnId];
                }

                if (lock.heldBy.length === 0) lock.lockType = null;
            }

            return { txnId, locksReleased: count };
        },

        isLocked(resourceId) {

            if (typeof resourceId !== "string" || resourceId.length === 0) return "Invalid Input";

            const lock = locks.get(resourceId);

            if (!lock || lock.heldBy.length === 0) {
                return { resourceId, locked: false, lockType: null, heldBy: [] };
            }

            return { resourceId, locked: true, lockType: lock.lockType, heldBy: [...lock.heldBy] };
        },

        detectDeadlock() {

            // Build wait-for graph: waiter → holder (the transaction that blocked it).

            const edges = new Map(); // txnId -> Set(holder txnIds)

            for (const [resourceId, waiters] of blockedBy) {

                for (const waiter of Object.keys(waiters)) {

                    const holder = waiters[waiter];

                    if (!edges.has(waiter)) edges.set(waiter, new Set());
                    edges.get(waiter).add(holder);
                }
            }

            // Detect cycles via DFS.

            const cycles = [];
            const allNodes = new Set([...edges.keys()]);

            for (const start of edges.keys()) {

                const path = [];
                const visited = new Set();

                function dfs(node) {

                    if (path.includes(node)) {

                        // Found cycle — record from first occurrence.

                        const startIdx = path.indexOf(node);
                        const cycle = path.slice(startIdx);
                        cycle.push(node);
                        cycles.push(cycle);
                        return;
                    }

                    if (visited.has(node)) return;

                    visited.add(node);
                    path.push(node);

                    const next = edges.get(node);

                    if (next) {
                        for (const n of next) dfs(n);
                    }

                    path.pop();
                }

                dfs(start);
            }

            // De-duplicate cycles (keep each unique ordered sequence once).

            const unique = [];
            const seenKeys = new Set();

            for (const cycle of cycles) {

                // Rotate so the smallest txnId is first, keeping the cyclic order.

                const nodes = cycle.slice(0, -1); // drop repeated last node
                const minVal = nodes.reduce((m, t) => t < m ? t : m, nodes[0]);
                const minIdx = nodes.indexOf(minVal);

                let rotated = nodes.slice(minIdx).concat(nodes.slice(0, minIdx));
                rotated.push(rotated[0]);

                const key = rotated.join("->");

                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    unique.push(rotated);
                }
            }

            const affectedTxns = [];

            for (const cycle of unique) {
                for (const t of cycle) {
                    if (!affectedTxns.includes(t)) affectedTxns.push(t);
                }
            }

            return {
                hasDeadlock: unique.length > 0,
                cycles: unique,
                affectedTxns
            };
        },

        getLockTable() {

            const table = [];

            for (const [resourceId, lock] of locks) {
                table.push({
                    resourceId,
                    lockType: lock.lockType,
                    heldBy: [...lock.heldBy],
                    waitingBy: [...lock.waitingBy]
                });
            }

            return table;
        }
    };
}


// ------ EXAMPLE USAGE ------

const lm = createLockManager();

console.log(lm.acquireLock("TXN-1", "resource-A", "SHARED"));

console.log(lm.acquireLock("TXN-2", "resource-A", "SHARED"));

console.log(lm.acquireLock("TXN-3", "resource-A", "EXCLUSIVE"));

console.log(lm.acquireLock("TXN-1", "resource-B", "EXCLUSIVE"));

console.log(lm.acquireLock("TXN-2", "resource-B", "EXCLUSIVE"));

console.log(lm.detectDeadlock());


// Create deadlock: TXN-1 tries to acquire resource-C held by TXN-3
console.log(lm.acquireLock("TXN-3", "resource-C", "EXCLUSIVE"));
console.log(lm.acquireLock("TXN-1", "resource-C", "EXCLUSIVE"));

console.log(lm.detectDeadlock());

console.log(lm.getLockTable());

console.log(lm.isLocked("resource-A"));


// --- INVALID ---
console.log(lm.acquireLock("", "", ""));