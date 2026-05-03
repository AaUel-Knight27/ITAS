package com.aauelknight.learning.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));

        return ResponseEntity.badRequest().body(Map.of(
                "status", 400,
                "error", "Validation failed",
                "message", message,
                "path", request.getRequestURI()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegal(IllegalArgumentException ex, HttpServletRequest request) {
        return ResponseEntity.badRequest().body(Map.of(
                "status", 400,
                "error", "Invalid request",
                "message", ex.getMessage() != null ? ex.getMessage() : "Invalid argument",
                "path", request.getRequestURI()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        return ResponseEntity.badRequest().body(Map.of(
                "status", 400,
                "error", "Invalid request body",
                "message", "The request body is missing or malformed.",
                "path", request.getRequestURI()));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleMissingParam(MissingServletRequestParameterException ex, HttpServletRequest request) {
        return ResponseEntity.badRequest().body(Map.of(
                "status", 400,
                "error", "Missing required parameter",
                "message", "Required parameter '" + ex.getParameterName() + "' is missing.",
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

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(404).body(Map.of(
                "status", 404,
                "error", "Not Found",
                "message", ex.getMessage() != null ? ex.getMessage() : "Resource not found",
                "path", request.getRequestURI()));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResource(NoResourceFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(404).body(Map.of(
                "status", 404,
                "error", "Not Found",
                "message", "The requested endpoint does not exist",
                "path", request.getRequestURI()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex, HttpServletRequest request) {
        int status = ex.getStatusCode().value();
        String error = switch (status) {
            case 400 -> "Bad Request";
            case 401 -> "Unauthorized";
            case 403 -> "Forbidden";
            case 404 -> "Not Found";
            case 409 -> "Conflict";
            case 503 -> "Service Unavailable";
            default -> ex.getStatusCode().toString();
        };
        String message = ex.getReason() != null ? ex.getReason() : ex.getMessage();
        return ResponseEntity.status(status).body(Map.of(
                "status", status,
                "error", error,
                "message", message,
                "path", request.getRequestURI()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.error("DataIntegrityViolation: {}", ex.getMessage(), ex);
        return ResponseEntity.status(409).body(Map.of(
                "status", 409,
                "error", "Conflict",
                "message", "The operation violates a database constraint",
                "path", request.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAll(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(500).body(Map.of(
                "status", 500,
                "error", "Internal Server Error",
                "message", "An unexpected error occurred",
                "path", request.getRequestURI()));
    }
}
