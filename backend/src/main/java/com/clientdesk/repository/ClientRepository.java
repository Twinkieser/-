package com.clientdesk.repository;

import com.clientdesk.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    List<Client> findAllByOrderByNameAsc();

    @Query("SELECT c FROM Client c WHERE " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(c.contactPerson, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(c.phone, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(c.email, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY c.name ASC")
    List<Client> searchClients(@Param("query") String query);
}
