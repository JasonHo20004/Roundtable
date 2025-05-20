import React from "react";
import "./RightSidebar.css";
import useSidebar from '#hooks/useSidebar.jsx';

export default function RightSidebar() {
    const {sidebarParts} = useSidebar();
    const {header, body, footer} = sidebarParts;

    // Determine if there's any content to render at all
    const hasContent = header || body || footer;

    // Don't render the sidebar container if all parts are null
    if (!hasContent) {
        return null;
    }

    return (

        <div
            id="right-sidebar-container"
            className="right-sidebar"
        >
            {header && (
                <div className="right-sidebar__header">
                    {header}
                </div>
            )}

            {body && (
                <div className="right-sidebar__body">
                    {body}
                </div>
            )}

            {footer && (
                <div className="right-sidebar__footer">
                    {footer}
                </div>
            )}
        </div>
    );
}