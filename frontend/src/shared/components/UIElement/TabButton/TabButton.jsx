// src/shared/components/UIElement/TabButton/TabButton.jsx
import React from "react";

function TabButton({label, active, onClick, tabKey, disabled = false, href = "#"}) {
    const buttonClasses = `flex-sm-fill text-sm-center nav-link ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`;

    return (
        <a
            className={buttonClasses}
            onClick={onClick}
            href={href} // It's good practice for nav links to have hrefs
            role="tab"
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            aria-disabled={disabled ? "true" : undefined}
            data-tab-key={tabKey}
        >
            {label}
        </a>
    );
}
export default TabButton;