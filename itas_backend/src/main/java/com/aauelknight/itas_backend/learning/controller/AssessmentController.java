package com.aauelknight.itas_backend.learning.controller;
import com.aauelknight.itas_backend.learning.dto.response.AssessmentAttemptDto;
import com.aauelknight.itas_backend.learning.dto.request.AssessmentCreateRequest;
import com.aauelknight.itas_backend.learning.dto.response.AssessmentDto;
import com.aauelknight.itas_backend.learning.dto.response.AssessmentQuestionAdminDto;
import com.aauelknight.itas_backend.learning.dto.response.AssessmentQuestionDto;
import com.aauelknight.itas_backend.learning.dto.request.QuestionRequest;
import com.aauelknight.itas_backend.learning.dto.response.AssessmentResultDto;
import com.aauelknight.itas_backend.learning.dto.request.AssessmentSubmitRequest;
import com.aauelknight.itas_backend.auth.entity.User;
import com.aauelknight.itas_backend.learning.service.AssessmentService;
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

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TAXPAYER','TAX_AGENT','MOR_STAFF','MANAGER','CONTENT_ADMIN','TRAINING_ADMIN','WEB_ADMIN')")
    public AssessmentDto getAssessment(@PathVariable Long id) {
        return assessmentService.getAssessment(id);
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public AssessmentDto create(@Valid @RequestBody AssessmentCreateRequest request) {
        return assessmentService.createAssessment(request);
    }

    @PostMapping("/{id}/questions")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<AssessmentQuestionDto> addQuestion(@PathVariable Long id,
                                                             @RequestBody @Valid QuestionRequest request) {
        return ResponseEntity.ok(assessmentService.addQuestion(id, request));
    }

    @DeleteMapping("/{assessmentId}/questions/{questionId}")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long assessmentId, @PathVariable Long questionId) {
        assessmentService.deleteQuestion(assessmentId, questionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/questions/admin")
    @PreAuthorize("hasAnyRole('CONTENT_ADMIN','TRAINING_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<List<AssessmentQuestionAdminDto>> getQuestionsAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(assessmentService.getQuestionsWithAnswers(id));
    }

    @PostMapping("/submit")
    @PreAuthorize("hasAnyRole('TAXPAYER','TAX_AGENT','MOR_STAFF','MANAGER')")
    public AssessmentResultDto submit(@Valid @RequestBody AssessmentSubmitRequest request,
                                      Authentication authentication) {
        Long userId = requireUserId(authentication);
        return assessmentService.submitAssessment(userId, request.getAssessmentId(), request.getAnswers());
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
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return user.getId();
    }
}

