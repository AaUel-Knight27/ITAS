package com.aauelknight.itas_backend.modules.learning;

import com.aauelknight.itas_backend.dto.AssessmentAttemptDto;
import com.aauelknight.itas_backend.dto.AssessmentCreateRequest;
import com.aauelknight.itas_backend.dto.AssessmentDto;
import com.aauelknight.itas_backend.dto.AssessmentQuestionAdminDto;
import com.aauelknight.itas_backend.dto.AssessmentQuestionCreateRequest;
import com.aauelknight.itas_backend.dto.AssessmentQuestionDto;
import com.aauelknight.itas_backend.dto.QuestionRequest;
import com.aauelknight.itas_backend.dto.AssessmentResultDto;
import com.aauelknight.itas_backend.dto.CertificateDto;
import com.aauelknight.itas_backend.modules.learning.Assessment;
import com.aauelknight.itas_backend.modules.learning.AssessmentAttempt;
import com.aauelknight.itas_backend.modules.learning.AssessmentQuestion;
import com.aauelknight.itas_backend.modules.courses.Lecture;
import com.aauelknight.itas_backend.modules.courses.LectureType;
import com.aauelknight.itas_backend.modules.auth.User;
import com.aauelknight.itas_backend.shared.exception.ResourceNotFoundException;
import com.aauelknight.itas_backend.modules.learning.AssessmentAttemptRepository;
import com.aauelknight.itas_backend.modules.learning.AssessmentQuestionRepository;
import com.aauelknight.itas_backend.modules.learning.AssessmentRepository;
import com.aauelknight.itas_backend.modules.courses.LectureRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final AssessmentQuestionRepository assessmentQuestionRepository;
    private final AssessmentAttemptRepository assessmentAttemptRepository;
    private final EnrollmentService enrollmentService;
    private final CertificateService certificateService;
    private final ObjectMapper objectMapper;
    private final LectureRepository lectureRepository;

    public AssessmentService(AssessmentRepository assessmentRepository,
                             AssessmentQuestionRepository assessmentQuestionRepository,
                             AssessmentAttemptRepository assessmentAttemptRepository,
                             EnrollmentService enrollmentService,
                             CertificateService certificateService,
                             ObjectMapper objectMapper,
                             LectureRepository lectureRepository) {
        this.assessmentRepository = assessmentRepository;
        this.assessmentQuestionRepository = assessmentQuestionRepository;
        this.assessmentAttemptRepository = assessmentAttemptRepository;
        this.enrollmentService = enrollmentService;
        this.certificateService = certificateService;
        this.objectMapper = objectMapper;
        this.lectureRepository = lectureRepository;
    }

    @Transactional
    public AssessmentDto createAssessment(AssessmentCreateRequest request) {
        Lecture lecture = lectureRepository.findById(request.getLectureId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lecture not found"));
        if (lecture.getType() != LectureType.QUIZ) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assessment can only be linked to QUIZ lecture");
        }

        Assessment assessment = Assessment.builder()
                .lecture(lecture)
                .section(lecture.getSection())
                .course(lecture.getSection().getCourse())
                .title(request.getTitle())
                .passingScore(request.getPassingScore())
                .maxAttempts(request.getMaxAttempts())
                .build();
        Assessment saved = assessmentRepository.save(assessment);

        return AssessmentDto.builder()
                .id(saved.getId())
                .courseId(saved.getCourse().getId())
                .sectionId(saved.getSection() != null ? saved.getSection().getId() : null)
                .title(saved.getTitle())
                .passingScore(saved.getPassingScore())
                .maxAttempts(saved.getMaxAttempts())
                .createdAt(saved.getCreatedAt())
                .questions(List.of())
                .build();
    }

    @Transactional
    public AssessmentQuestionAdminDto addQuestion(Long assessmentId, AssessmentQuestionCreateRequest request) {
        Assessment assessment = findAssessment(assessmentId);
        AssessmentQuestion question = AssessmentQuestion.builder()
                .assessment(assessment)
                .questionText(request.getQuestionText())
                .questionType(request.getQuestionType())
                .optionsJson(request.getOptionsJson())
                .correctAnswer(request.getCorrectAnswer())
                .explanation(request.getExplanation())
                .points(request.getPoints())
                .build();
        return toQuestionAdminDto(assessmentQuestionRepository.save(question));
    }

    @Transactional
    public AssessmentQuestionDto addQuestion(Long assessmentId, QuestionRequest request) {
        Assessment assessment = findAssessment(assessmentId);
        AssessmentQuestion question = AssessmentQuestion.builder()
                .assessment(assessment)
                .questionText(request.getQuestionText())
                .questionType(request.getQuestionType())
                .optionsJson(request.getOptionsJson())
                .correctAnswer(request.getCorrectAnswer())
                .explanation(request.getExplanation())
                .points(request.getPoints() == null ? 1 : request.getPoints())
                .build();
        return toQuestionDto(assessmentQuestionRepository.save(question));
    }

    @Transactional
    public void deleteQuestion(Long assessmentId, Long questionId) {
        AssessmentQuestion question = assessmentQuestionRepository.findByIdAndAssessmentId(questionId, assessmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));
        assessmentQuestionRepository.delete(question);
    }

    public List<AssessmentQuestionAdminDto> getQuestionsAdmin(Long assessmentId) {
        findAssessment(assessmentId);
        return assessmentQuestionRepository.findByAssessmentIdOrderByIdAsc(assessmentId).stream()
                .map(this::toQuestionAdminDto)
                .toList();
    }

    public List<AssessmentQuestionAdminDto> getQuestionsWithAnswers(Long assessmentId) {
        return getQuestionsAdmin(assessmentId);
    }

    @Transactional(readOnly = true)
    public AssessmentDto getAssessment(Long assessmentId) {
        Assessment assessment = findAssessment(assessmentId);
        return toDto(assessment);
    }

    @Transactional(readOnly = true)
    public AssessmentDto getByLectureId(Long lectureId) {
        List<Assessment> assessments = assessmentRepository.findByLectureId(lectureId);

        if (assessments.isEmpty()) {
            throw new ResourceNotFoundException("No assessment found for lecture: " + lectureId);
        }

        Assessment assessment = assessments.stream()
                .max(Comparator.comparing(Assessment::getId))
                .orElseThrow(() -> new ResourceNotFoundException("No assessment for lecture: " + lectureId));

        return toDto(assessment);
    }

    @Transactional(readOnly = true)
    public AssessmentDto getByCourseId(Long courseId) {
        List<Assessment> assessments = assessmentRepository.findByCourseId(courseId);

        if (assessments.isEmpty()) {
            throw new ResourceNotFoundException("No assessment found for course: " + courseId);
        }

        return toDto(assessments.stream()
                .max(Comparator.comparing(Assessment::getId))
                .orElseThrow());
    }

    @Transactional
    public AssessmentResultDto submitAssessment(Long userId, Long assessmentId, Map<Long, String> answersMap) {
        Assessment assessment = findAssessment(assessmentId);
        Long courseId = assessment.getCourse().getId();

        if (!enrollmentService.isEnrolled(userId, courseId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not enrolled in this course");
        }

        long attempts = assessmentAttemptRepository.countByUserIdAndAssessmentId(userId, assessmentId);
        if (attempts >= assessment.getMaxAttempts()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum attempts exceeded");
        }

        List<AssessmentQuestion> questions = assessmentQuestionRepository.findByAssessmentIdOrderByIdAsc(assessmentId);
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
                .user(enrollmentService.getUserById(userId))
                .score(score)
                .answersJson(toJson(answersMap))
                .attemptNumber((int) attempts + 1)
                .passed(passed)
                .submittedAt(LocalDateTime.now())
                .build();
        AssessmentAttempt saved = assessmentAttemptRepository.save(attempt);

        CertificateDto certificate = null;
        if (passed) {
            User user = enrollmentService.getUserById(userId);
            enrollmentService.markComplete(userId, courseId);
            if (user.isEligibleForCertificate()) {
                certificate = certificateService.generate(userId, courseId);
            }
        }
        return toResultDto(saved, assessment, questionResults, correctCount, attemptsRemaining, certificate);
    }

    @Transactional(readOnly = true)
    public AssessmentResultDto getAttemptResult(Long attemptId) {
        AssessmentAttempt attempt = assessmentAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));
        Assessment assessment = attempt.getAssessment();
        List<AssessmentQuestion> questions = assessmentQuestionRepository.findByAssessmentIdOrderByIdAsc(assessment.getId());
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

        long attemptsUsed = assessmentAttemptRepository.countByUserIdAndAssessmentId(attempt.getUser().getId(), assessment.getId());
        int attemptsRemaining = Math.max(0, assessment.getMaxAttempts() - (int) attemptsUsed);
        CertificateDto certificate = attempt.isPassed()
                ? certificateService.getByUserAndCourse(attempt.getUser().getId(), assessment.getCourse().getId())
                : null;
        return toResultDto(attempt, assessment, questionResults, correctCount, attemptsRemaining, certificate);
    }

    @Transactional(readOnly = true)
    public List<AssessmentAttemptDto> getUserAttempts(Long userId, Long assessmentId) {
        return assessmentAttemptRepository.findByUserIdAndAssessmentIdOrderByAttemptNumberDesc(userId, assessmentId)
                .stream()
                .map(this::toAttemptDto)
                .toList();
    }

    private Assessment findAssessment(Long assessmentId) {
        return assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));
    }

    private AssessmentDto toDto(Assessment assessment) {
        List<AssessmentQuestion> questions = assessmentQuestionRepository.findByAssessmentIdOrderByIdAsc(assessment.getId());

        return AssessmentDto.builder()
                .id(assessment.getId())
                .courseId(assessment.getCourse().getId())
                .sectionId(assessment.getSection() != null ? assessment.getSection().getId() : null)
                .title(assessment.getTitle())
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
                .passed(attempt.isPassed())
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
                .passed(attempt.isPassed())
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
            return objectMapper.readValue(optionsJson, new TypeReference<List<String>>() {
            });
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
            return objectMapper.readValue(answersJson, new TypeReference<Map<Long, String>>() {
            });
        } catch (JsonProcessingException ex) {
            return Map.of();
        }
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}
