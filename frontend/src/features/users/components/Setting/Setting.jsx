// src/features/users/components/Setting/Setting.jsx
import React from "react";
import SettingRow from "#features/users/components/SettingRow/SettingRow";
import './Setting.css';

function Setting() {
    // Example onClick handlers (you'd implement actual logic)
    const handleEditProfile = () => {
        console.log("Edit Profile Clicked");
        // Navigate or open modal for profile customization
    };

    const handleManageAccount = () => {
        console.log("Manage Account Clicked");
        // Navigate or open modal for account settings
    };

    return (
        <div className="setting-container"> {/* Changed from .setting to avoid table-specific CSS */}
            <h3 className="setting-main-title mb-2">User Settings</h3>
            {/* Removed table, directly rendering SettingRow components */}
            <div className="setting-rows-list"> {/* Wrapper for rows, similar to list-group */}
                <SettingRow
                    title="Profile"
                    describe="Customize your profile"
                    buttonContent="Edit"
                    onClick={handleEditProfile}
                />
            </div>
        </div>
    );
}

export default Setting;