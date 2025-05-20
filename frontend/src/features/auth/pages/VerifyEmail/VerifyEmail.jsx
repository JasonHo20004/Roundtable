import React, {useEffect, useState} from 'react';
import './VerifyEmail.css';
import Input from '#shared/components/UIElement/Input/Input';
import Button from '#shared/components/UIElement/Button/Button';
import Form from '#shared/components/UIElement/Form/Form';
import {useActionData, useLocation, useNavigate, useNavigation} from "react-router";
import {sendApiRequest} from "#utils/apiClient";

function VerifyEmail() {
    const navigate = useNavigate();
    const location = useLocation();
    const actionData = useActionData();
    const navigation = useNavigation();

    // Prefill email from navigation state if available
    const [email, setEmail] = useState(location.state?.prefilledEmail || '');
    // State for the 6 individual digit inputs
    const [code, setCode] = useState(Array(6).fill(''));
    // State for error message
    const [error, setError] = useState(null);
    // State for resend code status
    const [resendStatus, setResendStatus] = useState({ loading: false, message: null });

    // --- Handle individual digit input ---
    const handleChange = (e, index) => {
        const {value} = e.target;
        // Clear error when user starts typing
        if (error) setError(null);
        
        // Allow only single digits
        if (/^\d?$/.test(value)) { // Allow empty string for backspace/delete
            const newCode = [...code];
            newCode[index] = value;
            setCode(newCode);

            // Auto-focus next input if a digit was entered
            if (value && index < 5) {
                document.getElementById(`code-${index + 1}`)?.focus();
            }
        }
    };

    // --- Handle backspace/delete ---
    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            // If current input is empty and backspace is pressed, focus previous input
            document.getElementById(`code-${index - 1}`)?.focus();
        }
    }

    // Combine the code array into a single string for submission
    const combinedCode = code.join('');

    // Handle resend code
    const handleResendCode = async () => {
        if (!email) {
            setError('Email không tồn tại. Vui lòng đăng ký lại.');
            return;
        }

        setResendStatus({ loading: true, message: null });
        try {
            const response = await sendApiRequest('/api/auth/register', {
                method: 'POST',
                body: { email } // Only send email for resend request
            });
            
            if (response.success) {
                setResendStatus({ 
                    loading: false, 
                    message: 'Mã xác thực mới đã được gửi đến email của bạn.' 
                });
                // Clear the code inputs
                setCode(Array(6).fill(''));
                setError(null);
            } else {
                throw new Error(response.message || 'Không thể gửi lại mã xác thực.');
            }
        } catch (err) {
            setResendStatus({ 
                loading: false, 
                message: err.message || 'Đã xảy ra lỗi khi gửi lại mã xác thực.' 
            });
        }
    };

    useEffect(() => {
        // Redirect to create-profile page if verification is successful
        if (actionData && actionData.success) {
            navigate('/create-profile', {replace: true, state: {profileId: actionData.data.profileId}});
        }
        // Handle verification errors
        if (actionData && !actionData.success) {
            const errorMessage = actionData.error?.message || 'Mã xác thực không hợp lệ. Vui lòng thử lại.';
            setError(errorMessage);
            // Clear the code inputs on error
            setCode(Array(6).fill(''));
            // Focus the first input
            document.getElementById('code-0')?.focus();
        }
    }, [actionData, navigate]);

    // Clear resend status message after 5 seconds
    useEffect(() => {
        if (resendStatus.message) {
            const timer = setTimeout(() => {
                setResendStatus(prev => ({ ...prev, message: null }));
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [resendStatus.message]);

    return (
        <div className="verify-email-form-container d-flex flex-column align-items-center justify-content-center min-vh-100 position-relative overflow-hidden">
            <h1>Welcome to Roundtable!</h1>
            <p>Join the conversation by verifying your email. Please enter the 6-digit code sent to your email.</p>

            {/* Display error message */}
            {error && (
                <div className="alert alert-danger mb-3 w-100 text-center">
                    {error}
                </div>
            )}

            {/* Display resend status message */}
            {resendStatus.message && (
                <div className={`alert ${resendStatus.message.includes('đã được gửi') ? 'alert-success' : 'alert-danger'} mb-3 w-100 text-center`}>
                    {resendStatus.message}
                </div>
            )}

            {/* Use React Router's Form component for automatic submission to action */}
            <Form
                id="verify-email-form"
                method="post"
                action="/verify-email"
                mainClass="verify-email-form"
            >
                {/* Hidden input for the email (prefilled) */}
                <Input
                    id="email"
                    name="email"
                    type="hidden"
                    value={email}
                />

                {/* Hidden input for the combined verification code */}
                <Input
                    id="verification-code"
                    name="code"
                    type="hidden"
                    value={combinedCode}
                />

                {/* Visible inputs for individual digits */}
                <div className="d-flex justify-content-center gap-2 mb-4">
                    {code.map((digit, index) => (
                        <Input
                            key={index}
                            id={`code-${index}`}
                            type="tel"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            mainClass="form-control text-center"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="one-time-code"
                            style={{
                                width: '45px',
                                height: '50px',
                                fontSize: '1.2rem',
                                borderRadius: '8px',
                                border: '1px solid #ccc'
                            }}
                        />
                    ))}
                </div>

                <div className="d-flex flex-column align-items-center gap-3">
                    <Button
                        type="submit"
                        mainClass="btn btn-primary btn-lg"
                        style={{borderRadius: '8px', padding: '10px 30px'}}
                        disabled={combinedCode.length !== 6 || navigation.state === 'submitting'}
                    >
                        {navigation.state === 'submitting' ? 'Đang xác thực...' : 'Xác thực mã'}
                    </Button>

                    <Button
                        type="button"
                        mainClass="btn btn-link"
                        onClick={handleResendCode}
                        disabled={resendStatus.loading || navigation.state === 'submitting'}
                    >
                        {resendStatus.loading ? 'Đang gửi lại...' : 'Gửi lại mã xác thực'}
                    </Button>
                </div>
            </Form>
        </div>
    );
}

export default VerifyEmail;
