package com.aauelknight.itas_backend.config;

import java.io.File;
import java.nio.file.Paths;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class FileStorageConfig implements WebMvcConfigurer {

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String absolutePath = Paths
                .get(uploadDir)
                .toAbsolutePath()
                .normalize()
                .toString();

        if (!absolutePath.endsWith(File.separator)) {
            absolutePath = absolutePath + File.separator;
        }

        System.out.println("=== STATIC FILES SERVING FROM: " + absolutePath + " ===");

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + absolutePath)
                .setCachePeriod(3600)
                .resourceChain(true);
    }
}

