package com.aauelknight.learning.service;

import com.aauelknight.learning.client.CourseServiceClient;
import com.aauelknight.learning.client.AuthServiceClient;
import com.aauelknight.learning.dto.LectureInfoDto;
import com.aauelknight.learning.dto.UserInfoDto;
import com.aauelknight.learning.dto.request.AssessmentCreateRequest;
import com.aauelknight.learning.dto.request.QuestionRequest;
import com.aauelknight.learning.dto.response.AssessmentAttemptDto;
import com.aauelknight.learning.dto.response.AssessmentDto;
import com.aauelknight.learning.dto.response.AssessmentQuestionAdminDto;
import com.aauelknight.learning.dto.response.AssessmentQuestionDto;
import com.aauelknight.learning.dto.response.AssessmentResultDto;
import com.aauelknight.learning.dto.response.CertificateDto;
import com.aauelknight.learning.entity.Assessment;
import com.aauelknight.learning.entity.AssessmentAttempt;
import com.aauelknight.learning.entity.AssessmentQuestion;
import com.aauelknight.learning.exception.ResourceNotFoundException;
import com.aauelknight.learning.repository.AssessmentAttemptRepository;
import com.aauelknight.learning.repository.AssessmentQuestionRepository;
import com.aauelknight.learning.repository.AssessmentRepository;
import com.aauelknight.learning.repository.CertificateRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Slf4j
public class AssessmentService extends GatewayAwareService {

    private final AssessmentRepository assessmentRepository;
    private final AssessmentQuestionRepository assessmentQuestionRepository;
    private final AssessmentAttemptRepository assessmentAttemptRepository;
    private final EnrollmentService enrollmentService;
    private final CertificateService certificateService;
    private final CertificateRepository certificateRepository;
    private final CourseServiceClient courseServiceClient;
    private final AuthServiceClient authServiceClient;
    private final ObjectMapper objectMapper;

    public AssessmentService(AssessmentRepository assessmentRepository,
                             AssessmentQuestionRepository assessmentQuestionRepository,
                             AssessmentAttemptRepository assessmentAttemptRepository,
                             EnrollmentService enrollmentService,
                             CertificateService certificateService,
                             CertificateRepository certificateRepository,
                             CourseServiceClient courseServiceClient,
                             AuthServiceClient authServiceClient,
                             ObjectMapper objectMapper) {
        this.assessmentRepository = assessmentRepository;
        this.assessmentQuestionRepository = assessmentQuestionRepository;
        this.assessmentAttemptRepository = assessmentAttemptRepository;
        this.enrollmentService = enrollmentService;
        this.certificateService = certificateService;
        this.certificateRepository = certificateRepository;
        this.courseServiceClient = courseServiceClient;
        this.authServiceClient = authServiceClient;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public AssessmentDto createAssessment(AssessmentCreateRequest request) {
        validateCreateRequest(request);
        if (request.getLectureId() == null && request.getSectionId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lectureId or sectionId is required");
        }

        Long courseId;
        Long sectionId = request.getSectionId();
        if (request.getLectureId() != null) {
            LectureInfoDto lecture = courseServiceClient.getLecture(request.getLectureId());
            courseId = lecture.getCourseId();
            sectionId = sectionId != null ? sectionId : lecture.getSectionId();
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lectureId is required for section assessments");
        }

        courseServiceClient.getCourse(courseId);
        Assessment assessment = Assessment.builder()
                .courseId(courseId)
                .sectionId(sectionId)
                .title(request.getTitle())
                .passingScore(request.getPassingScore())
                .maxAttempts(request.getMaxAttempts())
                .isFinalExam(Boolean.TRUE.equals(request.getFinalExam()))
                .build();
        return toDto(assessmentRepository.save(assessment));
    }

    @Transactional
    public AssessmentDto createAssessment(Long courseId, AssessmentCreateRequest request) {
        validateCreateRequest(request);
        courseServiceClient.getCourse(courseId);

        assessmentRepository.findFirstByCourseIdAndIsFinalExamTrueOrderByCreatedAtDesc(courseId)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Final exam already exists for this course");
                });

