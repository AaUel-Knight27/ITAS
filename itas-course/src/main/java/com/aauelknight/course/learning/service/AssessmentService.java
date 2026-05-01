package com.aauelknight.course.learning.service;

import com.aauelknight.course.learning.dto.request.AssessmentCreateRequest;
import com.aauelknight.course.learning.dto.response.AssessmentDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.RequestEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AssessmentService {

    private final RestTemplate restTemplate;
    private final String learningServiceUrl;

    public AssessmentService(RestTemplate restTemplate,
                             @Value("${services.learning-url:http://localhost:8083}") String learningServiceUrl) {
        this.restTemplate = restTemplate;
        this.learningServiceUrl = learningServiceUrl;
    }

    public AssessmentDto createAssessment(Long courseId, AssessmentCreateRequest request) {
        try {
            return restTemplate.postForObject(
                    learningServiceUrl + "/internal/courses/" + courseId + "/final-exam",
                    request,
                    AssessmentDto.class);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Learning service unavailable");
        }
    }

    public AssessmentDto getFinalExam(Long courseId) {
        try {
            RequestEntity<Void> request = new RequestEntity<>(
                    HttpMethod.GET,
                    java.net.URI.create(learningServiceUrl + "/internal/courses/" + courseId + "/final-exam"));
            return restTemplate.exchange(request, AssessmentDto.class).getBody();
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Learning service unavailable");
        }
    }
}
