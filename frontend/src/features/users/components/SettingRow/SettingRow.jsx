// src/features/users/components/SettingRow/SettingRow.jsx
import React from "react";
import Button from "#shared/components/UIElement/Button/Button";
import Icon from "#shared/components/UIElement/Icon/Icon";
import './SettingRow.css'; // We'll create this new CSS file

// Define a mapping for titles to icon names (update these with your actual icon names)
const iconMap = {
    "Profile": "pencil",
    "Account": "settings"
};

function SettingRow({title, describe, buttonContent, onClick}) {
    const iconName = iconMap[title] || "circle_half"; // Default icon if no specific one is mapped

    return (
        <div className="setting-row-item d-flex align-items-center">
            <div className="setting-row-icon-container me-3">
                <Icon name={iconName} size="20px" addClass="setting-icon"/>
            </div>
            <div className="setting-row-info flex-grow-1">
                <h3 className="setting-row-title">{title}</h3>
                {describe && <p className="setting-row-describe">{describe}</p>}
            </div>
            {buttonContent && (
                <Button
                    mainClass="setting-row-button ms-auto" // ms-auto will push it to the right
                    addClass="btn-sm"
                    outline={{color: "primary"}} // Example style, adjust as needed
                    onClick={onClick} // Pass onClick to the button
                >
                    {buttonContent}
                </Button>
            )}
        </div>
    );
}

export default SettingRow;