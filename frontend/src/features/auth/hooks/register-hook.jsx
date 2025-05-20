// src/hooks/useRegisterFormState.js
import {useEffect, useState} from 'react';

const useRegisterFormState = (isOpen, apiError) => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        if (!isOpen) {
            setFullName('');
            setUsername('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setAgreeTerms(false);
            setFormErrors({});
        } else {
            setFormErrors(prev => ({...prev, general: null}));
        }
    }, [isOpen]);

    useEffect(() => {
        if (apiError) {
            setFormErrors(prev => ({...prev, general: apiError}));
        }
    }, [apiError]);

    return {
        fullName,
        setFullName,
        username,
        setUsername,
        email,
        setEmail,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        agreeTerms,
        setAgreeTerms,
        formErrors,
        setFormErrors
    };
};

const usePasswordStrength = () => {
    const [passwordStrength, setPasswordStrength] = useState({score: 0, message: ''});

    const checkPasswordStrength = (pwd) => {
        let score = 0;
        let message = '';
        if (!pwd) {
            setPasswordStrength({score: 0, message: ''});
            return;
        }
        if (pwd.length < 6) message = 'Yếu';
        else {
            if (pwd.length >= 8) score += 1;
            if (/[A-Z]/.test(pwd)) score += 1;
            if (/[0-9]/.test(pwd)) score += 1;
            if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

            if (score <= 1) message = 'Yếu';
            else if (score === 2) message = 'Trung bình';
            else if (score === 3) message = 'Khá mạnh';
            else message = 'Mạnh';
        }
        setPasswordStrength({score, message});
    };

    return {
        passwordStrength,
        checkPasswordStrength
    };
};

export {useRegisterFormState, usePasswordStrength};