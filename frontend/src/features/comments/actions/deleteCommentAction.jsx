import commentService from "#services/commentService.jsx";

export default async function deleteCommentAction({request, params}) {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    // Get the HTTP method
    const method = request.method.toLowerCase();

    if (method !== 'delete') {
        return {
            status: 405,
            success: false,
            message: 'Method not allowed'
        }
    }

    const {commentId} = params;

    try {
        // Delete the comment
        const response = await commentService.deleteComment(commentId);

        return {
            status: response.status,
            success: true,
            message: response.message,
            data: response.data
        }
    } catch (error) {
        return {
            status: error.status,
            success: false,
            message: error.message,
            data: error.data
        }
    }
}