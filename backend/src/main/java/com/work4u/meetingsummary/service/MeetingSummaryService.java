package com.work4u.meetingsummary.service;

import com.work4u.meetingsummary.model.MeetingSummary;
import com.work4u.meetingsummary.repository.MeetingSummaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class MeetingSummaryService {
    
    @Autowired
    private MeetingSummaryRepository repository;
    
    @Autowired
    private GeminiService geminiService;
    
    public Mono<MeetingSummary> generateSummary(String transcript) {
        String publicId = UUID.randomUUID().toString();
        
        return geminiService.generateSummary(transcript)
            .map(parsedSummary -> {
                MeetingSummary summary = new MeetingSummary(
                    publicId,
                    transcript,
                    parsedSummary.getOverview(),
                    parsedSummary.getKeyDecisions(),
                    parsedSummary.getActionItems()
                );
                return summary;
            })
            .map(summary -> repository.save(summary));
    }
    
    public Flux<String> generateSummaryStream(String transcript) {
        return geminiService.generateSummaryStream(transcript);
    }
    
    public List<MeetingSummary> getAllSummaries() {
        return repository.findAll();
    }
    
    public Optional<MeetingSummary> getSummaryByPublicId(String publicId) {
        return repository.findByPublicId(publicId);
    }
    
    public Optional<MeetingSummary> getSummaryById(String id) {
        return repository.findById(id);
    }
}