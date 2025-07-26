package com.work4u.meetingsummary.controller;

import com.work4u.meetingsummary.dto.SummaryRequest;
import com.work4u.meetingsummary.dto.SummaryResponse;
import com.work4u.meetingsummary.model.MeetingSummary;
import com.work4u.meetingsummary.service.MeetingSummaryService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/summaries")
@CrossOrigin(origins = "*")
public class MeetingSummaryController {
    
    private static final Logger logger = LoggerFactory.getLogger(MeetingSummaryController.class);
    
    @Autowired
    private MeetingSummaryService summaryService;
    
    @PostMapping
    public Mono<ResponseEntity<SummaryResponse>> generateSummary(@Valid @RequestBody SummaryRequest request) {
        logger.info("Generating summary for transcript of length: {}", request.getTranscript().length());
        
        return summaryService.generateSummary(request.getTranscript())
            .map(summary -> {
                logger.info("Successfully generated summary with publicId: {}", summary.getPublicId());
                return ResponseEntity.ok(new SummaryResponse(summary));
            })
            .onErrorResume(error -> {
                logger.error("Error generating summary: ", error);
                return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
            });
    }
    
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> generateSummaryStream(@Valid @RequestBody SummaryRequest request) {
        logger.info("Starting streaming summary generation for transcript of length: {}", request.getTranscript().length());
        
        return summaryService.generateSummaryStream(request.getTranscript())
            .map(chunk -> "data: " + chunk + "\n\n")
            .onErrorReturn("data: [ERROR] 生成摘要时发生错误\n\n")
            .doOnComplete(() -> logger.info("Streaming summary generation completed"))
            .doOnError(error -> logger.error("Error in streaming summary generation: ", error));
    }
    
    @GetMapping
    public ResponseEntity<List<SummaryResponse>> getAllSummaries() {
        try {
            List<MeetingSummary> summaries = summaryService.getAllSummaries();
            List<SummaryResponse> responses = summaries.stream()
                .map(SummaryResponse::new)
                .toList();
            logger.info("Retrieved {} summaries", summaries.size());
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            logger.error("Error retrieving all summaries: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SummaryResponse> getSummaryById(@PathVariable String id) {
        logger.info("Retrieving summary by ID: {}", id);
        return summaryService.getSummaryById(id)
            .map(summary -> {
                logger.info("Found summary with ID: {}", id);
                return ResponseEntity.ok(new SummaryResponse(summary));
            })
            .orElseGet(() -> {
                logger.warn("Summary not found with ID: {}", id);
                return ResponseEntity.notFound().build();
            });
    }
    
    @GetMapping("/public/{publicId}")
    public ResponseEntity<SummaryResponse> getSummaryByPublicId(@PathVariable String publicId) {
        logger.info("Retrieving summary by public ID: {}", publicId);
        return summaryService.getSummaryByPublicId(publicId)
            .map(summary -> {
                logger.info("Found summary with public ID: {}", publicId);
                return ResponseEntity.ok(new SummaryResponse(summary));
            })
            .orElseGet(() -> {
                logger.warn("Summary not found with public ID: {}", publicId);
                return ResponseEntity.notFound().build();
            });
    }
}