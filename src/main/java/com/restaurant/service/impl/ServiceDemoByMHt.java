package com.restaurant.service.impl;

import com.restaurant.entity.*;
import com.restaurant.service.*;
import com.restaurant.common.Result;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.util.FileCopyUtils;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.Base64;
import java.time.LocalDateTime;

@Service
public class ServiceDemoByMHt implements UserService, RestaurantService, TableService, DishService, ReservationService, ReviewService {
    
    // 内存持久化数据结构
    private final Map<Long, User> userMap = new ConcurrentHashMap<>();
    private final Map<Long, Restaurant> restaurantMap = new ConcurrentHashMap<>();
    private final Map<Long, Table> tableMap = new ConcurrentHashMap<>();
    private final Map<Long, Dish> dishMap = new ConcurrentHashMap<>();
    private final Map<Long, Reservation> reservationMap = new ConcurrentHashMap<>();
    private final Map<Long, List<Review>> reviewMap = new ConcurrentHashMap<>();
    
    // 图片资源缓存
    private final Map<String, String> imageCache = new ConcurrentHashMap<>();
    
    // 默认图片
    private static final String DEFAULT_USER_AVATAR = "default_user_avatar.png";
    private static final String DEFAULT_RESTAURANT_IMAGE = "default_restaurant_image.png";
    private static final String DEFAULT_DISH_IMAGE = "default_dish_image.png";
    
    // 图片资源路径
    private static final String IMAGE_PATH = "static/images/";
    
    // 自增ID生成器
    private final AtomicLong userIdGenerator = new AtomicLong(10000);
    private final AtomicLong restaurantIdGenerator = new AtomicLong(1000);
    private final AtomicLong tableIdGenerator = new AtomicLong(1);
    private final AtomicLong dishIdGenerator = new AtomicLong(100);
    private final AtomicLong reservationIdGenerator = new AtomicLong(100000);
    private final AtomicLong reviewIdGenerator = new AtomicLong(1);
    
    // UserService实现
    @Override
    public User login(String phone, String password) {
        System.out.println("DS-ACCESS-DEBUG: [UserService.login] 查询用户 - 手机号: " + phone + " 密码: " + password);
        System.out.println("DS-ACCESS-DEBUG: [UserService.login] 内存中的用户数据:");
        userMap.values().forEach(user -> 
            System.out.println("DS-ACCESS-DEBUG: [UserService.login] 用户ID: " + user.getId() 
                + ", 手机号: " + user.getPhone() 
                + ", 密码: " + user.getPassword()));
        
        User user = userMap.values().stream()
                .filter(u -> phone.equals(u.getPhone()) && password.equals(u.getPassword()))
                .findFirst()
                .orElse(null);
                
        if (user != null) {
            // 确保用户头像Base64格式
            if (user.getAvatarBase64() != null && !user.getAvatarBase64().startsWith("data:image")) {
                user.setAvatarBase64(getImageUrl(user.getAvatarBase64()));
            }
        }
        
        return user;
    }
    
    @Override
    public User register(User user) {
        System.out.println("DS-ACCESS-DEBUG: [UserService.register] 新增用户 - 用户名: " + user.getName());
        user.setId(userIdGenerator.incrementAndGet());
        userMap.put(user.getId(), user);
        return user;
    }
    
    @Override
    public User getUserProfile() {
        System.out.println("DS-ACCESS-DEBUG: [UserService.getUserProfile] 查询用户资料");
        User user = userMap.values().stream().findFirst().orElse(null);
        if (user != null) {
            // 确保用户头像Base64格式
            if (user.getAvatarBase64() == null || user.getAvatarBase64().isEmpty()) {
                user.setAvatarBase64(getImageUrl(DEFAULT_USER_AVATAR));
            } else if (!user.getAvatarBase64().startsWith("data:image")) {
                user.setAvatarBase64(getImageUrl(user.getAvatarBase64()));
            }
        }
        return user;
    }
    
    @Override
    public Result<User> updateProfile(User user) {
        System.out.println("DS-ACCESS-DEBUG: [UserService.updateProfile] 更新用户资料 - 用户ID: " + user.getId());
        if (!userMap.containsKey(user.getId())) {
            return Result.error("用户不存在");
        }
        userMap.put(user.getId(), user);
        return Result.success("更新用户资料成功", user);
    }

    @Override
    public Result<Void> updatePassword(String currentPassword, String newPassword) {
        System.out.println("DS-ACCESS-DEBUG: [UserService.updatePassword] 更新用户密码 - 当前密码: " + currentPassword);
        try {
            User user = getUserProfile();
            if (user == null) {
                return Result.error("用户不存在");
            }

            // 验证当前密码
            if (!currentPassword.equals(user.getPassword())) {
                return Result.error("当前密码错误");
            }

            // 更新密码
            user.setPassword(newPassword);
            userMap.put(user.getId(), user);
            System.out.println("DS-ACCESS-DEBUG: [UserService.updatePassword] 密码已更新为: " + newPassword);
            return Result.success("密码更新成功", null);
        } catch (Exception e) {
            System.out.println("DS-ACCESS-DEBUG: [UserService.updatePassword] 修改密码失败: " + e.getMessage());
            return Result.error("修改密码失败");
        }
    }

