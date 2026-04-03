package com.aauelknight.itas_backend.modules.webinars;

import com.aauelknight.itas_backend.dto.webinar.AttendeeDto;
import com.aauelknight.itas_backend.dto.webinar.WebinarDto;
import com.aauelknight.itas_backend.dto.webinar.WebinarRequest;
import com.aauelknight.itas_backend.shared.exception.ResourceNotFoundException;
import com.aauelknight.itas_backend.modules.auth.User;
import com.aauelknight.itas_backend.modules.notifications.EmailService;
import com.aauelknight.itas_backend.modules.webinars.Webinar;
import com.aauelknight.itas_backend.modules.webinars.WebinarRegistration;
import com.aauelknight.itas_backend.modules.auth.UserRepository;
import com.aauelknight.itas_backend.modules.webinars.WebinarRegistrationRepository;
import com.aauelknight.itas_backend.modules.webinars.WebinarRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class WebinarService {

    private static final Logger log = LoggerFactory.getLogger(WebinarService.class);
    private static final DateTimeFormatter WEBINAR_DATE_FORMAT =
            DateTimeFormatter.ofPattern("EEEE, MMMM d yyyy 'at' h:mm a");

    private final WebinarRepository webinarRepository;
    private final WebinarRegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<WebinarDto> getAllWebinars() {
        return webinarRepository.findAllWithPresenter().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WebinarDto> getUpcoming() {
        return webinarRepository.findUpcoming(LocalDateTime.now()).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WebinarDto> getPast() {
        return webinarRepository.findPast(LocalDateTime.now()).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WebinarDto> getMyRegistrations(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        return registrationRepository.findByUserId(user.getId()).stream()
                .map(WebinarRegistration::getWebinar)
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttendeeDto> getAttendees(Long webinarId) {
        return registrationRepository.findByWebinarId(webinarId).stream()
                .map(registration -> AttendeeDto.builder()
                        .userId(registration.getUser().getId())
                        .username(registration.getUser().getUsername())
                        .email(registration.getUser().getEmail())
                        .fullName(registration.getUser().getFirstName()
                                + " "
                                + registration.getUser().getLastName())
                        .registeredAt(registration.getRegisteredAt())
                        .attended(registration.getAttended())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public WebinarDto createWebinar(WebinarRequest req, String username) {
        User presenter = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Webinar webinar = Webinar.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .presenter(presenter)
                .scheduledAt(req.getScheduledAt())
                .durationMinutes(req.getDurationMinutes())
                .maxAttendees(req.getMaxAttendees())
                .meetingLink(req.getMeetingLink())
                .status("SCHEDULED")
                .build();

        return toDto(webinarRepository.save(webinar));
    }

    @Transactional
    public WebinarDto updateWebinar(Long id, WebinarRequest req) {
        Webinar webinar = webinarRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Webinar not found"));

        webinar.setTitle(req.getTitle());
        webinar.setDescription(req.getDescription());
        webinar.setScheduledAt(req.getScheduledAt());
        webinar.setDurationMinutes(req.getDurationMinutes());
        webinar.setMaxAttendees(req.getMaxAttendees());
        webinar.setMeetingLink(req.getMeetingLink());

        return toDto(webinarRepository.save(webinar));
    }

    @Transactional
    public void cancelWebinar(Long id) {
        Webinar webinar = webinarRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Webinar not found"));
        webinar.setStatus("CANCELLED");
        webinarRepository.save(webinar);
    }

    @Transactional
    public void register(Long webinarId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Webinar webinar = webinarRepository.findById(webinarId)
                .orElseThrow(() -> new ResourceNotFoundException("Webinar not found"));

        if (registrationRepository.existsByWebinarIdAndUserId(webinarId, user.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You are already registered for this webinar.");
        }

        if (webinar.getMaxAttendees() != null
                && registrationRepository.countByWebinarId(webinarId) >= webinar.getMaxAttendees()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This webinar is already full.");
        }

        WebinarRegistration registration = WebinarRegistration.builder()
                .webinar(webinar)
                .user(user)
                .attended(false)
                .build();
        registrationRepository.save(registration);

        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            try {
                String scheduledStr = webinar.getScheduledAt() != null
                        ? webinar.getScheduledAt().format(WEBINAR_DATE_FORMAT)
                        : "TBD";

                String emailBody = emailService.buildWebinarEmail(
                        user.getFirstName() + " " + user.getLastName(),
                        webinar.getTitle(),
                        scheduledStr,
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

    private WebinarDto toDto(Webinar webinar) {
        long regCount = registrationRepository.countByWebinarId(webinar.getId());

        return WebinarDto.builder()
                .id(webinar.getId())
                .title(webinar.getTitle())
                .description(webinar.getDescription())
                .presenterName(webinar.getPresenter() != null
                        ? webinar.getPresenter().getUsername()
                        : "TBD")
                .scheduledAt(webinar.getScheduledAt())
                .durationMinutes(webinar.getDurationMinutes())
                .maxAttendees(webinar.getMaxAttendees())
                .registeredCount((int) regCount)
                .meetingLink(webinar.getMeetingLink())
                .status(webinar.getStatus())
                .createdAt(webinar.getCreatedAt())
                .build();
    }
}
