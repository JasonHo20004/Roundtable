// src/features/users/pages/UserProfileView/UserProfileContent.jsx
import React, {useCallback, useEffect, useState} from "react";
import Comment from "#features/comments/components/Comment/Comment.jsx";
import PostPreview from "#features/posts/components/PostPreview/PostPreview.jsx";
import postService from "#services/postService.jsx";
import commentService from "#services/commentService.jsx";
import voteService from "#services/voteService.jsx";
import LoadingSpinner from "#shared/components/UIElement/LoadingSpinner/LoadingSpinner.jsx";

// Helper to render lists of posts or comments
const RenderItemList = ({items, itemType, noItemsMessage, currentUser}) => {
    if (!items || items.length === 0) {
        return <div className="p-3 text-muted">{noItemsMessage}</div>;
    }
    return items.map(item => {
        if (itemType === "post") {
            const postData = item.post || item;
            const subtableData = item.subtable;
            return (
                <PostPreview
                    key={postData.postId || item.postId || item.id}
                    post={postData}
                    subtable={subtableData}
                    currentUser={currentUser}
                />
            );
        } else if (itemType === "comment") {
            return (
                <Comment
                    key={item.commentId || item.id}
                    comment={item}
                    currentUser={currentUser}
                    postId={item.postId}
                    // checkparent={false} // Retained, ensure Comment component handles this or remove
                />
            );
        }
        return null;
    });
};

