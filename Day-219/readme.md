# 🎓 JS DAILY PRACTICE – DAY-219

📅 **Goal:** Worker Pool Simulator (Node.js Core Concepts Simulation)
🎯 **Focus:** Worker Pool • Task Assignment • Load Balancing • Worker Health Monitoring • Pool Scaling

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 👷 Basic Worker Pool

⚠️ **Function Name:** `createWorkerPool()`

| Input      | `poolSize` (number)    |
| :--------- | :--------------------- |
| **Output** | object (worker pool)   |

**Rules:**

`poolSize` must be integer, 1–20

Return a worker pool object with these methods:

- `getWorkers()` — return all workers with their current status
- `assignTask(taskId)` — assign a task to the next available (IDLE) worker
- `completeTask(workerId)` — mark worker's task as done, set worker back to IDLE
- `getAvailableCount()` — return count of IDLE workers
- `getPoolStats()` — return pool statistics

**Worker Structure (auto-created on init):**

Each worker: `{ workerId: "W-" + N, status: "IDLE", currentTaskId: null, tasksCompleted: 0 }`
Workers are numbered 1 to `poolSize`.

**Operation Rules:**

- `assignTask(taskId)`:
  - `taskId` must be non-empty string
  - Find first IDLE worker (lowest workerId number)
  - If found → set `status: "BUSY"`, `currentTaskId: taskId`, return `{ workerId, taskId, assigned: true }`
  - If no IDLE workers → return `{ assigned: false, reason: "No workers available" }`

- `completeTask(workerId)`:
  - `workerId` must be non-empty string
  - If worker not found → `{ error: "Worker not found" }`
  - If worker is IDLE → `{ error: "Worker has no active task" }`
  - Else → set `status: "IDLE"`, `currentTaskId: null`, increment `tasksCompleted`, return `{ workerId, completed: true, tasksCompleted: updatedCount }`

- `getPoolStats()` → `{ poolSize, idleCount, busyCount, totalTasksCompleted }`

**Validation:** invalid `poolSize` → return `"Invalid Input"` from factory. Method-level invalid → return `"Invalid Input"`

| Challenge 📢 | Return the worker pool object maintaining internal worker state. |
| :----------- | :-------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const pool = createWorkerPool(3);

pool.getWorkers();
// → [
//   { workerId: "W-1", status: "IDLE", currentTaskId: null, tasksCompleted: 0 },
//   { workerId: "W-2", status: "IDLE", currentTaskId: null, tasksCompleted: 0 },
//   { workerId: "W-3", status: "IDLE", currentTaskId: null, tasksCompleted: 0 }
// ]

pool.assignTask("TASK-1");
// → { workerId: "W-1", taskId: "TASK-1", assigned: true }

pool.assignTask("TASK-2");
// → { workerId: "W-2", taskId: "TASK-2", assigned: true }

pool.completeTask("W-1");
// → { workerId: "W-1", completed: true, tasksCompleted: 1 }

pool.getPoolStats();
// → { poolSize: 3, idleCount: 2, busyCount: 1, totalTasksCompleted: 1 }
```

---

## 🧩 PROBLEM–02: ⚖️ Load Balancer

⚠️ **Function Name:** `createLoadBalancer()`

| Input      | `workers` (array of objects), `strategy` (string) |
| :--------- | :------------------------------------------------ |
| **Output** | object (load balancer)                            |

**Rules:**

`workers` — non-empty array, each:

- `workerId` (string, non-empty)
- `capacity` (number, integer, 1–100) — max concurrent tasks this worker can handle
- `currentLoad` (number, integer, ≥ 0) — current active tasks

`strategy` must be one of: `"ROUND_ROBIN"`, `"LEAST_LOADED"`, `"WEIGHTED"`

Return a load balancer object with:

- `getNextWorker()` — pick the next worker based on strategy
- `assignLoad(workerId, amount)` — increase a worker's `currentLoad` by `amount`
- `releaseLoad(workerId, amount)` — decrease a worker's `currentLoad` by `amount` (min 0)
- `getLoadReport()` — return all workers with their load percentages

**Strategy Rules:**

- `"ROUND_ROBIN"` → cycle through workers in order (skip workers at full capacity); track internal index
- `"LEAST_LOADED"` → pick worker with lowest `currentLoad / capacity` ratio (skip workers at full capacity)
- `"WEIGHTED"` → pick worker with highest remaining capacity (`capacity - currentLoad`); skip full workers
- All strategies: if ALL workers are at full capacity → return `{ error: "All workers at full capacity" }`

- `getNextWorker()` → returns `{ workerId, strategy, currentLoad, capacity }` or error
- `assignLoad(workerId, amount)`:
  - If `currentLoad + amount > capacity` → `{ error: "Exceeds worker capacity" }`
  - Else → update load, return `{ workerId, currentLoad: newLoad, capacity }`
- `releaseLoad(workerId, amount)` → update load (floor 0), return `{ workerId, currentLoad: newLoad }`
- `getLoadReport()` → array of `{ workerId, currentLoad, capacity, loadPercent: rounded to 1dp, status: "AVAILABLE" or "FULL" }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the load balancer object with all 4 methods. |
| :----------- | :-------------------------------------------------- |

