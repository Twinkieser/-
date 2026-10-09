package com.clientdesk.dto;

import com.clientdesk.model.Role;
import jakarta.validation.constraints.Size;

public class UpdateUserRequest {

    @Size(max = 100, message = "ФИО не более 100 символов")
    private String fullName;

    private Role role;

    private Boolean active;

    @Size(min = 6, message = "Пароль должен быть не менее 6 символов")
    private String password;

    public UpdateUserRequest() {}

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
