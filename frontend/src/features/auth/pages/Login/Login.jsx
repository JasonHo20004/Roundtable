import useLoginForm from '#features/auth/hooks/login-hook.jsx';
import useAuth from '#hooks/useAuth.jsx';
import './Login.css';
import Input from '#shared/components/UIElement/Input/Input';
import Button from '#shared/components/UIElement/Button/Button';
import Icon from '#shared/components/UIElement/Icon/Icon';
import Form from '#shared/components/UIElement/Form/Form';
import {useActionData, useNavigate, useNavigation} from "react-router";
import {useEffect, useState} from "react";

function Login() {
    const navigate = useNavigate();
    const actionData = useActionData(); // Get data from the loginAction
    const navigation = useNavigation(); // Get form submission state
    const {user} = useAuth(); // Check if user is already logged in

    // Local state for the message display, updated by actionData
    const [message, setMessage] = useState(null);

    // Form state hook (assuming it just manages input values)
    const {username, setUsername, password, setPassword} = useLoginForm(true, null); // Pass null for initial authError

    // Effect to process the result from the loginAction
    useEffect(() => {
        if (actionData) {
            console.log("Login Page actionData received:", actionData);
            setMessage(actionData?.message); // Set the message state for display

            if (actionData?.success === true) {
                navigate('/')
                console.log("Login successful (actionData indicates success)");
            } else if (actionData?.success === false) {
                // Handle specific error message from actionData
                console.log("Login failed (actionData indicates failure):", actionData.message);
            }
        }
    }, [actionData]); // Depend only on actionData

    // Redirect to home if user is already logged in
    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    // Clear message when user starts typing again
    const handleUsernameChange = (e) => {
        if (message) {
            setMessage(null);
        }
        setUsername(e.target.value);
    };

    const handlePasswordChange = (e) => {
        if (message) {
            setMessage(null);
        }
        setPassword(e.target.value);
    };

    return (
        <div className="login-form-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Đăng nhập</h1>
                    <p>Vui lòng nhập thông tin để đăng nhập</p>
                </div>

                {/* --- ADDED: Display Error Message --- */}
                {/* Display the message state if it exists */}
                {message && (
                    <div className={`alert alert-${actionData?.success === false ? 'danger' : 'info'} mb-3`}>
                        {message}
                    </div>
                )}
                {/* --- End Added Section --- */}

                {/* Use React Router's Form for action submission */}
                <Form
                    id="login-form"
                    method="post" // Use POST for login
                    action="/login"  // The route mapped to your loginAction
                    mainClass="login-form"
                >
                    <div className="form-group">
                        <Input
                            id="loginUsername"
                            type="text"
                            label="Tên đăng nhập"
                            name="username" // Name attribute is required for form data
                            placeholder="Nhập tên đăng nhập"
                            value={username}
                            onChange={handleUsernameChange} // Use updated handler
                            required
                            disabled={navigation.state === 'submitting'}
                            addonBefore={<Icon name="user" size="16"/>}
                        />
                    </div>
                    <div className="form-group">
                        <Input
                            id="loginPassword"
                            name="password" // Name attribute is required for form data
                            type="password"
                            label="Mật khẩu"
                            placeholder="Nhập mật khẩu"
                            value={password}
                            onChange={handlePasswordChange} // Use updated handler
                            required
                            disabled={navigation.state === 'submitting'}
                            addonBefore={<Icon name="lock" size="16"/>}
                        />
                    </div>
                    <Button
                        type="submit"
                        mainClass="login-button"
                        addClass="w-100"
                        disabled={navigation.state === 'submitting'}
                    >
                        {navigation.state === 'submitting' ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </Button>
                </Form>
                <div className="login-footer mt-3">
                    <div className="d-flex justify-content-center align-items-center">
                        <span className="footer-text">
                            Chưa có tài khoản?
                        </span>
                        <Button
                            type="button"
                            mainClass="register-link"
                            contentType="text"
                            addClass="p-0"
                            onClick={() => {
                                navigate('/register'); // Navigate to the register page
                            }}
                            // Optionally disable during submission
                            disabled={navigation.state === 'submitting'}
                        >
                            Đăng ký
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;