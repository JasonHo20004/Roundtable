// models/subtable.model.js

/**
 * Represents a Subtable (community) within the platform.
 */
class Subtable {
    /**
     * Creates an instance of Subtable.
     * @param {string | null} subtableId - The unique identifier (UUID), null if new.
     * @param {string} name - The unique name of the subtable (e.g., 'VietnamDevs'). Required.
     * @param {string | null} [description=null] - A description of the subtable.
     * @param {string | null} [creatorUserId=null] - The UUID of the RegisteredUser who created the subtable.
     * @param {string | null} [icon=null] - URL or UUID for the subtable's icon image.
     * @param {string | null} [banner=null] - URL or UUID for the subtable's banner image.
     * @param {number} [memberCount=0] - The number of members.
     * @param {Date | null} [createdAt=null] - Timestamp of creation (set by DB default).
     */
    constructor(subtableId, name, description = null, creatorUserId = null, icon = null, banner = null, memberCount = 0, createdAt = null) {
        /** @type {string | null} */
        this.subtableId = subtableId;

        /** @type {string} */
        this.name = name;

        /** @type {string | null} */
        this.description = description;

        /** @type {string | null} */
        this.creatorUserId = creatorUserId;

        /** @type {string | null} */
        this.icon = icon;

        /** @type {string | null} */
        this.banner = banner;

        /** @type {number} */
        // Ensure memberCount is a number, potentially using calculated subscriber_count.
        this.memberCount = Number(memberCount) || 0;

        /** @type {Date | null} */
        // Ensure createdAt is a Date object.
        this.createdAt = createdAt instanceof Date ? createdAt : (createdAt ? new Date(createdAt) : null);
    }

    /**
     * Converts a database row object into a Subtable instance.
     * Handles potential snake_case column names from the database.
     * @param {Object} row - The database row object (e.g., from node-postgres query result).
     * @returns {Subtable | null} A Subtable instance or null if no row provided.
     */
    static fromDbRow(row) {
        if (!row) {
            return null;
        }

        // Handle potential snake_case and provide fallbacks
        const subtableIdFromRow = row.subtableId || row.subtable_id;
        const creatorUserIdFromRow = row.creatorUserId || row.creator_user_id;
        const createdAtFromRow = row.createdAt || row.created_at;
        // Use calculated subscriber_count from search query if available, otherwise fallback to memberCount column
        const memberCountFromRow = row.subscriber_count ?? (row.memberCount || row.member_count);

        // Pass arguments in the correct order matching the constructor
        return new Subtable(
            subtableIdFromRow,
            row.name,
            row.description,
            creatorUserIdFromRow,
            row.icon,
            row.banner,
            memberCountFromRow,
            createdAtFromRow
        );
    }
}

export default Subtable;