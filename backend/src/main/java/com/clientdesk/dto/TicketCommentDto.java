package com.clientdesk.dto;

import com.clientdesk.model.TicketComment;

import java.time.OffsetDateTime;

public class TicketCommentDto {
    private Long id;
    private Long ticketId;
    private Long authorId;
    private String authorName;
    private String authorRole;
    private String text;
    private OffsetDateTime createdAt;

    public TicketCommentDto() {}

    public static TicketCommentDto fromEntity(TicketComment comment) {
        if (comment == null) return null;
        TicketCommentDto dto = new TicketCommentDto();
        dto.setId(comment.getId());
        dto.setTicketId(comment.getTicket() != null ? comment.getTicket().getId() : null);
        if (comment.getAuthor() != null) {
            dto.setAuthorId(comment.getAuthor().getId());
            dto.setAuthorName(comment.getAuthor().getFullName());
            dto.setAuthorRole(comment.getAuthor().getRole().name());
        }
        dto.setText(comment.getText());
        dto.setCreatedAt(comment.getCreatedAt());
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

    public String getAuthorRole() { return authorRole; }
    public void setAuthorRole(String authorRole) { this.authorRole = authorRole; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
