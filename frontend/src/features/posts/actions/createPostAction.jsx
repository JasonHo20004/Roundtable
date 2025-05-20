import postService from "#services/postService.jsx";
import {redirect} from "react-router";

export default async function action({request}) {
    const formData = await request.formData();
    const title = formData.get("title");
    const content = formData.get("content");
    const subtableId = formData.get("subtableId");

    // Basic Validation
    if (!title || !content || !subtableId) {
        return {success: false, message: "Title, content, and community selection are required.", status: 400};
    }

    // More specific content validation (check if effectively empty)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    const images = tempDiv.getElementsByTagName('img').length;

    if (textContent.trim().length === 0 && images === 0) {
        return {success: false, message: "Post content cannot be empty.", status: 400};
    }

    try {
        const response = await postService.createPost({
            title,
            body: content, // Assuming API expects 'body' for content
            subtableId,
        });

        if (response.success) {
            // Redirect to the newly created post or subtable page
            const postId = response.data?.post?.postId; // Adjust based on actual response structure
            if (postId) {
                return redirect(`/comments/${postId}`);
            } else {
                // Redirect to home or subtable page if postId is not available
                return redirect('/');
            }
        } else {
            // Return error from API
            return {
                success: false,
                message: response.message || "Failed to create post.",
                status: response.status || 500
            };
        }
    } catch (error) {
        console.error("Action Error creating post:", error);
        return {
            success: false,
            message: error.data?.message || error.message || "An unexpected error occurred.",
            status: error.status || 500
        };
    }
}