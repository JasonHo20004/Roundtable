// backend/daos/moderator.dao.js

import {postgresInstance} from '#db/postgres.js';
import Moderator from '#models/moderator.model.js'; // Ensure this path is correct for your Moderator model
import {ConflictError} from "#errors/AppError.js"; // Assuming NotFoundError might not be directly thrown from DAO based on example

class ModeratorDAO {
    constructor() {
        if (!postgresInstance) {
            throw new Error('Postgres instance is not initialized.');
        }
        this.tableName = 'Moderators'; // Name of the table in the database
    }

    /**
     * Assigns a user as a moderator to a subtable.
     * The 'assignedAt' field will be set by the database default.
     * @param {Moderator} moderatorData - The moderator data to insert.
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<Moderator>} The newly created Moderator assignment instance.
     * @throws {ConflictError} If the user is already a moderator of this subtable (primary key violation).
     * @throws {Error} Throws other database errors (e.g., foreign key violation if user/subtable doesn't exist).
     */
    async create(moderatorData, trx = null) {
        const queryBuilder = trx || postgresInstance;
        const {userId, subtableId} = moderatorData;

        try {
            const insertedRows = await queryBuilder(this.tableName)
                .insert({userId, subtableId})
                .returning('*');

            if (!Array.isArray(insertedRows) || insertedRows.length === 0) {
                // This should ideally be caught by a DB error if the insert truly fails without returning data.
                throw new Error('Moderator assignment creation in DAO failed: No data returned from insert.');
            }
            return Moderator.fromDbRow(insertedRows[0]);
        } catch (error) {
            console.error('[ModeratorDAO] Error creating moderator assignment:', error);
            if (error.code === '23505') { // Unique violation typically means PK conflict here
                throw new ConflictError(`User (ID: ${userId}) is already a moderator for subtable (ID: ${subtableId}).`);
            }
            // Other errors (like foreign key violations if userId or subtableId don't exist) will be re-thrown.
            throw error;
        }
    }

    /**
     * Retrieves a specific moderator assignment by its composite key (userId, subtableId).
     * @param {string} userId - The UUID of the user.
     * @param {string} subtableId - The UUID of the subtable.
     * @returns {Promise<Moderator | null>} The Moderator instance or null if the assignment is not found.
     * @throws {Error} Throws database errors.
     */
    async getByCompositeKey(userId, subtableId) {
        try {
            const moderatorRow = await postgresInstance(this.tableName)
                .where({userId, subtableId})
                .first();
            return Moderator.fromDbRow(moderatorRow); // fromDbRow handles null row
        } catch (error) {
            console.error(`[ModeratorDAO] Error finding moderator by composite key (userId: ${userId}, subtableId: ${subtableId}):`, error);
            throw error;
        }
    }

    /**
     * Checks if a user is a moderator of a specific subtable.
     * @param {string} userId - The UUID of the user.
     * @param {string} subtableId - The UUID of the subtable.
     * @returns {Promise<boolean>} True if the user is a moderator, false otherwise.
     * @throws {Error} Throws database errors.
     */
    async isModerator(userId, subtableId) {
        try {
            const moderatorRow = await postgresInstance(this.tableName)
                .where({userId, subtableId})
                .first();
            return !!moderatorRow; // Convert row to boolean
        } catch (error) {
            console.error(`[ModeratorDAO] Error checking moderator status (userId: ${userId}, subtableId: ${subtableId}):`, error);
            throw error;
        }
    }

    /**
     * Retrieves all moderator assignments for a given subtable.
     * @param {string} subtableId - The UUID of the subtable.
     * @returns {Promise<Moderator[]>} An array of Moderator instances.
     * @throws {Error} Throws database errors.
     */
    async getAllBySubtableId(subtableId) {
        try {
            const moderatorRows = await postgresInstance(this.tableName)
                .where({subtableId})
                .select('*'); // Selects all columns from the Moderators table
            return moderatorRows.map(row => Moderator.fromDbRow(row));
        } catch (error) {
            console.error(`[ModeratorDAO] Error fetching moderators for subtable (ID: ${subtableId}):`, error);
            throw error;
        }
    }

    /**
     * Retrieves all subtable moderation assignments for a given user.
     * @param {string} userId - The UUID of the user.
     * @returns {Promise<Moderator[]>} An array of Moderator instances.
     * @throws {Error} Throws database errors.
     */
    async getAllByUserId(userId) {
        try {
            const moderatorRows = await postgresInstance(this.tableName)
                .where({userId})
                .select('*');
            return moderatorRows.map(row => Moderator.fromDbRow(row));
        } catch (error) {
            console.error(`[ModeratorDAO] Error fetching moderated assignments for user (ID: ${userId}):`, error);
            throw error;
        }
    }

    /**
     * Removes a user's moderator role from a subtable using their composite key.
     * @param {string} userId - The UUID of the user.
     * @param {string} subtableId - The UUID of the subtable.
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<number>} The number of rows deleted (should be 0 or 1).
     * @throws {Error} Throws database errors.
     */
    async delete(userId, subtableId, trx = null) {
        const queryBuilder = trx || postgresInstance;
        try {
            return await queryBuilder(this.tableName)
                .where({userId, subtableId})
                .del();
        } catch (error) {
            console.error(`[ModeratorDAO] Error deleting moderator assignment (userId: ${userId}, subtableId: ${subtableId}):`, error);
            throw error;
        }
    }
}

export default new ModeratorDAO();