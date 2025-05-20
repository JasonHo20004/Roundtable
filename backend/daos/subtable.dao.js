// backend/daos/subtable.dao.js
import {postgresInstance} from '#db/postgres.js';
import Subtable from '#models/subtable.model.js';
import {ConflictError} from "#errors/AppError.js";

class SubtableDAO {
    constructor() {
        if (!postgresInstance) {
            throw new Error('Postgres instance is not initialized.');
        }
        this.tableName = 'Subtable';
    }
    /**
     * Finds a subtable by its unique ID (UUID).
     * @param {string} subtableId - The UUID of the subtable.
     * @returns {Promise<Subtable | null>} The Subtable instance or null if not found.
     * @throws {Error} Throws database errors.
     */
    async getById(subtableId) {
        try {
            const subtableRow = await postgresInstance(this.tableName).where({subtableId}).first();
            // Use model's static method which handles null row
            return Subtable.fromDbRow(subtableRow);
        } catch (error) {
            console.error(`[SubtableDAO] Error finding subtable by ID (${subtableId}):`, error);
            throw error; // Re-throw for service layer
        }
    }

    /**
     * Finds a subtable by its unique name (case-sensitive based on DB collation).
     * @param {string} name - The name of the subtable.
     * @returns {Promise<Subtable | null>} The Subtable instance or null if not found.
     * @throws {Error} Throws database errors.
     */
    async getByName(name) {
        try {
            const subtableRow = await postgresInstance(this.tableName).where({name}).first();
            return Subtable.fromDbRow(subtableRow);
        } catch (error) {
            console.error(`[SubtableDAO] Error finding subtable by name (${name}):`, error);
            throw error;
        }
    }

    /**
     * Creates a new subtable record in the database.
     * @param {Subtable} subtable - The Subtable instance to create (subtableId, createdAt, memberCount are ignored).
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<Subtable>} The newly created Subtable instance with DB-generated values.
     * @throws {ConflictError} If subtable name constraint is violated.
     * @throws {Error} Throws other database errors.
     */
    async create(subtable, trx = null) {
        const queryBuilder = trx || postgresInstance;
        const {subtableId, createdAt, memberCount, ...insertData} = subtable;

        try {
            const insertedRows = await queryBuilder(this.tableName).insert(insertData).returning('*');

            if (!Array.isArray(insertedRows) || insertedRows.length === 0) {
                // Should ideally be caught by DB error, but good safety check
                throw new Error('Subtable creation in DAO failed: No data returned from insert.');
            }
            return Subtable.fromDbRow(insertedRows[0]);
        } catch (error) {
            console.error('[SubtableDAO] Error creating subtable:', error);
            if (error.code === '23505' && error.constraint === 'subtable_name_key') {
                throw new ConflictError(`Subtable name "${insertData.name}" is already taken.`);
            }
            throw error; // Re-throw other errors
        }
    }

