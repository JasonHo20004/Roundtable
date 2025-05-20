// frontend/src/hooks/useWebSocketNotifications.jsx
import {useEffect, useRef} from 'react'; // Import useRef
import WebSocketSubject from '#subjects/WebsocketSubject.jsx';
import NotificationObserver from '#observers/NotificationObserver.jsx';
import useAuth from '#hooks/useAuth.jsx';
import useNotifications from '#hooks/useNotifications.jsx';

/**
 * Custom hook to manage WebSocket notifications using the class-based Observer pattern.
 * It creates an instance of NotificationObserver and subscribes/unsubscribes it
 * to the global WebSocketSubject (the Concrete Subject).
 */
function useWebSocketNotifications() {
    const {user} = useAuth();
    const {addNotification} = useNotifications();

    const observerRef = useRef(null);

    // --- Initialize the observer instance ---
    useEffect(() => {
        if (!observerRef.current && addNotification) {
            // Create the Concrete Observer, passing the context action
            observerRef.current = new NotificationObserver(addNotification);
        } else if (!addNotification && observerRef.current) {
            // If context somehow becomes unavailable, clear the ref
            console.warn("[useWebSocketNotifications] addNotification callback became unavailable. Clearing observer ref.");
            observerRef.current = null;
        }
    }, []);

    // --- Effect to manage connection and subscription lifecycle ---
    useEffect(() => {
        let isMounted = true;
        // Get the current observer instance from the ref
        const currentObserver = observerRef.current;

        // Only proceed if the observer instance exists
        if (!currentObserver) {
            return; // Exit effect if observer isn't created
        }

        if (user?.userId) { // Check if user is logged in
            // Connect (idempotent) and then subscribe the observer instance
            WebSocketSubject.connect(user.userId)
                .then(() => {
                    // Check if component is still mounted after async connect
                    if (isMounted) {
                        // Subscribe the observer INSTANCE to the Subject
                        WebSocketSubject.subscribe(currentObserver);
                    }
                })
                .catch(err => {
                    // Log connection errors
                    console.error('[useWebSocketNotifications] WebSocket connection failed:', err?.message || err);
                });
        } else {
            // If there's no user, ensure the WebSocket is disconnected
            // Disconnecting also clears observers in the Subject implementation
            WebSocketSubject.disconnect();
        }

        // Cleanup function runs on unmount or before re-running
        return () => {
            isMounted = false;

            if (observerRef.current) {
                WebSocketSubject.unsubscribe(observerRef.current);
            }
        };
    }, [user]);
}

export default useWebSocketNotifications;
