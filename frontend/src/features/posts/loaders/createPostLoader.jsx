import subtableService from "#services/subtableService.jsx";

export default async function createPostLoader() {
    try {
        console.log("4444")
        const response = await subtableService.getSubscribedSubtables();
        console.log("Subscribed Subtables:", response);
        if (response.success && Array.isArray(response.data)) {
            return {subtables: response.data};
        } else {
            console.error("Loader Error: Invalid data structure received from getSubscribedSubtables", response);
            return {subtables: [], error: "Failed to load communities."};
        }
    } catch (error) {
        console.error("Loader Error fetching subtables:", error);
        // Throwing the error might be better handled by route's errorElement
        return {subtables: [], error: error.message || "Could not load communities."};
    }
}