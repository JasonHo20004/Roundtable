import {createContext} from 'react';

const AuthContext = createContext({
    user: null,
    isLoading: true,
    error: null,
    logout: async () => {
    },
    checkSession: async () => {
    },
});

export default AuthContext;
