package com.example.renteasy.dto;

import com.example.renteasy.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PaymentResponse {

    private Long id;

    private Long tenantId;
    private String tenantName;

    private Long roomId;
    private String roomNumber;

    private LocalDate paymentMonth;
    private BigDecimal amount;
    private PaymentStatus status;
    private LocalDate paidDate;

    public PaymentResponse() {
    }

    public PaymentResponse(Long id,
                           Long tenantId,
                           String tenantName,
                           Long roomId,
                           String roomNumber,
                           LocalDate paymentMonth,
                           BigDecimal amount,
                           PaymentStatus status,
                           LocalDate paidDate) {

        this.id = id;
        this.tenantId = tenantId;
        this.tenantName = tenantName;
        this.roomId = roomId;
        this.roomNumber = roomNumber;
        this.paymentMonth = paymentMonth;
        this.amount = amount;
        this.status = status;
        this.paidDate = paidDate;
    }

    public Long getId() {
        return id;
    }

    public Long getTenantId() {
        return tenantId;
    }

    public String getTenantName() {
        return tenantName;
    }

    public Long getRoomId() {
        return roomId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public LocalDate getPaymentMonth() {
        return paymentMonth;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public LocalDate getPaidDate() {
        return paidDate;
    }
}