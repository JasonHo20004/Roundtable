// services/comment.service.js

// --- Imports ---
import commentDao from "#daos/comment.dao.js";
import userCommentDetailsDao from "#daos/user-comment-details.dao.js";
import voteDap from "#daos/vote.dao.js";
import Comment from "#models/comment.model.js";
import {postgresInstance} from "#db/postgres.js";
import {AppError, BadRequestError, ForbiddenError, InternalServerError, NotFoundError,} from "#errors/AppError.js"; // Import necessary error types
import eventBus from '#core/event-bus.js';


class CommentService {
    /**
     * Constructor for CommentService.
     * @param {object} commentDao - Data Access Object for comments.
     * @param {object} userCommentDetailsDao - Data Access Object for user comment details.
     * @param {object} voteDao - Data Access Object for votes.
     * @param {object} eventBus - EventBus instance for emitting events.
     */
    constructor(commentDao, userCommentDetailsDao, voteDao, eventBus) {

        this.commentDao = commentDao;
        this.userCommentDetailsDao = userCommentDetailsDao;
        this.voteDao = voteDao;
        this.eventBus = eventBus;
    }

    async getComments(userId, {filterBy, sortBy, order, limit, offset}) {
        const comments = await this.userCommentDetailsDao.getComments({filterBy, sortBy, order, limit, offset});

        if (!userId) {
            return comments;
        }

        return await Promise.all(
            comments.map(async (comment) => {
                const vote = await this.voteDao.getByUserAndComment(userId, comment.commentId);
                return {
                    ...comment,
                    userVote: vote ? {
                        voteType: vote.voteType,
                        createdAt: vote.createdAt,
                        updatedAt: vote.updatedAt
                    } : null
                };
            })
        );
    }

    /**
     * Creates a top-level comment on a post.
     * @param {string} postId - The ID of the post being commented on.
     * @param {string} userId - The ID of the user creating the comment.
     * @param {string} body - The content of the comment.
     * @returns {Promise<Comment>} The newly created comment object.
     * @throws {BadRequestError} If required fields are missing.
     * @throws {InternalServerError} For unexpected database errors.
     */
    async createComment(postId, userId, body) {
        // Input validation
        if (!postId || !userId || !body) {
            throw new BadRequestError("Post ID, User ID, and comment body are required.");
        }

        console.log(`[CommentService] Attempting to create comment: postId=${postId}, userId=${userId}`);

        try {
            const createdComment = await postgresInstance.transaction(async (trx) => {
                // Create a Comment model instance
                // parentCommentId is null for top-level comments
                const comment = new Comment(null, postId, userId, null, body);
                console.log("[CommentService] Creating comment model:", comment);
                // Use the injected DAO instance
                const newComment = await this.commentDao.create(comment, trx);
                if (!newComment) {
                    // This shouldn't happen in a transaction if DAO is correct, but good failsafe
                    throw new InternalServerError("Failed to create comment record in transaction.");
                }
                return newComment;
            });

            console.log(`[CommentService] Comment created successfully: commentId=${createdComment.commentId}`);

            // Trigger notification event after successful transaction commit
            this.eventBus.emitEvent('comment.created', {
                comment: createdComment,
                commenterUserId: userId,
            });
            console.log(`[CommentService] Emitted 'comment.created' event for commentId=${createdComment.commentId}`);

            // Return the created comment
            return createdComment;

        } catch (error) {
            console.error("[CommentService] Error creating comment:", error);
            // Re-throw known errors, wrap unknown ones
            if (error instanceof AppError) {
                throw error;
            }
            throw new InternalServerError("An error occurred while creating the comment.");
        }
    }

