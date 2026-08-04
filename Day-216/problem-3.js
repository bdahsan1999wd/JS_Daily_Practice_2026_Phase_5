// 🧩 PROBLEM–03: createFileSearchEngine()

/* Logic: Creates a file search engine that

supports:

1. Search by file extension
2. Search by file size range
3. Search inside file content
4. Find recently modified files

*/

function createFileSearchEngine(fileSystem) {

    // --- STEP 1: VALIDATION ---
    // fileSystem must be a non-empty array of valid file objects.

    if (
        !Array.isArray(fileSystem) ||
        fileSystem.length === 0 ||
        !fileSystem.every(file =>
            typeof file === "object" &&
            file !== null &&
            typeof file.filePath === "string" &&
            file.filePath.startsWith("/") &&
            typeof file.content === "string" &&
            typeof file.sizeBytes === "number" &&
            file.sizeBytes >= 0 &&
            typeof file.extension === "string" &&
            typeof file.createdAt === "number" &&
            typeof file.modifiedAt === "number"
        )
    ) {
        return "Invalid Input";
    }

    // ------------------------------
    // Return the search engine object
    // ------------------------------

    return {

        // ============================================
        // Find files by extension
        // ============================================

        findByExtension(ext) {

            // Validate input.

            if (
                typeof ext !== "string" ||
                ext.trim() === ""
            ) {
                return "Invalid Input";
            }

            // Filter matching files.

            const results = fileSystem
                .filter(file => file.extension === ext)
                .map(file => file.filePath);

            return {
                results,
                count: results.length
            };

        },

        // ============================================
        // Find files within a size range
        // ============================================

        findBySize(minBytes, maxBytes) {

            // Validate input.
            // null means no lower/upper bound.

            if (
                (minBytes !== null &&
                    (typeof minBytes !== "number" || minBytes < 0)) ||
                (maxBytes !== null &&
                    (typeof maxBytes !== "number" || maxBytes < 0))
            ) {
                return "Invalid Input";
            }

            // Filter files based on size.

            const results = fileSystem
                .filter(file => {

                    const meetsMin =
                        minBytes === null ||
                        file.sizeBytes >= minBytes;

                    const meetsMax =
                        maxBytes === null ||
                        file.sizeBytes <= maxBytes;

                    return meetsMin && meetsMax;

                })
                .map(file => file.filePath);

            return {
                results,
                count: results.length
            };

        },

        // ============================================
        // Search inside file contents
        // ============================================

        searchContent(query, caseSensitive) {

            // Validate input.

            if (
                typeof query !== "string" ||
                typeof caseSensitive !== "boolean"
            ) {
                return "Invalid Input";
            }

            // Search content.

            const searchText = caseSensitive
                ? query
                : query.toLowerCase();

            const results = fileSystem
                .filter(file => {

                    const content = caseSensitive
                        ? file.content
                        : file.content.toLowerCase();

                    return content.includes(searchText);

                })
                .map(file => file.filePath);

            return {
                results,
                count: results.length
            };

        },

        // ============================================
        // Find recently modified files
        // ============================================

        findRecent(topN) {

            // Validate input.

            if (
                !Number.isInteger(topN) ||
                topN < 1
            ) {
                return "Invalid Input";
            }

            // Sort by modifiedAt (descending)
            // without modifying the original array.

            const results = [...fileSystem]
                .sort(
                    (a, b) =>
                        b.modifiedAt - a.modifiedAt
                )
                .slice(0, topN)
                .map(file => file.filePath);

            return {
                results,
                count: results.length
            };

        }

    };

}

// --- EXAMPLE USAGE ---
const engine = createFileSearchEngine([
    {
        filePath: "/src/index.js",
        content: "console.log('hello')",
        sizeBytes: 20,
        extension: "js",
        createdAt: 1000,
        modifiedAt: 5000
    },
    {
        filePath: "/docs/readme.txt",
        content: "Hello World",
        sizeBytes: 11,
        extension: "txt",
        createdAt: 2000,
        modifiedAt: 3000
    },
    {
        filePath: "/src/app.js",
        content: "const x = 1",
        sizeBytes: 12,
        extension: "js",
        createdAt: 3000,
        modifiedAt: 7000
    }
]);

console.log(engine.findByExtension("js"));
console.log(engine.findBySize(10, 15));
console.log(engine.searchContent("hello", false));
console.log(engine.findRecent(2));