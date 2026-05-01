package com.aauelknight.learning.controller;

import com.aauelknight.learning.client.AuthServiceClient;
import com.aauelknight.learning.dto.UserInfoDto;
import com.aauelknight.learning.dto.request.CertificateGenerateRequest;
import com.aauelknight.learning.dto.response.CertificateDto;
import com.aauelknight.learning.entity.Certificate;
import com.aauelknight.learning.security.GatewayPrincipal;
import com.aauelknight.learning.service.CertificateService;
import com.aauelknight.learning.service.EmailService;
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
import org.springframework.security.core.Authentication;
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
    private final AuthServiceClient authServiceClient;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public CertificateController(CertificateService certificateService,
                                 EmailService emailService,
                                 AuthServiceClient authServiceClient) {
        this.certificateService = certificateService;
        this.emailService = emailService;
        this.authServiceClient = authServiceClient;
    }

    @PostMapping("/certificate/generate")
    @PreAuthorize("hasAnyRole('TAX_AGENT','MOR_STAFF','MANAGER')")
    public CertificateDto generate(@Valid @RequestBody CertificateGenerateRequest request,
                                   Authentication authentication) {
        return certificateService.generate(requireUserId(authentication), request.getCourseId());
    }

    @GetMapping("/certificate/my")
    @PreAuthorize("hasAnyRole('TAX_AGENT','MOR_STAFF','MANAGER')")
    public ResponseEntity<List<CertificateDto>> myCertificates(Authentication authentication) {
        return ResponseEntity.ok(certificateService.getByUser(requireUserId(authentication)));
    }

    @GetMapping("/certificate/{id}/download")
    @PreAuthorize("hasAnyRole('TAX_AGENT','MOR_STAFF','MANAGER')")
    public ResponseEntity<Resource> download(@PathVariable Long id, Authentication authentication) {
        Long userId = requireUserId(authentication);
        Certificate certificate = certificateService.getCertificateEntityById(id);
        if (!userId.equals(certificate.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        CertificateDto dto = certificateService.getById(id);
        Resource resource = certificateService.loadPdf(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + dto.getCertificateCode() + ".pdf\"")
                .body(resource);
    }

    @PostMapping("/certificate/{id}/share")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> shareCertificate(@PathVariable Long id, Authentication authentication) {
        Long userId = requireUserId(authentication);
        Certificate certificate = certificateService.getCertificateEntityById(id);
        if (!userId.equals(certificate.getUserId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        }

        UserInfoDto user = authServiceClient.getUserById(userId);
        CertificateDto dto = certificateService.getById(id);
        String verifyUrl = frontendUrl + "/verify/" + dto.getVerificationUuid();

        try {
            String emailBody = buildShareEmail(user.getFullName(), dto.getCourseTitle(), verifyUrl, dto.getCertificateCode());
            emailService.sendEmail(
                    user.getEmail(),
                    "[ITAS Portal] Your Certificate Verification Link",
                    emailBody);
            log.info("Certificate share email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.warn("Share email failed: {}", e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "message", "Certificate link sent to " + user.getEmail(),
                "email", user.getEmail(),
                "verifyUrl", verifyUrl,
                "certificateCode", dto.getCertificateCode()));
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
                            <a href="%s" class="verify-btn">Verify Certificate</a>
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
        if (authentication == null || !(authentication.getPrincipal() instanceof GatewayPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (principal.userId() == null || principal.userId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return Long.parseLong(principal.userId());
    }
}
