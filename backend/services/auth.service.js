// backend/services/auth.service.js
import argon2 from 'argon2';
import dotenv from 'dotenv';

// --- PostgresDB & Cache Clients ---
import { postgresInstance } from '#db/postgres.js';
import redisClient from '#db/redis.js';

// --- Utility Functions ---
import { generateShortCode } from '#utils/codeGenerator.js';
import { sendMail } from '#utils/email.js';

// --- Data Access Objects (DAOs) ---
import AccountDAO from '#daos/account.dao.js';
import PrincipalDAO from '#daos/principal.dao.js';
import ProfileDAO from '#daos/profile.dao.js';
import RegisteredUserDAO from '#daos/registered-user.dao.js';
import UserProfileDAO from '#daos/user-profile.dao.js';

// --- Data Models ---
import Account from '#models/account.model.js';
import Profile from '#models/profile.model.js';
import RegisteredUser from '#models/registered-user.model.js';
import Principal, { PrincipalRoleEnum } from '#models/principal.model.js';
import mediaDAO from "#daos/media.dao.js";
import Media from "#models/media.model.js";
// --- Constants & Custom Errors ---
import { HASH_OPTIONS } from '#constants/security.js';
import {
    AuthenticationError,
    BadRequestError,
    ConflictError,
    ForbiddenError,
    InternalServerError,
    NotFoundError,
    VerificationError,
} from '#errors/AppError.js';

dotenv.config();

const CODE_EXPIRY_MINUTES = 5;

// --- Password Hashing Utilities (Assume these are correctly defined) ---
async function hashPassword(password) {
    try {
        return await argon2.hash(password, HASH_OPTIONS);
    } catch (error) {
        console.error('[AuthService] Error hashing password:', error);
        throw new InternalServerError('Password processing failed.'); // Service throws specific internal error
    }
}

async function verifyPassword(hashedPassword, plainPassword) {
    try {
        return await argon2.verify(hashedPassword, plainPassword);
    } catch (error) {
        if (error.code === 'ERR_ARGON2_INVALID_HASH' || error.message.includes('incompatible') || error.message.includes('verification failed')) {
            return false; // Indicates verification failure, not an internal error
        }
        console.error('[AuthService] Unexpected error during password verification:', error);
        throw new InternalServerError('Password verification encountered an internal error.');
    }
}


/**
 * @class AuthService
 * @description Handles core business logic for authentication, registration, verification.
 */
class AuthService {
    constructor(accountDao, principalDao, profileDao, registeredUserDao, userProfileDao) {
        this.accountDao = accountDao;
        this.principalDao = principalDao;
        this.profileDao = profileDao;
        this.registeredUserDao = registeredUserDao;
        this.userProfileDao = userProfileDao;
        this.mediaDAO = mediaDAO
    }

    /** Sends the verification email */
    async _sendVerificationEmail(userEmail, plainCode) {
        const subject = 'Your Email Verification Code';
        const expiryMessage = `This code is valid for ${CODE_EXPIRY_MINUTES} minutes.`;
        const html = `
            <h1>Verify Your Email Address</h1>
            <p>Please use the following code to verify your email:</p>
            <p style="font-size: 24px; font-weight: bold;">${plainCode}</p>
            <p><em>${expiryMessage}</em></p>`;
        try {
            await sendMail(userEmail, subject, html); // Assuming sendMail is robust
        } catch (error) {
            console.error(`[AuthService] Failed to send verification email to ${userEmail}:`, error);
            throw new InternalServerError('Failed to send verification email.'); // Let controller handle generic error message
        }
    }

