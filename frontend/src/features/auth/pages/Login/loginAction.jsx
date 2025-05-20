// src/features/auth/pages/Login/loginAction.jsx
import authService from '#services/authService'; // Import the new service

export default async function loginAction({request}) { // Destructure request here
    // --- Form Data Handling ---
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    // --- Get the method from the request object ---
    const httpMethod = request.method;

    try {
        // Call the login method from the authService
        return await authService.login(data, httpMethod);

    } catch (error) {
        // Handle errors thrown by the authService
        if (error.status === 401 || error.status === 400) {
            console.error("Login failed:", error.message); // Log the specific message
            return {
                success: false,
                error: true,
                message: error.message || "Tên đăng nhập hoặc mật khẩu không chính xác.",
                status: error.status,
            };
        }
        // Handle other unexpected errors (e.g., network issues, server 500)
        console.error("Server error during login:", error);
        return {
            success: false,
            error: true,
            message: "Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.",
            status: error.status || 500,
        };
    }
}