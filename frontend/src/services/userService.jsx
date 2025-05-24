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
    async getUserMedia(userId,mediaId) {
        const baseUrl = `/api/users/${userId}/${mediaId}`;
        console.log('Fetching subtable media with ID:', mediaId);
        const response = await sendApiRequest(baseUrl, {method: 'GET'});
        console.log('Response Media:', response);
        if (!response.success) {
            throw new Error(`Failed to fetch subtable details for ${mediaId}: ${response.status} ${response.statusText}`);
        }
        return response; // Return the whole response object
    }
}

export default new UserService();