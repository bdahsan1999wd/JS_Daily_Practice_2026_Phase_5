// 🧩 PROBLEM–01: createInMemoryDB()

// Logic: Returns an in-memory DB object.
//   createCollection(name) — create a new collection
//   dropCollection(name)   — remove a collection and all its documents
//   listCollections()      — all collection names
//   getCollection(name)    — collection object with CRUD methods
//   getDBStats()           — stats about the entire DB

// Collection methods: insert (auto _id "col_index"), findById, findAll, update, delete, count.


function createInMemoryDB() {

    // --- STEP 1: INTERNAL STATE ---

    const collections = {}; // name -> { docs: [], autoIndex }

    // --- STEP 2: COLLECTION VIEW FACTORY (live view of a shared store) ---

    function createCollectionView(name, store) {

        return {
            insert(doc) {
                if (typeof doc !== "object" || doc === null || Array.isArray(doc)) return "Invalid Input";
                store.autoIndex++;
                const newDoc = { _id: name + "_" + store.autoIndex, ...doc };
                store.docs.push(newDoc);
                return { inserted: true, doc: { ...newDoc } };
            },
            findById(id) {
                if (typeof id !== "string") return "Invalid Input";
                const doc = store.docs.find(d => d._id === id);
                return doc ? { found: true, doc: { ...doc } } : { found: false, _id: id };
            },
            findAll() {
                return store.docs.map(d => ({ ...d }));
            },
            update(id, updates) {
                if (typeof id !== "string" || typeof updates !== "object" || updates === null || Array.isArray(updates)) return "Invalid Input";
                const idx = store.docs.findIndex(d => d._id === id);
                if (idx === -1) return { error: "Document not found" };
                store.docs[idx] = { ...store.docs[idx], ...updates };
                return { updated: true, doc: { ...store.docs[idx] } };
            },
            delete(id) {
                if (typeof id !== "string") return "Invalid Input";
                const idx = store.docs.findIndex(d => d._id === id);
                if (idx === -1) return { error: "Document not found" };
                store.docs.splice(idx, 1);
                return { deleted: true, _id: id };
            },
            count() {
                return store.docs.length;
            }
        };
    }

    // --- STEP 3: RETURN DB OBJECT ---

    return {

        createCollection(name) {

            if (typeof name !== "string" || name.trim() === "") return "Invalid Input";

            if (collections[name]) {
                return { created: false, reason: "Collection already exists: " + name };
            }

            collections[name] = { store: { docs: [], autoIndex: 0 } };

            return { created: true, name };
        },

        dropCollection(name) {

            if (typeof name !== "string" || name.trim() === "") return "Invalid Input";

            if (!collections[name]) return { error: "Collection not found: " + name };

            const documentsRemoved = collections[name].store.docs.length;

            delete collections[name];

            return { dropped: true, name, documentsRemoved };
        },

        listCollections() {

            return Object.keys(collections).map(name => ({
                name,
                documentCount: collections[name].store.docs.length
            }));
        },

        getCollection(name) {

            if (typeof name !== "string" || name.trim() === "") return "Invalid Input";

            if (!collections[name]) return { error: "Collection not found: " + name };

            // Live view of the shared store so CRUD mutates real data.

            return createCollectionView(name, collections[name].store);
        },

        getDBStats() {

            const collectionsStats = {};

            let totalDocuments = 0;

            for (const name of Object.keys(collections)) {
                const count = collections[name].store.docs.length;
                collectionsStats[name] = count;
                totalDocuments += count;
            }

            return { totalCollections: Object.keys(collections).length, totalDocuments, collections: collectionsStats };
        }
    };
}



// ------ EXAMPLE USAGE ------

const db = createInMemoryDB();

console.log(db.createCollection("users"));


console.log(db.createCollection("users"));


const users = db.getCollection("users");

console.log(users.insert({ name: "Rahim", age: 25 }));


console.log(users.insert({ name: "Karim", age: 30 }));


console.log(users.findById("users_1"));


console.log(users.update("users_1", { age: 26 }));


console.log(users.count());


console.log(db.getDBStats());


console.log(db.listCollections());


console.log(db.dropCollection("users"));


// --- INVALID ---
console.log(db.getCollection("missing"));