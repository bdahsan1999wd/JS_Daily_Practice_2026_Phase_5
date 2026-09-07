// 🧩 PROBLEM–09: runAsyncSecurityEngine()

//  Logic: Async security task engine. Parallel processing via
//  Promise.allSettled, per-task retry (fail 2x then succeed on 3rd).


const __asyncReverse = (s) => String(s).split("").reverse().join("");

const __delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


function __executeTaskTask(task) {

    const type = task.type;
    const input = task.input;

    switch (type) {

        case "HASH_PASSWORD": {
            const password = String(input);
            return { hash: "hash_" + __asyncReverse(password) + "_" + password.length };
        }

        case "VERIFY_TOKEN": {
            return { valid: String(input).startsWith("jwt_") };
        }

        case "CHECK_BREACH": {
            const breachedList = ["password", "123456", "qwerty"];
            const breached = breachedList.map(p => p.toLowerCase()).includes(String(input).toLowerCase());
            return { breached, riskLevel: breached ? "CRITICAL" : "SAFE" };
        }

        case "SCAN_INPUT": {
            const value = String(input);
            const threatDetected = value.includes("<script>") || value.includes("' OR") || value.includes("../");
            return { threatDetected };
        }

        case "VALIDATE_API_KEY": {
            const value = String(input);
            return { valid: value.startsWith("key-") && value.length >= 10 };
        }

        default:
            return { valid: false };
    }
}


async function __runSingleTask(task) {

    const attemptLog = [];
    let attempts = 0;
    let finalResult = null;
    let status = "EXHAUSTED";

    for (let i = 1; i <= task.maxRetries; i++) {
        attempts++;
        const shouldFail = task.shouldFail === true && i <= 2;

        await __delay(1);

        if (shouldFail) {
            attemptLog.push({ attempt: i, outcome: "FAILED" });
            continue;
        }

        attemptLog.push({ attempt: i, outcome: "SUCCEEDED" });
        finalResult = __executeTaskTask(task);
        status = "COMPLETED";
        break;
    }

    return {
        taskId: task.taskId,
        type: task.type,
        status,
        result: status === "COMPLETED" ? finalResult : null,
        attempts,
        attemptLog
    };
}


async function runAsyncSecurityEngine(asyncConfig) {

    // --- STEP 1: VALIDATE ---

    if (
        typeof asyncConfig !== "object" ||
        asyncConfig === null ||
        Array.isArray(asyncConfig) ||
        !Array.isArray(asyncConfig.tasks)
    ) {
        return Promise.reject("Invalid Input");
    }

    for (const task of asyncConfig.tasks) {
        if (typeof task !== "object" || task === null || Array.isArray(task)) {
            return Promise.reject("Invalid Input");
        }
    }

    // --- STEP 2: PROCESS ALL TASKS IN PARALLEL ---

    const settled = await Promise.allSettled(asyncConfig.tasks.map(task => __runSingleTask(task)));

    const taskLog = settled.map(result =>
        result.status === "fulfilled" ? result.value : { taskId: null, type: null, status: "EXHAUSTED", result: null, attempts: 0, attemptLog: [] }
    );

    // --- STEP 3: SUMMARY ---

    const completedCount = taskLog.filter(t => t.status === "COMPLETED").length;

    return {
        taskLog,
        summary: {
            totalTasks: taskLog.length,
            completedCount,
            exhaustedCount: taskLog.length - completedCount
        }
    };
}



// ------ EXAMPLE USAGE ------
runAsyncSecurityEngine({
    tasks: [
        { taskId: "T1", type: "HASH_PASSWORD", input: "Secure123", maxRetries: 3, shouldFail: false },
        { taskId: "T2", type: "CHECK_BREACH", input: "password", maxRetries: 3, shouldFail: false },
        { taskId: "T3", type: "VERIFY_TOKEN", input: "jwt_U1_USER_3601000000", maxRetries: 3, shouldFail: true }
    ]
}).then(result => console.log(JSON.stringify(result, null, 2)));


// --- INVALID (rejected promise) ---
runAsyncSecurityEngine(null).catch(err => console.log(err));