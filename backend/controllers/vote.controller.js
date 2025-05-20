// backend/controllers/vote.controller.js
import HTTP_STATUS from '#constants/http-status.js';
import voteService from '#services/vote.service.js';
import {BadRequestError, ForbiddenError, InternalServerError, NotFoundError} from "#errors/AppError.js";

class VoteController {
    /**
     * @param {VoteService} injectedVoteService
     */
    constructor(injectedVoteService) {
        this.voteService = injectedVoteService;
    }


    /**
     * Handles GET /votes
     * Retrieves all votes for the authenticated user.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    getVotedItems = async (req, res) => {
        try {
            const {
                voterUserId, // User whose voted items we want to see
                voteType,    // 'UPVOTE' or 'DOWNVOTE' (case-insensitive from query)
                itemType,    // Optional: 'posts', 'comments', 'mixed'
                sortBy,      // Optional: 'voteCreatedAt', 'itemCreatedAt', 'itemVoteCount', 'itemTitle'
                order        // Optional: 'asc', 'desc'
            } = req.query;

            if (!voterUserId) {
                throw new BadRequestError('Query parameter "voterUserId" is required.');
            }
            if (!voteType) {
                throw new BadRequestError('Query parameter "voteType" is required.');
            }

            // Validate and normalize voteType
            const normalizedVoteType = voteType.toLowerCase();
            if (normalizedVoteType !== 'upvote' && normalizedVoteType !== 'downvote') {
                throw new BadRequestError('Invalid "voteType". Must be "UPVOTE" or "DOWNVOTE".');
            }

            const serviceOptions = {
                itemType: itemType, // Service/DAO will handle defaults if undefined
                voteType: normalizedVoteType,
                sortBy: sortBy,     // Service/DAO will handle defaults if undefined
                order: order,       // Service/DAO will handle defaults if undefined
                // No pagination parameters as per prior request (service/DAO will fetch all)
            };

            const result = await voteService.getVotedItems(voterUserId, serviceOptions);

            return res.status(200).json({
                success: true,
                message: `Successfully fetched ${normalizedVoteType}d items by user ${voterUserId}.`,
                data: result
            });
        } catch (error) {
            console.error(`[VoteController:getVotedItems] Error for user ${voterUserId}:`, error.message);
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
                message: 'An unexpected error occurred while fetching the votes.'
            });
        }
    }

    /**
     * Handles PATCH /votes/:voteId
     * Updates an existing vote after ownership check.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    updateVote = async (req, res) => {
        const {voteId} = req.params;
        const {userId} = req.session; // From isAuthenticated middleware
        const {voteType} = req.body;
        // Ownership check should have been done by checkVoteOwnershipMiddleware

        try {
            const updatedVote = await this.voteService.updateVote(voteId, userId, voteType);
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Vote updated successfully.",
                data: updatedVote
            });
        } catch (error) {
            console.error(`[VoteController:updateVote] Error for vote ${voteId}:`, error.message);
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            // Service's updateVote already handles NotFound/Forbidden from checkVoteOwnership
            if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            if (error instanceof ForbiddenError) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while updating the vote.'
            });
        }
    }

    /**
     * Handles DELETE /votes/:voteId
     * Deletes an existing vote after ownership check.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    deleteVote = async (req, res) => {
        const {voteId} = req.params;
        const {userId} = req.session;
        // Ownership check should have been done by checkVoteOwnershipMiddleware

        try {
            await this.voteService.deleteVote(voteId, userId);
            // Successful deletion, return No Content or OK with a message
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: "Vote deleted successfully."
                // data: null // Or omit data field
            });
            // Or: return res.status(HTTP_STATUS.NO_CONTENT).send();
        } catch (error) {
            console.error(`[VoteController:deleteVote] Error for vote ${voteId}:`, error.message);
            // Service's deleteVote already handles NotFound/Forbidden from checkVoteOwnership
            if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            if (error instanceof ForbiddenError) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({success: false, message: error.message});
            }
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while deleting the vote.'
            });
        }
    }

    // Note: The castVote logic might live in PostController and CommentController,
    // calling voteService.castVote. If you have a dedicated POST /votes route,
    // you would add a controller method here for it.
    /**
     * Handles POST /votes (Example if you have a dedicated route)
     * Casts a new vote or updates/deletes an existing one.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    // castVote = async (req, res) => {
    //     const { userId } = req.session;
    //     const { postId, commentId, voteType } = req.body;
    //     try {
    //         const result = await this.voteService.castVote(userId, postId, commentId, voteType);
    //         const status = result.status === 'deleted' ? HTTP_STATUS.OK : // Or NO_CONTENT
    //                        result.status === 'updated' ? HTTP_STATUS.OK :
    //                        HTTP_STATUS.CREATED; // Default to CREATED for new votes
    //         return res.status(status).json({
    //             success: true,
    //             message: result.message,
    //             data: { vote: result.vote } // vote is null if deleted
    //         });
    //     } catch (error) {
    //         // Handle BadRequestError, NotFoundError (for post/comment), ConflictError (rarely, from DAO), InternalServerError
    //     }
    // }
}

// Inject service dependency
export default new VoteController(voteService);
