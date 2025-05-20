import React, {useEffect, useRef, useState} from 'react';
// Make sure the import is correct for your setup, often 'react-router-dom'
import {useFetcher} from 'react-router'; // Or 'react-router' if that's your setup
import useAuth from '#hooks/useAuth.jsx';
import useLoginForm from '#features/auth/hooks/login-hook.jsx';

import Modal from "#shared/components/UIElement/Modal/Modal.jsx";
import Button from "#shared/components/UIElement/Button/Button.jsx";
import Input from "#shared/components/UIElement/Input/Input.jsx";
import Icon from '#shared/components/UIElement/Icon/Icon';

import './LoginModal.css';

export default function LoginModal(props) {
    const {
        isOpen,
        onClose,
        onSwitchToRegister,
    } = props;

    const {checkSession} = useAuth();
    const fetcher = useFetcher();
    const isSubmitting = fetcher.state === 'submitting';
    const actionData = fetcher.data;

    const {username, setUsername, password, setPassword} = useLoginForm(isOpen);
    const [message, setMessage] = useState(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleUsernameChange = (e) => {
        if (message) setMessage(null);
        setUsername(e.target.value);
    };

    const handlePasswordChange = (e) => {
        if (message) setMessage(null);
        setPassword(e.target.value);
    };

    useEffect(() => {
        const handleActionData = async () => {
            // This condition should now work correctly when fetcher.data updates
            if (isOpen && actionData && isMounted.current) {
                console.log("Login Modal fetcher.data received:", actionData);
                if (actionData.success === true) {
                    console.log("Login successful via fetcher, closing modal and refreshing session...");
                    onClose(); // <-- This should now be called
                    await checkSession(false);
                    console.log("Session check triggered after successful login.");
                } else if (actionData.success === false) {
                    setMessage(actionData.message || 'Đăng nhập không thành công.');
                } else {
                    console.warn("Received unexpected fetcher.data in LoginModal:", actionData);
                    setMessage("Phản hồi từ máy chủ không hợp lệ.");
                }
            }
            if (!isOpen && isMounted.current) {
                setMessage(null);
            }
        };
        handleActionData();
    }, [actionData, isOpen, onClose, checkSession]);

    useEffect(() => {
        if (isMounted.current) {
            if (isOpen) {
                setUsername('');
                setPassword('');
                setMessage(null);
            }
        }
    }, [isOpen, setUsername, setPassword]);

    return (
        <Modal
            id="login-modal"
            isOpen={isOpen}
            onClose={onClose}
            title="Đăng nhập"
            footer={
                <div className="d-flex justify-content-center align-items-center">
                <span className="footer-text">
                    Chưa có tài khoản?
                </span>
                    <Button
                        type="button"
                        mainClass="register-link"
                        contentType="text"
                        addClass="p-0"
                        onClick={onSwitchToRegister}
                        disabled={isSubmitting}
                    >
                        Đăng ký
                    </Button>
                </div>
            }
        >
            <div className="login-header">
                <h1>Đăng nhập</h1>
                <p>Vui lòng nhập thông tin để đăng nhập</p>
            </div>

            {/* **** Use fetcher.Form provided by the useFetcher hook **** */}
            <fetcher.Form
                method="post"
                action="/login" // Point to the route with the loginAction
                className="login-form px-4" // Apply necessary classes directly
                // No need for navigate={false} or fetcherKey here
            >
                {message && <div className={`alert alert-${actionData?.success ? 'info' : 'danger'}`}>{message}</div>}
                <div className="form-group">
                    <Input
                        id="loginModalUsername"
                        type="text"
                        label="Tên đăng nhập"
                        name="username"
                        placeholder="Nhập tên đăng nhập"
                        value={username}
                        onChange={handleUsernameChange}
                        required
                        disabled={isSubmitting}
                        addonBefore={<Icon name="user" size="16"/>}
                    />
                </div>
                <div className="form-group">
                    <Input
                        id="loginModalPassword"
                        name="password"
                        type="password"
                        label="Mật khẩu"
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                        disabled={isSubmitting}
                        addonBefore={<Icon name="lock" size="16"/>}
                    />
                </div>
                <Button
                    type="submit"
                    mainClass="login-button w-100"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
                </Button>
            </fetcher.Form>
        </Modal>
    );
};