// #features/posts/components/PostPreview/PostPreview.jsx (or rename existing Post.jsx)
import React from "react";
import Link from "#shared/components/Navigation/Link/Link";

import PostHeaderPreviewSubtable from "#features/posts/components/PostHeaderPreviewSubtable/PostHeaderPreviewSubtable";
import PostCore from "#features/posts/components/PostCore/PostCore";


export default function PostPreview(props) {
    const {post} = props;
    // console.log("post preview")
    // console.log(post)

    return (
        <Link to={`/comments/${post.post.postId}`} className="post-preview-link">
            <div className="post-preview-container card p-3 my-3">
                <PostHeaderPreviewSubtable
                    author={post.author}
                    post={post.post}
                />
                <PostCore
                    post={post.post}
                    mainClass="post-content-preview"
                />
            </div>
        </Link>
    );
}
