package com.aauelknight.itas_backend.modules.courses;

import com.aauelknight.itas_backend.dto.version.ContentVersionDto;
import com.aauelknight.itas_backend.modules.courses.ContentVersion;
import com.aauelknight.itas_backend.modules.courses.Lecture;
import com.aauelknight.itas_backend.modules.courses.LectureType;
import com.aauelknight.itas_backend.modules.auth.User;
import com.aauelknight.itas_backend.shared.exception.ResourceNotFoundException;
import com.aauelknight.itas_backend.shared.storage.FileStorageService;
import com.aauelknight.itas_backend.modules.courses.ContentVersionRepository;
import com.aauelknight.itas_backend.modules.courses.LectureRepository;
import com.aauelknight.itas_backend.modules.auth.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ContentVersionService {

    private final ContentVersionRepository versionRepository;
    private final LectureRepository lectureRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public List<ContentVersionDto> getVersionHistory(Long lectureId) {
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new ResourceNotFoundException("Lecture not found: " + lectureId));

        String currentFilePath = lecture.getVideoUrl() != null ? lecture.getVideoUrl() : lecture.getPdfUrl();

        return versionRepository.findByLectureId(lectureId).stream()
                .map(version -> toDto(version, currentFilePath))
                .collect(Collectors.toList());
    }

    @Transactional
    public ContentVersionDto uploadNewVersion(Long courseId,
                                              Long sectionId,
                                              Long lectureId,
                                              MultipartFile file,
                                              String changeNotes,
                                              String username) {
        Lecture lecture = lectureRepository.findWithSectionAndCourseById(lectureId)
                .orElseThrow(() -> new ResourceNotFoundException("Lecture not found: " + lectureId));

        validateHierarchy(lecture, courseId, sectionId);
        validateUploadableType(lecture);

        User uploadedBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        String currentFilePath = lecture.getType() == LectureType.VIDEO
                ? lecture.getVideoUrl()
                : lecture.getPdfUrl();

        if (currentFilePath != null) {
            int currentMaxVersion = versionRepository.findMaxVersionByLectureId(lectureId).orElse(0);
            if (currentMaxVersion == 0) {
                versionRepository.save(ContentVersion.builder()
                        .lecture(lecture)
                        .versionNumber(1)
                        .filePath(currentFilePath)
                        .fileType(lecture.getType().name())
                        .changeNotes("Initial version")
                        .uploadedBy(uploadedBy)
                        .build());
            }
        }

        String newFilePath = fileStorageService.storeLectureFile(courseId, sectionId, lectureId, file);
        int newVersionNumber = versionRepository.findMaxVersionByLectureId(lectureId).orElse(1) + 1;

        ContentVersion newVersion = versionRepository.save(ContentVersion.builder()
                .lecture(lecture)
                .versionNumber(newVersionNumber)
                .filePath(newFilePath)
                .fileType(lecture.getType().name())
                .fileSize(file.getSize())
                .changeNotes(changeNotes)
                .uploadedBy(uploadedBy)
                .build());

        if (lecture.getType() == LectureType.VIDEO) {
            lecture.setVideoUrl(newFilePath);
        } else {
            lecture.setPdfUrl(newFilePath);
        }
        lectureRepository.save(lecture);

        return toDto(newVersion, newFilePath);
    }

    @Transactional
    public ContentVersionDto rollbackToVersion(Long lectureId, Long versionId, String username) {
        Lecture lecture = lectureRepository.findWithSectionAndCourseById(lectureId)
                .orElseThrow(() -> new ResourceNotFoundException("Lecture not found: " + lectureId));

        ContentVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Version not found: " + versionId));

        if (!version.getLecture().getId().equals(lectureId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Version does not belong to this lecture");
        }

        if (lecture.getType() == LectureType.VIDEO) {
            lecture.setVideoUrl(version.getFilePath());
        } else if (lecture.getType() == LectureType.PDF) {
            lecture.setPdfUrl(version.getFilePath());
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rollback is only supported for VIDEO and PDF lectures");
        }
        lectureRepository.save(lecture);

        return toDto(version, version.getFilePath());
    }

    private void validateHierarchy(Lecture lecture, Long courseId, Long sectionId) {
        if (lecture.getSection() == null
                || !lecture.getSection().getId().equals(sectionId)
                || lecture.getSection().getCourse() == null
                || !lecture.getSection().getCourse().getId().equals(courseId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lecture does not belong to the provided course/section");
        }
    }

    private void validateUploadableType(Lecture lecture) {
        if (lecture.getType() != LectureType.VIDEO && lecture.getType() != LectureType.PDF) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Versioning is only supported for VIDEO and PDF lectures");
        }
    }

    private ContentVersionDto toDto(ContentVersion version, String currentFilePath) {
        return ContentVersionDto.builder()
                .id(version.getId())
                .lectureId(version.getLecture().getId())
                .lectureTitle(version.getLecture().getTitle())
                .versionNumber(version.getVersionNumber())
                .filePath(version.getFilePath())
                .fileType(version.getFileType())
                .fileSize(version.getFileSize())
                .changeNotes(version.getChangeNotes())
                .uploadedByUsername(version.getUploadedBy() != null
                        ? version.getUploadedBy().getUsername()
                        : "System")
                .createdAt(version.getCreatedAt().toString())
                .isCurrent(version.getFilePath().equals(currentFilePath))
                .build();
    }
}
