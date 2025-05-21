package com.restaurant.entity;

import java.util.List;
import java.time.LocalDateTime;
import java.lang.Long;
import java.lang.String;
import java.lang.Integer;

public class Reservation {

    private Long id;
    private Long userId = 0L;
    private Long restaurantId;
    private String restaurantName;
    private Long tableId;
    private String reservationDate;
    private String reservationTime;
    private Integer duration = 2;
    private Integer peopleCount = 2;
    private String status = "pending";
    private List<ReservationDish> dishes;
    private String createTime;
    private String updateTime;
    private Long customerId;
    private String date;
    private String time;
    private int people;
    public String getRestaurantName(){ return  this.restaurantName; }
    public void setRestaurantName(String restaurantName) {this.restaurantName = restaurantName; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
    public Long getTableId() { return tableId; }
    public void setTableId(Long tableId) { this.tableId = tableId; }
    public String getReservationDate() { return reservationDate; }
    public void setReservationDate(String reservationDate) { this.reservationDate = reservationDate; }
    public String getReservationTime() { return reservationTime; }
    public void setReservationTime(String reservationTime) { this.reservationTime = reservationTime; }
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    public Integer getPeopleCount() { return peopleCount; }
    public void setPeopleCount(Integer peopleCount) { this.peopleCount = peopleCount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<ReservationDish> getDishes() { return dishes; }
    public void setDishes(List<ReservationDish> dishes) { this.dishes = dishes; }
    public String getCreateTime() { return createTime; }
    public void setCreateTime(String createTime) { this.createTime = createTime; }
    public String getUpdateTime() { return updateTime; }
    public void setUpdateTime(String updateTime) { this.updateTime = updateTime; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public int getPeople() { return people; }
    public void setPeople(int people) { this.people = people; }

    @Override
    public String toString() {
        return "Reservation{" +
                "id=" + id +
                ", userId=" + userId +
                ", restaurantId=" + restaurantId +
                ", tableId=" + tableId +
                ", reservationDate='" + reservationDate + '\'' +
                ", reservationTime='" + reservationTime + '\'' +
                ", duration=" + duration +
                ", peopleCount=" + peopleCount +
                ", status='" + status + '\'' +
                ", dishes=" + dishes +
                ", createTime='" + createTime + '\'' +
                ", updateTime='" + updateTime + '\'' +
                ", customerId=" + customerId +
                ", date='" + date + '\'' +
                ", time='" + time + '\'' +
                ", people=" + people +
                '}';
    }
} 