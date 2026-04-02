package com.parkingapp.service;

import com.parkingapp.domain.Ticket;
import com.parkingapp.domain.TicketStatus;
import com.parkingapp.repository.TicketRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.TemporalAmount;
import java.util.List;

@Service
public class TicketService {
    private final TicketRepository ticketRepository;
    public TicketService(TicketRepository ticketRepository) {
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

    public void applyExtension(Ticket ticket,int noOfHours){
        ticket.setEndTime(LocalDateTime.now().plusHours(noOfHours));
        ticketRepository.save(ticket);
    }
}
