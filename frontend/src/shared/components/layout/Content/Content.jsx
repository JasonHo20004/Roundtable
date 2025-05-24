import React, {useState} from 'react';
import {useLocation} from 'react-router';

import LeftSidebar from '#shared/components/layout/LeftSidebar/LeftSidebar';
import Main from "#shared/components/layout/Main/Main";

import './Content.css';
import SidebarProvider from "#contexts/SidebarContext.jsx";

export default function Content(props) {
    const location = useLocation();
    const [user, setUser] = useState(location.state?.user || null);

    return (
        <div className="d-flex flex-row" id="content-container">
            <LeftSidebar
                id="left-sidebar-container"
                toggleSidebar={props.toggleSidebar}
                isSidebarVisible={props.isSidebarVisible}
                communities={props.communities}
            />
            <SidebarProvider>
                {user && (
                    /* Render user-specific content here */
                    <div className="user-info">
                        <h2>Welcome, {user.username}!</h2>
                        {/* Add more user-specific components or information here */}
                    </div>
                )
                }
                <Main
                    id="main-container"/>
            </SidebarProvider>
        </div>
    );
}