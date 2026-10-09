package com.clientdesk.controller;

import com.clientdesk.service.EventLogger;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
@Tag(name = "Logs", description = "Журнал аудита системных событий (logs/events.log)")
public class EventLogController {

    private final EventLogger eventLogger;

    public EventLogController(EventLogger eventLogger) {
        this.eventLogger = eventLogger;
    }

    @GetMapping("/events")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Получение последних записей из файла logs/events.log (только MANAGER)")
    public ResponseEntity<List<String>> getRecentEvents(@RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(eventLogger.getRecentEvents(limit));
    }
}
