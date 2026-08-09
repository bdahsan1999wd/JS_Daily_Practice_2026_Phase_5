// 🧩 PROBLEM–03: createStateMachine()

// Logic: Simulates an event-driven state machine.

// Supports:

// 1. Dispatch an event and trigger state transition
// 2. Get current state
// 3. View transition history
// 4. Check whether an event can trigger a transition
// 5. Reset machine to initial state


function createStateMachine(machineConfig) {

    // --- STEP 1: VALIDATION ---
    // machineConfig must be a valid object.

    if (
        typeof machineConfig !== "object" ||
        machineConfig === null ||
        Array.isArray(machineConfig)
    ) {
        return "Invalid Input";
    }

    const {
        machineId,
        initialState,
        transitions
    } = machineConfig;

    // Validate machine configuration.

    if (
        typeof machineId !== "string" ||
        machineId.trim() === "" ||
        typeof initialState !== "string" ||
        initialState.trim() === "" ||
        !Array.isArray(transitions)
    ) {
        return "Invalid Input";
    }

    // Validate every transition.

    const isValidTransitions = transitions.every(transition =>
        typeof transition === "object" &&
        transition !== null &&
        !Array.isArray(transition) &&
        typeof transition.from === "string" &&
        transition.from.trim() !== "" &&
        typeof transition.event === "string" &&
        transition.event.trim() !== "" &&
        typeof transition.to === "string" &&
        transition.to.trim() !== "" &&
        typeof transition.action === "string" &&
        transition.action.trim() !== ""
    );

    if (!isValidTransitions) {
        return "Invalid Input";
    }

    // --- STEP 2: INTERNAL STATE ---

    // Current state starts from initialState.

    let currentState = initialState;

    // Stores every successful transition.

    const history = [];

    // Fixed timestamp for simulation.

    const timestamp = "2025-01-01T00:00:00Z";


    // --- STEP 3: RETURN STATE MACHINE OBJECT ---

    return {

        // -----------------------------
        // Dispatch an event
        // -----------------------------
        dispatch(event) {

            // Validate event.

            if (
                typeof event !== "string" ||
                event.trim() === ""
            ) {
                return "Invalid Input";
            }

            // Find a valid transition from current state.

            const transition = transitions.find(item =>
                item.from === currentState &&
                item.event === event
            );

            // No valid transition found.

            if (!transition) {

                return {
                    dispatched: false,
                    reason:
                        `No valid transition for event '${event}' from state '${currentState}'`
                };

            }

            // Store previous state.

            const from = currentState;

            // Move to target state.

            currentState = transition.to;

            // Add transition to history.

            history.push({
                from,
                event,
                to: transition.to,
                action: transition.action,
                transitionedAt: timestamp
            });

            // Return successful transition result.

            return {
                dispatched: true,
                from,
                to: transition.to,
                action: transition.action
            };

        },


        // -----------------------------
        // Get current state
        // -----------------------------
        getCurrentState() {

            return {
                machineId,
                currentState,
                totalTransitions: history.length
            };

        },


        // -----------------------------
        // Get transition history
        // -----------------------------
        getHistory() {

            return [...history];

        },


        // -----------------------------
        // Check possible transition
        // -----------------------------
        canTransition(event) {

            // Validate event.

            if (
                typeof event !== "string" ||
                event.trim() === ""
            ) {
                return "Invalid Input";
            }

            // Find possible transition.

            const transition = transitions.find(item =>
                item.from === currentState &&
                item.event === event
            );

            return {
                event,
                canTransition: Boolean(transition),
                targetState: transition
                    ? transition.to
                    : null
            };

        },


        // -----------------------------
        // Reset state machine
        // -----------------------------
        reset() {

            currentState = initialState;

            history.length = 0;

            return {
                reset: true,
                state: initialState
            };

        }

    };

}


// --- EXAMPLE USAGE ---
const machine = createStateMachine({

    machineId: "order-fsm",

    initialState: "PENDING",

    transitions: [

        {
            from: "PENDING",
            event: "PAY",
            to: "PAID",
            action: "Process payment"
        },

        {
            from: "PENDING",
            event: "CANCEL",
            to: "CANCELLED",
            action: "Cancel order"
        },

        {
            from: "PAID",
            event: "SHIP",
            to: "SHIPPED",
            action: "Ship order"
        },

        {
            from: "SHIPPED",
            event: "DELIVER",
            to: "DELIVERED",
            action: "Mark delivered"
        }

    ]

});


console.log(machine.getCurrentState());

console.log(
    machine.canTransition("PAY")
);

console.log(
    machine.dispatch("PAY")
);

console.log(
    machine.dispatch("CANCEL")
);

console.log(
    machine.dispatch("SHIP")
);

console.log(
    machine.getHistory()
);

console.log(
    machine.reset()
);