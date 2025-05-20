// src/hooks/useLoginForm.js
import {useEffect, useState} from 'react';

const useLoginForm = (isOpen, authError) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            setUsername('');
            setPassword('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (authError) {
            setError(authError);
        }
    }, [authError]);

    return {
        username,
        setUsername,
        password,
        setPassword,
        error
    };
};

export default useLoginForm;