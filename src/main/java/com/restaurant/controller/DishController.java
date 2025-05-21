package com.restaurant.controller;

import com.restaurant.dto.Result;
import com.restaurant.entity.Dish;
import com.restaurant.service.DishService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dishes")
public class DishController {
    
    @Autowired
    private DishService dishService;
    
    @GetMapping("/restaurant/{restaurantId}")
    public Result<List<Dish>> getDishesByRestaurant(@PathVariable Long restaurantId) {
        System.out.println("获取餐厅菜品请求参数 - 餐厅ID: " + restaurantId);
        List<Dish> dishes = dishService.getDishesByRestaurantId(restaurantId);
        System.out.println("获取餐厅菜品响应数据数量: " + dishes.size());
        return Result.success(dishes);
    }
    
    @GetMapping("/{id}")
    public Result<Dish> getDish(@PathVariable Long id) {
        System.out.println("获取菜品详情请求参数 - 菜品ID: " + id);
        Dish dish = dishService.getDishById(id);
        System.out.println("获取菜品详情响应数据: " + dish);
        return Result.success(dish);
    }
    
    @PostMapping
    public Result<Dish> createDish(@RequestBody Dish dish) {
        System.out.println("创建菜品请求数据: " + dish);
        Dish createdDish = dishService.createDish(dish);
        System.out.println("创建菜品响应数据: " + createdDish);
        return Result.success(createdDish);
    }
    
    @PutMapping("/{id}")
    public Result<Dish> updateDish(@PathVariable Long id, @RequestBody Dish dish) {
        System.out.println("更新菜品请求参数 - 菜品ID: " + id + ", 菜品数据: " + dish);
        dish.setId(id);
        Dish updatedDish = dishService.updateDish(dish);
        System.out.println("更新菜品响应数据: " + updatedDish);
        return Result.success(updatedDish);
    }
    
    @DeleteMapping("/{id}")
    public Result<Void> deleteDish(@PathVariable Long id) {
        System.out.println("删除菜品请求参数 - 菜品ID: " + id);
        dishService.deleteDish(id);
        System.out.println("删除菜品成功");
        return Result.success(null);
    }
    
    @GetMapping("/search")
    public Result<List<Dish>> searchDishes(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice) {
        System.out.println("搜索菜品请求参数 - 关键词: " + keyword + ", 分类: " + category + 
                          ", 最低价格: " + minPrice + ", 最高价格: " + maxPrice);
        List<Dish> dishes = dishService.searchDishes(keyword, category, minPrice, maxPrice);
        System.out.println("搜索菜品响应数据数量: " + dishes.size());
        return Result.success(dishes);
    }
    
    @PutMapping("/{id}/status")
    public Result<Void> updateDishStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        System.out.println("更新菜品状态请求参数 - 菜品ID: " + id + ", 状态: " + status);
        dishService.updateDishStatus(id, status);
        System.out.println("更新菜品状态成功");
        return Result.success(null);
    }
    
    @GetMapping("/restaurant/{restaurantId}/category/{category}")
    public Result<List<Dish>> getDishesByCategory(
            @PathVariable Long restaurantId,
            @PathVariable String category) {
        System.out.println("获取餐厅分类菜品请求参数 - 餐厅ID: " + restaurantId + ", 分类: " + category);
        List<Dish> dishes = dishService.getDishesByCategory(restaurantId, category);
        System.out.println("获取餐厅分类菜品响应数据数量: " + dishes.size());
        return Result.success(dishes);
    }
} 