// #features/posts/pages/PostDetailedView/PostDetailedView.jsx
import React, {useCallback, useEffect, useState} from "react";
// Ensure 'react-router-dom' is used if that's your router library
import {useLoaderData, useNavigation, useRevalidator} from "react-router";

import PostHeaderDetailed from "#features/posts/components/PostHeaderDetailed/PostHeaderDetailed";
import PostCore from "#features/posts/components/PostCore/PostCore";
import WriteComment from "#features/comments/components/WriteComment/WriteComment.jsx";
import Comment from "#features/comments/components/Comment/Comment.jsx";
import useAuth from "#hooks/useAuth.jsx";
import "./PostDetailedView.css";

export default function PostDetailedView() {
    const {user} = useAuth();
    // Get data from the loader
    const initialData = useLoaderData();
    // Get revalidator and navigation state
    const revalidator = useRevalidator();
    const navigation = useNavigation();

    // State derived from loader data or managed locally
    // Use state to allow potential updates if needed, initialized from loader
    const [post, setPost] = useState(initialData?.data.post);
    const [subtable, setSubtable] = useState(initialData?.data.subtable);
    const [author, setAuthor] = useState(initialData?.data.author);
    const [comments, setComments] = useState(initialData?.data.comments || []);

    console.log("PostDetailedView initialData: ", author); // Log initial data for debugging
    console.log("user", user); // Log post data for debugging

    const [checkYourPost, setCheckYourPost] = useState(false); // State to check if the post is from the current user

    // Local UI state remains the same
    const [isWritingTopLevelComment, setIsWritingTopLevelComment] = useState(false);
    const [error, setError] = useState(null); // For fetcher/action errors or maybe loader errors if not using errorElement

    
    // --- Update state when loader data changes ---
    useEffect(() => {
        if(user?.userId && author?.userId) // Ensure user and author are defined before comparison
        {
            if(user.userId === author.userId) { // Check if the post is from the current user
                console.log("Ktcc",checkYourPost)
    
                    setCheckYourPost(true); // Check if the post is from the current user
                }
            else setCheckYourPost(false); // Post is not from the current user    

        }
       
        
        // Only update state if the component is mounted and data is available
        // Check navigation/revalidator state to ensure updates happen after load/revalidation
        if (navigation.state === 'idle' && revalidator.state === 'idle') {
            // Use the latest data potentially available on revalidator, fallback to initialData
            const currentData = revalidator.data || initialData.data;
            if (currentData) { // Ensure currentData is not null/undefined
                setPost(currentData.post);
                setSubtable(currentData.subtable);
                setAuthor(currentData.author);
                // Ensure comments are always an array
                setComments(Array.isArray(currentData.comments) ? currentData.comments : []);
                setError(null); // Clear previous errors on successful load/reload
                
                console.log("Loader data processed, component state updated.");
            } else {
                console.log("Loader data not available for state update.");
                setError("Failed to retrieve data after load/revalidation.");
            }
        }
        // Dependencies ensure this effect runs when loading states change or data potentially updates
    }, [navigation.state, revalidator.state, initialData, revalidator.data]);

    useEffect(() => {
        if (!post?.postId) return;
        const KEY = 'recentViewedPosts';
        const viewed = JSON.parse(localStorage.getItem(KEY) || '[]');
        const updated = [post.postId, ...viewed.filter(id => id !== post.postId)]
                        .slice(0, 10);
        localStorage.setItem(KEY, JSON.stringify(updated));
      }, [post.postId]);

    // Callback triggered by WriteComment after successful submission
    const handleCommentPosted = useCallback(() => {
        console.log("!!! handleCommentPosted in PostDetailedView EXECUTING !!!"); // Log execution
        setIsWritingTopLevelComment(false); // Close the input form
        // Trigger a reload of the loader data
        if (revalidator.state === 'idle') { // Prevent multiple rapid revalidations
            console.log("Triggering revalidation from handleCommentPosted...");
            revalidator.revalidate();
        } else {
            console.log("Revalidator not idle, skipping revalidate call.");
        }
    }, [revalidator]); // Depends on revalidator

    // Callback for Comment component replies
    const triggerCommentRefetch = useCallback(() => {
        console.log("A reply was posted, triggering revalidation (triggerCommentRefetch)...");
        // Trigger a reload of the loader data
        if (revalidator.state === 'idle') { // Prevent multiple rapid revalidations
            console.log("Triggering revalidation from triggerCommentRefetch...");
            revalidator.revalidate();
        } else {
            console.log("Revalidator not idle, skipping revalidate call.");
        }
    }, [revalidator]); // Depends on revalidator


    const handleNavigateBack = () => {
        console.log("Navigate back requested");
        window.history.back();
    };

    // --- Render Logic ---

    // Loading state based on navigation (initial load or revalidation)
    const isLoading = navigation.state === "loading" || revalidator.state === "loading";

    // Use the isLoading flag derived above
    // if (isLoading && !post) { // Show full loading indicator only if post data isn't available yet
    //     return <div className="p-3">Loading post details...</div>;
    // }


    // // Handle cases where loader failed or returned no essential data
    // if (!post || !subtable || !author) {
    //     // Check if it's loading, otherwise show error
    //     if (isLoading) {
    //         return <div className="p-3">Loading post details...</div>; // Still loading essentials
    //     }
    //     // If not loading and data is missing, show error.
    //     console.error("Essential post data missing:", {post, subtable, author});
    //     return <div className="p-3 text-danger">Failed to load essential post details. Please try refreshing.</div>;
    // }

    const isMissingData = !post || !subtable || !author;

    const [updatePost, setUpdatePost] = useState(false); // State to check if the post is from the current user
    const handleUpdatePost = () => {
        setUpdatePost(true); 
    }
    const handleUpdatePostCancel = () => {
        setUpdatePost(false); 
    }


    return (
    <>
    {isLoading && !post ? (
                <div className="p-3">Loading post details...</div>
            ) : isMissingData ? (
                <div className="p-3 text-danger">Failed to load essential post details. Please try refreshing.</div>
            ) : (
        <>
            {/* --- Post Details --- */}
            <div className="post-detailed-container card p-3 my-3">
                {checkYourPost ? (
                <PostHeaderDetailed
                    subtable={subtable}
                    post={post}
                    author={author}
                    onBackClick={handleNavigateBack}
                    isCheckYourPost={checkYourPost}
                    onUpdatePost={handleUpdatePost} // Pass the update handler to PostHeaderDetailed
                />
                ) : (
                <PostHeaderDetailed
                    subtable={subtable}
                    post={post}
                    author={author}
                    onBackClick={handleNavigateBack}
                />
                )}
                <PostCore post={post} updatePost={updatePost} onUpdatePostCancel={handleUpdatePostCancel}/>
            </div>

            {/* --- Write Top-Level Comment --- */}
            <div className="mb-3 px-3">
                {user ? (
                    !isWritingTopLevelComment ? ( // Conditional rendering based on state
                        <input
                            type="text"
                            className="form-control rounded-pill small-placeholder"
                            placeholder="Add a comment..."
                            onClick={() => setIsWritingTopLevelComment(true)}
                            readOnly
                        />
                    ) : (
                        <WriteComment
                            // Key added in case postId changes, forces remount/reset
                            key={`write-comment-${post.postId}`}
                            postId={post.postId}
                            parentCommentId={null}
                            onCommentSubmit={handleCommentPosted} // Should trigger setIsWritingTopLevelComment(false)
                            onCancel={() => setIsWritingTopLevelComment(false)}
                        />
                    )
                ) : (
                    <div className="px-3 text-muted fs-8 mb-3">
                        Log in or sign up to leave a comment
                    </div>
                )}
            </div>

            {/* Display general error (e.g., from actions if not handled elsewhere) */}
            {error && <div className="text-danger px-3 pb-2">{error}</div>}

            {/* Revalidation indicator (shows when revalidator is loading fresh data) */}
            {revalidator.state === "loading" && <div className="px-3 pb-2 text-muted">Refreshing comments...</div>}


            {/* --- Comments Section --- */}
            <div className="px-3" id="comment-section">
                {/* Defensive check: ensure comments is an array before mapping */}
                {Array.isArray(comments) && comments.length > 0 ? (
                    comments.map((comment) => (
                        <Comment
                            key={comment.commentId} // React key for list items
                            subtableName={subtable?.name || ''}
                            comment={comment}
                            onReplyPosted={triggerCommentRefetch} // Pass down the refetch trigger
                            currentUser={user}
                            postId={post.postId} // Pass postId for vote hook etc.
                        />
                    ))
                ) : (
                    // Avoid showing "No comments" while actively loading/revalidating
                    !(navigation.state === "loading" || revalidator.state === "loading") &&
                    <div className="text-muted px-3 pb-3 fs-8">No comments yet.</div>
                )}
            </div>
        </>)}
    </>
         
    );
}