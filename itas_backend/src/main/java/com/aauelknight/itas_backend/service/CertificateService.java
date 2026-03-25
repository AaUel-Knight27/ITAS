package com.aauelknight.itas_backend.service;

import com.aauelknight.itas_backend.dto.CertificateDto;
import com.aauelknight.itas_backend.entity.Certificate;
import com.aauelknight.itas_backend.entity.Course;
import com.aauelknight.itas_backend.entity.User;
import com.aauelknight.itas_backend.exception.ResourceNotFoundException;
import com.aauelknight.itas_backend.repository.CertificateRepository;
import com.aauelknight.itas_backend.repository.CourseRepository;
import com.aauelknight.itas_backend.repository.UserRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CertificateService {

    private static final String VERIFY_URL_TEMPLATE = "http://localhost:8080/api/v1/lms/certificate/verify/%s";
    private static final Path CERTIFICATE_DIR = Paths.get("uploads", "certificates");

    private final CertificateRepository certificateRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public CertificateService(CertificateRepository certificateRepository,
                              UserRepository userRepository,
                              CourseRepository courseRepository) {
        this.certificateRepository = certificateRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
    }

    @Transactional
    public CertificateDto generate(Long userId, Long courseId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!user.isEligibleForCertificate()) {
            throw new AccessDeniedException("Taxpayers are not eligible for certificates");
        }

        Certificate existing = certificateRepository.findByUserIdAndCourseId(userId, courseId).orElse(null);
        if (existing != null) {
            return toDto(existing);
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        Long sequence = certificateRepository.nextCertificateSequence();
        int year = LocalDate.now().getYear();
        String code = String.format("MOR-%d-%06d", year, sequence);
        String verifyUrl = VERIFY_URL_TEMPLATE.formatted(code);

        byte[] qrBytes = generateQrCodePng(verifyUrl);
        String qrBase64 = Base64.getEncoder().encodeToString(qrBytes);

        try {
            Files.createDirectories(CERTIFICATE_DIR);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create certificate folder");
        }

        Path pdfPath = CERTIFICATE_DIR.resolve(code + ".pdf");
        generateCertificatePdf(pdfPath, qrBytes, code, user, course);

        Certificate certificate = Certificate.builder()
                .user(user)
                .course(course)
                .certificateCode(code)
                .qrCode(qrBase64)
                .filePath(pdfPath.toString())
                .issuedAt(LocalDateTime.now())
                .build();
        return toDto(certificateRepository.save(certificate));
    }

    @Transactional(readOnly = true)
    public List<CertificateDto> getByUser(Long userId) {
        return certificateRepository.findByUserIdOrderByIssuedAtDesc(userId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public CertificateDto verifyByCode(String code) {
        Certificate certificate = certificateRepository.findByCertificateCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate not found"));
        return toDto(certificate);
    }

    @Transactional(readOnly = true)
    public CertificateDto getByUserAndCourse(Long userId, Long courseId) {
        return certificateRepository.findByUserIdAndCourseId(userId, courseId)
                .map(this::toDto)
                .orElse(null);
    }

    public Resource loadPdf(Long certificateId) {
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate not found"));
        try {
            Path path = Paths.get(certificate.getFilePath()).toAbsolutePath().normalize();
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate file not found");
            }
            return resource;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to read certificate file");
        }
    }

    @Transactional(readOnly = true)
    public CertificateDto getById(Long certificateId) {
        return certificateRepository.findById(certificateId)
                .map(this::toDto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate not found"));
    }

    @Transactional(readOnly = true)
    public Certificate getCertificateEntityById(Long id) {
        Certificate certificate = certificateRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Certificate not found: " + id));
        if (certificate.getUser() != null) {
            certificate.getUser().getUsername();
        }
        return certificate;
    }

    private byte[] generateQrCodePng(String content) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, 240, 240);
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", output);
            return output.toByteArray();
        } catch (WriterException | IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate QR code");
        }
    }

    private void generateCertificatePdf(Path pdfPath,
                                        byte[] qrBytes,
                                        String code,
                                        User user,
                                        Course course) {
        try {
            PdfWriter writer = new PdfWriter(pdfPath.toFile());
            PdfDocument pdf = new PdfDocument(writer);
            pdf.setDefaultPageSize(PageSize.A4.rotate());
            Document document = new Document(pdf);

            document.add(new Paragraph("Ministry of Revenue Taxpayer Education Portal")
                    .setBold()
                    .setFontSize(18)
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("[LOGO PLACEHOLDER]")
                    .setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("\nCertificate of Completion")
                    .setBold()
                    .setFontSize(34)
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("This certifies that")
                    .setFontSize(16)
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph(user.getFirstName() + " " + user.getLastName())
                    .setBold()
                    .setFontSize(30)
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("has successfully completed")
                    .setFontSize(16)
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph(course.getTitle())
                    .setBold()
                    .setFontSize(24)
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Completion Date: " + LocalDate.now())
                    .setFontSize(14)
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Certificate Code: " + code)
                    .setFontSize(14)
                    .setTextAlignment(TextAlignment.CENTER));

            Image qrImage = new Image(ImageDataFactory.create(qrBytes)).scaleToFit(120, 120);
            qrImage.setFixedPosition(pdf.getDefaultPageSize().getWidth() - 150, 36);
            document.add(qrImage);

            document.close();
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate certificate PDF");
        }
    }

    private CertificateDto toDto(Certificate certificate) {
        return CertificateDto.builder()
                .id(certificate.getId())
                .userId(certificate.getUser().getId())
                .userFullName(certificate.getUser().getFirstName() + " " + certificate.getUser().getLastName())
                .courseId(certificate.getCourse().getId())
                .courseTitle(certificate.getCourse().getTitle())
                .certificateCode(certificate.getCertificateCode())
                .qrCode(certificate.getQrCode())
                .filePath(certificate.getFilePath())
                .issuedAt(certificate.getIssuedAt())
                .build();
    }
}
