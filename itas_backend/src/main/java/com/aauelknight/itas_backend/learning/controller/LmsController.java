package com.aauelknight.itas_backend.learning.controller;
import com.aauelknight.itas_backend.learning.dto.response.AssessmentDto;
import com.aauelknight.itas_backend.learning.dto.response.CompletionDto;
import com.aauelknight.itas_backend.learning.dto.response.CourseProgressDto;
import com.aauelknight.itas_backend.learning.dto.request.EnrollRequest;
import com.aauelknight.itas_backend.learning.dto.response.EnrollmentDto;
import com.aauelknight.itas_backend.lecture.dto.response.VideoProgressDto;
import com.aauelknight.itas_backend.lecture.dto.request.VideoProgressRequest;
import com.aauelknight.itas_backend.auth.entity.User;
import com.aauelknight.itas_backend.learning.service.AssessmentService;
import com.aauelknight.itas_backend.learning.service.EnrollmentService;
import com.aauelknight.itas_backend.learning.service.VideoProgressService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/lms")
public class LmsController {

    private final EnrollmentService enrollmentService;
    private final AssessmentService assessmentService;
    private final VideoProgressService videoProgressService;

    public LmsController(EnrollmentService enrollmentService,
                         AssessmentService assessmentService,
                         VideoProgressService videoProgressService) {
        this.enrollmentService = enrollmentService;
        this.assessmentService = assessmentService;
        this.videoProgressService = videoProgressService;
    }

    @PostMapping("/enroll")
    @PreAuthorize("hasAnyRole('TAXPAYER','TAX_AGENT','MOR_STAFF','MANAGER','CONTENT_ADMIN','TRAINING_ADMIN','WEB_ADMIN','SYSTEM_ADMIN')")
    public EnrollmentDto enroll(@Valid @RequestBody EnrollRequest request, Authentication authentication) {
        Long userId = requireUserId(authentication);
        return enrollmentService.enroll(userId, request.getCourseId());
    }

    @GetMapping("/my-courses")
    @PreAuthorize("hasAnyRole('TAXPAYER','TAX_AGENT','MOR_STAFF','MANAGER','CONTENT_ADMIN','TRAINING_ADMIN','WEB_ADMIN','SYSTEM_ADMIN')")
    public List<EnrollmentDto> myCourses(Authentication authentication) {
        return enrollmentService.getMyEnrollments(requireUserId(authentication));
    }

    @GetMapping({"/course-progress/{courseId}", "/course/{courseId}/progress"})
    @PreAuthorize("hasAnyRole('TAXPAYER','TAX_AGENT','MOR_STAFF','MANAGER','CONTENT_ADMIN','TRAINING_ADMIN','WEB_ADMIN','SYSTEM_ADMIN')")
    public CourseProgressDto courseProgress(@PathVariable Long courseId, Authentication authentication) {
        return enrollmentService.calculateProgress(requireUserId(authentication), courseId);
    }

    @GetMapping("/course/{courseId}/section/{sectionId}/unlocked")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> isSectionUnlocked(@PathVariable Long courseId,
                                                                  @PathVariable Long sectionId,
                                                                  Authentication authentication) {
        boolean unlocked = enrollmentService.isSectionUnlocked(requireUserId(authentication), courseId, sectionId);
        return ResponseEntity.ok(Map.of("unlocked", unlocked));
    }

    @GetMapping("/my-completions/{courseId}")
    @PreAuthorize("isAuthenticated()")
    public List<CompletionDto> getMyCompletions(@PathVariable Long courseId,
                                                @AuthenticationPrincipal UserDetails userDetails) {
        return enrollmentService.getMyCompletions(courseId, userDetails.getUsername());
    }

    @GetMapping("/course-progress")
    @PreAuthorize("hasAnyRole('TAXPAYER','TAX_AGENT','MOR_STAFF','MANAGER','CONTENT_ADMIN','TRAINING_ADMIN','WEB_ADMIN','SYSTEM_ADMIN')")
    public List<CourseProgressDto> courseProgressByQuery(Authentication authentication) {
        return enrollmentService.getAllCourseProgress(requireUserId(authentication));
    }

    @PostMapping("/lesson/{id}/complete")
    @PreAuthorize("hasAnyRole('TAXPAYER','TAX_AGENT','MOR_STAFF','MANAGER','CONTENT_ADMIN','TRAINING_ADMIN','WEB_ADMIN','SYSTEM_ADMIN')")
    public CourseProgressDto completeLesson(@PathVariable("id") Long lectureId, Authentication authentication) {
        return enrollmentService.markLectureComplete(requireUserId(authentication), lectureId);
    }

    @GetMapping("/assessment/lecture/{lectureId}")
    @PreAuthorize("isAuthenticated()")
    public AssessmentDto getByLecture(@PathVariable Long lectureId) {
        return assessmentService.getByLectureId(lectureId);
    }

    @GetMapping("/assessment/course/{courseId}")
    @PreAuthorize("isAuthenticated()")
    public AssessmentDto getByCourse(@PathVariable Long courseId) {
        return assessmentService.getByCourseId(courseId);
    }

    @PostMapping("/video/{id}/progress")
    @PreAuthorize("hasAnyRole('TAXPAYER','TAX_AGENT','MOR_STAFF','MANAGER')")
    public ResponseEntity<Void> saveVideoProgress(@PathVariable("id") Long lectureId,
                                                  @Valid @RequestBody VideoProgressRequest request,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        videoProgressService.saveProgress(lectureId, request, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/video/{lectureId}/progress")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VideoProgressDto> getProgress(@PathVariable Long lectureId,
                                                        @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(videoProgressService.getProgress(lectureId, userDetails.getUsername()));
    }

    @GetMapping("/course/{courseId}/last-watched")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VideoProgressDto> getLastWatched(@PathVariable Long courseId,
                                                           @AuthenticationPrincipal UserDetails userDetails) {
        VideoProgressDto result = videoProgressService.getLastWatched(courseId, userDetails.getUsername());
        if (result == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(result);
    }

    private Long requireUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return user.getId();
    }
}

