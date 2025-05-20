// backend/models/moderator.model.js

/**
 * Represents a moderator assignment linking a RegisteredUser to a Subtable
 * in the "Moderators" table.
 */
class Moderator {
    /**
     * Creates an instance of a Moderator assignment.
     *
     * The combination of `userId` and `subtableId` forms the primary key
     * for this relationship in the database.
     *
     * @param {string} userId - The UUID of the RegisteredUser who is the moderator. Required.
     * @param {string} subtableId - The UUID of the Subtable being moderated. Required.
     * @param {Date | string | null} [assignedAt=null] - Timestamp of when the user was assigned as a moderator.
     * If a string is provided, it will be converted to a Date object.
     * Defaults to null, typically set by the database.
     */
    constructor(userId, subtableId, assignedAt = null) {
        /**
         * @type {string}
         * The unique identifier (UUID) of the user who is a moderator.
         * Part of the composite primary key.
         */
        this.userId = userId;

        /**
         * @type {string}
         * The unique identifier (UUID) of the subtable being moderated.
         * Part of the composite primary key.
         */
        this.subtableId = subtableId;

        /**
         * @type {Date | null}
         * The timestamp indicating when the user was assigned as a moderator.
         * Set by the database by default if not provided.
         */
        this.assignedAt = assignedAt ? new Date(assignedAt) : null;

        // Basic validation for required fields
        if (!this.userId) {
            throw new Error("Moderator 'userId' cannot be null or empty.");
        }
        if (typeof this.userId !== 'string') { // Basic type check, can be enhanced with UUID validation
            throw new Error("Moderator 'userId' must be a string UUID.");
        }

        if (!this.subtableId) {
            throw new Error("Moderator 'subtableId' cannot be null or empty.");
        }
        if (typeof this.subtableId !== 'string') { // Basic type check
            throw new Error("Moderator 'subtableId' must be a string UUID.");
        }
    }

    /**
     * Converts a database row object from the "Moderators" table into a Moderator instance.
     * @param {Object | null} row - The database row object, expected to have `userId`, `subtableId`, and `assignedAt` properties.
     * @returns {Moderator | null} A Moderator instance, or null if no row is provided or if essential data is missing.
     */
    static fromDbRow(row) {
        if (!row) {
            return null;
        }
        // Ensure essential fields for a valid moderator record are present
        if (!row.userId || !row.subtableId) {
            console.warn("Attempted to create Moderator instance from DB row with missing userId or subtableId.", row);
            return null;
        }
        return new Moderator(
            row.userId,
            row.subtableId,
            row.assignedAt
        );
    }
}

export default Moderator;