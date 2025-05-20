// src/features/chat/components/ChatBox/ChatBox.jsx
// Import useRef and useEffect
import React, {useEffect, useRef, useState} from 'react';
import './ChatBox.css'; // Corrected path
import Button from '#shared/components/UIElement/Button/Button';
import Icon from '#shared/components/UIElement/Icon/Icon';
import ChatMessage from '#features/chats/components/ChatMessage/ChatMessage';

export default function ChatBox(props) {
    const {
        chatPartnerName = "Chat",
        messages = [],
        onClose,
        onSendMessage,
        currentUserPrincipalId // Receive current user ID
    } = props;
    const [inputValue, setInputValue] = useState(''); // State for the input field

    // Create a ref for the scroll target element
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    // Add useEffect to scroll down when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]); // Dependency array includes messages

    const handleCloseChat = () => {
        if (onClose) {
            onClose();
        }
    }

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleSendClick = () => {
        if (inputValue.trim() && onSendMessage) {
            onSendMessage(inputValue.trim()); // Call the passed handler
            setInputValue(''); // Clear the input field
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { // Send on Enter, allow Shift+Enter for newline
            e.preventDefault(); // Prevent default form submission/newline
            handleSendClick();
        }
    };

    return (
        <div className={`chatbox-container`}>
            <div className="chatbox-header d-flex justify-content-between align-items-center px-3 py-2">
                <span className="fw-bold">{chatPartnerName}</span>
                <Button
                    type="button"
                    className="btn-close wrapper-close-button"
                    aria-label="Close Chat"
                    onClick={handleCloseChat}
                ></Button>
            </div>

            {/* Chat body */}
            <div className="chatbox-body flex-grow-1 p-3 d-flex flex-column gap-2">
                {messages.map((msg) => (
                    <ChatMessage
                        key={msg.messageId}
                        senderPrincipalId={msg.senderProfile.principalId} // Pass sender ID
                        currentUserPrincipalId={currentUserPrincipalId} // Pass current user ID
                        senderDisplayName={msg.senderProfile.displayName} // Pass if available
                        text={msg.body}
                        isSent={msg.senderProfile.principalId === currentUserPrincipalId} // Comparison logic
                    />
                ))}
                {messages.length === 0 && (
                    <p className="text-muted text-center mt-3">No messages yet.</p>
                )}
                {/* Add an empty div at the end and attach the ref */}
                <div ref={messagesEndRef}/>
            </div>

            <div className="chatbox-footer d-flex align-items-center p-2 border-top">
                <input
                    type="text"
                    className="form-control form-control-sm rounded-pill me-2"
                    placeholder="Type a message..."
                    aria-label="Chat message input"
                    value={inputValue} // Bind value to state
                    onChange={handleInputChange} // Handle changes
                    onKeyDown={handleKeyDown} // Handle Enter key
                />
                {/* Keep the send button or other footer elements as needed */}
                <Button
                    contentType="icon"
                    mainClass="chatbox-send-btn"
                    onClick={handleSendClick}
                    disabled={!inputValue.trim()} // Disable if input is empty
                >
                    <Icon
                        name="send"
                        size="20px"
                    /> {/* Example send icon */}
                </Button>
            </div>
        </div>
    );
}