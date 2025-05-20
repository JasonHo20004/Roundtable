// src/shared/components/UIElement/Tabs/Tabs.jsx
import React, {useEffect, useState} from "react";
import TabButton from "../TabButton/TabButton";
import './Tabs.css';

function Tabs({onTabChange, tabItems, initialActiveTab}) {
    const [activeTab, setActiveTab] = useState(
        initialActiveTab || (tabItems && tabItems.length > 0 ? tabItems[0].key : "")
    );

    useEffect(() => {
        if (initialActiveTab && initialActiveTab !== activeTab) {
            setActiveTab(initialActiveTab);
        }
    }, [initialActiveTab, activeTab]);

    const changeTab = (newTabKey) => {
        setActiveTab(newTabKey);
        if (onTabChange) {
            onTabChange(newTabKey);
        }
    };

    if (!tabItems || tabItems.length === 0) {
        console.warn("Tabs component rendered without tabItems.");
        return null;
    }

    return (
        <nav className="nav nav-pills flex-column flex-sm-row profile-tabs mb-3"> {/* Updated classes here */}
            {tabItems.map(tab => (
                // Removed the <li> wrapper as TabButton is now an <a> tag
                <TabButton
                    key={tab.key}
                    tabKey={tab.key}
                    label={tab.label}
                    active={activeTab === tab.key}
                    onClick={(e) => {
                        e.preventDefault(); // Prevent default link behavior if it's just for tab switching
                        if (!tab.disabled) {
                            changeTab(tab.key);
                        }
                    }}
                    disabled={tab.disabled} // Assuming your tabItems can have a 'disabled' property
                    href={tab.href || '#'}   // Assuming your tabItems can have an 'href' property
                />
            ))}
        </nav>
    );
}

export default Tabs;