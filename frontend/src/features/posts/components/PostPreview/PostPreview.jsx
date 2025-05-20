// #features/posts/components/PostPreview/PostPreview.jsx (or rename existing Post.jsx)
import React from "react";
import Link from "#shared/components/Navigation/Link/Link";

import PostHeaderPreview from "#features/posts/components/PostHeaderPreview/PostHeaderPreview";
import PostCore from "#features/posts/components/PostCore/PostCore";
import "./PostPreview.css";

export default function PostPreview(props) {
    const {post, subtable, isJoined, onJoinClick} = props;
    return (
        <Link to={`/comments/${post.postId}`} className="post-preview-link">
            <div className="post-preview-container card p-3 my-3">
                <PostHeaderPreview
                    subtable={subtable}
                    post={post}
                    isJoined={isJoined} // Example prop
                    onJoinClick={(e) => {
                        e.preventDefault();
                        onJoinClick?.(subtable.subtableId);
                    }} // Prevent navigation on join click
                />
                <PostCore
                    post={post}
                    mainClass="post-content-preview"
                />
            </div>
        </Link>
    );

}
