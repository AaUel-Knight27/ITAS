package com.aauelknight.learning.controller;

import com.aauelknight.learning.dto.request.AssessmentCreateRequest;
import com.aauelknight.learning.dto.response.AssessmentDto;
import com.aauelknight.learning.entity.EnrollmentStatus;
import com.aauelknight.learning.repository.CertificateRepository;
import com.aauelknight.learning.repository.EnrollmentRepository;
import com.aauelknight.learning.service.AssessmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/internal")
public class InternalLearningController {

    private final AssessmentService assessmentService;
    private final EnrollmentRepository enrollmentRepository;
    private final CertificateRepository certificateRepository;

    public InternalLearningController(AssessmentService assessmentService,
                                      EnrollmentRepository enrollmentRepository,
                                      CertificateRepository certificateRepository) {
        this.assessmentService = assessmentService;
        this.enrollmentRepository = enrollmentRepository;
        this.certificateRepository = certificateRepository;
    }

    @PostMapping("/courses/{courseId}/final-exam")
    public ResponseEntity<AssessmentDto> createFinalExam(@PathVariable Long courseId,
                                                         @RequestBody AssessmentCreateRequest request) {
        request.setFinalExam(true);
        request.setSectionId(null);
        return ResponseEntity.ok(assessmentService.createAssessment(courseId, request));
    }

    @GetMapping("/courses/{courseId}/final-exam")
    public ResponseEntity<AssessmentDto> getFinalExam(@PathVariable Long courseId) {
        return ResponseEntity.ok(assessmentService.getFinalExam(courseId));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        return ResponseEntity.ok(Map.of(
                "totalEnrollments", enrollmentRepository.count(),
                "completedEnrollments", enrollmentRepository.countByStatus(EnrollmentStatus.COMPLETED),
                "totalCertificates", certificateRepository.count()));
    }
}
