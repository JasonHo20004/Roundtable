// daos/comment.dao.js
import {postgresInstance} from '#db/postgres.js';
import Comment from '#models/comment.model.js';

class CommentDAO {
    /**
     * Finds a comment by its unique ID (UUID).
     * @param {string} commentId - The UUID of the comment.
     * @returns {Promise<Comment | null>} The Comment instance or null if not found.
     */
    async getById(commentId) {
        try {
            const commentRow = await postgresInstance('Comment').where({commentId}).first();
            return Comment.fromDbRow(commentRow);
        } catch (error) {
            console.error(`Error finding comment by ID (${commentId}):`, error);
            throw error;
        }
    }

    /**
     * Creates a new comment record in the database.
     * NOTE: The Post.commentCount is updated via DB trigger.
     * @param {Comment} comment - The Comment instance to create (commentId, createdAt, updatedAt, voteCount, isRemoved are ignored).
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<Comment>} The newly created Comment instance with DB-generated values.
     */
    async create(comment, trx = null) {
        const queryBuilder = trx || postgresInstance;
        // Exclude fields managed by DB defaults or triggers
        const {
            commentId, createdAt, updatedAt, voteCount, isRemoved,
            ...insertData
        } = comment;

        // Ensure required fields are present
        if (!insertData.postId || !insertData.body) {
            throw new Error('Missing required fields for comment creation: postId and body.');
        }

        try {
            const insertedRows = await queryBuilder('Comment').insert(insertData).returning('*');

            if (!Array.isArray(insertedRows) || insertedRows.length === 0) {
                console.error('Comment creation failed or did not return expected data.', insertedRows);
                throw new Error('PostgresDB error during comment creation: No data returned.');
            }
            // The trigger 'update_post_comment_count_ins' will have fired AFTER this insert.
            return Comment.fromDbRow(insertedRows[0]);
        } catch (error) {
            console.error('Error creating comment:', error);
            if (error.code === '23503') { // PostgreSQL foreign key violation
                const specificError = new Error(`Cannot create comment: The specified post (ID: ${insertData.postId}) or parent comment (ID: ${insertData.parentCommentId || 'N/A'}) may not exist.`);
                specificError.statusCode = 400;
                throw specificError;
            }
            throw error;
        }
    }

