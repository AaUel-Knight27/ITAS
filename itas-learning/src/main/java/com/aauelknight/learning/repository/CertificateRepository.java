package com.aauelknight.learning.repository;

import com.aauelknight.learning.entity.Certificate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    Optional<Certificate> findByUserIdAndCourseId(Long userId, Long courseId);

    List<Certificate> findByUserIdOrderByIssuedAtDesc(Long userId);

    Optional<Certificate> findByCertificateCode(String code);

    Optional<Certificate> findByVerificationUuid(String uuid);

    @Query(value = "select nextval('learning_schema.certificate_code_seq')", nativeQuery = true)
    Long nextCertificateSequence();
}