    /**
     * Registers a new user using DAOs within a transaction.
     * Sends a verification email upon successful registration.
     * (Assumes this method is correct from previous versions)
     */
    async registerUser(registrationData) {
        const { username, email, password } = registrationData;

        if (!username || !email || !password) {
            throw new BadRequestError('Username, email, and password are required.');
        }

        let createdEntities;
        try {
            createdEntities = await postgresInstance.transaction(async (trx) => {
                const existingUser = await this.accountDao.getByUsername(username, trx);
                if (existingUser) {
                    throw new ConflictError('Username is already taken.');
                }
                const existingEmail = await this.accountDao.getByEmail(email, trx);
                if (existingEmail) {
                    throw new ConflictError('Email address is already registered.');
                }

                // Hash password
                const hashedPassword = await hashPassword(password);

                const account = new Account(null, username, hashedPassword, email);
                const createdAccount = await this.accountDao.create(account, trx);
                if (!createdAccount?.accountId) {
                    throw new Error('DB_INSERT_FAIL: Account');
                }

                const profile = new Profile(null, null, null, null, null, username); // Default displayName to username
                const createdProfile = await this.profileDao.create(profile, trx);
                if (!createdProfile?.profileId) {
                    throw new Error('DB_INSERT_FAIL: Profile');
                }

                const principal = new Principal(null, createdAccount.accountId, createdProfile.profileId, PrincipalRoleEnum.USER);
                const createdPrincipal = await this.principalDao.create(principal, trx);
                if (!createdPrincipal?.principalId) {
                    throw new Error('DB_INSERT_FAIL: Principal');
                }

                const registeredUser = new RegisteredUser(null, createdPrincipal.principalId);
                const createdRegisteredUser = await this.registeredUserDao.create(registeredUser, trx);
                if (!createdRegisteredUser?.userId) {
                    throw new Error('DB_INSERT_FAIL: RegisteredUser');
                }

                return { 
                    account: createdAccount, 
                    registeredUser: createdRegisteredUser,
                    profile: createdProfile  // Add profile to returned entities
                };
            });

            const { userId } = createdEntities.registeredUser;
            const userEmail = createdEntities.account.email;
            const plainCode = generateShortCode(6);
            const redisKey = `verify:email:${userId}`; // Use userId as it's the public-facing ID
            const redisTTL = CODE_EXPIRY_MINUTES * 60;

            try {
                await redisClient.set(redisKey, plainCode, { EX: redisTTL });
                await this._sendVerificationEmail(userEmail, plainCode);
            } catch (cacheOrEmailError) {
                console.error(`[AuthService] Error during post-registration (Redis/Email) for userId ${userId}:`, cacheOrEmailError.message);
                // This is a critical part of registration; if it fails, the user experience is broken.
                throw new InternalServerError('Registration succeeded, but failed to set up email verification. Please try registering again or contact support.');
            }

            return { // Return data that the controller might need
                userId: createdEntities.registeredUser.userId,
                username: createdEntities.account.username,
                email: createdEntities.account.email,
                isVerified: false,
                profileId: createdEntities.profile.profileId  // Use profile from createdEntities
            };

        } catch (error) {
            if (error instanceof BadRequestError || error instanceof ConflictError || error instanceof InternalServerError) {
                throw error; // Re-throw known application errors
            }
            if (error.message?.startsWith('DB_INSERT_FAIL')) {
                console.error('[AuthService] Registration DB insertion failed:', error.message);
                throw new InternalServerError('Registration failed due to a database error.');
            }
            console.error('[AuthService] User registration unexpected error:', error);
            throw new InternalServerError('An unexpected error occurred during registration.');
        }
    }


