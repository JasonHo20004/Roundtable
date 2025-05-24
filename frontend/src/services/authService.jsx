// src/services/authService.js
import {sendApiRequest} from '#utils/apiClient';

class AuthService {
    /**
     * Handles the user login request.
     * @param {object} credentials - The user's login credentials (e.g., { email: '...', password: '...' }).
     * @param {string} httpMethod - The HTTP method for the request (e.g., 'POST').
     * @returns {Promise<object>} - The response from the API.
     */
    async login(credentials, httpMethod = 'POST') {
        try {
            // Use the standalone function, passing the dynamic method and body
            const response = await sendApiRequest('/api/auth/login', {
                method: httpMethod,
                body: credentials
            });

            // Return the successful response structure expected by the action
            return {
                success: response.success,
                error: false,
                message: response.message || "Đăng nhập thành công.",
                status: 200, // Assuming 200 for success based on original code
                user: response.user,
            };

        } catch (error) {
            // Log the specific error from the API call
            console.error("AuthService login error:", error);

            // Re-throw the error so the calling action can handle UI-specific logic
            // Or return a structured error object if preferred
            throw error; // Let loginAction handle the error presentation
        }
    }

    /**
     * Handles the user registration request.
     * @param {object} registrationData - The user's registration details.
     * @param {string} httpMethod - The HTTP method (defaults to 'POST').
     * @returns {Promise<object>} - The response data from the API on success.
     */
    async register(registrationData, httpMethod = 'POST') {
        try {
            // Call the API endpoint for registration
            const responseData = await sendApiRequest('/api/auth/register', { // Assuming base URL is configured or use full URL
                method: httpMethod,
                body: registrationData
            });
            console.log('AuthService registration successful:', responseData);
            // Return the raw response data on success as the original action did
            return responseData;
        } catch (error) {
            console.error("AuthService register error:", error);
            // Re-throw the error so the calling action can handle it
            // It contains status and potentially data ({ message: ... })
            throw error;
        }
    }

    /**
     * Cập nhật hồ sơ người dùng.
     * @param {object} profileData - Dữ liệu hồ sơ người dùng.
     * @returns {Promise<object>} - Phản hồi từ API.
     */
    async createProfile(profileData) {
        try {
            // Ensure profileData is FormData
            if (!(profileData instanceof FormData)) {
                throw new Error('profileData must be a FormData object');
            }

            // Get profileId from FormData
            const profileId = profileData.get('profileId');
            
            // Validate profileId
            if (!profileId) {
                throw new Error('Thiếu thông tin profileId.');
            }

            // Send the request
            const response = await sendApiRequest('/api/auth/profile', {
                method: 'PUT',
                body: profileData,
                credentials: 'include'
            });

            console.log('AuthService createProfile successful:', response);
            return response; // Return the actual response instead of undefined 'data'
        } catch (error) {
            console.error("AuthService createProfile error:", error);
            throw error;
        }
    }
}

export default new AuthService();