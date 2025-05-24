import RegisteredUserDao from '#daos/registered-user.dao.js';
import UserProfileDao from '#daos/user-profile.dao.js';
import mediaDao from '#daos/media.dao.js';
import {BadRequestError} from "#errors/AppError.js";

class UserService {
    constructor(registeredUserDao, userProfileDao) {
        this.registeredUserDao = registeredUserDao;
        this.userProfileDao = userProfileDao;
        this.mediaDao = mediaDao;
    }

    /**
     * Searches users based on q parameters
     * @param {object} params - Search parameters
     * @param {string} params.q - Search q
     * @param {number} [params.limit=5] - Results limit
     * @returns {Promise<object>} Search results
     */
    async searchUsers({q, limit = 5}) {
        try {
            // Validate input
            if (!q) {
                throw new BadRequestError('Missing search query');
            }

            // Convert limit to number
            limit = parseInt(limit);

            // Validate numeric parameters
            if (isNaN(limit) || limit < 1) {
                throw new BadRequestError('Invalid limit parameter');
            }

            // Get search results from DAO
            const results = await this.registeredUserDao.searchUsers(q, {limit});

            return {
                users: results
            };
        } catch (error) {
            console.error('[UserService:searchUsers] Error:', error);
            throw error;
        }
    }

    async getUserProfile(userId) {
        try {
            // Validate input
            if (!userId) {
                throw new BadRequestError('Missing user ID');
            }

            // Get user profile from DAO
            const userProfile = await this.userProfileDao.getByUserId(userId);

            return {
                user: userProfile
            };
        } catch (error) {
            console.error('[UserService:getUserProfile] Error:', error);
            throw error;
        }
    }
    async getUserMedia(mediaId) {
        try {
            // Validate input
            if (!mediaId) {
                throw new BadRequestError('Missing user ID or media ID');
            }

            // Get user media from DAO
            const media = await this.mediaDao.getById(mediaId);

            return media;
        } catch (error) {
            console.error('[UserService:getUserMedia] Error:', error);
            throw error;
        }
    }
}

export default new UserService(RegisteredUserDao, UserProfileDao);