package com.foundryai.backend.service;

import com.foundryai.backend.dto.ArchitectureResponse;
import com.foundryai.backend.model.ArchitectureQuery;
import com.foundryai.backend.model.ArchitectureQueryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;

@Service
public class ArchitectureService {

    @Value("${ml.api.url}")
    private String mlApiUrl;

    @Autowired
    private ArchitectureQueryRepository repository;

    @Autowired
    private RestTemplate restTemplate;

    // ── Predict from text query ────────────────────────────
    public Map<String, Object> predictFromText(String query) {
        try {
            // Call FastAPI ML server
            String url = mlApiUrl + "/predict";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = new HashMap<>();
            body.put("query", query);

            HttpEntity<Map<String, String>> request = 
                new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.POST, request, Map.class
            );

            Map<String, Object> result = response.getBody();

            // Save query to MySQL
            if (result != null && (Boolean) result.get("success")) {
                saveQuery(query, result);
            }

            return result;

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "ML API unavailable: " + e.getMessage());
            return error;
        }
    }

    // ── Get architecture by ID directly ───────────────────
    public Map<String, Object> getById(Integer id) {
        try {
            String url = mlApiUrl + "/architecture/" + id;
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getBody();
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Architecture not found: " + e.getMessage());
            return error;
        }
    }

    // ── Get top 3 predictions ─────────────────────────────
    public Map<String, Object> getTopMatches(String query) {
        try {
            String url = mlApiUrl + "/predict/multiple";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = new HashMap<>();
            body.put("query", query);

            HttpEntity<Map<String, String>> request = 
                new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.POST, request, Map.class
            );

            return response.getBody();

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return error;
        }
    }

    // ── Combine multiple modules ───────────────────────────
    public Map<String, Object> combineModules(List<Integer> moduleIds) {
        try {
            String url = mlApiUrl + "/combine";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("module_ids", moduleIds);

            HttpEntity<Map<String, Object>> request = 
                new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.POST, request, Map.class
            );

            return response.getBody();

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return error;
        }
    }

    // ── Get all 32 architectures ───────────────────────────
    public Map<String, Object> getAll() {
        try {
            String url = mlApiUrl + "/all";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getBody();
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return error;
        }
    }

    // ── Get recent queries from MySQL ──────────────────────
    public List<ArchitectureQuery> getRecentQueries() {
        return repository.findTop10ByOrderByCreatedAtDesc();
    }

    // ── Save query to MySQL ────────────────────────────────
    private void saveQuery(String query, Map<String, Object> result) {
        try {
            ArchitectureQuery aq = new ArchitectureQuery();
            aq.setUserQuery(query);

            Integer predId = (Integer) result.get("predicted_id");
            aq.setPredictedArchitectureId(predId);

            Map<String, Object> arch = 
                (Map<String, Object>) result.get("architecture");
            if (arch != null) {
                aq.setPredictedArchitectureName(
                    (String) arch.get("name"));
                aq.setLevel((String) arch.get("level"));
                aq.setAppType((String) arch.get("app_type"));
            }

            Double confidence = null;
            Object confObj = result.get("confidence");
            if (confObj instanceof Double) {
                confidence = (Double) confObj;
            } else if (confObj instanceof Integer) {
                confidence = ((Integer) confObj).doubleValue();
            }
            aq.setConfidence(confidence);

            repository.save(aq);
        } catch (Exception e) {
            System.out.println("Could not save query: " + e.getMessage());
        }
    }
}