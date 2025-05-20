// src/services/CommentService.js
import {sendApiRequest} from "#utils/apiClient";

class CommentService {

    async addComment(postId, body) {
        try {
            console.log("Adding comment:", postId, body);
            return await sendApiRequest(`/api/posts/${postId}/comments`,
                {
                    method: 'POST',
                    body: {
                        body: body,
                    }
                }
            );
        } catch (error) {
            console.error("Error adding comment:", error);
            throw error;
        }
    }

    async replyToComment(commentId, body) {
        try {
            console.log("Replying to comment from comment service:", commentId, body);
            return await sendApiRequest(`/api/comments/${commentId}/replies`,
                {
                    method: 'POST',
                    body: {
                        body: body,
                    }
                }
            );
        } catch (error) {
            console.error("Error replying to comment:", error);
            throw error;
        }
    }

    async editComment(commentId, body) {
        try {
            console.log("Editing comment:", commentId, body);
            return await sendApiRequest(`/api/comments/${commentId}`,
                {
                    method: 'PATCH',
                    body: {
                        body: body,
                    }
                }
            );
        } catch (error) {
            console.error("Error editing comment:", error);
            throw error;
        }
    }

    deleteComment(commentId) {
        try {
            console.log("Deleting comment:", commentId);
            return sendApiRequest(`/api/comments/${commentId}`,
                {
                    method: 'DELETE',
                }
            );
        } catch (error) {
            console.error("Error deleting comment:", error);
            throw error;
        }
    }

    /**
     * Fetches comments for a specific user.
     * @param {string} userId - The ID of the user whose comments are to be fetched.
     * @param {object} [options={}] - Optional query parameters (e.g., limit, sortBy).
     * @returns {Promise<object>} - The full API response object.
     */
    async getCommentsByUserId(userId, options = {}) {
        const queryParams = new URLSearchParams(options);
        // Ensure 'authorId' or the correct backend parameter is used for filtering
        queryParams.set('authorUserId', userId);

        // Use the API endpoint for fetching comments, filtered by authorId
        const baseUrl = `/api/comments?${queryParams.toString()}`;
        console.log(`CommentService: Fetching user's comments from ${baseUrl}`);
        return await sendApiRequest(baseUrl, {method: 'GET'});
    }

}

export default new CommentService();