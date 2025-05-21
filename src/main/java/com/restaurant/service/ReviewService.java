package com.restaurant.service;

import com.restaurant.entity.Review;
import java.util.List;

public interface ReviewService {
    Review createReview(Review review);
    
    Review getReviewById(Long id);
    
    List<Review> getReviewsByRestaurantId(Long restaurantId, Integer rating);
    
    List<Review> getReviewsByUserId(Long userId);
    
    Review updateReview(Review review);
    
    void deleteReview(Long id);
} 