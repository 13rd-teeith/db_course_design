package com.restaurant.service;

import com.restaurant.entity.Restaurant;
import java.util.List;

public interface RestaurantService {
    Restaurant login(String restaurantId, String password, String role);
    Restaurant register(Restaurant restaurant);
    Restaurant getRestaurantById(Long id);
    List<Restaurant> searchRestaurants(String keyword, String cuisine, Double minRating);
    void updateRestaurant(Restaurant restaurant);
} 