**Sample Input & Output:**

```javascript
const lb = createLoadBalancer([
  { workerId: "W-1", capacity: 10, currentLoad: 3 },
  { workerId: "W-2", capacity: 10, currentLoad: 7 },
  { workerId: "W-3", capacity: 10, currentLoad: 1 }
], "LEAST_LOADED");

lb.getNextWorker();
// → { workerId: "W-3", strategy: "LEAST_LOADED", currentLoad: 1, capacity: 10 }

lb.assignLoad("W-3", 5);
// → { workerId: "W-3", currentLoad: 6, capacity: 10 }

lb.getLoadReport();
// → [
//   { workerId: "W-1", currentLoad: 3, capacity: 10, loadPercent: 30.0, status: "AVAILABLE" },
//   { workerId: "W-2", currentLoad: 5, capacity: 10, loadPercent: 50.0, status: "AVAILABLE" },
//   { workerId: "W-3", currentLoad: 6, capacity: 10, loadPercent: 60.0, status: "AVAILABLE" }
// ]
```

---

## 🧩 PROBLEM–03: 🏥 Worker Health Monitor

⚠️ **Function Name:** `createHealthMonitor()`

| Input      | `workers` (array of objects), `healthConfig` (object) |
| :--------- | :---------------------------------------------------- |
| **Output** | object (health monitor)                               |

**Rules:**

`workers` — non-empty array, each:

- `workerId` (string, non-empty)
- `status` (string: `"HEALTHY"`, `"DEGRADED"`, `"DOWN"`)
- `errorRate` (number, 0–1) — fraction of recent requests that errored
- `avgResponseTimeMs` (number, ≥ 0)
- `tasksCompleted` (number, ≥ 0)

`healthConfig` object:

- `errorRateThreshold` (number, 0–1) — above this → DEGRADED
- `criticalErrorRate` (number, 0–1) — above this → DOWN
- `responseTimeThresholdMs` (number, > 0) — above this → DEGRADED

Return a health monitor object with:

- `checkHealth(workerId)` — evaluate and update a single worker's health status
- `checkAllHealth()` — run health check on ALL workers
- `getHealthReport()` — return full health summary
- `restartWorker(workerId)` — reset a DOWN worker to HEALTHY with zeroed metrics

**Health Check Rules:**

- If `errorRate > criticalErrorRate` → status: `"DOWN"`
- Else if `errorRate > errorRateThreshold` OR `avgResponseTimeMs > responseTimeThresholdMs` → status: `"DEGRADED"`
- Else → status: `"HEALTHY"`

- `checkHealth(workerId)` → `{ workerId, oldStatus, newStatus, changed: boolean }`
- `checkAllHealth()` → `{ checked: count, statusChanges: [{ workerId, oldStatus, newStatus }] }`
- `getHealthReport()` → `{ healthyCount, degradedCount, downCount, workers: [full worker objects with updated status] }`
- `restartWorker(workerId)`:
  - If worker not found → `{ error: "Worker not found" }`
  - If not DOWN → `{ error: "Worker is not DOWN" }`
  - Reset: `status: "HEALTHY"`, `errorRate: 0`, `avgResponseTimeMs: 0`
  - Returns `{ workerId, restarted: true, status: "HEALTHY" }`

**Validation:** invalid inputs → return `"Invalid Input"`

| Challenge 📢 | Return the health monitor object with all 4 methods. |
| :----------- | :--------------------------------------------------- |

**Sample Input & Output:**

