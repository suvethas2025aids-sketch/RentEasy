package com.example.renteasy.controller;

import com.example.renteasy.dto.TenantResponse;
import com.example.renteasy.entity.Room;
import com.example.renteasy.entity.Tenant;
import com.example.renteasy.service.TenantService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tenants")
public class TenantController {

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Tenant createTenant(
            @RequestBody Tenant tenant) {

        return tenantService.createTenant(tenant);
    }

    @GetMapping
    public List<TenantResponse> getAllTenants() {

        return tenantService.getAllTenants()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public TenantResponse getTenant(
            @PathVariable Long id) {

        return toResponse(
                tenantService.getTenant(id)
        );
    }

    @PutMapping("/{id}")
    public TenantResponse updateTenant(
            @PathVariable Long id,
            @RequestBody Tenant tenant) {

        return toResponse(
                tenantService.updateTenant(id, tenant)
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTenant(
            @PathVariable Long id) {

        tenantService.deleteTenant(id);
    }

    private TenantResponse toResponse(Tenant tenant) {

        Room room = tenant.getAssignedRoom();

        if (room == null) {

            return new TenantResponse(
                    tenant.getId(),
                    tenant.getName(),
                    tenant.getPhone(),
                    tenant.getEmail(),
                    tenant.getMoveInDate(),
                    null,
                    null,
                    null
            );
        }

        return new TenantResponse(
                tenant.getId(),
                tenant.getName(),
                tenant.getPhone(),
                tenant.getEmail(),
                tenant.getMoveInDate(),
                room.getId(),
                room.getRoomNumber(),
                room.getMonthlyRent().toString()
        );
    }
}