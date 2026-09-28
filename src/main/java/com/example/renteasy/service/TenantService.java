package com.example.renteasy.service;

import com.example.renteasy.entity.Room;
import com.example.renteasy.entity.Tenant;
import com.example.renteasy.exception.BusinessException;
import com.example.renteasy.exception.ResourceNotFoundException;
import com.example.renteasy.repository.RentPaymentRepository;
import com.example.renteasy.repository.RoomRepository;
import com.example.renteasy.repository.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class TenantService {

    private final TenantRepository tenantRepository;
    private final RentPaymentRepository rentPaymentRepository;
    private final RoomRepository roomRepository;

    public TenantService(
            TenantRepository tenantRepository,
            RentPaymentRepository rentPaymentRepository,
            RoomRepository roomRepository) {

        this.tenantRepository = tenantRepository;
        this.rentPaymentRepository = rentPaymentRepository;
        this.roomRepository = roomRepository;
    }


    // =========================================================
    // CREATE TENANT
    // =========================================================

    public Tenant createTenant(Tenant tenant) {

        if (tenant.getName() == null ||
                tenant.getName().trim().isEmpty()) {

            throw new BusinessException(
                    "Tenant name is required"
            );
        }

        if (tenant.getPhone() == null ||
                !tenant.getPhone().matches("\\d{10}")) {

            throw new BusinessException(
                    "Phone number must contain exactly 10 digits"
            );
        }

        if (tenant.getMoveInDate() == null) {

            throw new BusinessException(
                    "Move-in date is required"
            );
        }

        if (tenant.getMoveInDate().isAfter(LocalDate.now())) {

            throw new BusinessException(
                    "Move-in date cannot be in the future"
            );
        }

        return tenantRepository.save(tenant);
    }


    // =========================================================
    // GET ALL TENANTS
    // =========================================================

    public List<Tenant> getAllTenants() {

        return tenantRepository.findAll();
    }


    // =========================================================
    // GET TENANT
    // =========================================================

    public Tenant getTenant(Long id) {

        return tenantRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Tenant not found with id: " + id
                        )
                );
    }


    // =========================================================
    // UPDATE TENANT
    // =========================================================

    public Tenant updateTenant(
            Long id,
            Tenant updatedTenant) {

        Tenant existingTenant =
                getTenant(id);

        if (updatedTenant.getName() == null ||
                updatedTenant.getName().trim().isEmpty()) {

            throw new BusinessException(
                    "Tenant name is required"
            );
        }

        if (updatedTenant.getPhone() == null ||
                !updatedTenant.getPhone().matches("\\d{10}")) {

            throw new BusinessException(
                    "Phone number must contain exactly 10 digits"
            );
        }

        if (updatedTenant.getMoveInDate() != null &&
                updatedTenant.getMoveInDate()
                        .isAfter(LocalDate.now())) {

            throw new BusinessException(
                    "Move-in date cannot be in the future"
            );
        }

        existingTenant.setName(
                updatedTenant.getName()
        );

        existingTenant.setPhone(
                updatedTenant.getPhone()
        );

        existingTenant.setEmail(
                updatedTenant.getEmail()
        );

        if (updatedTenant.getMoveInDate() != null) {

            existingTenant.setMoveInDate(
                    updatedTenant.getMoveInDate()
            );
        }

        return tenantRepository.save(existingTenant);
    }


    // =========================================================
    // DELETE TENANT
    // =========================================================

    @Transactional
    public void deleteTenant(Long id) {

        Tenant tenant =
                tenantRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Tenant not found with id: " + id
                                )
                        );


        // -----------------------------------------------------
        // STEP 1
        // Vacate tenant if assigned to a room
        // -----------------------------------------------------

        Room assignedRoom =
                tenant.getAssignedRoom();

        if (assignedRoom != null) {

            assignedRoom.setTenant(null);

            roomRepository.save(assignedRoom);

            tenant.setAssignedRoom(null);

            tenantRepository.save(tenant);
        }


        // -----------------------------------------------------
        // STEP 2
        // Find all payment records of this tenant
        // -----------------------------------------------------

        var payments =
                rentPaymentRepository.findByTenantId(id);


        // -----------------------------------------------------
        // STEP 3
        // Delete payment records
        // -----------------------------------------------------

        if (!payments.isEmpty()) {

            rentPaymentRepository.deleteAll(payments);
        }


        // -----------------------------------------------------
        // STEP 4
        // Delete tenant
        // -----------------------------------------------------

        tenantRepository.delete(tenant);
    }
}