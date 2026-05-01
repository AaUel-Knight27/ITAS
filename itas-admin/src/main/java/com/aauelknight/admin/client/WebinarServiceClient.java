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
public class WebinarServiceClient {

    private final RestTemplate restTemplate;
    private final String webinarServiceUrl;

    public WebinarServiceClient(RestTemplate restTemplate,
                                @Value("${services.webinar-url:http://localhost:8084}") String webinarServiceUrl) {
        this.restTemplate = restTemplate;
        this.webinarServiceUrl = webinarServiceUrl;
    }

    public Map<String, Object> getStats() {
        try {
            return restTemplate.exchange(
                    webinarServiceUrl + "/internal/stats",
                    HttpMethod.GET, null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}).getBody();
        } catch (Exception ex) {
            log.error("Webinar service stats unavailable: {}", ex.getMessage());
            return Map.of("totalWebinars", 0, "totalRegistrations", 0);
        }
    }
}
