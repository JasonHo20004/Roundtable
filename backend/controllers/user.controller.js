import HTTP_STATUS from '#constants/http-status.js';
import userService from '#services/user.service.js';
import {BadRequestError, InternalServerError} from '#errors/AppError.js';

class UserController {
    constructor(
        userService
    ) {
        this.userService = userService;
    }
    /**
     * Handles GET /users/search
     * Searches users based on q parameters
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    searchUsers = async (req, res) => {
        try {
            const {q, limit = 5} = req.query;

            if (!q) {
                throw new BadRequestError('Search q is required');
            }

            const searchResults = await this.userService.searchUsers({
                q,
                limit: parseInt(limit)
            });

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                data: searchResults
            });
        } catch (error) {
            console.error('[UserController:searchUsers] Error:', error.message);
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while searching users.'
            });
        }
    };

    getUserProfile = async (req, res) => {
        try {
            const {userId} = req.params;
            const userProfile = await this.userService.getUserProfile(userId);
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                data: userProfile
            });
        } catch (error) {
            console.error('[UserController:getUserProfile] Error:', error.message);
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while fetching user profile.'
            });
        }
    }
    getUserMedia = async (req, res) => {
        try {
            const {userId, mediaId} = req.params;
            console.log('Fetching subtable media with ID:', mediaId);
            const userMedia = await this.userService.getUserMedia(mediaId);
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                data: userMedia
            });
        } catch (error) {
            console.error('[UserController:getUserMedia] Error:', error.message);
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while fetching user media.'
            });
        }
    };
}

export default new UserController(userService);