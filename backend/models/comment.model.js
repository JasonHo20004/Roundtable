// models/comment.model.js

/**
 * Represents a Comment made on a Post.
 */
class Comment {
    /**
     * Creates an instance of Comment.
     * @param {string | null} commentId - The unique identifier (UUID), null if new.
     * @param {string} postId - The UUID of the Post this comment belongs to. Required.
     * @param {string | null} authorUserId - The UUID of the RegisteredUser who authored the comment (null if user deleted).
     * @param {string | null} [parentCommentId=null] - The UUID of the parent comment if this is a reply (for threading).
     * @param {string | null} body - The text content of the comment. Required.
     * @param {Date | null} [createdAt=null] - Timestamp of creation (set by DB default).
     * @param {Date | null} [updatedAt=null] - Timestamp of last update (set by DB trigger/default).
     * @param {number} [voteCount=0] - Denormalized count of votes (updated by DB trigger).
     * @param {boolean} [isRemoved=false] - Whether the comment has been removed (soft delete).
     */
    constructor(commentId, postId, authorUserId, parentCommentId = null, body = null, createdAt = null, updatedAt = null, voteCount = 0, isRemoved = false) {
        /** @type {string | null} */
        this.commentId = commentId;

        /** @type {string} */
        this.postId = postId;

        /** @type {string | null} */
        this.authorUserId = authorUserId;

        /** @type {string | null} */
        this.parentCommentId = parentCommentId;

        /** @type {string} */
        this.body = body;

        /** @type {Date | null} */
        this.createdAt = createdAt;

        /** @type {Date | null} */
        this.updatedAt = updatedAt;

        /** @type {number} */
        this.voteCount = voteCount;

        /** @type {boolean} */
        this.isRemoved = isRemoved;
    }

    /**
     * Converts a database row object into a Comment instance.
     * @param {Object} row - The database row object.
     * @returns {Comment | null} A Comment instance or null if no row provided.
     */
    static fromDbRow(row) {
        if (!row) return null;
        return new Comment(
            row.commentId,
            row.postId,
            row.authorUserId,
            row.parentCommentId,
            row.body,
            row.createdAt ? new Date(row.createdAt) : null,
            row.updatedAt ? new Date(row.updatedAt) : null,
            row.voteCount,
            row.isRemoved
        );
    }
}

export default Comment;