// src/features/chat/components/ChatMessage/ChatMessage.jsx
import React from 'react';
// Import the new specific CSS file
import './ChatMessage.css';

/**
 * Renders a single chat message bubble.
 * @param {object} props
 * @param {string} props.sender - The name of the message sender.
 * @param {string} props.text - The content of the message.
 * @param {boolean} props.isSent - True if the message was sent by the current user, false otherwise.
 */
export default function ChatMessage(props) {
    const {senderPrincipalId, currentUserPrincipalId, senderDisplayName, text, isSent} = props;

    const messageClass = isSent
        ? 'chatbox-message sent align-self-end'
        : 'chatbox-message received align-self-start';

    return (
        <div className={messageClass}>
            {!isSent && senderDisplayName && ( // Show sender name if received and available
                <span className="message-sender fw-bold">{senderDisplayName}</span>
            )}
            <p className="message-text m-0">{text}</p>
        </div>
    );
}