    /**
     * Updates an existing comment.
     * @param {string} commentId - The ID of the comment to update.
     * @param {Partial<Pick<Comment, 'body' | 'isRemoved'>>} updateData - An object containing allowed fields to update (body, isRemoved).
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<Comment | null>} The updated Comment instance, or null if not found.
     */
    async update(commentId, updateData, trx = null) {
        const queryBuilder = trx || postgresInstance;
        const allowedUpdates = {};
        if (updateData.body !== undefined) {
            allowedUpdates.body = updateData.body;
        }
        if (updateData.isRemoved !== undefined) {
            allowedUpdates.isRemoved = updateData.isRemoved;
        }
        // Note: updatedAt is handled by the trigger_set_timestamp trigger

        if (Object.keys(allowedUpdates).length === 0) {
            console.warn(`Comment update called for ID ${commentId} with no valid fields to update.`);
            return this.getById(commentId); // Return current state
        }

        try {
            const updatedRows = await queryBuilder('Comment')
                .where({commentId})
                .update(allowedUpdates)
                .returning('*');

            if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
                return null; // Indicate comment not found
            }
            return Comment.fromDbRow(updatedRows[0]);
        } catch (error) {
            console.error(`Error updating comment (${commentId}):`, error);
            throw error;
        }
    }

    /**
     * Deletes a comment by its ID. Use soft softDelete (setting isRemoved=true) generally.
     * This method performs a HARD softDelete.
     * NOTE: The Post.commentCount is decremented via DB trigger.
     * @param {string} commentId - The ID of the comment to softDelete.
     * @param {import('knex').Knex.Transaction | null} [trx=null] - Optional Knex transaction object.
     * @returns {Promise<number>} The number of rows deleted (0 or 1).
     */
    async softDelete(commentId, trx = null) {
        const queryBuilder = trx || postgresInstance;
        try {
            // Update the body and authorUserId to null
            return await queryBuilder('Comment').where({commentId}).update({
                body: null,
                authorUserId: null,
            });
        } catch (error) {
            console.error(`Error hard deleting comment (${commentId}):`, error);
            throw error;
        }
    }

    /**
     * Finds comments belonging to a specific post, optionally paginated and sorted.
     * Does not handle fetching nested replies automatically here.
     * @param {string} postId - The UUID of the post.
     * @param {{limit?: number, offset?: number, sortBy?: 'createdAt' | 'voteCount', order?: 'asc' | 'desc', includeRemoved?: boolean, topLevelOnly?: boolean}} [options={}] - Pagination, sorting, and filtering options.
     * @returns {Promise<Comment[]>} An array of Comment instances.
     */
    async getByPost(postId, options = {}) {
        const {
            limit = 50,
            offset = 0,
            sortBy = 'createdAt',
            order = 'asc',
            includeRemoved = false,
            topLevelOnly = false
        } = options;
        const validSortBy = ['createdAt', 'voteCount'].includes(sortBy) ? sortBy : 'createdAt';
        const validOrder = ['asc', 'desc'].includes(order) ? order : 'asc'; // Default to chronological

        try {
            let query = postgresInstance('Comment').where({postId});

            if (!includeRemoved) {
                query = query.andWhere({isRemoved: false});
            }
            if (topLevelOnly) {
                query = query.andWhere({parentCommentId: null});
            }

            const commentRows = await query
                .orderBy(validSortBy, validOrder)
                .limit(limit)
                .offset(offset);

            return commentRows.map(Comment.fromDbRow);
        } catch (error) {
            console.error(`Error finding comments by post (${postId}):`, error);
            throw error;
        }
    }

    /**
     * Finds direct replies to a specific parent comment.
     * @param {string} parentCommentId - The UUID of the parent comment.
     * @param {{limit?: number, offset?: number, sortBy?: 'createdAt' | 'voteCount', order?: 'asc' | 'desc', includeRemoved?: boolean}} [options={}] - Pagination and sorting options.
     * @returns {Promise<Comment[]>} An array of Comment instances.
     */
    async getReplies(parentCommentId, options = {}) {
        const {limit = 20, offset = 0, sortBy = 'createdAt', order = 'asc', includeRemoved = false} = options;
        const validSortBy = ['createdAt', 'voteCount'].includes(sortBy) ? sortBy : 'createdAt';
        const validOrder = ['asc', 'desc'].includes(order) ? order : 'asc';

        try {
            let query = postgresInstance('Comment').where({parentCommentId});

            if (!includeRemoved) {
                query = query.andWhere({isRemoved: false});
            }

            const commentRows = await query
                .orderBy(validSortBy, validOrder)
                .limit(limit)
                .offset(offset);

            return commentRows.map(Comment.fromDbRow);
        } catch (error) {
            console.error(`Error finding replies for comment (${parentCommentId}):`, error);
            throw error;
        }
    }

    /**
     * Finds comments authored by a specific user, optionally paginated and sorted.
     * @param {string} authorUserId - The UUID of the author (RegisteredUser).
     * @param {{limit?: number, offset?: number, sortBy?: 'createdAt', order?: 'desc', includeRemoved?: boolean}} [options={}] - Pagination and sorting options.
     * @returns {Promise<Comment[]>} An array of Comment instances.
     */
    async getByAuthor(authorUserId, options = {}) {
        const {limit = 25, offset = 0, sortBy = 'createdAt', order = 'desc', includeRemoved = false} = options;
        const validSortBy = ['createdAt', 'voteCount'].includes(sortBy) ? sortBy : 'createdAt';
        const validOrder = ['asc', 'desc'].includes(order) ? order : 'desc';

        try {
            let query = postgresInstance('Comment').where({authorUserId});

            if (!includeRemoved) {
                query = query.andWhere({isRemoved: false});
            }

            const commentRows = await query
                .orderBy(validSortBy, validOrder)
                .limit(limit)
                .offset(offset);

            return commentRows.map(Comment.fromDbRow);
        } catch (error) {
            console.error(`Error finding comments by author (${authorUserId}):`, error);
            throw error;
        }
    }

    async getAllCommentsForPost(postId) {
        try {
            const commentRows = await postgresInstance('Comment').where({postId});
            return commentRows.map(Comment.fromDbRow);
        } catch (error) {
            console.error(`Error finding all comments for post (${postId}):`, error);
            throw error;
        }
    }
}

export default new CommentDAO();