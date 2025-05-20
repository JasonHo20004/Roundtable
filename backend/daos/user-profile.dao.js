// daos/user-profile.dao.js

import {postgresInstance} from '#db/postgres.js'; // Assuming Knex instance is exported from here
import UserProfile from '#models/user-profile.model.js'; // Import the UserProfile model

/**
 * @class UserProfileDAO
 * @description Data Access Object for interacting with the UserProfile VIEW.
 * Provides methods to fetch combined user account and profile data.
 */
class UserProfileDAO {
    constructor() {
        // Name of your database VIEW
        this.viewName = 'UserProfile'; // IMPORTANT: Replace with your actual VIEW name
    }

    /**
     * Fetches a user profile by their RegisteredUser ID.
     * @param {string} userId - The UUID of the RegisteredUser.
     * @returns {Promise<UserProfile | null>} A promise that resolves to a UserProfile instance or null if not found.
     * @throws {Error} Throws an error if the database query fails.
     */
    async getByUserId(userId) {
        if (!userId) {
            return null;
        }
        try {
            const profileRow = await postgresInstance(this.viewName)
                .where({userId: userId}) // Assuming 'userId' is a column in your VIEW from RegisteredUser.userId
                .first();
            return profileRow ? UserProfile.fromDbRow(profileRow) : null;
        } catch (error) {
            console.error(`[UserProfileDAO] Error fetching user profile by userId (${userId}):`, error);
            throw error;
        }
    }
    /**
     * Fetches a user profile by their username.
     * Note: Usernames should be unique based on the Account schema.
     * @param {string} username - The username string.
     * @returns {Promise<UserProfile | null>} A promise that resolves to a UserProfile instance or null if not found.
     * @throws {Error} Throws an error if the database query fails.
     */
    async getByUsername(username) {
        if (!username) return null;
        try {
            const profileRow = await postgresInstance(this.viewName)
                .where({username: username}) // Assuming 'username' is a column in your VIEW from Account.username
                .first();
            return profileRow ? UserProfile.fromDbRow(profileRow) : null;
        } catch (error) {
            console.error(`[UserProfileDAO] Error fetching user profile by username (${username}):`, error);
            throw error;
        }
    }
    /**
     * Fetches a user profile by their principalId.
     * @param {string} principalId - The principalId string.
     * @returns {Promise<UserProfile | null>} A promise that resolves to a UserProfile instance or null if not found.
     * @throws {Error} Throws an error if the database query fails.
     */
    async getByPrincipalId(principalId) {
        if (!principalId) {
            return null;
        }
        try {
            const profileRow = await postgresInstance(this.viewName)
                .where({principalId: principalId}) // Assuming 'principalId' is in your VIEW from Principal.principalId
                .first();
            return profileRow ? UserProfile.fromDbRow(profileRow) : null;
        } catch (error) {
            console.error(`[UserProfileDAO] Error fetching user profile by principalId (${principalId}):`, error);
            throw error;
        }
    }
}

export default new UserProfileDAO();
