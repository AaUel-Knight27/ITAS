package com.aauelknight.itas_backend.service;

import com.aauelknight.itas_backend.dto.CompletionDto;
import com.aauelknight.itas_backend.dto.CourseProgressDto;
import com.aauelknight.itas_backend.dto.EnrollmentDto;
import com.aauelknight.itas_backend.entity.Course;
import com.aauelknight.itas_backend.entity.CourseEnrollment;
import com.aauelknight.itas_backend.entity.EnrollmentStatus;
import com.aauelknight.itas_backend.entity.Lecture;
import com.aauelknight.itas_backend.entity.LectureCompletion;
import com.aauelknight.itas_backend.entity.User;
import com.aauelknight.itas_backend.repository.CourseRepository;
import com.aauelknight.itas_backend.repository.EnrollmentRepository;
import com.aauelknight.itas_backend.repository.LectureCompletionRepository;
import com.aauelknight.itas_backend.repository.LectureRepository;
import com.aauelknight.itas_backend.repository.UserRepository;
import com.aauelknight.itas_backend.repository.VideoProgressRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final LectureRepository lectureRepository;
    private final LectureCompletionRepository lectureCompletionRepository;
    private final VideoProgressRepository videoProgressRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                             UserRepository userRepository,
                             CourseRepository courseRepository,
                             LectureRepository lectureRepository,
                             LectureCompletionRepository lectureCompletionRepository,
                             VideoProgressRepository videoProgressRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.lectureRepository = lectureRepository;
        this.lectureCompletionRepository = lectureCompletionRepository;
        this.videoProgressRepository = videoProgressRepository;
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

    @Transactional
    public CourseProgressDto calculateProgress(Long userId, Long courseId) {
        CourseEnrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Enrollment not found"));

        long totalLectures = lectureRepository.countBySectionCourseId(courseId);
        long completedLectures = lectureCompletionRepository.countCompletedLecturesByUserAndCourse(userId, courseId);

        double progressPercent = totalLectures == 0
                ? 0.0
                : Math.min(100.0, (completedLectures * 100.0) / totalLectures);
        List<Long> completedLectureIds = lectureCompletionRepository.findCompletedLectureIdsByUserAndCourse(userId, courseId)
                .stream()
                .distinct()
                .toList();
        Long lastLectureId = resolveLastLectureId(userId, courseId);

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
                .completedLectureIds(completedLectureIds)
                .lastLectureId(lastLectureId)
                .status(enrollment.getStatus())
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
                .or(() -> videoProgressRepository.findTopByUserIdAndLectureSectionCourseIdOrderByUpdatedAtDesc(userId, courseId)
                        .map(progress -> progress.getLecture().getId()))
                .or(() -> lectureRepository.findBySectionCourseIdOrderBySectionOrderIndexAscOrderIndexAsc(courseId)
                        .stream()
                        .findFirst()
                        .map(Lecture::getId))
                .orElse(null);
    }
}
