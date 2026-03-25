package com.aauelknight.itas_backend.controller;

import com.aauelknight.itas_backend.dto.notification.CampaignDto;
import com.aauelknight.itas_backend.dto.notification.NotificationRequest;
import com.aauelknight.itas_backend.dto.notification.UserNotificationDto;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class NotificationControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        NotificationController controller = new NotificationController(new StubNotificationService());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(new AuthenticationPrincipalResolver())
                .build();
        objectMapper = new ObjectMapper().findAndRegisterModules();
    }

    @Test
    void sendReturnsCreated() throws Exception {
        mockMvc.perform(post("/notifications/send")
                        .with(userWithRole("COMMUNICATION", "comm1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Tax Reminder"));
    }

    @Test
    void getCampaignsReturnsOk() throws Exception {
        mockMvc.perform(get("/notifications/campaigns")
                        .with(userWithRole("MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("SENT"));
    }

    @Test
    void getMyNotificationsReturnsOk() throws Exception {
        mockMvc.perform(get("/notifications/my")
                        .with(userWithRole("TAXPAYER", "taxpayer1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Tax Reminder"));
    }

    @Test
    void getUnreadCountReturnsOk() throws Exception {
        mockMvc.perform(get("/notifications/unread-count")
                        .with(userWithRole("TAXPAYER", "taxpayer1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(3));
    }

    @Test
    void markAsReadReturnsOk() throws Exception {
        mockMvc.perform(put("/notifications/1/read")
                        .with(userWithRole("TAXPAYER", "taxpayer1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Marked as read"));
    }

    @Test
    void markAllAsReadReturnsOk() throws Exception {
        mockMvc.perform(put("/notifications/read-all")
                        .with(userWithRole("TAXPAYER", "taxpayer1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("All notifications marked as read"));
    }

    private NotificationRequest sampleRequest() {
        return NotificationRequest.builder()
                .title("Tax Reminder")
                .message("File before the deadline")
                .audienceType("ALL")
                .sendNow(Boolean.TRUE)
                .scheduledAt(LocalDateTime.now().plusHours(1))
                .build();
    }

    private CampaignDto sampleCampaignDto() {
        return CampaignDto.builder()
                .id(1L)
                .title("Tax Reminder")
                .message("File before the deadline")
                .audienceType("ALL")
                .sendNow(Boolean.TRUE)
                .scheduledAt(LocalDateTime.now().plusHours(1))
                .status("SENT")
                .createdByUsername("comm1")
                .createdAt(LocalDateTime.now())
                .deliveryCount(25L)
                .build();
    }

    private UserNotificationDto sampleNotificationDto() {
        return UserNotificationDto.builder()
                .id(1L)
                .title("Tax Reminder")
                .message("File before the deadline")
                .readStatus(Boolean.FALSE)
                .deliveredAt(LocalDateTime.now())
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
        public CampaignDto sendNotification(NotificationRequest req, String username) {
            return sampleCampaignDto();
        }

        @Override
        public List<CampaignDto> getAllCampaigns() {
            return List.of(sampleCampaignDto());
        }

        @Override
        public List<UserNotificationDto> getMyNotifications(String username) {
            return List.of(sampleNotificationDto());
        }

        @Override
        public long getUnreadCount(String username) {
            return 3L;
        }

        @Override
        public void markAsRead(Long notificationId, String username) {
        }

        @Override
        public void markAllAsRead(String username) {
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
