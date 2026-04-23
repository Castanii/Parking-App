package com.parkingapp.repository;

import com.parkingapp.domain.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findAllBySenderIdOrderByCreatedAtDesc(UUID senderId);

    List<Message> findAllByThreadIdOrderByCreatedAtAsc(String threadId);

    long countBySenderIdAndReadFalse(UUID senderId);
}