    @Override
    public Result<Void> updatePreferences(User.UserPreferences preferences) {
        System.out.println("DS-ACCESS-DEBUG: [UserService.updatePreferences] 更新用户偏好设置");
        try {
            User user = getUserProfile();
            if (user == null) {
                return Result.error("用户不存在");
            }

            user.setPreferences(preferences);
            userMap.put(user.getId(), user);
            System.out.println("DS-ACCESS-DEBUG: [UserService.updatePreferences] 更新用户偏好设置成功: " + preferences);
            return Result.success("偏好设置更新成功", null);
        } catch (Exception e) {
            System.out.println("DS-ACCESS-DEBUG: [UserService.updatePreferences] 更新偏好设置失败: " + e.getMessage());
            return Result.error("更新偏好设置失败");
        }
    }

    @Override
    public Result<String> updateAvatar(String avatarBase64) {
        System.out.println("DS-ACCESS-DEBUG: [UserService.updateAvatar] 更新用户头像");
        try {
            User user = getUserProfile();
            if (user == null) {
                return Result.error("用户不存在");
            }
            
            user.setAvatarBase64(avatarBase64);
            userMap.put(user.getId(), user);
            System.out.println("DS-ACCESS-DEBUG: [UserService.updateAvatar] 头像更新成功");
            return Result.success("头像更新成功", avatarBase64);
        } catch (Exception e) {
            System.out.println("DS-ACCESS-DEBUG: [UserService.updateAvatar] 更新头像失败: " + e.getMessage());
            return Result.error("更新头像失败");
        }
    }

    // RestaurantService实现
    @Override
    public Restaurant login(String restaurantId, String password, String role) {
        System.out.println("DS-ACCESS-DEBUG: [RestaurantService.login] 查询餐厅 - 餐厅ID: " + restaurantId);
        return restaurantMap.values().stream()
                .peek(restaurant -> {
                    System.out.println("Checking restaurant: " + restaurant.getId());
                    System.out.println("  Expected ID: " + restaurantId + ", Actual ID: " + restaurant.getId());
                    System.out.println("  Expected Password: " + password + ", Actual Password: " + restaurant.getPassword());
                    System.out.println("  Expected Role: " + role + ", Actual Role: " + restaurant.getRole());
                })
                .filter(restaurant -> restaurantId.equals(restaurant.getId().toString())
                        && password.equals(restaurant.getPassword())
//                        && role.equals(restaurant.getRole())
                        )
                .findFirst()
                .orElse(null);
    }

    @Override
    public Restaurant register(Restaurant restaurant) {
        System.out.println("DS-ACCESS-DEBUG: [RestaurantService.register] 新增餐厅 - 餐厅名称: " + restaurant.getName());
        restaurant.setId(restaurantIdGenerator.incrementAndGet());
        restaurantMap.put(restaurant.getId(), restaurant);
        return restaurant;
    }

    @Override
    public Restaurant getRestaurantById(Long id) {
        System.out.println("DS-ACCESS-DEBUG: [RestaurantService.getRestaurantById] 查询餐厅 - 餐厅ID: " + id);
        Restaurant restaurant = restaurantMap.get(id);
        if (restaurant != null) {
            // 设置餐厅图片
            if (restaurant.getImageUrl() == null || restaurant.getImageUrl().isEmpty()) {
                restaurant.setImageUrl(getImageUrl(DEFAULT_RESTAURANT_IMAGE));
            }
            
            // 获取并设置餐桌信息
            List<Table> tables = tableMap.values().stream()
                    .filter(table -> table.getRestaurantId().equals(id))
                    .toList();
            restaurant.setTables(tables);
            System.out.println("DS-ACCESS-DEBUG: [RestaurantService.getRestaurantById] 设置餐桌信息 - 数量: " + tables.size());
            
            // 获取并设置菜单信息
            List<Dish> menu = dishMap.values().stream()
                    .filter(dish -> dish.getRestaurantId().equals(id))
                    .toList();
            restaurant.setMenu(menu);
            System.out.println("DS-ACCESS-DEBUG: [RestaurantService.getRestaurantById] 设置菜单信息 - 数量: " + menu.size());
            
            // 获取并设置评价信息
            List<Review> reviews = reviewMap.getOrDefault(id, new ArrayList<>());
            restaurant.setReviews(reviews);
            System.out.println("DS-ACCESS-DEBUG: [RestaurantService.getRestaurantById] 设置评价信息 - 数量: " + reviews.size());
        }
        return restaurant;
    }

    @Override
    public List<Restaurant> searchRestaurants(String keyword, String cuisine, Double minRating) {
        System.out.println("DS-ACCESS-DEBUG: [RestaurantService.searchRestaurants] 搜索餐厅 - 关键词: " + keyword);
        return restaurantMap.values().stream()
                .filter(restaurant ->
                        (keyword == null || keyword.isEmpty() || restaurant.getName().contains(keyword)) &&
                                (Objects.equals(cuisine, "all") || cuisine == null || cuisine.isEmpty() || cuisine.equals(restaurant.getCuisine())) &&
                                (minRating == null || minRating == 0.0 || restaurant.getRating() >= minRating))
                .toList();
    }

    @Override
    public void updateRestaurant(Restaurant restaurant) {
        System.out.println("DS-ACCESS-DEBUG: [RestaurantService.updateRestaurant] 更新餐厅 - 餐厅ID: " + restaurant.getId());
        restaurantMap.put(restaurant.getId(), restaurant);
    }

