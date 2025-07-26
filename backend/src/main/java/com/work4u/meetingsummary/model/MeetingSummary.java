package com.work4u.meetingsummary.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "meeting_summaries")
public class MeetingSummary {
    
    @Id
    private String id;
    
    private String publicId; // UUID for sharing
    
    private String originalTranscript;
    
    private String overview;
    
    private List<String> keyDecisions;
    
    private List<ActionItem> actionItems;
    
    private LocalDateTime createdAt;
    
    // Constructors
    public MeetingSummary() {
        this.createdAt = LocalDateTime.now();
    }
    
    public MeetingSummary(String publicId, String originalTranscript, String overview, 
                         List<String> keyDecisions, List<ActionItem> actionItems) {
        this();
        this.publicId = publicId;
        this.originalTranscript = originalTranscript;
        this.overview = overview;
        this.keyDecisions = keyDecisions;
        this.actionItems = actionItems;
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
    
    public String getOriginalTranscript() {
        return originalTranscript;
    }
    
    public void setOriginalTranscript(String originalTranscript) {
        this.originalTranscript = originalTranscript;
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
    
    public List<ActionItem> getActionItems() {
        return actionItems;
    }
    
    public void setActionItems(List<ActionItem> actionItems) {
        this.actionItems = actionItems;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    // Inner class for Action Items
    public static class ActionItem {
        private String task;
        private String assignee;
        
        public ActionItem() {}
        
        public ActionItem(String task, String assignee) {
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
    
    // Inner class for parsed summary from AI
    public static class ParsedSummary {
        private String overview;
        private List<String> keyDecisions;
        private List<ActionItem> actionItems;
        
        public ParsedSummary() {}
        
        public ParsedSummary(String overview, List<String> keyDecisions, List<ActionItem> actionItems) {
            this.overview = overview;
            this.keyDecisions = keyDecisions;
            this.actionItems = actionItems;
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
        
        public List<ActionItem> getActionItems() {
            return actionItems;
        }
        
        public void setActionItems(List<ActionItem> actionItems) {
            this.actionItems = actionItems;
        }
    }
}