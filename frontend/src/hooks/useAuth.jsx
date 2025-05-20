import {useContext} from 'react';
import AuthContext from "#contexts/AuthContext.jsx";

const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) { // Or check if context is the initial placeholder object
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default useAuth;