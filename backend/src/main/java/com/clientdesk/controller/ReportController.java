package com.clientdesk.controller;

import com.clientdesk.dto.ReportSummaryDto;
import com.clientdesk.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Reports", description = "Дашборд, аналитические отчёты и выгрузка в CSV")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Сводные показатели для главной панели дашборда")
    public ResponseEntity<ReportSummaryDto> getDashboard() {
        return ResponseEntity.ok(reportService.getDashboardStats());
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Отчёт за период: распределение по статусам, сотрудникам, просрочки (только MANAGER)")
    public ResponseEntity<ReportSummaryDto> getReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(reportService.getReportForPeriod(fromDate, toDate));
    }

    @GetMapping("/export-csv")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Экспорт отчёта по заявкам в формате CSV (только MANAGER)")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        String csvData = reportService.exportTicketsToCsv(fromDate, toDate);
        byte[] bytes = csvData.getBytes(StandardCharsets.UTF_8);

        String filename = "clientdesk_tickets_" + LocalDate.now() + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }
}
