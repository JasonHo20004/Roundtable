import React, {useEffect} from 'react';
import './NotificationsView.css';
import NotificationItem from '#features/notifications/components/NotificationItem/NotificationItem.jsx';
import useNotifications from '#hooks/useNotifications.jsx';
import {useLoaderData} from "react-router";

export default function NotificationsView() {
    // Get data from the loader
    const loaderData = useLoaderData();
    const fetchedNotifications = loaderData?.notifications || [];

    // Use context for real-time updates and unread count
    const {unreadCount, markAsRead, notifications, initializeNotifications} = useNotifications();

    // Initialize notifications from the loader data
    useEffect(() => {
        initializeNotifications(fetchedNotifications);
    }, [fetchedNotifications]);

    // Determine which notifications to display
    const displayedNotifications = notifications.length > 0 ? notifications : fetchedNotifications;

    const handleMarkAsRead = (id) => {
        console.log("Marking as read (UI):", id);
        markAsRead(id);
    };

    return (
        <div className="notifications-page-container card">
            <h2 className="card-header d-flex justify-content-between align-items-center">
                {/* Use unreadCount from context */}
                <span>Notifications {unreadCount > 0 ? `(${unreadCount} unread)` : ''}</span>
            </h2>
            <div className="list-group list-group-flush">
                {/* Render notifications fetched by the LOADER */}
                {displayedNotifications.length > 0 ? (
                    displayedNotifications.map(notification => (
                        <NotificationItem
                            key={notification.notificationId}
                            notification={notification}
                            onClick={() => !notification.isRead && handleMarkAsRead(notification.notificationId)}
                        />
                    ))
                ) : (
                    <p className="p-3 text-muted text-center">You have no notifications.</p>
                )}
            </div>
        </div>
    );
}