// src/features/chats/components/ChatAppWrapper/ChatSidebar.jsx
import React from 'react';
import './ChatSidebar.css'; // CSS for the sidebar styling

export default function ChatSidebar(props) {
    const {chats, selectedPartnerId, onSelectChat} = props;

    return (
        <div className="chat-sidebar">
            <h5 className="sidebar-header">Chats</h5>
            <ul className="chat-list list-unstyled"> {/* Use list-unstyled from Bootstrap */}
                {chats.map((chat) => (
                    <li
                        key={chat.partnerPrincipalId}
                        className={`chat-list-item ${chat.partnerPrincipalId === selectedPartnerId ? 'active' : ''}`}
                        onClick={() => onSelectChat(chat.partnerPrincipalId)}
                    >
                        <span className="chat-user-name">{chat.partnerDisplayName}</span>
                        {chat.unreadCount > 0 && (
                            <span className="chat-unread-count badge rounded-pill bg-danger notification-badge">
                                {chat.unreadCount}
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}