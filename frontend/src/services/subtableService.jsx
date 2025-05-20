import {sendApiRequest} from "#utils/apiClient";

class SubtableService {
    async getSubtableDetails(subtableName) {
        const baseUrl = `/api/s/${subtableName}`;
        const response = await sendApiRequest(baseUrl, {method: 'GET'});
        if (!response.success) {
            throw new Error(`Failed to fetch subtable details for ${subtableName}: ${response.status} ${response.statusText}`);
        }
        return response; // Return the whole response object
    }

    async getSubtablePosts(subtableName) {
        const baseUrl = `/api/s/${subtableName}/posts`;
        const response = await sendApiRequest(baseUrl, {method: 'GET'});
        if (!response.success) {
            throw new Error(`Failed to fetch subtable details for ${subtableName}: ${response.status} ${response.statusText}`);
        }
        return response;
    }
    async getSubtableMedia(mediaId, subtableName) {
        // Early return if mediaId is null, undefined, or empty string
        if (!mediaId || mediaId === 'null' || mediaId === 'undefined') {
            console.log('Skipping media fetch - no mediaId provided for subtable:', subtableName);
            return {
                success: true,
                data: {
                    url: null,
                    mediaType: null,
                    mimeType: null
                }
            };
        }

        const baseUrl = `/api/s/${subtableName}/media/${mediaId}`;
        console.log('Fetching subtable media with ID:', mediaId, 'for subtable:', subtableName);
        try {
            const response = await sendApiRequest(baseUrl, {method: 'GET'});
            if (!response.success) {
                console.warn(`Failed to fetch media for subtable ${subtableName}:`, response.message);
                return {
                    success: true,
                    data: {
                        url: null,
                        mediaType: null,
                        mimeType: null
                    }
                };
            }
            return response;
        } catch (error) {
            console.warn(`Error fetching media for subtable ${subtableName}:`, error.message);
            return {
                success: true,
                data: {
                    url: null,
                    mediaType: null,
                    mimeType: null
                }
            };
        }
    }

    async getSubscribedSubtables() {
        const baseUrl = `/api/s/subscribed`;
        const response = await sendApiRequest(baseUrl, {method: 'GET'});
        if (!response.success) {
            throw new Error(`Failed to fetch subtables: ${response.status} ${response.statusText}`);
        }
        return response; // Return the whole response object
    }

    async createSubtable(subtableData) {
        const baseUrl = '/api/s/';
        console.log('Creating subtable with data:', subtableData);
        for (let pair of subtableData.entries()) {
            console.log(`${pair[0]}:`, pair[1]);
        }
        const response = await fetch(baseUrl, {
            method:'POST',
            body: subtableData,
            headers: {
                'Accept': 'application/json',
                // 'Content-Type': 'multipart/form-data' // Do not set this header when using FormData
            },
            credentials: 'include',

        })
        const responseData = await response.json();

        //const response = await sendApiRequest(baseUrl, {method: 'POST', body: subtableData});

        if (!responseData.success) {
            throw new Error(`Failed to fetch subtables: ${response.status} ${response.statusText}`);
        }
        return responseData
    }
    async getJoinSubtable(subtableId) {
        console.log("subtableiiiiiiiiiiiii",subtableId)
        if (!subtableId) {
            throw new Error('Subtable ID is required');
        }

        try {
            const baseUrl = `/api/s/user/${subtableId}`;
            const response = await sendApiRequest(baseUrl, { method: 'GET' });

            if (response.status === 401 || !response.success) {
                return {
                    success: false,
                    message: "User not logged in",
                    data: {
                        isJoined: false,
                        subscription: null
                    }
                };
            }

            return response;
        } catch (error) {
            if (error.status === 401) {
                return {
                    success: false,
                    message: "User not logged in",
                    data: {
                        isJoined: false,
                        subscription: null
                    }
                };
            }
            console.error('[SubtableService:getJoinSubtable] Error:', error.message);
            throw new Error(`Failed to check subtable join status: ${error.message}`);
        }
    }

    async followSubtable(subtableId) {
        if (!subtableId) {
            throw new Error('Subtable ID is required');
        }

        try {
            const baseUrl = `/api/s/user/${subtableId}`;
            const response = await sendApiRequest(baseUrl, { method: 'POST' });

            if (!response.success) {
                throw new Error(`Failed to follow subtable: ${response.message}`);
            }

            return response;
        } catch (error) {
            console.error('[SubtableService:followSubtable] Error:', error.message);
            throw new Error(`Failed to follow subtable: ${error.message}`);
        }
    }

    async unfollowSubtable(subtableId) {
        if (!subtableId) {
            throw new Error('Subtable ID is required');
        }

        try {
            const baseUrl = `/api/s/user/${subtableId}`;
            const response = await sendApiRequest(baseUrl, { method: 'DELETE' });

            if (!response.success) {
                throw new Error(`Failed to unfollow subtable: ${response.message}`);
            }

            return response;
        } catch (error) {
            console.error('[SubtableService:unfollowSubtable] Error:', error.message);
            throw new Error(`Failed to unfollow subtable: ${error.message}`);
        }
    }

    
}
export default new SubtableService();