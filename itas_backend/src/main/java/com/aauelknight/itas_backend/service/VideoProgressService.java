package com.aauelknight.itas_backend.service;

import com.aauelknight.itas_backend.dto.VideoProgressDto;
import com.aauelknight.itas_backend.dto.VideoProgressRequest;
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
    public void saveProgress(Long lectureId, VideoProgressRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Lecture lecture = lectureRepository.findByIdWithSectionAndCourse(lectureId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lecture not found"));

        Long courseId = lecture.getSection().getCourse().getId();
        if (!lecture.isPreview() && !enrollmentService.isEnrolled(user.getId(), courseId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not enrolled in this course");
        }

        VideoProgress progress = videoProgressRepository.findByUserIdAndLectureId(user.getId(), lectureId)
                .orElse(VideoProgress.builder()
                        .user(user)
                        .lecture(lecture)
                        .build());

        int watchedSeconds = Math.max(0, request.getWatchedSeconds() == null ? 0 : request.getWatchedSeconds());
        int completionPercentage = Math.max(0, Math.min(100,
                request.getCompletionPercentage() == null ? 0 : request.getCompletionPercentage()));
        int lastPosition = Math.max(0, request.getLastPosition() == null ? 0 : request.getLastPosition());

        progress.setWatchedSeconds(watchedSeconds);
        progress.setCompletionPercentage(completionPercentage);
        progress.setLastPosition(lastPosition);

        // Save progress only; completion is handled by the dedicated lesson completion endpoint.
        videoProgressRepository.save(progress);
    }

    @Transactional(readOnly = true)
    public VideoProgressDto getProgress(Long lectureId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return videoProgressRepository.findByUserIdAndLectureId(user.getId(), lectureId)
                .map(this::toDto)
                .orElse(VideoProgressDto.builder()
                        .lectureId(lectureId)
                        .watchedSeconds(0)
                        .completionPercentage(0)
                        .lastPosition(0)
                        .lastWatchedAtDisplay(null)
                        .build());
    }

    @Transactional(readOnly = true)
    public VideoProgressDto getLastWatched(Long courseId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return videoProgressRepository.findLastWatchedInCourse(user.getId(), courseId)
                .map(this::toDto)
                .orElse(null);
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

    private VideoProgressDto toDto(VideoProgress vp) {
        return VideoProgressDto.builder()
                .id(vp.getId())
                .lectureId(vp.getLecture().getId())
                .lectureTitle(vp.getLecture().getTitle())
                .watchedSeconds(vp.getWatchedSeconds())
                .completionPercentage(vp.getCompletionPercentage())
                .lastPosition(vp.getLastPosition())
                .lastWatchedAtDisplay(vp.getLastWatchedAtDisplay())
                .updatedAt(vp.getUpdatedAt() != null ? vp.getUpdatedAt().toString() : null)
                .build();
    }
}
