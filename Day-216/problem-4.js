// 🧩 PROBLEM–04: processFileBatch()

// Logic: Simulates a batch file processor. Processes each file operation sequentially while maintaining the updated file system state.

function processFileBatch(files, operations) {

    // --- STEP 1: VALIDATION ---
    // Files and operations must both be non-empty arrays
    // containing valid objects.

    if (
        !Array.isArray(files) ||
        files.length === 0 ||
        !Array.isArray(operations) ||
        operations.length === 0 ||
        !files.every(file =>
            typeof file === "object" &&
            file !== null &&
            typeof file.filePath === "string" &&
            typeof file.content === "string"
        ) ||
        !operations.every(operation =>
            typeof operation === "object" &&
            operation !== null &&
            typeof operation.type === "string" &&
            typeof operation.filePath === "string"
        )
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: CREATE INTERNAL FILE STORE ---
    // Store files in a Map for easy CRUD operations.

    const fileStore = new Map();

    for (const file of files) {
        fileStore.set(file.filePath, file.content);
    }

    // Store the result of every operation.

    const operationLog = [];

    // --- STEP 3: PROCESS OPERATIONS SEQUENTIALLY ---

    for (const operation of operations) {

        const {
            type,
            filePath,
            newContent,
            newPath
        } = operation;

        switch (type) {

            // ============================
            // READ FILE
            // ============================

            case "READ":

                if (fileStore.has(filePath)) {

                    operationLog.push({
                        filePath,
                        content: fileStore.get(filePath)
                    });

                } else {

                    operationLog.push({
                        filePath,
                        error: "File not found"
                    });

                }

                break;

            // ============================
            // WRITE FILE
            // ============================

            case "WRITE":

                if (typeof newContent !== "string") {
                    return "Invalid Input";
                }

                fileStore.set(filePath, newContent);

                operationLog.push({
                    filePath,
                    written: true
                });

                break;

            // ============================
            // DELETE FILE
            // ============================

            case "DELETE":

                if (fileStore.has(filePath)) {

                    fileStore.delete(filePath);

                    operationLog.push({
                        filePath,
                        deleted: true
                    });

                } else {

                    operationLog.push({
                        filePath,
                        error: "File not found"
                    });

                }

                break;

            // ============================
            // RENAME FILE
            // ============================

            case "RENAME":

                if (typeof newPath !== "string") {
                    return "Invalid Input";
                }

                if (!fileStore.has(filePath)) {

                    operationLog.push({
                        error: "File not found"
                    });

                    break;

                }

                fileStore.set(
                    newPath,
                    fileStore.get(filePath)
                );

                fileStore.delete(filePath);

                operationLog.push({
                    oldPath: filePath,
                    newPath,
                    renamed: true
                });

                break;

            // ============================
            // COPY FILE
            // ============================

            case "COPY":

                if (typeof newPath !== "string") {
                    return "Invalid Input";
                }

                if (!fileStore.has(filePath)) {

                    operationLog.push({
                        error: "File not found"
                    });

                    break;

                }

                fileStore.set(
                    newPath,
                    fileStore.get(filePath)
                );

                operationLog.push({
                    sourcePath: filePath,
                    newPath,
                    copied: true
                });

                break;

            // ============================
            // UNKNOWN OPERATION
            // ============================

            default:
                return "Invalid Input";

        }

    }

    // --- STEP 4: RETURN FINAL RESULT ---

    return {
        operationLog,
        finalFileList: [...fileStore.keys()]
    };

}

// --- EXAMPLE USAGE ---
console.log(
    processFileBatch(
        [
            {
                filePath: "/a.txt",
                content: "Alpha"
            },
            {
                filePath: "/b.txt",
                content: "Beta"
            }
        ],
        [
            {
                type: "READ",
                filePath: "/a.txt"
            },
            {
                type: "COPY",
                filePath: "/a.txt",
                newPath: "/a-backup.txt"
            },
            {
                type: "DELETE",
                filePath: "/b.txt"
            },
            {
                type: "RENAME",
                filePath: "/a-backup.txt",
                newPath: "/archive/a.txt"
            }
        ]
    )
);