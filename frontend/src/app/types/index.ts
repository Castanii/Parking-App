export interface ParkingLot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  available: number;
  total: number;
  pricePerHour: number;
  status: 'available' | 'full' | 'reserved';
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
}

export interface ParkingTicket {
  id: string;
  lotId: string;
  lotName: string;
  lotAddress: string;
  carId: string;
  carInfo: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  pricePerHour: number;
  totalPrice: number;
  status: 'active' | 'completed';
  paymentMethod: string;
}

export interface Message {
  id: string;
  from: string;
  subject: string;
  message: string;
  timestamp: Date;
  read: boolean;
}