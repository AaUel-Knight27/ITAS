package com.aauelknight.learning.dto.response;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateDto {

    private Long id;
    private Long userId;
    private String userFullName;
    private Long courseId;
    private String courseTitle;
    private String certificateCode;
    private String verificationUuid;
    private String verifyUrl;
    private String qrCode;
    private String filePath;
    private LocalDateTime issuedAt;
    private String status;
}
