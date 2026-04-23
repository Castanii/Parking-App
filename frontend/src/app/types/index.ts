// Re-export types from service modules for convenience
export type { UserResponse } from '../lib/authService';
export type { VehicleResponse, VehicleRequest } from '../lib/vehicleService';
export type { ParkingAreaResponse, SlotResponse } from '../lib/parkingService';
export type { TicketResponse, PaymentResponse, BuyTicketRequest } from '../lib/ticketService';
export type { ReservationResponse, CreateReservationRequest } from '../lib/reservationService';
export type { MessageResponse, SendMessageRequest } from '../lib/messageService';
