package com.restaurant.service;

import com.restaurant.entity.Table;
import java.util.List;

public interface TableService {
    List<Table> getTablesByRestaurantId(Long restaurantId);
    Table getTableById(Long id);
    void updateTableStatus(Long id, String status);
    boolean isTableAvailable(Long id, String date, String time, Integer duration);
    Table createTable(Table table);
    Table updateTable(Table table);
    
    // 添加预订时间段
    default void addReservationTimeSlot(Long tableId, Long reservationId, 
                                      String date, String time, Integer duration) {
        // 默认实现，子类可以覆盖
        // 为了兼容性，调用老方法
        updateTableStatus(tableId, "reserved");
    }
    
    // 保留该方法用于兼容性
    default void updateTableStatusWithReservation(Long tableId, String status, Long reservationId, 
                                               String date, String time, Integer duration) {
        // 调用新方法
        addReservationTimeSlot(tableId, reservationId, date, time, duration);
    }
} 