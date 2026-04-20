import { useChat as useAiChat, type UseChatOptions } from '@ai-sdk/react';
import { useCallback, useEffect, useRef } from 'react';

// Wrap UseChatOptions to ensure we support UIMessage types natively.
export function useChat(options?: UseChatOptions<any>) {
  const chat = useAiChat({
    // We can set some reasonable defaults via options object if needed,
    ...options,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Automatically scroll to bottom when new messages arrive or status changes
  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, chat.status, scrollToBottom]);

  // A helper method to easily submit a message directly
  const submitMessage = useCallback(
    async (text: string) => {
      await chat.sendMessage({ text });
    },
    [chat]
  );

  return {
    ...chat,
    // Provide refs for UI convenience
    refs: {
      messagesEndRef,
      chatContainerRef,
    },
    // Provide helpers
    helpers: {
      scrollToBottom,
      submitMessage,
    },
  };
}
