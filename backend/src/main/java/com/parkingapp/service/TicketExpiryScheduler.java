package com.parkingapp.service;

import com.parkingapp.domain.Ticket;
import com.parkingapp.domain.enums.ParkingSlotStatus;
import com.parkingapp.domain.enums.TicketStatus;
import com.parkingapp.repository.ParkingSlotRepository;
import com.parkingapp.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class TicketExpiryScheduler {

    private final TicketRepository ticketRepository;
    private final ParkingSlotRepository parkingSlotRepository;

    @Scheduled(fixedRate = 60000) // every 60 seconds
    @Transactional
    public void expireTickets() {
        List<Ticket> expired = ticketRepository.findAllByStatusAndEndTimeBefore(
                TicketStatus.ACTIVE, LocalDateTime.now());

        for (Ticket ticket : expired) {
            ticket.setStatus(TicketStatus.COMPLETED);
            ticketRepository.save(ticket);

            var slot = ticket.getParkingSlot();
            slot.setStatus(ParkingSlotStatus.AVAILABLE);
            parkingSlotRepository.save(slot);

            log.info("Auto-expired ticket {} and freed slot {}", ticket.getId(), slot.getSlotIdentifier());
        }
    }
}
