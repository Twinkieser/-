package com.clientdesk.dto;

import com.clientdesk.model.Priority;
import com.clientdesk.model.Ticket;
import com.clientdesk.model.TicketStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public class TicketDto {
    private Long id;
    private Long number;
    private OffsetDateTime createdAt;

    private Long clientId;
    private String clientName;
    private String clientPhone;
    private String clientEmail;

    private String contactPerson;
    private String subject;
    private String description;

    private Long serviceTypeId;
    private String serviceTypeName;

    private Priority priority;

    private Long assigneeId;
    private String assigneeName;

    private LocalDate dueDate;
    private TicketStatus status;
    private String result;
    private OffsetDateTime closedAt;

    private boolean overdue;

    private List<TicketCommentDto> comments = new ArrayList<>();
    private List<TicketHistoryDto> history = new ArrayList<>();

    public TicketDto() {}

    public static TicketDto fromEntity(Ticket ticket, boolean includeRelations) {
        if (ticket == null) return null;
        TicketDto dto = new TicketDto();
        dto.setId(ticket.getId());
        dto.setNumber(ticket.getNumber());
        dto.setCreatedAt(ticket.getCreatedAt());

        if (ticket.getClient() != null) {
            dto.setClientId(ticket.getClient().getId());
            dto.setClientName(ticket.getClient().getName());
            dto.setClientPhone(ticket.getClient().getPhone());
            dto.setClientEmail(ticket.getClient().getEmail());
        }

        dto.setContactPerson(ticket.getContactPerson());
        dto.setSubject(ticket.getSubject());
        dto.setDescription(ticket.getDescription());

        if (ticket.getServiceType() != null) {
            dto.setServiceTypeId(ticket.getServiceType().getId());
            dto.setServiceTypeName(ticket.getServiceType().getName());
        }

        dto.setPriority(ticket.getPriority());

        if (ticket.getAssignee() != null) {
            dto.setAssigneeId(ticket.getAssignee().getId());
            dto.setAssigneeName(ticket.getAssignee().getFullName());
        }

        dto.setDueDate(ticket.getDueDate());
        dto.setStatus(ticket.getStatus());
        dto.setResult(ticket.getResult());
        dto.setClosedAt(ticket.getClosedAt());
        dto.setOverdue(ticket.isOverdue());

        if (includeRelations) {
            if (ticket.getComments() != null) {
                dto.setComments(ticket.getComments().stream().map(TicketCommentDto::fromEntity).toList());
            }
            if (ticket.getHistory() != null) {
                dto.setHistory(ticket.getHistory().stream().map(TicketHistoryDto::fromEntity).toList());
            }
        }

        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getNumber() { return number; }
    public void setNumber(Long number) { this.number = number; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getClientPhone() { return clientPhone; }
    public void setClientPhone(String clientPhone) { this.clientPhone = clientPhone; }

    public String getClientEmail() { return clientEmail; }
    public void setClientEmail(String clientEmail) { this.clientEmail = clientEmail; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getServiceTypeId() { return serviceTypeId; }
    public void setServiceTypeId(Long serviceTypeId) { this.serviceTypeId = serviceTypeId; }

    public String getServiceTypeName() { return serviceTypeName; }
    public void setServiceTypeName(String serviceTypeName) { this.serviceTypeName = serviceTypeName; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }

    public String getAssigneeName() { return assigneeName; }
    public void setAssigneeName(String assigneeName) { this.assigneeName = assigneeName; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public TicketStatus getStatus() { return status; }
    public void setStatus(TicketStatus status) { this.status = status; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public OffsetDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(OffsetDateTime closedAt) { this.closedAt = closedAt; }

    public boolean isOverdue() { return overdue; }
    public void setOverdue(boolean overdue) { this.overdue = overdue; }

    public List<TicketCommentDto> getComments() { return comments; }
    public void setComments(List<TicketCommentDto> comments) { this.comments = comments; }

    public List<TicketHistoryDto> getHistory() { return history; }
    public void setHistory(List<TicketHistoryDto> history) { this.history = history; }
}
