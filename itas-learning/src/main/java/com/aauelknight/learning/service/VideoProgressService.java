package com.aauelknight.learning.service;

import com.aauelknight.learning.client.CourseServiceClient;
import com.aauelknight.learning.dto.LectureInfoDto;
import com.aauelknight.learning.dto.response.VideoProgressDto;
import com.aauelknight.learning.dto.request.VideoProgressRequest;
import com.aauelknight.learning.entity.VideoProgress;
import com.aauelknight.learning.repository.VideoProgressRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class VideoProgressService extends GatewayAwareService {

    private final VideoProgressRepository videoProgressRepository;
    private final CourseServiceClient courseServiceClient;
    private final EnrollmentService enrollmentService;

    public VideoProgressService(VideoProgressRepository videoProgressRepository,
                                CourseServiceClient courseServiceClient,
                                EnrollmentService enrollmentService) {
        this.videoProgressRepository = videoProgressRepository;
        this.courseServiceClient = courseServiceClient;
        this.enrollmentService = enrollmentService;
    }

    @Transactional
    public void saveProgress(Long userId, Long lectureId, VideoProgressRequest request) {
        LectureInfoDto lecture = courseServiceClient.getLecture(lectureId);
        if (lecture.getCourseId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Lecture course context is missing");
        }
        boolean preview = Boolean.TRUE.equals(lecture.getPreview());
        if (!preview && !enrollmentService.isEnrolled(userId, lecture.getCourseId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not enrolled in this course");
        }

        VideoProgress progress = videoProgressRepository.findByUserIdAndLectureId(userId, lectureId)
                .orElse(VideoProgress.builder()
                        .userId(userId)
                        .lectureId(lectureId)
                        .build());

        progress.setWatchedSeconds(Math.max(0, request.getWatchedSeconds() == null ? 0 : request.getWatchedSeconds()));
        progress.setLastPosition(Math.max(0, request.getLastPosition() == null ? 0 : request.getLastPosition()));
        progress.setCompletionPercentage((double) Math.max(
                0,
                Math.min(100, request.getCompletionPercentage() == null ? 0 : request.getCompletionPercentage())));

        videoProgressRepository.save(progress);
    }

    @Transactional(readOnly = true)
    public VideoProgressDto getProgress(Long userId, Long lectureId) {
        LectureInfoDto lecture = courseServiceClient.getLecture(lectureId);
        return videoProgressRepository.findByUserIdAndLectureId(userId, lectureId)
                .map(progress -> toDto(progress, lecture))
                .orElse(VideoProgressDto.builder()
                        .lectureId(lectureId)
                        .lectureTitle(lecture.getTitle())
                        .watchedSeconds(0)
                        .completionPercentage(0)
                        .lastPosition(0)
                        .lastWatchedAtDisplay(null)
                        .updatedAt(null)
                        .build());
    }

    @Transactional(readOnly = true)
    public VideoProgressDto getLastWatched(Long userId, Long courseId) {
        List<Long> lectureIds = courseServiceClient.getCourseLectures(courseId).stream()
                .map(LectureInfoDto::getId)
                .toList();
        if (lectureIds.isEmpty()) {
            return null;
        }
        return videoProgressRepository.findTopByUserIdAndLectureIdInOrderByLastWatchedAtDesc(userId, lectureIds)
                .map(progress -> toDto(progress, courseServiceClient.getLecture(progress.getLectureId())))
                .orElse(null);
    }

    private VideoProgressDto toDto(VideoProgress progress, LectureInfoDto lecture) {
        return VideoProgressDto.builder()
                .id(progress.getId())
                .lectureId(progress.getLectureId())
                .lectureTitle(lecture != null ? lecture.getTitle() : null)
                .watchedSeconds(progress.getWatchedSeconds())
                .completionPercentage(progress.getCompletionPercentage().intValue())
                .lastPosition(progress.getLastPosition())
                .lastWatchedAtDisplay(progress.getLastWatchedAt() != null ? progress.getLastWatchedAt().toString() : null)
                .updatedAt(progress.getLastWatchedAt() != null ? progress.getLastWatchedAt().toString() : null)
                .build();
    }
}
