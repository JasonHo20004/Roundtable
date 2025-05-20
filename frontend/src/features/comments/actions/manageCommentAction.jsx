import editCommentAction from './editCommentAction.jsx';
import deleteCommentAction from "./deleteCommentAction.jsx";

export default async function manageCommentAction({request, params}) {
    const method = request.method.toLowerCase();
    switch (method) {
        case 'patch':
            return editCommentAction({request, params});
        case 'delete':
            return deleteCommentAction({request, params});
        default:
            return null;
    }
}