        Assessment assessment = Assessment.builder()
                .courseId(courseId)
                .sectionId(null)
                .title(request.getTitle())
                .passingScore(request.getPassingScore())
                .maxAttempts(request.getMaxAttempts())
                .isFinalExam(Boolean.TRUE.equals(request.getFinalExam()))
                .build();
        return toDto(assessmentRepository.save(assessment));
    }

    @Transactional
    public AssessmentQuestionDto addQuestion(Long assessmentId, QuestionRequest request) {
        Assessment assessment = findAssessment(assessmentId);
        int orderIndex = assessmentQuestionRepository.findByAssessmentIdOrderByOrderIndexAscIdAsc(assessmentId).size();
        AssessmentQuestion question = AssessmentQuestion.builder()
                .assessment(assessment)
                .questionText(request.getQuestionText())
                .questionType(request.getQuestionType())
                .optionsJson(request.getOptionsJson())
                .correctAnswer(request.getCorrectAnswer())
                .explanation(request.getExplanation())
                .points(request.getPoints() == null ? 1 : request.getPoints())
                .orderIndex(orderIndex)
                .build();
        return toQuestionDto(assessmentQuestionRepository.save(question));
    }

    @Transactional
    public void deleteQuestion(Long questionId) {
        AssessmentQuestion question = assessmentQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));
        assessmentQuestionRepository.delete(question);
    }

    @Transactional(readOnly = true)
    public AssessmentDto getAssessment(Long assessmentId) {
        return toDto(findAssessment(assessmentId));
    }

    @Transactional(readOnly = true)
    public AssessmentDto getByLectureId(Long lectureId) {
        LectureInfoDto lecture = courseServiceClient.getLecture(lectureId);
        if (lecture.getCourseId() == null || lecture.getSectionId() == null) {
            throw new ResourceNotFoundException("No assessment found for lecture: " + lectureId);
        }

        Assessment assessment = assessmentRepository.findByCourseIdAndSectionId(lecture.getCourseId(), lecture.getSectionId())
                .orElseThrow(() -> new ResourceNotFoundException("No assessment found for lecture: " + lectureId));
        return toDto(assessment);
    }

    @Transactional(readOnly = true)
    public AssessmentDto getByCourseId(Long courseId) {
        return getFinalExam(courseId);
    }

    @Transactional(readOnly = true)
    public AssessmentDto getFinalExam(Long courseId) {
        Assessment assessment = assessmentRepository.findFirstByCourseIdAndIsFinalExamTrueOrderByCreatedAtDesc(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("No final assessment found for course: " + courseId));
        return toDto(assessment);
    }

    @Transactional
    public AssessmentResultDto submitAssessment(Long userId, Long assessmentId, Map<Long, String> answersMap) {
        Assessment assessment = findAssessment(assessmentId);

        if (!enrollmentService.isEnrolled(userId, assessment.getCourseId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not enrolled in this course");
        }

        long attempts = assessmentAttemptRepository.countByAssessmentIdAndUserId(assessmentId, userId);
        if (attempts >= assessment.getMaxAttempts()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum attempts exceeded");
        }

        List<AssessmentQuestion> questions =
                assessmentQuestionRepository.findByAssessmentIdOrderByOrderIndexAscIdAsc(assessmentId);
        if (questions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assessment has no questions");
        }

        int totalPoints = 0;
        int earnedPoints = 0;
        int correctCount = 0;
        List<AssessmentResultDto.QuestionResult> questionResults = new ArrayList<>();

        for (AssessmentQuestion question : questions) {
            int points = question.getPoints() == null ? 1 : Math.max(question.getPoints(), 1);
            totalPoints += points;

            String selected = answersMap.getOrDefault(question.getId(), "");
            boolean isCorrect = normalize(selected).equals(normalize(question.getCorrectAnswer()));
            if (isCorrect) {
                earnedPoints += points;
                correctCount++;
            }

            questionResults.add(AssessmentResultDto.QuestionResult.builder()
                    .questionId(question.getId())
                    .questionText(question.getQuestionText())
                    .selectedAnswer(selected)
                    .correctAnswer(question.getCorrectAnswer())
                    .explanation(question.getExplanation())
                    .correct(isCorrect)
                    .points(points)
                    .build());
        }

        double score = totalPoints == 0 ? 0.0 : (earnedPoints * 100.0) / totalPoints;
        boolean passed = score >= assessment.getPassingScore();
        int attemptsRemaining = Math.max(0, assessment.getMaxAttempts() - ((int) attempts + 1));

        AssessmentAttempt attempt = AssessmentAttempt.builder()
                .assessment(assessment)
                .userId(userId)
                .score(score)
                .answersJson(toJson(answersMap))
                .attemptNumber((int) attempts + 1)
                .passed(passed)
                .submittedAt(LocalDateTime.now())
                .build();
        AssessmentAttempt saved = assessmentAttemptRepository.save(attempt);

        CertificateDto certificate = null;
        if (passed && Boolean.TRUE.equals(assessment.getIsFinalExam())) {
            enrollmentService.markComplete(userId, assessment.getCourseId());
            UserInfoDto user = authServiceClient.getUserById(userId);
            if (user.isEligibleForCertificate()) {
                boolean exists = certificateRepository.findByUserIdAndCourseId(userId, assessment.getCourseId()).isPresent();
                certificate = exists
                        ? certificateService.getByUserAndCourse(userId, assessment.getCourseId())
                        : certificateService.generate(userId, assessment.getCourseId());
                log.info("Certificate resolved for user {} course {}", userId, assessment.getCourseId());
            }
        } else if (passed) {
            certificate = certificateService.getByUserAndCourse(userId, assessment.getCourseId());
        }

        return toResultDto(saved, assessment, questionResults, correctCount, attemptsRemaining, certificate);
    }

    @Transactional(readOnly = true)
    public AssessmentResultDto getAttemptResult(Long attemptId) {
        AssessmentAttempt attempt = assessmentAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));
        Assessment assessment = attempt.getAssessment();
        List<AssessmentQuestion> questions =
                assessmentQuestionRepository.findByAssessmentIdOrderByOrderIndexAscIdAsc(assessment.getId());
        Map<Long, String> answersMap = parseAnswers(attempt.getAnswersJson());
        List<AssessmentResultDto.QuestionResult> questionResults = new ArrayList<>();
        int correctCount = 0;

        for (AssessmentQuestion question : questions) {
            int points = question.getPoints() == null ? 1 : Math.max(question.getPoints(), 1);
            String selected = answersMap.getOrDefault(question.getId(), "");
            boolean isCorrect = normalize(selected).equals(normalize(question.getCorrectAnswer()));
            if (isCorrect) {
                correctCount++;
            }

            questionResults.add(AssessmentResultDto.QuestionResult.builder()
                    .questionId(question.getId())
                    .questionText(question.getQuestionText())
                    .selectedAnswer(selected)
                    .correctAnswer(question.getCorrectAnswer())
                    .explanation(question.getExplanation())
                    .correct(isCorrect)
                    .points(points)
                    .build());
        }

        long attemptsUsed = assessmentAttemptRepository.countByAssessmentIdAndUserId(assessment.getId(), attempt.getUserId());
        int attemptsRemaining = Math.max(0, assessment.getMaxAttempts() - (int) attemptsUsed);
        CertificateDto certificate = attempt.getPassed()
                ? certificateService.getByUserAndCourse(attempt.getUserId(), assessment.getCourseId())
                : null;
        return toResultDto(attempt, assessment, questionResults, correctCount, attemptsRemaining, certificate);
    }

    @Transactional(readOnly = true)
    public List<AssessmentAttemptDto> getUserAttempts(Long userId, Long assessmentId) {
        return assessmentAttemptRepository.findByAssessmentIdAndUserIdOrderByAttemptNumberDesc(assessmentId, userId)
                .stream()
                .map(this::toAttemptDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AssessmentQuestionAdminDto> getQuestionsWithAnswers(Long assessmentId) {
        findAssessment(assessmentId);
        return assessmentQuestionRepository.findByAssessmentIdOrderByOrderIndexAscIdAsc(assessmentId).stream()
                .map(this::toQuestionAdminDto)
                .toList();
    }

    private Assessment findAssessment(Long assessmentId) {
        return assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));
    }

    private void validateCreateRequest(AssessmentCreateRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title is required");
        }
        if (request.getPassingScore() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "passingScore is required");
        }
        if (request.getMaxAttempts() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "maxAttempts is required");
        }
    }

    private AssessmentDto toDto(Assessment assessment) {
        List<AssessmentQuestion> questions =
                assessmentQuestionRepository.findByAssessmentIdOrderByOrderIndexAscIdAsc(assessment.getId());

        return AssessmentDto.builder()
                .id(assessment.getId())
                .courseId(assessment.getCourseId())
                .sectionId(assessment.getSectionId())
                .title(assessment.getTitle())
                .finalExam(assessment.getIsFinalExam())
                .passingScore(assessment.getPassingScore())
                .maxAttempts(assessment.getMaxAttempts())
                .createdAt(assessment.getCreatedAt())
                .questions(questions.stream().map(this::toQuestionDto).toList())
                .build();
    }

    private AssessmentQuestionDto toQuestionDto(AssessmentQuestion question) {
        return AssessmentQuestionDto.builder()
                .id(question.getId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .options(parseOptions(question.getOptionsJson()))
                .correctAnswer(question.getCorrectAnswer())
                .explanation(question.getExplanation())
                .points(question.getPoints())
                .build();
    }

    private AssessmentAttemptDto toAttemptDto(AssessmentAttempt attempt) {
        return AssessmentAttemptDto.builder()
                .id(attempt.getId())
                .assessmentId(attempt.getAssessment().getId())
                .attemptNumber(attempt.getAttemptNumber())
                .score(attempt.getScore())
                .passed(attempt.getPassed())
                .submittedAt(attempt.getSubmittedAt())
                .build();
    }

    private AssessmentQuestionAdminDto toQuestionAdminDto(AssessmentQuestion question) {
        return AssessmentQuestionAdminDto.builder()
                .id(question.getId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .optionsJson(question.getOptionsJson())
                .correctAnswer(question.getCorrectAnswer())
                .explanation(question.getExplanation())
                .points(question.getPoints())
                .build();
    }

    private AssessmentResultDto toResultDto(AssessmentAttempt attempt,
                                            Assessment assessment,
                                            List<AssessmentResultDto.QuestionResult> questionResults,
                                            int correctCount,
                                            int attemptsRemaining,
                                            CertificateDto certificate) {
        int totalQuestions = questionResults.size();
        return AssessmentResultDto.builder()
                .attemptId(attempt.getId())
                .assessmentId(assessment.getId())
                .score(attempt.getScore())
                .passed(attempt.getPassed())
                .correctAnswers(correctCount)
                .incorrectAnswers(totalQuestions - correctCount)
                .totalQuestions(totalQuestions)
                .passingScore(assessment.getPassingScore())
                .attemptNumber(attempt.getAttemptNumber())
                .attemptsRemaining(attemptsRemaining)
                .submittedAt(attempt.getSubmittedAt())
                .certificateId(certificate != null ? certificate.getId() : null)
                .certificateCode(certificate != null ? certificate.getCertificateCode() : null)
                .questionResults(questionResults)
                .build();
    }

    private List<String> parseOptions(String optionsJson) {
        if (optionsJson == null || optionsJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(optionsJson, new TypeReference<List<String>>() { });
        } catch (JsonProcessingException ex) {
            return List.of();
        }
    }

    private String toJson(Map<Long, String> answersMap) {
        try {
            return objectMapper.writeValueAsString(answersMap);
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to serialize answers");
        }
    }

    private Map<Long, String> parseAnswers(String answersJson) {
        if (answersJson == null || answersJson.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(answersJson, new TypeReference<Map<Long, String>>() { });
        } catch (JsonProcessingException ex) {
            return Map.of();
        }
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}
