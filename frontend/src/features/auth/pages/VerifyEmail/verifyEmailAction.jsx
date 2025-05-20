import {sendApiRequest} from "#utils/apiClient";

export default async function verifyEmailAction({request}) {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    // --- Get the method from the request object ---
    const httpMethod = request.method;

    try {
        const responseData = await sendApiRequest('/api/auth/verify-email', {
            method: httpMethod,
            body: data
        });
        console.log('Email verification successful:', responseData);
        return responseData;
    } catch (error) {
        console.error("Verify email action failed:", error);
        // Handle both error formats: error.data and error.response
        const errorData = error.data || error.response?.data || { message: error.message || 'Email verification failed.' };
        const status = error.status || error.response?.status || 500;
        
        // Return error object instead of throwing Response
        return {
            success: false,
            error: {
                message: errorData.message || 'Mã xác thực không hợp lệ. Vui lòng thử lại.',
                status: status
            }
        };
    }
}