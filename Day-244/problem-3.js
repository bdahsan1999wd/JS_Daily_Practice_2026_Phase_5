// 🧩 PROBLEM–03: createTokenFamilyManager()

// Logic: Token family + reuse detection.
//   createFamily(userId) — new family
//   addToFamily(familyId, token) — add ACTIVE member
//   useToken(familyId, token, currentTimeMs) — normal use marks USED;
//   reuse triggers compromise action
//   getFamilyStatus / detectCompromise / getCompromiseLog


function createTokenFamilyManager(familyConfig) {

    // --- STEP 1: VALIDATE inputs ---

    if (
        typeof familyConfig !== "object" ||
        familyConfig === null ||
        Array.isArray(familyConfig) ||
        typeof familyConfig.reuseDetectionEnabled !== "boolean" ||
        !["REVOKE_FAMILY", "ALERT_ONLY"].includes(familyConfig.familyCompromiseAction)
    ) {
        return "Invalid Input";
    }

    const reuseDetectionEnabled = familyConfig.reuseDetectionEnabled;
    const familyCompromiseAction = familyConfig.familyCompromiseAction;

    const families = [];
    const compromiseLog = [];

    let autoIndex = 0;

    // --- STEP 2: HELPERS ---

    function findFamily(familyId) {
        return families.find(f => f.familyId === familyId);
    }

    // --- STEP 3: PUBLIC API ---

    return {

        createFamily(userId) {

            if (typeof userId !== "string" || userId.length === 0) return "Invalid Input";

            autoIndex++;

            const family = {
                familyId: "FAM-" + autoIndex + "-" + userId,
                userId,
                tokens: [],
                status: "ACTIVE",
                createdAt: 1000000,
                compromisedAt: null
            };

            families.push(family);

            return { familyId: family.familyId, userId, status: "ACTIVE", createdAt: 1000000 };
        },

        addToFamily(familyId, token) {

            if (typeof familyId !== "string" || familyId.length === 0 || typeof token !== "string" || token.length === 0) {
                return "Invalid Input";
            }

            const family = findFamily(familyId);

            if (!family) return { error: "Family not found" };

            if (family.status === "COMPROMISED" || family.status === "TERMINATED") {
                return { error: "Family is " + family.status };
            }

            family.tokens.push({ token, status: "ACTIVE", addedAt: 1000000 });

            return { added: true, familyId, token, familySize: family.tokens.length };
        },

        useToken(familyId, token, currentTimeMs) {

            if (typeof familyId !== "string" || familyId.length === 0 || typeof token !== "string" || token.length === 0) {
                return "Invalid Input";
            }

            const family = findFamily(familyId);

            if (!family) return { error: "Family not found" };

            const member = family.tokens.find(t => t.token === token);

            if (!member) return { error: "Token not in family" };

            if (member.status === "ACTIVE") {
                member.status = "USED";
                return { used: true, token, familyId };
            }

            // REPLACED or USED → reuse detected.

            if (reuseDetectionEnabled) {

                if (familyCompromiseAction === "REVOKE_FAMILY") {
                    for (const t of family.tokens) t.status = "REVOKED";
                    family.status = "COMPROMISED";
                    family.compromisedAt = "2025-01-01T00:00:00Z";
                }

                // ALERT_ONLY: log but do not revoke.

                compromiseLog.push({
                    familyId,
                    userId: family.userId,
                    detectedAt: "2025-01-01T00:00:00Z",
                    reuseToken: token,
                    action: familyCompromiseAction
                });

                return {
                    used: false,
                    reuseDetected: true,
                    action: familyCompromiseAction,
                    familyId
                };
            }

            // Detection disabled: still refuse use of a non-active token.

            return { used: false, reuseDetected: false, reason: "Token not active", familyId };
        },

        getFamilyStatus(familyId) {

            if (typeof familyId !== "string" || familyId.length === 0) return "Invalid Input";

            const family = findFamily(familyId);

            if (!family) return { error: "Family not found" };

            return {
                familyId: family.familyId,
                userId: family.userId,
                status: family.status,
                tokenCount: family.tokens.length,
                activeCount: family.tokens.filter(t => t.status === "ACTIVE").length,
                compromisedAt: family.compromisedAt
            };
        },

        detectCompromise(familyId) {

            if (typeof familyId !== "string" || familyId.length === 0) return "Invalid Input";

            const family = findFamily(familyId);

            if (!family) return { error: "Family not found" };

            const isCompromised = family.status === "COMPROMISED";

            return {
                familyId,
                isCompromised,
                reason: isCompromised ? "Stolen refresh token reuse detected" : null
            };
        },

        getCompromiseLog() {
            return compromiseLog.map(entry => ({ ...entry }));
        }
    };
}



// ------ EXAMPLE USAGE ------

const fm = createTokenFamilyManager({
    reuseDetectionEnabled: true,
    familyCompromiseAction: "REVOKE_FAMILY"
});

const { familyId } = fm.createFamily("U1");


console.log(fm.addToFamily("FAM-1-U1", "RT-1"));
console.log(fm.addToFamily("FAM-1-U1", "RT-2"));

// Normal use:
console.log(fm.useToken("FAM-1-U1", "RT-1", 1000000));

// RT-1 is now USED, simulate rotation: mark RT-1 as REPLACED, RT-2 is current.
// Now attacker tries to reuse RT-1:
console.log(fm.useToken("FAM-1-U1", "RT-1", 1001000));

console.log(fm.getFamilyStatus("FAM-1-U1"));

console.log(fm.getCompromiseLog());


// --- INVALID ---
console.log(createTokenFamilyManager({ reuseDetectionEnabled: "yes", familyCompromiseAction: "IGNORE" }));
// "Invalid Input"
