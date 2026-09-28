package com.example.renteasy.service;

import com.example.renteasy.entity.PaymentStatus;
import com.example.renteasy.entity.RentPayment;
import com.example.renteasy.entity.Room;
import com.example.renteasy.entity.Tenant;
import com.example.renteasy.exception.BusinessException;
import com.example.renteasy.exception.ResourceNotFoundException;
import com.example.renteasy.repository.RentPaymentRepository;
import com.example.renteasy.repository.TenantRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RentPaymentService {

    private final RentPaymentRepository paymentRepository;
    private final TenantRepository tenantRepository;

    public RentPaymentService(
            RentPaymentRepository paymentRepository,
            TenantRepository tenantRepository) {

        this.paymentRepository = paymentRepository;
        this.tenantRepository = tenantRepository;
    }

    // =========================================================
    // MAKE PAYMENT - PARTIAL PAYMENT SUPPORTED
    // =========================================================

    public RentPayment makePayment(Long tenantId, RentPayment payment) {

        Tenant tenant =
                tenantRepository.findById(tenantId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Tenant not found with id: " + tenantId));

        if (tenant.getAssignedRoom() == null) {
            throw new BusinessException(
                    "Tenant is not assigned to any room");
        }

        if (payment.getPaymentMonth() == null) {
            throw new BusinessException(
                    "Payment month is required");
        }

        if (payment.getAmount() == null ||
                payment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {

            throw new BusinessException(
                    "Payment amount must be greater than zero");
        }

        LocalDate paymentMonth =
                payment.getPaymentMonth().withDayOfMonth(1);

        LocalDate currentMonth =
                LocalDate.now().withDayOfMonth(1);

        if (paymentMonth.isAfter(currentMonth)) {
            throw new BusinessException(
                    "Cannot make payment for a future month");
        }

        if (tenant.getMoveInDate() == null) {
            throw new BusinessException(
                    "Tenant move-in date is required");
        }

        LocalDate moveInMonth =
                tenant.getMoveInDate().withDayOfMonth(1);

        if (paymentMonth.isBefore(moveInMonth)) {
            throw new BusinessException(
                    "Cannot make payment before move-in date");
        }

        Room room = tenant.getAssignedRoom();

        BigDecimal monthlyRent = room.getMonthlyRent();

        if (monthlyRent == null ||
                monthlyRent.compareTo(BigDecimal.ZERO) <= 0) {

            throw new BusinessException(
                    "Monthly rent is not configured for this room");
        }

        // Get all payments already made for this month
        List<RentPayment> existingPayments =
                paymentRepository.findByTenantIdAndPaymentMonth(
                        tenantId,
                        paymentMonth
                );

        BigDecimal alreadyPaid = BigDecimal.ZERO;

        for (RentPayment existingPayment : existingPayments) {

            if (existingPayment.getAmount() != null) {
                alreadyPaid =
                        alreadyPaid.add(existingPayment.getAmount());
            }
        }

        // Remaining amount
        BigDecimal remaining =
                monthlyRent.subtract(alreadyPaid);

        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(
                    "Rent for this month is already fully paid");
        }

        // Cannot pay more than remaining amount
        if (payment.getAmount().compareTo(remaining) > 0) {

            throw new BusinessException(
                    "Payment exceeds remaining rent amount. Remaining amount is ₹"
                            + remaining);
        }

        payment.setTenant(tenant);
        payment.setRoom(room);
        payment.setPaymentMonth(paymentMonth);

        // Each successful transaction is recorded as PAID.
        // Monthly balance is calculated from total payments.
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidDate(LocalDate.now());

        return paymentRepository.save(payment);
    }

    // =========================================================
    // GET ALL PAYMENTS
    // =========================================================

    public List<RentPayment> getAllPayments() {
        return paymentRepository.findAll();
    }

    // =========================================================
    // GET TENANT PAYMENTS
    // =========================================================

    public List<RentPayment> getTenantPayments(Long tenantId) {

        tenantRepository.findById(tenantId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Tenant not found with id: " + tenantId));

        return paymentRepository.findByTenantId(tenantId);
    }

    // =========================================================
    // CALCULATE TOTAL PENDING MONTHS
    // =========================================================

    public long calculatePendingDues(Long tenantId) {

        Tenant tenant =
                tenantRepository.findById(tenantId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Tenant not found with id: " + tenantId));

        if (tenant.getMoveInDate() == null ||
                tenant.getAssignedRoom() == null) {

            return 0;
        }

        Room room = tenant.getAssignedRoom();

        BigDecimal monthlyRent = room.getMonthlyRent();

        if (monthlyRent == null ||
                monthlyRent.compareTo(BigDecimal.ZERO) <= 0) {

            return 0;
        }

        YearMonth moveInMonth =
                YearMonth.from(tenant.getMoveInDate());

        YearMonth currentMonth =
                YearMonth.now();

        long pendingMonths = 0;

        YearMonth month = moveInMonth;

        while (!month.isAfter(currentMonth)) {

            LocalDate paymentMonth =
                    month.atDay(1);

            List<RentPayment> payments =
                    paymentRepository
                            .findByTenantIdAndPaymentMonth(
                                    tenantId,
                                    paymentMonth
                            );

            BigDecimal totalPaid = BigDecimal.ZERO;

            for (RentPayment payment : payments) {

                if (payment.getAmount() != null) {
                    totalPaid =
                            totalPaid.add(payment.getAmount());
                }
            }

            if (totalPaid.compareTo(monthlyRent) < 0) {
                pendingMonths++;
            }

            month = month.plusMonths(1);
        }

        return pendingMonths;
    }

    // =========================================================
    // CURRENT MONTH PENDING TENANTS
    // =========================================================

    public List<Tenant> getCurrentMonthPendingTenants() {

        List<Tenant> tenants =
                tenantRepository.findAll();

        LocalDate currentMonth =
                LocalDate.now().withDayOfMonth(1);

        List<Tenant> pendingTenants =
                new ArrayList<>();

        for (Tenant tenant : tenants) {

            if (tenant.getAssignedRoom() == null) {
                continue;
            }

            if (tenant.getMoveInDate() == null ||
                    tenant.getMoveInDate().isAfter(LocalDate.now())) {
                continue;
            }

            Room room = tenant.getAssignedRoom();

            BigDecimal monthlyRent =
                    room.getMonthlyRent();

            if (monthlyRent == null) {
                continue;
            }

            List<RentPayment> payments =
                    paymentRepository
                            .findByTenantIdAndPaymentMonth(
                                    tenant.getId(),
                                    currentMonth
                            );

            BigDecimal totalPaid = BigDecimal.ZERO;

            for (RentPayment payment : payments) {

                if (payment.getAmount() != null) {
                    totalPaid =
                            totalPaid.add(payment.getAmount());
                }
            }

            // If total paid is less than monthly rent,
            // tenant is still pending.
            if (totalPaid.compareTo(monthlyRent) < 0) {
                pendingTenants.add(tenant);
            }
        }

        return pendingTenants;
    }

    // =========================================================
    // CURRENT MONTH PAYMENT SUMMARY
    // =========================================================

    public Map<String, Object> getCurrentMonthSummary(Long tenantId) {

        Tenant tenant =
                tenantRepository.findById(tenantId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Tenant not found with id: " + tenantId));

        if (tenant.getAssignedRoom() == null) {
            throw new BusinessException(
                    "Tenant is not assigned to any room");
        }

        Room room = tenant.getAssignedRoom();

        BigDecimal monthlyRent =
                room.getMonthlyRent();

        LocalDate currentMonth =
                LocalDate.now().withDayOfMonth(1);

        List<RentPayment> payments =
                paymentRepository
                        .findByTenantIdAndPaymentMonth(
                                tenantId,
                                currentMonth
                        );

        BigDecimal totalPaid = BigDecimal.ZERO;

        for (RentPayment payment : payments) {

            if (payment.getAmount() != null) {
                totalPaid =
                        totalPaid.add(payment.getAmount());
            }
        }

        BigDecimal balance =
                monthlyRent.subtract(totalPaid);

        if (balance.compareTo(BigDecimal.ZERO) < 0) {
            balance = BigDecimal.ZERO;
        }

        String status;

        if (balance.compareTo(BigDecimal.ZERO) == 0) {
            status = "PAID";
        } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
            status = "PARTIAL";
        } else {
            status = "PENDING";
        }

        Map<String, Object> result =
                new LinkedHashMap<>();

        result.put("tenantId", tenantId);
        result.put("month", currentMonth);
        result.put("monthlyRent", monthlyRent);
        result.put("totalPaid", totalPaid);
        result.put("balance", balance);
        result.put("status", status);

        return result;
    }
}