package com.aauelknight.itas_backend.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config =
                new CorsConfiguration();

        // Allow both local and production
        config.setAllowedOriginPatterns(
                List.of(
                        "http://localhost:3000",
                        "http://localhost:3001",
                        frontendUrl,
                        "https://*.vercel.app"
                ));

        config.setAllowedMethods(
                List.of("GET","POST","PUT",
                        "DELETE","OPTIONS","PATCH"));

        config.setAllowedHeaders(
                List.of("*"));

        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration(
                "/**", config);

        return source;
    }

    @Bean
    public CorsFilter corsFilter(CorsConfigurationSource corsConfigurationSource) {
        return new CorsFilter(corsConfigurationSource);
    }
}

