import React from "react";
import PostPreviewSubtable from "#features/posts/components/PostPreviewSubtable/PostPreviewSubtable";

export default function ListPostPreview(props) {
    const { posts } = props;
    // console.log("các post")
    // console.log(posts)
    return (
        <div className="list-post-preview">
            {posts.map((post) =>{
               return (
                <PostPreviewSubtable
                    key={post.post.postId}
                    post={post}
                />
            );
            })}

        </div>
    );
}