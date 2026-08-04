// 🧩 PROBLEM–01: createFileManager()

/* Logic: Simulates a basic in-memory file system.

Supports:

1. Write/Create File
2. Read File
3. Delete File
4. Check File Exists
5. List All Files

*/

function createFileManager() {

    // Internal file storage.
    // Key   -> file path
    // Value -> file content

    const fileStore = {};

    // Helper function:
    // Checks whether a file path is valid.

    function isValidFilePath(filePath) {

        return (
            typeof filePath === "string" &&
            filePath.trim() !== "" &&
            filePath.startsWith("/")
        );

    }

    return {

        // -----------------------------------
        // Write / Create File
        // -----------------------------------

        writeFile(filePath, content) {

            // --- VALIDATION ---

            if (
                !isValidFilePath(filePath) ||
                typeof content !== "string"
            ) {
                return "Invalid Input";
            }

            // Save or overwrite file.

            fileStore[filePath] = content;

            return {
                filePath,
                written: true,
                size: content.length
            };

        },

        // -----------------------------------
        // Read File
        // -----------------------------------

        readFile(filePath) {

            // --- VALIDATION ---

            if (!isValidFilePath(filePath)) {
                return "Invalid Input";
            }

            // Check whether file exists.

            if (!(filePath in fileStore)) {

                return {
                    filePath,
                    error: "File not found"
                };

            }

            return {
                filePath,
                content: fileStore[filePath],
                size: fileStore[filePath].length
            };

        },

        // -----------------------------------
        // Delete File
        // -----------------------------------

        deleteFile(filePath) {

            // --- VALIDATION ---

            if (!isValidFilePath(filePath)) {
                return "Invalid Input";
            }

            // File not found.

            if (!(filePath in fileStore)) {

                return {
                    filePath,
                    error: "File not found"
                };

            }

            // Remove file.

            delete fileStore[filePath];

            return {
                filePath,
                deleted: true
            };

        },

        // -----------------------------------
        // Check File Exists
        // -----------------------------------

        exists(filePath) {

            // --- VALIDATION ---

            if (!isValidFilePath(filePath)) {
                return "Invalid Input";
            }

            return {
                filePath,
                exists: filePath in fileStore
            };

        },

        // -----------------------------------
        // List All Files
        // -----------------------------------

        listFiles() {

            // Return all stored file paths.

            return Object.keys(fileStore);

        }

    };

}

// --- EXAMPLE USAGE ---
const fm = createFileManager();

console.log(
    fm.writeFile(
        "/docs/readme.txt",
        "Hello World"
    )
);

console.log(
    fm.readFile(
        "/docs/readme.txt"
    )
);

console.log(
    fm.exists(
        "/docs/readme.txt"
    )
);

console.log(
    fm.deleteFile(
        "/docs/readme.txt"
    )
);

console.log(
    fm.readFile(
        "/docs/readme.txt"
    )
);

console.log(
    fm.listFiles()
);