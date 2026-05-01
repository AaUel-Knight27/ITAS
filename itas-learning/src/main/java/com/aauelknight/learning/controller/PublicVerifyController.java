package com.aauelknight.learning.controller;

import com.aauelknight.learning.dto.response.CertificateDto;
import com.aauelknight.learning.service.CertificateService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/verify")
public class PublicVerifyController {

    private final CertificateService certificateService;

    public PublicVerifyController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    @GetMapping("/{uuid}")
    public ResponseEntity<Map<String, Object>> verify(@PathVariable String uuid) {
        try {
            CertificateDto cert = certificateService.verifyByUuid(uuid);
            return ResponseEntity.ok(Map.of(
                    "status", "VALID",
                    "valid", true,
                    "recipientName", cert.getUserFullName(),
                    "courseName", cert.getCourseTitle(),
                    "issueDate", cert.getIssuedAt() != null ? cert.getIssuedAt().toLocalDate().toString() : "",
                    "certificateCode", cert.getCertificateCode(),
                    "verificationUuid", uuid));
        } catch (ResponseStatusException e) {
            if (e.getStatusCode().value() == 404) {
                return ResponseEntity.status(404).body(Map.of(
                        "status", "INVALID",
                        "valid", false,
                        "message", "Certificate not found"));
            }
            throw e;
        }
    }
}
