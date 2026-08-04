// 🧩 PROBLEM–05: runFileSystemOrchestrator()

// Logic: Simulates a complete file system workflow.

// 1. Initialize the file system with initial files.
// 2. Process every operation sequentially.
// 3. Support CRUD + SEARCH operations.
// 4. Run a final search (if searchQuery exists).
// 5. Return execution summary.

function runFileSystemOrchestrator(fsConfig) {

    // --- STEP 1: VALIDATION ---
    // fsConfig must contain valid settings.

    if (
        typeof fsConfig !== "object" ||
        fsConfig === null ||
        Array.isArray(fsConfig)
    ) {
        return "Invalid Input";
    }

    const {
        fsId,
        initialFiles,
        operations,
        searchQuery
    } = fsConfig;

    if (
        typeof fsId !== "string" ||
        fsId.trim() === "" ||
        !Array.isArray(initialFiles) ||
        !Array.isArray(operations)
    ) {
        return "Invalid Input";
    }

    // Validate initial files.

    if (
        !initialFiles.every(file =>
            typeof file === "object" &&
            file !== null &&
            typeof file.filePath === "string" &&
            typeof file.content === "string"
        )
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: INITIALIZE FILE STORE ---
    // Store all files in memory.

    const fileStore = new Map();

    for (const file of initialFiles) {
        fileStore.set(file.filePath, file.content);
    }

    // Store operation results.

    const operationLog = [];

    let successCount = 0;
    let errorCount = 0;

    // --- STEP 3: PROCESS OPERATIONS ---

    for (const operation of operations) {

        if (
            typeof operation !== "object" ||
            operation === null ||
            typeof operation.type !== "string"
        ) {
            return "Invalid Input";
        }

        const {
            type,
            filePath,
            newContent,
            newPath,
            query,
            caseSensitive
        } = operation;

        let result;

        switch (type) {

            // ==========================
            // READ
            // ==========================

            case "READ":

                if (fileStore.has(filePath)) {

                    result = {
                        filePath,
                        content: fileStore.get(filePath)
                    };

                } else {

                    result = {
                        filePath,
                        error: "File not found"
                    };

                }

                break;

            // ==========================
            // WRITE
            // ==========================

            case "WRITE":

                if (typeof newContent !== "string") {
                    return "Invalid Input";
                }

                fileStore.set(filePath, newContent);

                result = {
                    filePath,
                    written: true
                };

                break;

            // ==========================
            // DELETE
            // ==========================

            case "DELETE":

                if (fileStore.has(filePath)) {

                    fileStore.delete(filePath);

                    result = {
                        filePath,
                        deleted: true
                    };

                } else {

                    result = {
                        filePath,
                        error: "File not found"
                    };

                }

                break;

            // ==========================
            // RENAME
            // ==========================

            case "RENAME":

                if (
                    typeof newPath !== "string"
                ) {
                    return "Invalid Input";
                }

                if (!fileStore.has(filePath)) {

                    result = {
                        error: "File not found"
                    };

                } else {

                    fileStore.set(
                        newPath,
                        fileStore.get(filePath)
                    );

                    fileStore.delete(filePath);

                    result = {
                        oldPath: filePath,
                        newPath,
                        renamed: true
                    };

                }

                break;

            // ==========================
            // COPY
            // ==========================

            case "COPY":

                if (
                    typeof newPath !== "string"
                ) {
                    return "Invalid Input";
                }

                if (!fileStore.has(filePath)) {

                    result = {
                        error: "File not found"
                    };

                } else {

                    fileStore.set(
                        newPath,
                        fileStore.get(filePath)
                    );

                    result = {
                        sourcePath: filePath,
                        newPath,
                        copied: true
                    };

                }

                break;

            // ==========================
            // SEARCH
            // ==========================

            case "SEARCH":

                if (
                    typeof query !== "string" ||
                    typeof caseSensitive !== "boolean"
                ) {
                    return "Invalid Input";
                }

                const matches = [];

                for (const [path, content] of fileStore) {

                    const source = caseSensitive
                        ? content
                        : content.toLowerCase();

                    const target = caseSensitive
                        ? query
                        : query.toLowerCase();

                    if (source.includes(target)) {
                        matches.push(path);
                    }

                }

                result = {
                    query,
                    matches,
                    count: matches.length
                };

                break;

            default:
                return "Invalid Input";

        }

        operationLog.push(result);

        if ("error" in result) {
            errorCount++;
        } else {
            successCount++;
        }

    }

    // --- STEP 4: FINAL SEARCH ---
    // Run one last search if searchQuery is provided.

    let searchResult = null;

    if (searchQuery !== null) {

        if (typeof searchQuery !== "string") {
            return "Invalid Input";
        }

        const matches = [];

        for (const [path, content] of fileStore) {

            if (
                content
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
            ) {
                matches.push(path);
            }

        }

        searchResult = {
            query: searchQuery,
            matches,
            count: matches.length
        };

    }

    // --- STEP 5: RETURN RESULT ---

    return {

        fsId,

        operationLog,

        summary: {

            totalOperations: operations.length,

            successCount,

            errorCount,

            finalFileCount: fileStore.size,

            searchResult

        }

    };

}

// --- EXAMPLE USAGE ---
console.log(

    runFileSystemOrchestrator({

        fsId: "FS-01",

        initialFiles: [
            {
                filePath: "/src/index.js",
                content: "console.log('app started')"
            },
            {
                filePath: "/docs/guide.txt",
                content: "Getting started guide"
            }
        ],

        operations: [
            {
                type: "WRITE",
                filePath: "/src/utils.js",
                newContent: "function helper() {}"
            },
            {
                type: "READ",
                filePath: "/docs/guide.txt"
            },
            {
                type: "DELETE",
                filePath: "/docs/missing.txt"
            },
            {
                type: "SEARCH",
                query: "console",
                caseSensitive: false
            }
        ],

        searchQuery: "guide"

    })

);