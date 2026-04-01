package com.foundryai.backend.controller;

import com.foundryai.backend.service.ArchitectureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/architecture")
@CrossOrigin(origins = "*")
public class ArchitectureController {

    @Autowired
    private ArchitectureService architectureService;

    // ── 1. Predict from text query ─────────────────────────
    @PostMapping("/predict")
    public ResponseEntity<Map<String, Object>> predict(
            @RequestBody Map<String, String> body) {
        String query = body.get("query");
        if (query == null || query.trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Query cannot be empty");
            return ResponseEntity.badRequest().body(error);
        }
        Map<String, Object> result = 
            architectureService.predictFromText(query);
        return ResponseEntity.ok(result);
    }

    // ── 2. Get top 3 matches ───────────────────────────────
    @PostMapping("/predict/multiple")
    public ResponseEntity<Map<String, Object>> predictMultiple(
            @RequestBody Map<String, String> body) {
        String query = body.get("query");
        Map<String, Object> result = 
            architectureService.getTopMatches(query);
        return ResponseEntity.ok(result);
    }

    // ── 3. Get by ID (from select list) ───────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(
            @PathVariable Integer id) {
        Map<String, Object> result = 
            architectureService.getById(id);
        return ResponseEntity.ok(result);
    }

    // ── 4. Combine multiple modules ────────────────────────
    @PostMapping("/combine")
    public ResponseEntity<Map<String, Object>> combine(
            @RequestBody Map<String, Object> body) {
        List<Integer> moduleIds = 
            (List<Integer>) body.get("module_ids");
        if (moduleIds == null || moduleIds.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "No module IDs provided");
            return ResponseEntity.badRequest().body(error);
        }
        Map<String, Object> result = 
            architectureService.combineModules(moduleIds);
        return ResponseEntity.ok(result);
    }

    // ── 5. Get all 32 architectures ────────────────────────
    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAll() {
        Map<String, Object> result = architectureService.getAll();
        return ResponseEntity.ok(result);
    }

    // ── 6. Get recent queries history ─────────────────────
    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getHistory() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("queries", 
            architectureService.getRecentQueries());
        return ResponseEntity.ok(response);
    }

    // ── 7. Health check ────────────────────────────────────
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "Spring Boot is running");
        response.put("port", 8080);
        response.put("mlApi", "http://localhost:8000");
        response.put("database", "foundryai");
        return ResponseEntity.ok(response);
    }
}