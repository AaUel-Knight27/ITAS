package com.aauelknight.notification.repository;

import com.aauelknight.notification.entity.HelpArticle;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface HelpArticleRepository extends JpaRepository<HelpArticle, Long> {

    List<HelpArticle> findByPageIdAndIsPublishedTrueOrderByTitleAsc(String pageId);

    Optional<HelpArticle> findByPageIdAndFieldIdAndIsPublishedTrue(String pageId, String fieldId);

    @Query("SELECT h FROM HelpArticle h WHERE h.isPublished = true AND (" +
            "LOWER(h.title) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(h.content) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(COALESCE(h.tags, '')) LIKE LOWER(CONCAT('%', :q, '%'))" +
            ") ORDER BY h.viewCount DESC")
    List<HelpArticle> searchArticles(@Param("q") String q);

    List<HelpArticle> findByCategoryAndIsPublishedTrueOrderByTitleAsc(String category);

    List<HelpArticle> findAllByOrderByCategoryAscPageIdAscTitleAsc();
}
