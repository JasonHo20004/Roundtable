import React, {useEffect, useState} from 'react';
// Remove RouterForm import
import {useActionData, useNavigate, useNavigation} from 'react-router';
import {usePasswordStrength, useRegisterFormState} from '#features/auth/hooks/register-hook.jsx';

import Modal from "#shared/components/UIElement/Modal/Modal";
import Button from "#shared/components/UIElement/Button/Button";
// Import your custom Form component
import Form from '#shared/components/UIElement/Form/Form.jsx';
import Input from "#shared/components/UIElement/Input/Input";
import Icon from '#shared/components/UIElement/Icon/Icon';

import './RegisterModal.css';

export default function RegisterModal(props) {
    const {
        isOpen,
        onClose,
        onSwitchToLogin,
    } = props;

    const actionData = useActionData();
    const navigation = useNavigation();
    const navigate = useNavigate();
    const isSubmitting = navigation.state === 'submitting';

    const [localApiError, setLocalApiError] = useState(null);
    const {
        fullName, setFullName,
        username, setUsername,
        email, setEmail,
        password, setPassword,
        confirmPassword, setConfirmPassword,
        agreeTerms, setAgreeTerms,
        formErrors, setFormErrors
    } = useRegisterFormState(isOpen);

    const {passwordStrength, checkPasswordStrength} = usePasswordStrength();

    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        if (localApiError) setLocalApiError(null);
        if (formErrors[name]) setFormErrors(prev => ({...prev, [name]: null}));
        if (formErrors.general) setFormErrors(prev => ({...prev, general: null}));

        switch (name) {
            case 'fullName':
                setFullName(newValue);
                break;
            case 'username':
                setUsername(newValue);
                break;
            case 'email':
                setEmail(newValue);
                break;
            case 'password':
                setPassword(newValue);
                checkPasswordStrength(newValue);
                break;
            case 'confirmPassword':
                setConfirmPassword(newValue);
                break;
            case 'agreeTerms':
                setAgreeTerms(newValue);
                break;
            default:
                break;
        }
    };

    const validateForm = () => {
        const newErrors = {};
        // (Validation logic remains the same)
        if (!fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên';
        if (!username.trim()) newErrors.username = 'Vui lòng nhập tên đăng nhập';
        if (!email.trim()) newErrors.email = 'Vui lòng nhập email';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email không hợp lệ';
        if (!password) newErrors.password = 'Vui lòng nhập mật khẩu';
        else if (password.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        if (password !== confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        if (!agreeTerms) newErrors.agreeTerms = 'Bạn phải đồng ý với điều khoản dịch vụ';

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (event) => {
        setFormErrors({});
        setLocalApiError(null);
        if (!validateForm()) {
            event.preventDefault(); // Prevent RR submission if client validation fails
            console.log("Client validation failed in modal. Preventing submission.");
        } else {
            console.log("Client validation passed in modal. Allowing React Router submission...");
            // Let RR handle it
        }
    };

    useEffect(() => {
        if (isOpen && actionData) {
            console.log("Register Modal action data received:", actionData);
            if (actionData.success === false) {
                setLocalApiError(actionData.message || 'Đăng ký không thành công.');
            } else if (actionData.success === true) {
                console.log('Registration successful (via actionData in modal):', actionData.user);
                onClose(); // Close modal on success
                // Optionally navigate after closing if needed
                // navigate('/verify-email', { state: { message: 'Please check your email' } });
            } else {
                console.warn("Received unexpected actionData in RegisterModal:", actionData);
                setLocalApiError("Phản hồi từ máy chủ không hợp lệ.");
            }
        }
        if (!isOpen) {
            setLocalApiError(null);
        }
    }, [actionData, isOpen, onClose, navigate, setFormErrors]); // Add dependencies

    useEffect(() => {
        if (isOpen) {
            setFullName('');
            setUsername('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setAgreeTerms(false);
            setFormErrors({});
            setLocalApiError(null);
            checkPasswordStrength('');
        }
    }, [isOpen, setFullName, setUsername, setEmail, setPassword, setConfirmPassword, setAgreeTerms, setFormErrors, checkPasswordStrength]);


    return (
        <Modal
            id="register-modal"
            isOpen={isOpen}
            onClose={onClose}
            title="Đăng ký tài khoản"
            footer={
                <div className="d-flex justify-content-center align-items-center">
                    <span className="footer-text">
                        Đã có tài khoản?
                    </span>
                    <Button
                        contentType="text"
                        type="button"
                        mainClass="login-link"
                        addClass="p-0"
                        onClick={onSwitchToLogin}
                        disabled={isSubmitting}
                    >
                        Đăng nhập
                    </Button>
                </div>
            }
        >
            <div className="register-header">
                <h1>Đăng ký tài khoản</h1>
                <p>Vui lòng điền thông tin để tạo tài khoản mới</p>
            </div>
            {/* Use your custom Form component */}
            <Form
                id="register-form-modal"
                method="post"
                action="/register"
                onSubmit={handleSubmit} // Pass client validation handler
                mainClass="register-form" // Use mainClass/addClass
                addClass="px-4"
                // noValidate // Optional
            >
                {localApiError && <div className="alert alert-danger mb-3">{localApiError}</div>}
                {formErrors.general && <div className="alert alert-danger mb-3">{formErrors.general}</div>}

                {/* Form Fields remain the same as previous RegisterModal example */}
                <div className="form-group">
                    <Input
                        id="registerModalFullName" name="fullName" label="Họ và tên"
                        placeholder="Nhập họ và tên" value={fullName} onChange={handleChange}
                        isInvalid={!!formErrors.fullName} feedback={formErrors.fullName}
                        addonBefore={<Icon name="user" size="16"/>}
                        disabled={isSubmitting}
                        required
                    />
                </div>
                <div className="form-group">
                    <Input
                        id="registerModalUsername" name="username" label="Tên đăng nhập"
                        placeholder="Nhập tên đăng nhập" value={username} onChange={handleChange}
                        isInvalid={!!formErrors.username} feedback={formErrors.username}
                        addonBefore={<Icon name="user" size="16"/>}
                        disabled={isSubmitting}
                        required
                    />
                </div>
                <div className="form-group">
                    <Input
                        id="registerModalEmail" name="email" type="email" label="Email"
                        placeholder="Nhập địa chỉ email" value={email} onChange={handleChange}
                        isInvalid={!!formErrors.email} feedback={formErrors.email}
                        addonBefore={<Icon name="envelope" size="16"/>}
                        disabled={isSubmitting}
                        required
                    />
                </div>
                <div className="form-group">
                    <Input
                        id="registerModalPassword" name="password" type="password" label="Mật khẩu"
                        placeholder="Nhập mật khẩu" value={password} onChange={handleChange}
                        isInvalid={!!formErrors.password} feedback={formErrors.password}
                        addonBefore={<Icon name="lock" size="16"/>}
                        disabled={isSubmitting}
                        required
                    />
                    {password && (
                        <div className="password-strength">
                            <div className="strength-bar">
                                <div
                                    className={`strength-level strength-${passwordStrength.score}`}
                                    style={{width: `${(passwordStrength.score / 4) * 100}%`}}
                                ></div>
                            </div>
                            <span className="strength-text">{passwordStrength.message}</span>
                        </div>
                    )}
                </div>
                <div className="form-group">
                    <Input
                        id="registerModalConfirmPassword" name="confirmPassword" type="password"
                        label="Xác nhận mật khẩu"
                        placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={handleChange}
                        isInvalid={!!formErrors.confirmPassword} feedback={formErrors.confirmPassword}
                        addonBefore={<Icon name="lock" size="16"/>}
                        disabled={isSubmitting}
                        required
                    />
                </div>
                <div className="form-group checkbox-group">
                    <div className="checkbox-container">
                        <input
                            type="checkbox" id="registerModalAgreeTerms" name="agreeTerms"
                            checked={agreeTerms} onChange={handleChange}
                            className={formErrors.agreeTerms ? 'is-invalid' : ''}
                            disabled={isSubmitting}
                            required
                        />
                        <label htmlFor="registerModalAgreeTerms">
                            Tôi đồng ý với&nbsp;
                            <a href="/terms" target="_blank" rel="noopener noreferrer" className="terms-link">
                                điều khoản dịch vụ
                            </a>
                            &nbsp;và&nbsp;
                            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="terms-link">
                                chính sách bảo mật
                            </a>
                        </label>
                    </div>
                    {formErrors.agreeTerms &&
                        <div className="invalid-feedback d-block">{formErrors.agreeTerms}</div>}
                </div>

                <Button
                    type="submit"
                    mainClass="register-button w-100"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
                </Button>
            </Form>
        </Modal>
    );
}