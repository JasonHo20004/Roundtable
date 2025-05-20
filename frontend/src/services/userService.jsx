import {sendApiRequest} from "#utils/apiClient";

class UserService {
    async getUserProfileByUserId(userId) {
        const baseUrl = `/api/users/${userId}`;

        const response = await sendApiRequest(baseUrl, {
            method: 'GET'
        });

        if (!response.success) {
            throw new Error(`Failed to fetch user profile: ${response.message}`);
        }

        return response;
    }
}

export default new UserService();