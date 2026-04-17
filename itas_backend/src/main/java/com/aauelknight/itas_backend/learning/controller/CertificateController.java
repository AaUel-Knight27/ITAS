package com.aauelknight.itas_backend.learning.controller;
import com.aauelknight.itas_backend.learning.dto.response.CertificateDto;
import com.aauelknight.itas_backend.learning.dto.request.CertificateGenerateRequest;
import com.aauelknight.itas_backend.learning.entity.Certificate;
import com.aauelknight.itas_backend.notifications.service.EmailService;
import com.aauelknight.itas_backend.auth.entity.User;
import com.aauelknight.itas_backend.learning.service.CertificateService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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

    private static final Logger log = LoggerFactory.getLogger(CertificateController.class);

    private final CertificateService certificateService;
    private final EmailService emailService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public CertificateController(CertificateService certificateService,
                                 EmailService emailService) {
        this.certificateService = certificateService;
        this.emailService = emailService;
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

        String verifyUrl = frontendUrl + "/verify/" + cert.getVerificationUuid();

        try {
            String fullName = ((cert.getUser().getFirstName() != null ? cert.getUser().getFirstName() : "")
                    + " "
                    + (cert.getUser().getLastName() != null ? cert.getUser().getLastName() : ""))
                    .trim();

            String emailBody = buildShareEmail(
                    fullName,
                    cert.getCourse().getTitle(),
                    verifyUrl,
                    cert.getCertificateCode());

            emailService.sendEmail(
                    cert.getUser().getEmail(),
                    "[ITAS Portal] Your Certificate Verification Link",
                    emailBody);

            log.info("Certificate share email sent to: {}", cert.getUser().getEmail());
        } catch (Exception e) {
            log.warn("Share email failed: {}", e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "message", "Certificate link sent to " + cert.getUser().getEmail(),
                "email", cert.getUser().getEmail(),
                "verifyUrl", verifyUrl,
                "certificateCode", cert.getCertificateCode()));
    }

    private String buildShareEmail(String name,
                                   String courseTitle,
                                   String verifyUrl,
                                   String certCode) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background: #f5f5f5;
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: #0f285a;
                        color: white;
                        padding: 32px;
                        text-align: center;
                    }
                    .badge {
                        font-size: 48px;
                        margin-bottom: 12px;
                    }
                    .body {
                        padding: 32px;
                        color: #374151;
                        line-height: 1.6;
                    }
                    .cert-box {
                        background: #f0f9ff;
                        border: 2px solid #0284c7;
                        border-radius: 12px;
                        padding: 20px;
                        margin: 20px 0;
                        text-align: center;
                    }
                    .cert-title {
                        font-size: 18px;
                        font-weight: bold;
                        color: #0f285a;
                        margin-bottom: 8px;
                    }
                    .cert-code {
                        font-family: monospace;
                        font-size: 14px;
                        color: #6b7280;
                        background: #f3f4f6;
                        padding: 4px 12px;
                        border-radius: 4px;
                        display: inline-block;
                    }
                    .verify-btn {
                        display: inline-block;
                        background: #0f285a;
                        color: white;
                        padding: 14px 32px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: bold;
                        font-size: 16px;
                        margin: 20px 0;
                    }
                    .url-box {
                        background: #f3f4f6;
                        border-radius: 8px;
                        padding: 12px 16px;
                        font-family: monospace;
                        font-size: 12px;
                        color: #374151;
                        word-break: break-all;
                        margin-top: 16px;
                    }
                    .footer {
                        background: #f9fafb;
                        padding: 16px 32px;
                        text-align: center;
                        font-size: 12px;
                        color: #9ca3af;
                        border-top: 1px solid #e5e7eb;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="badge">&#127942;</div>
                        <h1 style="margin: 0; font-size: 22px;">Your Certificate Link</h1>
                        <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">Ministry of Revenue - ITAS Portal</p>
                    </div>

                    <div class="body">
                        <p>Dear <strong>%s</strong>,</p>
                        <p>Here is the verification link for your certificate. You can share this link with anyone to prove your course completion.</p>

                        <div class="cert-box">
                            <div class="cert-title">%s</div>
                            <div class="cert-code">%s</div>
                        </div>

                        <div style="text-align: center;">
                            <a href="%s" class="verify-btn">&#128269; Verify Certificate</a>
                        </div>

                        <p style="font-size: 13px; color: #6b7280;">Or copy this link:</p>
                        <div class="url-box">%s</div>
                    </div>

                    <div class="footer">
                        <p>This email was sent because you requested your certificate link from the ITAS Portal.</p>
                        <p>Ministry of Revenue | ITAS Portal</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(name, courseTitle, certCode, verifyUrl, verifyUrl);
    }

    private Long requireUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return user.getId();
    }
}

