package com.aauelknight.itas_backend.webinars.repository;

import com.aauelknight.itas_backend.webinars.entity.Webinar;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WebinarRepository extends JpaRepository<Webinar, Long> {

    @Query("SELECT w FROM Webinar w " +
            "LEFT JOIN FETCH w.presenter " +
            "WHERE w.scheduledAt >= :now " +
            "ORDER BY w.scheduledAt ASC")
    List<Webinar> findUpcoming(@Param("now") LocalDateTime now);

    @Query("SELECT w FROM Webinar w " +
            "LEFT JOIN FETCH w.presenter " +
            "WHERE w.scheduledAt < :now " +
            "ORDER BY w.scheduledAt DESC")
    List<Webinar> findPast(@Param("now") LocalDateTime now);

    @Query("SELECT w FROM Webinar w " +
            "LEFT JOIN FETCH w.presenter " +
            "ORDER BY w.scheduledAt DESC")
    List<Webinar> findAllWithPresenter();
}
