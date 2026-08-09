// 🧩 PROBLEM–02: createServiceBus()

// Logic: Simulates an inter-service message bus.

// Supports:

// 1. Publish events to subscribed services
// 2. Send direct messages to a service
// 3. Check service online status
// 4. Toggle service online/offline
// 5. View complete message delivery log

function createServiceBus(services) {

    // --- STEP 1: VALIDATION ---
    // services must be a non-empty array.

    if (
        !Array.isArray(services) ||
        services.length === 0
    ) {
        return "Invalid Input";
    }

    // Validate every service.

    const isValidServices = services.every(service =>
        typeof service === "object" &&
        service !== null &&
        !Array.isArray(service) &&

        typeof service.serviceId === "string" &&
        service.serviceId.trim() !== "" &&

        Array.isArray(service.subscribedEvents) &&

        service.subscribedEvents.every(event =>
            typeof event === "string" &&
            event.trim() !== ""
        ) &&

        typeof service.isOnline === "boolean"
    );

    if (!isValidServices) {
        return "Invalid Input";
    }

    // Make a private copy so the original input
    // cannot directly modify the internal state.

    const serviceList = services.map(service => ({
        ...service,
        subscribedEvents: [...service.subscribedEvents]
    }));

    // --- STEP 2: INTERNAL MESSAGE LOG ---

    // Stores every delivery record from:
    // 1. publish()
    // 2. sendDirect()

    const messageLog = [];

    // --- STEP 3: RETURN SERVICE BUS OBJECT ---

    return {

        // -----------------------------
        // Publish an event
        // -----------------------------
        publish(event) {

            // Validate event object.

            if (
                typeof event !== "object" ||
                event === null ||
                Array.isArray(event)
            ) {
                return "Invalid Input";
            }

            const {
                eventId,
                eventType,
                payload
            } = event;

            if (
                typeof eventId !== "string" ||
                eventId.trim() === "" ||

                typeof eventType !== "string" ||
                eventType.trim() === "" ||

                typeof payload !== "object" ||
                payload === null ||
                Array.isArray(payload)
            ) {
                return "Invalid Input";
            }

            let deliveredCount = 0;
            let failedCount = 0;

            const deliveryLog = [];

            // Find every service that subscribed
            // to this event type.

            const matchingServices = serviceList.filter(service =>
                service.subscribedEvents.includes(eventType)
            );

            // Deliver event to every matching service.

            for (const service of matchingServices) {

                // Service is online → successful delivery.

                if (service.isOnline) {

                    const delivery = {
                        to: service.serviceId,
                        eventId,
                        eventType,
                        payload,
                        delivered: true
                    };

                    deliveryLog.push(delivery);
                    messageLog.push(delivery);

                    deliveredCount++;

                } else {

                    // Service is offline → failed delivery.

                    const delivery = {
                        to: service.serviceId,
                        eventId,
                        eventType,
                        delivered: false,
                        reason: "Service offline"
                    };

                    deliveryLog.push(delivery);
                    messageLog.push(delivery);

                    failedCount++;

                }

            }

            return {
                eventId,
                eventType,
                deliveredCount,
                failedCount,
                deliveryLog
            };

        },

        // -----------------------------
        // Send direct message
        // -----------------------------
        sendDirect(serviceId, message) {

            // Validate serviceId.

            if (
                typeof serviceId !== "string" ||
                serviceId.trim() === ""
            ) {
                return "Invalid Input";
            }

            // Validate message object.

            if (
                typeof message !== "object" ||
                message === null ||
                Array.isArray(message)
            ) {
                return "Invalid Input";
            }

            const {
                messageId,
                content
            } = message;

            // content can be any value,
            // so only messageId needs validation.

            if (
                typeof messageId !== "string" ||
                messageId.trim() === ""
            ) {
                return "Invalid Input";
            }

            // Find target service.

            const service = serviceList.find(
                service => service.serviceId === serviceId
            );

            // Service does not exist.

            if (!service) {

                return {
                    error: "Service not found: " + serviceId
                };

            }

            // Service exists but is offline.

            if (!service.isOnline) {

                const delivery = {
                    messageId,
                    delivered: false,
                    reason: "Service offline"
                };

                messageLog.push(delivery);

                return delivery;

            }

            // Service is online.

            const delivery = {
                messageId,
                delivered: true,
                to: serviceId
            };

            messageLog.push(delivery);

            return delivery;

        },

        // -----------------------------
        // Get service status
        // -----------------------------
        getServiceStatus(serviceId) {

            // Validate serviceId.

            if (
                typeof serviceId !== "string" ||
                serviceId.trim() === ""
            ) {
                return "Invalid Input";
            }

            // Find service.

            const service = serviceList.find(
                service => service.serviceId === serviceId
            );

            if (!service) {

                return {
                    error: "Service not found"
                };

            }

            return {
                serviceId,
                isOnline: service.isOnline
            };

        },

        // -----------------------------
        // Toggle service status
        // -----------------------------
        toggleService(serviceId) {

            // Validate serviceId.

            if (
                typeof serviceId !== "string" ||
                serviceId.trim() === ""
            ) {
                return "Invalid Input";
            }

            // Find service.

            const service = serviceList.find(
                service => service.serviceId === serviceId
            );

            if (!service) {

                return {
                    error: "Service not found"
                };

            }

            // Flip current status.

            service.isOnline = !service.isOnline;

            return {
                serviceId,
                isOnline: service.isOnline
            };

        },

        // -----------------------------
        // Get complete message log
        // -----------------------------
        getMessageLog() {

            // Return a copy so external code
            // cannot directly modify internal log.

            return messageLog.map(message => ({
                ...message
            }));

        }

    };

}


// --- EXAMPLE USAGE ---
const bus = createServiceBus([

    {
        serviceId: "order-service",
        subscribedEvents: [
            "payment.success",
            "payment.failed"
        ],
        isOnline: true
    },

    {
        serviceId: "email-service",
        subscribedEvents: [
            "payment.success",
            "order.created"
        ],
        isOnline: true
    },

    {
        serviceId: "sms-service",
        subscribedEvents: [
            "payment.success"
        ],
        isOnline: false
    }

]);


// Publish an event.

console.log(

    bus.publish({

        eventId: "EVT-1",

        eventType: "payment.success",

        payload: {
            amount: 500
        }

    })

);


// Check service status.

console.log(
    bus.getServiceStatus("sms-service")
);


// Toggle SMS service online.

console.log(
    bus.toggleService("sms-service")
);


// Send direct message.

console.log(

    bus.sendDirect(

        "sms-service",

        {
            messageId: "MSG-1",
            content: "Payment confirmed"
        }

    )

);


// Check message log.

console.log(
    bus.getMessageLog()
);