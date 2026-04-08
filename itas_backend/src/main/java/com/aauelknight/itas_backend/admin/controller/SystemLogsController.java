package com.aauelknight.itas_backend.admin.controller;
import com.aauelknight.itas_backend.admin.dto.response.ActivityLogDto;
import com.aauelknight.itas_backend.admin.entity.UserActivityLog;
import com.aauelknight.itas_backend.admin.repository.UserActivityLogRepository;
import java.nio.charset.StandardCharsets;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('WEB_ADMIN')")
public class SystemLogsController {

    private final UserActivityLogRepository logRepository;

    @GetMapping("/activity")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<ActivityLogDto>> getActivity(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String activityType,
            @RequestParam(required = false) String username) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<UserActivityLog> logs = logRepository.findAllFiltered(activityType, username, pageable);

        return ResponseEntity.ok(logs.map(log -> ActivityLogDto.builder()
                .id(log.getId())
                .username(log.getUser() != null ? log.getUser().getUsername() : "System")
                .activityType(log.getActivityType())
                .resourceId(log.getResourceId() != null ? log.getResourceId().toString() : null)
                .createdAt(log.getCreatedAt().toString())
                .build()));
    }

    @GetMapping("/export")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> export() {
        List<UserActivityLog> all = logRepository.findAllByOrderByCreatedAtDesc();

        StringBuilder csv = new StringBuilder();
        csv.append("id,username,activityType,resourceId,createdAt\n");

        all.forEach(log -> csv.append(log.getId()).append(",")
                .append(log.getUser() != null ? log.getUser().getUsername() : "System").append(",")
                .append(log.getActivityType()).append(",")
                .append(log.getResourceId() != null ? log.getResourceId() : "").append(",")
                .append(log.getCreatedAt()).append("\n"));

        byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=activity-logs.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }
}

