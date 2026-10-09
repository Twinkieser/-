package com.clientdesk.dto;

import com.clientdesk.model.TicketStatus;
import jakarta.validation.constraints.NotNull;

public class StatusChangeRequest {

    @NotNull(message = "Целевой статус обязателен")
    private TicketStatus targetStatus;

    /**
     * Mandatory for:
     * - WAITING_CLARIFICATION (reason for clarification)
     * - ON_REVIEW -> IN_PROGRESS (rework feedback / comment)
     */
    private String reason;

    /**
     * Optional or mandatory resolution result text (when submitting for review or closing)
     */
    private String result;

    public StatusChangeRequest() {}

    public StatusChangeRequest(TicketStatus targetStatus, String reason, String result) {
        this.targetStatus = targetStatus;
        this.reason = reason;
        this.result = result;
    }

    public TicketStatus getTargetStatus() { return targetStatus; }
    public void setTargetStatus(TicketStatus targetStatus) { this.targetStatus = targetStatus; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
}
