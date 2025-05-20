import homeService from '#services/home.service.js';
import HTTP_STATUS from '#constants/http-status.js';

class HomeController {
    constructor() {
        this.service = homeService;
        this.getHomePosts = this.getHomePosts.bind(this);
    }
    async getHomePosts(req, res, next) {
        try {
            // Lấy sortType từ query parameters
            const { sortType = 'hot' } = req.query;
            console.log(`[HomeController] Received sortType: ${sortType}`);
            
            const posts = await this.service.getHomePosts(sortType);
            
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                data: posts
            });
        } catch (error) {
            console.error('[HomeController.getHomePosts] Error:', error.message);
            next(error);
        }
    }
}

export default new HomeController();