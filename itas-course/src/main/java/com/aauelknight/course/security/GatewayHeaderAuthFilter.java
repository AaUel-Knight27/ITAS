package com.aauelknight.course.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class GatewayHeaderAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String uri = request.getRequestURI();
        if (uri.startsWith("/internal/") || uri.startsWith("/actuator/") || uri.startsWith("/uploads/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String username = request.getHeader("X-Auth-Username");
        String role = request.getHeader("X-Auth-Role");
        String userIdStr = request.getHeader("X-Auth-User-Id");

        if (username != null && !username.isBlank() && role != null && !role.isBlank()) {
            List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
            GatewayPrincipal principal = new GatewayPrincipal(username, role, userIdStr);
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(principal, null, authorities);
            if (userIdStr != null && !userIdStr.isBlank()) {
                auth.setDetails(Long.parseLong(userIdStr));
            }
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}
