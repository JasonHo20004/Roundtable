// src/features/chats/components/ChatAppWrapper/ChatAppWrapper.jsx
import React, {useEffect, useRef} from 'react'; // Import useEffect
import ChatSidebar from '#features/chats/components/ChatSidebar/ChatSidebar';
import ChatBox from '#features/chats/components/ChatBox/ChatBox';
import useChat from '#hooks/useChat.jsx'; // Import the chat hook
import LoadingSpinner from '#shared/components/UIElement/LoadingSpinner/LoadingSpinner'; // For loading state
import './ChatAppWrapper.css';
import useAuth from "#hooks/useAuth.jsx";

// --- Dummy Data ---
const ALL_CHATS = [
    {id: 'chat1', partnerName: 'Alice'},
    {id: 'chat2', partnerName: 'Bob'},
    {id: 'chat3', partnerName: 'Charlie'},
];
const ALL_MESSAGES = {
    chat1: [
        {id: 1, sender: 'Alice', text: 'Hey there!'},
        {id: 2, sender: 'You', text: 'Hi Alice! How are you?'},
        {id: 3, sender: 'Alice', text: 'Doing well, thanks!'},
    ],
    chat2: [
        {id: 4, sender: 'Bob', text: 'Meeting at 3?'},
        {id: 5, sender: 'You', text: 'Yes, sounds good.'},
    ],
    chat3: [
        {id: 6, sender: 'Charlie', text: 'Can you send the report?'},
        {id: 7, sender: 'You', text: 'Sure, sending it now.'},
        {id: 8, sender: 'Charlie', text: 'Thanks!'},
        {id: 9, sender: 'Charlie', text: 'Got it.'},
    ],
};
// --- End Dummy Data ---

export default function ChatAppWrapper(props) {
    const {isOpen = false, toggleChatVisibility} = props;
    const {user} = useAuth(); // Get current user info

    // Use the chat hook to get state and actions
    const {
        conversationPartners,
        messages,
        activePartnerId,
        setActivePartnerId,
        fetchMessages,
        isLoadingConversations,
        isLoadingMessages,
        sendMessage,
        readMessages,
    } = useChat();

    // Ref for the main wrapper div
    const wrapperRef = useRef(null);

    // Effect to handle focus and call markMessagesAsRead
    useEffect(() => {
        const wrapperElement = wrapperRef.current;

        const handleFocusIn = (event) => {
            // Check if the wrapper exists, is open, has an active chat,
            // and the focus event originated from within the wrapper
            if (wrapperElement && isOpen && activePartnerId) {
                console.log('Chat focused, marking messages as read for:', activePartnerId); // Optional: for debugging
                readMessages(activePartnerId);
            }
        };

        // Add event listener when the component mounts or dependencies change
        if (wrapperElement) {
            // Use capture phase false (bubble phase) is standard for 'focusin'
            wrapperElement.addEventListener('focusin', handleFocusIn);
        }


        // Cleanup: remove event listener when component unmounts or dependencies change
        return () => {
            if (wrapperElement) {
                wrapperElement.removeEventListener('focusin', handleFocusIn);
            }
        };
        // Dependencies: Re-run effect if visibility, active chat, or read function changes
    }, [isOpen, activePartnerId, readMessages]); // Add wrapperRef? No, ref object is stable.


    const handleSelectChat = (partnerPrincipalId) => {
        console.log("Selected Chat Partner ID:", partnerPrincipalId);
        setActivePartnerId(partnerPrincipalId);
        if (partnerPrincipalId) {
            // Fetch messages if not already loaded (optional, depends on your logic)
            if (!messages[partnerPrincipalId] || messages[partnerPrincipalId].length === 0) {
                fetchMessages(partnerPrincipalId);
            }
            // Mark as read immediately on selection as well
            readMessages(partnerPrincipalId);
        }
    };

    const handleSendMessage = async (messageBody) => {
        if (!activePartnerId || !messageBody.trim()) {
            return;
        }
        try {
            await sendMessage(activePartnerId, messageBody);
        } catch (error) {
            console.error("Failed to send message from wrapper:", error);
            alert("Error sending message. Please try again.");
        }
    };

    const handleCloseChat = () => {
        toggleChatVisibility();
    };

    const selectedPartner = conversationPartners.find(p => p.partnerPrincipalId === activePartnerId);
    const messagesForSelectedChat = messages[activePartnerId] || [];

    const wrapperClasses = `
        chat-app-wrapper
        position-fixed
        bottom-0
        end-0
        m-3
        z-index-fixed
        bg-light
        border
        rounded
        shadow-sm
        d-flex
        flex-row
        ${isOpen ? 'visible' : 'hidden'}
    `;

    return (
        // Add the ref and tabindex to make the div focusable itself (optional but good practice)
        <div className={wrapperClasses} ref={wrapperRef} tabIndex="-1">
            {/* Sidebar */}
            {isLoadingConversations ? (
                <div className="chat-sidebar d-flex justify-content-center align-items-center">
                    <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <ChatSidebar
                    chats={conversationPartners}
                    selectedPartnerId={activePartnerId}
                    onSelectChat={handleSelectChat}
                />
            )}

            {/* Chat Content Area */}
            <div className="chat-content-area flex-grow-1 d-flex flex-column">
                {activePartnerId ? (
                    isLoadingMessages ? (
                        <div className="d-flex justify-content-center align-items-center h-100">
                            <LoadingSpinner size={40} message="Loading messages..."/>
                        </div>
                    ) : (
                        <ChatBox
                            chatPartnerName={selectedPartner?.partnerDisplayName || "Chat"}
                            messages={messagesForSelectedChat}
                            onSendMessage={handleSendMessage}
                            onClose={handleCloseChat}
                            currentUserPrincipalId={user?.principalId}
                        />
                    )
                ) : (
                    <div
                        className="no-chat-selected p-3 text-center text-muted d-flex justify-content-center align-items-center h-100 position-relative">
                        Select a chat to start messaging.
                        <button
                            type="button"
                            className="btn-close position-absolute top-0 end-0 m-2"
                            aria-label="Close Chat"
                            onClick={handleCloseChat}
                        ></button>
                    </div>
                )}
            </div>
        </div>
    );
}