    /**
     * Updates an existing subtable.
     * @param {string} subtableId - The ID of the subtable to update.
     * @param {Partial<Subtable>} updateData - An object containing fields to update.
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<Subtable | null>} The updated Subtable instance, or null if not found or no rows updated.
     * @throws {ConflictError} If subtable name constraint is violated on update.
     * @throws {Error} Throws other database errors.
     */
    async update(subtableId, updateData, trx = null) {
        const queryBuilder = trx || postgresInstance;
        const {
            subtableId: _,
            createdAt: __,
            creatorUserId: ___, // Prevent direct update of creator
            memberCount: ____,
            ...allowedUpdates
        } = updateData;

        if (Object.keys(allowedUpdates).length === 0) {
            console.warn(`[SubtableDAO] Update called for ID ${subtableId} with no valid fields.`);
            return this.getById(subtableId); // Return current state as nothing changed
        }

        try {
            const updatedRows = await queryBuilder(this.tableName)
                .where({subtableId})
                .update(allowedUpdates)
                .returning('*');

            if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
                return null; // Indicate subtable not found or update failed
            }
            return Subtable.fromDbRow(updatedRows[0]);
        } catch (error) {
            console.error(`[SubtableDAO] Error updating subtable (${subtableId}):`, error);
            if (error.code === '23505' && error.constraint === 'subtable_name_key') {
                throw new ConflictError(`Cannot update subtable: name "${allowedUpdates.name}" is already taken.`);
            }
            throw error;
        }
    }

    /**
     * Deletes a subtable by its ID. Use with caution!
     * Consider soft-delete mechanisms in a real application.
     * @param {string} subtableId - The ID of the subtable to delete.
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<number>} The number of rows deleted (0 or 1).
     * @throws {Error} Throws database errors.
     */
    async delete(subtableId, trx = null) {
        const queryBuilder = trx || postgresInstance;
        try {
            return await queryBuilder(this.tableName)
                .where({subtableId})
                .del();
        } catch (error) {
            console.error(`[SubtableDAO] Error deleting subtable (${subtableId}):`, error);
            throw error;
        }
    }

    /**
     * Fetches all subtables a specific user is subscribed to.
     * @param {string} userId - The ID of the RegisteredUser.
     * @returns {Promise<Subtable[]>} An array of Subtable instances.
     * @throws {Error} Throws database errors.
     */
    async getSubscribedSubtables(userId) {
        try {
            const subscribedSubtables = await postgresInstance(this.tableName)
                .join('Subscription', 'Subtable.subtableId', '=', 'Subscription.subtableId')
                .where('Subscription.userId', userId)
                .select('Subtable.*');

            return subscribedSubtables.map(row => Subtable.fromDbRow(row));
        } catch (error) {
            console.error(`[SubtableDAO] Error fetching subscribed subtables for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Searches subtables based on q parameters
     * @param {string} query - Search q string
     * @param {object} options - Search options
     * @param {number} [options.limit=25] - Maximum number of results
     * @param {number} [options.offset=0] - Number of results to skip
     * @returns {Promise<Array<Subtable>>} Array of matching subtables
     * @throws {Error} Throws database errors
     */
    async searchSubtables(query, options = {}) {
        const { limit = 25, offset = 0 } = options;
        
        try {
            console.log('[SubtableDAO:searchSubtables] Building q with params:', {query, limit, offset});

            const searchResults = await postgresInstance('Subtable')
                .select(
                    'Subtable.*',
                    postgresInstance.raw('COUNT(DISTINCT p."postId") as post_count'),
                    postgresInstance.raw('COUNT(DISTINCT s."subscriptionId") as subscriber_count'),
                    postgresInstance.raw(`
                        CASE 
                            WHEN "Subtable"."name" ILIKE ? THEN 3
                            WHEN "Subtable"."name" ILIKE ? THEN 2
                            WHEN "Subtable"."description" ILIKE ? THEN 1
                            ELSE 0
                        END as relevance_score
                    `, [`${query}`, `%${query}%`, `%${query}%`])
                )
                .leftJoin('Post as p', function() {
                    this.on('Subtable.subtableId', '=', 'p.subtableId');
                })
                .leftJoin('Subscription as s', 'Subtable.subtableId', '=', 's.subtableId')
                .where(function() {
                    this.where('Subtable.name', 'ILIKE', `%${query}%`)
                        .orWhere('Subtable.description', 'ILIKE', `%${query}%`);
                })
                .groupBy([
                    'Subtable.subtableId',
                    'Subtable.name',
                    'Subtable.description',
                    'Subtable.createdAt'
                ])
                .orderBy('relevance_score', 'desc')
                .orderBy('Subtable.name', 'asc')
                .limit(limit)
                .offset(offset);

            return searchResults.map(row => Subtable.fromDbRow(row));
        } catch (error) {
            console.error('[SubtableDAO:searchSubtables] Error details:', error);
            throw error;
        }
    }

    /**
     * Fetches a random list of subtables.
     * @param {object} options - Options for limit and offset
     * @param {number} [options.limit=8] - Maximum number of results
     * @param {number} [options.offset=0] - Number of results to skip
     * @returns {Promise<Array<Subtable>>} Array of random Subtable instances
     */
    async getRandomSubtables(options = {}) {
        const { limit = 8, offset = 0 } = options;
        try {
            const rows = await postgresInstance(this.tableName)
                .select('*')
                .orderByRaw('RANDOM()')
                .limit(limit)
                .offset(offset);
            return rows.map(row => Subtable.fromDbRow(row));
        } catch (error) {
            console.error('[SubtableDAO] Error fetching random subtables:', error);
            throw error;
        }
    }
}

export default new SubtableDAO();