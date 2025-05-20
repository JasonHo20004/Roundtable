// #routes/postRoutes.js (or wherever postRoutes is defined)
import React, {lazy} from 'react';

import commentAction from "#features/comments/actions/commentAction.jsx";
import replyAction from "#features/comments/actions/replyAction.jsx";
import postDetailLoader from "#features/posts/loaders/postDetailLoader.jsx";
import createPostLoader from "#features/posts/loaders/createPostLoader.jsx";
import createPostAction from "#features/posts/actions/createPostAction.jsx";
import updatePostAction from "#features/posts/actions/updatePostAction.jsx";
import managePostAction from "#features/posts/actions/managePostAction.jsx";

const PostDetailView = lazy(() => import('#features/posts/pages/PostDetailedView/PostDetailedView'));
const CreatePost = lazy(() => import('#features/posts/pages/CreatePost/CreatePost'));

// --- Define the Routes ---
function postRoutes() {
    return [
        {
            path: "/comments/:postId", // Match the component path
            element: <PostDetailView/>,
            loader: postDetailLoader,
        },
        {
            path: "/submit",
            element: <CreatePost/>,
            loader: createPostLoader,
            action: createPostAction,
        },
        {
            path: "/comments/:commentId/reply", // Action for replies
            action: replyAction,
        },
        {
            path: "/posts/:postId/comment",      // Action for top-level comments
            action: commentAction,
        },
        {
            path:"/comments/:postId/update",
            action: managePostAction, // Assuming you have an action for updating posts
        }
    ]
}

export default postRoutes;