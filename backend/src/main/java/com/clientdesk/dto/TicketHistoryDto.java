package com.clientdesk.dto;

import com.clientdesk.model.TicketHistory;

import java.time.OffsetDateTime;

public class TicketHistoryDto {
    private Long id;
    private Long ticketId;
    private Long authorId;
    private String authorName;
    private String action;
    private String oldValue;
    private String newValue;
    private OffsetDateTime createdAt;

    public TicketHistoryDto() {}

    public static TicketHistoryDto fromEntity(TicketHistory history) {
        if (history == null) return null;
        TicketHistoryDto dto = new TicketHistoryDto();
        dto.setId(history.getId());
        dto.setTicketId(history.getTicket() != null ? history.getTicket().getId() : null);
        if (history.getAuthor() != null) {
            dto.setAuthorId(history.getAuthor().getId());
            dto.setAuthorName(history.getAuthor().getFullName());
        }
        dto.setAction(history.getAction());
        dto.setOldValue(history.getOldValue());
        dto.setNewValue(history.getNewValue());
        dto.setCreatedAt(history.getCreatedAt());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTicketId() { return ticketId; }
    public void setTicketId(Long ticketId) { this.ticketId = ticketId; }

    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getOldValue() { return oldValue; }
    public void setOldValue(String oldValue) { this.oldValue = oldValue; }

    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
