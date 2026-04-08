package com.aauelknight.itas_backend.courses.repository;

import com.aauelknight.itas_backend.courses.entity.Category;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByOrderByNameAsc();

    Optional<Category> findByName(String name);

    @Query("SELECT c FROM Category c ORDER BY c.name ASC")
    List<Category> findAllOrdered();
}
