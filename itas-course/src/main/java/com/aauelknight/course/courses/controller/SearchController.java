package com.aauelknight.course.courses.controller;
import com.aauelknight.course.courses.dto.response.SearchFilterDto;
import com.aauelknight.course.courses.dto.response.SearchResponseDto;
import com.aauelknight.course.courses.dto.response.SearchResultDto;
import com.aauelknight.course.courses.service.SearchService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SearchResponseDto> search(@RequestParam String q,
                                                    @RequestParam(defaultValue = "20") int limit) {
        if (q == null || q.isBlank()) {
            return ResponseEntity.ok(SearchResponseDto.builder()
                    .query(q)
                    .totalResults(0)
                    .courses(List.of())
                    .lectures(List.of())
                    .suggestions(List.of())
                    .build());
        }

        return ResponseEntity.ok(searchService.search(q.trim(), limit));
    }

    @GetMapping("/filter")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SearchResultDto>> filter(@RequestParam(required = false) String q,
                                                        @RequestParam(required = false) String category,
                                                        @RequestParam(required = false) String difficulty,
                                                        @RequestParam(required = false) String sortBy) {
        SearchFilterDto filter = SearchFilterDto.builder()
                .query(q)
                .category(category)
                .difficulty(difficulty)
                .sortBy(sortBy)
                .publishedOnly(true)
                .build();

        return ResponseEntity.ok(searchService.filter(filter));
    }

    @GetMapping("/suggest")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<String>> suggest(@RequestParam String q) {
        return ResponseEntity.ok(searchService.getSuggestions(q));
    }
}



