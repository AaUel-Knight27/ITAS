package com.aauelknight.itas_backend.service;

import com.aauelknight.itas_backend.dto.notification.AnnouncementDto;
import com.aauelknight.itas_backend.dto.notification.AnnouncementRequest;
import com.aauelknight.itas_backend.dto.notification.CampaignDto;
import com.aauelknight.itas_backend.dto.notification.NotificationRequest;
import com.aauelknight.itas_backend.dto.notification.UserNotificationDto;
import com.aauelknight.itas_backend.entity.Announcement;
import com.aauelknight.itas_backend.entity.NotificationCampaign;
import com.aauelknight.itas_backend.entity.User;
import com.aauelknight.itas_backend.entity.UserNotification;
import com.aauelknight.itas_backend.repository.AnnouncementRepository;
import com.aauelknight.itas_backend.repository.NotificationCampaignRepository;
import com.aauelknight.itas_backend.repository.UserNotificationRepository;
import com.aauelknight.itas_backend.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationCampaignRepository campaignRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

    @Transactional
    public CampaignDto sendNotification(NotificationRequest req, String username) {
        User createdBy = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        NotificationCampaign campaign = NotificationCampaign.builder()
                .title(req.getTitle())
                .message(req.getMessage())
                .audienceType(req.getAudienceType())
                .sendNow(req.getSendNow())
                .scheduledAt(req.getScheduledAt())
                .status(Boolean.TRUE.equals(req.getSendNow()) ? "SENT" : "SCHEDULED")
                .createdBy(createdBy)
                .build();

        campaign = campaignRepository.save(campaign);

        if (Boolean.TRUE.equals(req.getSendNow())) {
            deliverToAudience(campaign, req.getAudienceType());
        }

        return toCampaignDto(campaign);
    }

    @Transactional(readOnly = true)
    public List<CampaignDto> getAllCampaigns() {
        return campaignRepository
                .findAllWithCreator()
                .stream()
                .map(this::toCampaignDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserNotificationDto> getMyNotifications(String username) {
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        return userNotificationRepository
                .findByUserId(user.getId())
                .stream()
                .map(n -> UserNotificationDto.builder()
                        .id(n.getId())
                        .title(n.getCampaign().getTitle())
                        .message(n.getCampaign().getMessage())
                        .readStatus(n.getReadStatus())
                        .deliveredAt(n.getDeliveredAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String username) {
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        return userNotificationRepository.countByUserIdAndReadStatusFalse(user.getId());
    }

    @Transactional
    public void markAsRead(Long notificationId, String username) {
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        userNotificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUser().getId().equals(user.getId())) {
                n.setReadStatus(true);
                userNotificationRepository.save(n);
            }
        });
    }

    @Transactional
    public void markAllAsRead(String username) {
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        userNotificationRepository.findUnreadByUserId(user.getId()).forEach(n -> {
            n.setReadStatus(true);
            userNotificationRepository.save(n);
        });
    }

    @Transactional
    public AnnouncementDto createAnnouncement(AnnouncementRequest req, String username) {
        User createdBy = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        Announcement announcement = Announcement.builder()
                .title(req.getTitle())
                .content(req.getContent())
                .audienceType(req.getAudienceType())
                .isActive(req.getIsActive())
                .createdBy(createdBy)
                .build();

        return toAnnouncementDto(announcementRepository.save(announcement));
    }

    @Transactional(readOnly = true)
    public List<AnnouncementDto> getAllAnnouncements() {
        return announcementRepository
                .findAllWithCreator()
                .stream()
                .map(this::toAnnouncementDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AnnouncementDto> getActiveAnnouncements() {
        return announcementRepository
                .findAllActive()
                .stream()
                .map(this::toAnnouncementDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AnnouncementDto toggleAnnouncement(Long id) {
        Announcement announcement = announcementRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found: " + id));

        announcement.setIsActive(!announcement.getIsActive());

        return toAnnouncementDto(announcementRepository.save(announcement));
    }

    @Transactional
    public void deleteAnnouncement(Long id) {
        announcementRepository.deleteById(id);
    }

    private void deliverToAudience(NotificationCampaign campaign, String audienceType) {
        List<User> targetUsers;

        switch (audienceType.toUpperCase()) {
            case "TAXPAYER":
                targetUsers = userRepository.findByRoleName("TAXPAYER");
                break;
            case "TAX_AGENT":
                targetUsers = userRepository.findByRoleName("TAX_AGENT");
                break;
            case "MOR_STAFF":
                targetUsers = userRepository.findByRoleName("MOR_STAFF");
                break;
            case "ALL_LEARNERS":
                targetUsers = userRepository.findByRoleNameIn(
                        List.of("TAXPAYER", "TAX_AGENT", "MOR_STAFF", "MANAGER"));
                break;
            case "ALL":
            default:
                targetUsers = userRepository.findAll();
                break;
        }

        List<UserNotification> notifications = targetUsers.stream()
                .map(user -> UserNotification.builder()
                        .user(user)
                        .campaign(campaign)
                        .readStatus(false)
                        .build())
                .collect(Collectors.toList());

        userNotificationRepository.saveAll(notifications);
    }

    private CampaignDto toCampaignDto(NotificationCampaign c) {
        long deliveryCount = userNotificationRepository.countByUserIdAndReadStatusFalse(c.getId());

        return CampaignDto.builder()
                .id(c.getId())
                .title(c.getTitle())
                .message(c.getMessage())
                .audienceType(c.getAudienceType())
                .sendNow(c.getSendNow())
                .scheduledAt(c.getScheduledAt())
                .status(c.getStatus())
                .createdByUsername(c.getCreatedBy() != null
                        ? c.getCreatedBy().getUsername()
                        : "System")
                .createdAt(c.getCreatedAt())
                .deliveryCount(deliveryCount)
                .build();
    }

    private AnnouncementDto toAnnouncementDto(Announcement a) {
        return AnnouncementDto.builder()
                .id(a.getId())
                .title(a.getTitle())
                .content(a.getContent())
                .audienceType(a.getAudienceType())
                .isActive(a.getIsActive())
                .createdByUsername(a.getCreatedBy() != null
                        ? a.getCreatedBy().getUsername()
                        : "System")
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
