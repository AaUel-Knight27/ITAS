package com.aauelknight.itas_backend.notifications.service;
import com.aauelknight.itas_backend.notifications.dto.request.AnnouncementDto;
import com.aauelknight.itas_backend.notifications.dto.request.AnnouncementRequest;
import com.aauelknight.itas_backend.notifications.dto.request.CampaignDto;
import com.aauelknight.itas_backend.notifications.dto.request.NotificationRequest;
import com.aauelknight.itas_backend.notifications.dto.request.SingleNotificationRequest;
import com.aauelknight.itas_backend.auth.entity.User;
import com.aauelknight.itas_backend.auth.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import com.aauelknight.itas_backend.notifications.entity.Announcement;
import com.aauelknight.itas_backend.notifications.entity.NotificationCampaign;
import com.aauelknight.itas_backend.notifications.repository.AnnouncementRepository;
import com.aauelknight.itas_backend.notifications.repository.NotificationCampaignRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationCampaignRepository campaignRepository;
    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

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
            sendCampaignEmail(campaign);
        }

        return toCampaignDto(campaign);
    }

    @Transactional
    public void sendToSingleUser(Long userId,
                                 SingleNotificationRequest req,
                                 String sentByUsername) {
        User recipient = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found: " + userId));

        if (recipient.getEmail() == null || recipient.getEmail().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "User has no email address");
        }

        User sender = userRepository.findByUsername(sentByUsername)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Sender not found: " + sentByUsername));

        NotificationCampaign campaign = NotificationCampaign.builder()
                .title(req.getSubject())
                .message(req.getMessage())
                .audienceType("SINGLE_USER")
                .sendNow(true)
                .status("SENT")
                .createdBy(sender)
                .build();
        campaignRepository.save(campaign);

        String firstName = recipient.getFirstName() != null ? recipient.getFirstName() : "";
        String lastName = recipient.getLastName() != null ? recipient.getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();
        if (fullName.isBlank()) {
            fullName = recipient.getUsername();
        }

        String htmlBody = emailService.buildNotificationEmail(
                fullName,
                req.getSubject(),
                req.getMessage());

        emailService.sendEmail(
                recipient.getEmail(),
                "[ITAS Portal] " + req.getSubject(),
                htmlBody);

        log.info("Single notification sent to user {} ({}) by {}",
                userId,
                recipient.getEmail(),
                sentByUsername);
    }

    @Transactional(readOnly = true)
    public List<CampaignDto> getAllCampaigns() {
        return campaignRepository
                .findAllWithCreator()
                .stream()
                .map(this::toCampaignDto)
                .collect(Collectors.toList());
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

    private void sendCampaignEmail(NotificationCampaign campaign) {
        List<String> emails = getRecipients(campaign.getAudienceType()).stream()
                .map(User::getEmail)
                .filter(email -> email != null && !email.isBlank())
                .distinct()
                .toList();

        if (emails.isEmpty()) {
            log.warn("No email recipients found for campaign: {}", campaign.getTitle());
            return;
        }

        String htmlBody = emailService.buildNotificationEmail(
                "Portal User",
                campaign.getTitle(),
                campaign.getMessage());

        emailService.sendBulkEmail(emails, "[ITAS Portal] " + campaign.getTitle(), htmlBody);
        log.info("Campaign '{}' dispatched to {} recipients via email", campaign.getTitle(), emails.size());
    }

    private List<User> getRecipients(String audienceType) {
        if (audienceType == null || audienceType.isBlank()) {
            return userRepository.findAll();
        }

        switch (audienceType.toUpperCase()) {
            case "TAXPAYER":
                return userRepository.findByRoleName("TAXPAYER");
            case "TAX_AGENT":
                return userRepository.findByRoleName("TAX_AGENT");
            case "MOR_STAFF":
                return userRepository.findByRoleName("MOR_STAFF");
            case "ALL_LEARNERS":
                return userRepository.findByRoleNameIn(
                        List.of("TAXPAYER", "TAX_AGENT", "MOR_STAFF", "MANAGER"));
            case "ALL":
            default:
                return userRepository.findAll();
        }
    }

    private CampaignDto toCampaignDto(NotificationCampaign c) {
        long deliveryCount = "SINGLE_USER".equalsIgnoreCase(c.getAudienceType())
                ? 1
                : getRecipients(c.getAudienceType()).stream()
                        .map(User::getEmail)
                        .filter(email -> email != null && !email.isBlank())
                        .distinct()
                        .count();

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

