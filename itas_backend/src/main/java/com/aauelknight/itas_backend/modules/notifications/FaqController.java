package com.aauelknight.itas_backend.modules.notifications;

import com.aauelknight.itas_backend.dto.faq.FaqDto;
import com.aauelknight.itas_backend.dto.faq.FaqRequest;
import com.aauelknight.itas_backend.modules.notifications.FaqService;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/faq")
@RequiredArgsConstructor
public class FaqController {

    private final FaqService faqService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<FaqDto>> getAll() {
        return ResponseEntity.ok(faqService.getAllFaqs());
    }

    @GetMapping("/category/{category}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<FaqDto>> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(faqService.getFaqsByCategory(category));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN')")
    public ResponseEntity<FaqDto> create(
            @Valid @RequestBody FaqRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(faqService.createFaq(req, userDetails.getUsername()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN')")
    public ResponseEntity<FaqDto> update(
            @PathVariable Long id,
            @Valid @RequestBody FaqRequest req) {
        return ResponseEntity.ok(faqService.updateFaq(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        faqService.deleteFaq(id);
        return ResponseEntity.ok(Map.of("message", "FAQ deleted successfully"));
    }
}
