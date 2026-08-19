// 🧩 PROBLEM–03: createDTOMapper()

// Logic: Implements a DTO Mapper with named mapping rules. Supports dot-notation paths on both source (from) and target (to).

// Methods:
//   map(mappingName, sourceObject)      — apply a named mapping
//   mapList(mappingName, sourceObjects) — apply mapping to array
//   addMapping(mappingName, rules)      — add a mapping at runtime
//   listMappings()                      — all mapping names

function createDTOMapper(mapperConfig) {

    // --- STEP 1: VALIDATE mapperConfig ---

    if (
        typeof mapperConfig !== "object" ||
        mapperConfig === null ||
        Array.isArray(mapperConfig)
    ) {
        return "Invalid Input";
    }

    const { mapperId, mappings } = mapperConfig;

    if (
        typeof mapperId !== "string" || mapperId.trim() === "" ||
        !Array.isArray(mappings)
    ) {
        return "Invalid Input";
    }

    const mappingStore = {};

    for (const mapping of mappings) {
        if (
            typeof mapping !== "object" || mapping === null ||
            typeof mapping.mappingName !== "string" ||
            !Array.isArray(mapping.rules)
        ) {
            return "Invalid Input";
        }
        mappingStore[mapping.mappingName] = mapping.rules;
    }

    // --- STEP 2: PATH HELPERS ---

    // getPath("address.city") → source.address?.city

    function getPath(obj, path) {
        const parts = path.split(".");
        let current = obj;

        for (const part of parts) {
            if (current === null || current === undefined) return undefined;
            current = current[part];
        }

        return current;
    }

    // setPath("location.cityName", value) → creates nested objects.

    function setPath(target, path, value) {
        const parts = path.split(".");
        let current = target;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (typeof current[part] !== "object" || current[part] === null) {
                current[part] = {};
            }
            current = current[part];
        }

        current[parts[parts.length - 1]] = value;
    }

    // --- STEP 3: APPLY A MAPPING ---

    function applyMapping(rules, sourceObject) {

        if (typeof sourceObject !== "object" || sourceObject === null || Array.isArray(sourceObject)) {
            return "Invalid Input";
        }

        const result = {};

        for (const rule of rules) {

            const rawValue = getPath(sourceObject, rule.from);

            // Apply transform if provided.

            const value = typeof rule.transform === "function"
                ? rule.transform(rawValue)
                : rawValue;

            setPath(result, rule.to, value);
        }

        return result;
    }

    // --- STEP 4: MAPPER METHODS ---

    return {
        // map(mappingName, sourceObject): apply a named mapping.
        map(mappingName, sourceObject) {

            if (typeof mappingName !== "string") return "Invalid Input";

            const rules = mappingStore[mappingName];

            if (rules === undefined) {
                return { error: "Mapping not found: " + mappingName };
            }

            return applyMapping(rules, sourceObject);
        },

        // mapList(mappingName, sourceObjects): map an array.
        mapList(mappingName, sourceObjects) {

            if (typeof mappingName !== "string" || !Array.isArray(sourceObjects)) {
                return "Invalid Input";
            }

            const rules = mappingStore[mappingName];

            if (rules === undefined) {
                return { error: "Mapping not found: " + mappingName };
            }

            const results = sourceObjects.map(obj => applyMapping(rules, obj));

            return { mappingName, results, count: results.length };
        },

        // addMapping(mappingName, rules): add a new mapping.
        addMapping(mappingName, rules) {

            if (
                typeof mappingName !== "string" || mappingName.trim() === "" ||
                !Array.isArray(rules)
            ) {
                return "Invalid Input";
            }

            if (mappingStore[mappingName] !== undefined) {
                return { error: "Mapping already exists" };
            }

            mappingStore[mappingName] = rules;

            return { added: true, mappingName };
        },

        // listMappings(): array of mapping names.
        listMappings() {
            return Object.keys(mappingStore);
        }
    };
}


// ------ EXAMPLE USAGE ------

// --- Build a mapper ---
const mapper = createDTOMapper({
    mapperId: "UserMapper",
    mappings: [
        {
            mappingName: "entityToDTO",
            rules: [
                { from: "user_id", to: "id", transform: null },
                { from: "user_name", to: "name", transform: (v) => v.toUpperCase() },
                { from: "address.city", to: "location.cityName", transform: null },
                { from: "address.zip", to: "location.zipCode", transform: null }
            ]
        }
    ]
});


// --- map ---
console.log(mapper.map("entityToDTO", {
    user_id: "U1",
    user_name: "rahim",
    address: { city: "Dhaka", zip: "1200" }
}));


// --- mapList ---
console.log(mapper.mapList("entityToDTO", [
    { user_id: "U1", user_name: "rahim", address: { city: "Dhaka", zip: "1200" } },
    { user_id: "U2", user_name: "karim", address: { city: "Ctg", zip: "4000" } }
]));


// --- map: mapping not found ---
console.log(mapper.map("doesNotExist", {}));


// --- addMapping ---
console.log(mapper.addMapping("dtoToEntity", [
    { from: "id", to: "user_id", transform: null },
    { from: "name", to: "user_name", transform: (v) => v.toLowerCase() }
]));


// --- addMapping: duplicate ---
console.log(mapper.addMapping("dtoToEntity", []));


// --- listMappings ---
console.log(mapper.listMappings());


// --- INVALID: bad mapperConfig ---
console.log(createDTOMapper({ mapperId: "", mappings: [] }));