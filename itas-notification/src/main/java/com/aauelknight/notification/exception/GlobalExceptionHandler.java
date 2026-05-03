package com.aauelknight.notification.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(Map.of(
                "status", 400,
                "error", "Bad Request",
                "message", message,
                "path", request.getRequestURI()));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraint(ConstraintViolationException ex, HttpServletRequest request) {
        return ResponseEntity.badRequest().body(Map.of(
                "status", 400,
                "error", "Bad Request",
                "message", ex.getMessage(),
                "path", request.getRequestURI()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex, HttpServletRequest request) {
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of(
                "status", ex.getStatusCode().value(),
                "error", ex.getReason() != null ? ex.getReason() : ex.getStatusCode().toString(),
                "message", ex.getMessage(),
                "path", request.getRequestURI()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return ResponseEntity.status(403).body(Map.of(
                "status", 403,
                "error", "Forbidden",
                "message", "Access denied",
                "path", request.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex, HttpServletRequest request) {
        return ResponseEntity.status(500).body(Map.of(
                "status", 500,
                "error", "Internal Server Error",
                "message", "An unexpected error occurred",
                "path", request.getRequestURI()));
    }
}
