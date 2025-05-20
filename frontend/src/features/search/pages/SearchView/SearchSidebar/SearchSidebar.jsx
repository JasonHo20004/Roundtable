import React, {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router';
import searchService from '#services/searchService';
import Link from '#shared/components/Navigation/Link/Link';
import Avatar from '#shared/components/UIElement/Avatar/Avatar';
import LoadingSpinner from '#shared/components/UIElement/LoadingSpinner/LoadingSpinner';
import Identifier from '#shared/components/UIElement/Identifier/Identifier';

const SidebarSection = ({ title, items, renderItem, emptyMessage }) => (
    <div className="sidebar-section mb-4">
        <h3 className="sidebar-title h5 mb-3">{title}</h3>
        {items.length > 0 ? (
            <div className="list-group">
                {items.map(renderItem)}
            </div>
        ) : (
            <div className="text-muted">{emptyMessage}</div>
        )}
    </div>
);

export default function SearchSidebarContent() {
    const [searchParams] = useSearchParams();
    const [communities, setCommunities] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const q = searchParams.get('q');

    useEffect(() => {
        const fetchSidebarData = async () => {
            if (!q) {
                setCommunities([]);
                setUsers([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const [communitiesReponse, usersResponse] = await Promise.all([
                    searchService.searchCommunities({q, limit: 5}),
                    searchService.searchUsers({q, limit: 5})
                ]);
                setCommunities(communitiesReponse.data.communities);
                setUsers(usersResponse.data.users);
            } catch (error) {
                console.error("Error fetching sidebar data:", error);
                setError(error.message || "Failed to load sidebar data");
            } finally {
                setLoading(false);
            }
        };

        fetchSidebarData();
    }, [q]);

    if (loading) {
        return <LoadingSpinner
            message="Đang tải dữ liệu..."
            overlayOpacity={0.01}
        />;
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                {error}
            </div>
        );
    }

    if (!q) {
        return null;
    }

    const renderCommunity = (community) => (
        <Link
            key={community.subtableId}
            href={`/r/${community.name}`}
            className="list-group-item list-group-item-action d-flex align-items-center p-2"
        >
            <Avatar
                src={community.icon}
                alt={`s/${community.name}`}
                width="32"
                height="32"
                className="me-2"
            />
            <div className="community-info">
                <Identifier type="subtable" namespace={community.name} className="community-name fw-bold"/>
                <div className="community-members text-muted small">
                    {community.memberCount} members
                </div>
            </div>
        </Link>
    );

    const renderUser = (user) => (
        <Link
            key={user.userId}
            href={`/u/${user.username}`}
            className="list-group-item list-group-item-action d-flex align-items-center p-2"
        >
            <Avatar
                src={user.avatar}
                alt={user.username}
                width="32"
                height="32"
                className="me-2"
            />
            <div className="user-info">
                <Identifier type="user" namespace={user.username} className="user-name fw-bold"/>
                <div className="user-karma text-muted small">
                    {user.karma} karma
                </div>
            </div>
        </Link>
    );

    return (
        <div className="search-sidebar">
            <SidebarSection
                title="Các cộng đồng liên quan"
                items={communities}
                renderItem={renderCommunity}
                emptyMessage="Không tìm thấy cộng đồng nào"
            />

            <SidebarSection
                title="Các thành viên liên quan"
                items={users}
                renderItem={renderUser}
                emptyMessage="Không tìm thấy thành viên nào"
            />
        </div>
    );
} 