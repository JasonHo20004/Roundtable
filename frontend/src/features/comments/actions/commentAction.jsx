// #features/posts/pages/PostDetailedView/commentAction.jsx
import commentService from "#services/commentService"; // Ensure this path is correct

/**
 * React Router action to handle comment form submissions.
 * Works with the original CommentService that returns response.data directly.
 * @param {object} args - Action arguments.
 * @param {Request} args.request - The Fetch Request object.
 * @param {object} args.params - Route parameters (e.g., { postId: "..." }).
 * @returns {Promise<object>} - An object indicating success or failure, used by useFetcher.
 */
export default async function commentAction({request, params}) {
    const formData = await request.formData();
    // Use Object.fromEntries for cleaner data extraction
    const data = Object.fromEntries(formData.entries());

    // Get the HTTP method
    const method = request.method.toLowerCase();

    // Get postId from route parameters (more reliable than URL splitting)
    const {postId} = params;

    if (!postId) {
        console.warn("Action Warning: postId is missing.");
        // Return an object compatible with useFetcher
        return {
            status: 400,
            success: false,
            message: "postId is required.",
        };
    }

    if (method !== 'post') {
        console.warn(`Action Warning: Method ${request.method} not allowed.`);
        // Return an object compatible with useFetcher
        return {
            status: 405,
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
            status: 400,
            success: false,
            message: "Comment content cannot be empty.",
        };
    }

    // --- Call Comment Service ---
    try {
        const response = await commentService.addComment(postId, content.trim());
        const result = {
            status: response.status,
            success: true,
            message: response.message,
            data: response.data
        };
        console.log("!!! commentAction returning (success):", result); // Log before return
        return result;
    } catch (error) {
        const errorResult = {
            success: false,
            status: error.status || 500,
            message: error.data?.message || error.message || "An unexpected error occurred while posting the comment.",
        };
        console.log("!!! commentAction returning (error catch):", errorResult); // Log before return
        return errorResult;
    }
}
