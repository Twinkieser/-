package com.clientdesk.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateClientRequest {

    @NotBlank(message = "Наименование обязательно")
    @Size(max = 255, message = "Не более 255 символов")
    private String name;

    @Size(max = 150, message = "Контактное лицо не более 150 символов")
    private String contactPerson;

    @Size(max = 50, message = "Телефон не более 50 символов")
    private String phone;

    @Size(max = 100, message = "Email не более 100 символов")
    private String email;

    private String note;

    public CreateClientRequest() {}

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
}
