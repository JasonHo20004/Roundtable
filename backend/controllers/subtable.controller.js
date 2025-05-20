// backend/controllers/subtable.controller.js
import HTTP_STATUS from '#constants/http-status.js';
import subtableService from '#services/subtable.service.js';
import {BadRequestError, ConflictError, InternalServerError, NotFoundError} from "#errors/AppError.js"; // Include potential errors from service

class SubtableController {
    /**
     * @param {SubtableService} injectedSubtableService
     */
    constructor(injectedSubtableService) {
        this.subtableService = injectedSubtableService;
    }

    /**
     * Handles GET /s/:subtableName/posts
     * Retrieves posts for a specific subtable.
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     */
    getSubtablePosts = async (req, res) => {
        try {
            const {subtableName} = req.params;
            // Delegate fetching and logic to the service
            const posts = await this.subtableService.getSubtablePosts(subtableName);

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: `Posts for subtable '${subtableName}' fetched successfully.`, // Optional success message
                data: posts // Send the data returned by the service
            });
        } catch (error) {
            console.error(`[SubtableController:getSubtablePosts] Error for ${req.params?.subtableName}:`, error.message);
            if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            // Fallback for truly unexpected errors
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "An unexpected error occurred while fetching subtable posts."
            });
        }
    };

    /**
     * Handles GET /s/:subtableName
     * Retrieves details for a specific subtable.
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     */
    getSubtableDetails = async (req, res) => {
        try {
            const {subtableName} = req.params;
            const subtableDetails = await this.subtableService.getSubtableDetails(subtableName);

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: `Details for subtable '${subtableName}' fetched successfully.`,
                data: subtableDetails
            });
        } catch (error) {
            console.error(`[SubtableController:getSubtableDetails] Error for ${req.params?.subtableName}:`, error.message);
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
                message: "An unexpected error occurred while fetching subtable details."
            });
        }
    };

    /**
     * Handles GET /s/subscribed
     * Retrieves subtables the authenticated user is subscribed to.
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     */
    getSubscribedSubtables = async (req, res) => {
        try {
            const {userId} = req.session; // Assumes isAuthenticated middleware runs first

            const subscribedSubtables = await this.subtableService.getSubscribedSubtables(userId);
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Subscribed subtables fetched successfully.',
                data: subscribedSubtables
            });
        } catch (error) {
            console.error(`[SubtableController:getSubscribedSubtables] Error for userId ${req.session?.userId}:`, error.message);
            if (error instanceof NotFoundError) { // User not found, though unlikely if session is valid
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            if (error instanceof BadRequestError) { // Should not happen if userId is from session
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "An unexpected error occurred while fetching subscribed subtables."
            });
        }
    }

    /**
     * Handles GET /s/search
     * Searches for subtables based on q parameters.
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     */
    searchSubtables = async (req, res) => {
        try {
            const {q, limit, offset} = req.query;
            const searchResults = await this.subtableService.searchSubtables(q, {limit, offset});

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Search completed successfully.',
                data: searchResults
            });
        } catch (error) {
            console.error('[SubtableController:searchSubtables] Error:', error.message);
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
            }
            if (error instanceof InternalServerError) {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "An unexpected error occurred while searching subtables."
            });
        }
    };

    /**
     * Handles POST /s
     * Creates a new subtable.
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     */
    createSubtable = async (req, res) => {
        try {
            //const {name, description, iconFile, bannerFile} = req.body;
            console.log("req:", req.body);
            const {name, description} = req.body;
            console.log("req.files:", req.files);
            const iconFile = req.files?.iconFile?.[0]; // Assuming multer is used for file uploads
            const bannerFile = req.files?.bannerFile?.[0]; // Assuming multer is used for file uploads
            console.log("iconFile:", iconFile);
            console.log("bannerFile:", bannerFile);
            console.log(`[SubtableController:createSubtable] Received request to create subtable with name: ${name}`);
            const {userId} = req.session; // Creator is the logged-in user
            if (!userId) { /* Handle unauthorized */
            }
            const newSubtable = await this.subtableService.createSubtable(userId, {
                name,
                description,
                iconFile,
                bannerFile
            });
            return res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: "Subtable created successfully.",
                data: {
                    subtable: newSubtable
                }
            });
        } catch (error) {
            // Handle BadRequestError, ConflictError, NotFoundError (for user), InternalServerError
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: error.message
                });
            } else if (error instanceof ConflictError) {
                return res.status(HTTP_STATUS.CONFLICT).json({
                    success: false,
                    message: error.message
                });
            } else if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: error.message
                });
            } else {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "An unexpected error occurred."
                });
            }
        }
    }
    /**
     * Handles GET /s/:subtableName/media
     * Retrieves media for a specific subtable.
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     */
    getSubtableMedia = async (req, res) => {
        try {
            const {subtableName,mediaId} = req.params;
            console.log("subtableName:", subtableName);
            console.log("mediaId:", mediaId);
            //const {mediaId} = req.body; // Assuming mediaId is passed as a query parameter
            const media = await this.subtableService.getSubtableMedia(mediaId);

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: `Media for subtable '${subtableName}' fetched successfully.`,
                data: media
            });
        } catch (error) {
            console.error(`[SubtableController:getSubtableMedia] Error for ${req.params?.subtableName}:`, error.message);
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
                message: "An unexpected error occurred while fetching subtable media."
            });
        }
    }

    followSubtable = async (req, res) => {
        try {
            const { subtableId } = req.params;
            const { userId } = req.session;

            const response = await this.subtableService.followSubtable(userId, subtableId);

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Successfully followed the subtable',
                data: response
            });
        } catch (error) {
            console.error('[SubtableController:followSubtable] Error:', error.message);
            if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: error.message
                });
            }
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "An unexpected error occurred while following subtable."
            });
        }
    }

    unfollowSubtable = async (req, res) => {
        try {
            const { subtableId } = req.params;
            const { userId } = req.session;

            const response = await this.subtableService.unfollowSubtable(userId, subtableId);

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Successfully unfollowed the subtable',
                data: response
            });
        } catch (error) {
            console.error('[SubtableController:unfollowSubtable] Error:', error.message);
            if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: error.message
                });
            }
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "An unexpected error occurred while unfollowing subtable."
            });
        }
    }

    getJoinSubtable = async (req, res) => {
        try {
            const { subtableId } = req.params;
            const { userId } = req.session;
            console.log("userIDDD",userId)
            console.log("uuuuuuuuu",subtableId)

            // Check if userId is empty
            if (!userId || userId === undefined) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    message: "User must be logged in to check subscription status",
                    data: {
                        isJoined: false,
                        subscription: null
                    }
                });
            }


            const response = await this.subtableService.getJoinSubtable(userId, subtableId);
            console.log(response)

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: response.isJoined 
                ? 'User is subscribed to this subtable' 
                : 'User is not subscribed to this subtable',
                data: response
            });
        } catch (error) {
            console.error('[SubtableController:getJoinSubtable] Error:', error.message);
            if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    message: error.message
                });
            }
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "An unexpected error occurred while getting subtable join status."
            });
        }
    }
}

export default new SubtableController(subtableService);