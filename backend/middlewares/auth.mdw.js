// src/middlewares/auth.mdw.js
import HTTP_STATUS from '#constants/http-status.js';
import commentService from "#services/comment.service.js";
import {BadRequestError, ForbiddenError, NotFoundError} from "#errors/AppError.js";
import voteService from "#services/vote.service.js";

/**
 * Middleware to ensure the user is NOT authenticated.
 * If authenticated, redirects or sends an error.
 */
export const isNotAuthenticated = (req, res, next) => {
    if (req.session && req.session.principalId) {
        console.log('[Middleware/isNotAuthenticated] Denying access: User already logged in (userId:', req.session.userId, ')');
        return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: 'You are already logged in.',
        });
    }
    next();
};

/**
 * Middleware to ensure the user IS authenticated.
 * If not authenticated, redirects or sends an error.
 */
export const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.principalId) {
        console.log('[Middleware/isAuthenticated] Access granted for userId:', req.session.userId);
        return next();
    }
    // User is not authenticated
    console.log('[Middleware/isAuthenticated] Denying access: No active session found.');
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required. Please log in.',
    });
};

/**
 * Middleware to check vote ownership before proceeding with update/delete.
 * Attaches the verified vote object to `req.vote` for subsequent handlers.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const checkVoteOwnership = async (req, res, next) => {
    const {voteId} = req.params;
    const {userId} = req.session; // Assumes isAuthenticated middleware ran first

    if (!userId) { // Should be caught by isAuthenticated, but good practice
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({success: false, message: 'Authentication required.'});
    }

    try {
        // Call the service method to check ownership
        req.vote = await voteService.checkVoteOwnership(voteId, userId); // Attach the vote object for potential use in next handler
        next(); // Proceed to the actual update/delete controller method
    } catch (error) {
        console.error(`[VoteOwnershipMiddleware] Error for vote ${voteId}, user ${userId}:`, error.message);
        if (error instanceof NotFoundError) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
        }
        if (error instanceof ForbiddenError) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({success: false, message: error.message});
        }
        if (error instanceof BadRequestError) { // e.g., missing voteId/userId passed to service
            return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
        }
        // Handle unexpected errors from the service check
        console.error(error.stack || error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error verifying vote ownership.'
        });
    }
};

/**
 * Middleware to check comment ownership before proceeding with update/delete.
 * Attaches the verified comment object to `req.comment` for subsequent handlers.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const checkCommentOwnership = async (req, res, next) => {
    const {commentId} = req.params;
    const {userId} = req.session;
    if (!commentId || !userId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: 'Invalid comment ID or user ID.'});
    }

    try {
        req.comment = await commentService.checkCommentOwnership(commentId, userId);
        next();
    } catch (error) {
        console.error(`[checkCommentOwnershipMiddleware] Error checking comment ownership:`, error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An unexpected error occurred while checking comment ownership.'
        });
    }
};
