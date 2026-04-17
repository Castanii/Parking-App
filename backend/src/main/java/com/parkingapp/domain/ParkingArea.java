package com.parkingapp.domain;

import jakarta.persistence.*;
import lombok.Data;
import org.locationtech.jts.geom.Point;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@Table(name = "parking_areas", indexes = {
        @Index(name = "idx_spatial_location", columnList = "location")
})
public class ParkingArea {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "address", nullable = false)
    private String address;

    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    /**
     * Spatial point (longitude, latitude) stored as PostGIS GEOMETRY(Point, 4326).
     * Uses org.locationtech.jts.geom.Point (via hibernate-spatial) instead of
     * spring-data-geo Point which lacks JPA spatial support.
     */
    @Column(name = "location", nullable = false, columnDefinition = "GEOMETRY(Point, 4326)")
    private Point location;

    @Column(name = "hourly_rate", nullable = false)
    private Double hourlyRate;

    @OneToMany(mappedBy = "parkingArea", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ParkingSlot> parkingSlots = new ArrayList<>();
}