package com.restaurant.entity;

import lombok.Data;

@Data
public class Dish {
    private Long id;
    private Long restaurantId;
    private String name;
    private Double price;
    private String category;
    private String description;
    private String imageUrl;
    private String status; // available, unavailable
    private String createTime;
    private String updateTime;
} 