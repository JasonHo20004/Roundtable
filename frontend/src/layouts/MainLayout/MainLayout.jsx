// src/layouts/MainLayout/MainLayout.jsx
import React, {useEffect, useState} from 'react'; // Make sure useEffect is imported
import './MainLayout.css';
import useAuth from "#hooks/useAuth.jsx";
import useWebSocketNotifications from "#hooks/useWebSocketNotifications.jsx";
import ChatAppWrapper from "#features/chats/components/ChatAppWrapper/ChatAppWrapper";
import useWebSocketChat from "#hooks/useWebSocketChat.jsx";

// Lazy load components
const Header = React.lazy(() => import("#shared/components/layout/Header/Header.jsx"));
const Content = React.lazy(() => import("#shared/components/layout/Content/Content.jsx"));
const Footer = React.lazy(() => import("#shared/components/layout/Footer/Footer.jsx"));
const LoginModal = React.lazy(() => import("#features/auth/components/LoginModal/LoginModal.jsx"));
const RegisterModal = React.lazy(() => import("#features/auth/components/RegisterModal/RegisterModal.jsx"));
const CreateSubtableModal = React.lazy(() => import("#features/subtables/components/CreateSubtableModal/CreateSubtableModal.jsx"));
export default function MainLayout() {
    // Get user state from AuthContext
    const {user, isLoading, checkSession} = useAuth(); // Destructure user
    const [isSidebarVisible, setSidebarVisible] = useState(false);

    // --- Modal Visibility State ---
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isCreateSubtableModalOpen, setIsCreateSubtableModalOpen] = useState(false);

    // --- Error State for Login ---
    const [loginApiError, setLoginApiError] = useState(null);

    // --- State for ChatBox ---
    const [isChatboxOpen, setIsChatboxOpen] = useState(false);

    // --- Activate WebSocket listener hook ---
    useWebSocketNotifications();
    useWebSocketChat();

    // --- Handlers ---
    const toggleSidebar = () => setSidebarVisible(prev => !prev);
    const toggleChat = () => setIsChatboxOpen(prev => !prev);

    // --- Modal Control ---
    const openLoginModal = () => {
        setIsRegisterModalOpen(false);
        setIsLoginModalOpen(true);
        setLoginApiError(null);
    };
    const closeLoginModal = () => {
        setIsLoginModalOpen(false);
        setLoginApiError(null);
    }

    const openRegisterModal = () => {
        setLoginApiError(null);
        setIsLoginModalOpen(false);
        setIsRegisterModalOpen(true);
    };
    const closeRegisterModal = () => {
        setIsRegisterModalOpen(false);
    }

    const openCreateSubtableModal = () => {
        setIsCreateSubtableModalOpen(true);
        setIsLoginModalOpen(false);
        setIsRegisterModalOpen(false);
    };

    const closeCreateSubtableModal = () => {
        setIsCreateSubtableModalOpen(false);
    };

    // --- Modal Switching ---
    const switchToRegister = () => {
        closeLoginModal();
        openRegisterModal();
    };

    const switchToLogin = () => {
        closeRegisterModal();
        openLoginModal();
    };

    // Effect to check session (keep if necessary, might be handled by AuthProvider already)
    useEffect(() => {
        checkSession();
    }, [checkSession]);

    // Effect to ensure modals are closed when the user is logged in
    useEffect(() => {
        // console.log("MainLayout user state check effect runs. User:", user);
        if (user) { // Check if the user object exists/is truthy
            // console.log("User detected in MainLayout, closing modals.");
            setIsLoginModalOpen(false);
            setIsRegisterModalOpen(false);
            setIsCreateSubtableModalOpen(false);
        }
    }, [user]); // Re-run this effect whenever the user state changes

    return (
        <div>
            <Header
                toggleChat={toggleChat}
                toggleSidebar={toggleSidebar}
                isSidebarVisible={isSidebarVisible}
                openLoginModal={openLoginModal}
                openRegisterModal={openRegisterModal}
                openCreateSubtableModal={openCreateSubtableModal}
            />

            <Content
                toggleSidebar={toggleSidebar}
                isSidebarVisible={isSidebarVisible}
            />

            <Footer/>

            {/* Render the Login Modal Component */}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={closeLoginModal}
                onSwitchToRegister={switchToRegister}
                isLoading={isLoading} // Use isLoading from useAuth for modal too
                authError={loginApiError} // Use specific modal error state
            />

            {/* Render the Register Modal Component */}
            <RegisterModal
                isOpen={isRegisterModalOpen}
                onClose={closeRegisterModal}
                onSwitchToLogin={switchToLogin}
                // No submit/loading/error props needed if using RR action
            />

            <CreateSubtableModal
                isOpen={isCreateSubtableModalOpen}
                onClose={closeCreateSubtableModal}
            />

            {/* --- Render ChatApp --- */}
            <ChatAppWrapper isOpen={isChatboxOpen} toggleChatVisibility={toggleChat}/>
        </div>
    );
}