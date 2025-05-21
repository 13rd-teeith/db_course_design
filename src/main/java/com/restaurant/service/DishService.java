package com.restaurant.service;

import com.restaurant.entity.Dish;
import java.util.List;

public interface DishService {
    List<Dish> getDishesByRestaurantId(Long restaurantId);
    Dish getDishById(Long id);
    Dish createDish(Dish dish);
    Dish updateDish(Dish dish);
    void deleteDish(Long id);
    List<Dish> searchDishes(String keyword, String category, Double minPrice, Double maxPrice);
    void updateDishStatus(Long id, String status);
    List<Dish> getDishesByCategory(Long restaurantId, String category);
} 