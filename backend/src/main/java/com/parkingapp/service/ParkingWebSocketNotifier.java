package com.parkingapp.service;

import com.parkingapp.domain.SlotUpdateMessage;
import com.parkingapp.domain.enums.ParkingSlotStatus;
import com.parkingapp.domain.events.ParkingSlotUpdateEvent;
import com.parkingapp.repository.ParkingSlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class ParkingWebSocketNotifier {

    private final SimpMessagingTemplate messagingTemplate;
    private final ParkingSlotRepository parkingSlotRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSlotUpdate(ParkingSlotUpdateEvent event) {
        long available = parkingSlotRepository.countByParkingAreaIdAndStatus(
                event.parkingAreaId(), ParkingSlotStatus.AVAILABLE);
        long total = parkingSlotRepository.countByParkingAreaId(event.parkingAreaId());

        messagingTemplate.convertAndSend(
                "/topic/parking-updates",
                new SlotUpdateMessage(event.parkingAreaId().toString(), available, total)
        );
    }
}
