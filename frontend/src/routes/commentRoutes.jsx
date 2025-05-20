import manageCommentAction from '#features/comments/actions/manageCommentAction.jsx';

function getCommentRoutesConfig() {
    return [
        {
            path: '/comments/:commentId/manage',
            action: manageCommentAction,
        }
    ]
}

export default getCommentRoutesConfig;