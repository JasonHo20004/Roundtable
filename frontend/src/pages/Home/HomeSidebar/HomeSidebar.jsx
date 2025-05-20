import React, {useCallback, useEffect, useMemo, useState} from 'react';
import './HomeSidebar.css';
import Identifier from "#shared/components/UIElement/Identifier/Identifier";
import useSidebar from "#hooks/useSidebar.jsx";
import { sendApiRequest } from '#utils/apiClient';

export default function HomeSidebarContent() {
    const { setSidebarParts } = useSidebar();
    const [recentPosts, setRecentPosts] = useState([]);

    const clearSidebarContent = useCallback(() => {
        localStorage.removeItem('recentViewedPosts');
        setSidebarParts({ header: null, body: null });
    }, [setSidebarParts]);

    useEffect(() => {
        async function load() {
            try {
                const ids = JSON.parse(localStorage.getItem('recentViewedPosts') || '[]');
                if (ids.length === 0) {
                    setRecentPosts([]);
                    return;
                }

                const response = await sendApiRequest('/api/posts/by-ids', {
                    method: 'POST',
                    body: { postIds: ids }
                });

                if (response.success) {
                    setRecentPosts(response.data);
                } else {
                    console.error("Failed to load recent posts:", response.message);
                }
            } catch (error) {
                console.error("Failed to load recent posts:", error);
            }
        }
        load();
    }, []);

    const headerContent = useMemo(() => (
        <>
            <h3>Recent Posts</h3>
            <button className="clear-btn" onClick={clearSidebarContent}>
                Clear
            </button>
        </>
    ), [clearSidebarContent]);

    const bodyContent = useMemo(() => (
        <div className="right-sidebar__posts">
            {recentPosts.map((post) => (
                <div className="post-item" key={post.postId}>
                    <div className="post-item__subtable">
                        s/{post.subtable?.name || post.subtable?.title || post.subtable?.namespace}
                    </div>
                    <div className="post-item__title">{post.title}</div>
                    <div className="post-item__info">
                        <span>{post.voteCount} upvotes</span> •{" "}
                        <span>{post.commentCount} comments</span>
                    </div>
                </div>
            ))}
        </div>
    ), [recentPosts]);

    useEffect(() => {
        setSidebarParts({
            header: headerContent,
            body: bodyContent,
        });

        return () => {
            setSidebarParts(null);
        };
    }, [setSidebarParts, headerContent, bodyContent]);

    return null;
}