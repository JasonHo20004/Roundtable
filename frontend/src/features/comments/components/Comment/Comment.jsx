import React, {useCallback, useEffect, useRef, useState} from "react";
import {useFetcher, useRevalidator} from "react-router";
import useVote from "#features/posts/hooks/vote-hook.jsx";
import WriteComment from "#features/comments/components/WriteComment/WriteComment";
import CommentHeader from '#features/comments/components/CommentHeader/CommentHeader';
import CommentBody from '#features/comments/components/CommentBody/CommentBody';
import CommentActions from '#features/comments/components/CommentActions/CommentActions';
import CommentReplies from '#features/comments/components/CommentReplies/CommentReplies';
import CommentEditor from '#features/comments/components/CommentEditor/CommentEditor';
import './Comment.css';

export default function Comment(props) {
    const {
        comment: initialComment,
        postId,
        subtableName,
        onReplyPosted,
        currentUser
    } = props;

    const [comment, setComment] = useState(initialComment);
    const [isEditing, setIsEditing] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [editError, setEditError] = useState(null);

    const originalBodyRef = useRef(initialComment.body);
    const revalidator = useRevalidator();
    const fetcher = useFetcher();

    useEffect(() => {
        setComment(initialComment);
        if (!isEditing) { // Update original body ref if not in editing mode
            originalBodyRef.current = initialComment.body;
        }
    }, [initialComment, isEditing]);

    const {
        voteStatus,
        voteCount,
        isVoting,
        voteError,
        handleUpvote,
        handleDownvote
    } = useVote({
        initialCount: comment.voteCount,
        initialVote: comment.userVote ?? null,
        postId: postId,
        commentId: comment.commentId,
    });

    const isOwner = currentUser && comment.author && currentUser.userId === comment.author.userId;

    const handleEditClick = useCallback(() => {
        originalBodyRef.current = comment.body; // Store current body before editing
        setIsEditing(true);
        setIsPopoverOpen(false);
        setEditError(null);
    }, [comment.body]);

    const handleCancelEdit = useCallback(() => {
        setIsEditing(false);
        setComment(prev => ({...prev, body: originalBodyRef.current})); // Revert to original on cancel
        setEditError(null);
    }, []);

    const handleDeleteComment = useCallback(() => {
        if (window.confirm("Are you sure you want to softDelete this comment?")) {
            const actionPath = `/comments/${comment.commentId}/manage`; // Or your dedicated softDelete route
            // Submit with the DELETE method. No actual form data needed for the body here.
            fetcher.submit(
                null, // No form data for DELETE body
                {
                    method: "delete",
                    action: actionPath,
                }
            );
            setIsPopoverOpen(false);
            // Optimistically update the UI to reflect the softDelete
            setComment(prev => ({...prev, body: null, author: null}));
        }
    }, [comment.commentId, fetcher]);


    // Effect to handle the fetcher's response for deletion (or other actions)
    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data) {
            if (fetcher.data.success && fetcher.formMethod === 'delete') {
                // Revalidate to refresh data (e.g., refetch comments for the post)
                if (revalidator.state === 'idle') {
                    revalidator.revalidate();
                }
            } else if (!fetcher.data.success && fetcher.formMethod === 'delete') {
                console.error("Failed to softDelete comment:", fetcher.data.message);
                alert(`Error deleting comment: ${fetcher.data.message}`);
            }
            // Handle other fetcher.data responses if this fetcher is used for multiple actions
        }
    }, [fetcher.state, fetcher.data, fetcher.formMethod, revalidator]);

    const handleSaveEditAttempt = useCallback((newBody) => {
        // Optimistically update the UI
        setComment(prevComment => ({...prevComment, body: newBody}));
        setIsEditing(false); // Close editor optimistically, can be reopened on error
    }, []);

    const handleSaveEditServerResponse = useCallback((success, dataOrError) => {
        if (success && dataOrError) {
            // Server confirmed, ensure local state matches server response
            setComment(prev => ({...prev, ...dataOrError}));
            setEditError(null);
            if (revalidator.state === 'idle') {
                revalidator.revalidate().then((r) => {
                    console.log('Revalidation completed:', r);
                });
            }
        } else {
            // API call failed, revert to the original body and show error
            setComment(prevComment => ({...prevComment, body: originalBodyRef.current}));
            setEditError(dataOrError?.message || "Failed to save comment. Please try again.");
            setIsEditing(true); // Re-open editor for user to retry or cancel
        }
    }, [revalidator]);


    const handleReplyClick = useCallback(() => {
        setIsReplying(prev => !prev);
    }, []);

    const handlePostReply = useCallback(() => {
        setIsReplying(false);
        if (onReplyPosted) {
            onReplyPosted();
        }
    }, [onReplyPosted]);

    const handleSaveComment = useCallback(() => {
        console.log(`Save comment clicked: ${comment.commentId}`);
    }, [comment.commentId]);

    const handleReportComment = useCallback(() => {
        console.log(`Report comment clicked: ${comment.commentId}`);
    }, [comment.commentId]);

    const handlePopoverOpen = useCallback(() => setIsPopoverOpen(true), []);
    const handlePopoverClose = useCallback(() => setIsPopoverOpen(false), []);

    const isReply = !!comment.parentCommentId;
    const commentComponentClasses = `
        comment-component card p-3 my-2
        ${isReply ? 'comment-reply' : ''}
        ${isPopoverOpen ? 'popover-is-open' : ''}
    `.trim().replace(/\s+/g, ' ');

    if (!comment.body && !comment.author && !comment.parentCommentId && comment.replies?.length === 0) {
        return null;
    }

    return (
        <div
            className={`comment-thread-item ${isReply ? 'is-reply-item' : ''}`}
            id={`comment-${comment.commentId}`}
        >
            <div className={commentComponentClasses}>
                <CommentHeader
                    author={comment.author}
                    createdAt={comment.commentCreatedAt}
                />
                {isEditing ? (
                    <CommentEditor
                        originalCommentBody={originalBodyRef.current}
                        commentToEdit={comment}
                        onAttemptSave={handleSaveEditAttempt} // For optimistic update
                        onSaveResponse={handleSaveEditServerResponse} // For handling server response
                        onCancel={handleCancelEdit}
                    />
                ) : (
                    <CommentBody body={comment.body}/>
                )}

                {editError && !isEditing && ( // Display error if not editing (e.g. after failed save attempt)
                    <div className="alert alert-danger mt-2 fs-8 p-1" role="alert">
                        {editError}
                    </div>
                )}

                {!isEditing && (
                    <CommentActions
                        isOwner={isOwner}
                        voteStatus={voteStatus}
                        voteCount={voteCount}
                        isVoting={isVoting}
                        voteError={voteError}
                        handleUpvote={handleUpvote}
                        handleDownvote={handleDownvote}
                        handleReplyClick={handleReplyClick}
                        handleEditComment={handleEditClick}
                        handleDeleteComment={handleDeleteComment}
                        handleSaveComment={handleSaveComment}
                        handleReportComment={handleReportComment}
                        onPopoverOpen={handlePopoverOpen}
                        onPopoverClose={handlePopoverClose}
                    />
                )}

                {isReplying && !isEditing && (
                    <div className="reply-input-area mt-3">
                        <WriteComment
                            postId={postId}
                            parentCommentId={comment.commentId}
                            onCommentSubmit={handlePostReply}
                            onCancel={() => setIsReplying(false)}
                        />
                    </div>
                )}
            </div>

            <CommentReplies
                replies={comment.replies}
                postId={postId}
                subtableName={subtableName}
                onReplyPosted={onReplyPosted}
                currentUser={currentUser}
            />
        </div>
    );
}