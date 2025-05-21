package com.restaurant.controller;

import com.restaurant.dto.Result;
import com.restaurant.entity.Reservation;
import com.restaurant.service.ReservationService;
import com.restaurant.service.TableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reservations")
public class ReservationController {
    
    @Autowired
    private ReservationService reservationService;
    
    @Autowired
    private TableService tableService;
    
    @PostMapping
    public Result<Reservation> createReservation(@RequestBody Reservation reservation) {
        System.out.println("创建预订请求数据: " + reservation.toString());
        
        // 确保userId不为null
        if (reservation.getUserId() == null) {
            reservation.setUserId(0L);
        }
        
        // 如果customerId存在，将其设置为userId
        if (reservation.getCustomerId() != null) {
            reservation.setUserId(reservation.getCustomerId());
        }
        
        // 处理日期和时间字段的一致性
        if (reservation.getReservationDate() == null && reservation.getDate() != null) {
            reservation.setReservationDate(reservation.getDate());
        }
        
        if (reservation.getReservationTime() == null && reservation.getTime() != null) {
            reservation.setReservationTime(reservation.getTime());
        }
        
        if (reservation.getPeopleCount() == null && reservation.getPeople() > 0) {
            reservation.setPeopleCount(reservation.getPeople());
        }
        
        try {
            // 首先检查该餐桌在指定时间是否可用
            boolean isAvailable = tableService.isTableAvailable(
                reservation.getTableId(),
                reservation.getReservationDate(),
                reservation.getReservationTime(),
                reservation.getDuration()
            );
            
            if (!isAvailable) {
                return Result.error("所选餐桌在该时间段已被预订，请选择其他时间或餐桌");
            }
            
            // 创建预订
            Reservation createdReservation = reservationService.createReservation(reservation);
            
            // 使用新方法添加预订时间段
            tableService.addReservationTimeSlot(
                reservation.getTableId(),
                createdReservation.getId(),
                reservation.getReservationDate(),
                reservation.getReservationTime(),
                reservation.getDuration()
            );
            
            System.out.println("创建预订响应数据: " + createdReservation);
            System.out.println("餐桌预订信息已更新 - 餐桌ID: " + reservation.getTableId());
            
            return Result.success(createdReservation);
        } catch (Exception e) {
            System.out.println("创建预订失败: " + e.getMessage());
            e.printStackTrace();
            return Result.error("创建预订失败: " + e.getMessage());
        }
    }
    
    @GetMapping("/{id}")
    public Result<Reservation> getReservation(@PathVariable Long id) {
        System.out.println("获取预订请求参数 - 预订ID: " + id);
        Reservation reservation = reservationService.getReservationById(id);
        System.out.println("获取预订响应数据: " + reservation);
        return Result.success(reservation);
    }
    
    @GetMapping("/restaurant/{restaurantId}")
    public Result<List<Reservation>> getReservationsByRestaurant(
            @PathVariable Long restaurantId,
            @RequestParam String date) {
        System.out.println("获取餐厅预订请求参数 - 餐厅ID: " + restaurantId + ", 日期: " + date);
        List<Reservation> reservations = reservationService.getReservationsByRestaurantId(restaurantId, date);
        System.out.println("获取餐厅预订响应数据数量: " + reservations.size());
        return Result.success(reservations);
    }
    
    @GetMapping("/user/{userId}")
    public Result<List<Reservation>> getReservationsByUser(@PathVariable Long userId) {
        System.out.println("获取用户预订请求参数 - 用户ID: " + userId);
        List<Reservation> reservations = reservationService.getReservationsByUserId(userId);
        for (Reservation reservation: reservations){
            System.out.println("预定结果: " + reservation);
        }
        return Result.success(reservations);
    }
    
    @PutMapping("/{id}/status")
    public Result<Void> updateReservationStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        System.out.println("更新预订状态请求参数 - 预订ID: " + id + ", 状态: " + status);
        reservationService.updateReservationStatus(id, status);
        System.out.println("更新预订状态成功");
        return Result.success(null);
    }
    
    @PostMapping("/{id}/confirm-arrival")
    public Result<Void> confirmArrival(@PathVariable Long id) {
        System.out.println("确认到达请求参数 - 预订ID: " + id);
        reservationService.confirmArrival(id);
        System.out.println("确认到达成功");
        return Result.success(null);
    }
    
    @PostMapping("/{id}/complete-order")
    public Result<Void> completeOrder(@PathVariable Long id) {
        System.out.println("完成订单请求参数 - 预订ID: " + id);
        reservationService.completeOrder(id);
        System.out.println("完成订单成功");
        return Result.success(null);
    }
} 