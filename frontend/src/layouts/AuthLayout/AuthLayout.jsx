import React, {Suspense} from 'react';
import {Outlet} from 'react-router';
import './AuthLayout.css';
import LoadingSpinner from '#shared/components/UIElement/LoadingSpinner/LoadingSpinner';

function AuthLayout() {
    return (
        <div className="auth-layout-container">
            <div className="auth-background">
                <div className="auth-shape shape-1"></div>
                <div className="auth-shape shape-2"></div>
                <div className="auth-shape shape-3"></div>
                <div className="auth-shape shape-4"></div>
                <div className="auth-shape shape-5"></div>
                <div className="auth-shape shape-6"></div>
                <div className="auth-shape shape-7"></div>
                <div className="auth-shape shape-8"></div>
                <div className="auth-shape shape-9"></div>
                <div className="auth-shape shape-10"></div>
            </div>
            <Suspense fallback={
                <LoadingSpinner
                    message="Đang tải nội dung..."
                    overlayOpacity={0.01}
                    mainClass="page-loading"
                />
            }>
                <Outlet/>
            </Suspense>
        </div>
    );
}

export default AuthLayout;
