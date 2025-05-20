import React, {lazy} from 'react';
import createPostLoader from "#features/posts/loaders/createPostLoader.jsx";
import createPostAction from "#features/posts/actions/createPostAction.jsx";
import createSubtableAction from "#features/subtables/components/CreateSubtableModal/createSubtableAction.jsx";
import subtableViewLoader from "#features/subtables/pages/SubtableView/subtableViewLoader.jsx";
import managefollowSubtableViewAction from "#features/subtables/pages/SubtableView/managefollowSubtableAction"

const SubtableView = lazy(() => import('#features/subtables/pages/SubtableView/SubtableView'));
const CreatePost = lazy(() => import('#features/posts/pages/CreatePost/CreatePost'));

function subtableRoutes() {
    return [
        {
            path: "/s/:subtableName",
            element: <SubtableView/>,
            loader: subtableViewLoader,
            action: managefollowSubtableViewAction
        },
        {
            path: "/s/:subtableName/submit",
            element: <CreatePost/>,
            loader: createPostLoader,
            action: createPostAction,
        },
        {
            path: "/s",
            action: createSubtableAction,
        },
    ]

}

export default subtableRoutes;