package com.restaurant.entity;

import lombok.Data;
import java.util.List;
import java.util.ArrayList;

@Data
public class Table {
    private Long id;
    private Long restaurantId;
    private String name;
    private Integer capacity;
    private String status; // available, occupied, reserved
    private String createTime;
    private String updateTime;
    
    // 餐桌预订信息
    private List<ReservationTimeSlot> reservedTimeSlots = new ArrayList<>();
    
    // 餐桌当前使用信息
    private String currentStartTime; // 当前占用开始时间
    private String currentEndTime;   // 当前占用结束时间
    private Long currentReservationId; // 当前占用的预订ID
    
    // 预订时间段内部类
    @Data
    public static class ReservationTimeSlot {
        private Long reservationId;  // 预订ID
        private String date;         // 预订日期
        private String startTime;    // 开始时间
        private String endTime;      // 结束时间
        
        public ReservationTimeSlot() {}
        
        public ReservationTimeSlot(Long reservationId, String date, String startTime, String endTime) {
            this.reservationId = reservationId;
            this.date = date;
            this.startTime = startTime;
            this.endTime = endTime;
        }
    }
    
    // 添加预订时间段
    public void addReservationTimeSlot(Long reservationId, String date, String startTime, int durationHours) {
        // 计算结束时间
        String endTime = calculateEndTime(startTime, durationHours);
        
        this.reservedTimeSlots.add(new ReservationTimeSlot(reservationId, date, startTime, endTime));
    }
    
    // 根据开始时间和时长计算结束时间
    private String calculateEndTime(String startTime, int durationHours) {
        // 简单实现：假设格式为HH:mm，不考虑跨天
        String[] parts = startTime.split(":");
        int hours = Integer.parseInt(parts[0]);
        int minutes = Integer.parseInt(parts[1]);
        
        hours = (hours + durationHours) % 24;
        return String.format("%02d:%02d", hours, minutes);
    }
} 