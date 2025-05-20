/**
 * models/user-post-details.model.js
 *
 * Represents detailed information about a post, including enriched author
 * and subtable information. Mirrors the "UserPostDetails" VIEW in the database.
 */

// Assuming models are in the same directory or adjust path as needed
import UserProfile from './user-profile.model.js';
import Subtable from './subtable.model.js';

class UserPostDetails {
    /**
     * Creates an instance of UserPostDetails.
     *
     * @param {string} postId - The unique identifier for the post.
     * @param {string} subtableId - The ID of the subtable the post belongs to.
     * @param {string} title - The title of the post.
     * @param {string | null} body - The main content/text of the post.
     * @param {Date} postCreatedAt - Timestamp when the post was created.
     * @param {Date} postUpdatedAt - Timestamp when the post was last updated.
     * @param {number} voteCount - The net vote score of the post.
     * @param {number} commentCount - The number of comments on the post.
     * @param {boolean} isLocked - Flag indicating if commenting is locked.
     * @param {boolean} isRemoved - Flag indicating if the post is marked as removed.
     * @param {UserProfile | null} author - The UserProfile object representing the post's author.
     * @param {Subtable | null} subtable - The Subtable object representing the community the post belongs to.
     */
    constructor(
        postId, subtableId, title, body, postCreatedAt, postUpdatedAt,
        voteCount, commentCount, isLocked, isRemoved, author, subtable
    ) {
        /** @type {string} */
        this.postId = postId;
        /** @type {string} */
        this.subtableId = subtableId; // Kept for reference, though subtable object holds details
        /** @type {string} */
        this.title = title;
        /** @type {string | null} */
        this.body = body;
        /** @type {Date} */
        this.postCreatedAt = postCreatedAt;
        /** @type {Date} */
        this.postUpdatedAt = postUpdatedAt;
        /** @type {number} */
        this.voteCount = voteCount;
        /** @type {number} */
        this.commentCount = commentCount;
        /** @type {boolean} */
        this.isLocked = isLocked;
        /** @type {boolean} */
        this.isRemoved = isRemoved;
        /** @type {UserProfile | null} */
        this.author = author;
        /** @type {Subtable | null} */
        this.subtable = subtable;
    }

    /**
     * Converts a database row (from the UserPostDetails VIEW) to a UserPostDetails instance.
     * Assumes the row object keys match the column names/aliases defined in the VIEW.
     *
     * @param {Object | null} row - The database row object or null.
     * @returns {UserPostDetails | null} The UserPostDetails instance or null if no row/required data is provided.
     */
    static fromDbRow(row) {
        if (!row) return null;

        // Basic check for core post fields
        if (!row.postId || !row.subtableId || !row.title || row.postCreatedAt === undefined || row.postUpdatedAt === undefined || row.voteCount === undefined || row.commentCount === undefined || row.isLocked === undefined || row.isRemoved === undefined) {
            console.error("Missing required post fields in database row for UserPostDetails:", row);
            return null;
        }

        // --- Extract Author Data and Create UserProfile Instance ---
        // Ensure all expected author fields from the VIEW are mapped
        const authorData = {
            userId: row.authorUserId,
            principalId: row.authorPrincipalId,
            username: row.authorUsername,
            displayName: row.authorDisplayName,
            avatar: row.authorAvatar,
            banner: row.authorBanner, // Added banner as per view definition
            karma: row.authorKarma,
            isVerified: row.authorIsVerified,
            status: row.authorStatus,
        };
        const authorProfile = UserProfile.fromDbRow(authorData);
        // If authorUserId is null (possible if author was deleted), authorProfile will be null

        // --- Extract Subtable Data and Create Subtable Instance ---
        // Ensure all expected subtable fields from the VIEW are mapped
        const subtableData = {
            subtableId: row.subtableId, // Use the main subtableId from the post row
            name: row.subtableName,
            description: row.subtableDescription,
            icon: row.subtableIcon, // Corrected field name based on VIEW alias
            banner: row.subtableBanner, // Corrected field name based on VIEW alias
            memberCount: row.subtableMemberCount,
            // createdAt and creatorPrincipalId are not included in the UserPostDetails view,
            // so we pass null or defaults if needed by the Subtable constructor
            createdAt: null, // Or fetch separately if needed
            creatorPrincipalId: null, // Or fetch separately if needed
        };
        const subtableInfo = Subtable.fromDbRow(subtableData);

        // Create the UserPostDetails instance
        return new UserPostDetails(
            row.postId,
            row.subtableId,
            row.title,
            row.body, // Can be null
            new Date(row.postCreatedAt),
            new Date(row.postUpdatedAt),
            row.voteCount ?? 0,
            row.commentCount ?? 0,
            row.isLocked ?? false,
            row.isRemoved ?? false,
            authorProfile, // Pass the constructed UserProfile instance (can be null)
            subtableInfo   // Pass the constructed Subtable instance (can be null)
        );
    }
}

export default UserPostDetails;