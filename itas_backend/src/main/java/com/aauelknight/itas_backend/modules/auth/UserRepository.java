package com.aauelknight.itas_backend.modules.auth;

import com.aauelknight.itas_backend.modules.auth.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    @Query("SELECT u FROM User u "
            + "WHERE u.role.name = :roleName")
    List<User> findByRoleName(@Param("roleName") String roleName);

    @Query("SELECT u FROM User u "
            + "WHERE u.role.name IN :roleNames")
    List<User> findByRoleNameIn(@Param("roleNames") List<String> roleNames);

    @Query(value = "SELECT u FROM User u "
            + "LEFT JOIN FETCH u.role "
            + "WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :q, '%'))",
            countQuery = "SELECT COUNT(u) FROM User u "
                    + "WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%')) "
                    + "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')) "
                    + "OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<User> searchUsers(@Param("q") String q, Pageable pageable);

    @Query(value = "SELECT u FROM User u "
            + "LEFT JOIN FETCH u.role "
            + "WHERE u.role.name = :roleName",
            countQuery = "SELECT COUNT(u) FROM User u "
                    + "WHERE u.role.name = :roleName")
    Page<User> findByRoleNamePaged(@Param("roleName") String roleName, Pageable pageable);

    @Query(value = "SELECT u FROM User u "
            + "LEFT JOIN FETCH u.role "
            + "ORDER BY u.createdAt DESC",
            countQuery = "SELECT COUNT(u) FROM User u")
    Page<User> findAllWithRole(Pageable pageable);

    @Query("SELECT COUNT(DISTINCT e.user.id) "
            + "FROM CourseEnrollment e "
            + "WHERE e.status = 'ACTIVE'")
    long countActiveLearners();

    @Query("SELECT u.role.name, COUNT(u) "
            + "FROM User u "
            + "WHERE u.role.name IN ('TAXPAYER','TAX_AGENT','MOR_STAFF') "
            + "GROUP BY u.role.name")
    List<Object[]> countLearnersByRole();
}
