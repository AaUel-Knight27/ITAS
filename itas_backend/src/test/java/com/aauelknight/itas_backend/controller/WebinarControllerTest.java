package com.aauelknight.itas_backend.controller;

import com.aauelknight.itas_backend.dto.webinar.AttendeeDto;
import com.aauelknight.itas_backend.dto.webinar.WebinarDto;
import com.aauelknight.itas_backend.dto.webinar.WebinarRequest;
import com.aauelknight.itas_backend.service.WebinarService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class WebinarControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        WebinarController controller = new WebinarController(new StubWebinarService());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(new AuthenticationPrincipalResolver())
                .build();
        objectMapper = new ObjectMapper().findAndRegisterModules();
    }

    @Test
    void getAllReturnsOk() throws Exception {
        mockMvc.perform(get("/webinars").with(userWithRole("TAXPAYER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Tax Update Webinar"));
    }

    @Test
    void getUpcomingReturnsOk() throws Exception {
        mockMvc.perform(get("/webinars/upcoming").with(userWithRole("TAXPAYER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("SCHEDULED"));
    }

    @Test
    void getPastReturnsOk() throws Exception {
        mockMvc.perform(get("/webinars/past").with(userWithRole("TAXPAYER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].presenterName").value("trainer1"));
    }

    @Test
    void createReturnsCreated() throws Exception {
        mockMvc.perform(post("/webinars")
                        .with(userWithRole("TRAINING_ADMIN", "trainer1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Tax Update Webinar"));
    }

    @Test
    void updateReturnsOk() throws Exception {
        mockMvc.perform(put("/webinars/1")
                        .with(userWithRole("WEB_ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void cancelReturnsOk() throws Exception {
        mockMvc.perform(delete("/webinars/1").with(userWithRole("WEB_ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Webinar cancelled successfully"));
    }

    @Test
    void getAttendeesReturnsOk() throws Exception {
        mockMvc.perform(get("/webinars/1/attendees").with(userWithRole("TRAINING_ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("user@example.com"));
    }

    @Test
    void registerReturnsOk() throws Exception {
        mockMvc.perform(post("/webinars/1/register").with(userWithRole("TAXPAYER", "taxpayer1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Registered successfully"));
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

    private WebinarRequest sampleRequest() {
        return WebinarRequest.builder()
                .title("Tax Update Webinar")
                .description("Quarterly filing changes")
                .scheduledAt(LocalDateTime.now().plusDays(2))
                .durationMinutes(90)
                .maxAttendees(200)
                .meetingLink("https://meet.example.com/webinar")
                .build();
    }

    private WebinarDto sampleWebinarDto() {
        return WebinarDto.builder()
                .id(1L)
                .title("Tax Update Webinar")
                .description("Quarterly filing changes")
                .presenterName("trainer1")
                .scheduledAt(LocalDateTime.now().plusDays(2))
                .durationMinutes(90)
                .maxAttendees(200)
                .registeredCount(12)
                .meetingLink("https://meet.example.com/webinar")
                .status("SCHEDULED")
                .createdAt(LocalDateTime.now())
                .build();
    }

    private AttendeeDto sampleAttendeeDto() {
        return AttendeeDto.builder()
                .userId(7L)
                .username("taxpayer1")
                .email("user@example.com")
                .fullName("Tax Payer")
                .registeredAt(LocalDateTime.now())
                .attended(Boolean.FALSE)
                .build();
    }

    private final class StubWebinarService extends WebinarService {

        private StubWebinarService() {
            super(null, null, null);
        }

        @Override
        public List<WebinarDto> getAllWebinars() {
            return List.of(sampleWebinarDto());
        }

        @Override
        public List<WebinarDto> getUpcoming() {
            return List.of(sampleWebinarDto());
        }

        @Override
        public List<WebinarDto> getPast() {
            return List.of(sampleWebinarDto());
        }

        @Override
        public WebinarDto createWebinar(WebinarRequest req, String username) {
            return sampleWebinarDto();
        }

        @Override
        public WebinarDto updateWebinar(Long id, WebinarRequest req) {
            return sampleWebinarDto();
        }

        @Override
        public void cancelWebinar(Long id) {
        }

        @Override
        public List<AttendeeDto> getAttendees(Long id) {
            return List.of(sampleAttendeeDto());
        }

        @Override
        public void register(Long webinarId, String username) {
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
