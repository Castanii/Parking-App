import api from './api';

export interface UserResponse {
  id: string;
  email: string;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export async function register(email: string, password: string): Promise<UserResponse> {
  const res = await api.post<UserResponse>('/users/register', { email, password });
  return res.data;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/users/login', { email, password });
  return res.data;
}

export async function getMe(): Promise<UserResponse> {
  const res = await api.get<UserResponse>('/users/me');
  return res.data;
}
