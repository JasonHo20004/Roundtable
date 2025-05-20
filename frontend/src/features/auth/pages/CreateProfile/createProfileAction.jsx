import authService from '#services/authService';

/**
 * Action xử lý việc tạo hồ sơ người dùng.
 * @param {object} request - Đối tượng request từ React Router.
 * @returns {Promise<object>} - Kết quả của action.
 */
async function createProfileAction({request}) {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    const avatar =  formData.get('avatar')
    const banner = formData.get('banner')

    const httpMethod = request.method;

    if (httpMethod !== 'POST') {
        return;
    }

    // Đảm bảo profileId được bao gồm trong dữ liệu
    if (!data.profileId) {
        return {
            success: false,
            error: true,
            message: 'Thiếu thông tin profileId.',
            status: 400
        };
    }

    try {
        // Gọi service để tạo hồ sơ
        const response = await authService.createProfile(formData);

        return {
            success: response.success,
            message: response.message || 'Tạo hồ sơ thành công!'
        };
    } catch (error) {
        console.error('Create profile action error:', error);

        return {
            success: false,
            error: true,
            message: error.message || 'Có lỗi xảy ra khi tạo hồ sơ.',
            status: error.status || 500
        };
    }
}

export default createProfileAction;