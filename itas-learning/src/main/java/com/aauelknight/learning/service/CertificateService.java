package com.aauelknight.learning.service;

import com.aauelknight.learning.client.AuthServiceClient;
import com.aauelknight.learning.client.CourseServiceClient;
import com.aauelknight.learning.dto.CourseInfoDto;
import com.aauelknight.learning.dto.UserInfoDto;
import com.aauelknight.learning.dto.response.CertificateDto;
import com.aauelknight.learning.entity.Certificate;
import com.aauelknight.learning.exception.ResourceNotFoundException;
import com.aauelknight.learning.repository.CertificateRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CertificateService {

    private static final Logger log = LoggerFactory.getLogger(CertificateService.class);
    private static final Path CERT_DIR = Paths.get("uploads", "certificates");
    private static final DeviceRgb NAVY = new DeviceRgb(15, 40, 90);
    private static final DeviceRgb GOLD = new DeviceRgb(184, 145, 60);
    private static final DeviceRgb DARK_GRAY = new DeviceRgb(80, 80, 80);

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    private final CertificateRepository certificateRepository;
    private final AuthServiceClient authServiceClient;
    private final CourseServiceClient courseServiceClient;
    private final EmailService emailService;

    public CertificateService(CertificateRepository certificateRepository,
                              AuthServiceClient authServiceClient,
                              CourseServiceClient courseServiceClient,
                              EmailService emailService) {
        this.certificateRepository = certificateRepository;
        this.authServiceClient = authServiceClient;
        this.courseServiceClient = courseServiceClient;
        this.emailService = emailService;
    }

    @Transactional
    public CertificateDto generate(Long userId, Long courseId) {
        UserInfoDto user = authServiceClient.getUserById(userId);
        if (!user.isEligibleForCertificate()) {
            throw new AccessDeniedException("Taxpayers are not eligible for certificates");
        }

        Certificate existing = certificateRepository.findByUserIdAndCourseId(userId, courseId).orElse(null);
        if (existing != null) {
            return toDto(existing);
        }

        CourseInfoDto course = courseServiceClient.getCourse(courseId);
        Long seq = certificateRepository.nextCertificateSequence();
        int year = LocalDate.now().getYear();
        String code = String.format("MOR-%d-%06d", year, seq);
        String verifyUrl = frontendUrl + "/verify/" + java.util.UUID.randomUUID();

        byte[] qrBytes = generateQrBytes(verifyUrl);
        String qrBase64 = Base64.getEncoder().encodeToString(qrBytes);

        try {
            Files.createDirectories(CERT_DIR);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Cannot create certificate dir");
        }

        Path pdfPath = CERT_DIR.resolve(code + ".pdf");
        String verificationUuid = verifyUrl.substring(verifyUrl.lastIndexOf('/') + 1);
        generatePdf(pdfPath, qrBytes, code, verificationUuid, user, course);

        Certificate certificate = Certificate.builder()
                .userId(userId)
                .courseId(courseId)
                .certificateCode(code)
                .verificationUuid(verificationUuid)
                .qrCode(qrBase64)
                .filePath(pdfPath.toString())
                .issuedAt(LocalDateTime.now())
                .build();

        Certificate saved;
        try {
            saved = certificateRepository.save(certificate);
        } catch (DataIntegrityViolationException ex) {
            log.info("Certificate already exists for userId={} and courseId={}, returning existing record", userId, courseId);
            saved = certificateRepository.findByUserIdAndCourseId(userId, courseId).orElseThrow(() -> ex);
        }

        try {
            emailService.sendEmail(
                    user.getEmail(),
                    "[ITAS Portal] Certificate Earned: " + course.getTitle(),
                    emailService.buildCertificateEmail(user.getFullName(), course.getTitle(), frontendUrl + "/certificates"));
        } catch (Exception e) {
            log.warn("Certificate email failed: {}", e.getMessage());
        }

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public CertificateDto verifyByUuid(String uuid) {
        Certificate certificate = certificateRepository.findByVerificationUuid(uuid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate not found"));
        return toDto(certificate);
    }

    @Transactional(readOnly = true)
    public CertificateDto verifyByCode(String code) {
        Certificate certificate = certificateRepository.findByCertificateCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate not found"));
        return toDto(certificate);
    }

    @Transactional(readOnly = true)
    public java.util.List<CertificateDto> getByUser(Long userId) {
        return certificateRepository.findByUserIdOrderByIssuedAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public CertificateDto getByUserAndCourse(Long userId, Long courseId) {
        return certificateRepository.findByUserIdAndCourseId(userId, courseId).map(this::toDto).orElse(null);
    }

    @Transactional(readOnly = true)
    public CertificateDto getById(Long id) {
        return certificateRepository.findById(id).map(this::toDto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate not found"));
    }

    @Transactional(readOnly = true)
    public Certificate getCertificateEntityById(Long id) {
        return certificateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found: " + id));
    }

    public Resource loadPdf(Long id) {
        Certificate certificate = certificateRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate not found"));
        try {
            Path path = Paths.get(certificate.getFilePath()).toAbsolutePath().normalize();
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate file not found");
            }
            return resource;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Cannot read certificate file");
        }
    }

    private byte[] generateQrBytes(String content) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, 200, 200);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return out.toByteArray();
        } catch (WriterException | IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "QR generation failed");
        }
    }

    private void generatePdf(Path pdfPath,
                             byte[] qrBytes,
                             String code,
                             String uuid,
                             UserInfoDto user,
                             CourseInfoDto course) {
        try {
            PdfWriter writer = new PdfWriter(pdfPath.toFile());
            PdfDocument pdf = new PdfDocument(writer);
            PageSize pageSize = PageSize.A4.rotate();
            PdfPage page = pdf.addNewPage(pageSize);
            Document doc = new Document(pdf, pageSize);
            doc.setMargins(0, 0, 0, 0);

            float width = pageSize.getWidth();
            float height = pageSize.getHeight();

            PdfCanvas canvas = new PdfCanvas(page);
            canvas.setFillColor(new DeviceRgb(252, 251, 248))
                    .rectangle(0, 0, width, height)
                    .fill();

            float outer = 20f;
            canvas.setStrokeColor(NAVY)
                    .setLineWidth(3f)
                    .rectangle(outer, outer, width - (2 * outer), height - (2 * outer))
                    .stroke();

            float inner = 28f;
            canvas.setStrokeColor(GOLD)
                    .setLineWidth(1.2f)
                    .rectangle(inner, inner, width - (2 * inner), height - (2 * inner))
                    .stroke();

            float headerH = 90f;
            canvas.setFillColor(NAVY)
                    .rectangle(0, height - headerH, width, headerH)
                    .fill();
            canvas.setFillColor(GOLD)
                    .rectangle(0, height - headerH - 4f, width, 4f)
                    .fill();

            float footerH = 55f;
            canvas.setFillColor(NAVY)
                    .rectangle(0, 0, width, footerH)
                    .fill();
            canvas.setFillColor(GOLD)
                    .rectangle(0, footerH, width, 3f)
                    .fill();
            canvas.release();

            PdfFont serif = PdfFontFactory.createFont(StandardFonts.TIMES_ROMAN);
            PdfFont serifBold = PdfFontFactory.createFont(StandardFonts.TIMES_BOLD);
            PdfFont sans = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont sansBold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

            doc.add(new Paragraph("MINISTRY OF REVENUE")
                    .setFont(sansBold)
                    .setFontSize(14)
                    .setFontColor(ColorConstants.WHITE)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(14f)
                    .setMarginBottom(2f));

            doc.add(new Paragraph("Taxpayer Education Portal")
                    .setFont(sans)
                    .setFontSize(10)
                    .setFontColor(GOLD)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(0f));

            doc.add(new Paragraph("CERTIFICATE OF COMPLETION")
                    .setFont(serifBold)
                    .setFontSize(28)
                    .setFontColor(NAVY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(28f)
                    .setMarginBottom(6f));

            doc.add(new Paragraph("This is to certify that")
                    .setFont(serif)
                    .setFontSize(13)
                    .setFontColor(DARK_GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(6f));

            doc.add(new Paragraph(user.getFullName())
                    .setFont(serifBold)
                    .setFontSize(34)
                    .setFontColor(NAVY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(6f));

            doc.add(new Paragraph("has successfully completed the course")
                    .setFont(serif)
                    .setFontSize(13)
                    .setFontColor(DARK_GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(8f));

            doc.add(new Paragraph(course.getTitle())
                    .setFont(serifBold)
                    .setFontSize(20)
                    .setFontColor(GOLD)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(18f));

            Table bottomTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1}))
                    .setWidth(UnitValue.createPercentValue(95))
                    .setHorizontalAlignment(HorizontalAlignment.CENTER)
                    .setMarginTop(0f);

            Cell leftCell = new Cell()
                    .setBorder(Border.NO_BORDER)
                    .setPaddingLeft(40f)
                    .setPaddingBottom(20f);
            leftCell.add(new Paragraph("\n\n\n").setFontSize(8));
            leftCell.add(new Paragraph("____________________________")
                    .setFont(serif)
                    .setFontSize(9)
                    .setFontColor(NAVY));
            leftCell.add(new Paragraph("Authorized Signatory")
                    .setFont(sans)
                    .setFontSize(8)
                    .setFontColor(DARK_GRAY));
            leftCell.add(new Paragraph("Ministry of Revenue")
                    .setFont(sans)
                    .setFontSize(8)
                    .setFontColor(DARK_GRAY));
            bottomTable.addCell(leftCell);

            String issueDate = LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));
            Cell centerCell = new Cell()
                    .setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setPaddingTop(10f);
            centerCell.add(new Paragraph("Certificate No.")
                    .setFont(sansBold)
                    .setFontSize(8)
                    .setFontColor(GOLD));
            centerCell.add(new Paragraph(code)
                    .setFont(sans)
                    .setFontSize(9)
                    .setFontColor(NAVY));
            centerCell.add(new Paragraph(" "));
            centerCell.add(new Paragraph("Date Issued")
                    .setFont(sansBold)
                    .setFontSize(8)
                    .setFontColor(GOLD));
            centerCell.add(new Paragraph(issueDate)
                    .setFont(sans)
                    .setFontSize(9)
                    .setFontColor(NAVY));
            centerCell.add(new Paragraph(" "));
            centerCell.add(new Paragraph("Verify at:")
                    .setFont(sansBold)
                    .setFontSize(7)
                    .setFontColor(GOLD));
            centerCell.add(new Paragraph(frontendUrl + "/verify/" + uuid)
                    .setFont(sans)
                    .setFontSize(6)
                    .setFontColor(DARK_GRAY));
            bottomTable.addCell(centerCell);

            Cell rightCell = new Cell()
                    .setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setPaddingRight(40f)
                    .setPaddingBottom(10f);
            Image qrImg = new Image(ImageDataFactory.create(qrBytes))
                    .setWidth(80)
                    .setHeight(80);
            rightCell.add(qrImg);
            rightCell.add(new Paragraph("Scan to verify")
                    .setFont(sans)
                    .setFontSize(7)
                    .setFontColor(DARK_GRAY)
                    .setTextAlignment(TextAlignment.CENTER));
            bottomTable.addCell(rightCell);

            doc.add(bottomTable);

            doc.add(new Paragraph(
                    "This certificate is digitally verifiable. Scan the QR code or visit "
                            + frontendUrl + "/verify/" + uuid)
                    .setFont(sans)
                    .setFontSize(7)
                    .setFontColor(ColorConstants.WHITE)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFixedPosition(0, 8f, width));

            doc.close();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "PDF generation failed: " + e.getMessage());
        }
    }

    private CertificateDto toDto(Certificate certificate) {
        UserInfoDto user = authServiceClient.getUserById(certificate.getUserId());
        CourseInfoDto course = courseServiceClient.getCourse(certificate.getCourseId());
        String verifyUrl = frontendUrl + "/verify/" + certificate.getVerificationUuid();

        return CertificateDto.builder()
                .id(certificate.getId())
                .userId(certificate.getUserId())
                .userFullName(user.getFullName())
                .courseId(certificate.getCourseId())
                .courseTitle(course.getTitle())
                .certificateCode(certificate.getCertificateCode())
                .verificationUuid(certificate.getVerificationUuid())
                .verifyUrl(verifyUrl)
                .qrCode(certificate.getQrCode())
                .filePath(certificate.getFilePath())
                .issuedAt(certificate.getIssuedAt())
                .status("VALID")
                .build();
    }
}
