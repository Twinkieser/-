package com.clientdesk.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateServiceTypeRequest {

    @NotBlank(message = "Название вида услуги обязательно")
    @Size(max = 100, message = "Не более 100 символов")
    private String name;

    private String description;
    private Boolean active = true;

    public CreateServiceTypeRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
