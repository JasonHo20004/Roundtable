// src/features/users/pages/UserProfileView/UserProfileView.jsx
import React, {useState} from "react";
import UserProfileContent from "#features/users/pages/UserProfileView/UserProfileContent/UserProfileContent.jsx";
import UserProfileSidebar from "#features/users/pages/UserProfileView/UserProfileSidebar/UserProfileSidebar.jsx";
import Avatar from "#shared/components/UIElement/Avatar/Avatar.jsx";
import Identifier from "#shared/components/UIElement/Identifier/Identifier.jsx";
import Tabs from "#shared/components/UIElement/Tabs/Tabs.jsx";
import useAuth from "#hooks/useAuth.jsx"; // Import useAuth
import LoadingSpinner from "#shared/components/UIElement/LoadingSpinner/LoadingSpinner.jsx";
import './UserProfileView.css';

function UserProfileView({
                             userId,
                             userProfileData,
                             isOwnProfile
                         }) {
    const [activeTab, setActiveTab] = useState("Overview");
    const {user: loggedInUser, isLoading: authIsLoading} = useAuth(); // Get current logged-in user

    const tabItemsConfig = React.useMemo(() => {
        const baseTabs = [
            {key: "Overview", label: "Overview", href: `#${userId}-overview`},
            {key: "Posts", label: "Posts", href: `#${userId}-posts`},
            {key: "Comments", label: "Comments", href: `#${userId}-comments`},
        ];

        if (isOwnProfile) {
            return [
                ...baseTabs,
                {key: "Saved", label: "Saved", href: `#${userId}-saved`},
                {key: "Hidden", label: "Hidden", href: `#${userId}-hidden`},
                {key: "Upvoted", label: "Upvoted", href: `#${userId}-upvoted`},
                {key: "Downvoted", label: "Downvoted", href: `#${userId}-downvoted`}
            ];
        }
        return baseTabs;
    }, [isOwnProfile, userId]);

    // Handle loading states
    if (authIsLoading) {
        return <LoadingSpinner message="Authenticating..."/>;
    }

    if (!userProfileData) {
        // This case should ideally be handled by the loader or errorElement in routes
        return <LoadingSpinner message="Loading profile information..."/>;
    }

    return (
        <div className="container mt-3 profile-page-container">
            <div className="row">
                <div className="profile-main-content-area">
                    <div className="profile-view-header card mb-3">
                        <div className="card-body d-flex align-items-center">
                            <Avatar
                                src={userProfileData.avatar || 'default_avatar_url_here'}
                                alt={userProfileData.displayName || userProfileData.username}
                                mainClass="profile-view-avatar me-3"
                            />
                            <div className="profile-view-info">
                                <h1 className="profile-view-displayName mb-0">{userProfileData.displayName || userProfileData.username}</h1>
                                {userProfileData.username && (
                                    <Identifier
                                        type="user"
                                        namespace={userProfileData.username}
                                        addClass="profile-view-username text-muted"
                                    />
                                )}
                                {/* You can add more info like karma, cake day here if desired */}
                            </div>
                        </div>
                    </div>

                    {/* <Tabs
                        onTabChange={setActiveTab}
                        tabItems={tabItemsConfig}
                        initialActiveTab="Overview"
                    /> */}
                    <Tabs
                        activeTab={activeTab} // Truyền activeTab để kiểm soát
                        onTabChange={setActiveTab} // Hàm cập nhật activeTab
                        tabItems={tabItemsConfig}
                    />
                    <div className="profile-tab-content mt-3"> {/* Added mt-3 for spacing */}
                        <UserProfileContent
                            activeTab={activeTab}
                            userIdToView={userId} // Pass the userId of the profile being viewed
                            isOwnProfile={isOwnProfile}
                            currentUser={loggedInUser} // Pass the currently logged-in user
                        />
                    </div>
                </div>

                <UserProfileSidebar
                    userProfileData={userProfileData}
                    isOwnProfile={isOwnProfile}
                />
            </div>
        </div>
    );
}

export default UserProfileView;