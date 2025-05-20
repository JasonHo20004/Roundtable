// src/services/PostService.js
import {sendApiRequest} from "#utils/apiClient";


class PostService {
    /**
     * Fetches comments for a specific post.
     * @param {string|number} postId
     * @returns {Promise<Array<object>>}
     */
    async getPostDetails(postId) {
        const baseUrl = `/api/posts/${postId}`

        const response = await sendApiRequest(baseUrl, {method: 'GET'});
        if (!response.success) {
            throw new Error(`Failed to fetch comments for post ${postId}: ${response.status} ${response.statusText}`);
        }
        return response;
    }
    async createPost(data) {
        console.log("PostService.createPost", data)
        const baseUrl = `/api/posts`
        const response = await sendApiRequest(baseUrl, {method: 'POST', body: data});
        if (!response.success) {
            throw new Error(`Failed to create post : ${response.status} ${response.statusText}`);
        }
        return response;

    }
    async updatePost(data,postId) {
        console.log("PostService updatePost called", { data, postId });
        const baseUrl = `/api/posts/${postId}`
        const response = await sendApiRequest(baseUrl, {method: 'PATCH', body: data});
        if (!response.success) {
            throw new Error(`Failed to update post : ${response.status} ${response.statusText}`);
        }
        return response;
    }
    async deletePost(data,postId) {
        console.log("PostService updatePost called", { data, postId });
        const baseUrl = `/api/posts/${postId}`
        const response = await sendApiRequest(baseUrl, {method: 'DELETE', body: data});
        if (!response.success) {
            throw new Error(`Failed to update post : ${response.status} ${response.statusText}`);
        }
        return response;
    }

    /**
     * Fetches posts for a specific user.
     * @param {string} userId - The ID of the user whose posts are to be fetched.
     * @param {object} [options={}] - Optional query parameters (e.g., limit, sortBy).
     * @returns {Promise<object>} - The full API response object.
     */
    async getPostsByUserId(userId, options = {}) {
        const queryParams = new URLSearchParams(options);
        // Ensure 'authorId' or the correct backend parameter is used for filtering
        queryParams.set('authorUserId', userId);

        // Use the API endpoint for fetching posts, filtered by authorId
        const baseUrl = `/api/posts?${queryParams.toString()}`;
        console.log(`PostService: Fetching user's posts from ${baseUrl}`);
        const response = await sendApiRequest(baseUrl, {method: 'GET'});
        console.log('PostService: Received posts:', response);
        return response;
    }

    // async getUpvotedPosts(userId) {
    //     const baseUrl = `/api/profile/${userId}`;
    //
    //     const response = await sendApiRequest(baseUrl, {
    //         method: 'GET'
    //     });
    //     if (!response.success) {
    //         throw new Error(`Failed to fetch upvoted posts: ${response.message}`);
    //     }
    //
    //     return response.data.upvotedPosts || [];
    // }
    //
    // async getUpvotedComments(userId) {
    //     const baseUrl = `/api/profile/${userId}`;
    //
    //     const response = await sendApiRequest(baseUrl, {
    //         method: 'GET'
    //     });
    //     if (!response.success) {
    //         throw new Error(`Failed to fetch upvoted comments: ${response.message}`);
    //     }
    //
    //     return response.data.upvotedComments || [];
    // }
    //
    // async getDownvotedPosts(userId) {
    //     const baseUrl = `/api/profile/${userId}`;
    //     const response = await sendApiRequest(baseUrl, {
    //         method: 'GET'
    //     });
    //     if (!response.success) {
    //         throw new Error(`Failed to fetch downvoted posts: ${response.message}`);
    //     }
    //     return response.data.downvotedPosts || [];
    // }
    //
    // async getDownvotedComments(userId) {
    //     const baseUrl = `/api/profile/${userId}`;
    //     const response = await sendApiRequest(baseUrl, {
    //         method: 'GET'
    //     });
    //     if (!response.success) {
    //         throw new Error(`Failed to fetch downvoted comments: ${response.message}`);
    //     }
    //     return response.data.downvotedComments || [];
    // }

    async getSavedPostsByUserId(userId, options = {}) {
        // Dữ liệu giả mô phỏng giống database thực tế
        const mockData = [
            {
                postId: "00000000-0000-0000-0000-000000000051",
                title: "Welcome to AskAnything",
                body: "Feel free to ask any questions here.",
                createdAt: "2025-05-05T03:38:11+07:00",
                upvotes: 12,
                subtable: {
                    subtableId: "00000000-0000-0000-0000-000000000041",
                    name: "AskAnything",
                    icon: "https://picsum.photos/50"
                }
            },
            {
                postId: "00000000-0000-0000-0000-000000000052",
                title: "Another post by user",
                body: "This is another example post for testing.",
                createdAt: "2025-05-06T10:00:00+07:00",
                upvotes: 7,
                subtable: {
                    subtableId: "00000000-0000-0000-0000-000000000042",
                    name: "TestSubtable",
                    icon: "https://picsum.photos/51"
                }
            }
        ];

        // Nếu muốn lọc theo userId, bạn có thể làm như sau (ở đây dữ liệu giả nên luôn trả về)
        // const userPosts = mockData.filter(post => post.authorUserId === userId);

        // Chuẩn hóa cho ListPostPreviewSubtable nếu cần
        return mockData.map(post => ({
            post: {
                postId: post.postId,
                title: post.title,
                content: post.body,
                createdAt: post.createdAt,
                upvotes: post.upvotes,
                time: post.createdAt
            },
            subtable: post.subtable
        }));
    }

    async getHiddenPostsByUserId(userId, options = {}) {
        // Dữ liệu giả mô phỏng giống database thực tế
        const mockData = [
            {
                postId: "00000000-0000-0000-0000-000000000051",
                title: "Welcome to AskAnything",
                body: "Feel free to ask any questions here.",
                createdAt: "2025-05-05T03:38:11+07:00",
                upvotes: 12,
                subtable: {
                    subtableId: "00000000-0000-0000-0000-000000000041",
                    name: "AskAnything",
                    icon: "https://picsum.photos/50"
                }
            },
            {
                postId: "00000000-0000-0000-0000-000000000052",
                title: "Another post by user",
                body: "This is another example post for testing.",
                createdAt: "2025-05-06T10:00:00+07:00",
                upvotes: 7,
                subtable: {
                    subtableId: "00000000-0000-0000-0000-000000000042",
                    name: "TestSubtable",
                    icon: "https://picsum.photos/51"
                }
            }
        ];

        // Nếu muốn lọc theo userId, bạn có thể làm như sau (ở đây dữ liệu giả nên luôn trả về)
        // const userPosts = mockData.filter(post => post.authorUserId === userId);

        // Chuẩn hóa cho ListPostPreviewSubtable nếu cần
        return mockData.map(post => ({
            post: {
                postId: post.postId,
                title: post.title,
                content: post.body,
                createdAt: post.createdAt,
                upvotes: post.upvotes,
                time: post.createdAt
            },
            subtable: post.subtable
        }));
    }
}

export default new PostService();