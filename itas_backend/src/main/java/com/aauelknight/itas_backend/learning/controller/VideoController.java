package com.aauelknight.itas_backend.learning.controller;

import com.aauelknight.itas_backend.lecture.entity.Lecture;
import com.aauelknight.itas_backend.auth.entity.User;
import com.aauelknight.itas_backend.learning.service.VideoProgressService;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/content/video")
public class VideoController {

    private final VideoProgressService videoProgressService;

    public VideoController(VideoProgressService videoProgressService) {
        this.videoProgressService = videoProgressService;
    }

    @GetMapping("/{id}/stream")
    public ResponseEntity<Map<String, Object>> stream(@PathVariable("id") Long lectureId, Authentication authentication) {
        Long userId = requireUserId(authentication);
        Lecture lecture = videoProgressService.getLectureForStreaming(userId, lectureId);
        String mp4Url = lecture.getVideoUrl();

        if (mp4Url == null || mp4Url.isBlank()) {
            Map<String, Object> empty = new LinkedHashMap<>();
            empty.put("mp4Url", null);
            empty.put("hlsUrl", null);
            empty.put("captionsUrl", null);
            return ResponseEntity.ok(empty);
        }

        String hlsUrl = null;
        String captionsUrl = null;

        Path mp4Path = toLocalPath(mp4Url);
        if (mp4Path != null) {
            String mp4FileName = mp4Path.getFileName().toString();
            int dot = mp4FileName.lastIndexOf('.');
            if (dot > 0) {
                String base = mp4FileName.substring(0, dot);
                Path hlsPath = mp4Path.getParent() != null ? mp4Path.getParent().resolve(base + ".m3u8") : null;
                if (hlsPath != null && Files.exists(hlsPath)) {
                    hlsUrl = "/uploads/courses/" + lecture.getSection().getCourse().getId() + "/" + base + ".m3u8";
                }
            }
        }

        Path captionPath = Paths.get("uploads", "captions", lectureId + ".vtt");
        if (Files.exists(captionPath)) {
            captionsUrl = "/content/video/" + lectureId + "/captions";
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("mp4Url", mp4Url);
        response.put("hlsUrl", hlsUrl);
        response.put("captionsUrl", captionsUrl);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/captions")
    public ResponseEntity<Resource> captions(@PathVariable("id") Long lectureId) {
        Path captionPath = Paths.get("uploads", "captions", lectureId + ".vtt").toAbsolutePath().normalize();
        if (!Files.exists(captionPath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Captions not found");
        }
        try {
            Resource resource = new UrlResource(captionPath.toUri());
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("text/vtt"))
                    .body(resource);
        } catch (MalformedURLException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid caption path");
        }
    }

    private Path toLocalPath(String urlOrPath) {
        if (urlOrPath == null || urlOrPath.isBlank()) {
            return null;
        }
        if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
            return null;
        }
        String normalized = urlOrPath.startsWith("/") ? urlOrPath.substring(1) : urlOrPath;
        return Paths.get(normalized).toAbsolutePath().normalize();
    }

    private Long requireUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return user.getId();
    }
}
