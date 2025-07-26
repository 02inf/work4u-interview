package com.work4u.meetingsummary.dto;

import jakarta.validation.constraints.NotBlank;

public class SummaryRequest {
    
    @NotBlank(message = "Transcript cannot be empty")
    private String transcript;
    
    public SummaryRequest() {}
    
    public SummaryRequest(String transcript) {
        this.transcript = transcript;
    }
    
    public String getTranscript() {
        return transcript;
    }
    
    public void setTranscript(String transcript) {
        this.transcript = transcript;
    }
}