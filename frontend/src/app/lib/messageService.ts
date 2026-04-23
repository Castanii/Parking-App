import api from './api';

export interface MessageResponse {
  id: string;
  senderName: string;
  subject: string;
  body: string;
  threadId: string;
  read: boolean;
  fromSupport: boolean;
  createdAt: string;
}

export interface SendMessageRequest {
  subject: string;
  body: string;
  threadId?: string;
}

export async function getUserMessages(userId: string): Promise<MessageResponse[]> {
  const res = await api.get<MessageResponse[]>(`/messages/user/${userId}`);
  return res.data;
}

export async function getThread(threadId: string): Promise<MessageResponse[]> {
  const res = await api.get<MessageResponse[]>(`/messages/thread/${threadId}`);
  return res.data;
}

export async function sendMessage(data: SendMessageRequest): Promise<MessageResponse> {
  const res = await api.post<MessageResponse>('/messages', data);
  return res.data;
}

export async function markAsRead(messageId: string): Promise<void> {
  await api.put(`/messages/${messageId}/read`);
}
