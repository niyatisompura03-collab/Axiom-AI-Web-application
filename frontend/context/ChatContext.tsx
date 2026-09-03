"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "@/context/AuthContext";

import {
  sendMessage as sendChatMessage,
  createNewConversation,
  getUserConversations,
  getConversation as fetchConversationApi,
  renameConversationApi,
  deleteConversationApi,
  editMessageApi,
} from "@/lib/api";

export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  document?: {
    document_id: string;
    filename: string;
    mime_type?: string;
    type?: string;
    content?: string; // base64 for images
  };
};

export type ConversationSummary = {
  conversation_id: string;
  title: string;
  updated_at: string;
  last_message: string;
};

interface ChatContextType {
  conversationId: string | null;
  messages: Message[];
  recentConversations: ConversationSummary[];
  selectedConversation: ConversationSummary | null;

  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isRestoring: boolean;

  createConversation: (title?: string) => Promise<string | null>;
  loadConversation: (convId: string) => Promise<void>;
  deleteConversation: (convId: string) => Promise<void>;
  renameConversation: (convId: string, title: string) => Promise<void>;
  refreshConversationList: () => Promise<void>;

  sendMessage: (customMessage?: string) => Promise<void>;
  regenerateResponse: () => Promise<void>;
  startNewChat: () => Promise<void>;
  editMessage: (index: number, newContent: string) => Promise<void>;

