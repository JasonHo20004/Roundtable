// backend/controllers/post.controller.js
import postService from '#services/post.service.js';
import voteService from "#services/vote.service.js"; // Ensure voteService is imported and injected
import HTTP_STATUS from '#constants/http-status.js';
import {BadRequestError, ConflictError, ForbiddenError, InternalServerError, NotFoundError} from '#errors/AppError.js';

class PostController {
    /**
     * Constructor for PostController.
     * @param {PostService} injectedPostService - Service for post operations.
     * @param {VoteService} injectedVoteService - Service for vote operations.
     */
    constructor(injectedPostService, injectedVoteService) {
        this.postService = injectedPostService;
        this.voteService = injectedVoteService; // Make sure VoteService is injected
    }

    getPosts = async (req, res) => {
        try {
            const {order, sortBy, limit, offset, ...filterBy} = req.query;
            const {userId} = req.session; // Can be null if user is not logged in

            const posts = await this.postService.getPosts(userId, {
                filterBy,
                sortBy,
                order,
                limit,
                offset,
            });

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                data: {posts},
            });
        } catch (error) {
            console.error('[PostController:getPosts] Error:', error.message);
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while fetching posts.'
            });
        }
    }

    /**
     * Handles GET /posts/:postId
     * Retrieves and returns post details as JSON.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    getPostDetails = async (req, res) => {
        try {
            const {postId} = req.params;
            // userId can be null if user is not logged in, service handles this
            const {userId} = req.session;

            const viewData = await this.postService.getPostDetails(postId, userId);
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                data: viewData
            });
        } catch (error) {
            console.error(`[PostController:getPostDetails] Error for postId ${req.params?.postId}:`, error.message);
            if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
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
                message: 'An unexpected error occurred while fetching post details.'
            });
        }
    };

    /**
     * Handles POST /posts/
     * Creates a new post. Requires authentication.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    createPost = async (req, res) => {
        try {
            const {subtableId, title, body} = req.body;
            const {userId} = req.session; // Assuming isAuthenticated middleware ran

            // Redundant check if middleware is used, but safe
            if (!userId) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({success: false, message: 'Authentication required.'});
            }

            const newPost = await this.postService.createPost(userId, {subtableId, title, body});
            return res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Post created successfully.',
                data: newPost
            });
        } catch (error) {
            console.error(`[PostController:createPost] Error:`, error.message);
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof NotFoundError) { // e.g., subtable or authorUser not found
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            if (error instanceof ForbiddenError) { // e.g., user not subscribed
                return res.status(HTTP_STATUS.FORBIDDEN).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while creating the post.'
            });
        }
    };

    /**
     * Handles POST /posts/:postId/vote
     * Casts, updates, or removes a vote on a specific post. Requires authentication.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    castVote = async (req, res) => {
        try {
            const {postId} = req.params;
            const {voteType} = req.body;
            const {userId} = req.session; // Assuming isAuthenticated ran

            if (!userId) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({success: false, message: 'Authentication required.'});
            }

            // Call the refactored service method
            // Pass null for commentId when voting on a post
            const result = await this.voteService.castVote(userId, postId, null, voteType);

            // Determine HTTP status based on the action taken by the service
            let responseStatus;
            switch (result.status) {
                case 'created':
                    responseStatus = HTTP_STATUS.CREATED;
                    break;
                case 'updated':
                case 'deleted': // Even if deleted, the request was successful (OK)
                    responseStatus = HTTP_STATUS.OK;
                    break;
                default: // Should not happen, but default to OK
                    responseStatus = HTTP_STATUS.OK;
            }

            return res.status(responseStatus).json({
                success: true,
                message: result.message,
                data: {vote: result.vote} // vote is the created/updated vote object, or null if deleted
            });
        } catch (error) {
            console.error(`[PostController:castVote] Error for postId ${req.params?.postId}:`, error.message);
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof NotFoundError) { // e.g., post not found
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            if (error instanceof ConflictError) { // Should be rare if logic is correct, but possible from DB
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
    updatePost = async (req, res) => {
        console.log("PostController:updatePost", req.body);
        try {
            const {postId} = req.params;
            const {body} = req.body;
            const {userId} = req.session; // Assuming isAuthenticated ran
            console.log("PostController:updatePostccccc", postId, body);

            if (!userId) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({success: false, message: 'Authentication required.'});
            }

            const updatedPost = await this.postService.updatePost(postId, {body});
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Post updated successfully.',
                data: updatedPost
            });
        } catch (error) {
            console.error(`[PostController:updatePost] Error for postId ${req.params?.postId}:`, error.message);
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof NotFoundError) { // e.g., post not found
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            if (error instanceof ForbiddenError) { // e.g., user not authorized to update
                return res.status(HTTP_STATUS.FORBIDDEN).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while updating the post.'
            });
        }
    };

    /**
     * Handles GET /posts/search
     * Searches posts based on q parameters
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    searchPosts = async (req, res) => {
        try {
            const {q, subtableId, sortBy = 'relevance', time = 'all', limit = 10, offset = 0} = req.query;
            const { userId } = req.session; // Can be null if user is not logged in

            console.log('[PostController:searchPosts] Query:', req.query);

            if (!q) {
                throw new BadRequestError('Search q is required');
            }

            const searchResults = await this.postService.searchPosts({
                q,
                subtableId,
                sortBy,
                time,
                limit: parseInt(limit),
                offset: parseInt(offset),
                userId
            });

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                data: searchResults
            });
        } catch (error) {
            console.error('[PostController:searchPosts] Error:', error.message);
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while searching posts.'
            });
        }
    };

    /**
     * Handles GET /posts/recent
     * Retrieves and returns recent posts as JSON.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    getRecentPosts = async (req, res) => {
        try {
            const {userId} = req.session;
            const {limit = 10} = req.query;

            const posts = await this.postService.getRecentPosts(parseInt(limit), userId);
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                data: posts
            });
        } catch (error) {
            console.error('[PostController:getRecentPosts] Error:', error.message);
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while fetching recent posts.'
            });
        }
    };

    /**
     * Handles POST /posts/by-ids
     * Retrieves multiple posts by their IDs.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    getPostsByIds = async (req, res) => {
        try {
            const {postIds} = req.body;
            const {userId} = req.session;

            if (!Array.isArray(postIds)) {
                throw new BadRequestError('postIds must be an array');
            }

            const posts = await this.postService.getPostsByIds(postIds, userId);
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                data: posts
            });
        } catch (error) {
            console.error('[PostController:getPostsByIds] Error:', error.message);
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while fetching posts.'
            });
        }
    };
    deletePost = async (req, res) => {
        console.log("PostController:deletePost", req.body);
        try {
            const {postId} = req.params;
            const {body,authorUserId} = req.body;
            const {userId} = req.session; // Assuming isAuthenticated ran

            if (!userId) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({success: false, message: 'Authentication required.'});
            }

            const deletedPost = await this.postService.deletePost(postId, {body,authorUserId});
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Post deleted successfully.',
                data: deletedPost
            });
        } catch (error) {
            console.error(`[PostController:deletePost] Error for postId ${req.params?.postId}:`, error.message);
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof NotFoundError) { // e.g., post not found
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            if (error instanceof ForbiddenError) { // e.g., user not authorized to delete
                return res.status(HTTP_STATUS.FORBIDDEN).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while deleting the post.'
            });
        }
    }
}

// Ensure VoteService is injected correctly here
export default new PostController(postService, voteService);