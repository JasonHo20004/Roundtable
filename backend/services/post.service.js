// services/post.service.js
import HTTP_STATUS from '#constants/http-status.js';
import UserCommentDetailsDAO from "#daos/user-comment-details.dao.js";
import UserPostDetailsDAO from "#daos/user-post-details.dao.js";
import PostDAO from '#daos/post.dao.js';
import VoteDAO from '#daos/vote.dao.js';
import RegisteredUserDao from "#daos/registered-user.dao.js";
import SubtableDao from "#daos/subtable.dao.js";
import SubscriptionDao from "#daos/subscription.dao.js";
import Post from "#models/post.model.js";
import {postgresInstance} from "#db/postgres.js"; // Assuming postgresInstance is correctly exported

/**
 * Helper function for structuring comments and adding user vote status.
 * @param {Array<UserCommentDetails>} commentsRaw - The raw array of comment details from the DAO.
 * @returns {Array<object>} - The structured array of comments with replies and userVote status.
 */
function structureComments(commentsRaw) {
    // --- Input Validation ---
    if (!Array.isArray(commentsRaw)) {
        console.error("Input must be an array of comments.");
        return [];
    }

    const commentMap = {}; // Stores comments by their ID for quick lookup
    const structuredComments = []; // Stores the final top-level comments

    // --- Step 1: Initialize map, add 'replies' array, and copy ---
    commentsRaw.forEach(comment => {
        // Create a copy to avoid modifying the original objects directly
        const commentCopy = {...comment};
        commentCopy.replies = []; // Initialize the array for replies
        commentMap[commentCopy.commentId] = commentCopy;
    });

    // --- Step 2: Link comments to their parents ---
    Object.values(commentMap).forEach(comment => { // Iterate over the copies in the map
        const {parentCommentId, commentId} = comment; // Use the comment copy

        // Check if it's a reply (has a valid parentCommentId that exists in the map)
        if (parentCommentId !== null && parentCommentId !== undefined && commentMap[parentCommentId]) {
            // Find the parent in the map
            const parent = commentMap[parentCommentId];
            // Add the current comment (copy) to the parent's 'replies' array
            parent.replies.push(comment); // Push the comment copy
        }
        // Check if it's a top-level comment or an orphan (parent not found in this batch)
        else if (parentCommentId === null || parentCommentId === undefined || !commentMap[parentCommentId]) {
            // Add the comment copy to the top-level array
            structuredComments.push(comment); // Push the comment copy
        }
    });

    return structuredComments;
}

class PostService {
    /**
     * Constructor for PostService.
     * @param {object} postDao - Data Access Object for posts.
     * @param {object} voteDao - Data Access Object for votes.
     * @param {object} userPostDetailsDao - DAO for the user_post_details view/q.
     * @param {object} userCommentDetailsDao - DAO for the user_comment_details view/q.
     * @param {object} registeredUserDao - DAO for registered users.
     * @param {object} subtableDao - DAO for subtables.
     * @param {object} subscriptionDao - DAO for subscriptions.
     */
    constructor(
        postDao,
        voteDao,
        userPostDetailsDao,
        userCommentDetailsDao,
        registeredUserDao,
        subtableDao,
        subscriptionDao
    ) {
        // Assign DAOs to instance properties
        this.postDao = postDao;
        this.voteDao = voteDao;
        this.userPostDetailsDao = userPostDetailsDao;
        this.userCommentDetailsDao = userCommentDetailsDao;
        this.registeredUserDao = registeredUserDao;
        this.subtableDao = subtableDao;
        this.subscriptionDao = subscriptionDao;
    }

