package com.aauelknight.course.controller;

import com.aauelknight.course.courses.dto.response.CourseDto;
import com.aauelknight.course.courses.dto.response.CourseSectionDto;
import com.aauelknight.course.courses.service.CourseService;
import com.aauelknight.course.lecture.dto.response.LectureDto;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/internal")
public class InternalCourseController {

    private final CourseService courseService;

    public InternalCourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping("/courses/{courseId}")
    public ResponseEntity<CourseDto> getCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(courseService.getCourse(courseId));
    }

    @GetMapping("/courses/{courseId}/sections")
    public ResponseEntity<List<InternalSectionDto>> getSections(@PathVariable Long courseId) {
        CourseDto course = courseService.getCourse(courseId);
        List<InternalSectionDto> sections = course.getSections() == null
                ? List.of()
                : course.getSections().stream()
                .map(section -> toSectionDto(courseId, section))
                .toList();
        return ResponseEntity.ok(sections);
    }

    @GetMapping("/courses/{courseId}/lectures")
    public ResponseEntity<List<InternalLectureDto>> getLectures(@PathVariable Long courseId) {
        CourseDto course = courseService.getCourse(courseId);
        List<InternalLectureDto> lectures = course.getSections() == null
                ? List.of()
                : course.getSections().stream()
                .flatMap(section -> section.getLectures().stream()
                        .map(lecture -> toLectureDto(courseId, section.getId(), lecture)))
                .toList();
        return ResponseEntity.ok(lectures);
    }

    @GetMapping("/lectures/{lectureId}")
    public ResponseEntity<InternalLectureDto> getLecture(@PathVariable Long lectureId) {
        for (CourseDto summary : courseService.getAllAdminCourses()) {
            CourseDto course = courseService.getCourse(summary.getId());
            if (course.getSections() == null) {
                continue;
            }
            for (CourseSectionDto section : course.getSections()) {
                if (section.getLectures() == null) {
                    continue;
                }
                for (LectureDto lecture : section.getLectures()) {
                    if (lecture.getId().equals(lectureId)) {
                        return ResponseEntity.ok(toLectureDto(course.getId(), section.getId(), lecture));
                    }
                }
            }
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lecture not found");
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        return ResponseEntity.ok(Map.of(
                "totalCourses", courseService.getAllAdminCourses().size()
        ));
    }

    private InternalSectionDto toSectionDto(Long courseId, CourseSectionDto section) {
        List<InternalLectureDto> lectures = section.getLectures() == null
                ? List.of()
                : section.getLectures().stream()
                .map(lecture -> toLectureDto(courseId, section.getId(), lecture))
                .toList();
        return new InternalSectionDto(section.getId(), section.getTitle(), section.getOrderIndex(), lectures);
    }

    private InternalLectureDto toLectureDto(Long courseId, Long sectionId, LectureDto lecture) {
        return new InternalLectureDto(
                lecture.getId(),
                lecture.getTitle(),
                lecture.getType() != null ? lecture.getType().name() : null,
                lecture.getOrderIndex(),
                sectionId,
                courseId,
                lecture.isPreview(),
                lecture.getVideoUrl());
    }

    public record InternalSectionDto(
            Long id,
            String title,
            Integer orderIndex,
            List<InternalLectureDto> lectures) {
    }

    public record InternalLectureDto(
            Long id,
            String title,
            String type,
            Integer orderIndex,
            Long sectionId,
            Long courseId,
            Boolean preview,
            String videoUrl) {
    }
}
