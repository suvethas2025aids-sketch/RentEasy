package com.example.renteasy.repository;

import com.example.renteasy.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository
        extends JpaRepository<Tenant, Long> {
}