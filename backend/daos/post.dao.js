// daos/post.dao.js
import {postgresInstance} from '#db/postgres.js';
import Post from '#models/post.model.js';

class PostDAO {
    /**
     * Finds a post by its unique ID (UUID).
     * @param {string} postId - The UUID of the post.
     * @returns {Promise<Post | null>} The Post instance or null if not found.
     */
    async getById(postId) {
        try {
            const postRow = await postgresInstance('Post').where({postId}).first();
            return Post.fromDbRow(postRow);
        } catch (error) {
            console.error(`Error finding post by ID (${postId}):`, error);
            throw error;
        }
    }

    /**
     * Creates a new post record in the database.
     * @param {Post} post - The Post instance to create (postId, createdAt, updatedAt, voteCount, commentCount, isLocked, isRemoved are ignored).
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<Post>} The newly created Post instance with DB-generated values.
     */
    async create(post, trx = null) {
        const queryBuilder = trx ? trx : postgresInstance;
        // Exclude fields managed by DB defaults or triggers
        const {
            postId, createdAt, updatedAt, voteCount,
            commentCount, isLocked, isRemoved,
            ...insertData
        } = post;

        // Ensure required fields are present
        if (!insertData.subtableId || !insertData.title) {
            throw new Error('Missing required fields for post creation: subtableId and title.');
        }

        try {
            const insertedRows = await queryBuilder('Post').insert(insertData).returning('*');

            if (!Array.isArray(insertedRows) || insertedRows.length === 0) {
                console.error('Post creation failed or did not return expected data.', insertedRows);
                throw new Error('PostgresDB error during post creation: No data returned.');
            }
            return Post.fromDbRow(insertedRows[0]);
        } catch (error) {
            console.error('Error creating post:', error);
            throw error; // Re-throw
        }
    }

