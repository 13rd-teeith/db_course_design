package com.restaurant.controller;

import com.restaurant.common.Result;
import com.restaurant.entity.User;
import com.restaurant.entity.User.UserPreferences;
import com.restaurant.service.UserService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/profile")
    public Result<User> getProfile() {
        System.out.println("获取用户资料请求");
        User user = userService.getUserProfile();
        System.out.println("获取用户资料响应数据: " + user);
        return Result.success(user);
    }

    @PutMapping("/profile")
    public Result<User> updateProfile(@RequestBody User user) {
        System.out.println("更新用户资料请求数据: " + user);
        Result<User> result = userService.updateProfile(user);
        System.out.println("更新用户资料响应数据: " + result.getData());
        return result;
    }

    @PutMapping("/password")
    public Result<Void> updatePassword(@RequestBody PasswordUpdateRequest request) {
        System.out.println("更新密码请求数据: 当前密码长度=" + (request.getCurrentPassword() != null ? request.getCurrentPassword().length() : 0) + 
                          ", 新密码长度=" + (request.getNewPassword() != null ? request.getNewPassword().length() : 0));
        Result<Void> result = userService.updatePassword(request.getCurrentPassword(), request.getNewPassword());
        System.out.println("更新密码响应状态: " + result.getCode() + ", 消息: " + result.getMessage());
        return result;
    }

    @PutMapping("/preferences")
    public Result<Void> updatePreferences(@RequestBody User.UserPreferences preferences) {
        System.out.println("更新用户偏好请求数据: " + preferences);
        Result<Void> result = userService.updatePreferences(preferences);
        System.out.println("更新用户偏好响应状态: " + result.getCode() + ", 消息: " + result.getMessage());
        return result;
    }

    /**
     * 更新用户头像
     */
    @PostMapping("/avatar")
    public Result<String> updateAvatar(@RequestBody Map<String, String> request) {
        String avatarBase64 = request.get("avatarBase64");
        return userService.updateAvatar(avatarBase64);
    }

    @Data
    private static class PasswordUpdateRequest {
        private String currentPassword;
        private String newPassword;
    }
} 