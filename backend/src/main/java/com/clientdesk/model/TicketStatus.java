package com.clientdesk.model;

import java.util.Set;

public enum TicketStatus {
    NEW,
    IN_PROGRESS,
    WAITING_CLARIFICATION,
    ON_REVIEW,
    CLOSED;

    /**
     * Checks if a transition from current status to target status is valid according to the state machine.
     * NEW -> IN_PROGRESS
     * IN_PROGRESS -> WAITING_CLARIFICATION
     * IN_PROGRESS -> ON_REVIEW
     * WAITING_CLARIFICATION -> IN_PROGRESS
     * ON_REVIEW -> CLOSED (MANAGER only)
     * ON_REVIEW -> IN_PROGRESS (return for rework, comment required)
     */
    public boolean canTransitionTo(TicketStatus target) {
        if (this == target) {
            return false;
        }
        return switch (this) {
            case NEW -> target == IN_PROGRESS;
            case IN_PROGRESS -> target == WAITING_CLARIFICATION || target == ON_REVIEW;
            case WAITING_CLARIFICATION -> target == IN_PROGRESS;
            case ON_REVIEW -> target == CLOSED || target == IN_PROGRESS;
            case CLOSED -> false; // Closed is terminal state
        };
    }

    /**
     * Set of statuses that EXECUTOR is permitted to transition TO.
     * Executor cannot set CLOSED.
     */
    public static final Set<TicketStatus> EXECUTOR_ALLOWED_TARGETS = Set.of(
            IN_PROGRESS,
            WAITING_CLARIFICATION,
            ON_REVIEW
    );
}
