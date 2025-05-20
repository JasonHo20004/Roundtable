import React from 'react';
import Comment from '#features/comments/components/Comment/Comment'

export default function CommentReplies({replies, postId, subtableName, onReplyPosted, currentUser}) {
    if (!replies || replies.length === 0) {
        return null;
    }

    return (
        <div className="comment-replies ps-4"> {/* Keep the padding for indentation */}
            {replies.map(reply => (
                <Comment
                    key={reply.commentId}
                    comment={reply}
                    postId={postId} // Pass postId down
                    subtableName={subtableName} // Pass subtableName down
                    onReplyPosted={onReplyPosted} // Pass handler down
                    currentUser={currentUser} // Pass user down
                />
            ))}
        </div>
    );
}