package com.foundryai.backend.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ArchitectureQueryRepository 
    extends JpaRepository<ArchitectureQuery, Long> {
    
    List<ArchitectureQuery> findByAppTypeOrderByCreatedAtDesc(String appType);
    List<ArchitectureQuery> findTop10ByOrderByCreatedAtDesc();
}