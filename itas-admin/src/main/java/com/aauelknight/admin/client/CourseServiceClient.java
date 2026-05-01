package com.aauelknight.admin.client;

import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@Slf4j
public class CourseServiceClient {

    private final RestTemplate restTemplate;
    private final String courseServiceUrl;

    public CourseServiceClient(RestTemplate restTemplate,
                               @Value("${services.course-url:http://localhost:8082}") String courseServiceUrl) {
        this.restTemplate = restTemplate;
        this.courseServiceUrl = courseServiceUrl;
    }

    public Map<String, Object> getStats() {
        try {
            return restTemplate.exchange(
                    courseServiceUrl + "/internal/stats",
                    HttpMethod.GET, null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}).getBody();
        } catch (Exception ex) {
            log.error("Course service stats unavailable: {}", ex.getMessage());
            return Map.of("totalCourses", 0);
        }
    }
}
