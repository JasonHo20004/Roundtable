// models/post.model.js

/**
 * Represents a Post made within a Subtable.
 */
class Post {
    /**
     * Creates an instance of Post.
     * @param {string | null} postId - The unique identifier (UUID), null if new.
     * @param {string} subtableId - The UUID of the Subtable this post belongs to. Required.
     * @param {string | null} authorUserId - The UUID of the RegisteredUser who authored the post (null if user deleted).
     * @param {string} title - The title of the post. Required.
     * @param {string | null} [body=null] - The main content/text of the post.
     * @param {Date | null} [createdAt=null] - Timestamp of creation (set by DB default).
     * @param {Date | null} [updatedAt=null] - Timestamp of last update (set by DB trigger/default).
     * @param {number} [voteCount=0] - Denormalized count of votes (updated by DB trigger).
     * @param {number} [commentCount=0] - Denormalized count of comments (updated by DB trigger).
     * @param {boolean} [isLocked=false] - Whether commenting is locked on the post.
     * @param {boolean} [isRemoved=false] - Whether the post has been removed (soft delete).
     */
    constructor(postId, subtableId, authorUserId, title, body = null, createdAt = null, updatedAt = null, voteCount = 0, commentCount = 0, isLocked = false, isRemoved = false) {
        /** @type {string | null} */
        this.postId = postId;

        /** @type {string} */
        this.subtableId = subtableId;

        /** @type {string | null} */
        this.authorUserId = authorUserId;

        /** @type {string} */
        this.title = title;

        /** @type {string | null} */
        this.body = body;

        /** @type {Date | null} */
        this.createdAt = createdAt;

        /** @type {Date | null} */
        this.updatedAt = updatedAt;

        /** @type {number} */
        this.voteCount = voteCount;

        /** @type {number} */
        this.commentCount = commentCount;

        /** @type {boolean} */
        this.isLocked = isLocked;

        /** @type {boolean} */
        this.isRemoved = isRemoved;
    }

    /**
     * Converts a database row object into a Post instance.
     * @param {Object} row - The database row object.
     * @returns {Post | null} A Post instance or null if no row provided.
     */
    static fromDbRow(row) {
        if (!row) return null;
        return {
            postId: row.postId,
            subtableId: row.subtableId,
            authorUserId: row.authorUserId,
            title: row.title,
            body: row.body,
            createdAt: row.createdAt ? new Date(row.createdAt) : null,
            updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
            voteCount: row.voteCount,
            commentCount: row.commentCount,
            isLocked: row.isLocked,
            isRemoved: row.isRemoved,
            // Joined subtable fields
            subtableName: row.subtableName,
            subtableIcon: row.subtableIcon,
            subtableBanner: row.subtableBanner,
            subtableDescription: row.subtableDescription,
            subtableMemberCount: row.subtableMemberCount,
            subtableCreatedAt: row.subtableCreatedAt ? new Date(row.subtableCreatedAt) : null,
            subtableCreatorUserId: row.subtableCreatorUserId,
            // Joined author field
            authorUsername: row.authorUsername
        };
    }
}

export default Post;