    /**
     * Updates an existing post.
     * @param {string} postId - The ID of the post to update.
     * @param {Partial<Pick<Post, 'title' | 'body' | 'isLocked' | 'isRemoved'>>} updateData - An object containing allowed fields to update (title, body, isLocked, isRemoved).
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<Post | null>} The updated Post instance, or null if not found.
     */
    async update(postId, updateData, trx = null) {
        const queryBuilder = trx || postgresInstance;
        // Only allow specific fields to be updated via this method
        const allowedUpdates = {};
        if (updateData.title !== undefined) allowedUpdates.title = updateData.title;
        if (updateData.body !== undefined) allowedUpdates.body = updateData.body;
        if (updateData.isLocked !== undefined) allowedUpdates.isLocked = updateData.isLocked;
        if (updateData.isRemoved !== undefined) allowedUpdates.isRemoved = updateData.isRemoved;
        // Note: updatedAt is handled by the trigger_set_timestamp trigger

        if (Object.keys(allowedUpdates).length === 0) {
            console.warn(`Post update called for ID ${postId} with no valid fields to update.`);
            return this.getById(postId, trx); // Return current state
        }

        try {
            const updatedRows = await queryBuilder('Post')
                .where({postId})
                .update(allowedUpdates) // Knex automatically includes the updatedAt update via trigger
                .returning('*');

            if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
                return null; // Indicate post not found
            }
            return Post.fromDbRow(updatedRows[0]);
        } catch (error) {
            console.error(`Error updating post (${postId}):`, error);
            throw error;
        }
    }
    /**
     * Updates an existing post.
     * @param {string} postId - The ID of the post to update.
     * @param {Partial<Pick<Post, 'body' | 'authorUserId'>>} updateData - An object containing allowed fields to update (title, body, isLocked, isRemoved).
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<Post | null>} The updated Post instance, or null if not found.
     */
    async updateDelete(postId, updateData, trx = null) {
        const queryBuilder = trx || postgresInstance;
        // Only allow specific fields to be updated via this method
        const allowedUpdates = {};
        if (typeof updateData.body === 'string') allowedUpdates.body = updateData.body;
        if (typeof updateData.authorUserId === 'string') allowedUpdates.authorUserId = null;
        // Note: updatedAt is handled by the trigger_set_timestamp trigger

        if (Object.keys(allowedUpdates).length === 0) {
            console.warn(`Post update called for ID ${postId} with no valid fields to update.`);
            return this.getById(postId, trx); // Return current state
        }

        try {
            const updatedRows = await queryBuilder('Post')
                .where({postId})
                .update(allowedUpdates) // Knex automatically includes the updatedAt update via trigger
                .returning('*');

            if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
                return null; // Indicate post not found
            }
            return Post.fromDbRow(updatedRows[0]);
        } catch (error) {
            console.error(`Error updating post (${postId}):`, error);
            throw error;
        }

    }

    /**
     * Deletes a post by its ID. Use soft delete (setting isRemoved=true) generally.
     * This method performs a HARD delete.
     * @param {string} postId - The ID of the post to delete.
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<number>} The number of rows deleted (0 or 1).
     */
    async hardDelete(postId, trx = null) {
        const queryBuilder = trx || postgresInstance;
        try {
            const deletedCount = await queryBuilder('Post')
                .where({postId})
                .del();
            console.log(`Attempted HARD deletion for postId ${postId}. Rows affected: ${deletedCount}`);
            return deletedCount;
        } catch (error) {
            console.error(`Error hard deleting post (${postId}):`, error);
            throw error;
        }
    }

    /**
     * Finds posts belonging to a specific subtable, optionally paginated and sorted.
     * @param {string} subtableId - The UUID of the subtable.
     * @param {{limit?: number, offset?: number, sortBy?: 'createdAt' | 'voteCount', order?: 'asc' | 'desc'}} [options={}] - Pagination and sorting options.
     * @returns {Promise<Post[]>} An array of Post instances.
     */
    async findBySubtable(subtableId, options = {}) {
        const {limit = 25, offset = 0, sortBy = 'createdAt', order = 'desc'} = options;
        const validSortBy = ['createdAt', 'voteCount'].includes(sortBy) ? sortBy : 'createdAt';
        const validOrder = ['asc', 'desc'].includes(order) ? order : 'desc';

        try {
            const postRows = await postgresInstance('Post')
                .where({subtableId, isRemoved: false}) // Typically exclude removed posts
                .orderBy(validSortBy, validOrder)
                .limit(limit)
                .offset(offset);

            return postRows.map(Post.fromDbRow);
        } catch (error) {
            console.error(`Error finding posts by subtable (${subtableId}):`, error);
            throw error;
        }
    }

    /**
     * Finds posts authored by a specific user, optionally paginated and sorted.
     * @param {string} authorUserId - The UUID of the author (RegisteredUser).
     * @param {{limit?: number, offset?: number, sortBy?: 'createdAt', order?: 'desc'}} [options={}] - Pagination and sorting options.
     * @returns {Promise<Post[]>} An array of Post instances.
     */
    async findByAuthor(authorUserId, options = {}) {
        const {limit = 25, offset = 0, sortBy = 'createdAt', order = 'desc'} = options;
        const validSortBy = ['createdAt', 'voteCount'].includes(sortBy) ? sortBy : 'createdAt';
        const validOrder = ['asc', 'desc'].includes(order) ? order : 'desc';

        try {
            const postRows = await postgresInstance('Post')
                .where({authorUserId, isRemoved: false}) // Optionally filter out removed
                .orderBy(validSortBy, validOrder)
                .limit(limit)
                .offset(offset);

            return postRows.map(Post.fromDbRow);
        } catch (error) {
            console.error(`Error finding posts by author (${authorUserId}):`, error);
            throw error;
        }
    }

    /**
     * Searches posts based on q parameters
     * @param {object} params - Search parameters
     * @param {string} params.q - Search q
     * @param {string} [params.subtableId] - Optional subtable ID to filter by
     * @param {string} [params.sortBy='relevance'] - Sort by field (relevance, newest, votes)
     * @param {number} [params.page=1] - Page number
     * @param {number} [params.limit=10] - Results per page
     * @returns {Promise<{posts: Array, total: number}>} Search results and total count
     */
    async searchPosts(query, options = {}) {
        const { subtableId, sortBy = 'relevance', page = 1, limit = 50 } = options;
        const offset = (page - 1) * limit;
        
        try {
            // Ensure q is a string
            const searchQuery = typeof query === 'object' ? query.query : query;

            console.log('[PostDAO:searchPosts] Building q with params:', {
                query: searchQuery, 
                subtableId, 
                sortBy, 
                page, 
                limit, 
                offset 
            });

            // First get the total count
            const countQuery = postgresInstance('Post as p')
                .where('p.isRemoved', false)
                .where(function() {
                    this.where('p.title', 'ILIKE', `%${searchQuery}%`)
                        .orWhere('p.body', 'ILIKE', `%${searchQuery}%`);
                });

            if (subtableId) {
                countQuery.where('p.subtableId', subtableId);
            }

            const [{ total }] = await countQuery.count('* as total');

            // Then get the actual results
            const searchResults = await postgresInstance('Post as p')
                .select(
                    'p.*',
                    'a.username as authorUsername',
                    's.name as subtableName',
                    's.icon as subtableIcon',
                    's.banner as subtableBanner',
                    's.description as subtableDescription',
                    's.memberCount as subtableMemberCount',
                    's.createdAt as subtableCreatedAt',
                    's.creatorUserId as subtableCreatorUserId',
                    postgresInstance.raw(`
                        CASE 
                            WHEN "p"."title" ILIKE ? THEN 3
                            WHEN "p"."title" ILIKE ? THEN 2
                            WHEN "p"."body" ILIKE ? THEN 1
                            ELSE 0
                        END as relevance_score
                    `, [`${searchQuery}`, `%${searchQuery}%`, `%${searchQuery}%`])
                )
                .leftJoin('RegisteredUser as u', 'p.authorUserId', '=', 'u.userId')
                .leftJoin('Principal as pr', 'u.principalId', '=', 'pr.principalId')
                .leftJoin('Account as a', 'pr.accountId', '=', 'a.accountId')
                .leftJoin('Subtable as s', 'p.subtableId', '=', 's.subtableId')
                .where('p.isRemoved', false)
                .where(function() {
                    this.where('p.title', 'ILIKE', `%${searchQuery}%`)
                        .orWhere('p.body', 'ILIKE', `%${searchQuery}%`);
                })
                .modify(function(queryBuilder) {
            if (subtableId) {
                        queryBuilder.where('p.subtableId', subtableId);
            }
                })
                .orderBy('relevance_score', 'desc')
                .orderBy('p.createdAt', 'desc')
                .limit(limit)
                .offset(offset);

            const totalPages = Math.ceil(parseInt(total) / limit);

            return {
                posts: searchResults.map(row => Post.fromDbRow(row)),
                pagination: {
                    total: parseInt(total),
                    page,
                    limit,
                    totalPages
                }
            };
        } catch (error) {
            console.error('[PostDAO:searchPosts] Error details:', error);
            throw error;
        }
    }

    // Increment/Decrement methods for voteCount/commentCount are likely unnecessary
    // as they are handled by database triggers based on Vote/Comment insertions/deletions.
}

export default new PostDAO();