    // TableService实现
    @Override
    public List<Table> getTablesByRestaurantId(Long restaurantId) {
        System.out.println("DS-ACCESS-DEBUG: [TableService.getTablesByRestaurantId] 查询餐桌列表 - 餐厅ID: " + restaurantId);
        return tableMap.values().stream()
                .filter(table -> table.getRestaurantId().equals(restaurantId))
                .toList();
    }

    @Override
    public Table getTableById(Long id) {
        System.out.println("DS-ACCESS-DEBUG: [TableService.getTableById] 查询餐桌 - 餐桌ID: " + id);
        return tableMap.get(id);
    }

    @Override
    public boolean isTableAvailable(Long id, String date, String time, Integer duration) {
        System.out.println("DS-ACCESS-DEBUG: [TableService.isTableAvailable] 检查餐桌可用性 - 餐桌ID: " + id + 
                           ", 日期: " + date + ", 时间: " + time + ", 时长: " + duration);
        
        // 确保参数有效
        if (id == null || date == null || time == null) {
            System.out.println("DS-ACCESS-DEBUG: [TableService.isTableAvailable] 参数无效");
            return false;
        }
        
        // 获取餐桌
        Table table = tableMap.get(id);
        if (table == null) {
            System.out.println("DS-ACCESS-DEBUG: [TableService.isTableAvailable] 餐桌不存在 - 餐桌ID: " + id);
            return false;
        }
        
        // 确保duration有值，并创建一个final副本
        final int finalDuration = duration != null ? duration : 2; // 默认2小时
        
        // 计算结束时间
        int startMinutes = convertTimeToMinutes(time);
        int endMinutes = startMinutes + finalDuration * 60;
        
        // 检查是否与现有预订时间段重叠
        for (Table.ReservationTimeSlot slot : table.getReservedTimeSlots()) {
            // 仅检查同一天的预订
            if (slot.getDate().equals(date)) {
                int slotStartMinutes = convertTimeToMinutes(slot.getStartTime());
                int slotEndMinutes = convertTimeToMinutes(slot.getEndTime());
                
                // 判断时间段是否重叠
                if (!(endMinutes <= slotStartMinutes || startMinutes >= slotEndMinutes)) {
                    System.out.println("DS-ACCESS-DEBUG: [TableService.isTableAvailable] 与现有预订时间段重叠 - " +
                                      "查询时间: " + time + "-" + minutesToTime(endMinutes) + ", " +
                                      "已预订时间: " + slot.getStartTime() + "-" + slot.getEndTime());
                    return false;
                }
            }
        }
        
        // 检查所有预约记录，增加额外保险
        boolean hasOverlap = reservationMap.values().stream()
                .filter(reservation -> reservation.getTableId().equals(id))
                .filter(reservation -> {
                    // 安全处理日期比较，避免空指针异常
                    String reservationDate = reservation.getReservationDate();
                    String reservationDateAlt = reservation.getDate();
                    return (reservationDate != null && reservationDate.equals(date)) || 
                           (reservationDateAlt != null && reservationDateAlt.equals(date));
                })
                .anyMatch(reservation -> {
                    // 安全获取时间和时长
                    String reservationTime = reservation.getReservationTime();
                    if (reservationTime == null) {
                        reservationTime = reservation.getTime();
                    }
                    // 如果时间为null，则无法判断重叠，安全返回false
                    if (reservationTime == null) {
                        return false;
                    }
                    
                    int reserveDuration = 2; // 默认值
                    if (reservation.getDuration() != null) {
                        reserveDuration = reservation.getDuration();
                    }
                    
                    return isTimeOverlap(reservationTime, time, finalDuration);
                });
        
        if (hasOverlap) {
            System.out.println("DS-ACCESS-DEBUG: [TableService.isTableAvailable] 在预约记录中发现时间冲突");
            return false;
        }
        
        System.out.println("DS-ACCESS-DEBUG: [TableService.isTableAvailable] 餐桌可用 - 餐桌ID: " + id + 
                          ", 日期: " + date + ", 时间: " + time);
        return true;
    }
    
    // 将时间转换为分钟表示（如 "18:30" -> 1110）
    private String minutesToTime(int minutes) {
        int hours = minutes / 60;
        int mins = minutes % 60;
        return String.format("%02d:%02d", hours, mins);
    }
    
    @Override
    public void updateTableStatus(Long id, String status) {
        System.out.println("DS-ACCESS-DEBUG: [TableService.updateTableStatus] 更新餐桌状态 - 餐桌ID: " + id + ", 状态: " + status);
        // 该方法不再修改table.status，保留方法签名以兼容接口
        // 实际业务逻辑应该通过添加或移除预订时间段来控制
        System.out.println("警告：updateTableStatus方法已废弃，请使用addReservationTimeSlot方法添加预订时间段");
    }
    
    // 更新为：添加预订时间段
    public void addReservationTimeSlot(Long tableId, Long reservationId, String date, String time, Integer duration) {
        System.out.println("DS-ACCESS-DEBUG: [TableService.addReservationTimeSlot] 添加预订时间段 - " +
                          "餐桌ID: " + tableId + ", 预订ID: " + reservationId);
        
        Table table = tableMap.get(tableId);
        if (table != null) {
            // 添加预订时间段
            if (reservationId != null && date != null && time != null && duration != null) {
                table.addReservationTimeSlot(reservationId, date, time, duration);
                System.out.println("DS-ACCESS-DEBUG: [TableService.addReservationTimeSlot] 已添加预订时间段 - " +
                                  "日期: " + date + ", 时间: " + time + ", 时长: " + duration + "小时");
                
                tableMap.put(tableId, table);
            }
        }
    }

