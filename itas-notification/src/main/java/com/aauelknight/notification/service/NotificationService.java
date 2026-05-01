package com.aauelknight.notification.service;

import com.aauelknight.notification.client.AuthServiceClient;
import com.aauelknight.notification.dto.UserInfoDto;
import com.aauelknight.notification.dto.request.AnnouncementDto;
import com.aauelknight.notification.dto.request.AnnouncementRequest;
import com.aauelknight.notification.dto.request.CampaignDto;
import com.aauelknight.notification.dto.request.NotificationRequest;
import com.aauelknight.notification.dto.request.SingleNotificationRequest;
import com.aauelknight.notification.entity.Announcement;
import com.aauelknight.notification.entity.NotificationCampaign;
import com.aauelknight.notification.repository.AnnouncementRepository;
import com.aauelknight.notification.repository.NotificationCampaignRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationCampaignRepository campaignRepository;
    private final AnnouncementRepository announcementRepository;
    private final AuthServiceClient authServiceClient;
    private final EmailService emailService;

    @Transactional
    public CampaignDto sendNotification(NotificationRequest request, String username) {
        NotificationCampaign campaign = NotificationCampaign.builder()
                .title(request.getTitle())
                .message(request.getMessage())
                .audienceType(request.getAudienceType())
                .status(Boolean.TRUE.equals(request.getSendNow()) ? "SENT" : "SCHEDULED")
                .createdBy(username)
                .build();
        campaign = campaignRepository.save(campaign);

        long deliveryCount = deliverCampaign(campaign, request.getAudienceType());
        return toCampaignDto(campaign, request.getSendNow(), request.getScheduledAt(), deliveryCount);
    }

    @Transactional
    public void sendToSingleUser(Long userId, SingleNotificationRequest request, String sentByUsername) {
        UserInfoDto recipient = authServiceClient.getUserById(userId);
        if (recipient.getEmail() == null || recipient.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User has no email address");
        }

        NotificationCampaign campaign = NotificationCampaign.builder()
                .title(request.getSubject())
                .message(request.getMessage())
                .audienceType("SINGLE_USER")
                .status("SENT")
                .createdBy(sentByUsername)
                .build();
        campaignRepository.save(campaign);

        String htmlBody = emailService.buildNotificationEmail(
                recipient.getFullName(),
                request.getSubject(),
                request.getMessage());
        emailService.sendEmail(recipient.getEmail(), "[ITAS Portal] " + request.getSubject(), htmlBody);
    }

    @Transactional(readOnly = true)
    public List<CampaignDto> getAllCampaigns() {
        return campaignRepository.findAllByCreatedAtDesc().stream()
                .map(campaign -> toCampaignDto(campaign, true, null, resolveRecipients(campaign.getAudienceType()).size()))
                .toList();
    }

    @Transactional
    public AnnouncementDto createAnnouncement(AnnouncementRequest request, String username) {
        Announcement announcement = Announcement.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .isActive(request.getIsActive())
                .createdBy(username)
                .build();
        return toAnnouncementDto(announcementRepository.save(announcement));
    }

    @Transactional(readOnly = true)
    public List<AnnouncementDto> getAllAnnouncements() {
        return announcementRepository.findAllOrdered().stream().map(this::toAnnouncementDto).toList();
    }

    @Transactional(readOnly = true)
    public List<AnnouncementDto> getActiveAnnouncements() {
        return announcementRepository.findAllActive().stream().map(this::toAnnouncementDto).toList();
    }

    @Transactional
    public AnnouncementDto toggleAnnouncement(Long id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found"));
        announcement.setIsActive(!announcement.getIsActive());
        return toAnnouncementDto(announcementRepository.save(announcement));
    }

    @Transactional
    public void deleteAnnouncement(Long id) {
        announcementRepository.deleteById(id);
    }

    private long deliverCampaign(NotificationCampaign campaign, String audienceType) {
        List<UserInfoDto> recipients = resolveRecipients(audienceType);
        List<String> emails = recipients.stream()
                .map(UserInfoDto::getEmail)
                .filter(email -> email != null && !email.isBlank())
                .distinct()
                .toList();
        if (!emails.isEmpty()) {
            String htmlBody = emailService.buildNotificationEmail("Portal User", campaign.getTitle(), campaign.getMessage());
            emailService.sendBulkEmail(emails, "[ITAS Portal] " + campaign.getTitle(), htmlBody);
        }
        return emails.size();
    }

    private List<UserInfoDto> resolveRecipients(String audienceType) {
        List<UserInfoDto> allUsers = authServiceClient.searchUsers("");
        if (audienceType == null || audienceType.isBlank() || "ALL".equalsIgnoreCase(audienceType)) {
            return allUsers;
        }
        return allUsers.stream()
                .filter(user -> matchesAudience(user.getRole(), audienceType))
                .toList();
    }

    private boolean matchesAudience(String role, String audienceType) {
        if (role == null) {
            return false;
        }
        return switch (audienceType.toUpperCase()) {
            case "TAXPAYER" -> "TAXPAYER".equalsIgnoreCase(role);
            case "TAX_AGENT" -> "TAX_AGENT".equalsIgnoreCase(role);
            case "MOR_STAFF" -> "MOR_STAFF".equalsIgnoreCase(role);
            case "ALL_LEARNERS" -> List.of("TAXPAYER", "TAX_AGENT", "MOR_STAFF", "MANAGER").contains(role.toUpperCase());
            default -> true;
        };
    }

    private CampaignDto toCampaignDto(NotificationCampaign campaign, Boolean sendNow, java.time.LocalDateTime scheduledAt, long deliveryCount) {
        return CampaignDto.builder()
                .id(campaign.getId())
                .title(campaign.getTitle())
                .message(campaign.getMessage())
                .audienceType(campaign.getAudienceType())
                .sendNow(sendNow)
                .scheduledAt(scheduledAt)
                .status(campaign.getStatus())
                .createdByUsername(campaign.getCreatedBy())
                .createdAt(campaign.getCreatedAt())
                .deliveryCount(deliveryCount)
                .build();
    }

    private AnnouncementDto toAnnouncementDto(Announcement announcement) {
        return AnnouncementDto.builder()
                .id(announcement.getId())
                .title(announcement.getTitle())
                .content(announcement.getContent())
                .isActive(announcement.getIsActive())
                .createdByUsername(announcement.getCreatedBy())
                .createdAt(announcement.getCreatedAt())
                .updatedAt(announcement.getUpdatedAt())
                .build();
    }
}
