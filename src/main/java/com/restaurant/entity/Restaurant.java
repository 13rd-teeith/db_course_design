package com.restaurant.entity;

import lombok.Data;
import java.util.List;

@Data
public class Restaurant {
    private Long id;
    private String name;
    private String address;
    private String phone;
    private String license;
    private String password;
    private String cuisine;
    private String businessHours;
    private Double rating;
    private String introduction;
    private String logo;
    private String panoramaUrl;
    private String createTime;
    private String updateTime;
    private String role;
    private String imageUrl;
    private String description;
    private List<String> tags;
    private String waitingTime;
    private String priceLevel;
    private List<Table> tables;
    private List<Dish> menu;
    private List<Review> reviews;
} 