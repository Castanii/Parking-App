import api from './api';

export interface ParkingAreaResponse {
  id: string;
  name: string;
  address: string;
  capacity: number;
  hourlyRate: number;
  latitude: number;
  longitude: number;
}

export interface SlotResponse {
  id: string;
  slotIdentifier: string;
  status: string;
  sizeCategory: string;
  hasEvCharging: boolean;
}

export async function getAllParkingAreas(): Promise<ParkingAreaResponse[]> {
  const res = await api.get<ParkingAreaResponse[]>('/parking-areas');
  return res.data;
}

export async function getParkingArea(id: string): Promise<ParkingAreaResponse> {
  const res = await api.get<ParkingAreaResponse>(`/parking-areas/${id}`);
  return res.data;
}

export async function getNearbyAreas(lat: number, lon: number, radius: number): Promise<ParkingAreaResponse[]> {
  const res = await api.get<ParkingAreaResponse[]>('/parking-areas/nearby', {
    params: { lat, lon, radius },
  });
  return res.data;
}

export async function getAvailableSlots(areaId: string, size?: string): Promise<SlotResponse[]> {
  const res = await api.get<SlotResponse[]>(`/parking-areas/${areaId}/available-slots`, {
    params: size ? { size } : {},
  });
  return res.data;
}

export async function getAllSlots(areaId: string): Promise<SlotResponse[]> {
  const res = await api.get<SlotResponse[]>(`/parking-areas/${areaId}/slots`);
  return res.data;
}
