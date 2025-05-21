// 认证相关逻辑
const authApp = {
    // 初始化
    init: function() {
        this.showLoadingIndicator(true);
        this.preloadResources();
        this.bindEvents();
    },
    
    // 验证手机号格式
    validatePhone: function(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    },
    
    // 验证密码长度
    validatePassword: function(password) {
        return password.length >= 8;
    },
    
    // 显示错误提示
    showError: function(message) {
        alert(message);
    },
    
    // 预加载资源
    preloadResources: function() {
        // 模拟预加载过程
        setTimeout(() => {
            this.showLoadingIndicator(false);
        }, 1500);
    },
    
    // 显示/隐藏加载指示器
    showLoadingIndicator: function(show) {
        if (show) {
            $('#loadingContainer').removeClass('d-none');
            $('#pageContent').addClass('d-none');
        } else {
            $('#loadingContainer').addClass('d-none');
            $('#pageContent').removeClass('d-none');
        }
    },
    
    // 绑定事件
    bindEvents: function() {
        // 切换登录选项卡
        $('#customerLoginTab').on('click', (e) => {
            e.preventDefault();
            this.switchLoginForm('customer');
        });
        
        $('#restaurantLoginTab').on('click', (e) => {
            e.preventDefault();
            this.switchLoginForm('restaurant');
        });
        
        // 客户登录表单提交
        $('#customerLoginFormEl').on('submit', (e) => {
            e.preventDefault();
            this.handleCustomerLogin();
        });
        
        // 餐厅登录表单提交
        $('#restaurantLoginFormEl').on('submit', (e) => {
            e.preventDefault();
            this.handleRestaurantLogin();
        });
        
        // 客户注册按钮点击
        $('#customerRegisterBtn').on('click', () => {
            this.showCustomerRegisterForm();
        });
        
        // 餐厅注册按钮点击
        $('#restaurantRegisterBtn').on('click', () => {
            this.showRestaurantRegisterForm();
        });
        
        // 返回客户登录按钮点击
        $('#backToCustomerLoginBtn').on('click', () => {
            this.switchLoginForm('customer');
        });
        
        // 返回餐厅登录按钮点击
        $('#backToRestaurantLoginBtn').on('click', () => {
            this.switchLoginForm('restaurant');
        });
        
        // 客户注册表单提交
        $('#customerRegisterFormEl').on('submit', (e) => {
            e.preventDefault();
            this.handleCustomerRegister();
        });
        
        // 餐厅注册表单提交
        $('#restaurantRegisterFormEl').on('submit', (e) => {
            e.preventDefault();
            this.handleRestaurantRegister();
        });
    },
    
    // 切换登录表单
    switchLoginForm: function(type) {
        if (type === 'customer') {
            $('#customerLoginTab').addClass('active');
            $('#restaurantLoginTab').removeClass('active');
            
            $('#customerLoginForm').removeClass('d-none');
            $('#restaurantLoginForm').addClass('d-none');
            $('#customerRegisterForm').addClass('d-none');
            $('#restaurantRegisterForm').addClass('d-none');
        } else if (type === 'restaurant') {
            $('#restaurantLoginTab').addClass('active');
            $('#customerLoginTab').removeClass('active');
            
            $('#restaurantLoginForm').removeClass('d-none');
            $('#customerLoginForm').addClass('d-none');
            $('#customerRegisterForm').addClass('d-none');
            $('#restaurantRegisterForm').addClass('d-none');
        }
    },
    
    // 显示客户注册表单
    showCustomerRegisterForm: function() {
        $('#customerLoginForm').addClass('d-none');
        $('#restaurantLoginForm').addClass('d-none');
        $('#customerRegisterForm').removeClass('d-none');
        $('#restaurantRegisterForm').addClass('d-none');
    },
    
    // 显示餐厅注册表单
    showRestaurantRegisterForm: function() {
        $('#customerLoginForm').addClass('d-none');
        $('#restaurantLoginForm').addClass('d-none');
        $('#customerRegisterForm').addClass('d-none');
        $('#restaurantRegisterForm').removeClass('d-none');
    },
    
    // 处理登录成功
    handleLoginSuccess: function(data, type) {
        // 确保data中包含avatarBase64字段
        if (!data.avatarBase64) {
            data.avatarBase64 = ''; // 如果没有头像，设置为空字符串
        }
        
        // 保存到本地存储
        localStorage.setItem(`${type}Info`, JSON.stringify(data));
        console.log(`数据 ${JSON.stringify(data)}`);
        // alert("");
        
        // 跳转到成功页面
        const successParams = new URLSearchParams({
            type: '登录成功',
            message: `欢迎回来，${data.name}`,
            next: `${type}.html`
        });
        window.location.href = `success.html?${successParams.toString()}`;
    },
    
    // 处理注册成功
    handleRegisterSuccess: function(type) {
        // 跳转到成功页面
        const successParams = new URLSearchParams({
            type: '注册成功',
            message: '恭喜您注册成功',
            details: type === 'customer' ? '请使用您的手机号和密码登录' : '您的餐厅ID已发送到您的手机，请使用该ID和密码登录',
            next: 'index.html'
        });
        window.location.href = `success.html?${successParams.toString()}`;
    },
    
    // 处理客户登录
    handleCustomerLogin: function() {
        const phone = $('#customerPhone').val().trim();
        const password = $('#customerPassword').val().trim();
        const remember = $('#customerRemember').prop('checked');
        
        if (!phone || !password) {
            this.showError('请填写完整信息\n请输入手机号和密码');
            return;
        }
        
        if (!this.validatePhone(phone)) {
            this.showError('手机号格式不正确\n请输入11位中国大陆手机号');
            return;
        }
        
        if (!this.validatePassword(password)) {
            this.showError('密码长度不足\n密码长度不得少于8位');
            return;
        }
        
        // 显示加载中...
        this.showLoadingIndicator(true);
        
        // 发送请求到后端API
        $.ajax({
            url: '/auth/customer/login',
            type: 'POST',
            data: {
                phone: phone,
                password: password
            },
            success: (response) => {
                this.showLoadingIndicator(false);
                
                if (response.code === 200) {
                    this.handleLoginSuccess(response.data, 'customer');
                } else {
                    this.showError(`登录失败\n${response.message}`);
                }
            },
            error: (xhr) => {
                this.showLoadingIndicator(false);
                this.showError('登录失败\n网络错误或服务器异常');
                console.error('登录请求失败:', xhr);
            }
        });
    },
    
    // 处理餐厅登录
    handleRestaurantLogin: function() {
        const restaurantId = $('#restaurantId').val().trim();
        const password = $('#restaurantPassword').val().trim();
        const loginType = $('#loginType').val();
        
        if (!restaurantId || !password || !loginType) {
            this.showError('请填写完整信息\n请输入餐厅ID、密码并选择登录角色');
            return;
        }
        
        if (!this.validatePassword(password)) {
            this.showError('密码长度不足\n密码长度不得少于8位');
            return;
        }
        
        // 显示加载中...
        this.showLoadingIndicator(true);
        
        // 发送请求到后端API
        $.ajax({
            url: '/auth/restaurant/login',
            type: 'POST',
            data: {
                restaurantId: restaurantId,
                password: password,
                role: loginType
            },
            success: (response) => {
                this.showLoadingIndicator(false);
                if (response.code === 200) {
                    response.data.role = loginType;
                    this.handleLoginSuccess(response.data, 'restaurant');
                } else {
                    this.showError(`登录失败\n${response.message}`);
                }
            },
            error: (xhr) => {
                this.showLoadingIndicator(false);
                this.showError('登录失败\n网络错误或服务器异常');
                console.error('登录请求失败:', xhr);
            }
        });
    },
    
    // 处理客户注册
    handleCustomerRegister: function() {
        const name = $('#registerName').val().trim();
        const phone = $('#registerPhone').val().trim();
        const password = $('#registerPassword').val().trim();
        const confirmPassword = $('#confirmPassword').val().trim();
        
        if (!name || !phone || !password || !confirmPassword) {
            this.showError('请填写完整信息\n请填写所有必填字段');
            return;
        }
        
        if (!this.validatePhone(phone)) {
            this.showError('手机号格式不正确\n请输入11位中国大陆手机号');
            return;
        }
        
        if (!this.validatePassword(password)) {
            this.showError('密码长度不足\n密码长度不得少于8位');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showError('密码不一致\n两次输入的密码不一致，请重新输入');
            return;
        }
        
        // 显示加载中...
        this.showLoadingIndicator(true);
        
        // 发送请求到后端API
        $.ajax({
            url: '/auth/customer/register',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                name: name,
                phone: phone,
                password: password
            }),
            success: (response) => {
                this.showLoadingIndicator(false);
                
                if (response.code === 200) {
                    this.handleRegisterSuccess('customer');
                } else {
                    this.showError(`注册失败\n${response.message}`);
                }
            },
            error: (xhr) => {
                this.showLoadingIndicator(false);
                this.showError('注册失败\n网络错误或服务器异常');
                console.error('注册请求失败:', xhr);
            }
        });
    },
    
    // 处理餐厅注册
    handleRestaurantRegister: function() {
        const name = $('#restaurantName').val().trim();
        const address = $('#restaurantAddress').val().trim();
        const phone = $('#restaurantPhone').val().trim();
        const license = $('#restaurantLicense').val().trim();
        const password = $('#restaurantRegisterPassword').val().trim();
        const confirmPassword = $('#restaurantConfirmPassword').val().trim();
        
        if (!name || !address || !phone || !license || !password || !confirmPassword) {
            this.showError('请填写完整信息\n请填写所有必填字段');
            return;
        }
        
        if (!this.validatePhone(phone)) {
            this.showError('手机号格式不正确\n请输入11位中国大陆手机号');
            return;
        }
        
        if (!this.validatePassword(password)) {
            this.showError('密码长度不足\n密码长度不得少于8位');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showError('密码不一致\n两次输入的密码不一致，请重新输入');
            return;
        }
        
        // 显示加载中...
        this.showLoadingIndicator(true);
        
        // 发送请求到后端API
        $.ajax({
            url: '/auth/restaurant/register',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                name: name,
                address: address,
                phone: phone,
                license: license,
                password: password
            }),
            success: (response) => {
                this.showLoadingIndicator(false);
                
                if (response.code === 200) {
                    this.handleRegisterSuccess('restaurant');
                } else {
                    this.showError(`注册失败\n${response.message}`);
                }
            },
            error: (xhr) => {
                this.showLoadingIndicator(false);
                this.showError('注册失败\n网络错误或服务器异常');
                console.error('注册请求失败:', xhr);
            }
        });
    }
};

// 页面加载完成后初始化
$(document).ready(function() {
    authApp.init();
}); 