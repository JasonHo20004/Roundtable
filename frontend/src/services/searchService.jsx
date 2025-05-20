import {sendApiRequest} from '#utils/apiClient';

class SearchService {
    /**
     * Search posts with the given q and filters
     * @param {Object} params - Search parameters
     * @param {string} params.q - Search q
     * @param {string} [params.subtableId] - Optional subtable ID to filter by
     * @param {string} [params.sortBy='relevance'] - Sort by field (relevance, newest, votes)
     * @param {number} [params.page=1] - Page number
     * @param {number} [params.limit=10] - Results per page
     * @returns {Promise<Object>} Search results
     */
    async searchPosts({q, subtableId, sortBy = 'relevance', limit = 50}) {
        try {
            const params = new URLSearchParams({
                q,
                sortBy,
                limit
            });

            if (subtableId) {
                params.append('subtableId', subtableId);
            }

            const baseUrl = `/api/posts/search?${params.toString()}`;
            console.log('baseUrl', baseUrl);
            return await sendApiRequest(baseUrl, {method: 'GET'});
        } catch (error) {
            console.error('Error searching posts:', error);
            throw error;
        }
    }
    /**
     * Search communities with the given q
     * @param {Object} params - Search parameters
     * @param {string} params.q - Search q
     * @param {number} [params.limit=5] - Results limit
     * @returns {Promise<Object>} Search results
     */
    async searchCommunities({q, limit = 5}) {
        try {
            const params = new URLSearchParams({
                q,
                limit
            });

            const baseUrl = `/api/s/search?${params.toString()}`;
            return await sendApiRequest(baseUrl, {method: 'GET'});
        } catch (error) {
            console.error('Error searching communities:', error);
            throw error;
        }
    }

    /**
     * Search users with the given q
     * @param {Object} params - Search parameters
     * @param {string} params.q - Search q
     * @param {number} [params.limit=5] - Results limit
     * @returns {Promise<Object>} Search results
     */
    async searchUsers({q, limit = 5}) {
        try {
            const params = new URLSearchParams({
                q,
                limit
            });

            const baseUrl = `/api/users/search?${params.toString()}`;
            return await sendApiRequest(baseUrl, {method: 'GET'});
        } catch (error) {
            console.error('Error searching users:', error);
            throw error;
        }
    }
}

export default new SearchService(); 