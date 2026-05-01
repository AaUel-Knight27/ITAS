package com.aauelknight.learning.controller;

import com.aauelknight.learning.dto.response.CompletionDto;
import com.aauelknight.learning.dto.response.CourseProgressDto;
import com.aauelknight.learning.dto.response.EnrollmentDto;
import com.aauelknight.learning.dto.response.VideoProgressDto;
import com.aauelknight.learning.security.GatewayPrincipal;
import com.aauelknight.learning.service.EnrollmentService;
import com.aauelknight.learning.service.VideoProgressService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/lms")
public class LmsController {

    private static final String LEARNER_ROLES =
            "hasAnyRole('TAXPAYER','TAX_AGENT','MOR_STAFF','MANAGER')";

    private final EnrollmentService enrollmentService;
    private final VideoProgressService videoProgressService;

    public LmsController(EnrollmentService enrollmentService,
                         VideoProgressService videoProgressService) {
        this.enrollmentService = enrollmentService;
        this.videoProgressService = videoProgressService;
    }

    @GetMapping("/my-courses")
    @PreAuthorize(LEARNER_ROLES)
    public List<EnrollmentDto> myCourses(Authentication authentication) {
        return enrollmentService.getMyEnrollments(requireUserId(authentication));
    }

    @PostMapping("/enroll/{courseId}")
    @PreAuthorize(LEARNER_ROLES)
    public EnrollmentDto enroll(@PathVariable Long courseId, Authentication authentication) {
        return enrollmentService.enroll(requireUserId(authentication), courseId);
    }

    @GetMapping("/course/{courseId}/last-watched")
    @PreAuthorize(LEARNER_ROLES)
    public ResponseEntity<VideoProgressDto> getLastWatched(@PathVariable Long courseId, Authentication authentication) {
        VideoProgressDto result = videoProgressService.getLastWatched(requireUserId(authentication), courseId);
        if (result == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/course/{courseId}/progress")
    @PreAuthorize(LEARNER_ROLES)
    public CourseProgressDto courseProgress(@PathVariable Long courseId, Authentication authentication) {
        return enrollmentService.calculateProgress(requireUserId(authentication), courseId);
    }

    @GetMapping("/course/{courseId}/section/{sectionId}/unlocked")
    @PreAuthorize(LEARNER_ROLES)
    public ResponseEntity<Map<String, Boolean>> isSectionUnlocked(@PathVariable Long courseId,
                                                                  @PathVariable Long sectionId,
                                                                  Authentication authentication) {
        boolean unlocked = enrollmentService.isSectionUnlocked(requireUserId(authentication), courseId, sectionId);
        return ResponseEntity.ok(Map.of("unlocked", unlocked));
    }

    @GetMapping("/course/{courseId}/final-exam/unlocked")
    @PreAuthorize(LEARNER_ROLES)
    public ResponseEntity<Map<String, Boolean>> isFinalExamUnlocked(@PathVariable Long courseId,
                                                                    Authentication authentication) {
        boolean unlocked = enrollmentService.isFinalExamUnlocked(requireUserId(authentication), courseId);
        return ResponseEntity.ok(Map.of("unlocked", unlocked));
    }

    @PostMapping("/lesson/{lectureId}/complete")
    @PreAuthorize(LEARNER_ROLES)
    public CourseProgressDto completeLesson(@PathVariable Long lectureId, Authentication authentication) {
        return enrollmentService.markLectureComplete(requireUserId(authentication), lectureId);
    }

    @GetMapping("/my-completions/{courseId}")
    @PreAuthorize(LEARNER_ROLES)
    public List<CompletionDto> getMyCompletions(@PathVariable Long courseId, Authentication authentication) {
        return enrollmentService.getMyCompletions(requireUserId(authentication), courseId);
    }

    private Long requireUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof GatewayPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (principal.userId() == null || principal.userId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return Long.parseLong(principal.userId());
    }
}