    // DishService实现
    @Override
    public List<Dish> getDishesByRestaurantId(Long restaurantId) {
        System.out.println("DS-ACCESS-DEBUG: [DishService.getDishesByRestaurantId] 查询菜品列表 - 餐厅ID: " + restaurantId);
        return dishMap.values().stream()
                .filter(dish -> dish.getRestaurantId().equals(restaurantId))
                .toList();
    }

    @Override
    public Dish getDishById(Long id) {
        System.out.println("菜品id:" +id);
        System.out.println("DS-ACCESS-DEBUG: [DishService.getDishById] 查询菜品 - 菜品ID: " + id);
        Dish dish = dishMap.get(id);
        if (dish != null && (dish.getImageUrl() == null || dish.getImageUrl().isEmpty())) {
            dish.setImageUrl(getImageUrl(DEFAULT_DISH_IMAGE));
        }
        return dish;
    }

    @Override
    public void updateDishStatus(Long dishId, String status) {
        System.out.println("DS-ACCESS-DEBUG: [DishService.updateDishStatus] 更新菜品状态 - 菜品ID: " + dishId);
        Dish dish = dishMap.get(dishId);
        if (dish != null) {
            dish.setStatus(status);
            dishMap.put(dishId, dish);
        }
    }

    @Override
    public List<Dish> getDishesByCategory(Long restaurantId, String category) {
        System.out.println("DS-ACCESS-DEBUG: [DishService.getDishesByCategory] 查询分类菜品 - 餐厅ID: " + restaurantId + ", 分类: " + category);
        return dishMap.values().stream()
                .filter(dish -> dish.getRestaurantId().equals(restaurantId) && category.equals(dish.getCategory()))
                .toList();
    }

    @Override
    public List<Dish> searchDishes(String keyword, String category, Double minPrice, Double maxPrice) {
        System.out.println("DS-ACCESS-DEBUG: [DishService.searchDishes] 搜索菜品 - 关键词: " + keyword);
        return dishMap.values().stream()
                .filter(dish -> 
                    (keyword == null || dish.getName().contains(keyword)) &&
                    (category == null || category.equals(dish.getCategory())) &&
                    (minPrice == null || dish.getPrice() >= minPrice) &&
                    (maxPrice == null || dish.getPrice() <= maxPrice))
                .toList();
    }

    @Override
    public Dish createDish(Dish dish) {
        System.out.println("DS-ACCESS-DEBUG: [DishService.createDish] 新增菜品 - 名称: " + dish.getName());
        dish.setId(dishIdGenerator.incrementAndGet());
        dishMap.put(dish.getId(), dish);
        return dish;
    }

    @Override
    public Dish updateDish(Dish dish) {
        System.out.println("DS-ACCESS-DEBUG: [DishService.updateDish] 更新菜品 - 菜品ID: " + dish.getId());
        dishMap.put(dish.getId(), dish);
        return dish;
    }

    @Override
    public void deleteDish(Long id) {
        System.out.println("DS-ACCESS-DEBUG: [DishService.deleteDish] 删除菜品 - 菜品ID: " + id);
        dishMap.remove(id);
    }

    // ReservationService实现
    @Override
    public Reservation createReservation(Reservation reservation) {
        System.out.println("DS-ACCESS-DEBUG: [ReservationService.createReservation] 新增预订 - 用户ID: " + reservation.getUserId());
        reservation.setId(reservationIdGenerator.incrementAndGet());
        List<ReservationDish> dishes = reservation.getDishes();
        for (ReservationDish rDish : dishes) {
            Dish dish = getDishById(rDish.getId());
            rDish.setByDish(dish, rDish.getQuantity());
        }
        reservation.setDishes(dishes);
        reservation.setRestaurantName(restaurantMap.get(reservation.getRestaurantId()).getName());
        reservationMap.put(reservation.getId(), reservation);
        return reservation;
    }

    @Override
    public Reservation getReservationById(Long id) {
        System.out.println("DS-ACCESS-DEBUG: [ReservationService.getReservationById] 查询预订 - 预订ID: " + id);
        return reservationMap.get(id);
    }

    @Override
    public List<Reservation> getReservationsByRestaurantId(Long restaurantId, String date) {
        System.out.println("DS-ACCESS-DEBUG: [ReservationService.getReservationsByRestaurantId] 查询餐厅预订列表 - 餐厅ID: " + restaurantId);
        return reservationMap.values().stream()
                .filter(reservation -> 
                    reservation.getRestaurantId().equals(restaurantId) &&
                    (date == null || date.equals(reservation.getReservationDate())))
                .toList();
    }

    @Override
    public List<Reservation> getReservationsByUserId(Long userId) {
        System.out.println("DS-ACCESS-DEBUG: [ReservationService.getReservationsByUserId] 查询用户预订列表 - 用户ID: " + userId);
        return reservationMap.values().stream()
                .filter(reservation -> reservation.getUserId().equals(userId))
                .toList();
    }

