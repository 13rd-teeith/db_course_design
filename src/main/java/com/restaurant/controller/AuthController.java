package com.restaurant.controller;

import com.restaurant.common.Result;
import com.restaurant.entity.Restaurant;
import com.restaurant.entity.User;
import com.restaurant.service.RestaurantService;
import com.restaurant.service.UserService;
import com.restaurant.service.impl.ServiceDemoByMHt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private RestaurantService restaurantService;
    
    @PostMapping("/customer/login")
    public Result<Map<String, Object>> customerLogin(@RequestParam String phone, @RequestParam String password) {
        System.out.println("客户登录请求数据 - 手机号: " + phone + ", 密码: " + password);
        
        if (phone == null || phone.trim().isEmpty()) {
            return Result.error("手机号不能为空");
        }
        if (password == null || password.trim().isEmpty()) {
            return Result.error("密码不能为空");
        }
        
        User user = userService.login(phone, password);
        System.out.println("客户登录响应数据: " + user);
        
        if (user == null) {
            return Result.error("手机号或密码错误");
        }

        
        // 如果用户没有头像，设置默认头像
        if (user.getAvatarBase64() == null || user.getAvatarBase64().trim().isEmpty()) {
            String defaultAvatar = ((ServiceDemoByMHt)userService).getDefaultAvatar();
            user.setAvatarBase64(defaultAvatar);
        }
        
        // 构建返回数据 - 直接返回用户信息，不再包装到customerInfo中
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("id", user.getId());
        responseData.put("name", user.getName());
        responseData.put("phone", user.getPhone());

        return Result.success(responseData);
    }


    private String generateToken(User user) {
        // 这里简单示例，实际应该使用JWT等方案
        return "token_" + user.getId() + "_" + System.currentTimeMillis();
    }
    
    @PostMapping("/customer/register")
    public Result<User> customerRegister(@RequestBody User user) {
        System.out.println("客户注册请求数据: " + user);
        
        if (user.getPhone() == null || user.getPhone().trim().isEmpty()) {
            return Result.error("手机号不能为空");
        }
        if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            return Result.error("密码不能为空");
        }
        if (user.getName() == null || user.getName().trim().isEmpty()) {
            return Result.error("姓名不能为空");
        }
        
        User registeredUser = userService.register(user);
        System.out.println("客户注册响应数据: " + registeredUser);
        return Result.success(registeredUser);
    }
    
    @PostMapping("/restaurant/login")
    public Result<Map<String, Object>> restaurantLogin(@RequestParam String restaurantId, 
                                            @RequestParam String password,
                                            @RequestParam String role) {
        System.out.println("餐厅登录请求数据 - 餐厅ID: " + restaurantId + 
                         ", 密码: " + password + 
                         ", 角色: " + role);
        
        if (restaurantId == null || restaurantId.trim().isEmpty()) {
            return Result.error("餐厅ID不能为空");
        }
        if (password == null || password.trim().isEmpty()) {
            return Result.error("密码不能为空");
        }
        if (role == null || role.trim().isEmpty()) {
            return Result.error("角色不能为空");
        }
        
        Restaurant restaurant = restaurantService.login(restaurantId, password, role);

        if (restaurant == null) {
            return Result.error("餐厅ID或密码错误");
        }

        // 构建返回数据 - 使用与客户登录一致的数据结构
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("id", restaurant.getId());
        responseData.put("name", restaurant.getName());
        responseData.put("address", restaurant.getAddress());
        responseData.put("phone", restaurant.getPhone());
        responseData.put("role", restaurant.getRole());
        
        return Result.success(responseData);
    }
    
    @PostMapping("/restaurant/register")
    public Result<Restaurant> restaurantRegister(@RequestBody Restaurant restaurant) {

        if (restaurant.getName() == null || restaurant.getName().trim().isEmpty()) {
            return Result.error("餐厅名称不能为空");
        }
        if (restaurant.getPassword() == null || restaurant.getPassword().trim().isEmpty()) {
            return Result.error("密码不能为空");
        }
        if (restaurant.getPhone() == null || restaurant.getPhone().trim().isEmpty()) {
            return Result.error("联系电话不能为空");
        }
        if (restaurant.getAddress() == null || restaurant.getAddress().trim().isEmpty()) {
            return Result.error("地址不能为空");
        }
        if (restaurant.getLicense() == null || restaurant.getLicense().trim().isEmpty()) {
            return Result.error("营业执照号不能为空");
        }
        
        Restaurant registeredRestaurant = restaurantService.register(restaurant);
        return Result.success(registeredRestaurant);
    }
} 