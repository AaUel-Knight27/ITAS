package com.aauelknight.notification.controller;

import com.aauelknight.notification.dto.response.FaqDto;
import com.aauelknight.notification.dto.response.FaqRequest;
import com.aauelknight.notification.service.FaqService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    public ResponseEntity<FaqDto> create(@Valid @RequestBody FaqRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(faqService.createFaq(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN')")
    public ResponseEntity<FaqDto> update(@PathVariable Long id, @Valid @RequestBody FaqRequest request) {
        return ResponseEntity.ok(faqService.updateFaq(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMMUNICATION','WEB_ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        faqService.deleteFaq(id);
        return ResponseEntity.ok(Map.of("message", "FAQ deleted successfully"));
    }
}
