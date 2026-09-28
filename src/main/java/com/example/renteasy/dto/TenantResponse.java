package com.example.renteasy.dto;

import java.time.LocalDate;

public class TenantResponse {

    private Long id;
    private String name;
    private String phone;
    private String email;
    private LocalDate moveInDate;

    private Long roomId;
    private String roomNumber;
    private String monthlyRent;

    public TenantResponse() {
    }

    public TenantResponse(Long id,
                          String name,
                          String phone,
                          String email,
                          LocalDate moveInDate,
                          Long roomId,
                          String roomNumber,
                          String monthlyRent) {

        this.id = id;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.moveInDate = moveInDate;
        this.roomId = roomId;
        this.roomNumber = roomNumber;
        this.monthlyRent = monthlyRent;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public LocalDate getMoveInDate() {
        return moveInDate;
    }

    public Long getRoomId() {
        return roomId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public String getMonthlyRent() {
        return monthlyRent;
    }
}