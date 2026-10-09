package com.clientdesk.dto;

import com.clientdesk.model.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class CreateTicketRequest {

    @NotNull(message = "Клиент обязателен")
    private Long clientId;

    @Size(max = 150, message = "Контактное лицо не более 150 символов")
    private String contactPerson;

    @NotBlank(message = "Тема обращения обязательна")
    @Size(max = 255, message = "Тема не более 255 символов")
    private String subject;

    @NotBlank(message = "Описание проблемы/задачи обязательно")
    private String description;

    private Long serviceTypeId;

    private Priority priority = Priority.MEDIUM;

    private Long assigneeId;

    private LocalDate dueDate;

    public CreateTicketRequest() {}

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getServiceTypeId() { return serviceTypeId; }
    public void setServiceTypeId(Long serviceTypeId) { this.serviceTypeId = serviceTypeId; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
}
