package com.aauelknight.itas_backend.learning.repository;

import com.aauelknight.itas_backend.learning.entity.Certificate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    Optional<Certificate> findByUserIdAndCourseId(Long userId, Long courseId);

    List<Certificate> findByUserIdOrderByIssuedAtDesc(Long userId);

    Optional<Certificate> findByVerificationUuid(String verificationUuid);

    Optional<Certificate> findByCertificateCode(String certificateCode);

    @Query(value = "select nextval('certificate_code_seq')", nativeQuery = true)
    Long nextCertificateSequence();
}
