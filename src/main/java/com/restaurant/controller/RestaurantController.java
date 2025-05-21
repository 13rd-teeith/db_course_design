package com.restaurant.controller;

import com.restaurant.dto.Result;
import com.restaurant.entity.Restaurant;
import com.restaurant.entity.Dish;
import com.restaurant.entity.Table;
import com.restaurant.service.RestaurantService;
import com.restaurant.service.DishService;
import com.restaurant.service.TableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/restaurants")
public class RestaurantController {
    public static class RestaurantSearchRequest {
        private String keyword;
        private String cuisine;
        private Double rating;

        public String getKeyword() {
            return keyword;
        }

        public void setKeyword(String keyword) {
            this.keyword = keyword;
        }

        public String getCuisine() {
            return cuisine;
        }

        public void setCuisine(String cuisine) {
            this.cuisine = cuisine;
        }

        public Double getRating() {
            return rating;
        }

        public void setRating(Double rating) {
            this.rating = rating;
        }
    }
    @Autowired
    private RestaurantService restaurantService;
    
    @Autowired
    private DishService dishService;
    
    @Autowired
    private TableService tableService;

    @PostMapping("/search")
    public Result<List<Restaurant>> searchRestaurants(@RequestBody RestaurantSearchRequest request) {
        System.out.println("搜索餐厅请求参数 - 关键词: " + request.getKeyword() +
                ", 菜系: " + request.getCuisine() +
                ", 最低评分: " + request.getRating());

        List<Restaurant> restaurants = restaurantService.searchRestaurants(
                request.getKeyword(), request.getCuisine(), request.getRating());

        System.out.println("搜索餐厅响应数据数量: " + restaurants.size());
        return Result.success(restaurants);
    }

    @GetMapping("/{id}")
    public Result<Restaurant> getRestaurant(@PathVariable Long id) {
        System.out.println("获取餐厅详情请求参数 - 餐厅ID: " + id);
        Restaurant restaurant = restaurantService.getRestaurantById(id);
        System.out.println("获取餐厅详情响应数据: " + restaurant);
        return Result.success(restaurant);
    }
    
    @PutMapping("/{id}")
    public Result<Void> updateRestaurant(@PathVariable Long id, @RequestBody Restaurant restaurant) {
        System.out.println("更新餐厅信息请求参数 - 餐厅ID: " + id + ", 餐厅数据: " + restaurant);
        try {
            // 设置餐厅ID
            restaurant.setId(id);
            
            // 更新餐厅基本信息
            restaurantService.updateRestaurant(restaurant);
            
            // 更新菜品信息
            if (restaurant.getMenu() != null) {
                for (Dish dish : restaurant.getMenu()) {
                    dish.setRestaurantId(id);
                    if (dish.getId() == null) {
                        // 新增菜品
                        dishService.createDish(dish);
                    } else {
                        // 更新菜品
                        dishService.updateDish(dish);
                    }
                }
            }
            
            // 更新餐位信息
            if (restaurant.getTables() != null) {
                for (Table table : restaurant.getTables()) {
                    table.setRestaurantId(id);
                    if (table.getId() == null) {
                        // 新增餐位
                        tableService.createTable(table);
                    } else {
                        // 更新餐位
                        tableService.updateTable(table);
                    }
                }
            }
            
            System.out.println("更新餐厅信息成功");
            return Result.success(null);
        } catch (Exception e) {
            System.out.println("更新餐厅信息失败: " + e.getMessage());
            return Result.error("更新餐厅信息失败: " + e.getMessage());
        }
    }
} 