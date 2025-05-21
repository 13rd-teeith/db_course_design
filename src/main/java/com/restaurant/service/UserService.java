package com.restaurant.service;

import com.restaurant.common.Result;
import com.restaurant.entity.User;
import com.restaurant.entity.User.UserPreferences;

public interface UserService {
    User login(String phone, String password);
    User register(User user);
    User getUserProfile();
    Result<User> updateProfile(User user);
    Result<Void> updatePassword(String currentPassword, String newPassword);
    Result<Void> updatePreferences(UserPreferences preferences);
    Result<String> updateAvatar(String avatarBase64);
} 