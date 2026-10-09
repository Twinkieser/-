package com.clientdesk.repository;

import com.clientdesk.model.Role;
import com.clientdesk.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByLogin(String login);
    boolean existsByLogin(String login);
    List<User> findByRole(Role role);
    List<User> findByRoleAndActiveTrue(Role role);
}