```javascript
const monitor = createHealthMonitor(
  [
    { workerId: "W-1", status: "HEALTHY", errorRate: 0.02, avgResponseTimeMs: 120, tasksCompleted: 500 },
    { workerId: "W-2", status: "HEALTHY", errorRate: 0.15, avgResponseTimeMs: 80, tasksCompleted: 300 },
    { workerId: "W-3", status: "HEALTHY", errorRate: 0.60, avgResponseTimeMs: 200, tasksCompleted: 100 }
  ],
  { errorRateThreshold: 0.10, criticalErrorRate: 0.50, responseTimeThresholdMs: 500 }
);

monitor.checkAllHealth();
// W-1: errorRate 0.02 ≤ 0.10, responseTime 120 ≤ 500 → HEALTHY (no change)
// W-2: errorRate 0.15 > 0.10 → DEGRADED (changed)
// W-3: errorRate 0.60 > 0.50 → DOWN (changed)
// → { checked: 3, statusChanges: [{ workerId: "W-2", oldStatus: "HEALTHY", newStatus: "DEGRADED" }, { workerId: "W-3", oldStatus: "HEALTHY", newStatus: "DOWN" }] }

monitor.getHealthReport();
// → { healthyCount: 1, degradedCount: 1, downCount: 1, workers: [...updated workers] }

monitor.restartWorker("W-3");
// → { workerId: "W-3", restarted: true, status: "HEALTHY" }
```

---

## 🧩 PROBLEM–04: 📈 Auto-Scaling Pool Manager

⚠️ **Function Name:** `createAutoScalingPool()`

| Input      | `scalingConfig` (object) |
| :--------- | :----------------------- |
| **Output** | object (scaling pool)    |

**Rules:**

`scalingConfig` object:

- `minWorkers` (number, integer, ≥ 1)
- `maxWorkers` (number, integer, > minWorkers)
- `scaleUpThreshold` (number, 0–1) — if `busyRatio > scaleUpThreshold` → add workers
- `scaleDownThreshold` (number, 0–1) — if `busyRatio < scaleDownThreshold` → remove workers
- `scaleStep` (number, integer, ≥ 1) — how many workers to add/remove per scaling event

Return an auto-scaling pool object with:

- `addTasks(taskIds)` — assign multiple tasks to available workers
- `completeTasks(workerIds)` — mark multiple workers as done
- `evaluateScaling()` — check current load and scale up/down if needed
- `getPoolState()` — return current pool state
- `getScalingHistory()` — return log of all scaling events

**Scaling Rules:**

- `busyRatio = busyWorkers / totalWorkers`
- `evaluateScaling()`:
  - If `busyRatio > scaleUpThreshold` AND `totalWorkers < maxWorkers`:
    - Add `Math.min(scaleStep, maxWorkers - totalWorkers)` new workers
    - Log: `{ event: "SCALE_UP", workersAdded: N, totalWorkers: newTotal, busyRatio }`
  - Else if `busyRatio < scaleDownThreshold` AND `totalWorkers > minWorkers`:
    - Remove `Math.min(scaleStep, totalWorkers - minWorkers)` IDLE workers (remove highest-numbered first)
    - Log: `{ event: "SCALE_DOWN", workersRemoved: N, totalWorkers: newTotal, busyRatio }`
  - Else → `{ event: "NO_CHANGE", totalWorkers, busyRatio }`
- Workers start with `minWorkers` count, numbered from W-1
- New workers added during scale-up continue numbering from where left off

- `addTasks(taskIds)` → assigns tasks to IDLE workers in order, returns `{ assigned: count, unassigned: count, unassignedTaskIds }`
- `completeTasks(workerIds)` → marks workers IDLE, returns `{ completed: count }`
- `getPoolState()` → `{ totalWorkers, idleCount, busyCount, busyRatio }`

**Validation:** invalid `scalingConfig` → return `"Invalid Input"` from factory

| Challenge 📢 | Return the auto-scaling pool object with all 4 methods. |
| :----------- | :------------------------------------------------------ |

**Sample Input & Output:**

