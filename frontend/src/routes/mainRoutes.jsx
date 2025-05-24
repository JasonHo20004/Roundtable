import React, {lazy} from 'react';
import getPostRoutesConfig from "./postRoutes.jsx";
import getUserRoutesConfig from "./userRoutes.jsx";
import getNotificationRoutesConfig from "./notificationRoutes.jsx";
import getSubtableRoutesConfig from './subtableRoutes';
import getCommentRoutesConfig from "./commentRoutes.jsx";
import searchLoader from "#features/search/loaders/searchLoader.jsx";
import leftSideBarLoader from '#pages/Home/loaders/leftSideBarLoader.jsx';
// Lazy-loaded components for this section
const MainLayout = lazy(() => import('#layouts/MainLayout/MainLayout'));
const Home = lazy(() => import('#pages/Home/HomeContent/HomeContent'));
const SearchView = lazy(() => import('#features/search/pages/SearchView/SearchView'));
const About = lazy(() => import('#pages/About/About'));
const Help = lazy(() => import('#pages/Help/Help'));

function mainRoutes() {
    return {
        element: <MainLayout/>,
        loader: leftSideBarLoader,
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
            {
                path: "about",
                element: <About/>,
            },
            {
                path: "help",
                element: <Help/>,
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