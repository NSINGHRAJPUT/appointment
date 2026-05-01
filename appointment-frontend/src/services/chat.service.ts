import { apiFetch } from '@/lib/api';

export const chatService = {
  listConversations: (token: string) =>
    apiFetch('/chat/conversations', undefined, token),

  listMessages: (token: string, conversationId: string) =>
    apiFetch(`/chat/${conversationId}/messages`, undefined, token),

  sendMessage: (token: string, conversationId: string, body: string) =>
    apiFetch(`/chat/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }, token),
};
