import {PrincipalRoleEnum} from "#models/principal.model.js";
import {UserStatusEnum} from "#models/registered-user.model.js";

/**
 * Represents a combined view of user account and profile information,
 * mirroring the "UserProfile" VIEW in the database.
 */
class UserProfile {
    /**
     * Creates an instance of UserProfile.
     * @param {string} userId - The unique identifier from RegisteredUser.
     * @param {string} principalId - The core Principal's unique identifier.
     * @param {string} username - The user's login username.
     * @param {string | null} displayName - The user's display name (can be null if not set).
     * @param {string | null} avatar - The URL to the user's avatar image (can be null).
     * @param {string | null} banner
     * @param {number} karma - The user's karma score.
     * @param {boolean} isVerified - Whether the user's account is verified.
     * @param {typeof UserStatusEnum[keyof typeof UserStatusEnum]} status - The user's status (e.g., 'active'). Should be one of UserStatusEnum values.
     */
    constructor(userId, principalId, username, displayName, avatar,banner, karma, isVerified, status) {
        /** @type {string} */
        this.userId = userId;

        /** @type {string} */
        this.principalId = principalId;

        /** @type {string} */
        this.username = username;

        /** @type {string | null} */
        this.displayName = displayName;

        /** @type {string | null} */
        this.avatar = avatar;

         /** @type {string | null} */
        this.banner = banner;

        /** @type {number} */
        this.karma = karma;

        /** @type {boolean} */
        this.isVerified = isVerified;

        /**
         * User's status. Should hold one of the values from UserStatusEnum.
         * @type {typeof UserStatusEnum[keyof typeof UserStatusEnum]}
         */
        this.status = status;
    }

    /**
     * Converts a database row (from the UserProfile VIEW) to a UserProfile instance.
     * Assumes the row object keys match the column names defined in the VIEW.
     * @param {Object | null} row - The database row object or null.
     * @returns {UserProfile | null} The UserProfile instance or null if no row is provided.
     */
    static fromDbRow(row) {
        if (!row) return null;

        // Ensure required fields are present (optional check)
        if (!row.userId || !row.principalId || !row.username || !row.status) {
            console.error("Missing required fields in database row for UserProfile:", row);
            // Depending on requirements, you might throw an error or return null
            return null;
        }

        // Map database row fields directly to constructor arguments
        return new UserProfile(
            row.userId,
            row.principalId,
            row.username,
            row.displayName,
            row.avatar,
            row.banner,
            row.karma,
            row.isVerified,
            row.status,
        );
    }

    /**
     * Example validation method for status (optional)
     * @param {any} value
     * @returns {boolean}
     */
    static isValidStatus(value) {
        return Object.values(UserStatusEnum).includes(value);
    }

    /**
     * Example validation method for role (optional)
     * @param {any} value
     * @returns {boolean}
     */
    static isValidRole(value) {
        return Object.values(PrincipalRoleEnum).includes(value);
    }
}

export default UserProfile;