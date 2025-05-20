import commentService from "#services/commentService"; // Ensure this path is correct

/**
 * React Router action to handle comment form submissions.
 * Works with the original CommentService that returns response.data directly.
 * @param {object} args - Action arguments.
 * @param {Request} args.request - The Fetch Request object.
 * @param {object} args.params - Route parameters (e.g., { postId: "..." }).
 * @returns {Promise<object>} - An object indicating success or failure, used by useFetcher.
 */
export default async function replyAction({request, params}) {
    const formData = await request.formData();
    // Use Object.fromEntries for cleaner data extraction
    const data = Object.fromEntries(formData.entries());

    // Get the HTTP method
    const method = request.method.toLowerCase();

    // Get commentId from route parameters (more reliable than URL splitting)
    const {commentId} = params;

    console.log("Replying to comment:", commentId, data);

    if (!commentId) {
        console.warn("Action Warning: commentId is missing.");
        // Return an object compatible with useFetcher
        return {
            status: 400, // Bad Request
            success: false,
            message: "commentId is required.",
        };
    }

    if (method !== 'post') {
        console.warn(`Action Warning: Method ${request.method} not allowed.`);
        // Return an object compatible with useFetcher
        return {
            status: 405, // Method Not Allowed
            success: false,
            message: `Method ${request.method} not supported for this action.`,
        };
    }

    const {content} = data; // parentId might be undefined/null/""

    // Validate comment content (trim whitespace)
    if (!content || content.trim().length === 0) {
        console.warn("Action Warning: Comment content is empty.");
        // Return an object compatible with useFetcher
        return {
            status: 400, // Bad Request
            success: false,
            message: "Comment content cannot be empty.",
        };
    }

    // --- Call Comment Service ---
    try {
        const response = await commentService.replyToComment(commentId, content.trim());

        // --- Handle Successful Response ---
        return {
            status: response.status,
            success: true,
            message: response.message,
            data: response.data,
        };

    } catch (error) {
        // --- Handle Errors Thrown by sendApiRequest/Service ---
        console.error("Action Error: Failed during comment service call.", {
            status: error.status,
            message: error.message,
            responseData: error.data
        });

        return {
            status: error.status || 500,
            success: false,
            message: error.data?.message || error.message || "An unexpected error occurred while posting the comment.",
        };
    }
}
