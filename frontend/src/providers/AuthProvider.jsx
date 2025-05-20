import React, {useCallback, useEffect, useState} from 'react';
import AuthContext from '#contexts/AuthContext.jsx'; // Import from the split context file
import {sendApiRequest} from '#utils/apiClient';

const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const checkSession = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setIsLoading(true);
        }
        try {
            const response = await sendApiRequest('/api/auth/session', {
                method: 'GET',
            });
            if (response?.user) {
                setUser(response.user);
                setError(null);
            } else {
                setUser(null);
            }
        } catch (err) {
            if (err.status === 401) {
                setError(null); // Not an error, just no session
            } else {
                console.error("Error checking session:", err);
                setError("Could not verify login status.");
            }
            setUser(null);
        } finally {
            if (showLoading) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const logout = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            await sendApiRequest('/api/auth/logout', {method: 'POST'});
        } catch (err) {
            console.error("Logout API error:", err);
        } finally {
            setUser(null);
            setIsLoading(false);
        }
    }, []);

    const contextValue = {
        user,
        isLoading,
        error,
        logout,
        checkSession,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
