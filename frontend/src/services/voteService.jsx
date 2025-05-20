// src/services/PostService.js
import {sendApiRequest} from "#utils/apiClient";

class VoteService {
    async createVote(postId, commentId, voteType) {
        try {
            let url;

            if (commentId) {
                url = `/api/comments/${commentId}/vote`;
            } else {
                url = `/api/posts/${postId}/vote`;
            }

            const response = await sendApiRequest(url, {
                method: 'POST',
                body: {
                    voteType: voteType,
                },
            });

            console.log("VoteService.createVote response:", response);
            return response;
        } catch (error) {
            console.error("Error casting vote:", error);
            throw error;
        }
    }

    async deleteVote(voteId) {
        try {
            const url = `/api/votes/${voteId}`;
            return await sendApiRequest(url, {method: 'DELETE'});
        } catch (error) {
            console.error("Error deleting vote:", error);
            throw error;
        }
    }

    async updateVote(voteId, voteType) {
        try {
            const url = `/api/votes/${voteId}`;
            return await sendApiRequest(url, {
                method: 'PATCH',
                body: {
                    voteType: voteType,
                },
            });
        } catch (error) {
            console.error("Error updating vote:", error);
            throw error;
        }
    }

    async getUpvotedItemsByUserId(userId) {
        try {
            const url = `/api/votes?voterUserId=${userId}&voteType=UPVOTE`;
            return await sendApiRequest(url, {method: 'GET'});
        } catch (error) {
            console.error("Error fetching upvoted items:", error);
            throw error;
        }
    }

    async getDownvotedItemsByUserId(userId) {
        try {
            const url = `/api/votes?voterUserId=${userId}&voteType=DOWNVOTE`;
            return await sendApiRequest(url, {method: 'GET'});
        } catch (error) {
            console.error("Error fetching downvoted items:", error);
            throw error;
        }
    }
}

export default new VoteService();