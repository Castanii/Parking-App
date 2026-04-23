package com.parkingapp.service;

import com.parkingapp.domain.*;
import com.parkingapp.domain.enums.*;
import com.parkingapp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ParkingAreaRepository parkingAreaRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final TicketRepository ticketRepository;
    private final PaymentRepository paymentRepository;

    @Transactional
    public ReservationResponse createReservation(CreateReservationRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (!vehicle.getUser().getId().equals(userId)) {
            throw new IllegalStateException("You can only use your own vehicles.");
        }

        ParkingArea area = parkingAreaRepository.findById(request.parkingAreaId())
                .orElseThrow(() -> new RuntimeException("Parking area not found"));

        if (request.scheduledStart().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Scheduled start must be in the future.");
        }
        if (request.scheduledEnd().isBefore(request.scheduledStart())) {
            throw new IllegalArgumentException("End time must be after start time.");
        }

        Reservation reservation = new Reservation();
        reservation.setUser(user);
        reservation.setVehicle(vehicle);
        reservation.setParkingArea(area);
        reservation.setScheduledStart(request.scheduledStart());
        reservation.setScheduledEnd(request.scheduledEnd());
        reservation.setStatus(ReservationStatus.CONFIRMED);

        return mapToResponse(reservationRepository.save(reservation));
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getUserReservations(UUID userId) {
        return reservationRepository.findAllByUserIdOrderByScheduledStartDesc(userId)
                .stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public void cancelReservation(UUID reservationId, UUID userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        if (!reservation.getUser().getId().equals(userId)) {
            throw new IllegalStateException("You can only cancel your own reservations.");
        }

        if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new IllegalStateException("Only confirmed reservations can be cancelled.");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservationRepository.save(reservation);
    }

    @Transactional
    public TicketService.TicketResponse convertToTicket(UUID reservationId, UUID userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        if (!reservation.getUser().getId().equals(userId)) {
            throw new IllegalStateException("You can only convert your own reservations.");
        }

        if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new IllegalStateException("Only confirmed reservations can be converted.");
        }

        ParkingArea area = reservation.getParkingArea();

        // Find available slot
        List<ParkingSlot> availableSlots = parkingSlotRepository
                .findAllByParkingAreaIdAndStatus(area.getId(), ParkingSlotStatus.AVAILABLE);

        if (availableSlots.isEmpty()) {
            throw new IllegalStateException("No available parking slots in this area.");
        }

        Vehicle vehicle = reservation.getVehicle();
        ParkingSlot slot = availableSlots.stream()
                .filter(s -> vehicle.isElectric() && s.isHasEvCharging())
                .findFirst()
                .orElse(availableSlots.get(0));

        slot.setStatus(ParkingSlotStatus.OCCUPIED);
        parkingSlotRepository.save(slot);

        // Calculate duration and cost
        long durationMinutes = Duration.between(LocalDateTime.now(), reservation.getScheduledEnd()).toMinutes();
        if (durationMinutes < 30) durationMinutes = 30; // minimum 30 min

        BigDecimal hours = BigDecimal.valueOf(durationMinutes).divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);
        BigDecimal totalCost = hours.multiply(BigDecimal.valueOf(area.getHourlyRate())).setScale(2, RoundingMode.HALF_UP);

        LocalDateTime now = LocalDateTime.now();
        Ticket ticket = new Ticket();
        ticket.setUser(reservation.getUser());
        ticket.setVehicle(vehicle);
        ticket.setParkingSlot(slot);
        ticket.setParkingArea(area);
        ticket.setStartTime(now);
        ticket.setEndTime(now.plusMinutes(durationMinutes));
        ticket.setDurationMinutes((int) durationMinutes);
        ticket.setStatus(TicketStatus.ACTIVE);
        ticket.setTotalCost(totalCost);
        ticket = ticketRepository.save(ticket);

        // Create payment
        Payment payment = new Payment();
        payment.setTicket(ticket);
        payment.setUser(reservation.getUser());
        payment.setAmount(totalCost);
        payment.setPaymentMethod(PaymentMethod.CARD);
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setTransactionId(UUID.randomUUID().toString());
        paymentRepository.save(payment);

        // Mark reservation as converted
        reservation.setStatus(ReservationStatus.CONVERTED);
        reservationRepository.save(reservation);

        return new TicketService.TicketResponse(
                ticket.getId(),
                area.getId(),
                area.getName(),
                area.getAddress(),
                vehicle.getId(),
                vehicle.getLicensePlate(),
                slot.getSlotIdentifier(),
                ticket.getStartTime(),
                ticket.getEndTime(),
                ticket.getDurationMinutes(),
                ticket.getStatus().name(),
                ticket.getTotalCost(),
                area.getHourlyRate()
        );
    }

    private ReservationResponse mapToResponse(Reservation r) {
        return new ReservationResponse(
                r.getId(),
                r.getParkingArea().getId(),
                r.getParkingArea().getName(),
                r.getParkingArea().getAddress(),
                r.getVehicle().getId(),
                r.getVehicle().getLicensePlate(),
                r.getScheduledStart(),
                r.getScheduledEnd(),
                r.getStatus().name(),
                r.getParkingArea().getHourlyRate(),
                r.getCreatedAt()
        );
    }

    public record CreateReservationRequest(UUID parkingAreaId, UUID vehicleId, LocalDateTime scheduledStart, LocalDateTime scheduledEnd) {}

    public record ReservationResponse(
            UUID id,
            UUID parkingAreaId,
            String parkingAreaName,
            String parkingAreaAddress,
            UUID vehicleId,
            String vehicleLicensePlate,
            LocalDateTime scheduledStart,
            LocalDateTime scheduledEnd,
            String status,
            Double hourlyRate,
            LocalDateTime createdAt
    ) {}
}
