import authService from '#services/authService';

/**
 * Action xử lý việc tạo hồ sơ người dùng.
 * @param {object} request - Đối tượng request từ React Router.
 * @returns {Promise<object>} - Kết quả của action.
 */
async function createProfileAction({request}) {
    const formData = await request.formData();
    const httpMethod = request.method;

    if (httpMethod !== 'PUT') {
        return {
            success: false,
            error: true,
            message: 'Invalid request method. Expected PUT.',
            status: 405
        };
    }

    // Check if profileId exists in formData
    const profileId = formData.get('profileId');
    if (!profileId) {
        return {
            success: false,
            error: true,
            message: 'Thiếu thông tin profileId.',
            status: 400
        };
    }

    try {
        // Pass the FormData object directly to the service
        const response = await authService.createProfile(formData);

        return {
            success: true,
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