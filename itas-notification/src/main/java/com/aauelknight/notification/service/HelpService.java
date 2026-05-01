package com.aauelknight.notification.service;

import com.aauelknight.notification.dto.response.ContextualHelpDto;
import com.aauelknight.notification.dto.response.HelpArticleDto;
import com.aauelknight.notification.dto.response.HelpArticleRequest;
import com.aauelknight.notification.entity.HelpArticle;
import com.aauelknight.notification.repository.HelpArticleRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class HelpService {

    private final HelpArticleRepository helpArticleRepository;

    @Transactional(readOnly = true)
    public List<HelpArticleDto> getArticlesForPage(String pageId) {
        return helpArticleRepository.findByPageIdAndIsPublishedTrueOrderByTitleAsc(pageId).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public ContextualHelpDto getContextualHelp(String pageId, String fieldId) {
        List<HelpArticleDto> articles = fieldId == null || fieldId.isBlank()
                ? getArticlesForPage(pageId)
                : helpArticleRepository.findByPageIdAndFieldIdAndIsPublishedTrue(pageId, fieldId)
                        .map(this::toDto)
                        .map(List::of)
                        .orElse(List.of());
        return ContextualHelpDto.builder()
                .pageId(pageId)
                .fieldId(fieldId)
                .articles(articles)
                .build();
    }

    @Transactional(readOnly = true)
    public HelpArticleDto getById(Long id) {
        return toDto(getArticle(id));
    }

    @Transactional(readOnly = true)
    public List<HelpArticleDto> searchArticles(String query) {
        String normalized = query == null ? "" : query.trim();
        if (normalized.isEmpty()) {
            return helpArticleRepository.findAllByOrderByCategoryAscPageIdAscTitleAsc().stream().map(this::toDto).toList();
        }
        return helpArticleRepository.searchArticles(normalized).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<HelpArticleDto> getByCategory(String category) {
        return helpArticleRepository.findByCategoryAndIsPublishedTrueOrderByTitleAsc(category).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<HelpArticleDto> getAllAdmin() {
        return helpArticleRepository.findAllByOrderByCategoryAscPageIdAscTitleAsc().stream().map(this::toDto).toList();
    }

    @Transactional
    public HelpArticleDto create(HelpArticleRequest request) {
        HelpArticle article = HelpArticle.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .pageId(request.getPageId())
                .fieldId(request.getFieldId())
                .category(request.getCategory())
                .tags(request.getTags())
                .isPublished(request.getIsPublished())
                .build();
        return toDto(helpArticleRepository.save(article));
    }

    @Transactional
    public HelpArticleDto update(Long id, HelpArticleRequest request) {
        HelpArticle article = getArticle(id);
        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        article.setPageId(request.getPageId());
        article.setFieldId(request.getFieldId());
        article.setCategory(request.getCategory());
        article.setTags(request.getTags());
        article.setIsPublished(request.getIsPublished());
        return toDto(helpArticleRepository.save(article));
    }

    @Transactional
    public HelpArticleDto togglePublish(Long id) {
        HelpArticle article = getArticle(id);
        article.setIsPublished(!article.getIsPublished());
        return toDto(helpArticleRepository.save(article));
    }

    @Transactional
    public void delete(Long id) {
        helpArticleRepository.deleteById(id);
    }

    private HelpArticle getArticle(Long id) {
        return helpArticleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Help article not found"));
    }

    private HelpArticleDto toDto(HelpArticle article) {
        return HelpArticleDto.builder()
                .id(article.getId())
                .title(article.getTitle())
                .content(article.getContent())
                .pageId(article.getPageId())
                .fieldId(article.getFieldId())
                .category(article.getCategory())
                .tags(article.getTags())
                .isPublished(article.getIsPublished())
                .viewCount(article.getViewCount())
                .createdAt(article.getCreatedAt() != null ? article.getCreatedAt().toString() : null)
                .updatedAt(article.getUpdatedAt() != null ? article.getUpdatedAt().toString() : null)
                .build();
    }
}
