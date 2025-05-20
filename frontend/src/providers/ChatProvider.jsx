// src/providers/ChatProvider.jsx
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import ChatContext from '#contexts/ChatContext.jsx';
import chatService from '#services/chatService';
import useAuth from '#hooks/useAuth.jsx';

const ChatProvider = ({children}) => {
    const {user} = useAuth();
    const [conversationPartners, setConversationPartners] = useState([]);
    const [messages, setMessages] = useState({});
    const [loadedConversations, setLoadedConversations] = useState(new Set());
    const [activePartnerId, setActivePartnerId] = useState(null);
    const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [error, setError] = useState(null);

    const fetchConversations = useCallback(async () => {
        if (!user?.principalId) {
            setIsLoadingConversations(false);
            setConversationPartners([]);
            setTotalUnreadMessages(0);
            return;
        }
        setIsLoadingConversations(true);
        setError(null);
        try {
            const fetchedPartners = await chatService.getConversationPartners();
            const validPartners = fetchedPartners || [];
            setConversationPartners(validPartners);
            console.log("Fetched conversation partners:", validPartners);
            setTotalUnreadMessages(validPartners.reduce((acc, partner) => acc + (partner.unreadCount || 0), 0));
        } catch (err) {
            console.error("Error fetching conversations:", err);
            setError("Failed to load conversation list.");
            setConversationPartners([]);
            setTotalUnreadMessages(0);
        } finally {
            setIsLoadingConversations(false);
        }
    }, [user]);

    const fetchMessages = useCallback(async (partnerPrincipalId) => {
        if (!partnerPrincipalId || !user?.principalId) {
            return;
        }
        setIsLoadingMessages(true);
        setError(null);
        try {
            const fetchedMessages = await chatService.getMessages(partnerPrincipalId);
            const validMessages = fetchedMessages || [];
            setMessages(prev => ({
                ...prev,
                [partnerPrincipalId]: validMessages,
            }));
            setLoadedConversations(prev => {
                if (prev.has(partnerPrincipalId)) {
                    return prev;
                }
                const newSet = new Set(prev);
                newSet.add(partnerPrincipalId);
                return newSet;
            });
            console.log(`Messages fetched and marked as loaded for ${partnerPrincipalId}`);
        } catch (err) {
            console.error(`Error fetching messages for ${partnerPrincipalId}:`, err);
            setError(`Failed to load messages for partner ${partnerPrincipalId}.`);
            setMessages(prev => ({...prev, [partnerPrincipalId]: []}));
            setLoadedConversations(prev => {
                if (prev.has(partnerPrincipalId)) {
                    return prev;
                }
                const newSet = new Set(prev);
                newSet.add(partnerPrincipalId);
                return newSet;
            });
        } finally {
            setIsLoadingMessages(false);
        }
    }, [user]);

    const readMessages = useCallback(async (partnerPrincipalId) => {
        if (!partnerPrincipalId || !user?.principalId) {
            console.warn(`[ChatProvider] readMessages: Called without partnerPrincipalId (${partnerPrincipalId}) or user (${user?.principalId}).`);
            return;
        }

        // Find the partner and check their current unread count *before* any updates
        const partnerIndex = conversationPartners.findIndex(p => p.partnerPrincipalId === partnerPrincipalId);
        if (partnerIndex === -1) {
            console.warn(`[ChatProvider] readMessages: Partner ${partnerPrincipalId} not found in state.`);
            return; // Partner doesn't exist in our list
        }
        const partnerToUpdate = conversationPartners[partnerIndex];
        const unreadCountForThisPartner = partnerToUpdate.unreadCount || 0;

        // Only proceed if there were actually unread messages for this partner
        if (unreadCountForThisPartner <= 0) {
            console.log(`[ChatProvider] readMessages: No unread messages for partner ${partnerPrincipalId}, skipping update.`);
            // Ensure local state is 0 if it wasn't already (e.g., if backend updated first)
            if (partnerToUpdate.unreadCount !== 0) {
                setConversationPartners(prevPartners =>
                    prevPartners.map(p =>
                        p.partnerPrincipalId === partnerPrincipalId ? {...p, unreadCount: 0} : p
                    )
                );
            }
            return;
        }

        // **Optimistic UI Update for Partner List ONLY**
        const originalPartners = [...conversationPartners]; // Keep for potential revert

        // Create the next state for partners *before* setting it
        const nextPartnersState = originalPartners.map(partner =>
            partner.partnerPrincipalId === partnerPrincipalId ? {...partner, unreadCount: 0} : partner
        );

        // Update the partner list state
        setConversationPartners(nextPartnersState);
        console.log(`[ChatProvider] readMessages: Optimistically set partner ${partnerPrincipalId}'s unreadCount to 0.`);

        // **API Call**
        try {
            const success = await chatService.markMessagesAsRead(partnerPrincipalId);
            if (success) {
                console.log(`[ChatProvider] readMessages: API call successful for partner ${partnerPrincipalId}.`);

                // --- Recalculate Total Unread AFTER successful API call ---
                const newTotalUnread = nextPartnersState.reduce((acc, partner) => {
                    // console.log(`[ChatProvider] Recalculating: Partner ${partner.partnerPrincipalId}, Unread: ${partner.unreadCount || 0}`); // Optional detailed log
                    return acc + (partner.unreadCount || 0);
                }, 0);

                console.log(`[ChatProvider] readMessages: Recalculated total unread based on updated partners list. New Total: ${newTotalUnread}`);
                setTotalUnreadMessages(newTotalUnread); // Set the recalculated total

            } else {
                // API call failed, but didn't throw an error (e.g., returned { success: false })
                throw new Error(`API failed to mark messages as read for partner ${partnerPrincipalId}.`);
            }
        } catch (err) {
            // API call failed (threw an error or we threw one above)
            console.error(`[ChatProvider] readMessages: API Error for partner ${partnerPrincipalId}:`, err);
            setError("Failed to update read status on the server.");

            // **Revert Optimistic Partner Update**
            console.log(`[ChatProvider] readMessages: Reverting optimistic partner update for partner ${partnerPrincipalId}.`);
            setConversationPartners(originalPartners);
        }
    }, [conversationPartners, user]);

    const addMessage = useCallback((newMessage) => {
        if (!newMessage?.messageId || !newMessage?.senderProfile?.principalId || !newMessage?.recipientProfile?.principalId || !user?.principalId) {
            console.warn("[ChatProvider] addMessage: Attempted to add invalid message or user not logged in:", newMessage);
            return;
        }

        const isSender = newMessage.senderProfile.principalId === user.principalId;
        const otherPrincipalId = isSender ? newMessage.recipientProfile.principalId : newMessage.senderProfile.principalId;
        const otherUserProfile = isSender ? newMessage.recipientProfile : newMessage.senderProfile;

        console.log("[ChatProvider] addMessage: Processing message for conversation with user ID:", otherPrincipalId);

        if (!otherPrincipalId) {
            console.warn("[ChatProvider] Could not determine other user ID for incoming message", newMessage);
            return;
        }

        // *** ALWAYS Update the messages state FIRST ***
        setMessages(prev => {
            const existing = prev[otherPrincipalId] || [];
            if (existing.some(msg => msg.messageId === newMessage.messageId)) {
                console.log(`[ChatProvider] Message ${newMessage.messageId} already exists for ${otherPrincipalId}, skipping add.`);
                return prev;
            }
            const updated = [...existing, newMessage].sort(
                (a, b) => new Date(a.messageCreatedAt).getTime() - new Date(b.messageCreatedAt).getTime()
            );
            console.log(`[ChatProvider] Added message ${newMessage.messageId} to conversation ${otherPrincipalId}'s message list.`);
            return {...prev, [otherPrincipalId]: updated};
        });

        // --- Determine if total unread count needs incrementing based on CURRENT state ---
        let shouldIncrementTotalUnread = false;
        if (otherPrincipalId !== activePartnerId && !isSender) {
            shouldIncrementTotalUnread = true; // Increment if incoming and chat is not active
        }
        console.log(`[ChatProvider] Should increment total unread? ${shouldIncrementTotalUnread}`);

        // Update conversation partner list (move/update or add)
        setConversationPartners(prevPartners => {
            let partnerExists = false;
            const updatedPartners = prevPartners.map(p => {
                if (p.partnerPrincipalId === otherPrincipalId) {
                    partnerExists = true;
                    return {
                        ...p,
                        partnerDisplayName: `${otherUserProfile.displayName || 'Unknown User'}`,
                        firstName: otherUserProfile.firstName || 'Unknown',
                        lastName: otherUserProfile.lastName || 'User',
                        profileImageUrl: otherUserProfile.profileImageUrl || null,
                        lastMessageSnippet: newMessage.body.substring(0, 30) + (newMessage.body.length > 30 ? '...' : ''),
                        lastMessageTime: newMessage.messageCreatedAt,
                        lastMessageTimestamp: newMessage.messageCreatedAt,
                        unreadCount: (otherPrincipalId !== activePartnerId && !isSender) ? ((p.unreadCount || 0) + 1) : (p.unreadCount || 0),
                    };
                }
                return p;
            });

            if (!partnerExists) {
                console.log(`[ChatProvider] Partner ${otherPrincipalId} not found in list, adding new entry.`);
                const newPartner = {
                    partnerPrincipalId: otherPrincipalId,
                    partnerDisplayName: `${otherUserProfile.displayName || 'Unknown User'}`,
                    firstName: otherUserProfile.firstName || 'Unknown',
                    lastName: otherUserProfile.lastName || 'User',
                    profileImageUrl: otherUserProfile.profileImageUrl || null,
                    lastMessageSnippet: newMessage.body.substring(0, 30) + (newMessage.body.length > 30 ? '...' : ''),
                    lastMessageTime: newMessage.messageCreatedAt,
                    lastMessageTimestamp: newMessage.messageCreatedAt,
                    unreadCount: (otherPrincipalId !== activePartnerId && !isSender) ? 1 : 0,
                };
                updatedPartners.push(newPartner);
            }

            updatedPartners.sort((a, b) => {
                const timeA = a.lastMessageTimestamp || a.lastMessageTime || 0;
                const timeB = b.lastMessageTimestamp || b.lastMessageTime || 0;
                return new Date(timeB || 0).getTime() - new Date(timeA || 0).getTime();
            });

            return updatedPartners; // Return the calculated new state for partners
        });

        // --- Update total unread count OUTSIDE and AFTER the partner update ---
        if (shouldIncrementTotalUnread) {
            console.log(`[ChatProvider] Incrementing total unread count (outside partner update).`);
            // Check against the *previous* partner state to ensure we only increment if the count actually increased
            const oldPartnerState = conversationPartners.find(p => p.partnerPrincipalId === otherPrincipalId);
            const oldUnreadCount = oldPartnerState?.unreadCount || 0;
            const newUnreadCount = oldUnreadCount + 1; // Predicted new count

            if (newUnreadCount > oldUnreadCount) { // Only increment if it actually went up
                setTotalUnreadMessages(prev => prev + 1);
            } else {
                console.log(`[ChatProvider] Condition met, but partner's unread count didn't increase. Not incrementing total.`);
            }
        }

    }, [user, activePartnerId, conversationPartners]); // Added conversationPartners dependency


    const sendMessage = useCallback(async (recipientPrincipalId, body) => {
        if (!recipientPrincipalId || !body.trim() || !user?.principalId) {
            console.error("[ChatProvider] sendMessage: Missing recipient ID or message body.");
            setError("Cannot send message: Missing recipient or body.");
            return null;
        }
        setError(null);
        try {
            const sentMessage = await chatService.sendMessage(recipientPrincipalId, body);
            console.log("[ChatProvider] Message sent successfully via API:", sentMessage);
            if (sentMessage) {
                addMessage(sentMessage);
                return sentMessage;
            } else {
                console.error("[ChatProvider] sendMessage: API success but no message object returned.");
                setError("Message sent, but failed to update local state.");
                return null;
            }
        } catch (err) {
            console.error("[ChatProvider] Error sending message via API:", err);
            setError(err.message || "Failed to send message.");
            return null;
        }
    }, [addMessage, user]);

    const handleSetActivePartnerId = useCallback((partnerPrincipalId) => {
        console.log("[ChatProvider] Setting active partner ID:", partnerPrincipalId);
        setActivePartnerId(partnerPrincipalId);

        if (partnerPrincipalId) {
            const needsFetching = !loadedConversations.has(partnerPrincipalId) || !messages[partnerPrincipalId]?.length;
            if (needsFetching) {
                console.log(`[ChatProvider] Fetching messages for newly active partner: ${partnerPrincipalId}`);
                fetchMessages(partnerPrincipalId);
            } else {
                console.log(`[ChatProvider] Messages for ${partnerPrincipalId} already loaded or present.`);
            }

            const partner = conversationPartners.find(p => p.partnerPrincipalId === partnerPrincipalId);
            if (partner && (partner.unreadCount || 0) > 0) {
                console.log(`[ChatProvider] Marking messages as read for active partner: ${partnerPrincipalId}`);
                readMessages(partnerPrincipalId);
            } else {
                console.log(`[ChatProvider] No unread messages to mark for ${partnerPrincipalId}, or partner not found.`);
                if (partner) {
                    setConversationPartners(prevPartners => prevPartners.map(p =>
                        p.partnerPrincipalId === partnerPrincipalId ? {...p, unreadCount: 0} : p
                    ));
                }
            }
        }
    }, [fetchMessages, readMessages, messages, conversationPartners, loadedConversations]);

    const clearChatState = useCallback(() => {
        setConversationPartners([]);
        setMessages({});
        setLoadedConversations(new Set());
        setActivePartnerId(null);
        setTotalUnreadMessages(0);
        setIsLoadingConversations(true);
        setIsLoadingMessages(false);
        setError(null);
        console.log("[ChatProvider] Chat state cleared.");
    }, []);

    useEffect(() => {
        if (user?.principalId) {
            console.log("[ChatProvider] User detected, fetching initial conversations.");
            fetchConversations();
        } else {
            console.log("[ChatProvider] User logged out or not present, clearing chat state.");
            clearChatState();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.principalId]); // Depend ONLY on principalId

    const value = useMemo(() => ({
        conversationPartners,
        messages,
        activePartnerId,
        totalUnreadMessages,
        isLoadingConversations,
        isLoadingMessages,
        error,
        fetchConversations,
        fetchMessages,
        addMessage,
        sendMessage,
        readMessages,
        setActivePartnerId: handleSetActivePartnerId,
        clearChatState,
        loadedConversations,
    }), [
        conversationPartners, messages, activePartnerId, totalUnreadMessages, isLoadingConversations,
        isLoadingMessages, error, fetchConversations, fetchMessages,
        addMessage, sendMessage, readMessages, handleSetActivePartnerId, clearChatState, loadedConversations
    ]);

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

export default ChatProvider;