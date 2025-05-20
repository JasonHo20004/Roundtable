import commentService from "#services/commentService.jsx";

export default async function editCommentAction({request, params}) {
    const formData = await request.formData();
    // Use Object.fromEntries for cleaner data extraction
    const data = Object.fromEntries(formData.entries());

    // Get the HTTP method
    const method = request.method.toLowerCase();

    if (method !== 'patch') {
        return {
            status: 405,
            success: false,
            message: 'Method not allowed'
        }
    }

    // Get the commentId from the params
    const {commentId} = params;

    if (!commentId) {
        return {
            status: 400,
            success: false,
            message: 'Comment ID is required'
        }
    }

    const {body} = data;

    if (!body) {
        return {
            status: 400,
            success: false,
            message: 'Comment body can not be empty'
        }
    }

    try {
        const response = await commentService.editComment(commentId, body);
        return {
            status: response.status,
            success: true,
            message: response.message,
            data: response.data
        }
    } catch (error) {
        return {
            status: error.status || 500,
            success: false,
            message: error.message || 'Something went wrong'
        }

    }
}