import UserPostDetailsDao from '#daos/user-post-details.dao.js';

class HomeService {
    constructor(userPostDetailsDao) {
        this.userPostDetailsDao = userPostDetailsDao;
    }
    async getHomePosts(sortType = 'hot') {
        try {
            const options = this._getSortOptions(sortType);
            return await this.userPostDetailsDao.getHomePosts(options);
        } catch (error) {
            console.error('(service)Error getting home posts:', error);
            throw error;
        }
    }

    _getSortOptions(sortType) {
        switch(sortType) {
            case 'hot':
                return { 
                    sortBy: 'score',
                    timePreference: '3months' // Ưu tiên bài viết trong 3 tháng
                }; 
            case 'new':
                return { sortBy: 'postCreatedAt', order: 'desc' }; 
            case 'top':
                return { 
                    sortBy: 'voteCount', 
                    order: 'desc',
                    timePreference: '3months' // Thêm timePreference cho Top
                }; 
            case 'rising':
                return { 
                    sortBy: 'score',
                    timeRange: '24h'
                };
            default:
                return { sortBy: 'score' }; 
        }
    }
}

export default new HomeService(UserPostDetailsDao);