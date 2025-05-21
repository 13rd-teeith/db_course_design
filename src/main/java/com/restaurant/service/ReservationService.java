package com.restaurant.service;

import com.restaurant.entity.Reservation;
import java.util.List;

public interface ReservationService {
    Reservation createReservation(Reservation reservation);
    Reservation getReservationById(Long id);
    List<Reservation> getReservationsByRestaurantId(Long restaurantId, String date);
    List<Reservation> getReservationsByUserId(Long userId);
    void updateReservationStatus(Long id, String status);
    void confirmArrival(Long id);
    void completeOrder(Long id);
} 