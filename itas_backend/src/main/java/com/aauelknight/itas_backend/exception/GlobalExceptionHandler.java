package com.aauelknight.itas_backend.exception;

import com.aauelknight.itas_backend.api.ErrorResponse;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.catalina.connector.ClientAbortException;
import org.hibernate.LazyInitializationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.converter.HttpMessageNotWritableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toValidationMessage)
                .collect(Collectors.toList());

        return ResponseEntity.badRequest()
                .body(new ErrorResponse(400, "Validation failed", String.join(", ", errors)));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegal(IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse(400, "Invalid request", ex.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadable(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse(
                        400,
                        "Invalid request body",
                        "The request body is missing or malformed. Please check the request format."));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParam(MissingServletRequestParameterException ex) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse(
                        400,
                        "Missing required parameter",
                        "Required parameter '" + ex.getParameterName() + "' is missing from the request."));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(401)
                .body(new ErrorResponse(
                        401,
                        "Authentication failed",
                        "The username or password you entered is incorrect."));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(403)
                .body(new ErrorResponse(
                        403,
                        "Access denied",
                        "You do not have permission to perform this action. Required role may be missing."));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404)
                .body(new ErrorResponse(404, "Resource not found", ex.getMessage()));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResource(NoResourceFoundException ex) {
        return ResponseEntity.status(404)
                .body(new ErrorResponse(
                        404,
                        "Endpoint not found",
                        "The endpoint '" + ex.getResourcePath() + "' does not exist. Please check the URL."));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException ex) {
        int status = ex.getStatusCode().value();
        String error = ex.getStatusCode().toString();
        String message = ex.getReason() != null ? ex.getReason() : "Request failed";
        return ResponseEntity.status(status)
                .body(new ErrorResponse(status, error, message));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        String supported = ex.getSupportedMethods() != null
                ? String.join(", ", ex.getSupportedMethods())
                : "unknown";
        return ResponseEntity.status(405)
                .body(new ErrorResponse(
                        405,
                        "HTTP method not allowed",
                        "Method '" + ex.getMethod() + "' is not supported for this endpoint. Supported methods: "
                                + supported));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleFileTooLarge(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(413)
                .body(new ErrorResponse(
                        413,
                        "File too large",
                        "The uploaded file exceeds the maximum allowed size of 100MB. Please compress the file and try again."));
    }

    @ExceptionHandler(LazyInitializationException.class)
    public ResponseEntity<ErrorResponse> handleLazy(LazyInitializationException ex) {
        log.error("LazyInitializationException: {}", ex.getMessage(), ex);
        return ResponseEntity.status(500)
                .body(new ErrorResponse(
                        500,
                        "Data loading error",
                        "A related data object could not be loaded. Please try again. If the problem persists contact your administrator."));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.error("DataIntegrityViolation: {}", ex.getMessage(), ex);

        String msg = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";

        if (msg.contains("unique") || msg.contains("duplicate")) {
            return ResponseEntity.status(409)
                    .body(new ErrorResponse(
                            409,
                            "Duplicate entry",
                            "A record with this value already exists. Please use a different value."));
        }

        if (msg.contains("foreign key") || msg.contains("violates")) {
            return ResponseEntity.status(409)
                    .body(new ErrorResponse(
                            409,
                            "Related record conflict",
                            "This record is referenced by other data and cannot be modified or deleted directly."));
        }

        return ResponseEntity.status(500)
                .body(new ErrorResponse(
                        500,
                        "Database constraint violation",
                        "The operation violates a database constraint. Please check your input data."));
    }

    @ExceptionHandler(HttpMessageNotWritableException.class)
    public ResponseEntity<ErrorResponse> handleNotWritable(HttpMessageNotWritableException ex) {
        log.error("HttpMessageNotWritableException: {}", ex.getMessage(), ex);
        return ResponseEntity.status(500).build();
    }

    @ExceptionHandler(ClientAbortException.class)
    public ResponseEntity<Void> handleClientAbort(ClientAbortException ex) {
        log.debug("Client aborted response stream: {}", ex.getMessage());
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAll(Exception ex) {
        if (ex instanceof ClientAbortException || ex.getCause() instanceof ClientAbortException) {
            log.debug("Client aborted response stream: {}", ex.getMessage());
            return ResponseEntity.noContent().build();
        }

        log.error("Unhandled exception: ", ex);
        return ResponseEntity.status(500)
                .body(new ErrorResponse(
                        500,
                        "Internal server error",
                        "An unexpected error occurred on the server. The error has been logged. Please try again or contact your administrator if the problem persists."));
    }

    private String toValidationMessage(FieldError error) {
        return error.getField() + ": " + error.getDefaultMessage();
    }
}
