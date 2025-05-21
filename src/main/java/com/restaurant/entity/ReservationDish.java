package com.restaurant.entity;

public class ReservationDish {
    private Long id;
    private Integer quantity;
    private String status; // pending, cooking, ready
    private String name;
    private Double price;



    public void setByDish(Dish dish, Integer quantity){
        this.id = dish.getId();
        this.price = dish.getPrice();
        this.name = dish.getName();
        this.quantity = quantity;
        this.status = "pending";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public void setName(String name) {this.name = name;}
    public void setPrice(Double price) {this.price = price;}
    public Double getPrice() { return this.price; }
    public String getName() {return this.name; }

    @Override
    public String toString() {
        return "ReservationDish{" +
                "id=" + id +
                ", name=" + name +
                ", price=" + price +
                ", quantity=" + quantity +
                ", status='" + status + '\'' +
                '}';
    }
} 