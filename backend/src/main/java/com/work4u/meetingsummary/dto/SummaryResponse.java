package com.work4u.meetingsummary.dto;

import com.work4u.meetingsummary.model.MeetingSummary;
import java.time.LocalDateTime;
import java.util.List;

public class SummaryResponse {
    private String id;
    private String publicId;
    private String overview;
    private List<String> keyDecisions;
    private List<ActionItemDto> actionItems;
    private LocalDateTime createdAt;
    
    public SummaryResponse() {}
    
    public SummaryResponse(MeetingSummary summary) {
        this.id = summary.getId();
        this.publicId = summary.getPublicId();
        this.overview = summary.getOverview();
        this.keyDecisions = summary.getKeyDecisions();
        this.actionItems = summary.getActionItems().stream()
            .map(item -> new ActionItemDto(item.getTask(), item.getAssignee()))
            .toList();
        this.createdAt = summary.getCreatedAt();
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getPublicId() {
        return publicId;
    }
    
    public void setPublicId(String publicId) {
        this.publicId = publicId;
    }
    
    public String getOverview() {
        return overview;
    }
    
    public void setOverview(String overview) {
        this.overview = overview;
    }
    
    public List<String> getKeyDecisions() {
        return keyDecisions;
    }
    
    public void setKeyDecisions(List<String> keyDecisions) {
        this.keyDecisions = keyDecisions;
    }
    
    public List<ActionItemDto> getActionItems() {
        return actionItems;
    }
    
    public void setActionItems(List<ActionItemDto> actionItems) {
        this.actionItems = actionItems;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public static class ActionItemDto {
        private String task;
        private String assignee;
        
        public ActionItemDto() {}
        
        public ActionItemDto(String task, String assignee) {
            this.task = task;
            this.assignee = assignee;
        }
        
        public String getTask() {
            return task;
        }
        
        public void setTask(String task) {
            this.task = task;
        }
        
        public String getAssignee() {
            return assignee;
        }
        
        public void setAssignee(String assignee) {
            this.assignee = assignee;
        }
    }
}