package com.clientdesk.service;

import com.clientdesk.dto.ReportSummaryDto;
import com.clientdesk.dto.TicketDto;
import com.clientdesk.model.Ticket;
import com.clientdesk.model.TicketStatus;
import com.clientdesk.repository.TicketRepository;
import com.clientdesk.repository.UserRepository;
import com.opencsv.CSVWriter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.StringWriter;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public ReportService(TicketRepository ticketRepository, UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    public ReportSummaryDto getDashboardStats() {
        ReportSummaryDto dto = new ReportSummaryDto();

        dto.setTotalTickets(ticketRepository.count());
        dto.setNewCount(ticketRepository.countByStatus(TicketStatus.NEW));
        dto.setInProgressCount(ticketRepository.countByStatus(TicketStatus.IN_PROGRESS));
        dto.setWaitingClarificationCount(ticketRepository.countByStatus(TicketStatus.WAITING_CLARIFICATION));
        dto.setOnReviewCount(ticketRepository.countByStatus(TicketStatus.ON_REVIEW));
        dto.setClosedCount(ticketRepository.countByStatus(TicketStatus.CLOSED));
        dto.setOverdueCount(ticketRepository.countOverdueTickets(LocalDate.now()));

        List<Ticket> overdueTickets = ticketRepository.findOverdueTickets(LocalDate.now());
        dto.setOverdueTickets(overdueTickets.stream().map(t -> TicketDto.fromEntity(t, false)).toList());

        return dto;
    }

    public ReportSummaryDto getReportForPeriod(LocalDate fromDate, LocalDate toDate) {
        LocalDate start = fromDate != null ? fromDate : LocalDate.now().minusMonths(1);
        LocalDate end = toDate != null ? toDate : LocalDate.now();

        OffsetDateTime startDt = start.atStartOfDay().atOffset(OffsetDateTime.now().getOffset());
        OffsetDateTime endDt = end.plusDays(1).atStartOfDay().atOffset(OffsetDateTime.now().getOffset());

        List<Ticket> tickets = ticketRepository.findTicketsInPeriod(startDt, endDt);

        ReportSummaryDto dto = new ReportSummaryDto();
        dto.setTotalTickets(tickets.size());

        Map<String, Long> statusMap = new HashMap<>();
        for (TicketStatus s : TicketStatus.values()) {
            statusMap.put(s.name(), 0L);
        }

        Map<String, Long> assigneeMap = new HashMap<>();
        assigneeMap.put("Не назначен", 0L);
        userRepository.findAll().forEach(u -> assigneeMap.put(u.getFullName(), 0L));

        List<TicketDto> overdueList = new ArrayList<>();

        for (Ticket t : tickets) {
            statusMap.put(t.getStatus().name(), statusMap.getOrDefault(t.getStatus().name(), 0L) + 1);

            String assigneeName = t.getAssignee() != null ? t.getAssignee().getFullName() : "Не назначен";
            assigneeMap.put(assigneeName, assigneeMap.getOrDefault(assigneeName, 0L) + 1);

            if (t.isOverdue()) {
                overdueList.add(TicketDto.fromEntity(t, false));
            }
        }

        dto.setNewCount(statusMap.getOrDefault(TicketStatus.NEW.name(), 0L));
        dto.setInProgressCount(statusMap.getOrDefault(TicketStatus.IN_PROGRESS.name(), 0L));
        dto.setWaitingClarificationCount(statusMap.getOrDefault(TicketStatus.WAITING_CLARIFICATION.name(), 0L));
        dto.setOnReviewCount(statusMap.getOrDefault(TicketStatus.ON_REVIEW.name(), 0L));
        dto.setClosedCount(statusMap.getOrDefault(TicketStatus.CLOSED.name(), 0L));
        dto.setOverdueCount(overdueList.size());

        dto.setStatusDistribution(statusMap);
        dto.setAssigneeDistribution(assigneeMap);
        dto.setOverdueTickets(overdueList);

        return dto;
    }

    public String exportTicketsToCsv(LocalDate fromDate, LocalDate toDate) {
        LocalDate start = fromDate != null ? fromDate : LocalDate.now().minusMonths(1);
        LocalDate end = toDate != null ? toDate : LocalDate.now();

        OffsetDateTime startDt = start.atStartOfDay().atOffset(OffsetDateTime.now().getOffset());
        OffsetDateTime endDt = end.plusDays(1).atStartOfDay().atOffset(OffsetDateTime.now().getOffset());

        List<Ticket> tickets = ticketRepository.findTicketsInPeriod(startDt, endDt);

        StringWriter sw = new StringWriter();
        try (CSVWriter writer = new CSVWriter(sw)) {
            // Write BOM for Excel UTF-8 support
            sw.write('\ufeff');

            // Header
            writer.writeNext(new String[]{
                    "Номер",
                    "Дата создания",
                    "Клиент",
                    "Контактное лицо",
                    "Тема",
                    "Вид услуги",
                    "Приоритет",
                    "Исполнитель",
                    "Срок исполнения",
                    "Статус",
                    "Просрочена",
                    "Результат",
                    "Дата закрытия"
            });

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

            for (Ticket t : tickets) {
                writer.writeNext(new String[]{
                        String.valueOf(t.getNumber()),
                        t.getCreatedAt() != null ? t.getCreatedAt().format(dtf) : "",
                        t.getClient() != null ? t.getClient().getName() : "",
                        t.getContactPerson() != null ? t.getContactPerson() : "",
                        t.getSubject(),
                        t.getServiceType() != null ? t.getServiceType().getName() : "",
                        t.getPriority().name(),
                        t.getAssignee() != null ? t.getAssignee().getFullName() : "Не назначен",
                        t.getDueDate() != null ? t.getDueDate().toString() : "",
                        t.getStatus().name(),
                        t.isOverdue() ? "ДА" : "НЕТ",
                        t.getResult() != null ? t.getResult() : "",
                        t.getClosedAt() != null ? t.getClosedAt().format(dtf) : ""
                });
            }
        } catch (Exception e) {
            throw new RuntimeException("Ошибка формирования CSV: " + e.getMessage(), e);
        }

        return sw.toString();
    }
}
