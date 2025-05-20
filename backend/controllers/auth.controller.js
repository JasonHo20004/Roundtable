// backend/controllers/auth.controller.js
import authService from '#services/auth.service.js';
import HTTP_STATUS from '#constants/http-status.js';
import {
    AuthenticationError,
    BadRequestError,
    ConflictError,
    ForbiddenError,
    InternalServerError,
    NotFoundError,
    VerificationError
} from '#errors/AppError.js';

/**
 * @class AuthController
 * @description Handles HTTP requests related to authentication, registration, etc.
 */
class AuthController {
    constructor(injectedAuthService) {
        this.authService = injectedAuthService;
    }

    /**
     * Handles user registration requests.
     * POST /register
     */
    register = async (req, res, next) => {
        try {
            const {username, email, password} = req.body;
            
            // Check if this is a resend request (no username/password)
            const isResendRequest = !username && !password && email;
            
            if (isResendRequest) {
                // Handle resend verification code
                await this.authService.resendVerificationCode(email);
                return res.status(HTTP_STATUS.OK).json({
                    success: true,
                    message: 'Verification code has been resent to your email.',
                });
            }

            // Handle new registration
            const data = await this.authService.registerUser({username, email, password});

            return res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Registration successful. Please check your email for a verification code.',
                data: data,
            });
        } catch (error) {
            console.error("[AuthController.register] Error:", error.message);
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof ConflictError) {
                return res.status(HTTP_STATUS.CONFLICT).json({success: false, message: error.message});
            }
            if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            // Let service-originated InternalServerError pass through if it has a specific message
            if (error instanceof InternalServerError && error.message !== 'An unexpected error occurred during registration.') {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            // Fallback for other unexpected errors from this controller or truly generic InternalServerErrors from service
            console.error(error.stack || error); // Log full stack for unexpected
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred during registration.'
            });
        }
    }

    /**
     * Handles user login requests.
     * POST /login
     */
    login = async (req, res, next) => {
        try {
            const {username, password} = req.body;
            const user = await this.authService.login(username, password);

            req.session.userId = user.userId;
            req.session.principalId = user.principalId;
            req.session.save((err) => {
                if (err) {
                    console.error('[AuthController.login] Critical: Error saving session:', err);
                    // This specific internal error originates in the controller
                    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: 'Failed to establish user session after login.'
                    });
                }
                return res.status(HTTP_STATUS.OK).json({
                    success: true,
                    message: 'Đăng nhập thành công.',
                    user: user,
                });
            });
        } catch (error) {
            console.error('[AuthController.login] Error:', error.message);
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof AuthenticationError) {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    message: error.message || 'Tên đăng nhập hoặc mật khẩu không chính xác'
                });
            }
            if (error instanceof ForbiddenError) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({success: false, message: error.message});
            }
            if (error instanceof NotFoundError) { // Data integrity issue from service
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Login failed due to an internal account configuration issue. Please contact support."
                });
            }
            if (error instanceof InternalServerError && error.message !== 'An unexpected error occurred during login.') {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred during login.'
            });
        }
    }

    /**
     * Handles email verification requests.
     * POST /verify-email
     */
    verifyEmail = async (req, res, next) => {
        try {
            const {email, code} = req.body;

            // Call the service layer - returns true or throws specific errors
            const result = await this.authService.verifyEmail(email, code);

            // --- Success Response ---
            if (result) {
                return res.status(HTTP_STATUS.OK).json({
                    success: true,
                    data: {
                        profileId: result,
                    },
                    message: 'Email verified successfully.', // Consistent success message
                });
            }
        } catch (error) {
            console.error("[AuthController.verifyEmail] Error:", error.message);
            if (error instanceof BadRequestError || error instanceof VerificationError) {
                // VerificationError (invalid code, expired) is treated as BadRequest from client
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof NotFoundError) { // e.g. email not found for verification
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError && error.message !== 'An unexpected error occurred during email verification.') {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred during email verification.'
            });
        }
    }

    /**
     * Checks if a valid session exists and returns user data.
     * GET /session
     */
    checkSession = async (req, res) => {
        try {
            if (req.session && req.session.userId) {
                const {userId} = req.session;
                const user = await this.authService.loginWithSession(userId);
                return res.status(HTTP_STATUS.OK).json({
                    success: true,
                    message: 'Session is valid.',
                    user: user,
                });
            } else {
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    message: 'No active session found. Please log in.'
                });
            }
        } catch (error) {
            console.error('[AuthController.checkSession] Error:', error.message);
            if (error instanceof NotFoundError) { // User from session no longer exists
                return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    success: false,
                    message: 'Invalid session. Please log in again.'
                });
            }
            if (error instanceof ForbiddenError) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError && error.message !== 'An unexpected error occurred during session check.') {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({success: false, message: error.message});
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred during session check.'
            });
        }
    }

    /**
     * Handles user logout requests.
     * POST /logout
     */
    logout = async (req, res) => {
        if (req.session) {
            const {userId} = req.session; // Log who is logging out
            console.log(`[AuthController.logout] Attempting to destroy session for userId: ${userId || 'N/A'}`);

            // --- Capture cookie details BEFORE destroying the session ---
            const sessionCookie = req.session.cookie;
            const sessionCookieName = req.app.get('trust proxy') && req.sessionOptions?.name
                ? req.sessionOptions.name
                : (sessionCookie?.name || 'connect.sid'); // Default to 'connect.sid'
            const sessionCookiePath = sessionCookie?.path || '/'; // Default path to '/'

            req.session.destroy((err) => {
                if (err) {
                    console.error(`[AuthController.logout] Error destroying session for userId ${userId || 'N/A'}:`, err);
                    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        message: 'Logout failed. Could not clear session.'
                    });
                }

                console.log(`[AuthController.logout] Session destroyed successfully for userId: ${userId || 'N/A'}.`);

                // --- Success Response ---
                // Clear the session cookie on the client side using the captured details
                res.clearCookie(sessionCookieName, {path: sessionCookiePath});

                return res.status(HTTP_STATUS.OK).json({success: true, message: 'Logout successful.'});
            });
        } else {
            console.log('[AuthController.logout] No active session found to log out.');
            return res.status(HTTP_STATUS.OK).json({success: true, message: 'You are already logged out.'});
        }
    }

    /**
     * Cập nhật thông tin profile của người dùng.
     * PATCH /profile
     */
    updateProfile = async (req, res, next) => {
        try {
            // console.log('===(CONTROLLER) AUTH CONTROLLER: UPDATE PROFILE ROUTE ACCESSED ===');
            // console.log('===(CONTROLLER) REQUEST BODY ===', JSON.stringify(req.body));

            const profileData = req.body;
            const avatar = req.files?.avatar ? req.files.avatar[0] : null;
            const banner = req.files?.banner ? req.files.banner[0] : null
            const profileId = profileData.profileId; // Lấy profileId từ request body


            if (!profileId) {
                // console.log('===(CONTROLLER) PROFILE ID MISSING IN REQUEST ===');
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: 'Thiếu thông tin profileId.'
                });
            }

            // console.log('===(CONTROLLER) AUTH CONTROLLER: UPDATING PROFILE FOR ID ===', profileId);

            // Gọi service để cập nhật hồ sơ
            const updatedProfile = await this.authService.updateProfileById(profileId, profileData,avatar,banner);

            // console.log('===(CONTROLLER) PROFILE UPDATED SUCCESSFULLY ===');

            // --- Phản hồi thành công ---
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Cập nhật hồ sơ thành công.',
            });

        } catch (error) {
            //console.log('===(CONTROLLER) ERROR UPDATING PROFILE ===', error.message);

            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({success: false, message: error.message});
            }
            if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({success: false, message: error.message});
            }
            if (error instanceof InternalServerError) {
                console.error(error.stack || error);
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: error.message || 'Cập nhật hồ sơ thất bại do lỗi máy chủ.'
                });
            }

            // --- Xử lý lỗi không mong muốn ---
            // console.error("(CONTROLLER)[AuthController.updateProfile] Lỗi không mong muốn:", error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Đã xảy ra lỗi không mong muốn khi cập nhật hồ sơ.'
            });
        }
    }

    /**
     * Handles resending verification code requests.
     * POST /resend-code
     */
    resendCode = async (req, res, next) => {
        try {
            const { email } = req.body;
            
            if (!email) {
                throw new BadRequestError('Email is required to resend verification code.');
            }

            // Call the service layer to resend the code
            await this.authService.resendVerificationCode(email);

            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Verification code has been resent to your email.',
            });
        } catch (error) {
            console.error("[AuthController.resendCode] Error:", error.message);
            if (error instanceof BadRequestError) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
            }
            if (error instanceof NotFoundError) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: error.message });
            }
            if (error instanceof InternalServerError && error.message !== 'An unexpected error occurred while resending verification code.') {
                return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
            }
            console.error(error.stack || error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'An unexpected error occurred while resending verification code.'
            });
        }
    }
}

export default new AuthController(authService);