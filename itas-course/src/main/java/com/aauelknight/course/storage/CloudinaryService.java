package com.aauelknight.course.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CloudinaryService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);

    private final Cloudinary cloudinary;

    @Value("${cloudinary.folder:itas-portal}")
    private String folder;

    @Value("${cloudinary.enabled:true}")
    private boolean enabled;

    public CloudinaryService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true));
    }

    public String uploadFile(MultipartFile file, String subfolder, String resourceType) {
        if (!enabled) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "File upload is not configured");
        }

        try {
            String folderPath = folder + "/" + subfolder;
            Map<String, Object> options = ObjectUtils.asMap(
                    "folder", folderPath,
                    "resource_type", resourceType,
                    "use_filename", true,
                    "unique_filename", true);

            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), options);
            String secureUrl = (String) result.get("secure_url");

            log.info("Uploaded to Cloudinary: {}", secureUrl);
            return secureUrl;
        } catch (IOException e) {
            log.error("Cloudinary upload failed: {}", e.getMessage(), e);
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "File upload failed: " + e.getMessage());
        }
    }

    public String uploadImage(MultipartFile file, String subfolder) {
        return uploadFile(file, subfolder, "image");
    }

    public boolean isValidUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        try {
            URI uri = new URI(url.trim());
            return "https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme());
        } catch (URISyntaxException e) {
            return false;
        }
    }
}


