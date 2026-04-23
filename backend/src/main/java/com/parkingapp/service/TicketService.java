package com.parkingapp.service;

import com.parkingapp.domain.*;
import com.parkingapp.domain.enums.*;
import com.parkingapp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final PaymentRepository paymentRepository;
    private final ParkingAreaRepository parkingAreaRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;

    @Transactional
    public TicketResponse buyTicket(BuyTicketRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (!vehicle.getUser().getId().equals(userId)) {
            throw new IllegalStateException("You can only use your own vehicles.");
        }

        ParkingArea area = parkingAreaRepository.findById(request.parkingAreaId())
                .orElseThrow(() -> new RuntimeException("Parking area not found"));

        // Find an available slot — prefer EV charging for electric vehicles
        List<ParkingSlot> availableSlots = parkingSlotRepository
                .findAllByParkingAreaIdAndStatus(area.getId(), ParkingSlotStatus.AVAILABLE);

        if (availableSlots.isEmpty()) {
            throw new IllegalStateException("No available parking slots in this area.");
        }

        // Pick slot: prefer EV charging if vehicle is electric, otherwise pick first available
        ParkingSlot slot = availableSlots.stream()
                .filter(s -> vehicle.isElectric() && s.isHasEvCharging())
                .findFirst()
                .orElse(availableSlots.get(0));

        // Mark slot as occupied
        slot.setStatus(ParkingSlotStatus.OCCUPIED);
        parkingSlotRepository.save(slot);

        // Calculate cost
        BigDecimal hours = BigDecimal.valueOf(request.durationMinutes()).divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);
        BigDecimal totalCost = hours.multiply(BigDecimal.valueOf(area.getHourlyRate())).setScale(2, RoundingMode.HALF_UP);

        // Create ticket
        LocalDateTime now = LocalDateTime.now();
        Ticket ticket = new Ticket();
        ticket.setUser(user);
        ticket.setVehicle(vehicle);
        ticket.setParkingSlot(slot);
        ticket.setParkingArea(area);
        ticket.setStartTime(now);
        ticket.setEndTime(now.plusMinutes(request.durationMinutes()));
        ticket.setDurationMinutes(request.durationMinutes());
        ticket.setStatus(TicketStatus.ACTIVE);
        ticket.setTotalCost(totalCost);
        ticket = ticketRepository.save(ticket);

        // Create payment
        Payment payment = new Payment();
        payment.setTicket(ticket);
        payment.setUser(user);
        payment.setAmount(totalCost);
        payment.setPaymentMethod(PaymentMethod.valueOf(request.paymentMethod()));
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setTransactionId(UUID.randomUUID().toString());
        paymentRepository.save(payment);

        return mapToResponse(ticket);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getUserTickets(UUID userId) {
        return ticketRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getActiveTickets(UUID userId) {
        return ticketRepository.findAllByUserIdAndStatusOrderByCreatedAtDesc(userId, TicketStatus.ACTIVE)
                .stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public TicketResponse endTicket(UUID ticketId, UUID userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (!ticket.getUser().getId().equals(userId)) {
            throw new IllegalStateException("You can only end your own tickets.");
        }

        if (ticket.getStatus() != TicketStatus.ACTIVE) {
            throw new IllegalStateException("Ticket is not active.");
        }

        ticket.setStatus(TicketStatus.COMPLETED);
        ticket.setEndTime(LocalDateTime.now());

        // Free the slot
        ParkingSlot slot = ticket.getParkingSlot();
        slot.setStatus(ParkingSlotStatus.AVAILABLE);
        parkingSlotRepository.save(slot);

        return mapToResponse(ticketRepository.save(ticket));
    }

    @Transactional
    public TicketResponse extendTicket(UUID ticketId, UUID userId, ExtendRequest request) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (!ticket.getUser().getId().equals(userId)) {
            throw new IllegalStateException("You can only extend your own tickets.");
        }

        if (ticket.getStatus() != TicketStatus.ACTIVE) {
            throw new IllegalStateException("Ticket is not active.");
        }

        // Calculate extension cost
        ParkingArea area = ticket.getParkingArea();
        BigDecimal hours = BigDecimal.valueOf(request.additionalMinutes()).divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);
        BigDecimal extensionCost = hours.multiply(BigDecimal.valueOf(area.getHourlyRate())).setScale(2, RoundingMode.HALF_UP);

        // Update ticket
        ticket.setEndTime(ticket.getEndTime().plusMinutes(request.additionalMinutes()));
        ticket.setDurationMinutes(ticket.getDurationMinutes() + request.additionalMinutes());
        ticket.setTotalCost(ticket.getTotalCost().add(extensionCost));
        ticket = ticketRepository.save(ticket);

        // Carry forward the payment method from the most recent payment for this ticket
        PaymentMethod paymentMethod = paymentRepository.findTopByTicketIdOrderByCreatedAtDesc(ticket.getId())
                .map(Payment::getPaymentMethod)
                .orElse(PaymentMethod.CARD);

        // Create extension payment
        Payment payment = new Payment();
        payment.setTicket(ticket);
        payment.setUser(ticket.getUser());
        payment.setAmount(extensionCost);
        payment.setPaymentMethod(paymentMethod);
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setTransactionId(UUID.randomUUID().toString());
        paymentRepository.save(payment);

        return mapToResponse(ticket);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getUserPayments(UUID userId) {
        return paymentRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapPaymentToResponse).toList();
    }

    private TicketResponse mapToResponse(Ticket t) {
        return new TicketResponse(
                t.getId(),
                t.getParkingArea().getId(),
                t.getParkingArea().getName(),
                t.getParkingArea().getAddress(),
                t.getVehicle().getId(),
                t.getVehicle().getLicensePlate(),
                t.getParkingSlot().getSlotIdentifier(),
                t.getStartTime(),
                t.getEndTime(),
                t.getDurationMinutes(),
                t.getStatus().name(),
                t.getTotalCost(),
                t.getParkingArea().getHourlyRate()
        );
    }

    private PaymentResponse mapPaymentToResponse(Payment p) {
        return new PaymentResponse(
                p.getId(),
                p.getTicket().getId(),
                p.getAmount(),
                p.getPaymentMethod().name(),
                p.getStatus().name(),
                p.getTransactionId(),
                p.getCreatedAt()
        );
    }

    public record BuyTicketRequest(UUID parkingAreaId, UUID vehicleId, int durationMinutes, String paymentMethod) {}

    public record ExtendRequest(int additionalMinutes) {}

    public record TicketResponse(
            UUID id,
            UUID parkingAreaId,
            String parkingAreaName,
            String parkingAreaAddress,
            UUID vehicleId,
            String vehicleLicensePlate,
            String slotIdentifier,
            LocalDateTime startTime,
            LocalDateTime endTime,
            int durationMinutes,
            String status,
            BigDecimal totalCost,
            Double hourlyRate
    ) {}

    public record PaymentResponse(
            UUID id,
            UUID ticketId,
            BigDecimal amount,
            String paymentMethod,
            String status,
            String transactionId,
            LocalDateTime createdAt
    ) {}
}
