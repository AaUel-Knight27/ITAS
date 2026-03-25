package com.aauelknight.itas_backend.controller;

import com.aauelknight.itas_backend.dto.CourseProgressDto;
import com.aauelknight.itas_backend.dto.EnrollRequest;
import com.aauelknight.itas_backend.dto.EnrollmentDto;
import com.aauelknight.itas_backend.dto.VideoProgressRequest;
import com.aauelknight.itas_backend.entity.User;
import com.aauelknight.itas_backend.entity.VideoProgress;
import com.aauelknight.itas_backend.service.EnrollmentService;
import com.aauelknight.itas_backend.service.VideoProgressService;
import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/lms")
public class LmsController {

    private final EnrollmentService enrollmentService;
    private final VideoProgressService videoProgressService;

    public LmsController(EnrollmentService enrollmentService, VideoProgressService videoProgressService) {
        this.enrollmentService = enrollmentService;
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

    @PostMapping("/content/video/{id}/progress")
    public Map<String, Object> saveVideoProgress(@PathVariable("id") Long lectureId,
                                                 @Valid @RequestBody VideoProgressRequest request,
                                                 Authentication authentication) {
        VideoProgress progress = videoProgressService.save(
                requireUserId(authentication),
                lectureId,
                request.getWatchedSeconds(),
                request.getLastPosition());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("lectureId", lectureId);
        response.put("watchedSeconds", progress.getWatchedSeconds());
        response.put("completionPercentage", progress.getCompletionPercentage());
        response.put("lastPosition", progress.getLastPosition());
        response.put("updatedAt", progress.getUpdatedAt());
        return response;
    }

    private Long requireUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return user.getId();
    }
}
