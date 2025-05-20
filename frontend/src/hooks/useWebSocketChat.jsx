// src/hooks/useWebSocketChat.jsx
import {useEffect, useRef} from 'react';
import WebSocketSubject from '#subjects/WebsocketSubject.jsx';
import ChatObserver from '#observers/ChatObserver.jsx';
import useAuth from '#hooks/useAuth.jsx';
import useChat from '#hooks/useChat.jsx'; // Assuming useChat provides addMessage

/**
 * Custom hook to manage WebSocket chat messages using the class-based Observer pattern.
 * It creates an instance of ChatObserver and subscribes/unsubscribes it
 * to the global WebSocketSubject (the Concrete Subject), mirroring the
 * structure of useWebSocketNotifications.
 */
function useWebSocketChat() {
    const {user} = useAuth();
    // Get the addMessage callback from the ChatContext via the useChat hook
    const {addMessage} = useChat();

    // Ref to hold the single instance of the ChatObserver
    const observerRef = useRef(null);

    // --- Initialize the observer instance (similar to useWebSocketNotifications) ---
    useEffect(() => {
        if (!observerRef.current && typeof addMessage === 'function') {
            observerRef.current = new ChatObserver(addMessage);
        } else if (observerRef.current && typeof addMessage !== 'function') {
            // If context or callback becomes unavailable unexpectedly, clear the ref
            console.warn("[useWebSocketChat] addMessage callback became unavailable. Clearing observer ref.");
            observerRef.current = null;
        }
    }, []);

    // --- Effect to manage connection and subscription lifecycle ---
    // This effect now ONLY depends on the user state, mirroring useWebSocketNotifications
    useEffect(() => {
        let isMounted = true;
        // Get the current observer instance from the ref
        const currentObserver = observerRef.current;

        // Only proceed if the observer instance exists (created above)
        if (!currentObserver) {
            console.log("[useWebSocketChat] Subscription Effect: Observer not ready.");
            return; // Exit effect if observer isn't created
        }

        // Logic based on user presence
        if (user?.userId) {
            console.log(`[useWebSocketChat] Subscription Effect: User ${user.userId} detected. Connecting and subscribing observer.`);
            // Connect (idempotent) and then subscribe the observer instance
            WebSocketSubject.connect(user.userId)
                .then(() => {
                    // Check if component is still mounted after async connect
                    if (isMounted && observerRef.current) { // Check ref again
                        console.log("[useWebSocketChat] Subscription Effect: WebSocket connected. Subscribing ChatObserver.");
                        // Subscribe the observer INSTANCE to the Subject
                        WebSocketSubject.subscribe(observerRef.current);
                    }
                })
                .catch(err => {
                    // Log connection errors
                    console.error('[useWebSocketChat] Subscription Effect: WebSocket connection failed:', err?.message || err);
                });
        } else {
            console.log("[useWebSocketChat] Subscription Effect: No user detected. Unsubscribing observer.");
            // If there's no user, ensure the observer is unsubscribed.
            // We don't necessarily need to call disconnect() here,
            // as WebSocketSubject might handle disconnection when no observers are left,
            // or it might be handled elsewhere (e.g., on logout).
            // Unsubscribing is the key action for *this* hook's responsibility.
            if (observerRef.current) { // Check ref before unsubscribing
                WebSocketSubject.unsubscribe(observerRef.current);
            }
            // Optionally call disconnect if this hook should force it when user logs out:
            // WebSocketSubject.disconnect();
        }

        // Cleanup function runs on unmount or before re-running the effect (if user changes)
        return () => {
            isMounted = false;
            console.log("[useWebSocketChat] Subscription Effect Cleanup: Unsubscribing ChatObserver.");
            // Unsubscribe the specific observer instance when the effect cleans up
            if (observerRef.current) { // Check ref before unsubscribing
                WebSocketSubject.unsubscribe(observerRef.current);
            }
        };
        // The effect now only depends on the user object's identity.
    }, [user]); // Dependency array only includes user

    // This hook doesn't return anything, it just sets up the side effect.
}

export default useWebSocketChat;
