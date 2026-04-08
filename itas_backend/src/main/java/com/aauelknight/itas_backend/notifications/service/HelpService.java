package com.aauelknight.itas_backend.notifications.service;
import com.aauelknight.itas_backend.notifications.dto.response.ContextualHelpDto;
import com.aauelknight.itas_backend.notifications.dto.response.HelpArticleDto;
import com.aauelknight.itas_backend.notifications.dto.response.HelpArticleRequest;
import com.aauelknight.itas_backend.notifications.entity.HelpArticle;
import com.aauelknight.itas_backend.auth.entity.User;
import com.aauelknight.itas_backend.notifications.repository.HelpArticleRepository;
import com.aauelknight.itas_backend.auth.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HelpService {

    private final HelpArticleRepository helpRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<HelpArticleDto> getArticlesForPage(String pageId) {
        return helpRepository
                .findByPageId(pageId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public Optional<HelpArticleDto> getArticleForField(String pageId, String fieldId) {
        Optional<HelpArticle> article = helpRepository.findByPageAndField(pageId, fieldId);

        article.ifPresent(a -> {
            a.setViewCount((a.getViewCount() != null ? a.getViewCount() : 0) + 1);
            helpRepository.save(a);
        });

        return article.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<HelpArticleDto> searchArticles(String query) {
        if (query == null || query.isBlank()) {
            return helpRepository
                    .findAllPublished()
                    .stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
        }

        return helpRepository
                .searchArticles(query.trim())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HelpArticleDto> getByCategory(String category) {
        return helpRepository
                .findByCategory(category)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public HelpArticleDto getById(Long id) {
        return helpRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Help article not found: " + id));
    }

    @Transactional
    public ContextualHelpDto getContextualHelp(String pageId, String fieldId) {
        List<HelpArticleDto> articles;

        if (fieldId != null && !fieldId.isBlank()) {
            Optional<HelpArticleDto> fieldHelp = getArticleForField(pageId, fieldId);
            if (fieldHelp.isPresent()) {
                articles = List.of(fieldHelp.get());
            } else {
                articles = getArticlesForPage(pageId);
            }
        } else {
            articles = getArticlesForPage(pageId);
        }

        return ContextualHelpDto.builder()
                .pageId(pageId)
                .fieldId(fieldId)
                .articles(articles)
                .build();
    }

    @Transactional(readOnly = true)
    public List<HelpArticleDto> getAllAdmin() {
        return helpRepository
                .findAllWithCreator()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public HelpArticleDto create(HelpArticleRequest req, String username) {
        User createdBy = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        HelpArticle article = HelpArticle.builder()
                .title(req.getTitle())
                .content(req.getContent())
                .pageId(req.getPageId())
                .fieldId(req.getFieldId())
                .category(req.getCategory())
                .tags(req.getTags())
                .isPublished(req.getIsPublished() != null ? req.getIsPublished() : true)
                .viewCount(0)
                .createdBy(createdBy)
                .build();

        return toDto(helpRepository.save(article));
    }

    @Transactional
    public HelpArticleDto update(Long id, HelpArticleRequest req) {
        HelpArticle article = helpRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException("Help article not found: " + id));

        article.setTitle(req.getTitle());
        article.setContent(req.getContent());
        article.setPageId(req.getPageId());
        article.setFieldId(req.getFieldId());
        article.setCategory(req.getCategory());
        article.setTags(req.getTags());
        if (req.getIsPublished() != null) {
            article.setIsPublished(req.getIsPublished());
        }

        return toDto(helpRepository.save(article));
    }

    @Transactional
    public HelpArticleDto togglePublish(Long id) {
        HelpArticle article = helpRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException("Help article not found: " + id));

        article.setIsPublished(!Boolean.TRUE.equals(article.getIsPublished()));
        return toDto(helpRepository.save(article));
    }

    @Transactional
    public void delete(Long id) {
        helpRepository.deleteById(id);
    }

    private HelpArticleDto toDto(HelpArticle h) {
        return HelpArticleDto.builder()
                .id(h.getId())
                .title(h.getTitle())
                .content(h.getContent())
                .pageId(h.getPageId())
                .fieldId(h.getFieldId())
                .category(h.getCategory())
                .tags(h.getTags())
                .isPublished(h.getIsPublished())
                .viewCount(h.getViewCount())
                .createdByUsername(h.getCreatedBy() != null ? h.getCreatedBy().getUsername() : "System")
                .createdAt(h.getCreatedAt() != null ? h.getCreatedAt().toString() : null)
                .updatedAt(h.getUpdatedAt() != null ? h.getUpdatedAt().toString() : null)
                .build();
    }
}

