package com.aauelknight.itas_backend.admin.controller;
import com.aauelknight.itas_backend.admin.dto.response.ActivityLogDto;
import com.aauelknight.itas_backend.admin.dto.response.AnalyticsDashboardDto;
import com.aauelknight.itas_backend.admin.dto.response.CourseCompletionRateDto;
import com.aauelknight.itas_backend.admin.dto.response.DailyEnrollmentDto;
import com.aauelknight.itas_backend.admin.dto.response.QuizPassRateDto;
import com.aauelknight.itas_backend.admin.dto.response.RoleCountDto;
import com.aauelknight.itas_backend.admin.service.AnalyticsService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER','WEB_ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<AnalyticsDashboardDto> getDashboard() {
        return ResponseEntity.ok(analyticsService.getDashboard());
    }

    @GetMapping("/enrollments-over-time")
    public ResponseEntity<List<DailyEnrollmentDto>> getEnrollments(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getEnrollmentsOverTime(days));
    }

    @GetMapping("/completion-rates")
    public ResponseEntity<List<CourseCompletionRateDto>> getCompletionRates() {
        return ResponseEntity.ok(analyticsService.getCompletionRates());
    }

    @GetMapping("/learners-by-role")
    public ResponseEntity<List<RoleCountDto>> getLearnersByRole() {
        return ResponseEntity.ok(analyticsService.getLearnersByRole());
    }

    @GetMapping("/quiz-pass-rates")
    public ResponseEntity<List<QuizPassRateDto>> getQuizPassRates() {
        return ResponseEntity.ok(analyticsService.getQuizPassRates());
    }

    @GetMapping("/recent-activity")
    public ResponseEntity<List<ActivityLogDto>> getRecentActivity(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(analyticsService.getRecentActivity(limit));
    }
}

