package com.clientdesk.dto;

import java.util.List;
import java.util.Map;

public class ReportSummaryDto {
    private long totalTickets;
    private long newCount;
    private long inProgressCount;
    private long waitingClarificationCount;
    private long onReviewCount;
    private long closedCount;
    private long overdueCount;

    private Map<String, Long> statusDistribution;
    private Map<String, Long> assigneeDistribution;
    private List<TicketDto> overdueTickets;

    public ReportSummaryDto() {}

    public long getTotalTickets() { return totalTickets; }
    public void setTotalTickets(long totalTickets) { this.totalTickets = totalTickets; }

    public long getNewCount() { return newCount; }
    public void setNewCount(long newCount) { this.newCount = newCount; }

    public long getInProgressCount() { return inProgressCount; }
    public void setInProgressCount(long inProgressCount) { this.inProgressCount = inProgressCount; }

    public long getWaitingClarificationCount() { return waitingClarificationCount; }
    public void setWaitingClarificationCount(long waitingClarificationCount) { this.waitingClarificationCount = waitingClarificationCount; }

    public long getOnReviewCount() { return onReviewCount; }
    public void setOnReviewCount(long onReviewCount) { this.onReviewCount = onReviewCount; }

    public long getClosedCount() { return closedCount; }
    public void setClosedCount(long closedCount) { this.closedCount = closedCount; }

    public long getOverdueCount() { return overdueCount; }
    public void setOverdueCount(long overdueCount) { this.overdueCount = overdueCount; }

    public Map<String, Long> getStatusDistribution() { return statusDistribution; }
    public void setStatusDistribution(Map<String, Long> statusDistribution) { this.statusDistribution = statusDistribution; }

    public Map<String, Long> getAssigneeDistribution() { return assigneeDistribution; }
    public void setAssigneeDistribution(Map<String, Long> assigneeDistribution) { this.assigneeDistribution = assigneeDistribution; }

    public List<TicketDto> getOverdueTickets() { return overdueTickets; }
    public void setOverdueTickets(List<TicketDto> overdueTickets) { this.overdueTickets = overdueTickets; }
}
