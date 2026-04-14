package com.aauelknight.itas_backend.courses.controller;
import com.aauelknight.itas_backend.courses.dto.response.CategoryDto;
import com.aauelknight.itas_backend.courses.dto.request.CourseCreateRequest;
import com.aauelknight.itas_backend.courses.dto.response.CourseDto;
import com.aauelknight.itas_backend.courses.dto.request.CourseRequest;
import com.aauelknight.itas_backend.courses.dto.response.CourseSectionDto;
import com.aauelknight.itas_backend.courses.dto.request.CourseSectionRequest;
import com.aauelknight.itas_backend.lecture.dto.response.LectureDto;
import com.aauelknight.itas_backend.lecture.dto.request.LectureRequest;
import com.aauelknight.itas_backend.exception.ResourceNotFoundException;
import com.aauelknight.itas_backend.auth.entity.User;
import com.aauelknight.itas_backend.storage.FileStorageService;
import jakarta.validation.Valid;
import com.aauelknight.itas_backend.courses.service.CourseService;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/courses")
@Slf4j
public class CourseController {

    private final CourseService courseService;
    private final FileStorageService fileStorageService;

    public CourseController(CourseService courseService, FileStorageService fileStorageService) {
        this.courseService = courseService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('TAXPAYER','CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN','WEB_ADMIN','TAX_AGENT','MOR_STAFF','MANAGER')")
    public ResponseEntity<List<CourseDto>> getAllCourses(
            @RequestParam(required = false) Boolean admin,
            @RequestParam(required = false) Boolean includeArchived,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.ok(List.of());
        }

        boolean isWebAdmin = hasRole(userDetails, "ROLE_WEB_ADMIN");
        boolean isAdmin = isWebAdmin
                || hasRole(userDetails, "ROLE_CONTENT_ADMIN")
                || hasRole(userDetails, "ROLE_TRAINING_ADMIN")
                || hasRole(userDetails, "ROLE_SYSTEM_ADMIN");

        if (Boolean.TRUE.equals(includeArchived)) {
            if (!isWebAdmin) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only WEB_ADMIN can include archived courses");
            }
            return ResponseEntity.ok(courseService.getAllAdminCourses());
        }

        if (Boolean.TRUE.equals(admin)) {
            if (!isAdmin) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can request admin courses");
            }
            return ResponseEntity.ok(courseService.getAllCoursesAdmin());
        }

        return ResponseEntity.ok(courseService.getAllPublishedForUser(userDetails.getUsername()));
    }

    @GetMapping("/categories")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CategoryDto>> getAllCategories() {
        return ResponseEntity.ok(courseService.getAllCategories());
    }

    @GetMapping("/{slug}")
    @PreAuthorize("hasAnyRole('TAXPAYER','TAX_AGENT','MOR_STAFF','MANAGER','CONTENT_ADMIN')")
    public CourseDto getCourseBySlug(@PathVariable String slug, Authentication authentication) {
        return courseService.getBySlug(slug, extractUserId(authentication));
    }

    @GetMapping("/id/{id}")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public CourseDto getCourseById(@PathVariable Long id) {
        return courseService.getCourse(id);
    }

    @GetMapping("/archived")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','WEB_ADMIN')")
    public ResponseEntity<List<CourseDto>> getArchived() {
        return ResponseEntity.ok(courseService.getArchivedCourses());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','WEB_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<CourseDto> createCourse(@Valid @RequestBody CourseCreateRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(courseService.createCourse(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<CourseDto> updateCourse(@PathVariable Long id,
            @Valid @RequestBody CourseRequest request) {
        return ResponseEntity.ok(courseService.updateCourse(id, request));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<CourseDto> patchCourse(@PathVariable Long id,
            @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(courseService.patchCourse(id, updates));
    }

    @PostMapping("/{id}/sections")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public CourseSectionDto addSection(@PathVariable Long id, @Valid @RequestBody CourseSectionRequest request) {
        return courseService.addSection(id, request);
    }

    @PutMapping({ "/{id}/sections/{sectionId}", "/{id}/sections/{sectionId}/" })
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<CourseSectionDto> updateSection(@PathVariable Long id,
            @PathVariable Long sectionId,
            @Valid @RequestBody CourseSectionRequest request) {
        return ResponseEntity.ok(courseService.updateSection(id, sectionId, request));
    }

    @DeleteMapping("/{id}/sections/{sectionId}")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public void deleteSection(@PathVariable Long id, @PathVariable Long sectionId) {
        courseService.deleteSection(id, sectionId);
    }

    @PostMapping("/{id}/sections/{sectionId}/lectures")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public LectureDto addLecture(@PathVariable Long id,
            @PathVariable Long sectionId,
            @Valid @RequestBody LectureRequest request) {
        return courseService.addLecture(id, sectionId, request);
    }

    @PutMapping({ "/{id}/sections/{sectionId}/lectures/{lectureId}",
            "/{id}/sections/{sectionId}/lectures/{lectureId}/" })
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<LectureDto> updateLecture(@PathVariable Long id,
            @PathVariable Long sectionId,
            @PathVariable Long lectureId,
            @Valid @RequestBody LectureRequest request) {
        return ResponseEntity.ok(courseService.updateLecture(id, sectionId, lectureId, request));
    }

    @DeleteMapping("/{id}/sections/{sectionId}/lectures/{lectureId}")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public void deleteLecture(@PathVariable Long id,
            @PathVariable Long sectionId,
            @PathVariable Long lectureId) {
        courseService.deleteLecture(id, sectionId, lectureId);
    }

    @PostMapping(
            value = "/{courseId}/sections/{sectionId}/lectures/{lectureId}/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','WEB_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<LectureDto> uploadLectureFile(@PathVariable Long courseId,
            @PathVariable Long sectionId,
            @PathVariable Long lectureId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(courseService.uploadLectureFile(courseId, sectionId, lectureId, file));
    }

    @PostMapping("/{id}/thumbnail")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, String>> uploadThumbnail(@PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        String thumbnailUrl = courseService.uploadThumbnail(id, file);
        return ResponseEntity.ok(Map.of("thumbnailUrl", thumbnailUrl));
    }

    @PutMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','WEB_ADMIN')")
    public ResponseEntity<CourseDto> publish(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.publishCourse(id));
    }

    @PutMapping("/{id}/unpublish")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','WEB_ADMIN')")
    public ResponseEntity<CourseDto> unpublish(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.unpublishCourse(id));
    }

    @PutMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','WEB_ADMIN')")
    public ResponseEntity<CourseDto> archive(@PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(courseService.archiveCourse(id, userDetails.getUsername()));
    }

    @PutMapping("/{id}/restore")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','WEB_ADMIN')")
    public ResponseEntity<CourseDto> restore(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.restoreCourse(id));
    }

    private boolean hasRole(UserDetails userDetails, String role) {
        return userDetails.getAuthorities().stream()
                .anyMatch(authority -> role.equals(authority.getAuthority()));
    }

    private Long extractUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return null;
        }
        return user.getId();
    }
}