    /**
     * Retrieves a list of posts based on the provided filters and sorts.
     * @param {string} userId - The ID of the user requesting the posts.
     * @param {object} filterBy - Filters for querying posts (e.g., authorId, subtableId).
     * @param {string} sortBy - The column to sort by (e.g., 'createdAt', 'voteCount').
     * @param {string} order - The order to sort by (e.g., 'asc', 'desc').
     * @param {number} limit - The maximum number of posts to return.
     * @param {number} offset - The number of posts to skip.
     * @returns {Promise<Array<object>>} - A list of posts with user vote status.
     */
    async getPosts(userId, {filterBy, sortBy, order, limit, offset}) {
        try {
            console.log('Fetching posts with userId:', userId, 'filterBy:', filterBy, 'sortBy:', sortBy, 'order:', order, 'limit:', limit, 'offset:', offset);

            const posts = await this.userPostDetailsDao.getPosts({
                filterBy,
                sortBy,
                order,
                limit,
                offset,
            });

            if (!userId) {
                return posts;
            }

            return await Promise.all(
                posts.map(async (post) => {
                    const vote = await this.voteDao.getByUserAndPost(userId, post.postId);
                    return {
                        ...post,
                        userVote: vote ? {
                            voteType: vote.voteType,
                            createdAt: vote.createdAt,
                            updatedAt: vote.updatedAt
                        } : null
                    };
                })
            );
        } catch (error) {
            console.error('Error fetching posts:', error);
            throw error;
        }
    }


