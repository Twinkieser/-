package com.clientdesk.repository;

import com.clientdesk.model.Priority;
import com.clientdesk.model.Ticket;
import com.clientdesk.model.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {

    Optional<Ticket> findByNumber(Long number);

    List<Ticket> findByClientIdOrderByCreatedAtDesc(Long clientId);

    @Query("SELECT t FROM Ticket t WHERE t.assignee.id = :assigneeId AND t.status != com.clientdesk.model.TicketStatus.CLOSED ORDER BY t.dueDate ASC NULLS LAST, t.priority DESC, t.createdAt ASC")
    List<Ticket> findActiveTicketsForAssignee(@Param("assigneeId") Long assigneeId);

    long countByStatus(TicketStatus status);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.dueDate < :today AND t.status != com.clientdesk.model.TicketStatus.CLOSED")
    long countOverdueTickets(@Param("today") LocalDate today);

    @Query("SELECT t FROM Ticket t WHERE t.dueDate < :today AND t.status != com.clientdesk.model.TicketStatus.CLOSED ORDER BY t.dueDate ASC")
    List<Ticket> findOverdueTickets(@Param("today") LocalDate today);

    @Query("SELECT t FROM Ticket t WHERE t.createdAt >= :startDate AND t.createdAt <= :endDate")
    List<Ticket> findTicketsInPeriod(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);

    @Query(value = "SELECT nextval('ticket_number_seq')", nativeQuery = true)
    Long getNextTicketNumber();
}
