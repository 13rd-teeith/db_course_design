package com.restaurant.controller;

import com.restaurant.dto.Result;
import com.restaurant.entity.Review;
import com.restaurant.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")
public class ReviewController {
    
    @Autowired
    private ReviewService reviewService;
    
    @PostMapping
    public Result<Review> createReview(@RequestBody Review review) {
        System.out.println("创建评价请求数据: " + review);
        Review createdReview = reviewService.createReview(review);
        System.out.println("创建评价响应数据: " + createdReview);
        return Result.success(createdReview);
    }
    
    @GetMapping("/{id}")
    public Result<Review> getReview(@PathVariable Long id) {
        System.out.println("获取评价详情请求参数 - 评价ID: " + id);
        Review review = reviewService.getReviewById(id);
        System.out.println("获取评价详情响应数据: " + review);
        return Result.success(review);
    }
    
    @GetMapping("/restaurant/{restaurantId}")
    public Result<List<Review>> getReviewsByRestaurant(
            @PathVariable Long restaurantId,
            @RequestParam(required = false) Integer rating) {
        System.out.println("获取餐厅评价请求参数 - 餐厅ID: " + restaurantId + ", 评分: " + rating);
        List<Review> reviews = reviewService.getReviewsByRestaurantId(restaurantId, rating);
        System.out.println("获取餐厅评价响应数据数量: " + reviews.size());
        return Result.success(reviews);
    }
    
    @GetMapping("/user/{userId}")
    public Result<List<Review>> getReviewsByUser(@PathVariable Long userId) {
        System.out.println("获取用户评价请求参数 - 用户ID: " + userId);
        List<Review> reviews = reviewService.getReviewsByUserId(userId);
        System.out.println("获取用户评价响应数据数量: " + reviews.size());
        return Result.success(reviews);
    }
    
    @PutMapping("/{id}")
    public Result<Review> updateReview(@PathVariable Long id, @RequestBody Review review) {
        System.out.println("更新评价请求参数 - 评价ID: " + id + ", 评价数据: " + review);
        review.setId(id);
        Review updatedReview = reviewService.updateReview(review);
        System.out.println("更新评价响应数据: " + updatedReview);
        return Result.success(updatedReview);
    }
    
    @DeleteMapping("/{id}")
    public Result<Void> deleteReview(@PathVariable Long id) {
        System.out.println("删除评价请求参数 - 评价ID: " + id);
        reviewService.deleteReview(id);
        System.out.println("删除评价成功");
        return Result.success(null);
    }
} 