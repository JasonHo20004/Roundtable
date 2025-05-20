import React, {lazy} from 'react';
import getPostRoutesConfig from "./postRoutes.jsx";
import getUserRoutesConfig from "./userRoutes.jsx";
import getNotificationRoutesConfig from "./notificationRoutes.jsx";
import getSubtableRoutesConfig from './subtableRoutes';
import getCommentRoutesConfig from "./commentRoutes.jsx";
import searchLoader from "#features/search/loaders/searchLoader.jsx";

// Lazy-loaded components for this section
const MainLayout = lazy(() => import('#layouts/MainLayout/MainLayout'));
const Home = lazy(() => import('#pages/Home/HomeContent/HomeContent'));
const SearchView = lazy(() => import('#features/search/pages/SearchView/SearchView'));

function mainRoutes() {
    return {
        element: <MainLayout/>,
        children: [
            {
                index: true,
                element: <Home/>
            },
            {
                path: "search",
                element: <SearchView/>,
                loader: searchLoader,
            },
            ...getSubtableRoutesConfig(),
            ...getPostRoutesConfig(),
            ...getCommentRoutesConfig(),
            ...getNotificationRoutesConfig(),
            ...getUserRoutesConfig(),
        ],
    };
}

export default mainRoutes;