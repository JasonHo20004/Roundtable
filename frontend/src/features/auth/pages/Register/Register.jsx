import React, {useCallback, useEffect} from 'react'; // Added useCallback
import {usePasswordStrength, useRegisterFormState} from '#features/auth/hooks/register-hook.jsx';
import './Register.css';
import Input from '#shared/components/UIElement/Input/Input';
import Button from '#shared/components/UIElement/Button/Button';
import Icon from '#shared/components/UIElement/Icon/Icon';
import Form from '#shared/components/UIElement/Form/Form';
import {useActionData, useNavigate, useNavigation} from 'react-router';

function Register() {
    // --- Hooks ---
    const navigate = useNavigate();
    const actionData = useActionData();
    const navigation = useNavigation();

    // --- Loading State ---
    const isSubmitting = navigation.state === 'submitting';

    // --- Custom Form Hook & State ---
    const {
        username, setUsername,
        email, setEmail,
        password, setPassword,
        confirmPassword, setConfirmPassword,
        agreeTerms, setAgreeTerms,
        formErrors, setFormErrors
    } = useRegisterFormState(true, null);

    const {passwordStrength, checkPasswordStrength} = usePasswordStrength();

    // --- Validation Function (Helper) ---
    // useCallback helps stabilize this function if passed as prop, good practice
    const validateField = useCallback((name, value, currentPassword) => {
        let error = null;
        switch (name) {
            case 'username':
                if (!value.trim()) error = 'Vui lòng nhập tên đăng nhập';
                break;
            case 'email':
                if (!value.trim()) error = 'Vui lòng nhập email';
                else if (!/\S+@\S+\.\S+/.test(value)) error = 'Email không hợp lệ';
                break;
            case 'password':
                if (!value) error = 'Vui lòng nhập mật khẩu';
                else if (value.length < 6) error = 'Mật khẩu phải có ít nhất 6 ký tự';
                break;
            case 'confirmPassword':
                if (value !== currentPassword) error = 'Mật khẩu xác nhận không khớp';
                break;
            case 'agreeTerms':
                if (!value) error = 'Bạn phải đồng ý với điều khoản dịch vụ';
                break;
            default:
                break;
        }
        return error;
    }, []); // No dependencies needed if it only uses args

    // --- Handle Change with Immediate Validation ---
    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        // 1. Update the specific field's state
        let currentPassword = password; // Capture password before potential update
        switch (name) {
            case 'username':
                setUsername(newValue);
                break;
            case 'email':
                setEmail(newValue);
                break;
            case 'password':
                setPassword(newValue);
                checkPasswordStrength(newValue);
                currentPassword = newValue; // Update currentPassword for validation below
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

        // 2. Validate the changed field immediately
        const error = validateField(name, newValue, currentPassword);
        setFormErrors(prevErrors => ({
            ...prevErrors,
            [name]: error, // Set or clear the error for this field
            general: null // Clear general API error on any change
        }));

        // 3. If password changed, re-validate confirmPassword
        if (name === 'password') {
            const confirmPasswordError = validateField('confirmPassword', confirmPassword, newValue);
            setFormErrors(prevErrors => ({
                ...prevErrors,
                confirmPassword: confirmPasswordError
            }));
        }
        // 4. If confirmPassword changed, re-validate it against the current password
        if (name === 'confirmPassword') {
            const confirmPasswordError = validateField('confirmPassword', newValue, password);
            setFormErrors(prevErrors => ({
                // Keep existing errors, only update confirmPassword's error
                ...prevErrors,
                confirmPassword: confirmPasswordError
            }));
        }
    };


    // --- Full Form Validation (used on submit) ---
    const validateForm = () => {
        const newErrors = {};
        // Call individual field validations
        newErrors.username = validateField('username', username);
        newErrors.email = validateField('email', email);
        newErrors.password = validateField('password', password);
        newErrors.confirmPassword = validateField('confirmPassword', confirmPassword, password);
        newErrors.agreeTerms = validateField('agreeTerms', agreeTerms);

        // Filter out null/undefined errors
        const filteredErrors = Object.entries(newErrors)
            .filter(([_, value]) => value !== null)
            .reduce((acc, [key, value]) => ({...acc, [key]: value}), {});

        setFormErrors(filteredErrors);
        return Object.keys(filteredErrors).length === 0;
    };

    // --- Handle Submit (No changes needed, relies on validateForm) ---
    const handleSubmit = (event) => {
        setFormErrors({}); // Clear previous submit errors

        if (!validateForm()) {
            event.preventDefault();
            console.log("Client validation failed. Preventing submission.");
            return;
        }
        console.log("Client validation passed. Allowing React Router submission...");
    };

    // --- Effect to Handle API Response (No changes from previous step) ---
    useEffect(() => {
        if (actionData) {
            console.log("Action data received:", actionData);
            if (actionData.success === true) {
                console.log('Registration successful (via actionData):', actionData.data);
                setUsername('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setAgreeTerms(false);
                setFormErrors({});
                navigate('/verify-email', {
                    replace: true,
                    state: {prefilledEmail: actionData.data?.email}
                });
            } else if (actionData.success === false) {
                console.log("Registration failed:", actionData.message);
                // API error will be displayed via apiErrorMessage variable below
            } else if (actionData.error) {
                console.log("Registration action returned error object:", actionData.error.message);
                // API error will be displayed via apiErrorMessage variable below
            } else {
                console.warn("Received unexpected actionData:", actionData);
            }
        }
    }, [actionData, navigate, setUsername, setEmail, setPassword, setConfirmPassword, setAgreeTerms, setFormErrors]);

    // --- Define error message variable directly from actionData ---
    const apiErrorMessage = actionData?.success === false
        ? actionData.message
        : actionData?.error?.message || null;


    // --- Render ---
    return (
        <div className="register-form-container">
            <div className="register-card">
                <div className="register-header">
                    <h1>Đăng ký tài khoản</h1>
                    <p>Vui lòng điền thông tin để tạo tài khoản mới</p>
                </div>

                {/* Display API error */}
                {apiErrorMessage && <div className="alert alert-danger mb-3">{apiErrorMessage}</div>}

                {/* Display general client-side validation error (e.g., if submit fails validation) */}
                {/* This might be less common now with immediate validation */}
                {formErrors.general && <div className="alert alert-danger mb-3">{formErrors.general}</div>}

                <Form
                    id="register-form"
                    onSubmit={handleSubmit}
                    method="post"
                    action="/register"
                    mainClass="register-form"
                    noValidate // Disable browser's native validation UI
                >
                    {/* === Username === */}
                    <div className="form-group">
                        <Input
                            id="registerUsername" name="username" label="Tên đăng nhập"
                            placeholder="Nhập tên đăng nhập" value={username} onChange={handleChange}
                            isInvalid={!!formErrors.username} feedback={formErrors.username}
                            addonBefore={<Icon name="user" size="16"/>}
                            disabled={isSubmitting}
                            // Removed 'required' to rely solely on custom validation feedback
                        />
                    </div>
                    {/* === Email === */}
                    <div className="form-group">
                        <Input
                            id="registerEmail" name="email" type="email" label="Email"
                            placeholder="Nhập địa chỉ email" value={email} onChange={handleChange}
                            isInvalid={!!formErrors.email} feedback={formErrors.email}
                            addonBefore={<Icon name="envelope" size="16"/>}
                            disabled={isSubmitting}
                        />
                    </div>
                    {/* === Password === */}
                    <div className="form-group">
                        <Input
                            id="registerPassword" name="password" type="password" label="Mật khẩu"
                            placeholder="Nhập mật khẩu" value={password} onChange={handleChange}
                            isInvalid={!!formErrors.password} feedback={formErrors.password}
                            addonBefore={<Icon name="lock" size="16"/>}
                            disabled={isSubmitting}
                        />
                        {password && ( // Only show strength if password has value
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
                    {/* === Confirm Password === */}
                    <div className="form-group">
                        <Input
                            id="registerConfirmPassword" name="confirmPassword" type="password"
                            label="Xác nhận mật khẩu"
                            placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={handleChange}
                            isInvalid={!!formErrors.confirmPassword} feedback={formErrors.confirmPassword}
                            addonBefore={<Icon name="lock" size="16"/>}
                            disabled={isSubmitting}
                        />
                    </div>
                    {/* === Agree Terms === */}
                    <div className="form-group checkbox-group">
                        <div className="checkbox-container">
                            <input
                                type="checkbox" id="registerAgreeTerms" name="agreeTerms"
                                checked={agreeTerms} onChange={handleChange}
                                // Use isInvalid class for visual feedback if needed
                                className={formErrors.agreeTerms ? 'is-invalid' : ''}
                                disabled={isSubmitting}
                            />
                            <label htmlFor="registerAgreeTerms">
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
                        {/* Display checkbox error message */}
                        {formErrors.agreeTerms &&
                            <div className="invalid-feedback d-block">{formErrors.agreeTerms}</div>}
                    </div>
                    {/* === Submit Button === */}
                    <Button
                        type="submit"
                        mainClass="register-button w-100"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
                    </Button>
                </Form>

                {/* --- Footer (Login Link) --- */}
                <div className="register-footer mt-3">
                    <div className="d-flex justify-content-center align-items-center">
                        <span className="footer-text">
                            Đã có tài khoản?
                        </span>
                        <Button
                            contentType="text"
                            type="button"
                            mainClass="login-link"
                            addClass="p-0"
                            onClick={() => navigate('/login')}
                            disabled={isSubmitting} // Disable during form submission
                        >
                            Đăng nhập
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;