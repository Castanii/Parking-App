package com.parkingapp.service;

import com.parkingapp.domain.ParkingArea;
import com.parkingapp.domain.ParkingSlot;
import com.parkingapp.domain.enums.ParkingSlotStatus;
import com.parkingapp.domain.enums.SizeCategory;
import com.parkingapp.repository.ParkingAreaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final ParkingAreaRepository parkingAreaRepository;

    private static final GeometryFactory GEO_FACTORY =
            new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    @Transactional
    public void run(String... args) {
        if (parkingAreaRepository.count() > 0) {
            log.info("Parking areas already seeded, skipping.");
            return;
        }

        log.info("Seeding parking areas and slots...");

        createArea("Parcare Piata Avram Iancu", "Piata Avram Iancu, Cluj-Napoca", 50, 10.0, 23.594139, 46.766833, List.of(
                slot("A1-01", SizeCategory.COMPACT, false),
                slot("A1-02", SizeCategory.COMPACT, false),
                slot("A1-03", SizeCategory.STANDARD, false),
                slot("A1-04", SizeCategory.STANDARD, false),
                slot("A1-05", SizeCategory.STANDARD, true),
                slot("A1-06", SizeCategory.LARGE, false),
                slot("A1-07", SizeCategory.LARGE, true),
                slot("A1-08", SizeCategory.COMPACT, false),
                slot("A1-09", SizeCategory.STANDARD, false),
                slot("A1-10", SizeCategory.STANDARD, false)
        ));

        createArea("Parcare Piata Unirii", "Piata Unirii, Cluj-Napoca", 30, 10.0, 23.5899, 46.7694, List.of(
                slot("U1-01", SizeCategory.COMPACT, false),
                slot("U1-02", SizeCategory.STANDARD, false),
                slot("U1-03", SizeCategory.STANDARD, true),
                slot("U1-04", SizeCategory.LARGE, false),
                slot("U1-05", SizeCategory.COMPACT, false),
                slot("U1-06", SizeCategory.STANDARD, false),
                slot("U1-07", SizeCategory.LARGE, true),
                slot("U1-08", SizeCategory.COMPACT, false)
        ));

        createArea("Parcare Bulevardul Eroilor", "Bulevardul Eroilor, Cluj-Napoca", 40, 10.0, 23.5921, 46.7687, List.of(
                slot("E1-01", SizeCategory.STANDARD, false),
                slot("E1-02", SizeCategory.STANDARD, false),
                slot("E1-03", SizeCategory.COMPACT, true),
                slot("E1-04", SizeCategory.LARGE, false),
                slot("E1-05", SizeCategory.STANDARD, false),
                slot("E1-06", SizeCategory.COMPACT, false),
                slot("E1-07", SizeCategory.STANDARD, true),
                slot("E1-08", SizeCategory.LARGE, false)
        ));

        createArea("Parcare Piata Mihai Viteazu", "Piata Mihai Viteazu, Cluj-Napoca", 35, 8.0, 23.5905, 46.7744, List.of(
                slot("M1-01", SizeCategory.COMPACT, false),
                slot("M1-02", SizeCategory.STANDARD, false),
                slot("M1-03", SizeCategory.STANDARD, true),
                slot("M1-04", SizeCategory.LARGE, false),
                slot("M1-05", SizeCategory.COMPACT, false),
                slot("M1-06", SizeCategory.STANDARD, false),
                slot("M1-07", SizeCategory.COMPACT, true),
                slot("M1-08", SizeCategory.LARGE, false)
        ));

        createArea("Parcare Cluj Arena", "Aleea Stadionului 2, Cluj-Napoca", 60, 5.0, 23.5724, 46.7675, List.of(
                slot("C1-01", SizeCategory.STANDARD, false),
                slot("C1-02", SizeCategory.STANDARD, false),
                slot("C1-03", SizeCategory.COMPACT, false),
                slot("C1-04", SizeCategory.COMPACT, true),
                slot("C1-05", SizeCategory.LARGE, false),
                slot("C1-06", SizeCategory.LARGE, true),
                slot("C1-07", SizeCategory.STANDARD, false),
                slot("C1-08", SizeCategory.STANDARD, true),
                slot("C1-09", SizeCategory.COMPACT, false),
                slot("C1-10", SizeCategory.LARGE, false)
        ));

        log.info("Seeded 5 parking areas with {} total slots.", parkingAreaRepository.findAll().stream()
                .mapToInt(a -> a.getParkingSlots().size()).sum());
    }

    private void createArea(String name, String address, int capacity, double hourlyRate,
                            double longitude, double latitude, List<ParkingSlot> slots) {
        ParkingArea area = new ParkingArea();
        area.setName(name);
        area.setAddress(address);
        area.setCapacity(capacity);
        area.setHourlyRate(hourlyRate);

        Point p = GEO_FACTORY.createPoint(new Coordinate(longitude, latitude));
        p.setSRID(4326);
        area.setLocation(p);

        for (ParkingSlot slot : slots) {
            slot.setParkingArea(area);
            area.getParkingSlots().add(slot);
        }

        parkingAreaRepository.save(area);
    }

    private ParkingSlot slot(String identifier, SizeCategory size, boolean evCharging) {
        ParkingSlot slot = new ParkingSlot();
        slot.setSlotIdentifier(identifier);
        slot.setStatus(ParkingSlotStatus.AVAILABLE);
        slot.setSizeCategory(size);
        slot.setHasEvCharging(evCharging);
        return slot;
    }
}
