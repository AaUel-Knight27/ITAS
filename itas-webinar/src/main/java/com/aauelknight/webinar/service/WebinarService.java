package com.aauelknight.webinar.service;

import com.aauelknight.webinar.client.AuthServiceClient;
import com.aauelknight.webinar.dto.UserInfoDto;
import com.aauelknight.webinar.dto.response.AttendeeDto;
import com.aauelknight.webinar.dto.response.WebinarDto;
import com.aauelknight.webinar.dto.response.WebinarRequest;
import com.aauelknight.webinar.entity.Webinar;
import com.aauelknight.webinar.entity.WebinarRegistration;
import com.aauelknight.webinar.repository.WebinarRegistrationRepository;
import com.aauelknight.webinar.repository.WebinarRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebinarService {

    private static final DateTimeFormatter WEBINAR_DATE_FORMAT =
            DateTimeFormatter.ofPattern("EEEE, MMMM d yyyy 'at' h:mm a");

    private final WebinarRepository webinarRepository;
    private final WebinarRegistrationRepository registrationRepository;
    private final AuthServiceClient authServiceClient;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<WebinarDto> getAllWebinars() {
        return webinarRepository.findAllOrdered().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<WebinarDto> getUpcoming() {
        return webinarRepository.findUpcoming(LocalDateTime.now()).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<WebinarDto> getPast() {
        return webinarRepository.findPast(LocalDateTime.now()).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<WebinarDto> getMyRegistrations(Long userId) {
        return registrationRepository.findByUserId(userId).stream()
                .map(WebinarRegistration::getWebinar)
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttendeeDto> getAttendees(Long webinarId) {
        return registrationRepository.findByWebinarId(webinarId).stream()
                .map(registration -> AttendeeDto.builder()
                        .userId(registration.getUserId())
                        .username(registration.getUserName())
                        .email(registration.getUserEmail())
                        .fullName(registration.getUserName())
                        .registeredAt(registration.getRegisteredAt())
                        .attended(registration.getAttended())
                        .build())
                .toList();
    }

    @Transactional
    public WebinarDto createWebinar(WebinarRequest request, String username) {
        UserInfoDto presenter = authServiceClient.getUserByUsername(username);
        Webinar webinar = Webinar.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .scheduledAt(request.getScheduledAt())
                .durationMinutes(request.getDurationMinutes())
                .maxAttendees(request.getMaxAttendees())
                .meetingLink(request.getMeetingLink())
                .presenterName(presenter.getFullName())
                .createdBy(username)
                .status("SCHEDULED")
                .build();
        return toDto(webinarRepository.save(webinar));
    }

    @Transactional
    public WebinarDto updateWebinar(Long id, WebinarRequest request) {
        Webinar webinar = getWebinar(id);
        webinar.setTitle(request.getTitle());
        webinar.setDescription(request.getDescription());
        webinar.setScheduledAt(request.getScheduledAt());
        webinar.setDurationMinutes(request.getDurationMinutes());
        webinar.setMaxAttendees(request.getMaxAttendees());
        webinar.setMeetingLink(request.getMeetingLink());
        return toDto(webinarRepository.save(webinar));
    }

    @Transactional
    public void cancelWebinar(Long id) {
        Webinar webinar = getWebinar(id);
        webinar.setStatus("CANCELLED");
        webinarRepository.save(webinar);
    }

    @Transactional
    public void register(Long webinarId, Long userId) {
        Webinar webinar = getWebinar(webinarId);
        UserInfoDto user = authServiceClient.getUserById(userId);

        if (registrationRepository.existsByWebinarIdAndUserId(webinarId, userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You are already registered for this webinar.");
        }

        if (webinar.getMaxAttendees() != null
                && registrationRepository.countByWebinarId(webinarId) >= webinar.getMaxAttendees()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This webinar is already full.");
        }

        WebinarRegistration registration = WebinarRegistration.builder()
                .webinar(webinar)
                .userId(userId)
                .userEmail(user.getEmail())
                .userName(user.getFullName())
                .attended(false)
                .build();
        registrationRepository.save(registration);

        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            try {
                String scheduledAt = webinar.getScheduledAt() != null
                        ? webinar.getScheduledAt().format(WEBINAR_DATE_FORMAT)
                        : "TBD";
                String emailBody = emailService.buildWebinarEmail(
                        user.getFullName(),
                        webinar.getTitle(),
                        scheduledAt,
                        webinar.getMeetingLink());
                emailService.sendEmail(
                        user.getEmail(),
                        "[ITAS Portal] Webinar Registration: " + webinar.getTitle(),
                        emailBody);
            } catch (Exception ex) {
                log.warn("Webinar email failed: {}", ex.getMessage());
            }
        }
    }

    public long countWebinars() {
        return webinarRepository.count();
    }

    public long countRegistrations() {
        return registrationRepository.count();
    }

    private Webinar getWebinar(Long id) {
        return webinarRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Webinar not found"));
    }

    private WebinarDto toDto(Webinar webinar) {
        return WebinarDto.builder()
                .id(webinar.getId())
                .title(webinar.getTitle())
                .description(webinar.getDescription())
                .presenterName(webinar.getPresenterName())
                .scheduledAt(webinar.getScheduledAt())
                .durationMinutes(webinar.getDurationMinutes())
                .maxAttendees(webinar.getMaxAttendees())
                .registeredCount(Math.toIntExact(registrationRepository.countByWebinarId(webinar.getId())))
                .meetingLink(webinar.getMeetingLink())
                .status(webinar.getStatus())
                .createdAt(webinar.getCreatedAt())
                .build();
    }
}
