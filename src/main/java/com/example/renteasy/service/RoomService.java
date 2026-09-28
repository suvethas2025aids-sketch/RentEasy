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

import java.math.BigDecimal;
import java.util.List;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final TenantRepository tenantRepository;
    private final RentPaymentRepository rentPaymentRepository;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public RoomService(
            RoomRepository roomRepository,
            TenantRepository tenantRepository,
            RentPaymentRepository rentPaymentRepository) {

        this.roomRepository = roomRepository;
        this.tenantRepository = tenantRepository;
        this.rentPaymentRepository = rentPaymentRepository;
    }


    // =========================================================
    // CREATE ROOM
    // =========================================================

    public Room createRoom(Room room) {

        // Room number validation
        if (room.getRoomNumber() == null ||
                room.getRoomNumber().trim().isEmpty()) {

            throw new BusinessException(
                    "Room number is required"
            );
        }


        // Monthly rent validation
        if (room.getMonthlyRent() == null ||
                room.getMonthlyRent()
                        .compareTo(BigDecimal.ZERO) <= 0) {

            throw new BusinessException(
                    "Monthly rent must be greater than zero"
            );
        }


        // Duplicate room number check
        if (roomRepository
                .findByRoomNumber(room.getRoomNumber())
                .isPresent()) {

            throw new BusinessException(
                    "Room number already exists"
            );
        }


        // New room should not have tenant
        room.setTenant(null);

        return roomRepository.save(room);
    }


    // =========================================================
    // GET ALL ROOMS
    // =========================================================

    public List<Room> getAllRooms() {

        return roomRepository.findAll();
    }


    // =========================================================
    // GET AVAILABLE ROOMS
    // =========================================================

    public List<Room> getAvailableRooms() {

        return roomRepository.findByTenantIsNull();
    }


    // =========================================================
    // GET ROOM BY ID
    // =========================================================

    public Room getRoom(Long id) {

        return roomRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Room not found with id: " + id
                        )
                );
    }


    // =========================================================
    // UPDATE ROOM
    // =========================================================

    public Room updateRoom(
            Long id,
            Room updatedRoom) {

        Room existingRoom =
                getRoom(id);


        // Room number validation
        if (updatedRoom.getRoomNumber() == null ||
                updatedRoom.getRoomNumber()
                        .trim().isEmpty()) {

            throw new BusinessException(
                    "Room number is required"
            );
        }


        // Monthly rent validation
        if (updatedRoom.getMonthlyRent() == null ||
                updatedRoom.getMonthlyRent()
                        .compareTo(BigDecimal.ZERO) <= 0) {

            throw new BusinessException(
                    "Monthly rent must be greater than zero"
            );
        }


        // Check duplicate room number
        Room sameRoom =
                roomRepository
                        .findByRoomNumber(
                                updatedRoom.getRoomNumber()
                        )
                        .orElse(null);

        if (sameRoom != null &&
                !sameRoom.getId().equals(id)) {

            throw new BusinessException(
                    "Room number already exists"
            );
        }


        existingRoom.setRoomNumber(
                updatedRoom.getRoomNumber()
        );

        existingRoom.setMonthlyRent(
                updatedRoom.getMonthlyRent()
        );


        return roomRepository.save(
                existingRoom
        );
    }


    // =========================================================
    // ASSIGN TENANT TO ROOM
    // =========================================================

    @Transactional
    public Room assignTenant(
            Long roomId,
            Long tenantId) {

        // Find room
        Room room =
                roomRepository.findById(roomId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Room not found with id: "
                                                + roomId
                                )
                        );


        // Find tenant
        Tenant tenant =
                tenantRepository.findById(tenantId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Tenant not found with id: "
                                                + tenantId
                                )
                        );


        // Check room already occupied
        if (room.getTenant() != null) {

            throw new BusinessException(
                    "Room is already occupied"
            );
        }


        // Check tenant already assigned
        if (tenant.getAssignedRoom() != null) {

            throw new BusinessException(
                    "Tenant is already assigned to another room"
            );
        }


        // Assign tenant
        room.setTenant(tenant);

        tenant.setAssignedRoom(room);


        // Save both sides
        tenantRepository.save(tenant);

        roomRepository.save(room);


        return room;
    }


    // =========================================================
    // VACATE ROOM
    // =========================================================

    @Transactional
    public Room vacateRoom(Long roomId) {

        // Find room
        Room room =
                roomRepository.findById(roomId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Room not found with id: "
                                                + roomId
                                )
                        );


        // Check room already vacant
        if (room.getTenant() == null) {

            throw new BusinessException(
                    "Room is already vacant"
            );
        }


        // Get tenant
        Tenant tenant =
                room.getTenant();


        // Remove relationship
        room.setTenant(null);

        tenant.setAssignedRoom(null);


        // Save both sides
        tenantRepository.save(tenant);

        roomRepository.save(room);


        return room;
    }


    // =========================================================
    // DELETE ROOM
    // =========================================================

    @Transactional
    public void deleteRoom(Long id) {

        // Find room
        Room room =
                roomRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Room not found with id: "
                                                + id
                                )
                        );


        // -----------------------------------------------------
        // CHECK 1
        // Cannot delete occupied room
        // -----------------------------------------------------

        if (room.getTenant() != null) {

            throw new BusinessException(
                    "Occupied room cannot be deleted. Vacate the room first."
            );
        }


        // -----------------------------------------------------
        // CHECK 2
        // Cannot delete room with payment history
        // -----------------------------------------------------

        if (rentPaymentRepository
                .existsByRoomId(id)) {

            throw new BusinessException(
                    "Room cannot be deleted because payment history exists for this room."
            );
        }


        // -----------------------------------------------------
        // DELETE ROOM
        // -----------------------------------------------------

        roomRepository.delete(room);
    }
}