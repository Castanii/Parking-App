import api from './api';

export interface VehicleResponse {
  id: string;
  licensePlate: string;
  vehicleCategory: string;
  electric: boolean;
}

export interface VehicleRequest {
  licensePlate: string;
  vehicleCategory: string;
  isElectric: boolean;
}

export async function getVehicles(userId: string): Promise<VehicleResponse[]> {
  const res = await api.get<VehicleResponse[]>(`/vehicles/user/${userId}`);
  return res.data;
}

export async function addVehicle(userId: string, data: VehicleRequest): Promise<VehicleResponse> {
  const res = await api.post<VehicleResponse>(`/vehicles/user/${userId}`, data);
  return res.data;
}

export async function updateVehicle(id: string, userId: string, data: VehicleRequest): Promise<VehicleResponse> {
  const res = await api.put<VehicleResponse>(`/vehicles/${id}?userId=${userId}`, data);
  return res.data;
}

export async function deleteVehicle(id: string, userId: string): Promise<void> {
  await api.delete(`/vehicles/${id}?userId=${userId}`);
}
