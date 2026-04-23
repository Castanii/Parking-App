package com.parkingapp.service;

import com.parkingapp.domain.Message;
import com.parkingapp.domain.User;
import com.parkingapp.repository.MessageRepository;
import com.parkingapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional
    public MessageResponse sendMessage(SendMessageRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Message message = new Message();
        message.setSender(user);
        message.setSenderName(user.getEmail());
        message.setSubject(request.subject());
        message.setBody(request.body());
        message.setThreadId(request.threadId() != null ? request.threadId() : UUID.randomUUID().toString());
        message.setRead(true);
        message.setFromSupport(false);

        return mapToResponse(messageRepository.save(message));
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getUserMessages(UUID userId) {
        return messageRepository.findAllBySenderIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getThread(String threadId) {
        return messageRepository.findAllByThreadIdOrderByCreatedAtAsc(threadId)
                .stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public void markAsRead(UUID messageId, UUID userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!message.getSender().getId().equals(userId)) {
            throw new IllegalStateException("You can only update your own messages.");
        }

        message.setRead(true);
        messageRepository.save(message);
    }

    private MessageResponse mapToResponse(Message m) {
        return new MessageResponse(
                m.getId(),
                m.getSenderName(),
                m.getSubject(),
                m.getBody(),
                m.getThreadId(),
                m.isRead(),
                m.isFromSupport(),
                m.getCreatedAt()
        );
    }

    public record SendMessageRequest(String subject, String body, String threadId) {}

    public record MessageResponse(
            UUID id,
            String senderName,
            String subject,
            String body,
            String threadId,
            boolean read,
            boolean fromSupport,
            java.time.LocalDateTime createdAt
    ) {}
}
