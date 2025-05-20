import {createContext} from 'react';

const ChatContext = createContext({
    conversationPartners: [], // Array<ConversationPartner>
    messages: {}, // { [otherUserId: string]: ChatMessageData[] }
    activePartnerId: null,
    totalUnreadMessages: 0,
    isLoadingConversations: true,
    isLoadingMessages: false,
    error: null, // string | null
    fetchConversations: async () => {
    },
    fetchMessages: async (partnerUserId) => {
    },
    addMessage: (message) => {
    }, // (message: ChatMessageData) => void
    sendMessage: async (recipientUserId, body) => null, // (recipientUserId: string, body: string) => Promise<ChatMessageData | null>
    readMessages: async (partnerUserId) => {
    }, // (partnerUserId: string) => void
    setActivePartnerId: (partnerUserId) => {
    }, // (partnerUserId: string | null) => void
    clearChatState: () => {
    },
});

export default ChatContext;