    @Override
    public void updateReservationStatus(Long id, String status) {
        System.out.println("DS-ACCESS-DEBUG: [ReservationService.updateReservationStatus] 更新预订状态 - 预订ID: " + id);
        Reservation reservation = reservationMap.get(id);
        if (reservation != null) {
            reservation.setStatus(status);
            reservationMap.put(id, reservation);
        }
    }

    @Override
    public void confirmArrival(Long id) {
        System.out.println("DS-ACCESS-DEBUG: [ReservationService.confirmArrival] 确认到店 - 预订ID: " + id);
        Reservation reservation = reservationMap.get(id);
        if (reservation != null) {
            reservation.setStatus("arrived");
            reservationMap.put(id, reservation);
        }
    }

    @Override
    public void completeOrder(Long id) {
        System.out.println("DS-ACCESS-DEBUG: [ReservationService.completeOrder] 完成订单 - 预订ID: " + id);
        Reservation reservation = reservationMap.get(id);
        if (reservation != null) {
            reservation.setStatus("completed");
            reservationMap.put(id, reservation);
        }
    }

    // ReviewService实现
    @Override
    public Review createReview(Review review) {
        System.out.println("DS-ACCESS-DEBUG: [ReviewService.createReview] 新增评论 - 用户ID: " + review.getUserId());
        review.setId(reviewIdGenerator.incrementAndGet());
        reviewMap.computeIfAbsent(review.getRestaurantId(), k -> new ArrayList<>()).add(review);
        return review;
    }