    /**
     * Creates a reply to an existing comment.
     * @param {string} parentCommentId - The ID of the comment being replied to.
     * @param {string} userId - The ID of the user creating the reply.
     * @param {string} body - The content of the reply.
     * @returns {Promise<Comment>} The newly created reply (comment) object.
     * @throws {BadRequestError} If required fields are missing.
     * @throws {NotFoundError} If the parent comment doesn't exist.
     * @throws {InternalServerError} For unexpected database errors.
     */
    async createReply(parentCommentId, userId, body) {
        // Input validation
        if (!parentCommentId || !userId || !body) {
            throw new BadRequestError("Parent Comment ID, User ID, and reply body are required.");
        }

        console.log(`[CommentService] Attempting to create reply: parentCommentId=${parentCommentId}, userId=${userId}`);

        try {
            // Check if the parent comment exists *before* starting the transaction
            // Use the injected DAO instance
            const parentComment = await this.commentDao.getById(parentCommentId);
            if (!parentComment) {
                throw new NotFoundError(`Parent comment with ID ${parentCommentId} not found.`);
            }
            // Ensure parent comment has a postId (should always be true if data is consistent)
            if (!parentComment.postId) {
                console.error(`[CommentService] Parent comment ${parentCommentId} is missing postId.`);
                throw new InternalServerError("Parent comment data is inconsistent.");
            }
            const createdReply = await postgresInstance.transaction(async (trx) => {
                // Create a Comment model instance for the reply
                // postId is inherited from the parent comment
                const reply = new Comment(null, parentComment.postId, userId, parentCommentId, body);
                console.log("[CommentService] Creating reply model:", reply);
                // Use the injected DAO instance
                const newReply = await this.commentDao.create(reply, trx);
                if (!newReply) {
                    throw new InternalServerError("Failed to create reply record in transaction.");
                }
                return newReply;
            });

            console.log(`[CommentService] Reply created successfully: commentId=${createdReply.commentId}`);

            // Trigger notification event after successful transaction commit
            // The event listener (e.g., in NotificationService) handles notifying the parent comment author AND the original post author if different
            this.eventBus.emitEvent('comment.replied', { // Use a distinct event for replies if needed
                reply: createdReply,
                parentComment: parentComment, // Include parent comment info
                replierUserId: userId,
            });

            console.log(`[CommentService] Emitted 'comment.replied' (or 'comment.created') event for replyId=${createdReply.commentId}`);


            // Return the created reply
            return createdReply;

        } catch (error) {
            console.error("[CommentService] Error creating reply:", error);
            // Re-throw known errors, wrap unknown ones
            if (error instanceof AppError) {
                throw error;
            }
            throw new InternalServerError("An error occurred while creating the reply.");
        }
    }

    async updateComment(commentId, body) {
        if (!commentId || !body) {
            throw new BadRequestError("Invalid input parameters.");
        }
        try {
            return await postgresInstance.transaction(async (trx) => {
                const updatedComment = await this.commentDao.update(commentId, {body}, trx);

                if (!updatedComment) {
                    throw new NotFoundError("Comment not found.");
                }
                return updatedComment;
            });
        } catch (error) {
            console.error("[CommentService] Error updating comment:", error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new InternalServerError("An error occurred while updating the comment.");
        }
    }

    async deleteComment(commentId) {
        if (!commentId) {
            throw new BadRequestError("Invalid input parameters.");
        }
        try {
            return await postgresInstance.transaction(async (trx) => {
                const deletedComment = await this.commentDao.softDelete(commentId, trx);

                if (!deletedComment) {
                    throw new NotFoundError("Comment not found.");
                }
                return deletedComment;
            });
        } catch (error) {
            console.error("[CommentService] Error deleting comment:", error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new InternalServerError("An error occurred while deleting the comment.");
        }
    }

    async checkCommentOwnership(commentId, userId) {
        if (!commentId || !userId) {
            throw new BadRequestError("Invalid input parameters.");
        }
        try {
            const comment = await this.commentDao.getById(commentId);
            if (!comment) {
                throw new NotFoundError("Comment not found.");
            }
            if (comment.authorUserId !== userId) {
                throw new ForbiddenError("You are not authorized to update this comment.");
            }
            return comment;
        } catch (error) {
            console.error("[CommentService] Error checking comment ownership:", error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new InternalServerError("An error occurred while checking comment ownership.");
        }

    }
}

export default new CommentService(commentDao, userCommentDetailsDao, voteDap, eventBus);