  activeDocument: { document_id: string; filename: string; content?: string } | null;
  setActiveDocument: React.Dispatch<React.SetStateAction<{ document_id: string; filename: string; content?: string } | null>>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recentConversations, setRecentConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);

  const [input, setInput] = useState("");
  const [isRestoring, setIsRestoring] = useState(true);
  const [activeDocument, setActiveDocument] = useState<{ document_id: string; filename: string } | null>(null);
  const { loading: authLoading, isAuthenticated, user } = useAuth();
  const refreshConversationList = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const list = await getUserConversations();
      if (Array.isArray(list)) {
        setRecentConversations(list);
      } else {
        setRecentConversations([]);
      }
    } catch (e) {
      console.error("Failed to refresh conversation list:", e);
    }
  }, [isAuthenticated]);

  const loadConversation = useCallback(async (convId: string) => {
    try {
      const data = await fetchConversationApi(convId);
      if (data) {
        setConversationId(data._id || data.conversation_id || convId);
        setMessages(data.messages || []);
        const summary: ConversationSummary = {
          conversation_id: data._id || data.conversation_id || convId,
          title: data.title || "New Chat",
          updated_at: data.updated_at || new Date().toISOString(),
          last_message: data.last_message || "",
        };
        setSelectedConversation(summary);
      }
    } catch (e) {
      console.error("Failed to load conversation:", e);
    }
  }, []);

  const createConversation = useCallback(
    async (title: string = "New Chat") => {
      if (!isAuthenticated) return null;
      try {
        const result = await createNewConversation(title);
        if (result && result.conversation_id) {
          const newId = result.conversation_id;
          setConversationId(newId);
          setMessages([]);
          const summary: ConversationSummary = {
            conversation_id: newId,
            title: result.title || title,
            updated_at: result.updated_at || new Date().toISOString(),
            last_message: "",
          };
          setSelectedConversation(summary);
          await refreshConversationList();
          return newId;
        }
      } catch (e) {
        console.error("Failed to create conversation:", e);
      }
      return null;
    },
    [refreshConversationList, isAuthenticated]
  );

  const deleteConversation = useCallback(
    async (convId: string) => {
      if (!isAuthenticated) return;
      try {
        await deleteConversationApi(convId);
        
        // Remove from recent conversations immediately
        setRecentConversations((prev) => prev.filter((c) => c.conversation_id !== convId));
        
        // Reset current conversation if it's the deleted one
        if (conversationId === convId) {
          setConversationId(null);
          setMessages([]);
          setSelectedConversation(null);
        }
      } catch (e) {
        console.error("Failed to delete conversation:", e);
      }
    },
    [conversationId, isAuthenticated]
  );

  const renameConversation = useCallback(
    async (convId: string, title: string) => {
      if (!isAuthenticated) return;
      try {
        await renameConversationApi(convId, title);
        
        // Update in recent conversations immediately
        setRecentConversations((prev) =>
          prev.map((c) => (c.conversation_id === convId ? { ...c, title } : c))
        );
        
        // Update selected conversation if it's the active one
        if (selectedConversation && selectedConversation.conversation_id === convId) {
          setSelectedConversation((prev) => (prev ? { ...prev, title } : null));
        }
      } catch (e) {
        console.error("Failed to rename conversation:", e);
      }
    },
    [selectedConversation, isAuthenticated]
  );


  const startNewChat = useCallback(async () => {
    setInput("");
    setConversationId(null);
    setMessages([]);
    setSelectedConversation(null);
    setActiveDocument(null);
  }, []);

  // Initial load respecting auth state
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setConversationId(null);
      setMessages([]);
      setRecentConversations([]);
      setSelectedConversation(null);
      setIsRestoring(false);
      return;
    }
    async function init() {
      try {
        const list = await getUserConversations();
        if (Array.isArray(list) && list.length > 0) {
          setRecentConversations(list);
          const first = list[0];
          await loadConversation(first.conversation_id);
        } else {
          setConversationId(null);
          setMessages([]);
          setRecentConversations([]);
          setSelectedConversation(null);
        }
      } catch (e) {
        console.error("Failed to initialize conversations:", e);
      } finally {
        setIsRestoring(false);
      }
    }
    init();
  }, [authLoading, isAuthenticated, loadConversation, createConversation, user?.username]);

  async function sendMessage(customMessage?: string) {
    if (!isAuthenticated) return;
    
    // Protect against accidentally passed event objects (e.g. from onClick)
    const validCustomMessage = typeof customMessage === "string" ? customMessage : undefined;
    const textToSend = validCustomMessage || input;
    
    // Always require the user to type a message — the document alone is not enough
    if (!textToSend.trim()) return;

    if (!validCustomMessage) {
      setInput("");
    }

    setMessages((prev) => [
      ...prev,
      { 
        role: "user", 
        content: textToSend,
        document: activeDocument ? {
          document_id: activeDocument.document_id,
          filename: activeDocument.filename,
          type: activeDocument.filename.match(/\.(png|jpe?g|webp)$/i) ? 'image' : 'text',
          mime_type: activeDocument.filename.match(/\.(png|jpe?g|webp)$/i) ? 'image/' + activeDocument.filename.split('.').pop() : undefined
        } : undefined
      },
      {
        role: "assistant",
        content: "Thinking...",
      },
    ]);
    
    const currentActiveDocId = activeDocument?.document_id;
    setActiveDocument(null); // Clear from composer immediately

    try {
      const response = await sendChatMessage(
        conversationId,
        textToSend,
        currentActiveDocId
      );

      const activeConvId = response?.conversation_id || conversationId;

      if (activeConvId && !conversationId) {
        setConversationId(activeConvId);
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: response.response,
        };
        return updated;
      });

      // Synchronize recent conversations state (last_message, updated_at, title, re-ordering)
      setRecentConversations((prevList) => {
        const nowIso = new Date().toISOString();
        const existingIndex = prevList.findIndex(
          (c) => c.conversation_id === activeConvId
        );

        let updatedList = [...prevList];

        if (existingIndex !== -1) {
          const item = updatedList[existingIndex];
          const newTitle = response.title || item.title || "New Chat";
          const updatedItem = {
            ...item,
            title: newTitle,
            last_message: response.response,
            updated_at: nowIso,
          };
          updatedList.splice(existingIndex, 1);
          updatedList.unshift(updatedItem);
        } else if (activeConvId) {
          updatedList.unshift({
            conversation_id: activeConvId,
            title: response.title || "New Chat",
            last_message: response.response,
            updated_at: nowIso,
          });
        }

        return updatedList;
      });

      // Synchronize selected conversation state
      if (activeConvId) {
        setSelectedConversation((prev) => ({
          conversation_id: activeConvId,
          title: response.title || prev?.title || "New Chat",
          updated_at: new Date().toISOString(),
          last_message: response.response,
        }));
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong.",
        };
        return updated;
      });
    }
  }


  async function regenerateResponse() {
    if (messages.length < 2) return;

    const lastUserMessageIndex = [...messages]
      .reverse()
      .findIndex((m) => m.role === "user");
    if (lastUserMessageIndex === -1) return;

    const actualIndex = messages.length - 1 - lastUserMessageIndex;
    const lastUserMessage = messages[actualIndex].content;

    setMessages((prev) => prev.slice(0, actualIndex));

    await sendMessage(lastUserMessage);
  }

  async function editMessage(index: number, newContent: string) {
    if (!isAuthenticated || !conversationId) return;

    const trimmedContent = newContent.trim();
    if (!trimmedContent) return;

    // Truncate messages in UI up to edited index, update content, and add thinking indicator
    setMessages((prev) => {
      const sliced = prev.slice(0, index);
      return [
        ...sliced,
        {
          role: "user",
          content: trimmedContent,
        },
        {
          role: "assistant",
          content: "Thinking...",
        },
      ];
    });

    try {
      const response = await editMessageApi(conversationId, index, trimmedContent);

      const activeConvId = response?.conversation_id || conversationId;

      setMessages((prev) => {
        if (response?.messages && Array.isArray(response.messages) && response.messages.length > 0) {
          return response.messages;
        }
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            role: "assistant",
            content: response.response,
          };
        }
        return updated;
      });

      // Synchronize recent conversations state (last_message, updated_at, title)
      setRecentConversations((prevList) => {
        const nowIso = new Date().toISOString();
        const existingIndex = prevList.findIndex(
          (c) => c.conversation_id === activeConvId
        );

        let updatedList = [...prevList];

        if (existingIndex !== -1) {
          const item = updatedList[existingIndex];
          const newTitle = response.title || item.title || "New Chat";
          const updatedItem = {
            ...item,
            title: newTitle,
            last_message: response.response,
            updated_at: nowIso,
          };
          updatedList.splice(existingIndex, 1);
          updatedList.unshift(updatedItem);
        } else if (activeConvId) {
          updatedList.unshift({
            conversation_id: activeConvId,
            title: response.title || "New Chat",
            last_message: response.response,
            updated_at: nowIso,
          });
        }

        return updatedList;
      });

      // Synchronize selected conversation state
      if (activeConvId) {
        setSelectedConversation((prev) => ({
          conversation_id: activeConvId,
          title: response.title || prev?.title || "New Chat",
          updated_at: new Date().toISOString(),
          last_message: response.response,
        }));
      }
    } catch (e) {
      console.error("Failed to edit message:", e);
      // If it fails, reload the conversation to get the original messages
      await loadConversation(conversationId);
      throw e;
    }
  }

  return (
    <ChatContext.Provider
      value={{
        conversationId,
        messages,
        recentConversations,
        selectedConversation,
        input,
        setInput,
        isRestoring,
        createConversation,
        loadConversation,
        deleteConversation,
        renameConversation,
        refreshConversationList,
        sendMessage,
        regenerateResponse,
        startNewChat,
        editMessage,
        activeDocument,
        setActiveDocument,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used inside ChatProvider");
  }
  return context;
}