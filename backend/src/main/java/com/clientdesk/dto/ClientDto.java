package com.clientdesk.dto;

import com.clientdesk.model.Client;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public class ClientDto {
    private Long id;

    @NotBlank(message = "Наименование организации или ФИО клиента обязательно")
    @Size(max = 255, message = "Не более 255 символов")
    private String name;

    private String contactPerson;
    private String phone;
    private String email;
    private String note;
    private OffsetDateTime createdAt;
    private long ticketCount;

    public ClientDto() {}

    public static ClientDto fromEntity(Client client, long ticketCount) {
        if (client == null) return null;
        ClientDto dto = new ClientDto();
        dto.setId(client.getId());
        dto.setName(client.getName());
        dto.setContactPerson(client.getContactPerson());
        dto.setPhone(client.getPhone());
        dto.setEmail(client.getEmail());
        dto.setNote(client.getNote());
        dto.setCreatedAt(client.getCreatedAt());
        dto.setTicketCount(ticketCount);
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public long getTicketCount() { return ticketCount; }
    public void setTicketCount(long ticketCount) { this.ticketCount = ticketCount; }
}
