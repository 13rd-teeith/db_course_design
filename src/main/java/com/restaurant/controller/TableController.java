package com.restaurant.controller;

import com.restaurant.dto.Result;
import com.restaurant.entity.Table;
import com.restaurant.service.TableService;
import com.restaurant.service.impl.ServiceDemoByMHt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tables")
public class TableController {
    
    @Autowired
    private TableService tableService;
    
    @GetMapping("/restaurant/{restaurantId}")
    public Result<List<Table>> getTablesByRestaurant(@PathVariable Long restaurantId) {
        System.out.println("获取餐厅桌位请求参数 - 餐厅ID: " + restaurantId);
        List<Table> tables = tableService.getTablesByRestaurantId(restaurantId);
        System.out.println("获取餐厅桌位响应数据数量: " + tables.size());
        return Result.success(tables);
    }
    
    @GetMapping("/{id}")
    public Result<Table> getTable(@PathVariable Long id) {
        System.out.println("获取桌位详情请求参数 - 桌位ID: " + id);
        Table table = tableService.getTableById(id);
        System.out.println("获取桌位详情响应数据: " + table);
        return Result.success(table);
    }
    
    @PutMapping("/{id}/status")
    public Result<Void> updateTableStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        System.out.println("更新桌位状态请求参数 - 桌位ID: " + id + ", 状态: " + status);
        tableService.updateTableStatus(id, status);
        System.out.println("更新桌位状态成功");
        return Result.success(null);
    }
    
    // 新增：添加餐桌预订时间段
    @PostMapping("/{id}/reservationTimeSlot")
    public Result<Void> addReservationTimeSlot(
            @PathVariable Long id,
            @RequestParam Long reservationId,
            @RequestParam String date,
            @RequestParam String time,
            @RequestParam Integer duration) {
        System.out.println("添加餐桌预订时间段请求参数 - 餐桌ID: " + id + 
                           ", 预订ID: " + reservationId +
                           ", 日期: " + date +
                           ", 时间: " + time +
                           ", 时长: " + duration);
        
        // 使用实现类中的方法
        ServiceDemoByMHt service = (ServiceDemoByMHt) tableService;
        service.addReservationTimeSlot(id, reservationId, date, time, duration);
        
        System.out.println("添加餐桌预订时间段成功");
        return Result.success(null);
    }

    // API：获取餐厅可用餐桌
    @GetMapping("/restaurant/{restaurantId}/available")
    public Result<List<Table>> getAvailableTables(
            @PathVariable Long restaurantId,
            @RequestParam String date,
            @RequestParam String time,
            @RequestParam(required = false, defaultValue = "2") Integer duration,
            @RequestParam(required = false, defaultValue = "2") Integer people) {
        
        System.out.println("获取可用餐桌请求参数 - 餐厅ID: " + restaurantId + 
                          ", 日期: " + date + 
                          ", 时间: " + time + 
                          ", 时长: " + duration + 
                          ", 人数: " + people);
        
        // 获取餐厅所有餐桌
        List<Table> allTables = tableService.getTablesByRestaurantId(restaurantId);
        
        // 检查每个餐桌在指定时间段的可用性
        for (Table table : allTables) {
            // 检查餐桌是否可用
            boolean isAvailable = tableService.isTableAvailable(table.getId(), date, time, duration);
            
            // 更新餐桌状态，根据时间段可用性
            if (isAvailable) {
                table.setStatus("available");
            } else {
                table.setStatus("timeslot_unavailable");
            }
        }
        
        // 过滤出容量满足要求的餐桌
        List<Table> filteredTables = allTables.stream()
                .filter(table -> table.getCapacity() >= people)
                .toList();
        
        System.out.println("获取可用餐桌响应数据数量: " + filteredTables.size());
        return Result.success(filteredTables);
    }
} 