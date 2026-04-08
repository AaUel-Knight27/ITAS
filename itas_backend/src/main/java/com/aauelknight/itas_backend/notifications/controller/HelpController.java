package com.aauelknight.itas_backend.notifications.controller;

import com.aauelknight.itas_backend.notifications.dto.response.ContextualHelpDto;
import com.aauelknight.itas_backend.notifications.dto.response.HelpArticleDto;
import com.aauelknight.itas_backend.notifications.dto.response.HelpArticleRequest;
import com.aauelknight.itas_backend.notifications.service.HelpService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/help")
@RequiredArgsConstructor
public class HelpController {

    private final HelpService helpService;

    @GetMapping("/page/{pageId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<HelpArticleDto>> getByPage(@PathVariable String pageId) {
        return ResponseEntity.ok(helpService.getArticlesForPage(pageId));
    }

    @GetMapping("/context")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ContextualHelpDto> getContextual(
            @RequestParam String pageId,
            @RequestParam(required = false) String fieldId) {
        return ResponseEntity.ok(helpService.getContextualHelp(pageId, fieldId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<HelpArticleDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(helpService.getById(id));
    }

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<HelpArticleDto>> search(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(helpService.searchArticles(q));
    }

    @GetMapping("/category/{category}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<HelpArticleDto>> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(helpService.getByCategory(category));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN')")
    public ResponseEntity<List<HelpArticleDto>> getAllAdmin() {
        return ResponseEntity.ok(helpService.getAllAdmin());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN')")
    public ResponseEntity<HelpArticleDto> create(
            @Valid @RequestBody HelpArticleRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(helpService.create(req, userDetails.getUsername()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN')")
    public ResponseEntity<HelpArticleDto> update(
            @PathVariable Long id,
            @Valid @RequestBody HelpArticleRequest req) {
        return ResponseEntity.ok(helpService.update(id, req));
    }

    @PutMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN')")
    public ResponseEntity<HelpArticleDto> toggle(@PathVariable Long id) {
        return ResponseEntity.ok(helpService.togglePublish(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        helpService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Help article deleted"));
    }
}
