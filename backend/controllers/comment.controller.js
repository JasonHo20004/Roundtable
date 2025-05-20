// backend/controllers/comment.controller.js
import commentService from '#services/comment.service.js';
import voteService from '#services/vote.service.js';
import notificationService from '#services/notification.service.js'; // Keep import
import HTTP_STATUS from '#constants/http-status.js';
import {BadRequestError, ConflictError, InternalServerError, NotFoundError} from "#errors/AppError.js";

class CommentController {
    /**
     * Constructor for CommentController.
     * @param {CommentService} injectedCommentService - Service for comment operations.
     * @param {VoteService} injectedVoteService - Service for vote operations.
     * @param {NotificationService} injectedNotificationService - Service for notification operations.
     */
    constructor(injectedCommentService, injectedVoteService, injectedNotificationService) {
        this.commentService = injectedCommentService;
        this.voteService = injectedVoteService;
        this.notificationService = injectedNotificationService;
    }

    getComments = async (req, res) => {
        try {
            const {order, sortBy, limit, offset, ...filterBy} = req.query;
            const {userId} = req.session;
            const comments = await this.commentService.getComments(userId, {
                filterBy,
                order,
                sortBy,
                limit,
                offset
            });
            return res.status(HTTP_STATUS.OK).json({success: true, data: {comments}});
        } catch (error) {
            console.error(`[CommentController:getComments] Error for postId ${req.params?.postId}:`, error.message);
            // ... (error handling as before) ...
            if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while getting comments.'
            });
        }
    }

    /**
     * Handles POST /posts/:postId/comments
     * Adds a top-level comment to a post.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    addComment = async (req, res) => {
        try {
            const {postId} = req.params;
            const {body} = req.body;
            const {userId} = req.session;

            const newComment = await this.commentService.createComment(postId, userId, body);

            // Trigger notification using the correct service method name
            try {
                // *** CHANGE HERE: Use notifyNewCommentOrReply ***
                await this.notificationService.notifyNewCommentOrReply(newComment, userId);
            } catch (notificationError) {
                console.error(`[CommentController:addComment] Notification failed for comment ${newComment.commentId}:`, notificationError);
            }

            return res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Comment created successfully',
                data: {comment: newComment},
            });
        } catch (error) {
            console.error(`[CommentController:addComment] Error for postId ${req.params?.postId}:`, error.message);
            // ... (error handling as before) ...
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while adding the comment.'
            });
        }
    }

    /**
     * Handles POST /comments/:commentId/replies
     * Adds a reply to an existing comment.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    replyToComment = async (req, res) => {
        try {
            const {commentId} = req.params; // Parent comment ID
            const {body} = req.body;
            const {userId} = req.session;

            const newReply = await this.commentService.createReply(commentId, userId, body);

            // Trigger notification using the correct service method name
            try {
                await this.notificationService.notifyNewCommentOrReply(newReply, userId);
            } catch (notificationError) {
                console.error(`[CommentController:replyToComment] Notification failed for reply ${newReply.commentId}:`, notificationError);
            }

            return res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Reply created successfully',
                data: {comment: newReply},
            });
        } catch (error) {
            console.error(`[CommentController:replyToComment] Error for parent commentId ${req.params?.commentId}:`, error.message);
            // ... (error handling as before) ...
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while creating the reply.'
            });
        }
    }

    /**
     * Handles POST /comments/:commentId/vote
     * Casts, updates, or removes a vote on a specific comment. Requires authentication.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    castVote = async (req, res) => {
        try {
            const {commentId} = req.params;
            const {voteType} = req.body;
            const {userId} = req.session;

            if (!userId) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({success: false, message: 'Authentication required.'});
            }

            const result = await this.voteService.castVote(userId, null, commentId, voteType);

            let responseStatus;
            switch (result.status) {
                case 'created':
                    responseStatus = HTTP_STATUS.CREATED;
                    break;
                case 'updated':
                case 'deleted':
                    responseStatus = HTTP_STATUS.OK;
                    break;
                default:
                    responseStatus = HTTP_STATUS.OK;
            }

            return res.status(responseStatus).json({
                success: true,
                message: result.message,
                data: {vote: result.vote}
            });
        } catch (error) {
            console.error(`[CommentController:castVote] Error for commentId ${req.params?.commentId}:`, error.message);
            // ... (error handling as before) ...
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            if (error instanceof ConflictError) {
                return res.status(HTTP_STATUS.CONFLICT).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while casting the vote.'
            });
        }
    }

    updateComment = async (req, res) => {
        try {
            const {commentId} = req.params;
            const {body} = req.body;

            console.log('dwadawfawdawdawdwaddwa')

            const updatedComment = await this.commentService.updateComment(commentId, body);

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Comment updated successfully.',
                data: {comment: updatedComment}
            });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof ConflictError) {
                return res.status(HTTP_STATUS.CONFLICT).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred.'
            });
        }
    }

    deleteComment = async (req, res) => {
        try {
            const {commentId} = req.params;

            const deletedComment = await this.commentService.deleteComment(commentId);

            if (!deletedComment) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: 'Comment not found.'});
            }
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Comment deleted successfully.',
                data: {comment: deletedComment}
            });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred.'
            });
        }
    }
}

// Ensure all three services are injected when creating the instance
export default new CommentController(commentService, voteService, notificationService);