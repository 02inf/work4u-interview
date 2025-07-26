package com.work4u.meetingsummary.repository;

import com.work4u.meetingsummary.model.MeetingSummary;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MeetingSummaryRepository extends MongoRepository<MeetingSummary, String> {
    Optional<MeetingSummary> findByPublicId(String publicId);
}