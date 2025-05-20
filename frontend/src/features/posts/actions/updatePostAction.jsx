import postService from "../../../services/postService.jsx";

import {redirect} from "react-router";

export default async function action({ request, params }) {
    
    const formData = await request.formData();
    const content = formData.get("contentEditor");
    const postId = params.postId; // Assuming you have the postId in the URL params
    console.log("Update Post Action", content);
    console.log("Update Post Action", postId);
    console.log("Update Post Action",postService,"888");
    console.log("postService.updatePost is:", postService.updatePost,")))");
  
     // Basic Validation
     if (!content) {
        return { success: false, message: "content and community selection are required.", status: 400 };
    }

    try {
        const response = await postService.updatePost({
            body: content, // Assuming API expects 'body' for content
        }, postId); // Pass the postId to the updatePost method
        console.log("Update Post Action response", response);
        if (response.success) {
            // Redirect to the newly created post or subtable page
            //const postId = response.data?.post?.postId; // Adjust based on actual response structure
            if (postId) {
                return redirect(`/comments/${postId}`);
            } else {
                // Redirect to home or subtable page if postId is not available
                return redirect('/');
            }
        } else {
             console.log("PostService")
            // Return error from API
            return {
                success: false,
                message: response.message || "Failed to update post.",
                status: response.status || 500
            };
        }
    }
    catch (error) {
        console.error("Action Error updating post:", error);
        return {
            success: false,
            message: error.data?.message || error.message || "An unexpected error occurred.",
            status: error.status || 500
        };
    }

}