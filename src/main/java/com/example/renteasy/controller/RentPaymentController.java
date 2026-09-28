package com.example.renteasy.controller;

import com.example.renteasy.entity.RentPayment;
import com.example.renteasy.entity.Tenant;
import com.example.renteasy.service.RentPaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class RentPaymentController {

    private final RentPaymentService paymentService;

    public RentPaymentController(
            RentPaymentService paymentService) {

        this.paymentService = paymentService;
    }

    // Make full or partial payment
    @PostMapping("/tenant/{tenantId}")
    @ResponseStatus(HttpStatus.CREATED)
    public RentPayment makePayment(
            @PathVariable Long tenantId,
            @RequestBody RentPayment payment) {

        return paymentService.makePayment(
                tenantId,
                payment
        );
    }

    // Get all payments
    @GetMapping
    public List<RentPayment> getAllPayments() {
        return paymentService.getAllPayments();
    }

    // Get tenant payment history
    @GetMapping("/tenant/{tenantId}")
    public List<RentPayment> getTenantPayments(
            @PathVariable Long tenantId) {

        return paymentService.getTenantPayments(
                tenantId
        );
    }

    // Get pending months
    @GetMapping("/tenant/{tenantId}/pending")
    public Map<String, Object> getPendingDues(
            @PathVariable Long tenantId) {

        long pending =
                paymentService.calculatePendingDues(
                        tenantId
                );

        return Map.of(
                "tenantId", tenantId,
                "pendingMonths", pending
        );
    }

    // Current month pending tenants
    @GetMapping("/pending/current-month")
    public List<Tenant> getCurrentMonthPendingTenants() {

        return paymentService
                .getCurrentMonthPendingTenants();
    }

    // Current month rent summary
    @GetMapping("/tenant/{tenantId}/current-month")
    public Map<String, Object> getCurrentMonthSummary(
            @PathVariable Long tenantId) {

        return paymentService
                .getCurrentMonthSummary(tenantId);
    }
}