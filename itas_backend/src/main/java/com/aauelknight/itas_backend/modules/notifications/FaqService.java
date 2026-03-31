package com.aauelknight.itas_backend.modules.notifications;

import com.aauelknight.itas_backend.dto.faq.FaqDto;
import com.aauelknight.itas_backend.dto.faq.FaqRequest;
import com.aauelknight.itas_backend.modules.notifications.Faq;
import com.aauelknight.itas_backend.modules.auth.User;
import com.aauelknight.itas_backend.modules.notifications.FaqRepository;
import com.aauelknight.itas_backend.modules.auth.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FaqService {

    private final FaqRepository faqRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<FaqDto> getAllFaqs() {
        return faqRepository
                .findAllWithCreator()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FaqDto> getFaqsByCategory(String category) {
        return faqRepository
                .findByCategory(category)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public FaqDto createFaq(FaqRequest req, String username) {
        User createdBy = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        Faq faq = Faq.builder()
                .question(req.getQuestion())
                .answer(req.getAnswer())
                .category(req.getCategory())
                .createdBy(createdBy)
                .build();

        return toDto(faqRepository.save(faq));
    }

    @Transactional
    public FaqDto updateFaq(Long id, FaqRequest req) {
        Faq faq = faqRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException("FAQ not found: " + id));

        faq.setQuestion(req.getQuestion());
        faq.setAnswer(req.getAnswer());
        faq.setCategory(req.getCategory());

        return toDto(faqRepository.save(faq));
    }

    @Transactional
    public void deleteFaq(Long id) {
        faqRepository.deleteById(id);
    }

    private FaqDto toDto(Faq f) {
        return FaqDto.builder()
                .id(f.getId())
                .question(f.getQuestion())
                .answer(f.getAnswer())
                .category(f.getCategory())
                .createdByUsername(
                        f.getCreatedBy() != null
                                ? f.getCreatedBy().getUsername()
                                : "System")
                .createdAt(f.getCreatedAt())
                .updatedAt(f.getUpdatedAt())
                .build();
    }
}
