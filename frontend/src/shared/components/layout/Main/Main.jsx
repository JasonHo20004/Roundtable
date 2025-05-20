import React, {Suspense} from "react";
import {Outlet} from "react-router";

import "./Main.css";
import RightSidebar from "#shared/components/layout/RightSidebar/RightSidebar";
import LoadingSpinner from "#shared/components/UIElement/LoadingSpinner/LoadingSpinner";

export default function Main(props) {
    return (
        <div id={props.id} className="d-flex flex-row mx-auto">
            <main className="container-fluid mx-auto position-relative">
                <Suspense fallback={
                    <LoadingSpinner
                        message="Đang tải nội dung..."
                        overlayOpacity={0.01}
                        mainClass="page-loading"
                    />
                }>
                    <Outlet/>
                </Suspense>
            </main>
            <RightSidebar id="right-sidebar-container"/>
        </div>
    );
}