    /**
     * Retrieves all necessary data for the detailed post view, including user vote status.
     * @param {string} postId - The ID of the post.
     * @param {string | null} [userId=null] - The ID of the user requesting the post details (optional).
     * @returns {Promise<object>} Object containing post, subtable, comments, author, vote status, etc.
     */
    async getPostDetails(postId, userId = null) {
        console.log(`Fetching post details for postId: ${postId}, userId: ${userId}`);

        // 1. Get the Post details (includes author and subtable info via the view)
        // Use the DAO passed in the constructor
        const postDetails = await this.userPostDetailsDao.getByPostId(postId);
        if (!postDetails) {
            const error = new Error('Post not found.');
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        // 2. Check if post is removed
        if (postDetails.isRemoved) {
            const error = new Error('Post has been removed.');
            error.statusCode = HTTP_STATUS.NOT_FOUND; // Or GONE (410)
            throw error;
        }

        // 3. Get Raw Comments
        // Use the DAO passed in the constructor
        let commentsRaw = await this.userCommentDetailsDao.getByPostId(postId, {
            sortBy: 'createdAt', // Or 'voteCount' etc.
            order: 'asc',        // Or 'desc'
            includeRemoved: false // Typically hide removed comments
        });

        // 4. Get user vote status on the post (if userId is provided)
        let postUserVote = null;
        if (userId) {
            // Use the DAO passed in the constructor
            const vote = await this.voteDao.getByUserAndPost(userId, postId);
            // Ensure vote object or null is assigned
            postUserVote = vote ? {
                voteType: vote.voteType,
                createdAt: vote.createdAt,
                updatedAt: vote.updatedAt
            } : null;
            console.log(`User ${userId} vote status on post ${postId}:`, postUserVote);
        }

        // 5. Get user vote status on the comments (if userId is provided)
        if (userId) {
            // Map through comments and fetch user vote status for each
            commentsRaw = await Promise.all(
                commentsRaw.map(async (comment) => {
                    // Use the DAO passed in the constructor
                    const vote = await this.voteDao.getByUserAndComment(userId, comment.commentId);
                    return {
                        ...comment,
                        // Ensure vote object or null is assigned
                        userVote: vote ? {
                            voteType: vote.voteType,
                            createdAt: vote.createdAt,
                            updatedAt: vote.updatedAt
                        } : null
                    };
                })
            ); // Update commentsRaw with the new array including userVote
        }

        // 6. Structure comments
        const commentsStructured = structureComments(commentsRaw);

        // 7. Assemble the data package
        // Separate post data from author and subtable for clarity
        const {author, subtable, ...postData} = postDetails;

        return {
            post: {
                ...postData, // Spread the rest of the post properties
                userVote: postUserVote, // Add the user's vote status for the post
            },
            subtable: subtable ? {...subtable} : null, // Include subtable details
            author: author ? {...author} : null,     // Include author details
            comments: commentsStructured,              // Include structured comments with vote status
        };
    }

    /**
     * Creates a new post.
     * @param {string} authorUserId - The ID of the user creating the post.
     * @param {object} postData - Data for the new post { subtableId, title, body }.
     * @returns {Promise<Post>} The newly created post object.
     */
    async createPost(authorUserId, postData) {
        const {subtableId, title, body} = postData;

        // 1. Validate input
        if (!authorUserId || !subtableId || !title || !body) {
            const error = new Error('Invalid input data for creating a post. Missing required fields.');
            error.statusCode = HTTP_STATUS.BAD_REQUEST;
            throw error;
        }

        // Check if the user exists
        // Use the DAO passed in the constructor
        const userExists = await this.registeredUserDao.getById(authorUserId);
        if (!userExists) {
            const error = new Error('Author user does not exist.');
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        // Check if the subtable exists
        // Use the DAO passed in the constructor
        const subtableExists = await this.subtableDao.getById(subtableId);
        if (!subtableExists) {
            const error = new Error('Subtable does not exist.');
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        // Check if the user is a member of the subtable
        // Use the DAO passed in the constructor
        const subscription = await this.subscriptionDao.getByUserAndSubtable(authorUserId, subtableId);
        if (!subscription) {
            const error = new Error('User is not subscribed to this subtable.');
            error.statusCode = HTTP_STATUS.FORBIDDEN; // Or BAD_REQUEST depending on rules
            throw error;
        }

        // Create a Post model instance
        const post = new Post(null, subtableId, authorUserId, title, body);

        // 2. Create the post using the DAO within a transaction
        return await postgresInstance.transaction(async (transaction) => {
            try {
                // Use the DAO passed in the constructor
                const createdPost = await this.postDao.create(post, transaction);
                console.log(`Post created successfully with ID: ${createdPost.postId}`);
                return createdPost;
            } catch (error) {
                console.error('Error creating post in transaction:', error);
                // Re-throw the error to ensure the transaction rolls back
                throw error;
            }
        });
    }

    async updatePost(postId, postData) {
        const {body} = postData;
        console.log("PostService.updatePost called", {postId, body});
        // 1. Validate input
        if (!postId || !body) {
            const error = new Error('Invalid input data for updating a post. Missing required fields.');
            error.statusCode = HTTP_STATUS.BAD_REQUEST;
            throw error;
        }

        // 2. Check if the post exists
        // Use the DAO passed in the constructor
        const postExists = await this.postDao.getById(postId);
        if (!postExists) {
            const error = new Error('Post does not exist.');
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        // 3. Update the post using the DAO within a transaction
        return await postgresInstance.transaction(async (transaction) => {
            try {
                // Use the DAO passed in the constructor
                const updatedPost = await this.postDao.update(postId, {body}, transaction);
                console.log(`Post updated successfully with ID: ${updatedPost.postId}`);
                return updatedPost;
            } catch (error) {
                console.error('Error updating post in transaction:', error);
                // Re-throw the error to ensure the transaction rolls back
                throw error;
            }
        });
    }

    /**
     * Searches posts based on q parameters
     * @param {object} params - Search parameters
     * @param {string} params.q - Search q
     * @param {string} [params.subtableId] - Optional subtable ID to filter by
     * @param {string} [params.sortBy='relevance'] - Sort by field (relevance, newest, votes)
     * @param {number} [params.page=1] - Page number
     * @param {number} [params.limit=10] - Results per page
     * @param {string} [params.userId] - Optional user ID for vote status
     * @returns {Promise<object>} Search results
     */
    async searchPosts({
                          q,
                          subtableId,
                          sortBy = 'relevance',
                          time = 'all',
                          page = 1,
                          limit = 10,
                          offset = 0,
                          userId = null
                      }) {
        try {
            // Validate input
            if (!q) {
                throw new Error('Search q is required');
            }

            // Get search results from UserPostDetailsDAO
            const {posts, total} = await this.userPostDetailsDao.searchPosts(q, {
                subtableId,
                sortBy,
                time,
                page,
                limit,
                offset
            });

            // Get user vote status for each post if userId is provided
            let postsWithVotes = posts;
            if (userId) {
                postsWithVotes = await Promise.all(
                    posts.map(async (post) => {
                        const vote = await this.voteDao.getByUserAndPost(userId, post.postId);
                        return {
                            ...post,
                            userVote: vote ? {
                                voteType: vote.voteType,
                                createdAt: vote.createdAt,
                                updatedAt: vote.updatedAt
                            } : null
                        };
                    })
                );
            }

            return {
                posts: postsWithVotes,
                total
            };
        } catch (error) {
            console.error('[PostService:searchPosts] Error:', error);
            throw error;
        }
    }

    /**
     * Retrieves recent posts, optionally including user vote status.
     * @param {number} [limit=10] - Maximum number of posts to return
     * @param {string | null} [userId=null] - Optional user ID for vote status
     * @returns {Promise<Array>} Array of post objects with details
     */
    async getRecentPosts(limit = 10, userId = null) {
        try {
            // Get recent posts using the DAO
            const posts = await this.userPostDetailsDao.getHomePosts({
                limit,
                sortBy: 'postCreatedAt',
                order: 'desc',
                includeRemoved: false
            });

            // Get user vote status for each post if userId is provided
            if (userId) {
                return await Promise.all(
                    posts.map(async (post) => {
                        const vote = await this.voteDao.getByUserAndPost(userId, post.postId);
                        return {
                            ...post,
                            userVote: vote ? {
                                voteType: vote.voteType,
                                createdAt: vote.createdAt,
                                updatedAt: vote.updatedAt
                            } : null
                        };
                    })
                );
            }

            return posts;
        } catch (error) {
            console.error('[PostService:getRecentPosts] Error:', error);
            throw error;
        }
    }

    /**
     * Retrieves multiple posts by their IDs, optionally including user vote status.
     * @param {string[]} postIds - Array of post IDs to fetch
     * @param {string | null} [userId=null] - Optional user ID for vote status
     * @returns {Promise<Array>} Array of post objects with details
     */
    async getPostsByIds(postIds, userId = null) {
        try {
            if (!Array.isArray(postIds) || postIds.length === 0) {
                return [];
            }

            // Get posts using the DAO
            const posts = await Promise.all(
                postIds.map(async (postId) => {
                    try {
                        return await this.userPostDetailsDao.getByPostId(postId);
                    } catch (error) {
                        console.error(`Error fetching post ${postId}:`, error);
                        return null;
                    }
                })
            );

            // Filter out null values (posts that couldn't be fetched)
            const validPosts = posts.filter(post => post !== null && !post.isRemoved);

            // Get user vote status for each post if userId is provided
            if (userId) {
                return await Promise.all(
                    validPosts.map(async (post) => {
                        const vote = await this.voteDao.getByUserAndPost(userId, post.postId);
                        return {
                            ...post,
                            userVote: vote ? {
                                voteType: vote.voteType,
                                createdAt: vote.createdAt,
                                updatedAt: vote.updatedAt
                            } : null
                        };
                    })
                );
            }

            return validPosts;
        } catch (error) {
            console.error('[PostService:getPostsByIds] Error:', error);
            throw error;
        }
    }

    async deletePost(postId, postData) {
        const {body, authorUserId} = postData;
        console.log("PostService.deletePost called", {postId, body, authorUserId});
        // 1. Validate input
        if (!postId) {
            const error = new Error('Invalid input data for deleting a post. Missing required fields.');
            error.statusCode = HTTP_STATUS.BAD_REQUEST;
            throw error;
        }

        // 2. Check if the post exists
        // Use the DAO passed in the constructor
        const postExists = await this.postDao.getById(postId);
        if (!postExists) {
            const error = new Error('Post does not exist.');
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        // 3. Delete the post using the DAO within a transaction
        return await postgresInstance.transaction(async (transaction) => {
            try {
                // Use the DAO passed in the constructor
                const deletedPost = await this.postDao.updateDelete(postId, {body, authorUserId}, transaction);
                console.log(`Post deleted successfully with ID: ${deletedPost.postId}`);
                return deletedPost;
            } catch (error) {
                console.error('Error deleting post in transaction:', error);
                // Re-throw the error to ensure the transaction rolls back
                throw error;
            }
        });
    }
}

export default new PostService(
    PostDAO,
    VoteDAO,
    UserPostDetailsDAO,
    UserCommentDetailsDAO,
    RegisteredUserDao,
    SubtableDao,
    SubscriptionDao
);
