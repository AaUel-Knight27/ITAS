package com.aauelknight.itas_backend.modules.webinars;

import com.aauelknight.itas_backend.modules.webinars.WebinarRegistration;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WebinarRegistrationRepository extends JpaRepository<WebinarRegistration, Long> {

    List<WebinarRegistration> findByWebinarId(Long webinarId);

    List<WebinarRegistration> findByUserId(Long userId);

    Optional<WebinarRegistration> findByWebinarIdAndUserId(Long webinarId, Long userId);

    long countByWebinarId(Long webinarId);

    boolean existsByWebinarIdAndUserId(Long webinarId, Long userId);
}