    @Override
    public Review getReviewById(Long id) {
        System.out.println("DS-ACCESS-DEBUG: [ReviewService.getReviewById] 查询评论 - 评论ID: " + id);
        return reviewMap.values().stream()
                .flatMap(List::stream)
                .filter(review -> review.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    @Override
    public List<Review> getReviewsByRestaurantId(Long restaurantId, Integer limit) {
        System.out.println("DS-ACCESS-DEBUG: [ReviewService.getReviewsByRestaurantId] 查询餐厅评论 - 餐厅ID: " + restaurantId);
        List<Review> reviews = reviewMap.getOrDefault(restaurantId, new ArrayList<>());
        return limit != null ? reviews.stream().limit(limit).toList() : reviews;
    }

    @Override
    public List<Review> getReviewsByUserId(Long userId) {
        System.out.println("DS-ACCESS-DEBUG: [ReviewService.getReviewsByUserId] 查询用户评论 - 用户ID: " + userId);
        return reviewMap.values().stream()
                .flatMap(List::stream)
                .filter(review -> review.getUserId().equals(userId))
                .toList();
    }

    @Override
    public void deleteReview(Long id) {
        System.out.println("DS-ACCESS-DEBUG: [ReviewService.deleteReview] 删除评论 - 评论ID: " + id);
        reviewMap.values().forEach(reviews -> 
            reviews.removeIf(review -> review.getId().equals(id)));
    }

    @Override
    public Review updateReview(Review review) {
        System.out.println("DS-ACCESS-DEBUG: [ReviewService.updateReview] 更新评论 - 评论ID: " + review.getId());
        List<Review> reviews = reviewMap.get(review.getRestaurantId());
        if (reviews != null) {
            for (int i = 0; i < reviews.size(); i++) {
                if (reviews.get(i).getId().equals(review.getId())) {
                    reviews.set(i, review);
                    return review;
                }
            }
        }
        return null;
    }

    // 图片资源管理方法
    private String loadImage(String imageName) {
        return imageCache.computeIfAbsent(imageName, key -> {
            try {
                Resource resource = new ClassPathResource(IMAGE_PATH + key);
                byte[] imageBytes = FileCopyUtils.copyToByteArray(resource.getInputStream());
                return Base64.getEncoder().encodeToString(imageBytes);
            } catch (IOException e) {
                System.out.println("DS-ACCESS-DEBUG: [ImageService] 加载图片失败: " + key);
                return null;
            }
        });
    }

    private String getImageUrl(String imageName) {
        if (imageName == null || imageName.isEmpty()) {
            return null;
        }
        String base64Image = loadImage(imageName);
        return base64Image != null ? "data:image/png;base64," + base64Image : null;
    }

    @PostConstruct
    public void initTestData() {
        // 初始化用户数据
        List<User> users = Arrays.asList(
            createUser(1L, "张三", "13800138001", "1234567878", "user_avatar.png"),
            createUser(2L, "李四", "13800138002", "1234567878", "user_avatar.png"),
            createUser(3L, "王五", "13800138003", "1234567878", "user_avatar.png"),
            createUser(4L, "赵六", "13800138004", "1234567878", "user_avatar.png"),
            createUser(5L, "钱七", "13800138005", "1234567878", "user_avatar.png"),
            createUser(6L, "孙八", "13800138006", "1234567878", "user_avatar.png")
        );
        
        // 设置不同的会员等级和其他属性
        users.get(0).setMemberLevel("铂金会员");
        users.get(0).setPoints(5000);
        users.get(0).setBalance(2000.0);
        
        users.get(1).setMemberLevel("铂金会员");
        users.get(1).setPoints(3000);
        users.get(1).setBalance(1500.0);
        
        users.get(2).setMemberLevel("注册");
        users.get(2).setPoints(800);
        users.get(2).setBalance(500.0);
        
        users.get(3).setMemberLevel("注册");
        users.get(3).setPoints(400);
        users.get(3).setBalance(200.0);
        
        users.get(4).setMemberLevel("普通会员");
        users.get(4).setCreditScore(80);
        
        users.get(5).setMemberLevel("普通会员");
        users.get(5).setCreditScore(60);
        users.get(5).setBlacklisted(true);
        
        users.forEach(user -> {
            user.setAvatarBase64(getImageUrl(user.getAvatarBase64()));
            userMap.put(user.getId(), user);
        });

        // 初始化餐厅数据
        List<Restaurant> restaurants = Arrays.asList(
            createRestaurant(1L, "粤式茶餐厅", "12345678", "admin", "restaurant_image.png", "粤菜", 4.8, "北京市朝阳区建国路88号", "010-1234567878", "10:00-22:00", "正宗粤式茶餐厅，提供各类粤式点心和小菜", Arrays.asList("粤菜", "茶餐厅", "点心"), "约15分钟", "¥¥"),
            createRestaurant(2L, "川味小馆", "12345678", "admin", "restaurant_image.png", "川菜", 4.6, "北京市海淀区中关村大街1号", "010-87654321", "11:00-23:00", "地道川菜，麻辣鲜香", Arrays.asList("川菜", "火锅", "麻辣"), "约20分钟", "¥¥¥"),
            createRestaurant(3L, "江浙菜馆", "12345678", "admin", "restaurant_image.png", "江浙菜", 4.7, "北京市西城区西单大悦城6层", "010-23456789", "10:30-21:30", "精致江浙菜，清淡爽口", Arrays.asList("江浙菜", "本帮菜", "海鲜"), "约25分钟", "¥¥¥¥"),
            createRestaurant(4L, "日式料理", "12345678", "admin", "restaurant_image.png", "日料", 4.9, "北京市朝阳区三里屯太古里北区", "010-34567890", "11:30-22:00", "正宗日式料理，新鲜食材", Arrays.asList("日料", "寿司", "刺身"), "约30分钟", "¥¥¥¥"),
            createRestaurant(5L, "意式餐厅", "12345678", "admin", "restaurant_image.png", "西餐", 4.5, "北京市朝阳区侨福芳草地", "010-45678901", "11:00-23:00", "地道意大利美食，浪漫氛围", Arrays.asList("西餐", "意大利菜", "披萨"), "约20分钟", "¥¥¥")
        );
        restaurants.forEach(restaurant -> restaurantMap.put(restaurant.getId(), restaurant));

        // 初始化餐桌数据
        List<Table> tables = Arrays.asList(
            // 粤式茶餐厅的餐桌
            createTable(1L, 1L, "大厅1号桌", 4, "available"),
            createTable(2L, 1L, "大厅2号桌", 4, "available"),
            createTable(3L, 1L, "大厅3号桌", 4, "available"),
            createTable(4L, 1L, "包间1号", 8, "available"),
            createTable(5L, 1L, "包间2号", 10, "available"),
            // 川味小馆的餐桌
            createTable(6L, 2L, "大厅1号桌", 4, "available"),
            createTable(7L, 2L, "大厅2号桌", 4, "available"),
            createTable(8L, 2L, "包间1号", 8, "available"),
            createTable(9L, 2L, "包间2号", 12, "available"),
            // 江浙菜馆的餐桌
            createTable(10L, 3L, "大厅1号桌", 4, "available"),
            createTable(11L, 3L, "大厅2号桌", 4, "available"),
            createTable(12L, 3L, "包间1号", 8, "available"),
            createTable(13L, 3L, "包间2号", 10, "available"),
            // 日式料理的餐桌
            createTable(14L, 4L, "吧台1号", 2, "available"),
            createTable(15L, 4L, "吧台2号", 2, "available"),
            createTable(16L, 4L, "包间1号", 6, "available"),
            createTable(17L, 4L, "包间2号", 8, "available"),
            // 意式餐厅的餐桌
            createTable(18L, 5L, "大厅1号桌", 4, "available"),
            createTable(19L, 5L, "大厅2号桌", 4, "available"),
            createTable(20L, 5L, "包间1号", 8, "available")
        );
        tables.forEach(table -> tableMap.put(table.getId(), table));

        // 初始化菜品数据
        List<Dish> dishes = Arrays.asList(
            // 粤式茶餐厅的菜品
            createDish(1L, 1L, "白切鸡", 68.0, "粤菜", "选用三黄鸡，配以姜葱酱", "available", "dish1.jpg"),
            createDish(2L, 1L, "清蒸鱼", 108.0, "粤菜", "选用新鲜鲈鱼，配以豉油", "available", "dish2.jpg"),
            createDish(3L, 1L, "虾饺", 38.0, "点心", "虾仁馅料，晶莹剔透", "available", "dish3.jpg"),
            createDish(4L, 1L, "叉烧包", 28.0, "点心", "甜咸适中，松软可口", "available", "dish4.jpg"),
            // 川味小馆的菜品
            createDish(5L, 2L, "麻婆豆腐", 48.0, "川菜", "麻辣鲜香，豆腐嫩滑", "available", "dish5.jpg"),
            createDish(6L, 2L, "水煮鱼", 88.0, "川菜", "选用新鲜草鱼，麻辣可口", "available", "dish6.jpg"),
            createDish(7L, 2L, "回锅肉", 58.0, "川菜", "肥而不腻，香辣可口", "available", "dish7.jpg"),
            createDish(8L, 2L, "夫妻肺片", 68.0, "川菜", "麻辣鲜香，口感丰富", "available", "dish8.jpg"),
            // 江浙菜馆的菜品
            createDish(9L, 3L, "东坡肉", 78.0, "江浙菜", "肥而不腻，入口即化", "available", "dish9.jpg"),
            createDish(10L, 3L, "龙井虾仁", 98.0, "江浙菜", "虾仁鲜嫩，茶香四溢", "available", "dish10.jpg"),
            createDish(11L, 3L, "西湖醋鱼", 88.0, "江浙菜", "酸甜可口，鱼肉鲜嫩", "available", "dish11.jpg"),
            createDish(12L, 3L, "叫化鸡", 108.0, "江浙菜", "外酥里嫩，香气四溢", "available", "dish12.jpg"),
            // 日式料理的菜品
            createDish(13L, 4L, "三文鱼刺身", 128.0, "刺身", "新鲜三文鱼，配以芥末", "available", "dish13.jpg"),
            createDish(14L, 4L, "寿司拼盘", 158.0, "寿司", "多种口味，新鲜可口", "available", "dish14.jpg"),
            createDish(15L, 4L, "天妇罗", 88.0, "炸物", "外酥里嫩，配以天妇罗酱", "available", "dish15.jpg"),
            createDish(16L, 4L, "味增汤", 28.0, "汤类", "浓郁鲜美，配以豆腐", "available", "dish16.jpg"),
            // 意式餐厅的菜品
            createDish(17L, 5L, "玛格丽特披萨", 88.0, "披萨", "经典意式披萨，配以番茄酱", "available", "dish17.jpg"),
            createDish(18L, 5L, "海鲜意面", 78.0, "意面", "新鲜海鲜，配以番茄酱", "available", "dish18.jpg"),
            createDish(19L, 5L, "提拉米苏", 48.0, "甜点", "经典意式甜点，咖啡味浓郁", "available", "dish19.jpg"),
            createDish(20L, 5L, "意大利浓汤", 38.0, "汤类", "浓郁鲜美，配以面包", "available", "dish20.jpg")
        );
        dishes.forEach(dish -> {
            dish.setImageUrl(getImageUrl(dish.getImageUrl()));
            dishMap.put(dish.getId(), dish);
        });

        // 初始化预约数据
        List<Reservation> reservations = Arrays.asList(
            // 今天的预约
            createReservation(1L, 1L, 1L, 1L, "2024-03-20", "12:00", 2, 4),
            createReservation(2L, 1L, 2L, 2L, "2024-03-20", "12:30", 2, 4),
            createReservation(3L, 2L, 3L, 6L, "2024-03-20", "18:00", 2, 4),
            createReservation(4L, 2L, 4L, 7L, "2024-03-20", "18:30", 2, 4),
            createReservation(5L, 3L, 5L, 10L, "2024-03-20", "19:00", 2, 4),
            // 明天的预约
            createReservation(6L, 1L, 1L, 4L, "2024-03-21", "12:00", 2, 8),
            createReservation(7L, 2L, 2L, 8L, "2024-03-21", "18:00", 2, 8),
            createReservation(8L, 3L, 3L, 12L, "2024-03-21", "19:00", 2, 8),
            // 后天的预约
            createReservation(9L, 4L, 4L, 14L, "2024-03-22", "12:00", 2, 2),
            createReservation(10L, 4L, 5L, 15L, "2024-03-22", "12:30", 2, 2),
            createReservation(11L, 5L, 1L, 18L, "2024-03-22", "18:00", 2, 4),
            createReservation(12L, 5L, 2L, 19L, "2024-03-22", "18:30", 2, 4)
        );
        reservations.forEach(reservation -> {
            reservation.setStatus("confirmed");
            reservationMap.put(reservation.getId(), reservation);
        });

        // 初始化评价数据
        List<Review> reviews = Arrays.asList(
            // 粤式茶餐厅的评价
            createReview(1L, 1L, 1L, 5, "白切鸡和虾饺都非常好吃，服务态度也很好！"),
            createReview(2L, 1L, 2L, 4, "环境不错，菜品新鲜，就是价格稍贵。"),
            createReview(3L, 1L, 3L, 5, "强烈推荐清蒸鱼，非常地道！"),
            // 川味小馆的评价
            createReview(4L, 2L, 4L, 5, "麻婆豆腐和水煮鱼都很好吃，辣度适中。"),
            createReview(5L, 2L, 5L, 4, "夫妻肺片很正宗，就是有点辣。"),
            createReview(6L, 2L, 1L, 5, "回锅肉很香，服务也很周到。"),
            // 江浙菜馆的评价
            createReview(7L, 3L, 2L, 5, "东坡肉入口即化，龙井虾仁很新鲜。"),
            createReview(8L, 3L, 3L, 4, "西湖醋鱼酸甜可口，环境优雅。"),
            createReview(9L, 3L, 4L, 5, "叫化鸡很香，服务态度好。"),
            // 日式料理的评价
            createReview(10L, 4L, 5L, 5, "三文鱼刺身很新鲜，寿司拼盘种类丰富。"),
            createReview(11L, 4L, 1L, 4, "天妇罗外酥里嫩，味增汤很浓郁。"),
            createReview(12L, 4L, 2L, 5, "环境很好，服务很专业。"),
            // 意式餐厅的评价
            createReview(13L, 5L, 3L, 5, "玛格丽特披萨很正宗，海鲜意面很新鲜。"),
            createReview(14L, 5L, 4L, 4, "提拉米苏很美味，意大利浓汤很浓郁。"),
            createReview(15L, 5L, 5L, 5, "环境浪漫，服务周到。")
        );
        reviews.forEach(review -> {
            review.setCreateTime(LocalDateTime.now());
            if (!reviewMap.containsKey(review.getRestaurantId())) {
                reviewMap.put(review.getRestaurantId(), new ArrayList<>());
            }
            reviewMap.get(review.getRestaurantId()).add(review);
        });
    }

    private User createUser(Long id, String name, String phone, String password, String avatarBase64) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        user.setPhone(phone);
        user.setPassword(password);
        // 确保头像Base64格式
        user.setAvatarBase64(getImageUrl(avatarBase64));
        
        // 设置默认会员信息
        user.setMemberLevel("注册");  // 默认为注册会员
        user.setCreditScore(100);     // 默认信誉度100
        user.setPoints(0);            // 默认积分0
        user.setBalance(0.0);         // 默认余额0
        user.setBlacklisted(false);   // 默认非黑名单
        
        return user;
    }

    private Restaurant createRestaurant(Long id, String name, String password, String role, String imageUrl,
            String cuisine, Double rating, String address, String phone, String businessHours, 
            String introduction, List<String> tags, String waitingTime, String priceLevel) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(id);
        restaurant.setName(name);
        restaurant.setPassword(password);
        restaurant.setRole(role);
        restaurant.setImageUrl(getImageUrl(imageUrl));
        restaurant.setCuisine(cuisine);
        restaurant.setRating(rating);
        restaurant.setAddress(address);
        restaurant.setPhone(phone);
        restaurant.setBusinessHours(businessHours);
        restaurant.setIntroduction(introduction);
        restaurant.setTags(tags);
        restaurant.setWaitingTime(waitingTime);
        restaurant.setPriceLevel(priceLevel);
        return restaurant;
    }

