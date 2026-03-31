package com.aauelknight.itas_backend.modules.notifications;

import com.aauelknight.itas_backend.modules.notifications.Faq;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FaqRepository extends JpaRepository<Faq, Long> {

    @Query("SELECT f FROM Faq f "
            + "LEFT JOIN FETCH f.createdBy "
            + "ORDER BY f.createdAt DESC")
    List<Faq> findAllWithCreator();

    @Query("SELECT f FROM Faq f "
            + "WHERE f.category = :category "
            + "ORDER BY f.createdAt DESC")
    List<Faq> findByCategory(@Param("category") String category);
}
