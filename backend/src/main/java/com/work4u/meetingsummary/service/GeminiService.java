package com.work4u.meetingsummary.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.work4u.meetingsummary.model.MeetingSummary;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {
    
    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);
    
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    
    @Value("${gemini.api.key}")
    private String apiKey;
    
    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent}")
    private String apiUrl;
    
    public GeminiService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        // 配置HttpClient超时
        HttpClient httpClient = HttpClient.create()
            .responseTimeout(Duration.ofSeconds(120))  // 120秒响应超时
            .followRedirect(true);
        
        this.webClient = webClientBuilder
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)) // 10MB
            .build();
        this.objectMapper = objectMapper;
    }
    
    public Mono<MeetingSummary.ParsedSummary> generateSummary(String transcript) {
        logger.info("Generating summary for transcript of length: {}", transcript.length());
        String prompt = buildPrompt(transcript);
        
        Map<String, Object> request = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", prompt)
                ))
            ),
            "generationConfig", Map.of(
                "temperature", 0.3,
                "maxOutputTokens", 2048
            )
        );
        
        return webClient.post()
            .uri(apiUrl)
            .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .header("X-goog-api-key", apiKey)
            .bodyValue(request)
            .retrieve()
            .bodyToMono(String.class)
            .timeout(Duration.ofSeconds(120))  // 应用级超时
            .doOnNext(response -> logger.debug("Received Gemini response: {}", response))
            .map(this::parseSummaryResponse)
            .doOnSuccess(parsed -> logger.info("Successfully parsed summary with {} key decisions and {} action items", 
                parsed.getKeyDecisions().size(), parsed.getActionItems().size()))
            .doOnError(error -> logger.error("Error in Gemini API call: ", error));
    }
    
    public Flux<String> generateSummaryStream(String transcript) {
        logger.info("Starting streaming summary generation for transcript of length: {}", transcript.length());
        String prompt = buildPrompt(transcript);
        
        Map<String, Object> request = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", prompt)
                ))
            ),
            "generationConfig", Map.of(
                "temperature", 0.3,
                "maxOutputTokens", 2048
            )
        );
        
        String streamUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent";
        
        return webClient.post()
            .uri(streamUrl)
            .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .header("X-goog-api-key", apiKey)
            .bodyValue(request)
            .retrieve()
            .bodyToFlux(String.class)
            .timeout(Duration.ofSeconds(120))  // 应用级超时
            .map(this::extractTextFromStreamResponse)
            .filter(text -> !text.isEmpty())
            .doOnNext(chunk -> logger.debug("Streaming chunk: {}", chunk.substring(0, Math.min(50, chunk.length()))))
            .doOnComplete(() -> logger.info("Streaming generation completed"))
            .doOnError(error -> logger.error("Error in streaming generation: ", error));
    }
    
    private String buildPrompt(String transcript) {
        return String.format("""
            请分析以下会议记录并生成结构化摘要。请严格按照以下JSON格式返回结果：
            
            {
              "overview": "会议的简短概述（1-2句话）",
              "keyDecisions": ["关键决定1", "关键决定2", "..."],
              "actionItems": [
                {"task": "任务描述", "assignee": "负责人"},
                {"task": "任务描述", "assignee": "负责人"}
              ]
            }
            
            会议记录：
            %s
            
            请确保：
            1. 概述简洁明了
            2. 关键决定明确具体
            3. 行动项目包含具体任务和负责人
            4. 响应必须是有效的JSON格式
            """, transcript);
    }
    
    private MeetingSummary.ParsedSummary parseSummaryResponse(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            String content = root.path("candidates")
                .path(0)
                .path("content")
                .path("parts")
                .path(0)
                .path("text")
                .asText();
            
            logger.debug("Extracting JSON from content: {}", content.substring(0, Math.min(200, content.length())));
            
            // Extract JSON from the content
            int jsonStart = content.indexOf("{");
            int jsonEnd = content.lastIndexOf("}") + 1;
            
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                String jsonContent = content.substring(jsonStart, jsonEnd);
                logger.debug("Extracted JSON: {}", jsonContent);
                JsonNode summaryJson = objectMapper.readTree(jsonContent);
                
                String overview = summaryJson.path("overview").asText();
                if (overview.isEmpty()) {
                    throw new RuntimeException("摘要概述为空");
                }
                
                List<String> keyDecisions = new ArrayList<>();
                summaryJson.path("keyDecisions").forEach(node -> 
                    keyDecisions.add(node.asText()));
                
                List<MeetingSummary.ActionItem> actionItems = new ArrayList<>();
                summaryJson.path("actionItems").forEach(node -> {
                    String task = node.path("task").asText();
                    String assignee = node.path("assignee").asText();
                    if (!task.isEmpty()) {
                        actionItems.add(new MeetingSummary.ActionItem(task, assignee));
                    }
                });
                
                return new MeetingSummary.ParsedSummary(overview, keyDecisions, actionItems);
            }
            
            throw new RuntimeException("无法从AI响应中提取JSON内容");
            
        } catch (Exception e) {
            logger.error("Failed to parse AI response: {}", response, e);
            throw new RuntimeException("解析AI响应失败: " + e.getMessage(), e);
        }
    }
    
    private String extractTextFromStreamResponse(String chunk) {
        try {
            if (chunk.trim().isEmpty()) {
                return "";
            }
            
            JsonNode root = objectMapper.readTree(chunk);
            return root.path("candidates")
                .path(0)
                .path("content")
                .path("parts")
                .path(0)
                .path("text")
                .asText();
        } catch (Exception e) {
            logger.warn("Failed to parse streaming chunk: {}", chunk, e);
            return "";
        }
    }
}