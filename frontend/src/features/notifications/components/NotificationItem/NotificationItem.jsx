import React from 'react';
import './NotificationItem.css';
import Icon from '#shared/components/UIElement/Icon/Icon'; // Assuming Icon component exists
import {formatTimeAgo} from '#utils/time'; // Assuming time utility exists
import Link from '#shared/components/Navigation/Link/Link';
import {useNavigate} from "react-router"; // Use your Link component

export default function NotificationItem(props) {
    const {notification, onClick} = props;
    const navigate = useNavigate();

    // Function to determine icon based on notification.type
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'comment_reply':
            case 'post_reply':
                return 'comment';
            case 'mention':
                return 'person';
            case 'moderator_invite':
                return 'shield';
            default:
                return 'bell';
        }
    };

    // Use the content directly from the notification object
    const notificationText = notification.content || 'New notification';

    // Use the sourceUrl from the notification object
    const notificationLink = notification.sourceUrl || '#'; // Default link if none provided

    return (
        // Use Link component for navigation, call onClick if provided
        <Link
            href={notificationLink}
            className={`notification-item list-group-item list-group-item-action d-flex align-items-start ${notification.isRead ? '' : 'unread'}`}
            onClick={(e) => {
                if (onClick) {
                    e.preventDefault();
                    onClick();
                    navigate(notificationLink);
                }
            }}
        >
            <Icon name={getNotificationIcon(notification.type)} size="18px" addClass="me-3 mt-1 notification-icon"/>
            <div className="notification-content">
                {/* Use dangerouslySetInnerHTML ONLY if backend guarantees sanitized HTML */}
                {/* Otherwise, just render the text */}
                <div className="notification-text">{notificationText}</div>
                <small className="text-muted">{formatTimeAgo(notification.createdAt)}</small>
            </div>
            {!notification.isRead && <span className="unread-dot ms-auto"></span>}
        </Link>
    );
}