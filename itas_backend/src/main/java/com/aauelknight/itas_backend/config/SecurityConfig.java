package com.aauelknight.itas_backend.config;
import com.aauelknight.itas_backend.security.JwtAuthFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                          UserDetailsService userDetailsService,
                          CorsConfigurationSource corsConfigurationSource) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler()))
                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(
                                HttpMethod.POST,
                                "/auth/login",
                                "/auth/logout"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/verify/**",
                                "/uploads/**"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/lms/certificate/verify/*",
                                "/lms/verify/*"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/content/video/**"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.POST, "/lms/video/*/progress"
                        ).hasAnyRole("TAXPAYER", "TAX_AGENT", "MOR_STAFF", "MANAGER")
                        .requestMatchers(
                                HttpMethod.GET,
                                "/lms/video/*/progress",
                                "/lms/course/*/last-watched",
                                "/lms/course/*/progress",
                                "/lms/course/*/section/*/unlocked"
                        ).hasAnyRole("TAXPAYER", "TAX_AGENT", "MOR_STAFF", "MANAGER")

                        .requestMatchers(
                                HttpMethod.OPTIONS, "/**"
                        ).permitAll()

                        .requestMatchers(HttpMethod.GET, "/courses/categories").authenticated()

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/courses/*/archive",
                                "/courses/*/restore",
                                "/courses/*/publish",
                                "/courses/*/unpublish"
                        ).hasAnyRole("CONTENT_ADMIN", "TRAINING_ADMIN", "WEB_ADMIN")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/courses/archived"
                        ).hasAnyRole("CONTENT_ADMIN", "TRAINING_ADMIN", "WEB_ADMIN")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/search/**"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/help/**"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/help"
                        ).hasAnyRole("COMMUNICATION", "WEB_ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/help/**"
                        ).hasAnyRole("COMMUNICATION", "WEB_ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/help/**"
                        ).hasAnyRole("COMMUNICATION", "WEB_ADMIN")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/lms/assessment/lecture/*",
                                "/lms/assessment/course/*",
                                "/lms/assessment/result/*"
                        ).hasAnyRole(
                                "TAXPAYER", "TAX_AGENT", "MOR_STAFF", "MANAGER"
                        )
                        .requestMatchers(
                                HttpMethod.POST, "/lms/assessment/submit"
                        ).hasAnyRole(
                                "TAXPAYER", "TAX_AGENT", "MOR_STAFF", "MANAGER"
                        )
                        .requestMatchers(
                                "/lms/assessment/create",
                                "/lms/assessment/*/questions",
                                "/lms/assessment/*/publish"
                        ).hasAnyRole(
                                "CONTENT_ADMIN", "TRAINING_ADMIN", "SYSTEM_ADMIN"
                        )
                        .requestMatchers(
                                HttpMethod.POST, "/lms/assessment/**"
                        ).hasAnyRole(
                                "CONTENT_ADMIN", "TRAINING_ADMIN", "SYSTEM_ADMIN"
                        )
                        .requestMatchers(
                                HttpMethod.POST,
                                "/lms/certificate/*/share"
                        ).authenticated()
                        .requestMatchers(
                                HttpMethod.PUT, "/lms/assessment/**"
                        ).hasAnyRole(
                                "CONTENT_ADMIN", "TRAINING_ADMIN", "SYSTEM_ADMIN"
                        )
                        .requestMatchers(
                                HttpMethod.DELETE, "/lms/assessment/**"
                        ).hasAnyRole(
                                "CONTENT_ADMIN", "TRAINING_ADMIN", "SYSTEM_ADMIN"
                        )
                        .requestMatchers("/lms/**")
                        .hasAnyRole(
                                "TAXPAYER",
                                "TAX_AGENT",
                                "MOR_STAFF",
                                "MANAGER",
                                "CONTENT_ADMIN",
                                "TRAINING_ADMIN",
                                "WEB_ADMIN",
                                "SYSTEM_ADMIN"
                        )

                        .requestMatchers(HttpMethod.POST, "/courses/*/sections/*/lectures/*/upload")
                        .hasAnyRole("CONTENT_ADMIN", "TRAINING_ADMIN", "WEB_ADMIN", "SYSTEM_ADMIN")

                        .requestMatchers(HttpMethod.POST, "/courses/*/sections/*/lectures")
                        .hasAnyRole("CONTENT_ADMIN", "TRAINING_ADMIN", "WEB_ADMIN", "SYSTEM_ADMIN")

                        .requestMatchers(HttpMethod.PUT, "/courses/*/sections/*/lectures/*")
                        .hasAnyRole("CONTENT_ADMIN", "TRAINING_ADMIN", "WEB_ADMIN", "SYSTEM_ADMIN")

                        .requestMatchers("/courses/*/sections/*/lectures/*/versions/**")
                        .hasAnyRole("CONTENT_ADMIN", "TRAINING_ADMIN", "WEB_ADMIN")

                        .requestMatchers(HttpMethod.GET, "/courses/**").authenticated()

                        .requestMatchers(HttpMethod.POST, "/courses")
                        .hasAnyRole("CONTENT_ADMIN", "TRAINING_ADMIN", "WEB_ADMIN", "SYSTEM_ADMIN")

                        .requestMatchers(HttpMethod.PUT, "/courses/**")
                        .hasAnyRole("CONTENT_ADMIN", "TRAINING_ADMIN", "WEB_ADMIN", "SYSTEM_ADMIN")

                        .requestMatchers(HttpMethod.DELETE, "/courses/**")
                        .hasAnyRole("CONTENT_ADMIN", "TRAINING_ADMIN", "WEB_ADMIN", "SYSTEM_ADMIN")

                        .requestMatchers(
                                HttpMethod.GET, "/webinars/my-registrations"
                        ).hasAnyRole("TAXPAYER", "TAX_AGENT", "MOR_STAFF", "MANAGER")

                        .requestMatchers(
                                HttpMethod.GET, "/webinars/**"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.POST, "/webinars"
                        ).hasAnyRole("TRAINING_ADMIN", "WEB_ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT, "/webinars/**"
                        ).hasAnyRole("TRAINING_ADMIN", "WEB_ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE, "/webinars/**"
                        ).hasAnyRole("TRAINING_ADMIN", "WEB_ADMIN")

                        .requestMatchers(
                                HttpMethod.POST, "/webinars/*/register"
                        ).hasAnyRole("TAXPAYER", "TAX_AGENT", "MOR_STAFF", "MANAGER")

                        .requestMatchers(
                                "/admin/users/**"
                        ).hasRole("WEB_ADMIN")

                        .requestMatchers(
                                "/admin/logs/**"
                        ).hasRole("WEB_ADMIN")

                        .requestMatchers(
                                "/admin/integrations/**"
                        ).hasRole("WEB_ADMIN")

                        .requestMatchers("/admin/**")
                        .hasAnyRole("TRAINING_ADMIN", "WEB_ADMIN", "MANAGER", "SYSTEM_ADMIN")

                        .requestMatchers(
                                HttpMethod.GET, "/analytics/**"
                        ).hasAnyRole("MANAGER", "WEB_ADMIN")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/notifications/send"
                        ).hasAnyRole("COMMUNICATION", "WEB_ADMIN")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/notifications/campaigns"
                        ).hasAnyRole("COMMUNICATION", "WEB_ADMIN", "MANAGER")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/announcements/**"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/announcements"
                        ).hasAnyRole("COMMUNICATION", "WEB_ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/announcements/**"
                        ).hasAnyRole("COMMUNICATION", "WEB_ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/announcements/**"
                        ).hasAnyRole("COMMUNICATION", "WEB_ADMIN")

                        .requestMatchers(
                                HttpMethod.GET, "/faq/**"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.POST, "/faq"
                        ).hasAnyRole("COMMUNICATION", "WEB_ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT, "/faq/**"
                        ).hasAnyRole("COMMUNICATION", "WEB_ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE, "/faq/**"
                        ).hasAnyRole("COMMUNICATION", "WEB_ADMIN")
                        .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, ex) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Authentication required. Please log in.\"}");
        };
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, ex) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"status\":403,\"error\":\"Forbidden\",\"message\":\"You do not have permission to access this resource.\"}");
        };
    }

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return web -> web.ignoring().requestMatchers("/uploads/**", "/verify/**");
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}

