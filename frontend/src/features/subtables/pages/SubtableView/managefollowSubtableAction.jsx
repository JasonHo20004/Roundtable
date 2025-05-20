
import followSubtableAction from './followSubtableAction'
import unfollowSubtableAction from './unfollowSubtableAction'


export default async function managefollowSubtableAction({request}) {
    const method = request.method.toLowerCase();
        switch (method) {
            case 'post':
                return followSubtableAction({request});
            case 'delete':
                return unfollowSubtableAction({request});
            default:
                return null;
        }

}