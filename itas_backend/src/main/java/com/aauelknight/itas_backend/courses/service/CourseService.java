package com.aauelknight.itas_backend.courses.service;
import com.aauelknight.itas_backend.courses.dto.response.CategoryDto;
import com.aauelknight.itas_backend.courses.dto.request.CourseCreateRequest;
import com.aauelknight.itas_backend.courses.dto.response.CourseDto;
import com.aauelknight.itas_backend.courses.dto.request.CourseRequest;
import com.aauelknight.itas_backend.courses.dto.response.CourseSectionDto;
import com.aauelknight.itas_backend.courses.dto.request.CourseSectionRequest;
import com.aauelknight.itas_backend.lecture.dto.response.LectureDto;
import com.aauelknight.itas_backend.lecture.dto.request.LectureRequest;
import com.aauelknight.itas_backend.courses.entity.Category;
import com.aauelknight.itas_backend.courses.entity.AudienceType;
import com.aauelknight.itas_backend.courses.entity.Course;
import com.aauelknight.itas_backend.courses.entity.CourseDifficulty;
import com.aauelknight.itas_backend.learning.entity.CourseEnrollment;
import com.aauelknight.itas_backend.courses.entity.CourseSection;
import com.aauelknight.itas_backend.lecture.entity.Lecture;
import com.aauelknight.itas_backend.lecture.entity.LectureType;
import com.aauelknight.itas_backend.auth.entity.User;
import com.aauelknight.itas_backend.exception.ResourceNotFoundException;
import com.aauelknight.itas_backend.storage.FileStorageService;
import com.aauelknight.itas_backend.util.SlugGenerator;
import com.aauelknight.itas_backend.courses.repository.CategoryRepository;
import com.aauelknight.itas_backend.courses.repository.CourseRepository;
import com.aauelknight.itas_backend.courses.repository.CourseSectionRepository;
import com.aauelknight.itas_backend.learning.repository.EnrollmentRepository;
import com.aauelknight.itas_backend.lecture.repository.LectureRepository;
import com.aauelknight.itas_backend.auth.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@Slf4j
public class CourseService {

