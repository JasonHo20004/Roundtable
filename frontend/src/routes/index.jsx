// src/routes/index.jsx
import React, {Suspense} from "react";
import {createBrowserRouter, RouterProvider} from "react-router"; // Correct import
// Import route configuration FUNCTIONS
import getMainRoutesConfig from './mainRoutes';
import getAuthRoutesConfig from './authRoutes';
import getErrorRoutesConfig from './errorRoutes';


import LoadingSpinner from "#shared/components/UIElement/LoadingSpinner/LoadingSpinner";

// Define the application routes
const allRoutes = [
    getMainRoutesConfig(),  // Routes using MainLayout (handles index "/")
    getAuthRoutesConfig(), // Routes using AuthLayout (handles /login, /register etc.)
    ...getErrorRoutesConfig()  // Spread error routes as they are top-level
];

// Create the router instance
const router = createBrowserRouter(allRoutes);

// Create a component that provides the router
export default function AppRouter() {
    // This component will be the main entry point for your app's routing
    return (
        <Suspense fallback={
            <LoadingSpinner
                message="Đang tải nội dung trang..."
                overlayOpacity={0.01}
                mainClass="page-loading"
            />
        }>
            <RouterProvider router={router}/>
        </Suspense>
    );
}