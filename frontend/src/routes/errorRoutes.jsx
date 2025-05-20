import React, {lazy} from 'react';

// Lazy-loaded components
const ErrorPageNotFound = lazy(() => import('#pages/ErrorPageNotFound/ErrorPageNotFound'));
const Error404 = lazy(() => import('#pages/Error404/Error404'));

function errorRoutes() {
    return [
        {
            path: "/404",
            element: <Error404/>,
        },
        {
            // The "*" path matches anything not matched by earlier routes
            path: "*",
            element: <ErrorPageNotFound/>,
        }
    ];
}

export default errorRoutes;