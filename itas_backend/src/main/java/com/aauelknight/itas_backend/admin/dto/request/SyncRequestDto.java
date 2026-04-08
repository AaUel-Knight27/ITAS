package com.aauelknight.itas_backend.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncRequestDto {

    @NotBlank(message = "System name is required")
    private String systemName;

    @NotBlank(message = "Sync type is required")
    private String syncType;
}