    private Table createTable(Long id, Long restaurantId, String name, int capacity, String status) {
        Table table = new Table();
        table.setId(id);
        table.setRestaurantId(restaurantId);
        table.setName(name);
        table.setCapacity(capacity);
        table.setStatus(status);
        return table;
    }

    private Dish createDish(Long id, Long restaurantId, String name, double price, String category, String description, String status, String imageUrl) {
        Dish dish = new Dish();
        dish.setId(id);
        dish.setRestaurantId(restaurantId);
        dish.setName(name);
        dish.setPrice(price);
        dish.setCategory(category);
        dish.setDescription(description);
        dish.setStatus(status);
        dish.setImageUrl(imageUrl);
        return dish;
    }

    private Reservation createReservation(Long id, Long restaurantId, Long customerId, Long tableId, String date, String time, int duration, int people) {
        Reservation reservation = new Reservation();
        reservation.setId(id);
        reservation.setRestaurantId(restaurantId);
        reservation.setCustomerId(customerId);
        reservation.setTableId(tableId);
        reservation.setDate(date);
        reservation.setTime(time);
        reservation.setDuration(duration);
        reservation.setPeople(people);
        return reservation;
    }

    private Review createReview(Long id, Long restaurantId, Long customerId, int rating, String comment) {
        Review review = new Review();
        review.setId(id);
        review.setRestaurantId(restaurantId);
        review.setCustomerId(customerId);
        review.setRating(rating);
        review.setComment(comment);
        return review;
    }

