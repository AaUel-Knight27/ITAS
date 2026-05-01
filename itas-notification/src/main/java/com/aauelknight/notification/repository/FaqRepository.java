package com.aauelknight.notification.repository;

import com.aauelknight.notification.entity.Faq;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FaqRepository extends JpaRepository<Faq, Long> {

    List<Faq> findAllByOrderByOrderIndexAscCreatedAtDesc();

    List<Faq> findByCategoryOrderByOrderIndexAscCreatedAtDesc(String category);
}
