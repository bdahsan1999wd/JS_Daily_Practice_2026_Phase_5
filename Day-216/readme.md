# 🎓 JS DAILY PRACTICE – DAY-216

📅 **Goal:** File Operation Manager (Node.js Core Concepts Simulation)
🎯 **Focus:** File System Simulation • CRUD Operations • Path Resolution • Directory Management • File Metadata

---

## ⚠️ General Rules

- Solve every problem using a **function**.
- **Return** the result (❌ do not use `console.log` inside the function).
- Proper **input validation** is mandatory.
- If input is invalid → return `"Invalid Input"`.

---

## 🧩 PROBLEM–01: 📄 Basic File CRUD Manager

⚠️ **Function Name:** `createFileManager()`

| Input      | None (factory function) |
| :--------- | :---------------------- |
| **Output** | object (file manager)   |

**Rules:**

Return a file manager object with these methods:

- `writeFile(filePath, content)` — create or overwrite a file
- `readFile(filePath)` — read file content
- `deleteFile(filePath)` — remove a file
- `exists(filePath)` — check if file exists
- `listFiles()` — return all file paths in the store

**Validation Rules:**

- `filePath` must be non-empty string starting with `"/"`
- `content` must be a string (can be empty `""`)
- Invalid input → return `"Invalid Input"`

**Operation Rules:**

- `writeFile(filePath, content)` → stores file, returns `{ filePath, written: true, size: content.length }`
- `readFile(filePath)` → if exists: `{ filePath, content, size: content.length }` | if not: `{ filePath, error: "File not found" }`
- `deleteFile(filePath)` → if exists: `{ filePath, deleted: true }` | if not: `{ filePath, error: "File not found" }`
- `exists(filePath)` → returns `{ filePath, exists: true/false }`
- `listFiles()` → returns array of all stored `filePath` strings (empty array if none)

| Challenge 📢 | Return the file manager object. Each method maintains internal state (in-memory file store). |
| :----------- | :------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const fm = createFileManager();

fm.writeFile("/docs/readme.txt", "Hello World");
// → { filePath: "/docs/readme.txt", written: true, size: 11 }

fm.readFile("/docs/readme.txt");
// → { filePath: "/docs/readme.txt", content: "Hello World", size: 11 }

fm.exists("/docs/readme.txt");
// → { filePath: "/docs/readme.txt", exists: true }

fm.deleteFile("/docs/readme.txt");
// → { filePath: "/docs/readme.txt", deleted: true }

fm.readFile("/docs/readme.txt");
// → { filePath: "/docs/readme.txt", error: "File not found" }

fm.listFiles();
// → []
```

---

## 🧩 PROBLEM–02: 🗂️ Directory Manager

⚠️ **Function Name:** `createDirectoryManager()`

| Input      | None (factory function)    |
| :--------- | :------------------------- |
| **Output** | object (directory manager) |

**Rules:**

Return a directory manager object with:

- `mkdir(dirPath)` — create a directory
- `rmdir(dirPath, force)` — remove directory; `force: true` removes even if not empty
- `listDir(dirPath)` — list contents of a directory
- `moveFile(fromPath, toPath)` — move a file from one path to another
- `writeFile(filePath, content)` — write a file (auto-creates parent directory if needed)

**Path Rules:**

- `dirPath` and `filePath` must be non-empty strings starting with `"/"`
- A file's parent directory is everything before the last `"/"` segment
  - e.g. `"/docs/reports/summary.txt"` → parent dir is `"/docs/reports"`
- Root `"/"` always exists implicitly

**Operation Rules:**

- `mkdir(dirPath)` → if already exists: `{ dirPath, created: false, reason: "Already exists" }` | else: `{ dirPath, created: true }`
- `rmdir(dirPath, force)`:
  - Check if directory has any files/subdirs inside
  - If not empty AND `force: false` → `{ dirPath, deleted: false, reason: "Directory not empty" }`
  - If `force: true` OR empty → delete dir and all contents, `{ dirPath, deleted: true }`
  - If dir not found → `{ dirPath, deleted: false, reason: "Directory not found" }`
- `listDir(dirPath)` → returns `{ dirPath, contents: [{ name, type: "file" or "dir" }] }` | if not found: `{ dirPath, error: "Directory not found" }`
- `moveFile(fromPath, toPath)` → if source not found: `{ error: "Source not found" }` | else: move file, `{ fromPath, toPath, moved: true }`
- `writeFile(filePath, content)` → auto-create parent dir if missing, write file, return `{ filePath, written: true, size: content.length }`

**Validation:** invalid paths → return `"Invalid Input"`

| Challenge 📢 | Return the directory manager object maintaining full in-memory file system state. |
| :----------- | :-------------------------------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const dm = createDirectoryManager();

dm.mkdir("/docs");
// → { dirPath: "/docs", created: true }

dm.writeFile("/docs/readme.txt", "Hello");
// → { filePath: "/docs/readme.txt", written: true, size: 5 }

dm.listDir("/docs");
// → { dirPath: "/docs", contents: [{ name: "readme.txt", type: "file" }] }

dm.rmdir("/docs", false);
// → { dirPath: "/docs", deleted: false, reason: "Directory not empty" }

dm.rmdir("/docs", true);
// → { dirPath: "/docs", deleted: true }

dm.listDir("/docs");
// → { dirPath: "/docs", error: "Directory not found" }
```

