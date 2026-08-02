// 🧩 PROBLEM–03: signWebhookPayload()

// Logic: Simulates webhook payload signing. Generates a signature based on the payload and a shared secret, then returns signature headers along with a verify() method.

function signWebhookPayload(payload, secret) {

    // --- STEP 1: VALIDATION ---
    // Payload must be a valid object and secret must be a non-empty string.

    if (
        typeof payload !== "object" ||
        payload === null ||
        Array.isArray(payload) ||
        typeof secret !== "string" ||
        secret.trim() === ""
    ) {
        return "Invalid Input";
    }

    // --- STEP 2: GENERATE SIGNATURE ---
    // Serialize the payload and calculate a simulated SHA-256 signature.

    const serializedPayload = JSON.stringify(payload);

    const signatureValue = [...(serializedPayload + secret)]
        .reduce(
            (sum, char) => sum + char.charCodeAt(0),
            0
        );

    const signature = `sha256=${signatureValue.toString(16)}`;

    const signedAt = "2025-01-01T00:00:00Z";

    // --- STEP 3: RETURN RESULT ---

    return {
        payload,
        signature,
        signedAt,
        headers: {
            "X-Webhook-Signature": signature,
            "X-Webhook-Timestamp": signedAt
        },
        verify(incomingSignature) {
            return incomingSignature === signature;
        }
    };

}

// --- EXAMPLE USAGE ---
const signedPayload = signWebhookPayload(
    {
        orderId: "O1",
        amount: 500
    },
    "my-secret"
);

console.log(signedPayload);

console.log(
    signedPayload.verify(
        signedPayload.signature
    )
);