```javascript
const pool = createAutoScalingPool({
  minWorkers: 2,
  maxWorkers: 6,
  scaleUpThreshold: 0.7,
  scaleDownThreshold: 0.3,
  scaleStep: 2
});

pool.getPoolState();
// → { totalWorkers: 2, idleCount: 2, busyCount: 0, busyRatio: 0 }

pool.addTasks(["T-1", "T-2", "T-3"]);
// → { assigned: 2, unassigned: 1, unassignedTaskIds: ["T-3"] }

pool.getPoolState();
// → { totalWorkers: 2, idleCount: 0, busyCount: 2, busyRatio: 1.0 }

pool.evaluateScaling();
// busyRatio 1.0 > 0.7 → SCALE UP by 2
// → { event: "SCALE_UP", workersAdded: 2, totalWorkers: 4, busyRatio: 1.0 }

pool.completeTasks(["W-1", "W-2"]);
// → { completed: 2 }

pool.evaluateScaling();
// busyRatio 0/4 = 0 < 0.3 → SCALE DOWN by 2 (but keep minWorkers=2)
// → { event: "SCALE_DOWN", workersRemoved: 2, totalWorkers: 2, busyRatio: 0 }

pool.getScalingHistory();
// → [
//   { event: "SCALE_UP", workersAdded: 2, totalWorkers: 4, busyRatio: 1.0 },
//   { event: "SCALE_DOWN", workersRemoved: 2, totalWorkers: 2, busyRatio: 0 }
// ]
```

---

## 🧩 PROBLEM–05: 🏗️ Full Worker Pool Orchestrator

⚠️ **Function Name:** `runWorkerPoolOrchestrator()`

| Input      | `poolConfig` (object) |
| :--------- | :-------------------- |
| **Output** | object                |

**Rules:**

`poolConfig` object:

- `poolId` (string, non-empty)
- `minWorkers` (number, integer, ≥ 1)
- `maxWorkers` (number, integer, > minWorkers)
- `scaleUpThreshold` (number, 0–1)
- `scaleDownThreshold` (number, 0–1)
- `scaleStep` (number, integer, ≥ 1)
- `healthConfig` (object: `{ errorRateThreshold, criticalErrorRate, responseTimeThresholdMs }`)
- `tasks` (array of objects):
  - `taskId` (string)
  - `payload` (object)
  - `shouldFail` (boolean)
- `workerMetrics` (array of objects — simulated health data per worker after processing):
  - `workerId` (string)
  - `errorRate` (number)
  - `avgResponseTimeMs` (number)

**Orchestration Rules (compose all previous concepts):**

1. **Initialize Pool** with `minWorkers` (Problem-01 logic)
2. **Assign Tasks** to workers (Problem-01 `assignTask` logic)
   - If pool is full → evaluate scaling (Problem-04 logic), then assign remaining tasks
3. **Process Tasks** — for each assigned worker:
   - `shouldFail: true` → task FAILED, worker back to IDLE
   - `shouldFail: false` → task COMPLETED, worker back to IDLE
4. **Health Check** — apply `workerMetrics` to workers, run health check (Problem-03 logic)
5. **Final Scaling Evaluation** — evaluate if pool should scale based on final state
6. **Build Report:**
   - `tasksAssigned` → count successfully assigned
   - `tasksCompleted` → count completed
   - `tasksFailed` → count failed
   - `scalingEvents` → array from scaling history
   - `healthSummary` → `{ healthyCount, degradedCount, downCount }`

**Validation:** invalid `poolConfig` or missing required fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ poolId, tasksAssigned, tasksCompleted, tasksFailed, scalingEvents, healthSummary }`. |
| :----------- | :--------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runWorkerPoolOrchestrator({
  poolId: "POOL-01",
  minWorkers: 2,
  maxWorkers: 6,
  scaleUpThreshold: 0.7,
  scaleDownThreshold: 0.2,
  scaleStep: 2,
  healthConfig: {
    errorRateThreshold: 0.10,
    criticalErrorRate: 0.50,
    responseTimeThresholdMs: 500
  },
  tasks: [
    { taskId: "T-1", payload: {}, shouldFail: false },
    { taskId: "T-2", payload: {}, shouldFail: false },
    { taskId: "T-3", payload: {}, shouldFail: true }
  ],
  workerMetrics: [
    { workerId: "W-1", errorRate: 0.05, avgResponseTimeMs: 100 },
    { workerId: "W-2", errorRate: 0.60, avgResponseTimeMs: 200 }
  ]
})` →

  `{
  poolId: "POOL-01",
  tasksAssigned: 3,
  tasksCompleted: 2,
  tasksFailed: 1,
  scalingEvents: [
    { event: "SCALE_UP", workersAdded: 2, totalWorkers: 4, busyRatio: 1.0 },
    { event: "SCALE_DOWN", workersRemoved: 2, totalWorkers: 2, busyRatio: 0 }
  ],
  healthSummary: { healthyCount: 1, degradedCount: 0, downCount: 1 }
}`

---