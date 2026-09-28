package com.example.renteasy.repository;

import com.example.renteasy.entity.RentPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface RentPaymentRepository
        extends JpaRepository<RentPayment, Long> {

    List<RentPayment> findByTenantId(Long tenantId);

    List<RentPayment> findByTenantIdAndPaymentMonth(
            Long tenantId,
            LocalDate paymentMonth
    );

    boolean existsByRoomId(Long roomId);
}