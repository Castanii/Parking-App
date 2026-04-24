package com.parkingapp.domain;

public record SlotUpdateMessage(String parkingAreaId, long availableSlots, long totalSlots) {}
