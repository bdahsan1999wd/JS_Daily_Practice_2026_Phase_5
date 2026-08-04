// 🧩 PROBLEM–02: createDirectoryManager()

/* Logic: Simulates an in-memory directory management system.

Supports:

1. Create Directory
2. Remove Directory
3. List Directory Contents
4. Move File
5. Write File (auto-create parent directories)

*/

function createDirectoryManager() {

    // Store all directories.
    // Root directory always exists.

    const directories = new Set(["/"]);

    // Store all files.
    // Key   -> file path
    // Value -> file content

    const files = {};

    // -----------------------------------
    // Helper: Validate Path
    // -----------------------------------

    function isValidPath(path) {

        return (
            typeof path === "string" &&
            path.trim() !== "" &&
            path.startsWith("/")
        );

    }

    // -----------------------------------
    // Helper: Get Parent Directory
    // -----------------------------------

    function getParentDirectory(filePath) {

        const lastSlash = filePath.lastIndexOf("/");

        if (lastSlash === 0) {
            return "/";
        }

        return filePath.slice(0, lastSlash);

    }

    // -----------------------------------
    // Helper: Create Parent Directories
    // -----------------------------------

    function ensureDirectoryExists(dirPath) {

        if (directories.has(dirPath)) {
            return;
        }

        const parts = dirPath.split("/").filter(Boolean);

        let current = "";

        for (const part of parts) {

            current += "/" + part;

            directories.add(current);

        }

    }

    return {

        // -----------------------------------
        // Create Directory
        // -----------------------------------

        mkdir(dirPath) {

            // --- VALIDATION ---

            if (!isValidPath(dirPath)) {
                return "Invalid Input";
            }

            if (directories.has(dirPath)) {

                return {
                    dirPath,
                    created: false,
                    reason: "Already exists"
                };

            }

            ensureDirectoryExists(dirPath);

            return {
                dirPath,
                created: true
            };

        },

        // -----------------------------------
        // Remove Directory
        // -----------------------------------

        rmdir(dirPath, force) {

            // --- VALIDATION ---

            if (
                !isValidPath(dirPath) ||
                typeof force !== "boolean"
            ) {
                return "Invalid Input";
            }

            if (!directories.has(dirPath)) {

                return {
                    dirPath,
                    deleted: false,
                    reason: "Directory not found"
                };

            }

            // Root cannot be removed.

            if (dirPath === "/") {

                return {
                    dirPath,
                    deleted: false,
                    reason: "Directory not found"
                };

            }

            // Check whether directory contains
            // any files or subdirectories.

            const hasContents =
                [...directories].some(directory =>
                    directory !== dirPath &&
                    directory.startsWith(dirPath + "/")
                ) ||
                Object.keys(files).some(file =>
                    file.startsWith(dirPath + "/")
                );

            if (hasContents && !force) {

                return {
                    dirPath,
                    deleted: false,
                    reason: "Directory not empty"
                };

            }

            // Remove subdirectories.

            [...directories].forEach(directory => {

                if (
                    directory === dirPath ||
                    directory.startsWith(dirPath + "/")
                ) {
                    directories.delete(directory);
                }

            });

            // Remove files.

            Object.keys(files).forEach(file => {

                if (file.startsWith(dirPath + "/")) {
                    delete files[file];
                }

            });

            return {
                dirPath,
                deleted: true
            };

        },

        // -----------------------------------
        // List Directory Contents
        // -----------------------------------

        listDir(dirPath) {

            // --- VALIDATION ---

            if (!isValidPath(dirPath)) {
                return "Invalid Input";
            }

            if (!directories.has(dirPath)) {

                return {
                    dirPath,
                    error: "Directory not found"
                };

            }

            const contents = [];

            // Find child directories.

            for (const directory of directories) {

                if (directory === dirPath) {
                    continue;
                }

                if (
                    getParentDirectory(directory) === dirPath
                ) {

                    contents.push({
                        name: directory.split("/").pop(),
                        type: "dir"
                    });

                }

            }

            // Find files.

            for (const filePath of Object.keys(files)) {

                if (
                    getParentDirectory(filePath) === dirPath
                ) {

                    contents.push({
                        name: filePath.split("/").pop(),
                        type: "file"
                    });

                }

            }

            return {
                dirPath,
                contents
            };

        },

        // -----------------------------------
        // Move File
        // -----------------------------------

        moveFile(fromPath, toPath) {

            // --- VALIDATION ---

            if (
                !isValidPath(fromPath) ||
                !isValidPath(toPath)
            ) {
                return "Invalid Input";
            }

            if (!(fromPath in files)) {

                return {
                    error: "Source not found"
                };

            }

            // Auto-create destination directory.

            ensureDirectoryExists(
                getParentDirectory(toPath)
            );

            files[toPath] = files[fromPath];

            delete files[fromPath];

            return {
                fromPath,
                toPath,
                moved: true
            };

        },

        // -----------------------------------
        // Write File
        // -----------------------------------

        writeFile(filePath, content) {

            // --- VALIDATION ---

            if (
                !isValidPath(filePath) ||
                typeof content !== "string"
            ) {
                return "Invalid Input";
            }

            // Auto-create parent directory.

            ensureDirectoryExists(
                getParentDirectory(filePath)
            );

            files[filePath] = content;

            return {
                filePath,
                written: true,
                size: content.length
            };

        }

    };

}

// --- EXAMPLE USAGE ---
const dm = createDirectoryManager();

console.log(
    dm.mkdir("/docs")
);

console.log(
    dm.writeFile(
        "/docs/readme.txt",
        "Hello"
    )
);

console.log(
    dm.listDir("/docs")
);

console.log(
    dm.rmdir("/docs", false)
);

console.log(
    dm.rmdir("/docs", true)
);

console.log(
    dm.listDir("/docs")
);