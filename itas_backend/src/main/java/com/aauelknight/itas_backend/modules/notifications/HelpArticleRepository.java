package com.aauelknight.itas_backend.modules.notifications;

import com.aauelknight.itas_backend.modules.notifications.HelpArticle;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface HelpArticleRepository extends JpaRepository<HelpArticle, Long> {

    @Query("SELECT h FROM HelpArticle h "
            + "WHERE h.pageId = :pageId "
            + "AND h.isPublished = true "
            + "ORDER BY h.title ASC")
    List<HelpArticle> findByPageId(@Param("pageId") String pageId);

    @Query("SELECT h FROM HelpArticle h "
            + "WHERE h.pageId = :pageId "
            + "AND h.fieldId = :fieldId "
            + "AND h.isPublished = true")
    Optional<HelpArticle> findByPageAndField(
            @Param("pageId") String pageId,
            @Param("fieldId") String fieldId);

    @Query("SELECT h FROM HelpArticle h "
            + "WHERE h.isPublished = true "
            + "AND ("
            + "LOWER(h.title) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(h.content) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(COALESCE(h.tags, '')) LIKE LOWER(CONCAT('%', :q, '%'))"
            + ") "
            + "ORDER BY h.viewCount DESC")
    List<HelpArticle> searchArticles(@Param("q") String q);

    @Query("SELECT h FROM HelpArticle h "
            + "LEFT JOIN FETCH h.createdBy "
            + "ORDER BY h.category ASC, h.pageId ASC, h.title ASC")
    List<HelpArticle> findAllWithCreator();

    @Query("SELECT h FROM HelpArticle h "
            + "WHERE h.category = :category "
            + "AND h.isPublished = true "
            + "ORDER BY h.title ASC")
    List<HelpArticle> findByCategory(@Param("category") String category);

    @Query("SELECT h FROM HelpArticle h "
            + "WHERE h.isPublished = true "
            + "ORDER BY h.category ASC, h.title ASC")
    List<HelpArticle> findAllPublished();
}
