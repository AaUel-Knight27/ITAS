package com.aauelknight.notification.service;

import com.aauelknight.notification.dto.response.FaqDto;
import com.aauelknight.notification.dto.response.FaqRequest;
import com.aauelknight.notification.entity.Faq;
import com.aauelknight.notification.repository.FaqRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class FaqService {

    private final FaqRepository faqRepository;

    @Transactional(readOnly = true)
    public List<FaqDto> getAllFaqs() {
        return faqRepository.findAllByOrderByOrderIndexAscCreatedAtDesc().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<FaqDto> getFaqsByCategory(String category) {
        return faqRepository.findByCategoryOrderByOrderIndexAscCreatedAtDesc(category).stream().map(this::toDto).toList();
    }

    @Transactional
    public FaqDto createFaq(FaqRequest request) {
        Faq faq = Faq.builder()
                .question(request.getQuestion())
                .answer(request.getAnswer())
                .category(request.getCategory())
                .orderIndex(request.getOrderIndex())
                .build();
        return toDto(faqRepository.save(faq));
    }

    @Transactional
    public FaqDto updateFaq(Long id, FaqRequest request) {
        Faq faq = faqRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "FAQ not found"));
        faq.setQuestion(request.getQuestion());
        faq.setAnswer(request.getAnswer());
        faq.setCategory(request.getCategory());
        faq.setOrderIndex(request.getOrderIndex());
        return toDto(faqRepository.save(faq));
    }

    @Transactional
    public void deleteFaq(Long id) {
        faqRepository.deleteById(id);
    }

    private FaqDto toDto(Faq faq) {
        return FaqDto.builder()
                .id(faq.getId())
                .question(faq.getQuestion())
                .answer(faq.getAnswer())
                .category(faq.getCategory())
                .orderIndex(faq.getOrderIndex())
                .createdAt(faq.getCreatedAt())
                .build();
    }
}
