package com.parkingapp.service;

import com.parkingapp.domain.*;
import com.parkingapp.domain.enums.TicketStatus;
import com.parkingapp.repository.ParkingSlotRepository;
import com.parkingapp.repository.TicketRepository;
import com.parkingapp.repository.UserRepository;
import com.parkingapp.repository.VehicleRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TicketService {
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final VehicleRepository  vehicleRepository;
    private final ParkingSlotRepository  parkingSlotRepository;
    public TicketService(TicketRepository ticketRepository,
                         UserRepository userRepository,VehicleRepository vehicleRepository,ParkingSlotRepository parkingSlotRepository)
    {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.parkingSlotRepository = parkingSlotRepository;
        this.ticketRepository = ticketRepository;
    }

    @Scheduled(fixedRate=300000)
    @Transactional
    public void checkTicketStatus(){
        /// Here we make a verification every 5 minutes to announce
        ///our Users that their Ticket are going to expire <6 minutes
        /// And also here we change the status of tickets that already expired
        List<Ticket> tickets = ticketRepository.findAll();
        /// Note for self: add method to findAll active !
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.plusMinutes(6);
        for(Ticket ticket : tickets){
            if(ticket.getStatus()== TicketStatus.ACTIVE){
                if (ticket.getEndTime().isBefore(threshold)) {
                ///To be added when we have User notification system
                    ///ticket.getUser().notify()
                }
                if (ticket.getEndTime().isBefore(now))
                {
                    ticket.setStatus(TicketStatus.EXPIRED);
                }
            }
        }
    }

    @Transactional
    public Ticket createTicket(UUID userId, UUID vehicleId, UUID parkingSlotId, int hours) {
        if (hours <= 0) {
            throw new IllegalArgumentException("Duration must be greater than 0 hours.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User-ul nu a fost găsit!"));

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Mașina nu a fost găsită!"));

        ParkingSlot slot = parkingSlotRepository.findById(parkingSlotId)
                .orElseThrow(() -> new RuntimeException("Locul de parcare nu a fost găsit!"));

        Ticket ticket = new Ticket();
        ticket.setUser(user);
        ticket.setVehicle(vehicle);
        ticket.setParkingSlot(slot);
        ticket.setStartTime(LocalDateTime.now());
        ticket.setEndTime(LocalDateTime.now().plusHours(hours));

      ticket.setStatus(TicketStatus.ACTIVE);

        return ticketRepository.save(ticket);
    }

    public void applyExtension(Ticket ticket,int noOfHours){
        if (noOfHours <= 0) {
            throw new IllegalArgumentException("Extension hours must be greater than 0.");
        }
        if (ticket.getStatus() != TicketStatus.ACTIVE) {
            throw new IllegalStateException("Only ACTIVE tickets can be extended.");
        }
        ticket.setEndTime(ticket.getEndTime().plusHours(noOfHours));
        ticketRepository.save(ticket);
    }


    public Ticket findById(UUID id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tichetul cu ID-ul " + id + " nu a fost găsit!"));
    }
}
