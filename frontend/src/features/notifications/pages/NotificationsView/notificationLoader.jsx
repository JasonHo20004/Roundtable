// frontend/src/features/notifications/pages/NotificationsView/notificationLoader.js (NEW FILE)
import notificationService from '#services/notificationService.jsx';
import {redirect} from 'react-router'; // Import redirect

/**
 * React Router loader to fetch notifications before rendering the NotificationsView.
 */
async function notificationLoader() {
    try {
        console.log("[notificationLoader] Fetching initial notifications...");
        const response = await notificationService.getNotifications({limit: 50}); // Fetch initial batch

        if (response.success && response.data) {
            console.log("[notificationLoader] Fetched data:", response.data);
            return response.data
        } else {
            // Handle cases where API returns success: false or unexpected structure
            console.error("[notificationLoader] API call successful but data is missing or success is false:", response);
            throw new Response("Failed to load notifications: Invalid data received.", {status: 500});
        }
    } catch (error) {
        console.error("[notificationLoader] Error fetching notifications:", error);
        // If unauthorized (e.g., session expired), redirect to login
        if (error.status === 401) {
            console.log("[notificationLoader] Unauthorized, redirecting to login.");
            // You might want to store the intended destination to redirect back after login
            return redirect('/login');
        }
        // For other errors, throw a Response to be caught by the route's errorElement
        // Pass the error message and status
        throw new Response(error.data?.message || error.message || "Could not load notifications.", {status: error.status || 500});
    }
}

export default notificationLoader;