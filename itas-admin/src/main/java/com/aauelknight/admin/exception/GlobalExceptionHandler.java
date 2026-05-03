package com.aauelknight.admin.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>>
            handleResponseStatus(
                ResponseStatusException ex,
                HttpServletRequest request) {
        return ResponseEntity
            .status(ex.getStatusCode())
            .body(Map.of(
                "status", ex.getStatusCode().value(),
                "error", ex.getReason() != null
                    ? ex.getReason() : "Error",
                "message", ex.getMessage(),
                "path", request.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>>
            handleGeneral(
                Exception ex,
                HttpServletRequest request) {
        return ResponseEntity
            .status(500)
            .body(Map.of(
                "status", 500,
                "error", "Internal Server Error",
                "message", "An unexpected error occurred",
                "path", request.getRequestURI()));
    }
}
