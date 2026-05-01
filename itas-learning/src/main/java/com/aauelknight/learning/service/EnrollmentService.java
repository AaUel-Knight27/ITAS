package com.aauelknight.learning.service;

import com.aauelknight.learning.client.AuthServiceClient;
import com.aauelknight.learning.client.CourseServiceClient;
import com.aauelknight.learning.dto.CourseInfoDto;
import com.aauelknight.learning.dto.LectureInfoDto;
import com.aauelknight.learning.dto.SectionInfoDto;
import com.aauelknight.learning.dto.UserInfoDto;
import com.aauelknight.learning.dto.response.CompletionDto;
import com.aauelknight.learning.dto.response.CourseProgressDto;
import com.aauelknight.learning.dto.response.EnrollmentDto;
import com.aauelknight.learning.entity.Assessment;
import com.aauelknight.learning.entity.CourseEnrollment;
import com.aauelknight.learning.entity.EnrollmentStatus;
import com.aauelknight.learning.entity.LectureCompletion;
import com.aauelknight.learning.repository.AssessmentAttemptRepository;
import com.aauelknight.learning.repository.AssessmentRepository;
import com.aauelknight.learning.repository.EnrollmentRepository;
import com.aauelknight.learning.repository.LectureCompletionRepository;
import com.aauelknight.learning.repository.VideoProgressRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EnrollmentService extends GatewayAwareService {

    private final EnrollmentRepository enrollmentRepository;
    private final LectureCompletionRepository lectureCompletionRepository;
    private final VideoProgressRepository videoProgressRepository;
    private final AssessmentRepository assessmentRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final AuthServiceClient authServiceClient;
    private final CourseServiceClient courseServiceClient;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                             LectureCompletionRepository lectureCompletionRepository,
                             VideoProgressRepository videoProgressRepository,
                             AssessmentRepository assessmentRepository,
                             AssessmentAttemptRepository attemptRepository,
                             AuthServiceClient authServiceClient,
                             CourseServiceClient courseServiceClient) {
        this.enrollmentRepository = enrollmentRepository;
        this.lectureCompletionRepository = lectureCompletionRepository;
        this.videoProgressRepository = videoProgressRepository;
        this.assessmentRepository = assessmentRepository;
        this.attemptRepository = attemptRepository;
        this.authServiceClient = authServiceClient;
        this.courseServiceClient = courseServiceClient;
    }

    @Transactional
    public EnrollmentDto enroll(Long userId, Long courseId) {
        UserInfoDto user = authServiceClient.getUserById(userId);
        CourseInfoDto course = courseServiceClient.getCourse(courseId);
        if (course == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }
        if (Boolean.FALSE.equals(course.getPublished())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course is not published");
        }

        CourseEnrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseGet(() -> enrollmentRepository.save(CourseEnrollment.builder()
                        .userId(user.getId())
                        .courseId(courseId)
                        .status(EnrollmentStatus.ACTIVE)
                        .progressPercent(0.0)
                        .build()));

        if (enrollment.getStatus() == EnrollmentStatus.CANCELLED) {
            enrollment.setStatus(EnrollmentStatus.ACTIVE);
            enrollment.setCompletedAt(null);
            enrollment.setProgressPercent(0.0);
            enrollmentRepository.save(enrollment);
        }

        return toEnrollmentDto(enrollment, course);
    }

    @Transactional(readOnly = true)
    public boolean isEnrolled(Long userId, Long courseId) {
        return enrollmentRepository.existsByUserIdAndCourseIdAndStatusIn(
                userId,
                courseId,
                List.of(EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED));
    }

    @Transactional(readOnly = true)
    public List<EnrollmentDto> getMyEnrollments(Long userId) {
        return enrollmentRepository.findByUserIdOrderByEnrolledAtDesc(userId).stream()
                .map(enrollment -> toEnrollmentDto(enrollment, courseServiceClient.getCourse(enrollment.getCourseId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CourseProgressDto> getAllCourseProgress(Long userId) {
        return enrollmentRepository.findByUserIdOrderByEnrolledAtDesc(userId).stream()
                .map(enrollment -> calculateProgress(userId, enrollment.getCourseId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CompletionDto> getMyCompletions(Long userId, Long courseId) {
        List<Long> lectureIds = getTrackableLectures(courseId).stream().map(LectureInfoDto::getId).toList();
        return lectureCompletionRepository.findByUserIdAndLectureIdIn(userId, lectureIds).stream()
                .map(completion -> CompletionDto.builder()
                        .lectureId(completion.getLectureId())
                        .completed(true)
                        .completedAt(completion.getCompletedAt())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isSectionUnlocked(Long userId, Long courseId, Long sectionId) {
        List<SectionInfoDto> sections = sortedSections(courseServiceClient.getCourseSections(courseId));
        if (sections.isEmpty()) {
            return true;
        }
        if (sections.get(0).getId().equals(sectionId)) {
            return true;
        }

        int targetIndex = -1;
        for (int i = 0; i < sections.size(); i++) {
            if (sections.get(i).getId().equals(sectionId)) {
                targetIndex = i;
                break;
            }
        }

        if (targetIndex < 0) {
            return false;
        }

        SectionInfoDto previousSection = sections.get(targetIndex - 1);
        for (LectureInfoDto lecture : sortedLectures(previousSection.getLectures())) {
            if (isQuizLecture(lecture)) {
                continue;
            }
            if (!lectureCompletionRepository.existsByUserIdAndLectureId(userId, lecture.getId())) {
                return false;
            }
        }

        Optional<Assessment> previousSectionAssessment =
                assessmentRepository.findByCourseIdAndSectionId(courseId, previousSection.getId());
        if (previousSectionAssessment.isPresent()) {
            boolean passed = attemptRepository.existsByAssessmentIdAndUserIdAndPassedTrue(
                    previousSectionAssessment.get().getId(), userId);
            if (!passed) {
                return false;
            }
        }

        return true;
    }

    @Transactional(readOnly = true)
    public boolean isFinalExamUnlocked(Long userId, Long courseId) {
        List<SectionInfoDto> sections = sortedSections(courseServiceClient.getCourseSections(courseId));
        for (SectionInfoDto section : sections) {
            if (!isSectionUnlocked(userId, courseId, section.getId())) {
                return false;
            }
            for (LectureInfoDto lecture : sortedLectures(section.getLectures())) {
                if (isQuizLecture(lecture)) {
                    continue;
                }
                if (!lectureCompletionRepository.existsByUserIdAndLectureId(userId, lecture.getId())) {
                    return false;
                }
            }
        }
        return true;
    }

    @Transactional
    public CourseProgressDto calculateProgress(Long userId, Long courseId) {
        CourseEnrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Enrollment not found"));

        List<SectionInfoDto> sections = sortedSections(courseServiceClient.getCourseSections(courseId));
        int totalLectures = 0;
        int completedLectures = 0;
        List<CourseProgressDto.SectionProgress> sectionProgresses = new ArrayList<>();

        for (SectionInfoDto section : sections) {
            List<LectureInfoDto> trackableLectures = sortedLectures(section.getLectures()).stream()
                    .filter(lecture -> !isQuizLecture(lecture))
                    .toList();

            int sectionTotal = trackableLectures.size();
            int sectionCompleted = 0;
            for (LectureInfoDto lecture : trackableLectures) {
                if (lectureCompletionRepository.existsByUserIdAndLectureId(userId, lecture.getId())) {
                    sectionCompleted++;
                }
            }

            totalLectures += sectionTotal;
            completedLectures += sectionCompleted;

            sectionProgresses.add(CourseProgressDto.SectionProgress.builder()
                    .sectionId(section.getId())
                    .sectionTitle(section.getTitle())
                    .totalLectures(sectionTotal)
                    .completedLectures(sectionCompleted)
                    .progressPercent(sectionTotal > 0
                            ? (int) Math.round(sectionCompleted * 100.0 / sectionTotal)
                            : 0)
                    .unlocked(isSectionUnlocked(userId, courseId, section.getId()))
                    .build());
        }

        double progressPercent = totalLectures > 0
                ? (double) Math.round(completedLectures * 100.0 / totalLectures)
                : 0.0;

        enrollment.setProgressPercent(progressPercent);
        if (progressPercent >= 100.0) {
            enrollment.setStatus(EnrollmentStatus.COMPLETED);
            if (enrollment.getCompletedAt() == null) {
                enrollment.setCompletedAt(LocalDateTime.now());
            }
        } else {
            enrollment.setStatus(EnrollmentStatus.ACTIVE);
            enrollment.setCompletedAt(null);
        }
        enrollmentRepository.save(enrollment);

        return CourseProgressDto.builder()
                .courseId(courseId)
                .totalLectures(totalLectures)
                .completedLectures(completedLectures)
                .progressPercent(progressPercent)
                .nextRecommendedLectureId(findNextLecture(userId, sections))
                .sectionProgresses(sectionProgresses)
                .build();
    }

    @Transactional
    public CourseProgressDto markLectureComplete(Long userId, Long lectureId) {
        LectureInfoDto lecture = courseServiceClient.getLecture(lectureId);
        if (lecture.getCourseId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Lecture course context is missing");
        }

        if (!isEnrolled(userId, lecture.getCourseId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not enrolled in this course");
        }

        LectureCompletion completion = lectureCompletionRepository.findByUserIdAndLectureId(userId, lectureId)
                .orElseGet(() -> LectureCompletion.builder()
                        .userId(userId)
                        .lectureId(lectureId)
                        .build());
        completion.setCompletedAt(LocalDateTime.now());
        lectureCompletionRepository.save(completion);

        return calculateProgress(userId, lecture.getCourseId());
    }

    @Transactional
    public void markComplete(Long userId, Long courseId) {
        CourseEnrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Enrollment not found"));
        enrollment.setStatus(EnrollmentStatus.COMPLETED);
        enrollment.setProgressPercent(100.0);
        if (enrollment.getCompletedAt() == null) {
            enrollment.setCompletedAt(LocalDateTime.now());
        }
        enrollmentRepository.save(enrollment);
    }

    public long countCompletedEnrollments() {
        return enrollmentRepository.countByStatus(EnrollmentStatus.COMPLETED);
    }

    private List<LectureInfoDto> getTrackableLectures(Long courseId) {
        return courseServiceClient.getCourseSections(courseId).stream()
                .sorted(Comparator.comparing(section -> safeOrder(section.getOrderIndex())))
                .flatMap(section -> sortedLectures(section.getLectures()).stream())
                .filter(lecture -> !isQuizLecture(lecture))
                .toList();
    }

    private Long findNextLecture(Long userId, List<SectionInfoDto> sections) {
        for (SectionInfoDto section : sections) {
            for (LectureInfoDto lecture : sortedLectures(section.getLectures())) {
                if (isQuizLecture(lecture)) {
                    continue;
                }
                if (!lectureCompletionRepository.existsByUserIdAndLectureId(userId, lecture.getId())) {
                    return lecture.getId();
                }
            }
        }
        return null;
    }

    private EnrollmentDto toEnrollmentDto(CourseEnrollment enrollment, CourseInfoDto course) {
        String thumbnailUrl = course != null ? course.getThumbnailUrl() : null;
        return EnrollmentDto.builder()
                .id(enrollment.getId())
                .courseId(enrollment.getCourseId())
                .courseTitle(course != null ? course.getTitle() : null)
                .courseSlug(course != null ? course.getSlug() : null)
                .courseThumbnail(thumbnailUrl)
                .courseThumbnailUrl(thumbnailUrl)
                .thumbnailUrl(thumbnailUrl)
                .status(enrollment.getStatus())
                .progressPercent(enrollment.getProgressPercent())
                .lastLectureId(resolveLastLectureId(enrollment.getUserId(), enrollment.getCourseId()))
                .enrolledAt(enrollment.getEnrolledAt())
                .completedAt(enrollment.getCompletedAt())
                .build();
    }

    private Long resolveLastLectureId(Long userId, Long courseId) {
        List<Long> lectureIds = courseServiceClient.getCourseLectures(courseId).stream()
                .map(LectureInfoDto::getId)
                .toList();
        if (lectureIds.isEmpty()) {
            return null;
        }

        return lectureCompletionRepository.findByUserIdAndLectureIdIn(userId, lectureIds).stream()
                .max(Comparator.comparing(LectureCompletion::getCompletedAt))
                .map(LectureCompletion::getLectureId)
                .or(() -> videoProgressRepository.findTopByUserIdAndLectureIdInOrderByLastWatchedAtDesc(userId, lectureIds)
                        .map(progress -> progress.getLectureId()))
                .orElseGet(() -> lectureIds.getFirst());
    }

    private List<SectionInfoDto> sortedSections(List<SectionInfoDto> sections) {
        return sections.stream()
                .sorted(Comparator.comparing(section -> safeOrder(section.getOrderIndex())))
                .toList();
    }

    private List<LectureInfoDto> sortedLectures(List<LectureInfoDto> lectures) {
        if (lectures == null) {
            return List.of();
        }
        return lectures.stream()
                .sorted(Comparator.comparing(lecture -> safeOrder(lecture.getOrderIndex())))
                .toList();
    }

    private boolean isQuizLecture(LectureInfoDto lecture) {
        return lecture != null && lecture.getType() != null && "QUIZ".equalsIgnoreCase(lecture.getType());
    }

    private Integer safeOrder(Integer value) {
        return value != null ? value : 0;
    }
}
