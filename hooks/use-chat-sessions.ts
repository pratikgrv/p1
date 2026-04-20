import { useState, useEffect, useCallback, } from 'react';
import type { UIMessage } from 'ai';

export interface ChatSession {
  id: string;
  title: string;
  messages: UIMessage[];
  updatedAt: number;
}

export function useChatSessions(storageKey = 'ai-chat-sessions') {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatSession[];
        setSessions(parsed);
        if (parsed.length > 0) {
          // Default to most recently updated
          const recent = [...parsed].sort((a, b) => b.updatedAt - a.updatedAt);
          setCurrentSessionId(recent[0].id);
        } else {
          // Create initial if none
          createNewSession();
        }
      } else {
        createNewSession();
      }
    } catch (e) {
      console.error('Failed to parse chat sessions', e);
      createNewSession();
    }
    setIsLoaded(true);
  }, [storageKey]);

  // Sync to local storage whenever sessions change
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(storageKey, JSON.stringify(sessions));
  }, [sessions, storageKey, isLoaded]);

  const createNewSession = useCallback(() => {
    const newId = crypto.randomUUID();
    setSessions((prev) => [
      ...prev,
      {
        id: newId,
        title: 'New Chat',
        messages: [],
        updatedAt: Date.now(),
      },
    ]);
    setCurrentSessionId(newId);
    return newId;
  }, []);

  const clearSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setCurrentSessionId((prevId) => {
      if (prevId === id) {
        return null;
      }
      return prevId;
    });
  }, []);

  const updateSessionMessages = useCallback((id: string, messages: UIMessage[]) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          // simple title generation from first user message
          let newTitle = s.title;
          if (s.title === 'New Chat' && messages.length > 0) {
            const firstUserMessage = messages.find((m) => m.role === 'user');
            if (firstUserMessage) {
              const text =
                (firstUserMessage.parts?.find((p) => p.type === 'text') as any)?.text || 'Chat';
              newTitle = text.slice(0, 30) + (text.length > 30 ? '...' : '');
            }
          }
          return {
            ...s,
            messages,
            title: newTitle,
            updatedAt: Date.now(),
          };
        }
        return s;
      })
    );
  }, []);

  // Guarantee there's always an active session
  useEffect(() => {
    if (isLoaded && sessions.length > 0 && !currentSessionId) {
      const recent = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
      setCurrentSessionId(recent[0].id);
    } else if (isLoaded && sessions.length === 0) {
      createNewSession();
    }
  }, [sessions, currentSessionId, isLoaded, createNewSession]);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || null;

  return {
    sessions,
    currentSessionId,
    currentSession,
    isLoaded,
    setCurrentSessionId,
    createNewSession,
    clearSession,
    updateSessionMessages,
  };
}
