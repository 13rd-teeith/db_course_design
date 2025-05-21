package com.restaurant.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class User {
    private Long id;
    private String phone;
    private String password;
    private String name;
    private String email;
    private String birthday;
    private String gender;
    private String avatar;
    private String avatarBase64;
    private UserPreferences preferences;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    
    // 新增字段
    private String memberLevel = "普通会员";  // 会员等级：注册，铂金会员
    private int creditScore = 100;        // 信誉度
    private int points = 0;               // 积分
    private double balance = 0.0;         // 存款
    private boolean isBlacklisted = false; // 是否为黑名单客户

    public String getAvatarBase64() { return avatarBase64; }
    public void setAvatarBase64(String avatarBase64) { this.avatarBase64 = avatarBase64; }

    @Data
    public static class UserPreferences {
        private boolean notifyReservation;
        private boolean notifyPromotion;
        private String defaultPeople;
        private String[] preferredCuisine;
        private String language;
        private String theme;
        private Boolean notifications;
    }
} 