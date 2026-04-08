package com.aauelknight.itas_backend.courses.repository;
import com.aauelknight.itas_backend.courses.entity.Course;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourseRepository extends JpaRepository<Course, Long> {

    @EntityGraph(attributePaths = {"category"})
    List<Course> findByPublishedTrueOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"category"})
    List<Course> findByPublishedTrueAndCategoryIdOrderByCreatedAtDesc(Long categoryId);

    @Query("SELECT DISTINCT c FROM Course c " +
            "LEFT JOIN FETCH c.category " +
            "LEFT JOIN FETCH c.sections s " +
            "LEFT JOIN FETCH s.lectures " +
            "WHERE c.slug = :slug AND c.published = true")
    Optional<Course> findBySlugWithSectionsAndLectures(@Param("slug") String slug);

    @Query("SELECT DISTINCT c FROM Course c " +
            "LEFT JOIN FETCH c.category " +
            "LEFT JOIN FETCH c.sections s " +
            "LEFT JOIN FETCH s.lectures " +
            "WHERE c.slug = :slug")
    Optional<Course> findBySlugWithSectionsAndLecturesAdmin(@Param("slug") String slug);

    @Query("SELECT DISTINCT c FROM Course c " +
            "LEFT JOIN FETCH c.category " +
            "LEFT JOIN FETCH c.sections s " +
            "LEFT JOIN FETCH s.lectures " +
            "WHERE c.id = :id")
    Optional<Course> findByIdWithSectionsAndLecturesAdmin(@Param("id") Long id);

    @Query("SELECT DISTINCT c FROM Course c " +
            "LEFT JOIN FETCH c.category " +
            "LEFT JOIN FETCH c.sections s " +
            "LEFT JOIN FETCH s.lectures l " +
            "WHERE c.id = :id " +
            "ORDER BY s.orderIndex, l.orderIndex")
    Optional<Course> findByIdWithSectionsAndLectures(@Param("id") Long id);

    @Query("SELECT DISTINCT c FROM Course c " +
            "LEFT JOIN FETCH c.category " +
            "LEFT JOIN FETCH c.sections s " +
            "ORDER BY c.createdAt DESC")
    List<Course> findAllWithSections();

    @Query("SELECT DISTINCT c FROM Course c " +
            "LEFT JOIN FETCH c.category " +
            "LEFT JOIN FETCH c.sections s " +
            "WHERE c.published = true " +
            "ORDER BY c.createdAt DESC")
    List<Course> findAllPublishedWithSections();

    @Query("SELECT c FROM Course c " +
            "LEFT JOIN FETCH c.category " +
            "WHERE c.status = 'PUBLISHED' " +
            "ORDER BY c.createdAt DESC")
    List<Course> findAllPublished();

    @Query("SELECT c FROM Course c " +
            "LEFT JOIN FETCH c.category " +
            "WHERE c.status <> 'ARCHIVED' " +
            "ORDER BY c.createdAt DESC")
    List<Course> findAllNonArchived();

    @Query("SELECT c FROM Course c " +
            "LEFT JOIN FETCH c.category " +
            "ORDER BY c.createdAt DESC")
    List<Course> findAllIncludingArchived();

    @Query("SELECT c FROM Course c " +
            "LEFT JOIN FETCH c.category " +
            "WHERE c.status = 'ARCHIVED' " +
            "ORDER BY c.archivedAt DESC")
    List<Course> findAllArchived();

    @Query("SELECT c FROM Course c " +
            "LEFT JOIN FETCH c.category " +
            "WHERE c.status = :status " +
            "ORDER BY c.createdAt DESC")
    List<Course> findByStatus(@Param("status") String status);

    @Query(value =
            "SELECT c.id, c.title, c.description, c.thumbnail_url, cat.name AS category_name, c.slug, " +
            "ts_rank(c.search_vector, plainto_tsquery('english', :query)) AS rank, " +
            "ts_headline('english', COALESCE(c.description, c.title), plainto_tsquery('english', :query)) AS highlight " +
            "FROM courses c " +
            "LEFT JOIN categories cat ON c.category_id = cat.id " +
            "WHERE c.published = true " +
            "AND c.status = 'PUBLISHED' " +
            "AND (c.search_vector @@ plainto_tsquery('english', :query) " +
            "     OR LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "     OR LOWER(COALESCE(cat.name, '')) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "ORDER BY rank DESC, c.created_at DESC " +
            "LIMIT :limit",
            nativeQuery = true)
    List<Object[]> searchCoursesFTS(@Param("query") String query, @Param("limit") int limit);

    @Query(value =
            "SELECT c.* FROM courses c " +
            "LEFT JOIN categories cat ON c.category_id = cat.id " +
            "WHERE c.published = true " +
            "AND c.status = 'PUBLISHED' " +
            "AND (:query = '' " +
            "     OR LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "     OR LOWER(COALESCE(c.description, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "     OR LOWER(COALESCE(cat.name, '')) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "AND (:category IS NULL OR LOWER(cat.name) = LOWER(:category)) " +
            "AND (:difficulty IS NULL OR c.difficulty = :difficulty) " +
            "ORDER BY c.created_at DESC",
            nativeQuery = true)
    List<Course> filterCourses(@Param("query") String query,
                               @Param("category") String category,
                               @Param("difficulty") String difficulty);

    @Query(value =
            "SELECT DISTINCT c.title FROM courses c " +
            "WHERE c.published = true " +
            "AND c.status = 'PUBLISHED' " +
            "AND LOWER(c.title) LIKE LOWER(CONCAT('%', :prefix, '%')) " +
            "ORDER BY c.title " +
            "LIMIT 5",
            nativeQuery = true)
    List<String> getSearchSuggestions(@Param("prefix") String prefix);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}

