// 🧩 PROBLEM–01: fetchUserData()

// Logic: Simulates a user API request. If the user ID starts with "U", the Promise resolves with user data; otherwise it rejects.

function fetchUserData(userId) {

    // --- STEP 1: VALIDATION ---
    if (typeof userId !== "string" || userId.trim() === "") {
        return Promise.reject("Invalid Input");
    }

    // --- STEP 2: CREATE PROMISE ---
    return new Promise((resolve, reject) => {

        if (userId.startsWith("U")) {
            resolve({
                userId,
                name: "User_" + userId,
                status: "ACTIVE"
            });
        } else {
            reject("User not found: " + userId);
        }

    });

}

// --- EXAMPLE USAGE ---
fetchUserData("U123")
    .then(data => console.log(data))
    .catch(err => console.log(err));