---

## 🧩 PROBLEM–03: 🔍 File Search & Filter Engine

⚠️ **Function Name:** `createFileSearchEngine()`

| Input      | `fileSystem` (array of objects) |
| :--------- | :------------------------------ |
| **Output** | object (search engine)          |

**Rules:**

`fileSystem` — non-empty array of file objects, each:

- `filePath` (string, starts with `"/"`)
- `content` (string)
- `sizeBytes` (number, ≥ 0)
- `extension` (string, e.g. `"txt"`, `"js"`, `"json"`)
- `createdAt` (number) — Unix timestamp (ms)
- `modifiedAt` (number) — Unix timestamp (ms)

Return a search engine object with:

- `findByExtension(ext)` — return all files with matching extension
- `findBySize(minBytes, maxBytes)` — return files where `sizeBytes` is within range (inclusive); `null` means no bound
- `searchContent(query, caseSensitive)` — return files where `content` contains `query`
- `findRecent(topN)` — return top N files sorted by `modifiedAt` descending

**Each search method returns:** `{ results: [filePaths], count }` (just the filePaths, not full objects)

**Validation:** `fileSystem` must be non-empty array. Method-level invalid input → return `"Invalid Input"`

| Challenge 📢 | Return the search engine object with all 4 search methods. |
| :----------- | :--------------------------------------------------------- |

**Sample Input & Output:**

```javascript
const engine = createFileSearchEngine([
  {
    filePath: "/src/index.js",
    content: "console.log('hello')",
    sizeBytes: 20,
    extension: "js",
    createdAt: 1000,
    modifiedAt: 5000,
  },
  {
    filePath: "/docs/readme.txt",
    content: "Hello World",
    sizeBytes: 11,
    extension: "txt",
    createdAt: 2000,
    modifiedAt: 3000,
  },
  {
    filePath: "/src/app.js",
    content: "const x = 1",
    sizeBytes: 12,
    extension: "js",
    createdAt: 3000,
    modifiedAt: 7000,
  },
]);

engine.findByExtension("js");
// → { results: ["/src/index.js", "/src/app.js"], count: 2 }

engine.findBySize(10, 15);
// → { results: ["/docs/readme.txt", "/src/app.js"], count: 2 }

engine.searchContent("hello", false);
// → { results: ["/src/index.js", "/docs/readme.txt"], count: 2 }

engine.findRecent(2);
// → { results: ["/src/app.js", "/src/index.js"], count: 2 }
```

---

## 🧩 PROBLEM–04: 📦 File Batch Processor

⚠️ **Function Name:** `processFileBatch()`

| Input      | `files` (array of objects), `operations` (array of objects) |
| :--------- | :---------------------------------------------------------- |
| **Output** | object                                                      |

**Rules:**

`files` — non-empty array, each:

- `filePath` (string)
- `content` (string)

`operations` — non-empty array, each:

- `type` (string: `"READ"`, `"WRITE"`, `"DELETE"`, `"RENAME"`, `"COPY"`)
- `filePath` (string) — target file
- `newContent` (string, for WRITE)
- `newPath` (string, for RENAME and COPY)

**Operation Rules (apply sequentially, state carries over):**