    // 获取默认头像
    public String getDefaultAvatar() {
        return getImageUrl(DEFAULT_USER_AVATAR);
    }

    private boolean isTimeOverlap(String time1, String time2, int duration) {
        // 将时间字符串转换为分钟数
        int minutes1 = convertTimeToMinutes(time1);
        int minutes2 = convertTimeToMinutes(time2);
        
        // 计算time1的结束时间（分钟数）
        int endMinutes1 = minutes1 + duration * 60;
        // 计算time2的结束时间（分钟数）
        int endMinutes2 = minutes2 + duration * 60;
        
        // 判断时间区间是否重叠
        // 不重叠的条件：time1结束时间早于time2开始时间，或者time2结束时间早于time1开始时间
        // 重叠的条件是上述条件的反面
        return !(endMinutes1 <= minutes2 || endMinutes2 <= minutes1);
    }
    
    // 将时间字符串（如"18:30"）转换为分钟数
    private int convertTimeToMinutes(String timeStr) {
        String[] parts = timeStr.split(":");
        int hours = Integer.parseInt(parts[0]);
        int minutes = Integer.parseInt(parts[1]);
        return hours * 60 + minutes;
    }
    
    @Override
    public Table createTable(Table table) {
        System.out.println("DS-ACCESS-DEBUG: [TableService.createTable] 新增餐桌 - 名称: " + table.getName());
        table.setId(tableIdGenerator.incrementAndGet());
        tableMap.put(table.getId(), table);
        return table;
    }

    @Override
    public Table updateTable(Table table) {
        System.out.println("DS-ACCESS-DEBUG: [TableService.updateTable] 更新餐桌 - 餐桌ID: " + table.getId());
        tableMap.put(table.getId(), table);
        return table;
    }
} 