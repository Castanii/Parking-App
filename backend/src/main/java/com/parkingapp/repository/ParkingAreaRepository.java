package com.parkingapp.repository;

import com.parkingapp.domain.ParkingArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.UUID;

public interface ParkingAreaRepository extends JpaRepository<ParkingArea, UUID> {

    @Query("SELECT pa, COUNT(ps.id), SUM(CASE WHEN ps.status = com.parkingapp.domain.enums.ParkingSlotStatus.AVAILABLE THEN 1 ELSE 0 END) " +
           "FROM ParkingArea pa LEFT JOIN pa.parkingSlots ps " +
           "GROUP BY pa")
    List<Object[]> findAvailabilitySummary();
}
