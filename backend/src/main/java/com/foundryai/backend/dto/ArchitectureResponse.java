package com.foundryai.backend.dto;

import java.util.List;
import java.util.Map;

public class ArchitectureResponse {

    private boolean success;
    private String query;
    private Integer predictedId;
    private Double confidence;
    private ArchitectureDetail architecture;

    public static class ArchitectureDetail {
        private Integer id;
        private String name;
        private String level;
        private String pattern;
        private String appType;
        private Object modules;
        private String frontend;
        private String backend;
        private String database;
        private String mlNeeded;
        private String protocols;
        private String whyFrontend;
        private String whyBackend;
        private String whyDatabase;
        private String whyPattern;
        private String security;
        private String rbiRules;
        private String skills;
        private String howItWorks;
        private Object flowSteps;
        private String realWorld;
        private String complexity;

        // Getters and Setters
        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }

        public String getPattern() { return pattern; }
        public void setPattern(String pattern) { this.pattern = pattern; }

        public String getAppType() { return appType; }
        public void setAppType(String appType) { this.appType = appType; }

        public Object getModules() { return modules; }
        public void setModules(Object modules) { this.modules = modules; }

        public String getFrontend() { return frontend; }
        public void setFrontend(String frontend) { this.frontend = frontend; }

        public String getBackend() { return backend; }
        public void setBackend(String backend) { this.backend = backend; }

        public String getDatabase() { return database; }
        public void setDatabase(String database) { this.database = database; }

        public String getMlNeeded() { return mlNeeded; }
        public void setMlNeeded(String mlNeeded) { this.mlNeeded = mlNeeded; }

        public String getProtocols() { return protocols; }
        public void setProtocols(String protocols) { this.protocols = protocols; }

        public String getWhyFrontend() { return whyFrontend; }
        public void setWhyFrontend(String whyFrontend) { this.whyFrontend = whyFrontend; }

        public String getWhyBackend() { return whyBackend; }
        public void setWhyBackend(String whyBackend) { this.whyBackend = whyBackend; }

        public String getWhyDatabase() { return whyDatabase; }
        public void setWhyDatabase(String whyDatabase) { this.whyDatabase = whyDatabase; }

        public String getWhyPattern() { return whyPattern; }
        public void setWhyPattern(String whyPattern) { this.whyPattern = whyPattern; }

        public String getSecurity() { return security; }
        public void setSecurity(String security) { this.security = security; }

        public String getRbiRules() { return rbiRules; }
        public void setRbiRules(String rbiRules) { this.rbiRules = rbiRules; }

        public String getSkills() { return skills; }
        public void setSkills(String skills) { this.skills = skills; }

        public String getHowItWorks() { return howItWorks; }
        public void setHowItWorks(String howItWorks) { this.howItWorks = howItWorks; }

        public Object getFlowSteps() { return flowSteps; }
        public void setFlowSteps(Object flowSteps) { this.flowSteps = flowSteps; }

        public String getRealWorld() { return realWorld; }
        public void setRealWorld(String realWorld) { this.realWorld = realWorld; }

        public String getComplexity() { return complexity; }
        public void setComplexity(String complexity) { this.complexity = complexity; }
    }

    // Main class Getters and Setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }

    public Integer getPredictedId() { return predictedId; }
    public void setPredictedId(Integer predictedId) { this.predictedId = predictedId; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public ArchitectureDetail getArchitecture() { return architecture; }
    public void setArchitecture(ArchitectureDetail architecture) { 
        this.architecture = architecture; 
    }
}