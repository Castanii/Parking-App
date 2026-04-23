package com.parkingapp.domain.events;

import java.util.UUID;

public record ParkingSlotUpdateEvent(UUID parkingAreaId) {}
