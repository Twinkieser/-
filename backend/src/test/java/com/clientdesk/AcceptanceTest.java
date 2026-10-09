package com.clientdesk;

import com.clientdesk.dto.*;
import com.clientdesk.model.Priority;
import com.clientdesk.model.Role;
import com.clientdesk.model.TicketStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AcceptanceTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("clientdesk_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String managerToken;
    private static String executorToken;
    private static Long createdClientId;
    private static Long createdTicketId;
    private static Long ticketNumber;

    @Test
    @Order(1)
    @DisplayName("0. Авторизация менеджера и исполнителя (получение JWT токенов)")
    void authenticateUsers() throws Exception {
        // Manager login
        AuthRequest managerReq = new AuthRequest("admin", "admin123");
        MvcResult mResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(managerReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("MANAGER"))
                .andReturn();

        JsonNode mNode = objectMapper.readTree(mResult.getResponse().getContentAsString());
        managerToken = "Bearer " + mNode.get("token").asText();

        // Executor login
        AuthRequest execReq = new AuthRequest("ivan", "ivan123");
        MvcResult eResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(execReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("EXECUTOR"))
                .andReturn();

        JsonNode eNode = objectMapper.readTree(eResult.getResponse().getContentAsString());
        executorToken = "Bearer " + eNode.get("token").asText();
    }

    @Test
    @Order(2)
    @DisplayName("1. Менеджер добавляет клиента и регистрирует заявку")
    void step1_managerAddsClientAndTicket() throws Exception {
        // Create client
        CreateClientRequest clientReq = new CreateClientRequest();
        clientReq.setName("ООО «Тестовая Интеграция»");
        clientReq.setContactPerson("Виктор Романов");
        clientReq.setPhone("+7 (999) 777-66-55");
        clientReq.setEmail("v.romanov@test-corp.ru");
        clientReq.setNote("Тестовый клиент для сквозного сценария");

        MvcResult clientRes = mockMvc.perform(post("/api/clients")
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clientReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("ООО «Тестовая Интеграция»"))
                .andReturn();

        createdClientId = objectMapper.readTree(clientRes.getResponse().getContentAsString()).get("id").asLong();

        // Create ticket
        CreateTicketRequest ticketReq = new CreateTicketRequest();
        ticketReq.setClientId(createdClientId);
        ticketReq.setSubject("Настройка отказоустойчивого кластера PostgreSQL");
        ticketReq.setDescription("Требуется развернуть Patroni и pgBouncer на двух серверах");
        ticketReq.setPriority(Priority.HIGH);
        ticketReq.setServiceTypeId(2L);

        MvcResult ticketRes = mockMvc.perform(post("/api/tickets")
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ticketReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.status").value("NEW"))
                .andReturn();

        JsonNode tNode = objectMapper.readTree(ticketRes.getResponse().getContentAsString());
        createdTicketId = tNode.get("id").asLong();
        ticketNumber = tNode.get("number").asLong();
    }

    @Test
    @Order(3)
    @DisplayName("2. Менеджер назначает сотрудника и срок исполнения")
    void step2_managerAssignsEmployeeAndDueDate() throws Exception {
        UpdateTicketRequest updateReq = new UpdateTicketRequest();
        updateReq.setAssigneeId(2L); // ivan (id=2)
        updateReq.setDueDate(LocalDate.now().plusDays(3));

        mockMvc.perform(put("/api/tickets/" + createdTicketId)
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assigneeName").value("Иван Смирнов (Инженер)"))
                .andExpect(jsonPath("$.dueDate").isNotEmpty());
    }

    @Test
    @Order(4)
    @DisplayName("3. Исполнитель входит и принимает заявку в работу (NEW -> IN_PROGRESS)")
    void step3_executorAcceptsTicket() throws Exception {
        StatusChangeRequest statusReq = new StatusChangeRequest(TicketStatus.IN_PROGRESS, null, null);

        mockMvc.perform(patch("/api/tickets/" + createdTicketId + "/status")
                        .header("Authorization", executorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @Order(5)
    @DisplayName("4. Исполнитель добавляет комментарий, результат и передает на проверку (IN_PROGRESS -> ON_REVIEW)")
    void step4_executorAddsCommentAndSubmitsForReview() throws Exception {
        // Add comment
        CreateCommentRequest commentReq = new CreateCommentRequest("Кластер собран, репликация синхронизирована без отставания.");
        mockMvc.perform(post("/api/tickets/" + createdTicketId + "/comments")
                        .header("Authorization", executorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(commentReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.text").value(commentReq.getText()));

        // Submit for review
        StatusChangeRequest reviewReq = new StatusChangeRequest(
                TicketStatus.ON_REVIEW,
                null,
                "Patroni и pgBouncer развернуты и протестированы при симуляции падения мастера"
        );

        mockMvc.perform(patch("/api/tickets/" + createdTicketId + "/status")
                        .header("Authorization", executorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ON_REVIEW"))
                .andExpect(jsonPath("$.result").isNotEmpty());
    }

    @Test
    @Order(6)
    @DisplayName("5. Менеджер проверяет и закрывает заявку (ON_REVIEW -> CLOSED)")
    void step5_managerChecksAndCloses() throws Exception {
        StatusChangeRequest closeReq = new StatusChangeRequest(TicketStatus.CLOSED, null, null);

        mockMvc.perform(patch("/api/tickets/" + createdTicketId + "/status")
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(closeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.closedAt").isNotEmpty());
    }

    @Test
    @Order(7)
    @DisplayName("6. Заявка находится через поиск, видна история действий")
    void step6_searchAndHistoryVerification() throws Exception {
        // Search by subject
        mockMvc.perform(get("/api/tickets")
                        .header("Authorization", managerToken)
                        .param("search", "отказоустойчивого"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(createdTicketId));

        // Get details and check history
        MvcResult detailRes = mockMvc.perform(get("/api/tickets/" + createdTicketId)
                        .header("Authorization", managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.history").isArray())
                .andExpect(jsonPath("$.comments").isArray())
                .andReturn();

        JsonNode detailNode = objectMapper.readTree(detailRes.getResponse().getContentAsString());
        assertThat(detailNode.get("history").size()).isGreaterThanOrEqualTo(3);
    }

    @Test
    @Order(8)
    @DisplayName("7. Заявка отражается в отчёте")
    void step7_ticketReflectedInReports() throws Exception {
        mockMvc.perform(get("/api/reports/dashboard")
                        .header("Authorization", managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.closedCount").isNumber());

        mockMvc.perform(get("/api/reports/summary")
                        .header("Authorization", managerToken)
                        .param("fromDate", LocalDate.now().minusDays(1).toString())
                        .param("toDate", LocalDate.now().plusDays(1).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusDistribution.CLOSED").isNumber());
    }

    @Test
    @Order(9)
    @DisplayName("НЕГАТИВНЫЙ ТЕСТ: Исполнитель получает 403 на действия менеджера (закрытие заявки и создание клиентов)")
    void negativeTest_executorForbiddenOnManagerActions() throws Exception {
        // Attempt to create client as executor -> 403
        CreateClientRequest cReq = new CreateClientRequest();
        cReq.setName("Недопустимый клиент");
        mockMvc.perform(post("/api/clients")
                        .header("Authorization", executorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cReq)))
                .andExpect(status().isForbidden());

        // Attempt to close ticket as executor -> 403
        StatusChangeRequest closeReq = new StatusChangeRequest(TicketStatus.CLOSED, null, null);
        mockMvc.perform(patch("/api/tickets/" + createdTicketId + "/status")
                        .header("Authorization", executorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(closeReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(10)
    @DisplayName("НЕГАТИВНЫЙ ТЕСТ: Недопустимый переход статуса возвращает 409 Conflict")
    void negativeTest_invalidStatusTransitionReturns409() throws Exception {
        // Created ticket is CLOSED, attempting to transition to ON_REVIEW or IN_PROGRESS directly returns 409
        StatusChangeRequest invalidReq = new StatusChangeRequest(TicketStatus.ON_REVIEW, null, null);
        mockMvc.perform(patch("/api/tickets/" + createdTicketId + "/status")
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Недопустимый переход")));
    }
}
