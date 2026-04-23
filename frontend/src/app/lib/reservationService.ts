import api from './api';

export interface ReservationResponse {
  id: string;
  parkingAreaId: string;
  parkingAreaName: string;
  parkingAreaAddress: string;
  vehicleId: string;
  vehicleLicensePlate: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  hourlyRate: number;
  createdAt: string;
}

export interface CreateReservationRequest {
  parkingAreaId: string;
  vehicleId: string;
  scheduledStart: string;
  scheduledEnd: string;
}

export async function getUserReservations(userId: string): Promise<ReservationResponse[]> {
  const res = await api.get<ReservationResponse[]>(`/reservations/user/${userId}`);
  return res.data;
}

export async function createReservation(data: CreateReservationRequest): Promise<ReservationResponse> {
  const res = await api.post<ReservationResponse>('/reservations', data);
  return res.data;
}

export async function cancelReservation(id: string): Promise<void> {
  await api.delete(`/reservations/${id}`);
}

export async function convertReservation(id: string): Promise<any> {
  const res = await api.post(`/reservations/${id}/convert`);
  return res.data;
}
