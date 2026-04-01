package com.foundryai.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "architecture_queries")
public class ArchitectureQuery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userQuery;

    @Column(nullable = false)
    private Integer predictedArchitectureId;

    @Column(nullable = false)
    private String predictedArchitectureName;

    @Column
    private Double confidence;

    @Column
    private String level;

    @Column
    private String appType;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUserQuery() { return userQuery; }
    public void setUserQuery(String userQuery) { this.userQuery = userQuery; }

    public Integer getPredictedArchitectureId() { return predictedArchitectureId; }
    public void setPredictedArchitectureId(Integer predictedArchitectureId) {
        this.predictedArchitectureId = predictedArchitectureId;
    }

    public String getPredictedArchitectureName() { return predictedArchitectureName; }
    public void setPredictedArchitectureName(String predictedArchitectureName) {
        this.predictedArchitectureName = predictedArchitectureName;
    }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public String getAppType() { return appType; }
    public void setAppType(String appType) { this.appType = appType; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}