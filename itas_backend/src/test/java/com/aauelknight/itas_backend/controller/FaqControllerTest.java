package com.aauelknight.itas_backend.controller;

import com.aauelknight.itas_backend.dto.faq.FaqDto;
import com.aauelknight.itas_backend.dto.faq.FaqRequest;
import com.aauelknight.itas_backend.service.FaqService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FaqControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        FaqController controller = new FaqController(new StubFaqService());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(new AuthenticationPrincipalResolver())
                .build();
        objectMapper = new ObjectMapper().findAndRegisterModules();
    }

    @Test
    void getAllReturnsOk() throws Exception {
        mockMvc.perform(get("/faq").with(userWithRole("TAXPAYER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].question").value("How do I file VAT?"));
    }

    @Test
    void getByCategoryReturnsOk() throws Exception {
        mockMvc.perform(get("/faq/category/VAT").with(userWithRole("TAXPAYER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].category").value("VAT"));
    }

    @Test
    void createReturnsCreated() throws Exception {
        mockMvc.perform(post("/faq")
                        .with(userWithRole("COMMUNICATION", "comm1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.question").value("How do I file VAT?"));
    }

    @Test
    void updateReturnsOk() throws Exception {
        mockMvc.perform(put("/faq/1")
                        .with(userWithRole("WEB_ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void deleteReturnsOk() throws Exception {
        mockMvc.perform(delete("/faq/1").with(userWithRole("WEB_ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("FAQ deleted successfully"));
    }

    private FaqRequest sampleRequest() {
        return FaqRequest.builder()
                .question("How do I file VAT?")
                .answer("Use the VAT return form in the portal.")
                .category("VAT")
                .build();
    }

    private FaqDto sampleFaqDto() {
        return FaqDto.builder()
                .id(1L)
                .question("How do I file VAT?")
                .answer("Use the VAT return form in the portal.")
                .category("VAT")
                .createdByUsername("comm1")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private RequestPostProcessor userWithRole(String role) {
        return userWithRole(role, "tester");
    }

    private RequestPostProcessor userWithRole(String role, String username) {
        User user = new User(username, "password", List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        return request -> {
            Authentication authentication =
                    new UsernamePasswordAuthenticationToken(user, user.getPassword(), user.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authentication);
            request.setUserPrincipal(authentication);
            return request;
        };
    }

    private final class StubFaqService extends FaqService {

        private StubFaqService() {
            super(null, null);
        }

        @Override
        public List<FaqDto> getAllFaqs() {
            return List.of(sampleFaqDto());
        }

        @Override
        public List<FaqDto> getFaqsByCategory(String category) {
            return List.of(sampleFaqDto());
        }

        @Override
        public FaqDto createFaq(FaqRequest req, String username) {
            return sampleFaqDto();
        }

        @Override
        public FaqDto updateFaq(Long id, FaqRequest req) {
            return sampleFaqDto();
        }

        @Override
        public void deleteFaq(Long id) {
        }
    }

    private static final class AuthenticationPrincipalResolver implements HandlerMethodArgumentResolver {

        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return UserDetails.class.isAssignableFrom(parameter.getParameterType());
        }

        @Override
        public Object resolveArgument(MethodParameter parameter,
                                      ModelAndViewContainer mavContainer,
                                      NativeWebRequest webRequest,
                                      WebDataBinderFactory binderFactory) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            return authentication != null ? authentication.getPrincipal() : null;
        }
    }
}
