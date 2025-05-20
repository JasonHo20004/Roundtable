// src/routes/authRoutes.jsx
import React, {lazy} from 'react';
import loginAction from "#features/auth/pages/Login/loginAction.jsx";
import registerAction from "#features/auth/pages/Register/registerAction.jsx";
import verifyEmailAction from "#features/auth/pages/VerifyEmail/verifyEmailAction.jsx";
import createProfileAction from "#features/auth/pages/CreateProfile/createProfileAction.jsx";

// Lazy-loaded components
const Login = lazy(() => import('#features/auth/pages/Login/Login'));
const Register = lazy(() => import('#features/auth/pages/Register/Register'));
const VerifyEmail = lazy(() => import('#features/auth/pages/VerifyEmail/VerifyEmail'));
const AuthLayout = lazy(() => import('#layouts/AuthLayout/AuthLayout'));
const CreateProfile = lazy(() => import('#features/auth/pages/CreateProfile/CreateProfile'));

function authRoutes() {
    // Return the configuration for routes that use AuthLayout
    // No parent path here
    return {
        element: <AuthLayout/>,
        children: [
            {
                path: "/login", // Full path from root
                element: <Login/>,
                action: loginAction,
            },
            {
                path: "/register", // Full path from root
                element: <Register/>,
                action: registerAction,
            },
            {
                path: "/verify-email", // Full path from root
                element: <VerifyEmail/>,
                action: verifyEmailAction,
            },
            {
                path: "/create-profile", // Full path from root
                element: <CreateProfile/>,
                action: createProfileAction,
            }
        ],
    };
}

export default authRoutes;