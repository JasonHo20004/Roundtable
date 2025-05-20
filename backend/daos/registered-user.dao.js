// backend/daos/registered-user.dao.js
import {postgresInstance} from '#db/postgres.js';
import RegisteredUser from '#models/registered-user.model.js';

class RegisteredUserDAO {
    constructor() {
        this.tableName = 'RegisteredUser';
    }

    async getById(userId, trx = null) {
        const queryBuilder = trx || postgresInstance;
        try {
            const userRow = await queryBuilder(this.tableName).where({userId}).first();
            return userRow ? RegisteredUser.fromDbRow(userRow) : null;
        } catch (error) {
            console.error(`[RegisteredUserDAO] Error fetching user by ID ${userId}:`, error);
            throw error;
        }
    }

    async getByPrincipalId(principalId, trx = null) {
        const queryBuilder = trx || postgresInstance;
        try {
            // Ensure the column name here matches your database schema (e.g., principalId or principal_id)
            const userRow = await queryBuilder(this.tableName).where({principalId: principalId}).first();
            return userRow ? RegisteredUser.fromDbRow(userRow) : null;
        } catch (error) {
            console.error(`[RegisteredUserDAO] Error fetching user by Principal ID ${principalId}:`, error);
            throw error;
        }
    }

    async create(registeredUser, trx = null) {
        const queryBuilder = trx || postgresInstance;
        const {userId, ...insertData} = registeredUser;
        try {
            const insertedRows = await queryBuilder(this.tableName).insert(insertData).returning('*');
            if (!insertedRows || insertedRows.length === 0) {
                throw new Error('RegisteredUser creation in DAO failed: No data returned.');
            }
            return RegisteredUser.fromDbRow(insertedRows[0]);
        } catch (error) {
            console.error('[RegisteredUserDAO] Error creating registered user:', error);
            throw error;
        }
    }

    async update(userId, updateData, trx = null) {
        const queryBuilder = trx || postgresInstance;
        try {
            // Ensure only allowed fields are updated, e.g., isVerified, status, karma, lastActive
            const {principalId, ...allowedUpdates} = updateData;

            if (Object.keys(allowedUpdates).length === 0) {
                return 0; // No fields to update
            }

            return await queryBuilder(this.tableName)
                .where({userId})
                .update(allowedUpdates); // Returns number of rows affected
        } catch (error) {
            console.error(`[RegisteredUserDAO] Error updating registered user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Searches users based on q parameters
     * @param {object} params - Search parameters
     * @param {string} params.q - Search q
     * @param {number} [params.limit=5] - Results limit
     * @returns {Promise<Array>} Search results
     */
    async searchUsers(query, options = {}) {
        const { limit = 25 } = options;
        try {
            console.log('[RegisteredUserDAO:searchUsers] Building q with params:', {query, limit});

            const searchResults = await postgresInstance('RegisteredUser as u')
                .select(
                    'u.userId',
                    'u.principalId',
                    'u.karma',
                    'u.isVerified',
                    'u.status',
                    'u.lastActive',
                    'a.username',
                    'pr.displayName',
                    'pr.avatar',
                    'pr.banner',
                    'pr.bio',
                    'pr.location',
                    'pr.gender'
                )
                .leftJoin('Principal as p', 'u.principalId', 'p.principalId')
                .leftJoin('Account as a', 'p.accountId', 'a.accountId')
                .leftJoin('Profile as pr', 'p.profileId', 'pr.profileId')
                .where(function() {
                    this.where('a.username', 'ILIKE', `%${query}%`)
                        .orWhere('a.email', 'ILIKE', `%${query}%`)
                        .orWhere('pr.displayName', 'ILIKE', `%${query}%`);
                })
                .groupBy(
                    'u.userId',
                    'u.principalId',
                    'u.karma',
                    'u.isVerified',
                    'u.status',
                    'u.lastActive',
                    'a.username',
                    'pr.displayName',
                    'pr.avatar',
                    'pr.banner',
                    'pr.bio',
                    'pr.location',
                    'pr.gender'
                )
                .limit(limit);

            return searchResults;
        } catch (error) {
            console.error('[RegisteredUserDAO:searchUsers] Error details:', error);
            throw error;
        }
    }
}

export default new RegisteredUserDAO();