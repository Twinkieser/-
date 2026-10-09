package com.clientdesk.dto;

import com.clientdesk.model.ServiceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ServiceTypeDto {
    private Long id;

    @NotBlank(message = "Название вида услуги обязательно")
    @Size(max = 100, message = "Не более 100 символов")
    private String name;

    private String description;
    private boolean active;

    public ServiceTypeDto() {}

    public static ServiceTypeDto fromEntity(ServiceType entity) {
        if (entity == null) return null;
        ServiceTypeDto dto = new ServiceTypeDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setActive(entity.isActive());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
