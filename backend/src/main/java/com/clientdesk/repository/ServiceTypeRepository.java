package com.clientdesk.repository;

import com.clientdesk.model.ServiceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceTypeRepository extends JpaRepository<ServiceType, Long> {
    List<ServiceType> findByActiveTrueOrderByNameAsc();
    List<ServiceType> findAllByOrderByNameAsc();
    Optional<ServiceType> findByNameIgnoreCase(String name);
}
