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

        // --- Extended Cluj-Napoca coverage ---

        // Close to Piata Unirii — good for reroute testing from center
        createArea("Parcare Str. Memorandumului", "Strada Memorandumului 28, Cluj-Napoca", 20, 9.0, 23.5873, 46.7705, List.of(
                slot("ME-01", SizeCategory.COMPACT, false),
                slot("ME-02", SizeCategory.STANDARD, false),
                slot("ME-03", SizeCategory.STANDARD, true)
        ));

        // Near Piata Unirii — tiny lot, fills up fast for testing
        createArea("Parcare Tribunalului", "Strada Tribunalului 5, Cluj-Napoca", 10, 12.0, 23.5912, 46.7688, List.of(
                slot("TR-01", SizeCategory.COMPACT, false),
                slot("TR-02", SizeCategory.COMPACT, false)
        ));

        // Gara Cluj-Napoca — north of center
        createArea("Parcare Gara Cluj-Napoca", "Piata Garii 1, Cluj-Napoca", 80, 6.0, 23.5912, 46.7803, List.of(
                slot("GA-01", SizeCategory.STANDARD, false),
                slot("GA-02", SizeCategory.STANDARD, false),
                slot("GA-03", SizeCategory.LARGE, false),
                slot("GA-04", SizeCategory.COMPACT, false),
                slot("GA-05", SizeCategory.STANDARD, true),
                slot("GA-06", SizeCategory.LARGE, true),
                slot("GA-07", SizeCategory.COMPACT, false),
                slot("GA-08", SizeCategory.STANDARD, false)
        ));

        // Harlequin Shopping Center — northeast
        createArea("Parcare Harlequin", "Bulevardul 21 Decembrie 1989 77, Cluj-Napoca", 120, 7.0, 23.6010, 46.7726, List.of(
                slot("HA-01", SizeCategory.COMPACT, false),
                slot("HA-02", SizeCategory.COMPACT, false),
                slot("HA-03", SizeCategory.STANDARD, false),
                slot("HA-04", SizeCategory.STANDARD, true),
                slot("HA-05", SizeCategory.LARGE, false),
                slot("HA-06", SizeCategory.LARGE, true),
                slot("HA-07", SizeCategory.STANDARD, false),
                slot("HA-08", SizeCategory.COMPACT, false),
                slot("HA-09", SizeCategory.STANDARD, false),
                slot("HA-10", SizeCategory.LARGE, false)
        ));

        // Marasti — north, near Bulevardul Muncii
        createArea("Parcare Marasti", "Bulevardul Muncii 18, Cluj-Napoca", 45, 5.0, 23.6008, 46.7779, List.of(
                slot("MR-01", SizeCategory.STANDARD, false),
                slot("MR-02", SizeCategory.STANDARD, false),
                slot("MR-03", SizeCategory.COMPACT, false),
                slot("MR-04", SizeCategory.COMPACT, true),
                slot("MR-05", SizeCategory.LARGE, false),
                slot("MR-06", SizeCategory.STANDARD, true)
        ));

        // Iulius Mall — south of center
        createArea("Parcare Iulius Mall", "Calea Dorobantilor 1, Cluj-Napoca", 200, 4.0, 23.5928, 46.7452, List.of(
                slot("IU-01", SizeCategory.COMPACT, false),
                slot("IU-02", SizeCategory.COMPACT, false),
                slot("IU-03", SizeCategory.STANDARD, false),
                slot("IU-04", SizeCategory.STANDARD, true),
                slot("IU-05", SizeCategory.LARGE, false),
                slot("IU-06", SizeCategory.LARGE, true),
                slot("IU-07", SizeCategory.STANDARD, false),
                slot("IU-08", SizeCategory.STANDARD, false),
                slot("IU-09", SizeCategory.COMPACT, true),
                slot("IU-10", SizeCategory.LARGE, false),
                slot("IU-11", SizeCategory.STANDARD, false),
                slot("IU-12", SizeCategory.COMPACT, false)
        ));

        // Zorilor — southwest
        createArea("Parcare Zorilor", "Calea Turzii 178, Cluj-Napoca", 30, 6.0, 23.5715, 46.7528, List.of(
                slot("ZO-01", SizeCategory.STANDARD, false),
                slot("ZO-02", SizeCategory.COMPACT, false),
                slot("ZO-03", SizeCategory.COMPACT, true),
                slot("ZO-04", SizeCategory.STANDARD, false)
        ));

        // Manastur — west
        createArea("Parcare Manastur", "Calea Floresti 4, Cluj-Napoca", 50, 4.0, 23.5418, 46.7548, List.of(
                slot("MA-01", SizeCategory.COMPACT, false),
                slot("MA-02", SizeCategory.COMPACT, false),
                slot("MA-03", SizeCategory.STANDARD, false),
                slot("MA-04", SizeCategory.STANDARD, true),
                slot("MA-05", SizeCategory.LARGE, false),
                slot("MA-06", SizeCategory.STANDARD, false)
        ));

        // Vivo Cluj — far west, Calea Baciului
        createArea("Parcare Vivo Cluj", "Calea Baciului 2E, Cluj-Napoca", 300, 3.0, 23.5433, 46.7521, List.of(
                slot("VI-01", SizeCategory.COMPACT, false),
                slot("VI-02", SizeCategory.COMPACT, true),
                slot("VI-03", SizeCategory.STANDARD, false),
                slot("VI-04", SizeCategory.STANDARD, false),
                slot("VI-05", SizeCategory.LARGE, false),
                slot("VI-06", SizeCategory.LARGE, true),
                slot("VI-07", SizeCategory.STANDARD, false),
                slot("VI-08", SizeCategory.COMPACT, false),
                slot("VI-09", SizeCategory.STANDARD, true),
                slot("VI-10", SizeCategory.LARGE, false)
        ));

        // Grigorescu — east
        createArea("Parcare Grigorescu", "Strada Mehedinti 3, Cluj-Napoca", 25, 7.0, 23.6148, 46.7625, List.of(
                slot("GR-01", SizeCategory.STANDARD, false),
                slot("GR-02", SizeCategory.COMPACT, false),
                slot("GR-03", SizeCategory.COMPACT, true),
                slot("GR-04", SizeCategory.STANDARD, false),
                slot("GR-05", SizeCategory.LARGE, false)
        ));

        log.info("Seeded 15 parking areas with {} total slots.", parkingAreaRepository.findAll().stream()
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
