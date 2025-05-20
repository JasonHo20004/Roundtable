import {redirect} from "react-router";
import PostService from "#services/postService.jsx";

async function postDetailLoader({params}) {
    const {postId} = params;
    if (!postId) {
        console.error("Loader error: postId is missing");
        // Or redirect to an error page or home
        return redirect('/error?message=PostID missing');
    }
    try {
        console.log("Loader: Fetching post details for postId:", postId);
        return await PostService.getPostDetails(postId)
    } catch (err) {
        console.error("Loader error fetching post details:", err);
        throw new Response("Failed to load post details", {status: err.status || 500});
    }
}

export default postDetailLoader;