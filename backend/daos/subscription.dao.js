// dao/subscription.dao.js
import {postgresInstance} from '#db/postgres.js'; // Assuming Knex instance is exported here
import Subscription from '#models/subscription.model.js'; // Adjust path if needed

/**
 * Data Access Object for Subscription operations using Knex.
 */
class SubscriptionDAO {

    /**
     * Creates a new subscription record.
     * Handles unique constraint violations (user already subscribed) gracefully.
     * Note: The DB trigger 'update_subtable_member_count_ins' handles incrementing Subtable.memberCount.
     * @param {Subscription} subscription - The Subscription object to create.
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<Subscription | null>} The created Subscription object or null if the user was already subscribed.
     */
    async create(subscription, trx = null) {
        const queryBuilder = trx || postgresInstance;
        const dataToInsert = {
            userId: subscription.userId,
            subtableId: subscription.subtableId
        };

        try {
            const insertedRows = await queryBuilder('Subscription')
                .insert(dataToInsert)
                .onConflict(['userId', 'subtableId'])
                .ignore()
                .returning('*');

            if (!Array.isArray(insertedRows) || insertedRows.length === 0) {
                console.info(`[SubscriptionDAO:create] User ${subscription.userId} is already subscribed to Subtable ${subscription.subtableId}, or insert was ignored.`);
                return null;
            }

            console.info(`[SubscriptionDAO:create] User ${subscription.userId} successfully subscribed to Subtable ${subscription.subtableId}. Row:`, insertedRows[0]);
            return Subscription.fromDbRow(insertedRows[0]); // Ensure Subscription model exists and fromDbRow is correct

        } catch (error) {
            // Catch other potential errors (DB connection issues, etc.)
            console.error(`[SubscriptionDAO:create] Error creating subscription for User ${subscription.userId} to Subtable ${subscription.subtableId}:`, error);
            throw error; // Re-throw for upstream handling
        }
    }
    /**
     * Deletes a subscription record.
     * Note: The DB trigger 'update_subtable_member_count_del' handles decrementing Subtable.memberCount.
     * @param {string} userId - The ID of the user unsubscribing.
     * @param {string} subtableId - The ID of the subtable being unsubscribed from.
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<boolean>} True if a subscription was deleted, false otherwise.
     */
    async delete(userId, subtableId, trx = null) {
        const queryBuilder = trx || postgresInstance;
        try {
            const deletedCount = await queryBuilder('Subscription')
                .where({userId, subtableId})
                .del(); // .delete() is an alias

            const deleted = deletedCount > 0;
            if (deleted) {
                console.info(`User ${userId} successfully unsubscribed from Subtable ${subtableId}`);
            } else {
                console.warn(`User ${userId} attempted to unsubscribe from Subtable ${subtableId}, but no subscription was found.`);
            }
            return deleted;
        } catch (error) {
            console.error(`Error deleting subscription for User ${userId} from Subtable ${subtableId}:`, error);
            throw error;
        }
    }

    /**
     * Finds a specific subscription by userId and subtableId.
     * @param {string} userId - The ID of the user.
     * @param {string} subtableId - The ID of the subtable.
     * @returns {Promise<Subscription | null>} The Subscription object if found, otherwise null.
     */
    async getByUserAndSubtable(userId, subtableId) {
        try {
            const subscriptionRow = await postgresInstance('Subscription')
                .where({userId, subtableId})
                .first(); // Get the first matching row or undefined

            return Subscription.fromDbRow(subscriptionRow); // Handles null/undefined input gracefully
        } catch (error) {
            console.error(`Error finding subscription for User ${userId} and Subtable ${subtableId}:`, error);
            throw error;
        }
    }

    /**
     * Finds all subtables a specific user is subscribed to.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Subscription[]>} An array of Subscription objects.
     */
    async getByUserId(userId) {
        try {
            const subscriptionRows = await postgresInstance('Subscription')
                .where({userId})
                .orderBy('subscribedAt', 'desc'); // Or 'asc'

            return subscriptionRows.map(row => Subscription.fromDbRow(row));
        } catch (error) {
            console.error(`Error finding subscriptions for User ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Finds all users subscribed to a specific subtable.
     * Optionally includes pagination.
     * @param {string} subtableId - The ID of the subtable.
     * @param {number} [limit=50] - Max number of subscriptions to return.
     * @param {number} [offset=0] - Number of subscriptions to skip.
     * @returns {Promise<Subscription[]>} An array of Subscription objects.
     */
    async getBySubtableId(subtableId, limit = 50, offset = 0) {
        try {
            const subscriptionRows = await postgresInstance('Subscription')
                .where({subtableId})
                .orderBy('subscribedAt', 'asc') // Or 'desc'
                .limit(limit)
                .offset(offset);

            return subscriptionRows.map(row => Subscription.fromDbRow(row));
        } catch (error) {
            console.error(`Error finding subscriptions for Subtable ${subtableId}:`, error);
            throw error;
        }
    }

    /**
     * Counts the total number of subscribers for a specific subtable.
     * Note: This directly counts rows. The Subtable.memberCount column is maintained by triggers
     * but this can be useful for verification or specific queries.
     * @param {string} subtableId - The ID of the subtable.
     * @returns {Promise<number>} The total number of subscribers.
     */
    async countBySubtableId(subtableId) {
        try {
            const result = await postgresInstance('Subscription')
                .where({subtableId})
                .count('* as count') // Use count() with an alias
                .first(); // Get the single result object

            return result ? parseInt(result.count, 10) : 0;
        } catch (error) {
            console.error(`Error counting subscriptions for Subtable ${subtableId}:`, error);
            throw error;
        }
    }
}

export default new SubscriptionDAO(); // Export a singleton instance
