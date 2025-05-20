// #features/posts/components/PostCore/PostCore.jsx
import React ,{useEffect,useRef}from "react";
import Button from "#shared/components/UIElement/Button/Button";
import Icon from "#shared/components/UIElement/Icon/Icon";
import useVote from "#features/posts/hooks/vote-hook.jsx";
import TextEdit from "#shared/components/UIElement/TextEditor/TextEditor"; // Assuming correct path
import "./PostCore.css"; // Add specific styling if needed
import Form from "#shared/components/UIElement/Form/Form";
import {useFetcher} from "react-router";
import $ from 'jquery';

export default function PostCore(props) {
    // Destructure post from props. userVote is now directly on the post object from the service.
    const {post,updatePost,onUpdatePostCancel} = props;

    // Initialize the hook with data from the post object
    const {
        voteStatus, // Will be 'upvote', 'downvote', or null
        voteCount,
        isVoting,
        voteError,
        handleUpvote,
        handleDownvote
    } = useVote(
        {
            initialCount: post.voteCount,
            initialVote: post.userVote,
            postId: post.postId,
        },
    );

    // --- Share Handler ---
    const handleShare = () => {
        const postUrl = `${window.location.origin}/posts/${post.postId}`; // Construct a more robust URL
        navigator.clipboard.writeText(postUrl)
            .then(() => alert("Link copied to clipboard!"))
            .catch(err => console.error("Failed to copy link: ", err));
    };

    // --- Comment Handler Placeholder ---
    const handleCommentClick = () => {
        // Find the comment section and scroll to it, or trigger a state change in parent
        const commentSection = document.getElementById('comment-section'); // Example ID
        if (commentSection) {
            commentSection.scrollIntoView({behavior: 'smooth'});
        }
    };


    const fetcher = useFetcher();
    const isSubmitting = fetcher.state === "submitting";

    const actionPath = `/comments/${post.postId}/update`;

    // useEffect(() => {
    //     if (fetcher.state === "idle" && fetcher.data) {
    //         if (fetcher.data.status === 201) {
    //             console.log("Fetcher completed successfully:", fetcher.data.message);
    //             if (editorRef.current) {
    //                 editorRef.current.clearContent();
    //             }
    //             // if (onCommentSubmit) {
    //             //     console.log("Triggering onCommentSubmit callback...");
    //             //     // Pass data if the parent needs it, otherwise just call it
    //             //     onCommentSubmit(fetcher.data.data); // Pass the actual comment data if needed by parent
    //             // }
    //         } else {
    //             // Handle cases where action returned data, but it wasn't status 201
    //             console.error("Post submission failed (action returned data):", fetcher.data.message);
    //             alert(`Failed to post comment: ${fetcher.data.message || 'Action returned an error status.'}`);
    //         }
    //     } else {
    //         // Log why the condition failed when the effect runs
    //         if (fetcher.state === 'idle' && !fetcher.data) {
    //             console.log("Condition NOT Met: Fetcher is idle BUT fetcher.data is undefined/falsy.");
    //         }
    //     }
    //     // Make sure onCommentSubmit is stable (useCallback in parent) if included, otherwise remove if not needed for logic here
    // }, [fetcher.state, fetcher.data]);
    const handleCancel = () => {
        if (onUpdatePostCancel) {
            onUpdatePostCancel();
        }
    }

    const editorRef = useRef(null);    // Ref to access TextEdit component methods

    console.log("PostCore post: ", post);
    const handleBeforeSubmit = (event) => {
        if (onUpdatePostCancel) {
            onUpdatePostCancel();
        }
        
        if (!editorRef.current) {
            event.preventDefault();
            return;
        }
        const content = editorRef.current.getContent();
        // Improved check for effectively empty content (handles empty tags)
        const textContent = $(`<div>${content}</div>`).text().trim();
        const images = $(`<div>${content}</div>`).find('img').length; // Check for images too

        if (!textContent && images === 0) {
            console.log("Content is effectively empty. Preventing submission.");
            alert("Content cannot be empty.");
            event.preventDefault();
        } else {
            console.log(`Submitting comment/reply via custom Form (fetcher mode) to ${actionPath}...`);
        }
    };

    return (
        <>
            <Form
                method='patch' // Use 'patch' for updates, 'post' for new comments
                action={actionPath}
                onSubmit={handleBeforeSubmit}
                preventNavigation={true}
                fetcher={fetcher}
            >
                {/* Post Title */}
                <h5 className="fw-bold mt-2">{post.title}</h5>
                {/* Post Content */}

                {updatePost ? (
                    <>
                        <input type="hidden" name="content" />
                        <div className="m-3">
                            <TextEdit ref={editorRef} name="contentEditor" value={post.body} />
                        </div>
                        <div className="card-footer justify-content-end d-flex p-2">
                            <Button
                                onClick={handleCancel}
                                mainClass="write-comment-button"
                                addClass="cancel-button"
                                type="button"
                                disabled={isSubmitting}
                            >
                                Hủy
                            </Button>
                            &nbsp;
                            <Button
                                type="submit"
                                mainClass="write-comment-button"
                                addClass="submit-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Đang gửi..." : "Cập nhật"}
                            </Button>
                </div>
                    </>
                    
                ) : (
                    post.body && (
                        <div
                            className={`fs-content mt-2 mb-2 ${props.contentClass || ''}`}
                            dangerouslySetInnerHTML={{ __html: post.body }}
                        />
                    )
                )}
                

                {/* Post Actions */}
                <div className="post-actions-container d-flex align-items-center gap-2 mt-2">
                    {voteError && <div className="text-danger fs-8 me-2">Error: {voteError}</div>}

                    {/* Vote Buttons */}
                    {/* Use voteStatus ('upvote'/'downvote'/null) for dynamic class */}
                    <div
                        className={`vote-container ${voteStatus || 'no-vote'} d-flex align-items-center rounded-pill gap-2 bg-light p-1`}>
                        <Button
                            mainClass="upvote-btn" contentType="icon"
                            dataBsToggle="tooltip" dataBsTrigger="hover focus" tooltipTitle="Upvote" tooltipPlacement="top"
                            padding="1"
                            onClick={handleUpvote} disabled={isVoting}>
                            {/* Use voteStatus to determine icon state */}
                            <Icon mainClass="upvote-icon" name="upvote"
                                size="15px" />
                        </Button>
                        <span
                            className="fs-8 fw-bold vote-count">{voteCount}</span> {/* Added class for potential styling */}
                        <Button
                            mainClass="downvote-btn" contentType="icon"
                            dataBsToggle="tooltip" dataBsTrigger="hover focus" tooltipTitle="Downvote"
                            tooltipPlacement="top"
                            padding="1"
                            onClick={handleDownvote} disabled={isVoting}>
                            {/* Use voteStatus to determine icon state */}
                            <Icon mainClass="downvote-icon" name='downvote'
                                size="15px" />
                        </Button>
                    </div>

                    {/* Comment Button */}
                    <div
                        className="comment-container d-flex align-items-center rounded-pill gap-1 bg-light p-1">
                        {/* Make the whole div clickable or just the button */}
                        <Button
                            mainClass="comment-btn" contentType="icon"
                            dataBsToggle="tooltip" dataBsTrigger="hover focus" tooltipTitle="Comments"
                            tooltipPlacement="top"
                            padding="1"
                            onClick={handleCommentClick}
                        >
                            <Icon mainClass="comment-icon" name="comment" size="15px" />
                            {/* Ensure commentCount exists before displaying */}
                            <span className="fs-8 fw-bold ms-1">{post.commentCount ?? 0}</span>
                        </Button>
                    </div>

                    {/* Share Button */}
                    <div
                        className="share-container d-flex align-items-center rounded-pill gap-1 bg-light p-1">
                        <Button
                            mainClass="share-btn" contentType="icon"
                            dataBsToggle="tooltip" dataBsTrigger="hover focus" tooltipTitle="Share" tooltipPlacement="top"
                            padding="1"
                            onClick={handleShare}>
                            <Icon mainClass="share-icon" name="share" size="15px" />
                            <span className="fs-8 fw-bold ms-1">Share</span> {/* Added margin */}
                        </Button>
                    </div>
                </div>
            </Form>
        </>
    );
}
