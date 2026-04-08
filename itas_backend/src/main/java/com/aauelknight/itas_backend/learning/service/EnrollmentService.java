package com.aauelknight.itas_backend.learning.service;

import com.aauelknight.itas_backend.learning.dto.response.CompletionDto;
import com.aauelknight.itas_backend.learning.dto.response.CourseProgressDto;
import com.aauelknight.itas_backend.learning.dto.response.EnrollmentDto;
import com.aauelknight.itas_backend.courses.entity.Course;
import com.aauelknight.itas_backend.courses.entity.CourseSection;
import com.aauelknight.itas_backend.learning.entity.Assessment;
import com.aauelknight.itas_backend.learning.entity.CourseEnrollment;
import com.aauelknight.itas_backend.learning.entity.EnrollmentStatus;
import com.aauelknight.itas_backend.learning.repository.*;
import com.aauelknight.itas_backend.lecture.entity.Lecture;
import com.aauelknight.itas_backend.lecture.entity.LectureType;
import com.aauelknight.itas_backend.auth.entity.User;
import com.aauelknight.itas_backend.courses.repository.CourseRepository;
import com.aauelknight.itas_backend.lecture.repository.LectureRepository;
import com.aauelknight.itas_backend.auth.repository.UserRepository;

import java.util.ArrayList;
import java.util.Comparator;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.aauelknight.itas_backend.learning.entity.LectureCompletion;
@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final LectureRepository lectureRepository;
    private final LectureCompletionRepository lectureCompletionRepository;
    private final VideoProgressRepository videoProgressRepository;
    private final AssessmentRepository assessmentRepository;
    private final AssessmentAttemptRepository attemptRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                             UserRepository userRepository,
                             CourseRepository courseRepository,
                             LectureRepository lectureRepository,
                             LectureCompletionRepository lectureCompletionRepository,
                             VideoProgressRepository videoProgressRepository,
                             AssessmentRepository assessmentRepository,
                             AssessmentAttemptRepository attemptRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.lectureRepository = lectureRepository;
        this.lectureCompletionRepository = lectureCompletionRepository;
        this.videoProgressRepository = videoProgressRepository;
        this.assessmentRepository = assessmentRepository;
        this.attemptRepository = attemptRepository;
    }

    @Transactional
    public EnrollmentDto enroll(Long userId, Long courseId) {
        CourseEnrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseGet(() -> createEnrollment(userId, courseId));

        if (enrollment.getStatus() == EnrollmentStatus.DROPPED) {
            enrollment.setStatus(EnrollmentStatus.ACTIVE);
            enrollment.setCompletedAt(null);
            enrollmentRepository.save(enrollment);
        }
        return toEnrollmentDto(enrollment);
    }

    public boolean isEnrolled(Long userId, Long courseId) {
        return enrollmentRepository.existsByUserIdAndCourseIdAndStatusIn(
                userId,
                courseId,
                List.of(EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED));
    }

    @Transactional(readOnly = true)
    public List<EnrollmentDto> getMyEnrollments(Long userId) {
        return enrollmentRepository.findByUserIdOrderByEnrolledAtDesc(userId).stream()
                .map(this::toEnrollmentDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CourseProgressDto> getAllCourseProgress(Long userId) {
        return enrollmentRepository.findByUserIdOrderByEnrolledAtDesc(userId).stream()
                .map(enrollment -> calculateProgress(userId, enrollment.getCourse().getId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CompletionDto> getMyCompletions(Long courseId, String username) {
        Long userId = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"))
                .getId();

        return lectureCompletionRepository.findCompletedLectureIdsByUserAndCourse(userId, courseId).stream()
                .distinct()
                .map(lectureId -> CompletionDto.builder()
                        .lectureId(lectureId)
                        .completed(true)
                        .completedAt(null)
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isSectionUnlocked(Long userId, Long courseId, Long sectionId) {
        Course course = courseRepository.findByIdWithSectionsAndLectures(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        List<CourseSection> sections = course.getSections()
                .stream()
                .sorted(Comparator.comparing(CourseSection::getOrderIndex))
                .collect(Collectors.toList());

        if (sections.isEmpty()) {
            return true;
        }
        if (sections.get(0).getId().equals(sectionId)) {
            return true;
        }

        CourseSection targetSection = null;
        CourseSection previousSection = null;
        for (int index = 0; index < sections.size(); index++) {
            CourseSection section = sections.get(index);
            if (!section.getId().equals(sectionId)) {
                continue;
            }
            targetSection = section;
            if (index > 0) {
                previousSection = sections.get(index - 1);
            }
            break;
        }

        if (targetSection == null) {
            return false;
        }
        if (previousSection == null) {
            return true;
        }

        List<Lecture> previousLectures = previousSection.getLectures()
                .stream()
                .filter(lecture -> lecture.getType() != LectureType.QUIZ)
                .collect(Collectors.toList());

        for (Lecture lecture : previousLectures) {
            boolean completed = lectureCompletionRepository.existsByUserIdAndLectureId(userId, lecture.getId());
            if (!completed) {
                return false;
            }
        }

        List<Lecture> quizLectures = previousSection.getLectures()
                .stream()
                .filter(lecture -> lecture.getType() == LectureType.QUIZ)
                .collect(Collectors.toList());

        for (Lecture quizLecture : quizLectures) {
            Optional<Assessment> assessment = assessmentRepository.findByLectureId(quizLecture.getId()).stream().findFirst();
            if (assessment.isPresent()) {
                boolean passed = attemptRepository.existsByAssessmentIdAndUserIdAndPassedTrue(
                        assessment.get().getId(),
                        userId
                );
                if (!passed) {
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
        Course course = courseRepository.findByIdWithSectionsAndLectures(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        List<CourseSection> sections = course.getSections()
                .stream()
                .sorted(Comparator.comparing(CourseSection::getOrderIndex))
                .collect(Collectors.toList());

        int totalLectures = 0;
        int completedLectures = 0;
        List<CourseProgressDto.SectionProgress> sectionProgresses = new ArrayList<>();

        for (CourseSection section : sections) {
            List<Lecture> lectures = section.getLectures() != null
                    ? section.getLectures().stream()
                    .sorted(Comparator.comparing(Lecture::getOrderIndex))
                    .collect(Collectors.toList())
                    : List.of();

            int sectionTotal = lectures.size();
            int sectionCompleted = 0;

            for (Lecture lecture : lectures) {
                boolean done = lectureCompletionRepository.existsByUserIdAndLectureId(userId, lecture.getId());
                if (done) {
                    sectionCompleted++;
                }
            }

            totalLectures += sectionTotal;
            completedLectures += sectionCompleted;

            boolean unlocked = isSectionUnlocked(userId, courseId, section.getId());

            sectionProgresses.add(CourseProgressDto.SectionProgress.builder()
                    .sectionId(section.getId())
                    .sectionTitle(section.getTitle())
                    .totalLectures(sectionTotal)
                    .completedLectures(sectionCompleted)
                    .progressPercent(sectionTotal > 0
                            ? (int) Math.round(sectionCompleted * 100.0 / sectionTotal)
                            : 0)
                    .unlocked(unlocked)
                    .build());
        }

        double progressPercent = totalLectures > 0
                ? (double) Math.round(completedLectures * 100.0 / totalLectures)
                : 0.0;
        Long nextRecommendedLectureId = findNextLecture(userId, sections);

        enrollment.setProgressPercent(progressPercent);
        if (progressPercent >= 100.0) {
            enrollment.setStatus(EnrollmentStatus.COMPLETED);
            if (enrollment.getCompletedAt() == null) {
                enrollment.setCompletedAt(LocalDateTime.now());
            }
        } else if (enrollment.getStatus() != EnrollmentStatus.DROPPED) {
            enrollment.setStatus(EnrollmentStatus.ACTIVE);
            enrollment.setCompletedAt(null);
        }
        enrollmentRepository.save(enrollment);

        return CourseProgressDto.builder()
                .courseId(courseId)
                .totalLectures(totalLectures)
                .completedLectures(completedLectures)
                .progressPercent(progressPercent)
                .nextRecommendedLectureId(nextRecommendedLectureId)
                .sectionProgresses(sectionProgresses)
                .build();
    }

    @Transactional
    public CourseProgressDto markLectureComplete(Long userId, Long lectureId) {
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lecture not found"));
        Long courseId = lecture.getSection().getCourse().getId();

        if (!isEnrolled(userId, courseId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not enrolled in this course");
        }

        LectureCompletion completion = lectureCompletionRepository.findByUserIdAndLectureId(userId, lectureId)
                .orElseGet(() -> LectureCompletion.builder()
                        .user(getUserById(userId))
                        .lecture(lecture)
                        .build());
        completion.setCompleted(true);
        completion.setCompletedAt(LocalDateTime.now());
        lectureCompletionRepository.save(completion);

        return calculateProgress(userId, courseId);
    }

    private CourseEnrollment createEnrollment(Long userId, Long courseId) {
        User user = getUserById(userId);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        if (!course.isPublished()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course is not published");
        }

        CourseEnrollment enrollment = CourseEnrollment.builder()
                .user(user)
                .course(course)
                .status(EnrollmentStatus.ACTIVE)
                .progressPercent(0.0)
                .build();
        return enrollmentRepository.save(enrollment);
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
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

    private Long findNextLecture(Long userId, List<CourseSection> sections) {
        for (CourseSection section : sections) {
            List<Lecture> lectures = section.getLectures() != null
                    ? section.getLectures().stream()
                    .sorted(Comparator.comparing(Lecture::getOrderIndex))
                    .collect(Collectors.toList())
                    : List.of();

            for (Lecture lecture : lectures) {
                boolean done = lectureCompletionRepository.existsByUserIdAndLectureId(userId, lecture.getId());
                if (!done) {
                    return lecture.getId();
                }
            }
        }
        return null;
    }

    private EnrollmentDto toEnrollmentDto(CourseEnrollment enrollment) {
        String thumbnailUrl = enrollment.getCourse().getThumbnailUrl();
        return EnrollmentDto.builder()
                .id(enrollment.getId())
                .courseId(enrollment.getCourse().getId())
                .courseTitle(enrollment.getCourse().getTitle())
                .courseSlug(enrollment.getCourse().getSlug())
                .courseThumbnail(thumbnailUrl)
                .courseThumbnailUrl(thumbnailUrl)
                .thumbnailUrl(thumbnailUrl)
                .status(enrollment.getStatus())
                .progressPercent(enrollment.getProgressPercent())
                .lastLectureId(resolveLastLectureId(enrollment.getUser().getId(), enrollment.getCourse().getId()))
                .enrolledAt(enrollment.getEnrolledAt())
                .completedAt(enrollment.getCompletedAt())
                .build();
    }

    private Long resolveLastLectureId(Long userId, Long courseId) {
        return lectureCompletionRepository
                .findTopByUserIdAndLectureSectionCourseIdAndCompletedTrueOrderByCompletedAtDesc(userId, courseId)
                .map(completion -> completion.getLecture().getId())
                .or(() -> videoProgressRepository.findLastWatchedInCourse(userId, courseId)
                        .map(progress -> progress.getLecture().getId()))
                .or(() -> lectureRepository.findBySectionCourseIdOrderBySectionOrderIndexAscOrderIndexAsc(courseId)
                        .stream()
                        .findFirst()
                        .map(Lecture::getId))
                .orElse(null);
    }
}
