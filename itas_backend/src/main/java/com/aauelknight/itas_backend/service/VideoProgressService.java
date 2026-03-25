package com.aauelknight.itas_backend.service;

import com.aauelknight.itas_backend.entity.Lecture;
import com.aauelknight.itas_backend.entity.User;
import com.aauelknight.itas_backend.entity.VideoProgress;
import com.aauelknight.itas_backend.repository.LectureRepository;
import com.aauelknight.itas_backend.repository.UserRepository;
import com.aauelknight.itas_backend.repository.VideoProgressRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class VideoProgressService {

    private final VideoProgressRepository videoProgressRepository;
    private final LectureRepository lectureRepository;
    private final UserRepository userRepository;
    private final EnrollmentService enrollmentService;

    public VideoProgressService(VideoProgressRepository videoProgressRepository,
                                LectureRepository lectureRepository,
                                UserRepository userRepository,
                                EnrollmentService enrollmentService) {
        this.videoProgressRepository = videoProgressRepository;
        this.lectureRepository = lectureRepository;
        this.userRepository = userRepository;
        this.enrollmentService = enrollmentService;
    }

    @Transactional
    public VideoProgress save(Long userId, Long lectureId, Integer watchedSeconds, Integer lastPosition) {
        Lecture lecture = lectureRepository.findByIdWithSectionAndCourse(lectureId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lecture not found"));

        Long courseId = lecture.getSection().getCourse().getId();
        if (!lecture.isPreview() && !enrollmentService.isEnrolled(userId, courseId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not enrolled in this course");
        }

        VideoProgress progress = videoProgressRepository.findByUserIdAndLectureId(userId, lectureId)
                .orElseGet(() -> VideoProgress.builder()
                        .user(getUser(userId))
                        .lecture(lecture)
                        .watchedSeconds(0)
                        .lastPosition(0)
                        .completionPercentage(0.0)
                        .build());

        int normalizedWatched = Math.max(0, watchedSeconds == null ? 0 : watchedSeconds);
        int normalizedPosition = Math.max(0, lastPosition == null ? 0 : lastPosition);
        int duration = lecture.getDurationSeconds() == null ? 0 : Math.max(lecture.getDurationSeconds(), 0);

        double completion = duration <= 0
                ? 0.0
                : Math.min(100.0, (normalizedWatched * 100.0) / duration);

        progress.setWatchedSeconds(Math.max(progress.getWatchedSeconds(), normalizedWatched));
        progress.setLastPosition(normalizedPosition);
        progress.setCompletionPercentage(completion);

        VideoProgress saved = videoProgressRepository.save(progress);

        if (completion >= 90.0) {
            enrollmentService.markLectureComplete(userId, lectureId);
        }
        return saved;
    }

    public Integer getLastPosition(Long userId, Long lectureId) {
        return videoProgressRepository.findByUserIdAndLectureId(userId, lectureId)
                .map(VideoProgress::getLastPosition)
                .orElse(0);
    }

    public String getStreamUrl(Long userId, Long lectureId) {
        return getLectureForStreaming(userId, lectureId).getVideoUrl();
    }

    @Transactional(readOnly = true)
    public Lecture getLectureForStreaming(Long userId, Long lectureId) {
        Lecture lecture = lectureRepository.findByIdWithSectionAndCourse(lectureId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lecture not found"));

        Long courseId = lecture.getSection().getCourse().getId();
        if (!lecture.isPreview() && !enrollmentService.isEnrolled(userId, courseId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not enrolled in this course");
        }
        return lecture;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