    private final CourseRepository courseRepository;
    private final CategoryRepository categoryRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final LectureRepository lectureRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public CourseService(CourseRepository courseRepository,
                         CategoryRepository categoryRepository,
                         EnrollmentRepository enrollmentRepository,
                         CourseSectionRepository courseSectionRepository,
                         LectureRepository lectureRepository,
                         UserRepository userRepository,
                         FileStorageService fileStorageService) {
        this.courseRepository = courseRepository;
        this.categoryRepository = categoryRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.courseSectionRepository = courseSectionRepository;
        this.lectureRepository = lectureRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    public List<CourseDto> getAllPublished(Long userId) {
        List<Course> courses = courseRepository.findAllPublishedWithSections();
        Map<Long, CourseEnrollment> enrollmentMap = getEnrollmentMap(userId);
        return courses.stream()
                .map(course -> toCourseSummaryDto(course, enrollmentMap.get(course.getId())))
                .toList();
    }

    public List<CourseDto> getAllPublished() {
        return getAllPublished(null);
    }

    @Transactional(readOnly = true)
    public List<CourseDto> getAllAdminCourses() {
        return courseRepository.findAllNonArchived().stream()
                .map(course -> toCourseSummaryDto(course, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CourseDto> getAllCoursesAdmin() {
        return courseRepository.findAllNonArchived().stream()
                .map(course -> toCourseSummaryDto(course, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CourseDto> getAllCoursesWebAdmin() {
        return courseRepository.findAllIncludingArchived().stream()
                .map(course -> toCourseSummaryDto(course, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CourseDto> getAllPublishedForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        String userRole = user.getRole() != null ? user.getRole().getName() : "";
        List<Course> all = courseRepository.findAllPublished();

        return all.stream()
                .filter(course -> {
                    Set<AudienceType> audience = course.getTargetAudience();
                    if (audience == null || audience.isEmpty() || audience.contains(AudienceType.ALL)) {
                        return true;
                    }
                    return switch (userRole) {
                        case "TAXPAYER" -> audience.contains(AudienceType.TAXPAYER);
                        case "TAX_AGENT" -> audience.contains(AudienceType.TAX_AGENT);
                        case "MOR_STAFF" -> audience.contains(AudienceType.MOR_STAFF);
                        case "MANAGER" -> audience.contains(AudienceType.MANAGER);
                        default -> false;
                    };
                })
                .map(course -> toCourseSummaryDto(course, null))
                .collect(Collectors.toList());
    }

    @Transactional
    public CourseDto archiveCourse(Long courseId, String username) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        User archivedBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        course.setStatus("ARCHIVED");
        course.setPublished(false);
        course.setArchivedAt(LocalDateTime.now());
        course.setArchivedBy(archivedBy);

        return toCourseDetailDto(courseRepository.save(course), null);
    }

    @Transactional
    public CourseDto restoreCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        course.setStatus("DRAFT");
        course.setPublished(false);
        course.setArchivedAt(null);
        course.setArchivedBy(null);

        return toCourseDetailDto(courseRepository.save(course), null);
    }

    public CourseDto getBySlug(String slug, Long userId) {
        Course course = courseRepository.findBySlugWithSectionsAndLectures(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        CourseEnrollment enrollment = userId == null ? null
                : enrollmentRepository.findByUserIdAndCourseId(userId, course.getId()).orElse(null);
        return toCourseDetailDto(course, enrollment);
    }

    public CourseDto getBySlug(String slug) {
        return getBySlug(slug, null);
    }

    public CourseDto getBySlugAdmin(String slug, Long userId) {
        Course course = courseRepository.findBySlugWithSectionsAndLecturesAdmin(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        CourseEnrollment enrollment = userId == null ? null
                : enrollmentRepository.findByUserIdAndCourseId(userId, course.getId()).orElse(null);
        return toCourseDetailDto(course, enrollment);
    }

    public CourseDto getCourseByIdAdmin(Long courseId) {
        Course course = getCourseWithContent(courseId);
        return toCourseDetailDto(course, null);
    }

    @Transactional(readOnly = true)
    public CourseDto getCourse(Long courseId) {
        Course course = getCourseWithContent(courseId);
        return toCourseDetailDto(course, null);
    }

    public CourseDto getBySlugAdmin(String slug) {
        return getBySlugAdmin(slug, null);
    }

    public List<CourseDto> getCoursesByCategory(Long categoryId, Long userId) {
        List<Course> courses = courseRepository.findByPublishedTrueAndCategoryIdOrderByCreatedAtDesc(categoryId);
        Map<Long, CourseEnrollment> enrollmentMap = getEnrollmentMap(userId);
        return courses.stream()
                .map(course -> toCourseSummaryDto(course, enrollmentMap.get(course.getId())))
                .toList();
    }

    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(this::toCategoryDto)
                .toList();
    }

    @Transactional
    public CourseDto createCourse(CourseCreateRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        String slug = generateUniqueSlug(request.getSlug(), request.getTitle(), null);

        Course course = Course.builder()
                .title(request.getTitle())
                .slug(slug)
                .description(request.getDescription())
                .category(category)
                .difficulty(request.getDifficulty())
                .thumbnailUrl(request.getThumbnailUrl() != null ? request.getThumbnailUrl() : null)
                .targetAudience(request.getTargetAudience() == null || request.getTargetAudience().isEmpty()
                        ? Set.of(AudienceType.ALL)
                        : request.getTargetAudience())
                .published(false)
                .durationMinutes(0)
                .build();

        return toCourseDetailDto(courseRepository.save(course), null);
    }

    @Transactional
    public CourseDto updateCourse(Long courseId, CourseRequest req) {
        Course course = getCourseEntity(courseId);
        course.setTitle(req.getTitle());
        course.setSlug(resolveUpdatedSlug(course, req));
        course.setDescription(req.getDescription());

        if (req.getDifficulty() != null) {
            course.setDifficulty(req.getDifficulty());
        }

        if (req.getDurationMinutes() != null) {
            course.setDurationMinutes(req.getDurationMinutes());
        }

        if (req.getThumbnailUrl() != null && !req.getThumbnailUrl().isBlank()) {
            course.setThumbnailUrl(req.getThumbnailUrl());
        }

        if (req.getTargetAudience() != null && !req.getTargetAudience().isEmpty()) {
            course.setTargetAudience(req.getTargetAudience());
        } else {
            course.setTargetAudience(Set.of(AudienceType.ALL));
        }

        if (req.getCategoryId() != null) {
            Category category = categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
            course.setCategory(category);
        }

        courseRepository.save(course);

        Course refreshed = getCourseWithContent(courseId);
        return toCourseDetailDto(refreshed, null);
    }

    private String resolveUpdatedSlug(Course course, CourseRequest request) {
        String requestedSlug = request.getSlug();
        if (requestedSlug == null) {
            return course.getSlug();
        }

        String normalizedRequestedSlug = SlugGenerator.normalize(requestedSlug);
        if (normalizedRequestedSlug.isBlank()) {
            return generateUniqueSlug(requestedSlug, request.getTitle(), course.getId());
        }

        if (normalizedRequestedSlug.equals(course.getSlug())) {
            return course.getSlug();
        }

        return generateUniqueSlug(requestedSlug, request.getTitle(), course.getId());
    }

    private String generateUniqueSlug(String preferredSlug, String courseTitle, Long excludedCourseId) {
        String base = SlugGenerator.normalize(preferredSlug);
        if (base.isBlank()) {
            base = SlugGenerator.fallbackBase(courseTitle);
        }

        for (int attempt = 0; attempt < 25; attempt++) {
            String candidate = SlugGenerator.appendRandomSuffix(base);
            boolean exists = excludedCourseId == null
                    ? courseRepository.existsBySlug(candidate)
                    : courseRepository.existsBySlugAndIdNot(candidate, excludedCourseId);

            if (!exists) {
                return candidate;
            }
        }

        throw new ResponseStatusException(HttpStatus.CONFLICT, "Unable to generate a unique course slug");
    }

    @Transactional
    public CourseDto patchCourse(Long courseId, Map<String, Object> updates) {
        Course course = getCourseEntity(courseId);

        if (updates.containsKey("title")) {
            course.setTitle((String) updates.get("title"));
        }
        if (updates.containsKey("description")) {
            course.setDescription((String) updates.get("description"));
        }
        if (updates.containsKey("published")) {
            Object value = updates.get("published");
            if (value instanceof Boolean published) {
                course.setPublished(published);
            } else if (value instanceof String text) {
                course.setPublished(Boolean.parseBoolean(text));
            }
        }
        if (updates.containsKey("difficulty")) {
            Object value = updates.get("difficulty");
            if (value instanceof String text && !text.isBlank()) {
                course.setDifficulty(CourseDifficulty.valueOf(text.trim().toUpperCase()));
            }
        }
        if (updates.containsKey("durationMinutes")) {
            Object value = updates.get("durationMinutes");
            if (value instanceof Number number) {
                course.setDurationMinutes(number.intValue());
            } else if (value instanceof String text && !text.isBlank()) {
                course.setDurationMinutes(Integer.parseInt(text.trim()));
            }
        }
        if (updates.containsKey("thumbnailUrl")) {
            course.setThumbnailUrl((String) updates.get("thumbnailUrl"));
        }
        if (updates.containsKey("targetAudience")) {
            Object value = updates.get("targetAudience");
            if (value instanceof List<?> audienceList) {
                Set<AudienceType> audienceTypes = audienceList.stream()
                        .filter(String.class::isInstance)
                        .map(String.class::cast)
                        .map(text -> AudienceType.valueOf(text.trim().toUpperCase()))
                        .collect(Collectors.toSet());
                course.setTargetAudience(audienceTypes.isEmpty() ? Set.of(AudienceType.ALL) : audienceTypes);
            }
        }
        if (updates.containsKey("categoryId")) {
            Object value = updates.get("categoryId");
            Long categoryId = null;
            if (value instanceof Number number) {
                categoryId = number.longValue();
            } else if (value instanceof String text && !text.isBlank()) {
                categoryId = Long.parseLong(text.trim());
            }
            if (categoryId != null) {
                Category category = categoryRepository.findById(categoryId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
                course.setCategory(category);
            }
        }

        return toCourseDetailDto(courseRepository.save(course), null);
    }

    @Transactional
    public CourseSectionDto addSection(Long courseId, CourseSectionRequest request) {
        Course course = getCourseEntity(courseId);
        CourseSection section = CourseSection.builder()
                .course(course)
                .title(request.getTitle())
                .description(request.getDescription())
                .orderIndex(request.getOrderIndex())
                .build();
        return toCourseSectionDto(courseSectionRepository.save(section));
    }

    @Transactional
    public CourseSectionDto updateSection(Long courseId, Long sectionId, CourseSectionRequest request) {
        CourseSection section = getSection(courseId, sectionId);
        section.setTitle(request.getTitle());
        section.setDescription(request.getDescription());
        section.setOrderIndex(request.getOrderIndex());
        return toCourseSectionDto(courseSectionRepository.save(section));
    }

    @Transactional
    public void deleteSection(Long courseId, Long sectionId) {
        CourseSection section = getSection(courseId, sectionId);
        courseSectionRepository.delete(section);
    }

    @Transactional
    public LectureDto addLecture(Long courseId, Long sectionId, LectureRequest request) {
        CourseSection section = getSection(courseId, sectionId);
        Lecture lecture = Lecture.builder()
                .section(section)
                .title(request.getTitle())
                .description(request.getDescription())
                .type(request.getType())
                .orderIndex(request.getOrderIndex() == null ? 0 : request.getOrderIndex())
                .isPreview(Boolean.TRUE.equals(request.getIsPreview()))
                .content(request.getContent())
                .build();
        return toLectureDto(lectureRepository.save(lecture));
    }

    @Transactional
    public LectureDto updateLecture(Long courseId, Long sectionId, Long lectureId, LectureRequest request) {
        Lecture lecture = getLecture(sectionId, lectureId);
        validateLectureHierarchy(courseId, sectionId, lecture);

        lecture.setTitle(request.getTitle());
        lecture.setDescription(request.getDescription());
        lecture.setType(request.getType());
        lecture.setOrderIndex(request.getOrderIndex() == null ? 0 : request.getOrderIndex());
        lecture.setPreview(Boolean.TRUE.equals(request.getIsPreview()));
        lecture.setContent(request.getContent());
        return toLectureDto(lectureRepository.save(lecture));
    }

    @Transactional
    public void deleteLecture(Long courseId, Long sectionId, Long lectureId) {
        Lecture lecture = getLecture(sectionId, lectureId);
        validateLectureHierarchy(courseId, sectionId, lecture);
        lectureRepository.delete(lecture);
    }

    @Transactional
    public LectureDto uploadLectureFile(Long courseId, Long sectionId, Long lectureId, MultipartFile file) {
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new ResourceNotFoundException("Lecture not found: " + lectureId));
        validateLectureHierarchy(courseId, sectionId, lecture);

        log.info("=== UPLOAD SERVICE START ===");
        log.info("Storing file for lectureId={}", lectureId);
        log.info("Before upload - lecture type: {}, videoUrl: {}", lecture.getType(), lecture.getVideoUrl());

        String filePath = fileStorageService.storeLectureFile(courseId, sectionId, lectureId, file);
        log.info("File stored at path: {}", filePath);

        String name = Optional.ofNullable(file.getOriginalFilename())
                .orElse("")
                .toLowerCase();
        String type = Optional.ofNullable(file.getContentType())
                .orElse("")
                .toLowerCase();

        boolean isVideo = type.startsWith("video/")
                || name.endsWith(".mp4")
                || name.endsWith(".webm")
                || name.endsWith(".mov")
                || name.endsWith(".avi")
                || name.endsWith(".mkv");

        boolean isPdf = type.equals("application/pdf")
                || name.endsWith(".pdf");

        if (isPdf) {
            lecture.setPdfUrl(filePath);
            lecture.setVideoUrl(null);
            lecture.setType(LectureType.PDF);
        } else {
            lecture.setVideoUrl(filePath);
            lecture.setPdfUrl(null);
            lecture.setType(LectureType.VIDEO);
        }

        log.info("After setting - videoUrl: {}, pdfUrl: {}", lecture.getVideoUrl(), lecture.getPdfUrl());

        Lecture saved = lectureRepository.saveAndFlush(lecture);
        log.info("Lecture updated - videoUrl={}", lecture.getVideoUrl());
        log.info("Saved lecture - videoUrl: {}, pdfUrl: {}", saved.getVideoUrl(), saved.getPdfUrl());
        return toLectureDto(saved);
    }

    @Transactional
    public CourseDto setPublished(Long courseId, boolean published) {
        Course course = getCourseEntity(courseId);
        course.setPublished(published);
        course.setStatus(published ? "PUBLISHED" : "DRAFT");
        if (!published) {
            course.setArchivedAt(null);
            course.setArchivedBy(null);
        }
        return toCourseDetailDto(courseRepository.save(course), null);
    }

    @Transactional
    public void updateThumbnail(Long courseId, String url) {
        Course course = getCourseEntity(courseId);
        course.setThumbnailUrl(url);
        courseRepository.save(course);
    }

    @Transactional
    public CourseDto publishCourse(Long courseId) {
        try {
            Course course = getCourseEntity(courseId);

            if ("ARCHIVED".equals(course.getStatus())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Cannot publish an archived course. Restore it first.");
            }
            course.setStatus("PUBLISHED");
            course.setPublished(true);
            course.setArchivedAt(null);
            course.setArchivedBy(null);
            Course saved = courseRepository.save(course);
            log.info("Course {} published successfully", courseId);
            return toCourseDetailDto(saved, null);
        } catch (Exception ex) {
            log.error("Error publishing course {}: {}", courseId, ex.getMessage(), ex);
            throw ex;
        }
    }

    @Transactional
    public CourseDto unpublishCourse(Long courseId) {
        try {
            Course course = getCourseEntity(courseId);
            course.setStatus("DRAFT");
            course.setPublished(false);
            Course saved = courseRepository.save(course);
            log.info("Course {} unpublished successfully", courseId);
            return toCourseDetailDto(saved, null);
        } catch (Exception ex) {
            log.error("Error unpublishing course {}: {}", courseId, ex.getMessage(), ex);
            throw ex;
        }
    }

    private Course getCourseEntity(Long courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    private Course getCourseWithContent(Long id) {
        return courseRepository.findByIdWithSectionsAndLectures(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found: " + id));
    }

    private CourseSection getSection(Long courseId, Long sectionId) {
        return courseSectionRepository.findByIdAndCourseId(sectionId, courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));
    }

    private Lecture getLecture(Long sectionId, Long lectureId) {
        return lectureRepository.findByIdAndSectionId(lectureId, sectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lecture not found"));
    }

    private void validateLectureHierarchy(Long courseId, Long sectionId, Lecture lecture) {
        if (!lecture.getSection().getId().equals(sectionId)
                || !lecture.getSection().getCourse().getId().equals(courseId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lecture not found");
        }
    }

    private Map<Long, CourseEnrollment> getEnrollmentMap(Long userId) {
        if (userId == null) {
            return Map.of();
        }
        return enrollmentRepository.findByUserIdOrderByEnrolledAtDesc(userId).stream()
                .collect(Collectors.toMap(enrollment -> enrollment.getCourse().getId(), Function.identity(), (a, b) -> a));
    }

    private CourseDto toCourseSummaryDto(Course course, CourseEnrollment enrollment) {
        Category category = course.getCategory();
        return CourseDto.builder()
                .id(course.getId())
                .title(course.getTitle())
                .slug(course.getSlug())
                .description(course.getDescription())
                .difficulty(course.getDifficulty())
                .durationMinutes(course.getDurationMinutes())
                .thumbnailUrl(course.getThumbnailUrl())
                .published(course.isPublished())
                .status(course.getStatus())
                .archivedAt(course.getArchivedAt() != null ? course.getArchivedAt().toString() : null)
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .categoryId(category != null ? category.getId() : null)
                .categoryName(category != null ? category.getName() : null)
                .categoryDescription(category != null ? category.getDescription() : null)
                .targetAudience(course.getTargetAudience())
                .enrolled(enrollment != null)
                .progressPercent(enrollment != null && enrollment.getProgressPercent() != null ? enrollment.getProgressPercent() : 0.0)
                .sections(List.of())
                .build();
    }

    private CourseDto toCourseDetailDto(Course course, CourseEnrollment enrollment) {
        List<CourseSectionDto> sections = new ArrayList<>(course.getSections()).stream()
                .sorted(Comparator.comparing(CourseSection::getOrderIndex))
                .map(this::toCourseSectionDto)
                .toList();

        return CourseDto.builder()
                .id(course.getId())
                .title(course.getTitle())
                .slug(course.getSlug())
                .description(course.getDescription())
                .difficulty(course.getDifficulty())
                .durationMinutes(course.getDurationMinutes())
                .thumbnailUrl(course.getThumbnailUrl())
                .published(course.isPublished())
                .status(course.getStatus())
                .archivedAt(course.getArchivedAt() != null ? course.getArchivedAt().toString() : null)
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .categoryId(course.getCategory() != null ? course.getCategory().getId() : null)
                .categoryName(course.getCategory() != null ? course.getCategory().getName() : null)
                .categoryDescription(course.getCategory() != null ? course.getCategory().getDescription() : null)
                .targetAudience(course.getTargetAudience())
                .enrolled(enrollment != null)
                .progressPercent(enrollment != null && enrollment.getProgressPercent() != null ? enrollment.getProgressPercent() : 0.0)
                .sections(sections)
                .build();
    }

    @Transactional(readOnly = true)
    public List<CourseDto> getArchivedCourses() {
        return courseRepository.findAllArchived().stream()
                .map(course -> toCourseSummaryDto(course, null))
                .collect(Collectors.toList());
    }

    private CourseSectionDto toCourseSectionDto(CourseSection section) {
        List<LectureDto> lectures = new ArrayList<>(section.getLectures()).stream()
                .sorted(Comparator.comparing(Lecture::getOrderIndex))
                .map(this::toLectureDto)
                .toList();

        return CourseSectionDto.builder()
                .id(section.getId())
                .title(section.getTitle())
                .description(section.getDescription())
                .orderIndex(section.getOrderIndex())
                .lectures(lectures)
                .build();
    }

    private LectureDto toLectureDto(Lecture lecture) {
        return LectureDto.builder()
                .id(lecture.getId())
                .title(lecture.getTitle())
                .description(lecture.getDescription())
                .type(lecture.getType())
                .videoUrl(lecture.getVideoUrl())
                .pdfUrl(lecture.getPdfUrl())
                .content(lecture.getContent())
                .durationSeconds(lecture.getDurationSeconds())
                .orderIndex(lecture.getOrderIndex())
                .preview(lecture.isPreview())
                .build();
    }

    private CategoryDto toCategoryDto(Category category) {
        return CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .build();
    }

}

