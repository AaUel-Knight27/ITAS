package com.aauelknight.course.courses.controller;
import com.aauelknight.course.courses.dto.request.ContentVersionDto;
import com.aauelknight.course.courses.service.ContentVersionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/courses/{courseId}/sections/{sectionId}/lectures/{lectureId}/versions")
@RequiredArgsConstructor
public class ContentVersionController {

    private final ContentVersionService contentVersionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','WEB_ADMIN')")
    public ResponseEntity<List<ContentVersionDto>> getHistory(@PathVariable Long courseId,
                                                              @PathVariable Long sectionId,
                                                              @PathVariable Long lectureId) {
        return ResponseEntity.ok(contentVersionService.getVersionHistory(lectureId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','WEB_ADMIN')")
    public ResponseEntity<ContentVersionDto> uploadVersion(@PathVariable Long courseId,
                                                           @PathVariable Long sectionId,
                                                           @PathVariable Long lectureId,
                                                           @RequestParam("file") MultipartFile file,
                                                           @RequestParam(value = "changeNotes", required = false) String changeNotes,
                                                           @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contentVersionService.uploadNewVersion(
                        courseId,
                        sectionId,
                        lectureId,
                        file,
                        changeNotes,
                        userDetails.getUsername()));
    }

    @PutMapping("/{versionId}/rollback")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','WEB_ADMIN')")
    public ResponseEntity<ContentVersionDto> rollback(@PathVariable Long courseId,
                                                      @PathVariable Long sectionId,
                                                      @PathVariable Long lectureId,
                                                      @PathVariable Long versionId,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(contentVersionService.rollbackToVersion(
                lectureId,
                versionId,
                userDetails.getUsername()));
    }
}



