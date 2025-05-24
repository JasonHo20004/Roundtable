// src/features/users/pages/UserProfileView/UserProfileSidebar/UserProfileSidebar.jsx
import React, {useEffect} from "react";
import useSidebar from '#hooks/useSidebar.jsx';
import UserInfo from "#features/users/components/UserInfo/UserInfo.jsx";
import Setting from "#features/users/components/Setting/Setting.jsx";
import Button from "#shared/components/UIElement/Button/Button.jsx";
import './UserProfileSidebar.css';

function UserProfileSidebar({userProfileData, isOwnProfile}) {
    const {setSidebarParts} = useSidebar();

    useEffect(() => {
        if (!userProfileData) {
            setSidebarParts(null);
            return;
        }

        const headerContent = (
            <div className="profile-sidebar-header-content">
                {userProfileData.banner && (
                    <img
                        src={userProfileData.banner}
                        alt={`${userProfileData.displayName || userProfileData.username}'s Banner`}
                        className="profile-banner"
                    />
                )}
                <div className="profile-name-sidebar">
                    <h4>{userProfileData.displayName || userProfileData.username}</h4>
                </div>
            </div>
        );

        const bodyContent = (
            <UserInfo
                postKarma={userProfileData.postKarma || userProfileData.karma || "0"}
                commentKarma={userProfileData.commentKarma || userProfileData.karma || "0"}
                createdDay={new Date(userProfileData.accountCreated || userProfileData.createdAt || Date.now()).toLocaleDateString()}
            />
        );

        const footerContent = isOwnProfile ? (
            <Setting/>
        ) : (
            <div className="d-flex flex-column gap-2">
                <Button mainClass="button-8" role="button" onClick={() => console.log('Follow clicked')}>Follow</Button>
                <Button mainClass="button-8" role="button" onClick={() => console.log('Chat clicked')}>Chat</Button>
                <Button mainClass="button-8" role="button" onClick={() => console.log('Block clicked')}>Block</Button>
            </div>
        );

        setSidebarParts({
            id: `profile-${userProfileData.userId}`, // Keep the ID if you use it for the cleanup logic
            header: headerContent,
            body: bodyContent,
            footer: footerContent,
        });

        // Cleanup function
        return () => {
            setSidebarParts(null);
        };
    }, [userProfileData, isOwnProfile, setSidebarParts]); //

    return null;
}

export default UserProfileSidebar;