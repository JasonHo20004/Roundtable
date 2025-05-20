import {sendApiRequest} from "#utils/apiClient";

class HomeService {
    async getHomeData(sortType = 'hot') {
        // Sử dụng URL đầy đủ thay vì đường dẫn tương đối
        const baseUrl = `/api/home/posts`;
        
        // Thêm sortType vào query parameters
        const response = await sendApiRequest(`${baseUrl}?sortType=${sortType}`, {method: 'GET'});
        
        if (!response.success) {
            throw new Error(`Không thể lấy dữ liệu trang chủ: ${response.status} ${response.statusText}`);
        }

        return response.data;
    }    
}

export default new HomeService();