package com.aauelknight.learning.controller;

import com.aauelknight.learning.dto.request.AssessmentCreateRequest;
import com.aauelknight.learning.dto.request.AssessmentSubmitRequest;
import com.aauelknight.learning.dto.request.QuestionRequest;
import com.aauelknight.learning.dto.response.AssessmentAttemptDto;
import com.aauelknight.learning.dto.response.AssessmentDto;
import com.aauelknight.learning.dto.response.AssessmentQuestionAdminDto;
import com.aauelknight.learning.dto.response.AssessmentQuestionDto;
import com.aauelknight.learning.dto.response.AssessmentResultDto;
import com.aauelknight.learning.security.GatewayPrincipal;
import com.aauelknight.learning.service.AssessmentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/lms/assessment")
public class AssessmentController {

    private final AssessmentService assessmentService;

    public AssessmentController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @GetMapping("/lecture/{lectureId}")
    @PreAuthorize("isAuthenticated()")
    public AssessmentDto getByLecture(@PathVariable Long lectureId) {
        return assessmentService.getByLectureId(lectureId);
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("isAuthenticated()")
    public AssessmentDto getByCourse(@PathVariable Long courseId) {
        return assessmentService.getByCourseId(courseId);
    }

    @PostMapping("/submit")
    @PreAuthorize("hasAnyRole('TAXPAYER','TAX_AGENT','MOR_STAFF','MANAGER')")
    public AssessmentResultDto submit(@Valid @RequestBody AssessmentSubmitRequest request,
                                      Authentication authentication) {
        return assessmentService.submitAssessment(requireUserId(authentication), request.getAssessmentId(), request.getAnswers());
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public AssessmentDto create(@Valid @RequestBody AssessmentCreateRequest request) {
        return assessmentService.createAssessment(request);
    }

    @PostMapping("/{id}/questions")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<AssessmentQuestionDto> addQuestion(@PathVariable Long id,
                                                             @Valid @RequestBody QuestionRequest request) {
        return ResponseEntity.ok(assessmentService.addQuestion(id, request));
    }

    @DeleteMapping("/question/{questionId}")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long questionId) {
        assessmentService.deleteQuestion(questionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/questions/admin")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<List<AssessmentQuestionAdminDto>> getQuestionsAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(assessmentService.getQuestionsWithAnswers(id));
    }

    @GetMapping("/result/{attemptId}")
    @PreAuthorize("hasAnyRole('TAXPAYER','TAX_AGENT','MOR_STAFF','MANAGER')")
    public AssessmentResultDto getResult(@PathVariable Long attemptId) {
        return assessmentService.getAttemptResult(attemptId);
    }

    @GetMapping("/attempts/{assessmentId}")
    @PreAuthorize("hasAnyRole('TAXPAYER','TAX_AGENT','MOR_STAFF','MANAGER')")
    public List<AssessmentAttemptDto> getAttempts(@PathVariable Long assessmentId, Authentication authentication) {
        return assessmentService.getUserAttempts(requireUserId(authentication), assessmentId);
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
