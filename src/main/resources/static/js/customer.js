// 客户端点餐系统
const customerApp = {
    // 当前用户信息
    currentUser: null,
    // 当前选中的餐厅
    currentRestaurant: null,
    // 预约信息
    reservation: {
        restaurantId: null,
        tableId: null,
        date: null,
        time: null,
        duration: 2, // 默认2小时
        people: 2,   // 默认2人
        dishes: []
    },

    // 初始化
    init: function () {
        this.checkLogin();
        this.bindEvents();
        this.loadRestaurants(null,null,null);
    },

    // 检查登录状态
    checkLogin: function () {
        const userInfo = localStorage.getItem('customerInfo');
        if (!userInfo) {
            window.location.href = 'index.html';
            return;
        }

        try {
            this.currentUser = JSON.parse(userInfo);
            $('#customerName').text(this.currentUser.name);
            // 更新用户头像显示
            if (this.currentUser.avatarUrl) {
                $('#userAvatar').attr('src', this.currentUser.avatarUrl);
                $('#userAvatar').show();
            } else {
                $('#userAvatar').hide();
            }
            this.switchView('restaurantList');
        } catch (e) {
            console.error('登录信息解析错误', e);
            localStorage.removeItem('customerInfo');
            window.location.href = 'index.html';
        }
    },

    // 绑定事件
    bindEvents: function () {
        // 搜索餐厅
        $('#searchForm').on('submit', (e) => {
            e.preventDefault();
            this.searchRestaurants();
        });

        // 返回餐厅列表
        $('.back-to-list').on('click', () => {
            this.switchView('restaurantList');
        });

        // 退出登录
        $('#logoutBtn').on('click', () => {
            localStorage.removeItem('customerInfo');
            window.location.href = 'index.html';
        });

        // 预订按钮点击事件
        $(document).on('click', '.reserve-btn', (e) => {
            console.log('预约按钮被点击');
            const restaurantId = $(e.currentTarget).data('id');
            console.log('餐厅ID:', restaurantId);
            if (!restaurantId) {
                console.error('未找到餐厅ID');
                this.showError('无法获取餐厅信息，请刷新页面重试');
                return;
            }
            this.loadRestaurantDetail(restaurantId);
        });

        // 餐桌选择
        $(document).on('click', '.table-item', (e) => {
            // 忽略已禁用的餐桌
            if ($(e.currentTarget).hasClass('disabled') || $(e.currentTarget).hasClass('occupied')) {
                return;
            }
            $('.table-item').removeClass('selected');
            $(e.currentTarget).addClass('selected');
            this.reservation.tableId = $(e.currentTarget).data('id');
            this.updateReservationSummary();
        });

        // 日期和时间选择
        $('#reservationDate, #reservationTime, #duration, #peopleCount').on('change', (e) => {
            // 获取之前的值
            const prevDate = this.reservation.date;
            const prevTime = this.reservation.time;
            const prevDuration = this.reservation.duration;
            const prevPeople = this.reservation.people;
            
            // 更新预订信息
            this.reservation.date = $('#reservationDate').val();
            this.reservation.time = $('#reservationTime').val();
            this.reservation.duration = parseInt($('#duration').val());
            this.reservation.people = parseInt($('#peopleCount').val());
            
            // 更新UI反馈
            const changedField = $(e.currentTarget).attr('id');
            if (changedField) {
                // 添加高亮效果
                $(`#${changedField}`).addClass('border-primary');
                setTimeout(() => {
                    $(`#${changedField}`).removeClass('border-primary');
                }, 1000);
                
                // 显示加载指示器
                $('#reservationFormStatus').html(
                    `<div class="alert alert-info">
                        <i class="fas fa-sync fa-spin me-2"></i>
                        正在检查 ${this.reservation.date} ${this.reservation.time} 的可用餐桌...
                    </div>`
                );
            }
            
            // 清除当前选择的餐桌
            if (prevDate !== this.reservation.date || prevTime !== this.reservation.time || 
                prevDuration !== this.reservation.duration) {
                this.reservation.tableId = null;
                $('.table-item').removeClass('selected');
            }
            
            this.updateReservationSummary();
            
            // 确保所有必要的预订信息都已提供，然后更新可用餐桌
            if (this.reservation.date && this.reservation.time && 
                this.reservation.duration && this.reservation.people) {
                // 清空当前餐桌显示，避免显示旧状态
                $('#tableSelection').html('<div class="text-center py-3"><i class="fas fa-spinner fa-spin me-2"></i>加载可用餐桌...</div>');
                // 延迟一点点时间再请求，确保UI先更新
                setTimeout(() => {
                    this.loadAvailableTables();
                }, 100);
            }
        });

        // 菜品数量变更
        $(document).on('change', '.dish-quantity', (e) => {
            const dishId = $(e.currentTarget).data('id');
            const quantity = parseInt($(e.currentTarget).val());

            const index = this.reservation.dishes.findIndex(d => d.id === dishId);
            if (index > -1) {
                if (quantity <= 0) {
                    this.reservation.dishes.splice(index, 1);
                } else {
                    this.reservation.dishes[index].quantity = quantity;
                }
            } else if (quantity > 0) {
                const dish = this.currentRestaurant.menu.find(d => d.id === dishId);
                this.reservation.dishes.push({
                    id: dishId,
                    name: dish.name,
                    price: dish.price,
                    quantity: quantity
                });
            }

            this.updateReservationSummary();
        });

        // 提交预约
        $('#submitReservation').on('click', () => {
            this.submitReservation();
        });
    },

    // 加载餐厅列表
    loadRestaurants: function (keyword, cuisine, rating) {
        console.log('开始加载餐厅列表...');
        $.ajax({
            url: '/restaurants/search',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                keyword: keyword,
                cuisine: cuisine,
                rating: rating
            }),
            success: (response) => {
                console.log('餐厅列表响应数据:', response);
                // 检查响应格式
                if (response.code === 200 && Array.isArray(response.data)) {
                    // 检查每个餐厅的图像URL
                    response.data.forEach(restaurant => {
                        console.log(`餐厅 ${restaurant.name} 的图像URL:`, restaurant.imageUrl);
                    });
                    this.renderRestaurantList(response.data);
                } else {
                    console.error('响应数据格式不正确:', response);
                    this.showError('加载餐厅列表失败\n数据格式错误');
                }
            },
            error: (xhr) => {
                this.showError('加载餐厅列表失败\n网络错误或服务器异常');
                console.error('加载餐厅列表失败:', xhr);
            }
        });

    },

    // 渲染餐厅列表
    renderRestaurantList: function (restaurants) {
        const container = $('#restaurantList .restaurant-container');
        container.empty();

        if (restaurants.length === 0) {
            container.html('<div class="text-center py-5">没有找到符合条件的餐厅</div>');
            return;
        }

        restaurants.forEach(restaurant => {
            const stars = this.generateStars(restaurant.rating);
            const tags = (restaurant.tags || []).map(tag => `<span class="badge bg-light text-dark me-1">${tag}</span>`).join('');
            const waitingTime = restaurant.waitingTime || '';
            const priceLevel = restaurant.priceLevel || '';

            const html = `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card restaurant-card h-100 shadow-sm">
                        <div class="position-relative">
                            <img src="${restaurant.imageUrl}" class="card-img-top" alt="${restaurant.name}">
                            <span class="badge bg-danger position-absolute top-0 end-0 m-2">${waitingTime}</span>
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h5 class="card-title mb-0">${restaurant.name}</h5>
                                <span class="text-muted">${priceLevel}</span>
                            </div>
                            <div class="mb-2">${stars}</div>
                            <p class="card-text text-muted small mb-2">${restaurant.cuisine || ''} · ${restaurant.address || ''}</p>
                            <div class="mb-3">${tags}</div>
                            <button class="btn btn-primary reserve-btn w-100" data-id="${restaurant.id}">立即预约</button>
                        </div>
                    </div>
                </div>
            `;

            container.append(html);
        });
    },

    // 生成星级评分
    generateStars: function (rating) {
        let stars = '';
        const fullStars = Math.floor(rating);
        const halfStar = rating - fullStars >= 0.5;

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars += '<i class="fas fa-star text-warning"></i>';
            } else if (i === fullStars + 1 && halfStar) {
                stars += '<i class="fas fa-star-half-alt text-warning"></i>';
            } else {
                stars += '<i class="far fa-star text-warning"></i>';
            }
        }

        return `<div class="rating">${stars} <span class="text-muted ms-1">${rating}</span></div>`;
    },

    // 搜索餐厅
    searchRestaurants: function () {
        let keyword = $('#searchKeyword').val().trim().toLowerCase();
        let cuisine = $('#cuisineFilter').val().trim();
        let rating = $('#ratingFilter').val().trim();

        // 将空字符串设为 null
        keyword = keyword === "" ? null : keyword;
        cuisine = cuisine === "" ? null : cuisine;
        rating = rating === "" ? null : parseFloat(rating);

        // 加载所有餐厅然后前端过滤
        // 实际项目中应该发送到服务器进行搜索
        this.loadRestaurants(keyword, cuisine, rating); // 先加载所有

        console.log(keyword, cuisine, rating);
        // 简单过滤
        if (keyword || cuisine || rating) {
            const restaurants = $('.restaurant-card').parent();

            restaurants.each((index, elem) => {
                const $elem = $(elem);
                const cardText = $elem.text().toLowerCase();
                const restaurantRating = parseFloat($elem.find('.rating span').text());
                const restaurantCuisine = $elem.find('.card-text').text();

                let show = true;

                if (keyword && !cardText.includes(keyword)) {
                    show = false;
                }

                if (cuisine && cuisine !== 'all' && !restaurantCuisine.includes(cuisine)) {
                    show = false;
                }

                if (rating && restaurantRating < parseFloat(rating)) {
                    show = false;
                }

                $elem.toggle(show);
            });
        }
    },

    // 加载餐厅详情
    loadRestaurantDetail: function (restaurantId) {
        console.log('开始加载餐厅详情，ID:', restaurantId);
        $.ajax({
            url: `/restaurants/${restaurantId}`,
            type: 'GET',
            success: (response) => {
                console.log('餐厅详情响应:', response);
                if (response.code === 200) {
                    this.currentRestaurant = response.data;
                    this.reservation.restaurantId = restaurantId;
                    this.renderRestaurantDetail();
                    
                    // 在餐厅详情加载成功后，单独请求餐桌状态
                    this.loadTableStatus(restaurantId);
                    
                    this.switchView('restaurantDetail');
                } else {
                    console.error('加载餐厅详情失败:', response.message);
                    this.showError('加载餐厅详情失败\n' + response.message);
                }
            },
            error: (xhr) => {
                console.error('加载餐厅详情失败:', xhr);
                this.showError('加载餐厅详情失败\n网络错误或服务器异常');
            }
        });
    },

    // 渲染餐厅详情
    renderRestaurantDetail: function () {
        // 餐厅基本信息
        $('#restaurantDetailName').text(this.currentRestaurant.name);
        $('#restaurantDetailCuisine').text(this.currentRestaurant.cuisine);
        $('#restaurantDetailAddress').text(this.currentRestaurant.address);
        $('#restaurantDetailPhone').text(this.currentRestaurant.phone);
        $('#restaurantDetailHours').text(this.currentRestaurant.businessHours);
        $('#restaurantDetailRating').html(this.generateStars(this.currentRestaurant.rating));
        $('#restaurantDetailIntro').text(this.currentRestaurant.introduction);
        $('#restaurantPanorama').attr('src', this.currentRestaurant.panoramaUrl);

        // 餐桌选择区域显示加载提示
        $('#tableSelection').html('<div class="text-center py-3"><i class="fas fa-spinner fa-spin me-2"></i>加载餐桌信息...</div>');
        
        // 添加预订表单状态显示区域
        if (!$('#reservationFormStatus').length) {
            $('#reservationForm').prepend('<div id="reservationFormStatus" class="mb-3"></div>');
        } else {
            $('#reservationFormStatus').empty();
        }

        // 渲染菜单
        if (this.currentRestaurant.menu && Array.isArray(this.currentRestaurant.menu)) {
            this.renderMenu(this.currentRestaurant.menu);
        } else {
            $('#menuItems').html('<div class="alert alert-info">暂无菜单信息</div>');
        }

        // 初始化预约表单
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        $('#reservationDate').val(formattedDate).attr('min', formattedDate);
        $('#reservationTime').val('18:00');
        $('#duration').val('2');
        $('#peopleCount').val('2');

        // 重置预约信息
        this.reservation = {
            restaurantId: this.currentRestaurant.id,
            tableId: null,
            date: formattedDate,
            time: '18:00',
            duration: 2,
            people: 2,
            dishes: []
        };

        // 更新预约摘要
        this.updateReservationSummary();
    },

    // 加载餐桌状态
    loadTableStatus: function(restaurantId) {
        console.log('开始加载餐桌状态，餐厅ID:', restaurantId);
        $.ajax({
            url: `/api/tables/restaurant/${restaurantId}`,
            type: 'GET',
            success: (response) => {
                console.log('餐桌状态响应:', response);
                if (response.code === 200) {
                    // 更新当前餐厅的餐桌信息
                    this.currentRestaurant.tables = response.data;
                    
                    // 确保有日期和时间信息
                    const date = this.reservation.date;
                    const time = this.reservation.time;
                    
                    this.renderTables(response.data, date, time);
                } else {
                    console.error('加载餐桌状态失败:', response.message);
                    this.showError('加载餐桌状态失败\n' + response.message);
                }
            },
            error: (xhr) => {
                console.error('加载餐桌状态失败:', xhr);
                this.showError('加载餐桌状态失败\n网络错误或服务器异常');
            }
        });
    },

    // 加载可用餐桌
    loadAvailableTables: function () {
        const date = $('#reservationDate').val();
        const time = $('#reservationTime').val();
        const duration = parseInt($('#duration').val());
        const people = parseInt($('#peopleCount').val());

        if (!date || !time || !people) {
            return;
        }

        console.log('加载可用餐桌 - 日期:', date, '时间:', time, '人数:', people, '时长:', duration);
        
        // 清除已选择的餐桌
        this.reservation.tableId = null;
        this.updateReservationSummary();
        
        // 加载中提示
        $('#tableSelection').html('<div class="text-center py-3"><i class="fas fa-spinner fa-spin me-2"></i>加载可用餐桌...</div>');
        
        $.ajax({
            url: `/api/tables/restaurant/${this.reservation.restaurantId}/available`,
            type: 'GET',
            data: {
                date: date,
                time: time,
                duration: duration,
                people: people
            },
            success: (response) => {
                if (response.code === 200) {
                    console.log('收到餐桌可用性数据:', response.data);
                    
                    // 确保清空所有选中状态
                    $('.table-item').removeClass('selected');
                    
                    // 更新餐桌状态并渲染
                    this.renderTables(response.data, date, time);
                    
                    // 更新表单状态
                    $('#reservationFormStatus').html(
                        `<div class="alert alert-success">
                            <i class="fas fa-check-circle me-2"></i>
                            已更新 ${date} ${time} 的可用餐桌信息
                        </div>`
                    );
                    // 3秒后自动隐藏
                    setTimeout(() => {
                        $('#reservationFormStatus').empty();
                    }, 3000);
                } else {
                    this.showError('加载可用餐桌失败: ' + response.message);
                    $('#tableSelection').html('<div class="alert alert-warning">加载可用餐桌失败，请稍后重试</div>');
                }
            },
            error: (xhr, status, error) => {
                console.error('加载可用餐桌失败:', error);
                this.showError('加载可用餐桌失败，请刷新页面重试');
                $('#tableSelection').html('<div class="alert alert-warning">加载可用餐桌失败，请稍后重试</div>');
            }
        });
    },

    // 渲染餐桌选择
    renderTables: function (tables, date, time) {
        const container = $('#tableSelection');
        container.empty();

        // 确保有日期和时间信息，如果没有则使用默认值
        if (!date) {
            const today = new Date();
            date = today.toISOString().split('T')[0]; // 格式：YYYY-MM-DD
        }
        if (!time) {
            time = '18:00'; // 默认晚餐时间
        }

        if (!tables || tables.length === 0) {
            container.html('<div class="alert alert-info">暂无可用餐桌</div>');
            return;
        }

        // 统计可用和不可用餐桌
        const availableTables = tables.filter(table => table.status === 'available');
        const unavailableTables = tables.filter(table => table.status !== 'available');
        
        if (availableTables.length === 0) {
            container.html(`
                <div class="alert alert-warning mb-4">
                    在 ${date} ${time} 选定的时间段内没有可用餐桌。请尝试选择其他时间。
                </div>
            `);
        } else {
            // 添加可用餐桌提示
            container.append(`
                <div class="mb-4">
                    <h5 class="text-success">
                        <i class="fas fa-check-circle me-2"></i>可用餐桌 (${availableTables.length})
                    </h5>
                    <p class="small text-muted mb-3">在 ${date} ${time} 时间段，以下餐桌可以预订：</p>
                    <div class="row" id="availableTablesContainer"></div>
                </div>
            `);
            
            // 渲染可用餐桌
            const availableContainer = $('#availableTablesContainer');
            availableTables.forEach(table => {
                const html = `
                    <div class="col-6 col-md-4 mb-3">
                        <div class="table-item available" data-id="${table.id}">
                            <div class="table-icon">
                                <i class="fas fa-utensils"></i>
                            </div>
                            <div class="table-info">
                                <div class="table-name">${table.name}</div>
                                <div class="table-capacity"><i class="fas fa-user"></i> ${table.capacity}人</div>
                            </div>
                        </div>
                    </div>
                `;
                availableContainer.append(html);
            });
        }
        
        // 如果有不可用餐桌，也显示出来但禁用选择
        if (unavailableTables.length > 0) {
            container.append(`
                <div class="mt-4">
                    <h5 class="text-danger">
                        <i class="fas fa-times-circle me-2"></i>不可用餐桌 (${unavailableTables.length})
                    </h5>
                    <p class="small text-muted mb-3">这些餐桌在选定的时间段内已被预订：</p>
                    <div class="row" id="unavailableTablesContainer"></div>
                </div>
            `);
            
            // 渲染不可用餐桌
            const unavailableContainer = $('#unavailableTablesContainer');
            unavailableTables.forEach(table => {
                let statusText = "";
                if (table.status === 'occupied') {
                    statusText = "已占用";
                } else if (table.status === 'reserved') {
                    statusText = "已预订";
                } else if (table.status === 'timeslot_unavailable') {
                    statusText = "该时段已预订";
                } else {
                    statusText = "不可用";
                }
                
                const html = `
                    <div class="col-6 col-md-4 mb-3">
                        <div class="table-item occupied disabled" data-id="${table.id}">
                            <div class="table-icon">
                                <i class="fas fa-utensils"></i>
                            </div>
                            <div class="table-info">
                                <div class="table-name">${table.name}</div>
                                <div class="table-capacity"><i class="fas fa-user"></i> ${table.capacity}人</div>
                                <div class="table-status small text-danger">${statusText}</div>
                            </div>
                        </div>
                    </div>
                `;
                unavailableContainer.append(html);
            });
        }
    },

    // 渲染菜单
    renderMenu: function (menu) {
        const container = $('#menuItems');
        container.empty();

        // 按分类分组菜品
        const categories = {};
        menu.forEach(dish => {
            if (!categories[dish.category]) {
                categories[dish.category] = [];
            }
            categories[dish.category].push(dish);
        });

        // 渲染每个分类
        Object.keys(categories).forEach(category => {
            const categoryHtml = `
                <div class="menu-category mb-4">
                    <h5 class="category-title mb-3">${category}</h5>
                    <div class="row">
                        ${categories[category].map(dish => this.renderDishItem(dish)).join('')}
                    </div>
                </div>
            `;

            container.append(categoryHtml);
        });
    },

    // 渲染单个菜品
    renderDishItem: function (dish) {
        return `
            <div class="col-md-6 mb-3">
                <div class="card dish-card">
                    <div class="row g-0">
                        <div class="col-4">
                            <img src="${dish.imageUrl}" class="dish-img" alt="${dish.name}">
                        </div>
                        <div class="col-8">
                            <div class="card-body py-2">
                                <h6 class="card-title mb-1">${dish.name}</h6>
                                <p class="card-text small text-muted mb-2 dish-desc">${dish.description}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="dish-price">¥${dish.price}</span>
                                    <div class="dish-quantity-control">
                                        <button type="button" class="btn btn-sm btn-outline-primary dish-btn" onclick="customerApp.adjustDishQuantity(${dish.id}, -1)">-</button>
                                        <input type="number" class="form-control form-control-sm dish-quantity" value="0" min="0" max="99" data-id="${dish.id}">
                                        <button type="button" class="btn btn-sm btn-outline-primary dish-btn" onclick="customerApp.adjustDishQuantity(${dish.id}, 1)">+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // 调整菜品数量
    adjustDishQuantity: function (dishId, change) {
        const input = $(`.dish-quantity[data-id="${dishId}"]`);
        let value = parseInt(input.val()) + change;
        value = Math.max(0, Math.min(99, value));
        input.val(value).trigger('change');
    },

    // 更新预约摘要
    updateReservationSummary: function () {
        const summary = $('#reservationSummary');

        // 如果没有选择餐桌，显示提示
        if (!this.reservation.tableId) {
            summary.html('<div class="alert alert-warning">请选择餐桌</div>');
            $('#submitReservation').prop('disabled', true);
            return;
        }

        // 计算总价
        let totalPrice = 0;
        let dishesHtml = '';

        if (this.reservation.dishes.length > 0) {
            dishesHtml = `
                <div class="reservation-dishes mb-3">
                    <h6>已选菜品：</h6>
                    <ul class="list-group list-group-flush">
                        ${this.reservation.dishes.map(dish => {
                const subtotal = dish.price * dish.quantity;
                totalPrice += subtotal;
                return `
                                <li class="list-group-item d-flex justify-content-between align-items-center p-2">
                                    <span>${dish.name} x${dish.quantity}</span>
                                    <span class="text-primary">¥${subtotal}</span>
                                </li>
                            `;
            }).join('')}
                    </ul>
                </div>
            `;
        }

        // 计算餐桌费用
        const table = this.currentRestaurant.tables.find(t => t.id === this.reservation.tableId);
        const tablePrice = table.capacity * 20; // 假设每人20元餐位费
        totalPrice += tablePrice;

        const html = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title mb-3">预约摘要</h5>
                    <div class="reservation-details mb-3">
                        <p><strong>餐厅：</strong>${this.currentRestaurant.name}</p>
                        <p><strong>餐桌：</strong>${table.name}（${table.capacity}人桌）</p>
                        <p><strong>日期：</strong>${this.reservation.date}</p>
                        <p><strong>时间：</strong>${this.reservation.time}（${this.reservation.duration}小时）</p>
                        <p><strong>人数：</strong>${this.reservation.people}人</p>
                    </div>
                    
                    ${dishesHtml}
                    
                    <div class="reservation-price">
                        <div class="d-flex justify-content-between mb-2">
                            <span>餐位费：</span>
                            <span>¥${tablePrice}</span>
                        </div>
                        <div class="d-flex justify-content-between fw-bold">
                            <span>总计：</span>
                            <span class="text-primary">¥${totalPrice}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        summary.html(html);
        $('#submitReservation').prop('disabled', false);
    },

    // 提交预订
    submitReservation: function () {
        if (!this.validateReservation()) {
            return;
        }

        // 最后再次检查餐桌是否可用
        this.checkTableAvailabilityBeforeSubmit();
    },
    
    // 检查餐桌可用性后提交预订
    checkTableAvailabilityBeforeSubmit: function() {
        // 显示加载状态
        $('#submitReservation').prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>提交中...');
        
        // 再次检查餐桌可用性
        $.ajax({
            url: `/api/tables/restaurant/${this.reservation.restaurantId}/available`,
            type: 'GET',
            data: {
                date: this.reservation.date,
                time: this.reservation.time,
                duration: this.reservation.duration,
                people: this.reservation.people
            },
            success: (response) => {
                if (response.code === 200) {
                    // 检查所选餐桌是否仍然可用
                    const selectedTable = response.data.find(table => 
                        table.id === this.reservation.tableId && table.status === 'available');
                    
                    if (selectedTable) {
                        // 餐桌仍然可用，提交预订
                        this.doSubmitReservation();
                    } else {
                        // 餐桌已不可用
                        $('#submitReservation').prop('disabled', false).text('提交预订');
                        this.showError('您选择的餐桌刚刚被预订，请重新选择餐桌');
                        
                        // 重新渲染可用餐桌
                        this.renderTables(response.data, this.reservation.date, this.reservation.time);
                        
                        // 清除已选择的餐桌
                        this.reservation.tableId = null;
                        this.updateReservationSummary();
                    }
                } else {
                    // 检查失败，允许继续提交
                    $('#submitReservation').prop('disabled', false).text('提交预订');
                    console.warn('检查餐桌可用性失败，继续提交:', response.message);
                    this.doSubmitReservation();
                }
            },
            error: (xhr) => {
                // 检查失败，允许继续提交
                $('#submitReservation').prop('disabled', false).text('提交预订');
                console.warn('检查餐桌可用性失败，继续提交:', xhr);
                this.doSubmitReservation();
            }
        });
    },
    
    // 执行预订提交
    doSubmitReservation: function() {
        const reservationData = {
            restaurantId: this.reservation.restaurantId,
            restaurantName: " ",
            tableId: this.reservation.tableId,
            userId: this.currentUser.id,
            reservationDate: this.reservation.date,
            reservationTime: this.reservation.time,
            duration: this.reservation.duration,
            peopleCount: this.reservation.people,
            dishes: this.reservation.dishes
        };
        
        console.log(reservationData);
        
        $.ajax({
            url: '/reservations',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(reservationData),
            success: (response) => {
                if (response.code === 200) {
                    // 预订成功后添加时间段
                    this.addReservationTimeSlot(this.reservation.tableId, response.data.id, this.reservation.date, this.reservation.time, this.reservation.duration, () => {
                        // 更新时间段成功后跳转到成功页面
                        const successParams = new URLSearchParams({
                            type: '预订成功',
                            message: '您的预订已成功提交',
                            details: `预订编号：${response.data.id}`,
                            next: 'history.html'
                        });
                        window.location.href = `success.html?${successParams.toString()}`;
                    });
                } else {
                    $('#submitReservation').prop('disabled', false).text('提交预订');
                    this.showError('提交预订失败\n' + response.message);
                }
            },
            error: (xhr) => {
                $('#submitReservation').prop('disabled', false).text('提交预订');
                this.showError('提交预订失败\n网络错误或服务器异常');
                console.error('提交预订失败:', xhr);
            }
        });
    },

    // 添加餐桌预订时间段
    addReservationTimeSlot: function(tableId, reservationId, date, time, duration, callback) {
        console.log('添加餐桌预订时间段 - 餐桌ID:', tableId, '预订ID:', reservationId, '日期:', date, '时间:', time, '时长:', duration);
        $.ajax({
            url: `/api/tables/${tableId}/reservationTimeSlot`,
            type: 'POST',
            data: { 
                reservationId: reservationId,
                date: date,
                time: time,
                duration: duration
            },
            success: (response) => {
                if (response.code === 200) {
                    console.log('餐桌预订时间段已添加');
                    if (callback) callback();
                } else {
                    console.error('添加餐桌预订时间段失败:', response.message);
                    this.showError('添加餐桌预订时间段失败，但预订已成功提交');
                    if (callback) callback();
                }
            },
            error: (xhr) => {
                console.error('添加餐桌预订时间段失败:', xhr);
                this.showError('添加餐桌预订时间段失败，但预订已成功提交');
                if (callback) callback();
            }
        });
    },

    // 验证预约信息
    validateReservation: function () {
        if (!this.reservation.restaurantId) {
            this.showError('请选择餐厅');
            return false;
        }

        if (!this.reservation.tableId) {
            this.showError('请选择餐桌');
            return false;
        }

        if (!this.reservation.date) {
            this.showError('请选择日期');
            return false;
        }

        if (!this.reservation.time) {
            this.showError('请选择时间');
            return false;
        }

        if (!this.reservation.people || this.reservation.people < 1) {
            this.showError('请输入正确的用餐人数');
            return false;
        }

        // 验证日期是否合法（不能选择过去的日期）
        const selectedDate = new Date(this.reservation.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            this.showError('不能选择过去的日期');
            return false;
        }

        return true;
    },

    // 显示错误信息
    showError: function (message) {
        Swal.fire({
            icon: 'error',
            title: '错误',
            text: message,
            timer: 3000,
            showConfirmButton: false
        });
    },

    // 切换视图
    switchView: function (viewName) {
        $('.main-view').addClass('d-none');
        $(`#${viewName}`).removeClass('d-none');

        // 滚动到顶部
        window.scrollTo(0, 0);
    }
};

// 页面加载完成后初始化
$(document).ready(function () {
    customerApp.init();
}); 