function UserProfileContent({activeTab, userIdToView, isOwnProfile, currentUser}) {
    const [tabData, setTabData] = useState({items: [], itemType: 'post'});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchActivityData = useCallback(async (serviceFunction, itemType, dataExtractionKeys = null) => {
        const fullResponse = await serviceFunction(userIdToView, {limit: 20});

        if (fullResponse?.success) {
            const sourcePayloadFromService = fullResponse.data;
            let itemsArray = [];

            if (itemType === 'mixed') {
                const postsKey = dataExtractionKeys?.posts || 'posts';
                const commentsKey = dataExtractionKeys?.comments || 'comments';
                const rawPosts = (sourcePayloadFromService && typeof sourcePayloadFromService === 'object' ? sourcePayloadFromService[postsKey] : []) || [];
                const rawComments = (sourcePayloadFromService && typeof sourcePayloadFromService === 'object' ? sourcePayloadFromService[commentsKey] : []) || [];

                const posts = rawPosts.map(p => ({
                    ...(p.post || p),
                    subtable: p.subtable,
                    type: "post",
                    createdAt: p.post?.postCreatedAt || p.post?.createdAt || p.createdAt || p.time
                }));
                const comments = rawComments.map(c => ({
                    ...c,
                    type: "comment",
                    createdAt: c.commentCreatedAt || c.createdAt
                }));
                return [...posts, ...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            } else if (dataExtractionKeys && typeof dataExtractionKeys === 'string' && sourcePayloadFromService && sourcePayloadFromService[dataExtractionKeys]) {
                itemsArray = Array.isArray(sourcePayloadFromService[dataExtractionKeys]) ? sourcePayloadFromService[dataExtractionKeys] : [];
            } else if (Array.isArray(sourcePayloadFromService)) {
                itemsArray = sourcePayloadFromService;
            } else if (sourcePayloadFromService && typeof sourcePayloadFromService === 'object') {
                const defaultKeyBasedOnType = itemType ? `${itemType}s` : null; // e.g., "posts", "comments"
                if (defaultKeyBasedOnType && Array.isArray(sourcePayloadFromService[defaultKeyBasedOnType])) {
                    itemsArray = sourcePayloadFromService[defaultKeyBasedOnType];
                } else if (Array.isArray(sourcePayloadFromService.data) && !defaultKeyBasedOnType) { // Handles { success: true, data: { data: [...] } }
                    itemsArray = sourcePayloadFromService.data;
                } else {
                    console.warn(`[UserProfileContent] fetchActivityData: sourcePayload for itemType '${itemType}' was an object but no array found under default key '${defaultKeyBasedOnType}' or '.data'. Payload:`, sourcePayloadFromService);
                    itemsArray = [];
                }
            } else {
                console.warn(`[UserProfileContent] fetchActivityData: sourcePayloadFromService for itemType '${itemType}' was not an array or a recognized object structure. Payload:`, sourcePayloadFromService);
                itemsArray = [];
            }

            return itemsArray.map(item => ({
                ...(item.post || item),
                subtable: item.subtable,
                type: itemType,
                createdAt: item.post?.postCreatedAt || item.post?.createdAt || item.createdAt || item.commentCreatedAt || item.time
            }));
        }
        console.warn(`Failed to fetch ${itemType} for user ${userIdToView}:`, fullResponse?.message);
        throw new Error(fullResponse?.message || `Could not load ${itemType}.`);
    }, [userIdToView]);


    useEffect(() => {
        const fetchTabData = async () => {
            if (!userIdToView) {
                setError("User ID is not available to fetch content.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            let items = [];
            let currentItemType = 'post';

            try {
                switch (activeTab) {
                    case "Overview":
                        const [postsFullRes, commentsFullRes] = await Promise.all([
                            postService.getPostsByUserId(userIdToView, {limit: 5, sortBy: 'newest'}),
                            commentService.getCommentsByUserId(userIdToView, {limit: 5, sortBy: 'newest'})
                        ]);

                        let overviewPostsData = [];
                        if (postsFullRes?.success) {
                            if (Array.isArray(postsFullRes.data)) {
                                overviewPostsData = postsFullRes.data;
                            } else if (postsFullRes.data && Array.isArray(postsFullRes.data.posts)) {
                                overviewPostsData = postsFullRes.data.posts;
                            } else if (postsFullRes.data && Array.isArray(postsFullRes.data.data)) { // another common pattern
                                overviewPostsData = postsFullRes.data.data;
                            }
                        }

                        let overviewCommentsData = [];
                        if (commentsFullRes?.success) {
                            if (Array.isArray(commentsFullRes.data)) {
                                overviewCommentsData = commentsFullRes.data;
                            } else if (commentsFullRes.data && Array.isArray(commentsFullRes.data.comments)) {
                                overviewCommentsData = commentsFullRes.data.comments;
                            } else if (commentsFullRes.data && Array.isArray(commentsFullRes.data.data)) {
                                overviewCommentsData = commentsFullRes.data.data;
                            }
                        }

                        const processedPosts = overviewPostsData.map(p => ({
                            ...(p.post || p),
                            subtable: p.subtable,
                            type: "post",
                            createdAt: p.post?.postCreatedAt || p.post?.createdAt || p.createdAt || p.time
                        }));
                        const processedComments = overviewCommentsData.map(c => ({
                            ...c,
                            type: "comment",
                            createdAt: c.commentCreatedAt || c.createdAt
                        }));

                        items = [...processedPosts, ...processedComments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        currentItemType = 'mixed';
                        break;
                    case "Posts":
                        items = await fetchActivityData(postService.getPostsByUserId, 'post');
                        currentItemType = 'post';
                        break;
                    case "Comments":
                        items = await fetchActivityData(commentService.getCommentsByUserId, 'comment');
                        currentItemType = 'comment';
                        break;
                    case "Saved":
                        if (isOwnProfile) items = await fetchActivityData(postService.getSavedPostsByUserId, 'post', 'savedPosts');
                        else {
                            items = [];
                            setError("Access denied.");
                        }
                        currentItemType = 'post';
                        break;
                    case "Hidden":
                        if (isOwnProfile) items = await fetchActivityData(postService.getHiddenPostsByUserId, 'post', 'hiddenPosts');
                        else {
                            items = [];
                            setError("Access denied.");
                        }
                        currentItemType = 'post';
                        break;
                    case "Upvoted":
                        if (isOwnProfile) items = await fetchActivityData(voteService.getUpvotedItemsByUserId, 'mixed', {
                            posts: 'posts',
                            comments: 'comments'
                        });
                        else {
                            items = [];
                            setError("Access denied.");
                        }
                        currentItemType = 'mixed';
                        break;
                    case "Downvoted":
                        if (isOwnProfile) items = await fetchActivityData(voteService.getDownvotedItemsByUserId, 'mixed', {
                            posts: 'posts',
                            comments: 'comments'
                        });
                        else {
                            items = [];
                            setError("Access denied.");
                        }
                        currentItemType = 'mixed';
                        break;
                    default:
                        items = [];
                        console.warn(`Unhandled tab: ${activeTab}`);
                        break;
                }
                setTabData({items, itemType: currentItemType});
            } catch (e) {
                console.error(`Error fetching data for tab ${activeTab}:`, e);
                setError(e.message || `Failed to load ${activeTab.toLowerCase()}.`);
                setTabData({items: [], itemType: currentItemType});
            } finally {
                setLoading(false);
            }
        };

        fetchTabData();
    }, [activeTab, userIdToView, isOwnProfile, fetchActivityData]);

    const noItemsMessage = (activeTab === "Saved" || activeTab === "Hidden" || activeTab === "Upvoted" || activeTab === "Downvoted") && !isOwnProfile
        ? "You do not have permission to view this content."
        : `No ${activeTab.toLowerCase()} items found.`;

    if (loading) {
        return <LoadingSpinner message={`Loading ${activeTab}...`} addClass="my-3"/>;
    } // Changed wrapperclassName to addClass
    if (error && error !== "Access denied.") {
        return <div className="alert alert-danger my-3">{error}</div>;
    }

    if (tabData.itemType === 'mixed') {
        return (
            <div className="mixed-list my-3">
                <h2>{activeTab}</h2>
                {error === "Access denied." ? <div className="alert alert-warning">{noItemsMessage}</div> :
                    tabData.items.length > 0 ? (
                        tabData.items.map(item => {
                            if (item.type === "post") {
                                return <PostPreview key={`post-${item.postId || item.id}`} post={item}
                                                    subtable={item.subtable} currentUser={currentUser}/>;
                            } else if (item.type === "comment") {
                                return <Comment key={`comment-${item.commentId || item.id}`} comment={item}
                                                currentUser={currentUser} postId={item.postId}/>;
                            }
                            return null;
                        })
                    ) : (
                        <div className="p-3 text-muted">{noItemsMessage}</div>
                    )}
            </div>
        );
    }

    return (
        <div className="my-3">
            <h2>{activeTab}</h2>
            {error === "Access denied." ? <div className="alert alert-warning">{noItemsMessage}</div> :
                <RenderItemList items={tabData.items} itemType={tabData.itemType} noItemsMessage={noItemsMessage}
                                currentUser={currentUser}/>
            }
        </div>
    );
}

export default UserProfileContent;