    /**
     * Verifies a user's email address using a submitted code.
     * Finds the userId via Account -> Principal -> RegisteredUser.
     * Uses RegisteredUserDAO to check and update the isVerified flag within a transaction.
     *
     * @param {string} email - The user's email.
     * @param {string} submittedCode - The code submitted by the user.
     * @returns {Promise<boolean>} True if verification is successful or user already verified.
     * @throws {BadRequestError} If email or code is missing.
     * @throws {NotFoundError} If the account, principal, or registered user record is not found.
     * @throws {VerificationError} If the code is invalid or expired.
     * @throws {InternalServerError} For database, Redis, or other unexpected errors.
     */
    async verifyEmail(email, submittedCode) {
        if (!email || !submittedCode) {
            throw new BadRequestError('Email and verification code are required.');
        }

        let userId = null;
        let redisKey = null;

        try {
            // --- 1. Find User ID from Email via Account -> Principal -> RegisteredUser ---
            // Step 1.1: Find account by email
            const account = await this.accountDao.getByEmail(email);
            if (!account?.accountId) {
                console.warn(`Verification attempt failed: No account found for email ${email}`);
                throw new NotFoundError('Account not found or verification failed.');
            }

            // Step 1.2: Find principal by accountId
            const principal = await this.principalDao.getByAccountId(account.accountId);
            if (!principal?.principalId) {
                console.error(`Data inconsistency: Account ${account.accountId} found, but no matching Principal.`);
                throw new InternalServerError('User data configuration error during verification.');
            }

            // Step 1.3: Find registered user by principalId to get the userId
            const registeredUser = await this.registeredUserDao.getByPrincipalId(principal.principalId);
            if (!registeredUser?.userId) {
                console.error(`Data inconsistency: Principal ${principal.principalId} found, but no matching RegisteredUser.`);
                throw new InternalServerError('User registration data error during verification.');
            }

            // Successfully found the userId
            userId = registeredUser.userId;
            redisKey = `verify:email:${userId}`;
            console.log(`Verification lookup: Found userId ${userId} for email ${email}.`);

            // --- 2. Check Verification Code in Redis ---
            const storedCode = await redisClient.get(redisKey);

            if (!storedCode) {
                console.warn(`No verification code found in Redis for key: ${redisKey} (email: ${email})`);
                throw new VerificationError('Verification code is invalid or has expired. Please request a new one.');
            }

            if (storedCode !== submittedCode) {
                console.warn(`Submitted code mismatch for key ${redisKey}. Stored: ${storedCode}, Submitted: ${submittedCode}`);
                throw new VerificationError('Invalid verification code.');
            }

            // --- 3. Update RegisteredUser within a Transaction using RegisteredUserDAO ---
            let alreadyVerified = false;
            const updatePerformed = await postgresInstance.transaction(async (trx) => {
                // Step 3.1: Fetch the RegisteredUser record *within the transaction* using its DAO
                const userToUpdate = await this.registeredUserDao.getById(userId, trx); // Pass trx

                if (!userToUpdate) {
                    console.error(`Consistency issue inside transaction: RegisteredUser not found for update with userId ${userId}`);
                    throw new InternalServerError('Failed to retrieve user details for verification update.'); // Rollback
                }

                // Step 3.2: Check if already verified
                if (userToUpdate.isVerified === true) {
                    console.log(`User (userId: ${userId}) already verified (checked via DAO within transaction).`);
                    alreadyVerified = true;
                    return false; // No update needed
                }

                // Step 3.3: Perform the update using the DAO's update method
                const updateSuccessful = await this.registeredUserDao.update(
                    userId,
                    { isVerified: true }, // Pass data to update
                    trx // Pass the transaction object
                );

                if (!updateSuccessful) {
                    // The DAO's update method returns boolean indicating success
                    console.error(`Failed to update RegisteredUser verification status via DAO for userId: ${userId} within transaction.`);
                    throw new InternalServerError('PostgresDB update for verification failed.'); // Rollback
                }

                console.log(`User (userId: ${userId}) marked as verified via DAO within transaction.`);
                return true; // Indicate DB update was performed
            }); // End of postgresInstance.transaction block

            // --- 4. Clean up Redis key ---
            if (updatePerformed || alreadyVerified) {
                try {
                    await redisClient.del(redisKey);
                    console.log(`Redis key ${redisKey} deleted after successful verification check/update.`);
                } catch (redisError) {
                    console.error(`Failed to delete Redis key ${redisKey} after verification:`, redisError);
                }
            }

            // --- 5. Return Success ---
            console.log(`Verification process completed for email ${email} (userId: ${userId}). Status updated: ${updatePerformed}`);
            return principal.profileId; // Indicate success to the controller

        } catch (error) {
            // Re-throw known application errors
            if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof VerificationError || error instanceof InternalServerError) {
                throw error;
            }
            // Handle potential generic DB/Redis/other errors
            console.error(`Email verification process failed unexpectedly for email "${email}" (userId: ${userId || 'N/A'}):`, error);
            throw new InternalServerError('Email verification failed due to an unexpected internal error.');
        }
    }


    /**
     * Authenticates a user based on username and password.
     * Uses UserProfileDAO for fetching combined profile data after successful auth.
     * (Assumes this method is correct from previous versions)
     */
    async login(username, password) {
        if (!username || !password) {
            throw new BadRequestError('Username and password are required.');
        }

        try {
            const account = await this.accountDao.getByUsername(username);
            if (!account) {
                throw new AuthenticationError('Invalid username or password.');
            }

            const isPasswordValid = await verifyPassword(account.password, password);
            if (!isPasswordValid) {
                throw new AuthenticationError('Invalid username or password.');
            }

            // Fetch the full user profile using the UserProfileDAO
            const userProfile = await this.userProfileDao.getByUsername(username); // Assuming UserProfileDAO connects all tables
            if (!userProfile?.userId) {
                console.error(`[AuthService] Data inconsistency: Account found (ID: ${account.accountId}), but UserProfile data missing.`);
                throw new NotFoundError('User profile data not found. Please contact support.'); // Or InternalServerError
            }

            if (!userProfile.isVerified) {
                throw new ForbiddenError('Your account is not verified. Please check your email.');
            }
            if (userProfile.status !== 'active') {
                let message = 'Your account is currently inactive.';
                if (userProfile.status === 'suspended') {
                    message = 'Your account has been temporarily suspended.';
                }
                if (userProfile.status === 'banned') {
                    message = 'Your account has been permanently banned.';
                }
                throw new ForbiddenError(message);
            }

            // Return only necessary and safe data for the session/client
            return {
                userId: userProfile.userId,
                principalId: userProfile.principalId,
                username: userProfile.username,
                email: userProfile.email,
                displayName: userProfile.displayName,
                avatar: userProfile.avatar,
                karma: userProfile.karma,
                isVerified: userProfile.isVerified,
                status: userProfile.status,
                role: userProfile.role, // Assuming 'role' is on UserProfile view from Principal table
            };
        } catch (error) {
            if (error instanceof BadRequestError || error instanceof AuthenticationError || error instanceof ForbiddenError || error instanceof NotFoundError || error instanceof InternalServerError) {
                throw error;
            }
            console.error(`[AuthService] Login process failed for username "${username}":`, error);
            throw new InternalServerError('An unexpected error occurred during login.');
        }
    }

    /**
     * Retrieves safe user profile data based on a user ID (typically from a session).
     * Uses UserProfileDAO.
     * (Assumes this method is correct from previous versions)
     */
    async loginWithSession(userId) {
        if (!userId) {
            throw new BadRequestError('User ID is required for session validation.');
        }
        try {
            const userProfile = await this.userProfileDao.getByUserId(userId);
            if (!userProfile?.userId) {
                throw new NotFoundError('User associated with this session not found.'); // Could be stale session
            }

            return { // Return only necessary and safe data
                userId: userProfile.userId,
                principalId: userProfile.principalId,
                username: userProfile.username,
                email: userProfile.email,
                displayName: userProfile.displayName,
                avatar: userProfile.avatar,
                karma: userProfile.karma,
                isVerified: userProfile.isVerified,
                status: userProfile.status,
                role: userProfile.role,
            };
        } catch (error) {
            if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof ForbiddenError || error instanceof InternalServerError) {
                throw error;
            }
            console.error(`[AuthService] Session check failed for userId "${userId}":`, error);
            throw new InternalServerError('An unexpected error occurred during session validation.');
        }
    }

    /**
     * Cập nhật thông tin profile theo profileId.
     * @param {string} profileId - ID của profile cần cập nhật.
     * @param {object} profileData - Dữ liệu profile cần cập nhật.
     * @returns {Promise<Profile>} - Profile đã được cập nhật.
     */
    async updateProfileById(profileId, profileData,avatar,banner) {
        if (!profileId) {
            throw new BadRequestError('Thiếu thông tin profileId.');
        }

        if (!profileData) {
            // console.log('===(SERVICE) PROFILE DATA INVALID ===');
            throw new BadRequestError('Dữ liệu hồ sơ không hợp lệ.');
        }

        // Kiểm tra giá trị gender nếu có
        // if (profileData.gender && !Profile.isValidGender(profileData.gender)) {
        //     console.log('===(SERVICE) INVALID GENDER VALUE ===', profileData.gender);
        //     throw new BadRequestError('Giá trị gender không hợp lệ.');
        // }
        let userId;

        try {
            console.log("profileId", profileId)
            const principal = await this.principalDao.getByProfileId(profileId);
            console.log("principal")
            if (!principal?.principalId) {
                console.error(`Data inconsistency: Account ${profileId} found, but no matching Principal.`);
                throw new InternalServerError('User data configuration error during verification.');
            }
            const register = await this.registeredUserDao.getByPrincipalId(principal.principalId);
            if (!register?.userId) {
                throw new NotFoundError('Không tìm thấy thông tin người dùng đã đăng ký.');
            }
            userId = register.userId;
        } catch (error) {

        }

        let avatarId = ""
        let bannerId = ""


        //const mediaAvatar =  new Media(null,userId, avatar.filename,"image",avatar.mimetype, avatar.size);
        //const mediaBanner = new Media(null, userId, banner.filename, "image",banner.mimetype, banner.size);
        //console.log("mediaAvatar:", mediaAvatar);
        //console.log("mediaBanner:", mediaBanner);

        try {


            // const createdMediAvatar = await this.mediaDAO.create(mediaAvatar); // Pass transaction
            // const createdMediaBanner = await this.mediaDAO.create(mediaBanner); // Pass transaction
            // console.log("createdMediaAvatar:", createdMediAvatar);
            // console.log("createdMediaBanner:", createdMediaBanner);
            // avatarId = createdMediAvatar.mediaId;
            // bannerId = createdMediaBanner.mediaId;
            if (avatar) {
                const mediaAvatar = new Media(null, userId, avatar.path, "image", avatar.mimetype, avatar.size);
                const createdMediaAvatar = await this.mediaDAO.create(mediaAvatar);
                avatarId = createdMediaAvatar.mediaId;
            }

            if (banner) {
                const mediaBanner = new Media(null, userId, banner.path, "image", banner.mimetype, banner.size);
                const createdMediaBanner = await this.mediaDAO.create(mediaBanner);
                bannerId = createdMediaBanner.mediaId;
            }
            // Prepare update data
            const updateData = {
                bio: profileData.bio,
                location: profileData.location,
                displayName: profileData.displayName,
                gender: profileData.gender
            };

            // Only add avatar/banner to updateData if they exist
            if (avatarId) updateData.avatar = avatarId;
            if (bannerId) updateData.banner = bannerId;

            // Loại bỏ các trường undefined
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            // console.log('===(SERVICE) FINAL UPDATE DATA ===', JSON.stringify(updateData));

            // Cập nhật profile trong database
            // console.log('===(SERVICE) CALLING PROFILE DAO UPDATE ===');
            const updatedProfile = await ProfileDAO.update(profileId, updateData);

            if (!updatedProfile) {
                // console.log('===(SERVICE) PROFILE UPDATE FAILED - NO PROFILE RETURNED ===');
                throw new InternalServerError('Không thể cập nhật hồ sơ người dùng.');
            }

                return updatedProfile;
            } catch (error) {
                // Log the error for debugging
                console.error('[AuthService:updateProfileById] Error:', error);
                
                // Re-throw known errors
                if (error instanceof BadRequestError ||
                    error instanceof NotFoundError ||
                    error instanceof InternalServerError) {
                    throw error;
                }
                
                // Wrap unknown errors
                throw new InternalServerError('Đã xảy ra lỗi không mong muốn khi cập nhật hồ sơ.');
            }
        
    }

    /**
     * Resends a verification code to the user's email.
     * @param {string} email - The email address to resend the code to.
     * @throws {BadRequestError} If email is missing or invalid.
     * @throws {NotFoundError} If no account is found for the email.
     * @throws {InternalServerError} For database, Redis, or email sending errors.
     */
    async resendVerificationCode(email) {
        if (!email) {
            throw new BadRequestError('Email is required to resend verification code.');
        }

        let userId = null;
        let redisKey = null;

        try {
            // Find the user's account by email
            const account = await this.accountDao.getByEmail(email);
            if (!account?.accountId) {
                throw new NotFoundError('No account found with this email address.');
            }

            // Find the principal by accountId
            const principal = await this.principalDao.getByAccountId(account.accountId);
            if (!principal?.principalId) {
                throw new InternalServerError('User data configuration error during code resend.');
            }

            // Find the registered user by principalId
            const registeredUser = await this.registeredUserDao.getByPrincipalId(principal.principalId);
            if (!registeredUser?.userId) {
                throw new InternalServerError('User registration data error during code resend.');
            }

            // If user is already verified, no need to resend
            if (registeredUser.isVerified) {
                throw new BadRequestError('This account is already verified.');
            }

            userId = registeredUser.userId;
            redisKey = `verify:email:${userId}`;

            // Generate a new code
            const plainCode = generateShortCode(6);
            const redisTTL = CODE_EXPIRY_MINUTES * 60;

            // Store the new code in Redis
            await redisClient.set(redisKey, plainCode, { EX: redisTTL });

            // Send the new verification email
            await this._sendVerificationEmail(email, plainCode);

            console.log(`[AuthService] Verification code resent to ${email} (userId: ${userId})`);
        } catch (error) {
            // Log the error for debugging
            console.error(`[AuthService:resendVerificationCode] Error for email ${email}:`, error);

            // Re-throw known errors
            if (error instanceof BadRequestError ||
                error instanceof NotFoundError ||
                error instanceof InternalServerError) {
                throw error;
            }

            // Wrap unknown errors
            throw new InternalServerError('Failed to resend verification code. Please try again later.');
        }

    }
}

export default new AuthService(
    AccountDAO,
    PrincipalDAO,
    ProfileDAO,
    RegisteredUserDAO,
    UserProfileDAO
);