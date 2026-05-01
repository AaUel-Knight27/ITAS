package com.aauelknight.learning.client;

import com.aauelknight.learning.dto.CourseInfoDto;
import com.aauelknight.learning.dto.LectureInfoDto;
import com.aauelknight.learning.dto.SectionInfoDto;
import java.util.Arrays;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

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

    public CourseInfoDto getCourse(Long courseId) {
        try {
            return restTemplate.getForObject(courseServiceUrl + "/internal/courses/" + courseId, CourseInfoDto.class);
        } catch (HttpClientErrorException.NotFound ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        } catch (Exception e) {
            log.error("Course service unavailable for course {}: {}", courseId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Course service unavailable");
        }
    }

    public LectureInfoDto getLecture(Long lectureId) {
        try {
            return restTemplate.getForObject(courseServiceUrl + "/internal/lectures/" + lectureId, LectureInfoDto.class);
        } catch (HttpClientErrorException.NotFound ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lecture not found");
        } catch (Exception e) {
            log.error("Course service unavailable for lecture {}: {}", lectureId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Course service unavailable");
        }
    }

    public List<LectureInfoDto> getCourseLectures(Long courseId) {
        try {
            LectureInfoDto[] lectures = restTemplate.getForObject(
                    courseServiceUrl + "/internal/courses/" + courseId + "/lectures",
                    LectureInfoDto[].class);
            return lectures != null ? Arrays.asList(lectures) : List.of();
        } catch (Exception e) {
            log.warn("Could not fetch lectures for course {}: {}", courseId, e.getMessage());
            return List.of();
        }
    }

    public List<SectionInfoDto> getCourseSections(Long courseId) {
        try {
            SectionInfoDto[] sections = restTemplate.getForObject(
                    courseServiceUrl + "/internal/courses/" + courseId + "/sections",
                    SectionInfoDto[].class);
            return sections != null ? Arrays.asList(sections) : List.of();
        } catch (Exception e) {
            log.warn("Could not fetch sections for course {}: {}", courseId, e.getMessage());
            return List.of();
        }
    }
}
