import api from './api';

export interface TicketResponse {
  id: string;
  parkingAreaId: string;
  parkingAreaName: string;
  parkingAreaAddress: string;
  vehicleId: string;
  vehicleLicensePlate: string;
  slotIdentifier: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: string;
  totalCost: number;
  hourlyRate: number;
}

export interface PaymentResponse {
  id: string;
  ticketId: string;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionId: string;
  createdAt: string;
}

export interface BuyTicketRequest {
  parkingAreaId: string;
  vehicleId: string;
  durationMinutes: number;
  paymentMethod: string;
}

export async function buyTicket(data: BuyTicketRequest): Promise<TicketResponse> {
  const res = await api.post<TicketResponse>('/tickets', data);
  return res.data;
}

export async function getUserTickets(userId: string): Promise<TicketResponse[]> {
  const res = await api.get<TicketResponse[]>(`/tickets/user/${userId}`);
  return res.data;
}

export async function getActiveTickets(userId: string): Promise<TicketResponse[]> {
  const res = await api.get<TicketResponse[]>(`/tickets/user/${userId}/active`);
  return res.data;
}

export async function endTicket(ticketId: string): Promise<TicketResponse> {
  const res = await api.put<TicketResponse>(`/tickets/${ticketId}/end`);
  return res.data;
}

export async function extendTicket(ticketId: string, additionalMinutes: number): Promise<TicketResponse> {
  const res = await api.put<TicketResponse>(`/tickets/${ticketId}/extend`, { additionalMinutes });
  return res.data;
}

export async function getUserPayments(userId: string): Promise<PaymentResponse[]> {
  const res = await api.get<PaymentResponse[]>(`/tickets/payments/user/${userId}`);
  return res.data;
}
