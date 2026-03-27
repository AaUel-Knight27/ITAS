package com.aauelknight.itas_backend.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@Slf4j
public class FileStorageService {

    private static final long MAX_FILE_SIZE_BYTES = 104_857_600L; // 100MB
    @Value("${app.upload-dir:uploads}")
    private String uploadDir;
    private final Path uploadRoot;

    public FileStorageService(@Value("${app.upload-dir:uploads}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public String saveFile(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException(
                    "File size exceeds 100MB limit. Your file is " + (file.getSize() / 1_048_576) + "MB");
        }

        String originalName = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String extension = getExtension(originalName);
        String fileName = UUID.randomUUID() + extension;

        Path targetDir = uploadRoot.resolve(folder).normalize();
        Path targetFile = targetDir.resolve(fileName);
        try {
            Files.createDirectories(targetDir);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
            String relative = Paths.get(folder, fileName).toString().replace("\\", "/");
            log.info("Stored file: {}", relative);
            return relative;
        } catch (IOException ex) {
            log.error("Failed to store file '{}'", originalName, ex);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store file");
        }
    }

    public String storeLectureFile(Long courseId, Long sectionId, Long lectureId, MultipartFile file) {
        try {
            String original = file.getOriginalFilename() == null
                    ? "file.mp4"
                    : file.getOriginalFilename();
            String ext = original.contains(".")
                    ? original.substring(original.lastIndexOf('.') + 1).toLowerCase()
                    : "mp4";
            String uuid = UUID.randomUUID().toString();
            String fileName = uuid + "." + ext;

            Path dir = Paths.get(uploadDir, "courses", courseId.toString(), "lectures", lectureId.toString());
            Files.createDirectories(dir);
            log.info("Saving to directory: {}", dir.toAbsolutePath());

            Path dest = dir.resolve(fileName);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
            log.info("File saved: {} ({} bytes)", dest.toAbsolutePath(), file.getSize());

            String relativePath = "uploads/courses/" + courseId + "/lectures/" + lectureId + "/" + fileName;
            log.info("Returning path: {}", relativePath);
            return relativePath;
        } catch (IOException ex) {
            log.error("Storage error: {}", ex.getMessage(), ex);
            throw new RuntimeException("Failed to store file: " + ex.getMessage());
        }
    }

    public String storeThumbnail(Long courseId, MultipartFile file) {
        try {
            String extension = getNormalizedExtension(file.getOriginalFilename());
            String fileName = UUID.randomUUID() + "." + extension;

            Path dir = uploadRoot.resolve(Paths.get("courses", courseId.toString(), "thumbnail")).normalize();
            Files.createDirectories(dir);

            Path dest = dir.resolve(fileName);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = "uploads/courses/" + courseId + "/thumbnail/" + fileName;
            log.info("Stored thumbnail: {}", relativePath);
            return relativePath;
        } catch (IOException ex) {
            log.error("Failed to store thumbnail for course {}", courseId, ex);
            throw new RuntimeException("Failed to store thumbnail: " + ex.getMessage(), ex);
        }
    }

    public void deleteFile(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return;
        }
        try {
            Path path = uploadRoot.resolve(filePath).normalize();
            Files.deleteIfExists(path);
            log.info("Deleted file: {}", filePath);
        } catch (IOException ex) {
            log.warn("Failed to delete file: {}", filePath, ex);
        }
    }

    private String getExtension(String fileName) {
        int dot = fileName.lastIndexOf('.');
        return dot < 0 ? "" : fileName.substring(dot);
    }

    private String getNormalizedExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "mp4";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
}