- **READ** → `{ filePath, content }` or `{ filePath, error: "File not found" }`
- **WRITE** → update/create file with `newContent`, return `{ filePath, written: true }`
- **DELETE** → remove file, return `{ filePath, deleted: true }` or `{ filePath, error: "File not found" }`
- **RENAME** → rename `filePath` to `newPath`, return `{ oldPath: filePath, newPath, renamed: true }` or `{ error: "File not found" }`
- **COPY** → duplicate file to `newPath`, return `{ sourcePath: filePath, newPath, copied: true }` or `{ error: "File not found" }`

| Challenge 📢 | Return `{ operationLog, finalFileList }` where `operationLog` is array of each operation's result and `finalFileList` is array of all file paths remaining after all operations. If invalid → return `"Invalid Input"` |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `processFileBatch(
  [
    { filePath: "/a.txt", content: "Alpha" },
    { filePath: "/b.txt", content: "Beta" }
  ],
  [
    { type: "READ", filePath: "/a.txt" },
    { type: "COPY", filePath: "/a.txt", newPath: "/a-backup.txt" },
    { type: "DELETE", filePath: "/b.txt" },
    { type: "RENAME", filePath: "/a-backup.txt", newPath: "/archive/a.txt" }
  ]
)` →

  `{
  operationLog: [
    { filePath: "/a.txt", content: "Alpha" },
    { sourcePath: "/a.txt", newPath: "/a-backup.txt", copied: true },
    { filePath: "/b.txt", deleted: true },
    { oldPath: "/a-backup.txt", newPath: "/archive/a.txt", renamed: true }
  ],
  finalFileList: ["/a.txt", "/archive/a.txt"]
}`

---

## 🧩 PROBLEM–05: 🏗️ Full File System Orchestrator

⚠️ **Function Name:** `runFileSystemOrchestrator()`

| Input      | `fsConfig` (object) |
| :--------- | :------------------ |
| **Output** | object              |

**Rules:**

`fsConfig` object:

- `fsId` (string, non-empty)
- `initialFiles` (array of `{ filePath, content }`) — files to pre-load
- `operations` (array of objects, each has `type` and relevant fields — same as Problem-04 plus `"SEARCH"`)
- `searchQuery` (string or null) — if provided, run a content search at the end

**Extended Operation Type:**

- `"SEARCH"` → `{ type: "SEARCH", query (string), caseSensitive (boolean) }` — search content across all current files, return `{ query, matches: [filePaths], count }`

**Orchestration Rules (compose Problems 01, 03, 04):**

1. **Initialize** file store with `initialFiles`
2. **Process operations** sequentially (Problem-04 logic + SEARCH support)
3. **Final Search** — if `searchQuery` is non-null, search content across remaining files (case-insensitive)
4. **Build summary:**
   - `totalOperations` → count of operations
   - `successCount` → operations without `error`
   - `errorCount` → operations with `error`
   - `finalFileCount` → number of files remaining
   - `searchResult` → result of final search (or `null` if `searchQuery` is null)

**Validation:** invalid `fsConfig` or missing required fields → return `"Invalid Input"`

| Challenge 📢 | Return `{ fsId, operationLog, summary }` where `summary` includes `totalOperations`, `successCount`, `errorCount`, `finalFileCount`, `searchResult`. |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |

**Sample Input & Output:**

- `runFileSystemOrchestrator({
  fsId: "FS-01",
  initialFiles: [
    { filePath: "/src/index.js", content: "console.log('app started')" },
    { filePath: "/docs/guide.txt", content: "Getting started guide" }
  ],
  operations: [
    { type: "WRITE", filePath: "/src/utils.js", newContent: "function helper() {}" },
    { type: "READ", filePath: "/docs/guide.txt" },
    { type: "DELETE", filePath: "/docs/missing.txt" },
    { type: "SEARCH", query: "console", caseSensitive: false }
  ],
  searchQuery: "guide"
})` →

  `{
  fsId: "FS-01",
  operationLog: [
    { filePath: "/src/utils.js", written: true },
    { filePath: "/docs/guide.txt", content: "Getting started guide" },
    { filePath: "/docs/missing.txt", error: "File not found" },
    { query: "console", matches: ["/src/index.js"], count: 1 }
  ],
  summary: {
    totalOperations: 4,
    successCount: 3,
    errorCount: 1,
    finalFileCount: 3,
    searchResult: { query: "guide", matches: ["/docs/guide.txt"], count: 1 }
  }
}`

---
