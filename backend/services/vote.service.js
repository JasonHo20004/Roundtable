// backend/services/vote.service.js
import Vote from "#models/vote.model.js";
import {AppError, BadRequestError, ForbiddenError, InternalServerError, NotFoundError} from "#errors/AppError.js";
import {postgresInstance} from "#db/postgres.js";
import voteDAO from "#daos/vote.dao.js";
import userCommentDetailsDao from "#daos/user-comment-details.dao.js";
import userPostDetailsDao from "#daos/user-post-details.dao.js";

class VoteService {
    /**
     * Constructor for VoteService.
     * Accepts the VoteDAO as a dependency.
     * @param {VoteDAO} voteDao - Data Access Object for votes.
     * @param {UserPostDetailsDAO} userPostDetailsDao - Data Access Object for user post details.
     * @param {UserCommentDetailsDAO} userCommentDetailsDao - Data Access Object for user comment details.
     */
    constructor(voteDao, userPostDetailsDao, userCommentDetailsDao) {
        this.voteDao = voteDao;
        this.userCommentDetailsDao = userCommentDetailsDao;
        this.userPostDetailsDao = userPostDetailsDao;
    }

    /**
     * Retrieves all items (posts and/or comments) voted on by a specific user.
     * The response is structured into separate posts and comments arrays, each item including the user's vote.
     *
     * @param {string} userId - The ID of the user whose voted items are to be fetched.
     * @param {Object} [options={}] - Filtering and sorting options.
     * @param {'posts' | 'comments' | 'mixed'} [options.itemType='mixed'] - Type of items to retrieve.
     * @param {'upvote' | 'downvote'} [options.voteType='upvote'] - Filter by vote type.
     * @param {string} [options.sortBy='voteCreatedAt'] - Sort by 'voteCreatedAt', 'itemCreatedAt', 'itemVoteCount', 'itemTitle'.
     * @param {'asc' | 'desc'} [options.order='desc'] - Sort order.
     * @returns {Promise<{data: {posts: Array<PostWithUserVote>, comments: Array<CommentWithUserVote>}, total: number}>}
     * A promise that resolves to the structured data and the total count of vote records.
     * @throws {BadRequestError} If userId is not provided.
     * @throws {AppError} Propagates errors from the DAO layer.
     */
    async getVotedItems(userId, options = {}) {
        if (!userId) {
            throw new BadRequestError("User ID is required to fetch voted items.");
        }

        const voteRefOptions = {
            itemType: options.itemType,
            voteType: options.voteType,
            sortBy: 'voteCreatedAt', // DAO sorts vote references by this for initial fetch
            order: options.order || 'desc',
            limit: null, // Fetch all vote references that match
            offset: 0,
        };

        try {
            const {voteRecords, total} = await this.voteDao.getVotedItemReferences(userId, voteRefOptions);

            if (total === 0 || !voteRecords || voteRecords.length === 0) {
                return {data: {posts: [], comments: []}, total: 0};
            }

            let allDecoratedItems = []; // Temp array to hold items with details before final sort & split
            const resolvedItemTypeFromOptions = this.voteDao._prepareQueryOptions(voteRefOptions).itemType;
            const queriedVoteType = this.voteDao._prepareQueryOptions(voteRefOptions).voteType;


            for (const record of voteRecords) {
                let itemDetail = null;
                let actualItemType = null; // 'post' or 'comment'
                let itemCreatedAt = null;
                let itemVoteCount = 0;
                let itemTitle = null;

                // This is the vote data that caused this item to be in the list
                const userVoteData = {
                    voteType: queriedVoteType,
                    createdAt: record.voteCreatedAt,
                    // No 'updatedAt' available for a Vote record itself from the DB schema
                };

                if (record.postId && (resolvedItemTypeFromOptions === 'posts' || resolvedItemTypeFromOptions === 'mixed')) {
                    itemDetail = await this.userPostDetailsDao.getByPostId(record.postId);
                    if (itemDetail && itemDetail.postId) {
                        actualItemType = 'post';
                        itemCreatedAt = itemDetail.postCreatedAt;
                        itemVoteCount = itemDetail.voteCount;
                        itemTitle = itemDetail.title;
                    }
                } else if (record.commentId && (resolvedItemTypeFromOptions === 'comments' || resolvedItemTypeFromOptions === 'mixed')) {
                    itemDetail = await this.userCommentDetailsDao.getByCommentId(record.commentId);
                    if (itemDetail && itemDetail.commentId) {
                        actualItemType = 'comment';
                        itemCreatedAt = itemDetail.commentCreatedAt;
                        itemVoteCount = itemDetail.voteCount;
                    }
                }

                if (itemDetail && actualItemType) {
                    allDecoratedItems.push({
                        _internalItemType: actualItemType, // Used for splitting later
                        details: itemDetail,
                        userVote: userVoteData,
                        // Hoist properties for sorting
                        _itemCreatedAtSort: itemCreatedAt,
                        _itemVoteCountSort: itemVoteCount,
                        _itemTitleSort: itemTitle,
                        _voteCreatedAtSort: record.voteCreatedAt, // From the vote record itself
                    });
                }
            }

            // Sort all decorated items if a sort criteria other than the default (voteCreatedAt from DAO) is specified
            const sortBy = options.sortBy || 'voteCreatedAt'; // Default to voteCreatedAt if not specified
            const sortOrder = voteRefOptions.order;

            // Note: voteRecords were already sorted by voteCreatedAt.
            // This explicit sort here is for other criteria or to ensure order after async detail fetching if needed.
            allDecoratedItems.sort((a, b) => {
                let valA, valB;
                switch (sortBy) {
                    case 'itemCreatedAt':
                        valA = new Date(a._itemCreatedAtSort);
                        valB = new Date(b._itemCreatedAtSort);
                        break;
                    case 'itemVoteCount':
                        valA = a._itemVoteCountSort;
                        valB = b._itemVoteCountSort;
                        break;
                    case 'itemTitle':
                        valA = a._itemTitleSort || '';
                        valB = b._itemTitleSort || '';
                        if (typeof valA === 'string' && typeof valB === 'string') {
                        } else if (valA && !valB) return sortOrder === 'asc' ? -1 : 1;
                        else if (!valA && valB) return sortOrder === 'asc' ? 1 : -1;
                        else if (!valA && !valB) { // both titles are null/empty (e.g., two comments)
                            valA = new Date(a._voteCreatedAtSort); // fallback to vote time
                            valB = new Date(b._voteCreatedAtSort);
                        }
                        break;
                    case 'voteCreatedAt':
                    default:
                        valA = new Date(a._voteCreatedAtSort);
                        valB = new Date(b._voteCreatedAtSort);
                        break;
                }

                if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                if (typeof valA === 'string' && typeof valB === 'string' && valA !== valB) {
                    return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                }
                return 0;
            });

            // Split into posts and comments arrays
            const votedPosts = [];
            const votedComments = [];

            for (const decoratedItem of allDecoratedItems) {
                const finalPayload = {
                    ...decoratedItem.details, // Spread the actual post/comment details
                    userVote: decoratedItem.userVote,
                };
                if (decoratedItem._internalItemType === 'post') {
                    votedPosts.push(finalPayload);
                } else if (decoratedItem._internalItemType === 'comment') {
                    votedComments.push(finalPayload);
                }
            }

            return {
                posts: votedPosts,
                comments: votedComments,
                total: total, // Total count of original vote records matching the criteria
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            console.error(`[VoteService:getVotedItems] Error for user ${userId} with options ${JSON.stringify(options)}:`, error.message, error.stack);
            throw new InternalServerError("An error occurred while fetching voted items.");
        }
    }

    /**
     * Creates or updates a vote. If a vote by the user on the item exists, it updates the type.
     * If the existing vote type is the same as the new one, it deletes the vote (toggle off).
     * If no vote exists, it creates a new one.
     *
     * @param {string} voterUserId - The ID of the user casting the vote.
     * @param {string|null} postId - The ID of the post being voted on.
     * @param {string|null} commentId - The ID of the comment being voted on.
     * @param {string} voteType - The type of vote ('upvote' or 'downvote').
     * @returns {Promise<object>} Object containing a success message and the final state (created vote, updated vote, or null if deleted).
     * @throws {BadRequestError} If validation fails (missing IDs, invalid type).
     * @throws {NotFoundError} If the post/comment to be voted on doesn't exist (add checks if needed).
     * @throws {InternalServerError} If the database operation fails unexpectedly.
     */
    async castVote(voterUserId, postId, commentId, voteType) {
        // --- Input Validation ---
        if (!voterUserId) {
            throw new BadRequestError("Voter User ID is required.");
        }
        if (!postId && !commentId) {
            throw new BadRequestError("Either postId or commentId must be provided.");
        }
        if (postId && commentId) {
            throw new BadRequestError("Cannot vote on both a post and a comment simultaneously.");
        }
        if (!Vote.isValidVoteType(voteType)) {
            throw new BadRequestError(`Invalid vote type: ${voteType}. Must be 'upvote' or 'downvote'.`);
        }
        // Optional: Add checks here to ensure the postId or commentId actually exists using PostDAO/CommentDAO if necessary.

        let resultMessage = '';
        let resultVote = null;
        let status = 'created'; // Can be 'created', 'updated', 'deleted'

        try {
            await postgresInstance.transaction(async (trx) => {
                // --- Check for Existing Vote ---
                let existingVote = null;
                if (postId) {
                    existingVote = await this.voteDao.getByUserAndPost(voterUserId, postId, trx);
                } else { // commentId must be present due to earlier validation
                    existingVote = await this.voteDao.getByUserAndComment(voterUserId, commentId, trx);
                }

                if (existingVote) {
                    // --- Vote Exists: Update or Delete ---
                    if (existingVote.voteType === voteType) {
                        // Same vote type - toggle off (delete)
                        const deletedCount = await this.voteDao.delete(existingVote.voteId, trx);
                        if (deletedCount > 0) {
                            resultMessage = "Vote removed successfully.";
                            status = 'deleted';
                            // resultVote remains null
                        } else {
                            // Should not happen if findByUserAnd... found it, indicates inconsistency
                            throw new InternalServerError("Failed to remove existing vote.");
                        }
                    } else {
                        // Different vote type - update
                        const updatedVote = await this.voteDao.update(existingVote.voteId, {voteType}, trx);
                        if (updatedVote) {
                            resultMessage = "Vote updated successfully.";
                            resultVote = updatedVote;
                            status = 'updated';
                        } else {
                            // Should not happen if findByUserAnd... found it, indicates inconsistency
                            throw new InternalServerError("Failed to update existing vote.");
                        }
                    }
                } else {
                    // --- Vote Doesn't Exist: Create ---
                    const vote = new Vote(null, voterUserId, postId, commentId, voteType);
                    const createdVote = await this.voteDao.create(vote, trx);
                    if (createdVote) {
                        resultMessage = "Vote cast successfully.";
                        resultVote = createdVote;
                        status = 'created';
                    } else {
                        // Should be caught by DAO error, but safety check
                        throw new InternalServerError("Failed to create new vote record.");
                    }
                }
            }); // End transaction

            return {
                message: resultMessage,
                vote: resultVote,
                status: status
            };

        } catch (error) {
            // Re-throw known application errors
            if (error instanceof AppError) {
                throw error;
            }
            // Wrap unexpected errors
            console.error(`[VoteService:castVote] Error for user ${voterUserId} on ${postId ? `post ${postId}` : `comment ${commentId}`}:`, error);
            throw new InternalServerError("An error occurred while casting the vote.");
        }
    }


    /**
     * Checks if a given user is the owner of a specific vote.
     * @param {string} voteId - The ID of the vote.
     * @param {string} userId - The ID of the user to check ownership against.
     * @returns {Promise<Vote>} The vote object if ownership is verified.
     * @throws {BadRequestError} If voteId or userId is not provided.
     * @throws {NotFoundError} If the vote does not exist.
     * @throws {ForbiddenError} If the user does not own the vote.
     * @throws {InternalServerError} For unexpected errors during data retrieval.
     */
    async checkVoteOwnership(voteId, userId) {
        if (!voteId || !userId) {
            throw new BadRequestError("Vote ID and User ID are required to check vote ownership.");
        }

        try {
            const vote = await this.voteDao.getById(voteId);
            if (!vote) {
                throw new NotFoundError(`Vote with ID ${voteId} not found.`);
            }

            if (vote.voterUserId !== userId) {
                throw new ForbiddenError('You do not have permission to modify this vote.');
            }

            return vote; // Return the vote object on success

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            console.error(`[VoteService:checkVoteOwnership] Error for vote ${voteId}, user ${userId}:`, error);
            throw new InternalServerError("An error occurred while checking vote ownership.");
        }
    }

    /**
     * Updates the type of an existing vote after verifying ownership.
     * @param {string} voteId - The ID of the vote to update.
     * @param {string} userId - The ID of the user requesting the update.
     * @param {string} voteType - The new vote type.
     * @returns {Promise<Vote>} The updated vote object.
     * @throws {BadRequestError} If validation fails.
     * @throws {NotFoundError} If the vote does not exist.
     * @throws {ForbiddenError} If the user does not own the vote.
     * @throws {InternalServerError} If the database operation fails unexpectedly.
     */
    async updateVote(voteId, userId, voteType) {
        // --- Input Validation ---
        if (!voteId || !userId || !voteType) {
            throw new BadRequestError("Vote ID, User ID, and Vote Type are required.");
        }
        if (!Vote.isValidVoteType(voteType)) {
            throw new BadRequestError(`Invalid vote type: ${voteType}. Must be 'upvote' or 'downvote'.`);
        }

        try {
            // --- Update Vote ---
            // Note: Using a transaction isn't strictly necessary here if checkVoteOwnership
            // already confirmed existence, but can be added for consistency.
            const updatedVote = await this.voteDao.update(voteId, {voteType});

            if (!updatedVote) {
                throw new NotFoundError(`Vote with ID ${voteId} not found.`);
            }

            return updatedVote;

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            console.error(`[VoteService:updateVote] Error for vote ${voteId}:`, error);
            throw new InternalServerError("An error occurred while updating the vote.");
        }
    }

    /**
     * Deletes a specific vote by its ID after verifying ownership.
     * @param {string} voteId - The ID of the vote to delete.
     * @param {string} userId - The ID of the user requesting the deletion.
     * @returns {Promise<boolean>} True if deletion was successful.
     * @throws {BadRequestError} If voteId or userId is not provided.
     * @throws {NotFoundError} If the vote does not exist.
     * @throws {ForbiddenError} If the user does not own the vote.
     * @throws {InternalServerError} If the database operation fails unexpectedly.
     */
    async deleteVote(voteId, userId) {
        if (!voteId || !userId) {
            throw new BadRequestError("Vote ID and User ID are required to delete a vote.");
        }

        try {
            // --- Delete Vote ---
            const deletedCount = await this.voteDao.delete(voteId);

            if (deletedCount === 0) {
                // Vote existed during check but couldn't be deleted? Inconsistency.
                throw new InternalServerError(`Failed to delete vote ${voteId} after ownership check.`);
                // Alternatively: throw new NotFoundError(`Vote with ID ${voteId} could not be deleted.`);
            }

            return true; // Indicate successful deletion

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            console.error(`[VoteService:deleteVote] Error for vote ${voteId}:`, error);
            throw new InternalServerError("An error occurred while deleting the vote.");
        }
    }

}

export default new VoteService(voteDAO, userPostDetailsDao, userCommentDetailsDao);