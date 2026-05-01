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
public class LearningServiceClient {

    private final RestTemplate restTemplate;
    private final String learningServiceUrl;

    public LearningServiceClient(RestTemplate restTemplate,
                                 @Value("${services.learning-url:http://localhost:8083}") String learningServiceUrl) {
        this.restTemplate = restTemplate;
        this.learningServiceUrl = learningServiceUrl;
    }

    public Map<String, Object> getStats() {
        try {
            return restTemplate.exchange(
                    learningServiceUrl + "/internal/stats",
                    HttpMethod.GET, null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}).getBody();
        } catch (Exception ex) {
            log.error("Learning service stats unavailable: {}", ex.getMessage());
            return Map.of("totalEnrollments", 0, "completedEnrollments", 0, "totalCertificates", 0);
        }
    }
}
