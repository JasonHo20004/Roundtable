import {createContext} from "react";

const NotificationContext = createContext({
    notifications: [],
    unreadCount: 0,
    initializeNotifications: () => {
    },
    addNotification: () => {
    },
    markAsRead: () => {
    },
    clearNotifications: () => {
    },
    isLoadingCount: false,
});

export default NotificationContext;
