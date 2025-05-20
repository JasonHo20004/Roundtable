// frontend/src/services/notificationService.jsx (NEW FILE)
import {sendApiRequest} from "#utils/apiClient";

class NotificationService {
    /**
     * Fetches notifications for the logged-in user.
     * @param {object} [options] - Optional query parameters.
     * @param {number} [options.limit] - Max number of notifications to return.
     * @param {number} [options.offset] - Number of notifications to skip.
     * @param {boolean} [options.isRead] - Filter by read status.
     * @returns {Promise<object>} - The API response (expected { success: true, data: { notifications: [], totalCount: number } }).
     */
    async getNotifications(options = {}) {
        // Construct query parameters string
        const queryParams = new URLSearchParams();
        if (options.limit !== undefined) {
            queryParams.set('limit', options.limit);
        }
        if (options.offset !== undefined) {
            queryParams.set('offset', options.offset);
        }
        if (options.isRead !== undefined) {
            queryParams.set('isRead', options.isRead);
        }

        const queryString = queryParams.toString();
        const url = `/api/notifications${queryString ? `?${queryString}` : ''}`;

        try {
            console.log(`[NotificationService] Fetching notifications from: ${url}`);
            // Assumes sendApiRequest handles potential errors and returns parsed JSON
            const response = await sendApiRequest(url, {method: 'GET'});
            console.log("[NotificationService] Received notifications:", response);
            return response; // Return the whole response object { success, data, message }
        } catch (error) {
            console.error("Error fetching notifications:", error);
            // Re-throw the error so the loader/component can handle it
            // error object should contain status and data from sendApiRequest
            throw error;
        }
    }

    async getUnreadCount() {
        const url = `/api/notifications/count`; // Use the new endpoint
        try {
            console.log(`[NotificationService] Fetching unread count from: ${url}`);
            const response = await sendApiRequest(url, {method: 'GET'});
            console.log("[NotificationService] Received unread count response:", response);
            // Assuming response structure is { success: true, data: { unreadCount: number } }
            if (response.success && response.data && typeof response.data.unreadCount === 'number') {
                return response.data.unreadCount;
            } else {
                console.error("Invalid response structure for unread count:", response);
                throw new Error("Failed to parse unread count from API.");
            }
        } catch (error) {
            console.error("Error fetching unread notification count:", error);
            throw error; // Re-throw for context/component handling
        }
    }

    async markAsRead(notificationId) {
        const url = `/api/notifications/${encodeURIComponent(notificationId)}/read`;
        try {
            console.log(`[NotificationService] Marking notification ${notificationId} as read via: ${url}`);
            const response = await sendApiRequest(url, {method: 'POST'});

            if (response.success) {
                console.log(`[NotificationService] Successfully marked notification ${notificationId} as read.`);
                return response;
            } else {
                console.error(`[NotificationService] Failed to mark notification ${notificationId} as read:`, response.message);
                throw new Error(response.message || "Failed to mark notification as read.");
            }
        } catch (error) {
            console.error(`Error marking notification ${notificationId} as read:`, error);
            throw error;
        }
    }
}

export default new NotificationService();