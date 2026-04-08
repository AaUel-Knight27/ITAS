package com.aauelknight.itas_backend.courses.service;

import com.aauelknight.itas_backend.courses.dto.response.SearchFilterDto;
import com.aauelknight.itas_backend.courses.dto.response.SearchResponseDto;
import com.aauelknight.itas_backend.courses.dto.response.SearchResultDto;
import com.aauelknight.itas_backend.courses.entity.Course;
import com.aauelknight.itas_backend.lecture.entity.Lecture;
import com.aauelknight.itas_backend.courses.repository.CategoryRepository;
import com.aauelknight.itas_backend.courses.repository.CourseRepository;
import com.aauelknight.itas_backend.lecture.repository.LectureRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final CourseRepository courseRepository;
    private final LectureRepository lectureRepository;
    @SuppressWarnings("unused")
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public SearchResponseDto search(String query, int limit) {
        if (query == null || query.isBlank()) {
            return SearchResponseDto.builder()
                    .query(query)
                    .totalResults(0)
                    .searchTimeMs(0)
                    .courses(List.of())
                    .lectures(List.of())
                    .suggestions(List.of())
                    .build();
        }

        long startTime = System.currentTimeMillis();
        String cleanQuery = query.trim();

        List<SearchResultDto> courseResults = searchCourses(cleanQuery, limit);
        List<SearchResultDto> lectureResults = searchLectures(cleanQuery, limit);
        List<String> suggestions = courseRepository.getSearchSuggestions(cleanQuery).stream()
                .filter(title -> !title.equalsIgnoreCase(cleanQuery))
                .limit(5)
                .collect(Collectors.toList());

        long elapsed = System.currentTimeMillis() - startTime;

        return SearchResponseDto.builder()
                .query(cleanQuery)
                .totalResults(courseResults.size() + lectureResults.size())
                .searchTimeMs(elapsed)
                .courses(courseResults)
                .lectures(lectureResults)
                .suggestions(suggestions)
                .build();
    }

    @Transactional(readOnly = true)
    public List<SearchResultDto> filter(SearchFilterDto filter) {
        String query = filter.getQuery() != null ? filter.getQuery().trim() : "";
        List<Course> courses = courseRepository.filterCourses(
                query,
                filter.getCategory(),
                filter.getDifficulty());

        return courses.stream()
                .map(this::courseToResult)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getSuggestions(String prefix) {
        if (prefix == null || prefix.trim().length() < 2) {
            return List.of();
        }
        return courseRepository.getSearchSuggestions(prefix.trim());
    }

    private List<SearchResultDto> searchCourses(String query, int limit) {
        try {
            List<Object[]> rows = courseRepository.searchCoursesFTS(query, limit);
            if (!rows.isEmpty()) {
                return rows.stream()
                        .map(row -> SearchResultDto.builder()
                                .type("COURSE")
                                .id(((Number) row[0]).longValue())
                                .title((String) row[1])
                                .description((String) row[2])
                                .thumbnailUrl((String) row[3])
                                .categoryName((String) row[4])
                                .slug((String) row[5])
                                .relevanceScore(row[6] instanceof Number ? ((Number) row[6]).doubleValue() : null)
                                .highlight((String) row[7])
                                .build())
                        .collect(Collectors.toList());
            }
        } catch (Exception ignored) {
            // Fall back to LIKE search if FTS is unavailable or native mapping fails.
        }

        return courseRepository.filterCourses(query, null, null).stream()
                .limit(limit)
                .map(this::courseToResult)
                .collect(Collectors.toList());
    }

    private List<SearchResultDto> searchLectures(String query, int limit) {
        return lectureRepository.searchLectures(query).stream()
                .limit(limit)
                .map(this::lectureToResult)
                .collect(Collectors.toList());
    }

    private SearchResultDto courseToResult(Course course) {
        return SearchResultDto.builder()
                .type("COURSE")
                .id(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .thumbnailUrl(course.getThumbnailUrl())
                .categoryName(course.getCategory() != null ? course.getCategory().getName() : null)
                .slug(course.getSlug())
                .highlight(course.getDescription())
                .build();
    }

    private SearchResultDto lectureToResult(Lecture lecture) {
        return SearchResultDto.builder()
                .type("LECTURE")
                .id(lecture.getId())
                .title(lecture.getTitle())
                .description(lecture.getDescription())
                .categoryName(lecture.getSection().getCourse().getCategory() != null
                        ? lecture.getSection().getCourse().getCategory().getName()
                        : null)
                .slug(lecture.getSection().getCourse().getSlug())
                .highlight("Found in: " + lecture.getSection().getCourse().getTitle())
                .build();
    }
}
