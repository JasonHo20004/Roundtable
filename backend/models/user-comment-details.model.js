import UserProfile from '#models/user-profile.model.js';

/**
 * Represents detailed information about a comment, including information about its author.
 * Mirrors the "UserCommentDetails" VIEW in the database.
 */
class UserCommentDetails {
    /**
     * Creates an instance of UserCommentDetails.
     * @param {string} commentId - The unique identifier for the comment.
     * @param {string} postId - The ID of the post the comment belongs to.
     * @param {string | null} parentCommentId - The ID of the parent comment, if this is a reply.
     * @param {string} body - The content of the comment.
     * @param {Date} commentCreatedAt - Timestamp when the comment was created.
     * @param {Date} commentUpdatedAt - Timestamp when the comment was last updated.
     * @param {number} voteCount - The net vote score of the comment.
     * @param {boolean} isRemoved - Flag indicating if the comment is marked as removed.
     * @param {UserProfile | null} author - The UserProfile object representing the comment's author. Can be null if author data is missing (though unlikely with the JOIN).
     */
    constructor(commentId, postId, parentCommentId, body, commentCreatedAt, commentUpdatedAt, voteCount, isRemoved, author) {
        /** @type {string} */
        this.commentId = commentId;

        /** @type {string} */
        this.postId = postId;

        /** @type {string | null} */
        this.parentCommentId = parentCommentId;

        /** @type {string} */
        this.body = body;

        /** @type {Date} */
        this.commentCreatedAt = commentCreatedAt; // Assumes DB returns Date object or string parsable to Date

        /** @type {Date} */
        this.commentUpdatedAt = commentUpdatedAt; // Assumes DB returns Date object or string parsable to Date

        /** @type {number} */
        this.voteCount = voteCount;

        /** @type {boolean} */
        this.isRemoved = isRemoved;

        /**
         * The profile information of the comment's author.
         * @type {UserProfile | null}
         */
        this.author = author;
    }

    /**
     * Converts a database row (from the UserCommentDetails VIEW) to a UserCommentDetails instance.
     * Assumes the row object keys match the column names/aliases defined in the VIEW.
     * @param {Object | null} row - The database row object or null.
     * @returns {UserCommentDetails | null} The UserCommentDetails instance or null if no row/required data is provided.
     */
    static fromDbRow(row) {
        if (!row) return null;

        // Basic check for core comment fields
        if (!row.commentId || !row.postId || row.body === undefined || row.commentCreatedAt === undefined || row.commentUpdatedAt === undefined || row.voteCount === undefined || row.isRemoved === undefined) {
            console.error("Missing required comment fields in database row for UserCommentDetails:", row);
            return null;
        }

        // --- Extract Author Data and Create UserProfile Instance ---
        const authorData = {
            userId: row.authorUserId,
            principalId: row.authorPrincipalId,
            username: row.authorUsername,
            displayName: row.authorDisplayName,
            avatar: row.authorAvatar,
            karma: row.authorKarma,
            isVerified: row.authorIsVerified,
            status: row.authorStatus,

        };

        const authorProfile = UserProfile.fromDbRow(authorData);

        // Create the UserCommentDetails instance using the constructor
        return new UserCommentDetails(
            row.commentId,
            row.postId,
            row.parentCommentId, // Can be null
            row.body,
            new Date(row.commentCreatedAt), // Convert timestamp string/number to Date
            new Date(row.commentUpdatedAt), // Convert timestamp string/number to Date
            row.voteCount ?? 0, // Default voteCount if null/undefined
            row.isRemoved ?? false, // Default isRemoved if null/undefined
            authorProfile // Pass the constructed UserProfile instance (or null)
        );
    }
}

export default UserCommentDetails;