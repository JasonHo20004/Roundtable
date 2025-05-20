
import updatePostAction from './updatePostAction.jsx';
import deletePostAction from './deletePostAction.jsx';
export default async function manageAction({ request, params }) {
    const method = request.method.toLowerCase();
        switch (method) {
            case 'patch':
                return updatePostAction({request, params});
            case 'delete':
                return deletePostAction({request, params});
            default:
                return null;
        }

}