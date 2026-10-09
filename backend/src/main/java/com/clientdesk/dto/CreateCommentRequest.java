package com.clientdesk.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateCommentRequest {

    @NotBlank(message = "Текст комментария не может быть пустым")
    private String text;

    public CreateCommentRequest() {}

    public CreateCommentRequest(String text) {
        this.text = text;
    }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
