package com.example.renteasy.dto;

import java.math.BigDecimal;

public class RoomResponse {

    private Long id;
    private String roomNumber;
    private BigDecimal monthlyRent;

    private boolean occupied;

    private Long tenantId;
    private String tenantName;
    private String tenantPhone;

    public RoomResponse() {
    }

    public RoomResponse(Long id,
                        String roomNumber,
                        BigDecimal monthlyRent,
                        boolean occupied,
                        Long tenantId,
                        String tenantName,
                        String tenantPhone) {

        this.id = id;
        this.roomNumber = roomNumber;
        this.monthlyRent = monthlyRent;
        this.occupied = occupied;
        this.tenantId = tenantId;
        this.tenantName = tenantName;
        this.tenantPhone = tenantPhone;
    }

    public Long getId() {
        return id;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public BigDecimal getMonthlyRent() {
        return monthlyRent;
    }

    public boolean isOccupied() {
        return occupied;
    }

    public Long getTenantId() {
        return tenantId;
    }

    public String getTenantName() {
        return tenantName;
    }

    public String getTenantPhone() {
        return tenantPhone;
    }
}