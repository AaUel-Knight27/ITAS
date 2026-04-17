package com.aauelknight.itas_backend.learning.controller;
import com.aauelknight.itas_backend.learning.dto.response.CertificateDto;
import com.aauelknight.itas_backend.learning.dto.request.CertificateGenerateRequest;
import com.aauelknight.itas_backend.learning.entity.Certificate;
import com.aauelknight.itas_backend.auth.entity.User;
import com.aauelknight.itas_backend.learning.service.CertificateService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/lms")
public class CertificateController {

    private final CertificateService certificateService;

    public CertificateController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    @PostMapping("/certificate/generate")
    @PreAuthorize("hasAnyRole('TAX_AGENT','MOR_STAFF','MANAGER')")
    public CertificateDto generate(@Valid @RequestBody CertificateGenerateRequest request, Authentication authentication) {
        return certificateService.generate(requireUserId(authentication), request.getCourseId());
    }

    @GetMapping("/certificate/user/{userId}")
    @PreAuthorize("hasAnyRole('TAX_AGENT','MOR_STAFF','MANAGER')")
    public ResponseEntity<List<CertificateDto>> getUserCertificates(@PathVariable Long userId,
                                                                    Authentication authentication) {
        Long authenticatedUserId = requireUserId(authentication);
        if (!authenticatedUserId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return ResponseEntity.ok(certificateService.getByUser(userId));
    }

    @GetMapping("/certificate/my")
    @PreAuthorize("hasAnyRole('TAX_AGENT','MOR_STAFF','MANAGER')")
    public ResponseEntity<List<CertificateDto>> myCertificates(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return ResponseEntity.ok(certificateService.getByUser(user.getId()));
    }

    @GetMapping("/certificates")
    @PreAuthorize("hasAnyRole('TAX_AGENT','MOR_STAFF','MANAGER')")
    public ResponseEntity<List<CertificateDto>> myCertificatesLegacy(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return ResponseEntity.ok(certificateService.getByUser(user.getId()));
    }

    @GetMapping("/certificate/{id}/download")
    @PreAuthorize("hasAnyRole('TAX_AGENT','MOR_STAFF','MANAGER')")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        CertificateDto certificate = certificateService.getById(id);
        Resource resource = certificateService.loadPdf(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + certificate.getCertificateCode() + ".pdf\"")
                .body(resource);
    }

    @GetMapping("/certificate/verify/{code}")
    public CertificateDto verify(@PathVariable String code) {
        return certificateService.verifyByCode(code);
    }



    @GetMapping("/verify/{uuid}")
    public ResponseEntity<Map<String, Object>> verifyByUuid(@PathVariable String uuid) {
        try {
            CertificateDto cert = certificateService.verifyByUuid(uuid);

            return ResponseEntity.ok(Map.of(
                    "status", "VALID",
                    "valid", true,
                    "recipientName", cert.getUserFullName(),
                    "courseName", cert.getCourseTitle(),
                    "issueDate", cert.getIssuedAt() != null
                            ? cert.getIssuedAt().toLocalDate().toString()
                            : "",
                    "certificateCode", cert.getCertificateCode(),
                    "verificationUuid", uuid
            ));
        } catch (ResponseStatusException e) {
            if (e.getStatusCode().value() == 404) {
                return ResponseEntity.status(404).body(Map.of(
                        "status", "INVALID",
                        "valid", false,
                        "message", "Certificate not found"
                ));
            }
            throw e;
        }
    }

    @PostMapping("/certificate/{id}/share")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> shareCertificate(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Certificate cert = certificateService.getCertificateEntityById(id);

        if (!cert.getUser().getUsername().equals(userDetails.getUsername())) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Access denied"));
        }

        String frontendUrl = System.getenv("FRONTEND_URL") != null
                ? System.getenv("FRONTEND_URL")
                : "http://localhost:3000";

        String verifyUrl = frontendUrl + "/verify/" + cert.getVerificationUuid();

        System.out.println(
                "CERTIFICATE SHARE REQUEST:" +
                "\n  User: " + userDetails.getUsername() +
                "\n  Certificate: " + cert.getCertificateCode() +
                "\n  Verify URL: " + verifyUrl);

        return ResponseEntity.ok(Map.of(
                "message", "Certificate link sent to email",
                "verifyUrl", verifyUrl,
                "certificateCode", cert.getCertificateCode()));
    }

    private Long requireUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return user.getId();
    }
}

