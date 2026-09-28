package com.example.renteasy.controller;

import com.example.renteasy.entity.Room;
import com.example.renteasy.service.RoomService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    // CREATE ROOM
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Room createRoom(@RequestBody Room room) {
        return roomService.createRoom(room);
    }

    // GET ALL ROOMS
    @GetMapping
    public List<Room> getAllRooms() {
        return roomService.getAllRooms();
    }

    // GET AVAILABLE ROOMS
    @GetMapping("/available")
    public List<Room> getAvailableRooms() {
        return roomService.getAvailableRooms();
    }

    // GET ROOM BY ID
    @GetMapping("/{id}")
    public Room getRoom(@PathVariable Long id) {
        return roomService.getRoom(id);
    }

    // UPDATE ROOM
    @PutMapping("/{id}")
    public Room updateRoom(
            @PathVariable Long id,
            @RequestBody Room room) {

        return roomService.updateRoom(id, room);
    }

    // ASSIGN TENANT
    @PutMapping("/{roomId}/assign/{tenantId}")
    public Room assignTenant(
            @PathVariable Long roomId,
            @PathVariable Long tenantId) {

        return roomService.assignTenant(
                roomId,
                tenantId
        );
    }

    // VACATE ROOM
    @PutMapping("/{roomId}/vacate")
    public Room vacateRoom(
            @PathVariable Long roomId) {

        return roomService.vacateRoom(roomId);
    }

    // DELETE ROOM
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRoom(
            @PathVariable Long id) {

        roomService.deleteRoom(id);
    }
}