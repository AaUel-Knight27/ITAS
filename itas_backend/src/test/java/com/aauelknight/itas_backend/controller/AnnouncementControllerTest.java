package com.aauelknight.itas_backend.controller;

import com.aauelknight.itas_backend.dto.notification.AnnouncementDto;
import com.aauelknight.itas_backend.dto.notification.AnnouncementRequest;
import com.aauelknight.itas_backend.service.NotificationService;
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

class AnnouncementControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        AnnouncementController controller = new AnnouncementController(new StubNotificationService());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(new AuthenticationPrincipalResolver())
                .build();
        objectMapper = new ObjectMapper().findAndRegisterModules();
    }

    @Test
    void getAllReturnsOk() throws Exception {
        mockMvc.perform(get("/announcements")
                        .with(userWithRole("TAXPAYER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Portal Maintenance"));
    }

    @Test
    void getActiveReturnsOk() throws Exception {
        mockMvc.perform(get("/announcements/active")
                        .with(userWithRole("TAXPAYER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].isActive").value(true));
    }

    @Test
    void createReturnsCreated() throws Exception {
        mockMvc.perform(post("/announcements")
                        .with(userWithRole("COMMUNICATION", "comm1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Portal Maintenance"));
    }

    @Test
    void toggleReturnsOk() throws Exception {
        mockMvc.perform(put("/announcements/1/toggle")
                        .with(userWithRole("WEB_ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void deleteReturnsOk() throws Exception {
        mockMvc.perform(delete("/announcements/1")
                        .with(userWithRole("WEB_ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Announcement deleted"));
    }

    private AnnouncementRequest sampleRequest() {
        return AnnouncementRequest.builder()
                .title("Portal Maintenance")
                .content("Portal will be unavailable tonight")
                .audienceType("ALL")
                .isActive(Boolean.TRUE)
                .build();
    }

    private AnnouncementDto sampleAnnouncementDto() {
        return AnnouncementDto.builder()
                .id(1L)
                .title("Portal Maintenance")
                .content("Portal will be unavailable tonight")
                .audienceType("ALL")
                .isActive(Boolean.TRUE)
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

    private final class StubNotificationService extends NotificationService {

        private StubNotificationService() {
            super(null, null, null, null);
        }

        @Override
        public List<AnnouncementDto> getAllAnnouncements() {
            return List.of(sampleAnnouncementDto());
        }

        @Override
        public List<AnnouncementDto> getActiveAnnouncements() {
            return List.of(sampleAnnouncementDto());
        }

        @Override
        public AnnouncementDto createAnnouncement(AnnouncementRequest req, String username) {
            return sampleAnnouncementDto();
        }

        @Override
        public AnnouncementDto toggleAnnouncement(Long id) {
            return sampleAnnouncementDto();
        }

        @Override
        public void deleteAnnouncement(Long id) {
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
