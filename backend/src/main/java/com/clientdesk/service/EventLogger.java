package com.clientdesk.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class EventLogger {

    private static final Logger log = LoggerFactory.getLogger(EventLogger.class);
    private final String logFilePath;

    public EventLogger(@Value("${app.logging.event-log-file:logs/events.log}") String logFilePath) {
        this.logFilePath = logFilePath;
        ensureLogDirectoryExists();
    }

    private void ensureLogDirectoryExists() {
        try {
            File file = new File(logFilePath);
            File parent = file.getParentFile();
            if (parent != null && !parent.exists()) {
                parent.mkdirs();
            }
            if (!file.exists()) {
                file.createNewFile();
            }
        } catch (IOException e) {
            log.error("Failed to initialize event log file: {}", logFilePath, e);
        }
    }

    public synchronized void logEvent(String username, String action, String details) {
        String timestamp = OffsetDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        String entry = String.format("[%s] [USER: %s] [ACTION: %s] %s", timestamp, username, action, details);

        log.info("ClientDesk Event: {}", entry);

        try (FileWriter fw = new FileWriter(logFilePath, true);
             PrintWriter pw = new PrintWriter(fw)) {
            pw.println(entry);
        } catch (IOException e) {
            log.error("Failed to write event to file: {}", logFilePath, e);
        }
    }

    public List<String> getRecentEvents(int limit) {
        try {
            if (!Files.exists(Paths.get(logFilePath))) {
                return Collections.emptyList();
            }
            List<String> lines = Files.readAllLines(Paths.get(logFilePath));
            int size = lines.size();
            int start = Math.max(0, size - limit);
            List<String> sub = new ArrayList<>(lines.subList(start, size));
            Collections.reverse(sub);
            return sub;
        } catch (IOException e) {
            log.error("Failed to read events from file: {}", logFilePath, e);
            return Collections.emptyList();
        }
    }
}
