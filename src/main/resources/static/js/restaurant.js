// 餐厅管理系统
const restaurantApp = {
    // 当前用户信息
    currentUser: null,
    // 当前订单
    currentOrder: null,
    // 初始状态
    isReceptionMode: true, // true: 接待模式, false: 后厨模式

    // 初始化
    init: function() {
        this.checkLogin();
        this.bindEvents();
    },
    
    // 检查登录状态
    checkLogin: function() {
        const userInfo = localStorage.getItem('restaurantInfo');
        if (!userInfo) {
            window.location.href = 'index.html';
            return;
        }
        
        try {
            this.currentUser = JSON.parse(userInfo);
            $('#restaurantName').text(this.currentUser.name);
            
            // 根据角色显示不同界面
            if (this.currentUser.role === 'frontDesk') {
                this.isReceptionMode = true;
                this.loadReservations();
                this.loadTables();
                $('#receptionView').removeClass('d-none');
                $('#kitchenView').addClass('d-none');
            } else if (this.currentUser.role === 'kitchen') {
                this.isReceptionMode = false;
                this.loadOrders();
                $('#kitchenView').removeClass('d-none');
                $('#receptionView').addClass('d-none');
            }
        } catch (e) {
            console.error('登录信息解析错误', e);
            localStorage.removeItem('restaurantInfo');
            window.location.href = 'index.html';
        }
    },
    
    // 绑定事件
    bindEvents: function() {
        // 退出登录
        $('#logoutBtn').on('click', () => {
            localStorage.removeItem('restaurantInfo');
            window.location.href = 'index.html';
        });
        
        // 搜索预约
        $('#searchReservation').on('submit', (e) => {
            e.preventDefault();
            this.searchReservation();
        });
        
        // 确认到店按钮点击
        $(document).on('click', '.confirm-arrival-btn', (e) => {
            const reservationId = $(e.currentTarget).data('id');
            this.showConfirmArrivalModal(reservationId);
        });
        
        // 预约详情中的确认到店按钮
        $('#confirmArrivalBtn').on('click', () => {
            const reservationId = $('#detailReservationId').text();
            $('#reservationDetailModal').modal('hide');
            this.showConfirmArrivalModal(reservationId);
        });
        
        // 确认到店模态框中的确认按钮
        $('#confirmArrivalSubmitBtn').on('click', () => {
            const reservationId = $('#arrivalReservationId').text();
            this.confirmArrival(reservationId);
        });
        
        // 新增临时客户
        $('#addWalkInForm').on('submit', (e) => {
            e.preventDefault();
            this.addWalkInCustomer();
        });
        
        // 结账离店
        $(document).on('click', '.checkout-btn', (e) => {
            const tableId = $(e.currentTarget).data('table');
            this.checkoutTable(tableId);
        });
        
        // 后厨：更新菜品状态
        $(document).on('change', '.dish-status', (e) => {
            const dishId = $(e.currentTarget).data('id');
            const status = $(e.currentTarget).val();
            this.updateDishStatus(dishId, status);
        });
        
        // 后厨：完成所有菜品按钮点击
        $(document).on('click', '.complete-order-btn', (e) => {
            const orderId = $(e.currentTarget).data('id');
            this.showCompleteOrderModal(orderId);
        });
        
        // 完成订单模态框中的确认按钮
        $('#completeOrderSubmitBtn').on('click', () => {
            const orderId = $('#completeOrderId').text();
            this.completeOrder(orderId);
        });
        
        // 结账离店模态框中的确认按钮
        $('#checkoutSubmitBtn').on('click', () => {
            this.confirmCheckout();
        });

        // 刷新餐桌状态
        $('#refreshTablesBtn').on('click', () => {
            this.loadTables();
        });
        
        // 餐桌可用性查询
        $('#tableAvailabilityForm').on('submit', (e) => {
            e.preventDefault();
            this.checkTableAvailability();
        });
        
        // 设置日期时间选择器的默认值为当前时间
        this.setDefaultDateTime();
    },
    
    // 设置日期时间选择器的默认值为当前时间
    setDefaultDateTime: function() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
        
        $('#tableDate').val(today);
        $('#tableTime').val(currentTime);
    },
    
    // 查询指定时间可用餐桌
    checkTableAvailability: function() {
        const restaurantId = this.currentUser.id;
        const date = $('#tableDate').val();
        const time = $('#tableTime').val();
        
        if (!date || !time) {
            this.showError('请选择日期和时间');
            return;
        }
        
        // 显示加载中
        $('#tableStatus').html('<div class="col-12"><div class="alert alert-info">正在查询可用餐桌...</div></div>');
        
        // 查询餐桌可用性
        $.ajax({
            url: `/tables/restaurant/${restaurantId}`,
            method: 'GET',
            data: { 
                date: date,
                time: time
            },
            success: (response) => {
                if (response.code === 200) {
                    this.renderTables(response.data);
                    this.showSuccess(`已显示 ${date} ${time} 可用餐桌`);
                } else {
                    console.error('查询餐桌可用性失败:', response.message);
                    $('#tableStatus').html(`<div class="col-12"><div class="alert alert-danger">查询失败: ${response.message}</div></div>`);
                }
            },
            error: (xhr, status, error) => {
                console.error('查询餐桌可用性失败:', error);
                $('#tableStatus').html('<div class="col-12"><div class="alert alert-danger">查询失败，请稍后重试</div></div>');
            }
        });
    },
    
    // 加载预约列表
    loadReservations: function() {
        const restaurantId = this.currentUser.id;
        const today = new Date().toISOString().split('T')[0]; // 获取当前日期，格式为YYYY-MM-DD
        
        // 显示加载中
        $('#reservationList').html('<tr><td colspan="7" class="text-center">加载中...</td></tr>');
        
        // 从后端获取预约数据
        $.ajax({
            url: `/reservations/restaurant/${restaurantId}?date=${today}`,
            method: 'GET',
            success: (response) => {
                if (response.code === 200) {
                    this.renderReservations(response.data);
                } else {
                    console.error('获取预约列表失败:', response.message);
                    $('#reservationList').html(`<tr><td colspan="7" class="text-center">获取预约失败: ${response.message}</td></tr>`);
                }
            },
            error: (xhr, status, error) => {
                console.error('获取预约列表失败:', error);
                $('#reservationList').html('<tr><td colspan="7" class="text-center">获取预约失败，请刷新页面重试</td></tr>');
            }
        });
    },
    
    // 渲染预约列表
    renderReservations: function(reservations) {
        const container = $('#reservationList');
        container.empty();
        
        if (reservations.length === 0) {
            container.html('<tr><td colspan="7" class="text-center">暂无预约</td></tr>');
            return;
        }
        
        reservations.forEach(reservation => {
            // 处理日期时间显示
            let displayTime = '';
            if (reservation.reservationDate && reservation.reservationTime) {
                displayTime = `${reservation.reservationDate} ${reservation.reservationTime}`;
            } else if (reservation.date && reservation.time) {
                displayTime = `${reservation.date} ${reservation.time}`;
            }
            
            // 处理客户名称
            const customerName = reservation.customerName || '匿名客户';
            
            // 处理电话号码
            const phone = reservation.phone || '未提供';
            
            // 处理人数和餐桌显示
            const peopleCount = reservation.peopleCount || reservation.people || 0;
            const tableName = reservation.tableName || `餐桌 #${reservation.tableId}`;
            
            // 处理预约状态
            const status = reservation.status || 'pending';
            const statusBadge = this.getStatusBadge(status);
            
            // 确认到店按钮
            const actionButton = status === 'pending' 
                ? `<button class="btn btn-sm btn-success confirm-arrival-btn" data-id="${reservation.id}">确认到店</button>` 
                : '';
            
            const row = `
                <tr>
                    <td>${reservation.id}</td>
                    <td>${customerName}</td>
                    <td>${phone}</td>
                    <td>${displayTime}</td>
                    <td>${peopleCount}人 / ${tableName}</td>
                    <td>${statusBadge}</td>
                    <td>${actionButton}</td>
                </tr>
            `;
            
            container.append(row);
        });
    },
    
    // 获取状态徽章
    getStatusBadge: function(status) {
        switch (status) {
            case 'pending':
                return '<span class="badge bg-warning">待到店</span>';
            case 'confirmed':
                return '<span class="badge bg-success">已到店</span>';
            case 'cancelled':
                return '<span class="badge bg-danger">已取消</span>';
            case 'completed':
                return '<span class="badge bg-info">已完成</span>';
            default:
                return '<span class="badge bg-secondary">未知</span>';
        }
    },
    
    // 搜索预约
    searchReservation: function() {
        const reservationId = $('#reservationId').val().trim();
        
        if (!reservationId) {
            alert('请输入预约编号\n请输入客户提供的预约编号进行查询');
            return;
        }
        
        // 模拟搜索
        // 实际项目中应从服务器获取预约信息
        // 这里模拟找到了预约信息
        const found = true;
        const reservation = {
            id: parseInt(reservationId),
            customerName: '王先生',
            phone: '138****1234',
            time: '2023-05-15 18:00',
            people: 4,
            tableId: 1,
            tableName: '大厅1号桌',
            status: 'pending',
            dishes: [
                { id: 101, name: '白切鸡', price: 68, quantity: 1 },
                { id: 102, name: '清蒸鱼', price: 108, quantity: 1 },
                { id: 104, name: '蜜汁叉烧包', price: 28, quantity: 2 }
            ]
        };
        
        // 使用新的验证预约模态框显示结果
        if (found) {
            // 显示预约已找到的界面
            $('#reservationFound').removeClass('d-none');
            $('#reservationNotFound').addClass('d-none');
            $('#viewReservationDetailsBtn').removeClass('d-none');
            
            // 设置预约信息
            $('#verifyReservationId').text(reservation.id);
            $('#verifyCustomerName').text(reservation.customerName);
            $('#verifyReservationTime').text(reservation.time);
            $('#verifyTableName').text(reservation.tableName);
            
            // 绑定查看详情按钮事件
            $('#viewReservationDetailsBtn').off('click').on('click', () => {
                $('#verifyReservationModal').modal('hide');
                this.showReservationDetail(reservation);
            });
        } else {
            // 显示预约未找到的界面
            $('#reservationFound').addClass('d-none');
            $('#reservationNotFound').removeClass('d-none');
            $('#viewReservationDetailsBtn').addClass('d-none');
        }
        
        // 显示验证预约模态框
        $('#verifyReservationModal').modal('show');
    },
    
    // 显示预约详情
    showReservationDetail: function(reservation) {
        const modal = $('#reservationDetailModal');
        
        // 设置基本信息
        $('#detailReservationId').text(reservation.id);
        $('#detailCustomerName').text(reservation.customerName);
        $('#detailPhone').text(reservation.phone);
        $('#detailTime').text(reservation.time);
        $('#detailPeople').text(reservation.people);
        $('#detailTable').text(reservation.tableName);
        $('#detailStatus').html(this.getStatusBadge(reservation.status));
        
        // 设置菜品清单
        const dishesContainer = $('#detailDishes');
        dishesContainer.empty();
        
        if (reservation.dishes && reservation.dishes.length > 0) {
            let totalPrice = 0;
            
            reservation.dishes.forEach(dish => {
                const subtotal = dish.price * dish.quantity;
                totalPrice += subtotal;
                
                const row = `
                    <tr>
                        <td>${dish.name}</td>
                        <td>¥${dish.price}</td>
                        <td>${dish.quantity}</td>
                        <td>¥${subtotal}</td>
                    </tr>
                `;
                
                dishesContainer.append(row);
            });
            
            $('#detailTotal').text(`¥${totalPrice}`);
        } else {
            dishesContainer.html('<tr><td colspan="4" class="text-center">暂无预点菜品</td></tr>');
            $('#detailTotal').text('¥0');
        }
        
        // 显示到店按钮
        if (reservation.status === 'pending') {
            $('#confirmArrivalBtn').data('id', reservation.id).show();
        } else {
            $('#confirmArrivalBtn').hide();
        }
        
        // 显示模态框
        modal.modal('show');
    },
    
    // 显示确认到店模态框
    showConfirmArrivalModal: function(reservationId) {
        // 模拟获取预约信息
        // 实际项目中应从服务器获取
        const reservation = {
            id: reservationId,
            customerName: '王先生',
            tableName: '大厅1号桌'
        };
        
        // 设置模态框信息
        $('#arrivalReservationId').text(reservation.id);
        $('#arrivalCustomerName').text(reservation.customerName);
        $('#arrivalTableName').text(reservation.tableName);
        
        // 显示模态框
        $('#confirmArrivalModal').modal('show');
    },
    
    // 确认到店
    confirmArrival: function(reservationId) {
        $.ajax({
            url: '/reservations/' + reservationId + '/confirm-arrival',
            method: 'POST',
            success: (response) => {
                if (response.code === 200) {
                    $('#confirmArrivalModal').modal('hide');
                    this.showSuccess('确认成功，已通知后厨准备菜品');
                    // 重新加载预约列表和餐桌状态
                    this.loadReservations();
                    this.loadTables();
                } else {
                    this.showError('确认失败: ' + response.message);
                }
            },
            error: (xhr, status, error) => {
                console.error('确认到店失败:', error);
                this.showError('确认失败，请重试');
            }
        });
    },
    
    // 加载餐桌状态
    loadTables: function() {
        const restaurantId = this.currentUser.id;
        if (!restaurantId) {
            console.error('无法获取餐厅ID');
            return;
        }

        // 显示加载中
        $('#tableStatus').html('<div class="col-12"><div class="alert alert-info">正在加载餐桌信息...</div></div>');

        // 获取当前日期和时间
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

        // 更新日期时间选择器的值
        $('#tableDate').val(today);
        $('#tableTime').val(currentTime);

        // 从后端获取餐桌数据
        $.ajax({
            url: `/tables/restaurant/${restaurantId}`,
            method: 'GET',
            data: { 
                date: today,
                time: currentTime 
            },
            success: (response) => {
                if (response.code === 200) {
                    this.renderTables(response.data);
                } else {
                    console.error('获取餐桌状态失败:', response.message);
                    $('#tableStatus').html(`<div class="col-12"><div class="alert alert-danger">获取餐桌状态失败: ${response.message}</div></div>`);
                }
            },
            error: (xhr, status, error) => {
                console.error('获取餐桌状态失败:', error);
                $('#tableStatus').html('<div class="col-12"><div class="alert alert-danger">获取餐桌状态失败，请刷新页面重试</div></div>');
            }
        });
    },
    
    // 渲染餐桌状态
    renderTables: function(tables) {
        const container = $('#tableStatus');
        container.empty();
        
        if (!tables || tables.length === 0) {
            container.html('<div class="col-12"><div class="alert alert-info">暂无餐桌信息</div></div>');
            return;
        }
        
        tables.forEach(table => {
            let statusClass = '';
            let statusText = '';
            let tableInfo = '';
            let actionButton = '';
            
            // 处理状态，默认为available
            const status = table.status || 'available';
            
            switch (status) {
                case 'available':
                    statusClass = 'bg-success';
                    statusText = '空闲';
                    actionButton = `
                        <button class="btn btn-sm btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#addWalkInModal" data-table="${table.id}">
                            安排入座
                        </button>
                    `;
                    break;
                case 'reserved':
                    statusClass = 'bg-warning';
                    statusText = '已预约';
                    
                    // 预约时间显示
                    let reservationTime = '';
                    if (table.reservationDetails && table.reservationDetails.length > 0) {
                        const nextReservation = table.reservationDetails[0];
                        reservationTime = nextReservation.reservationTime || nextReservation.time || '';
                        if (nextReservation.reservationDate || nextReservation.date) {
                            reservationTime = `${nextReservation.reservationDate || nextReservation.date} ${reservationTime}`;
                        }
                    }
                    
                    tableInfo = `<div class="small">预约时间: ${reservationTime || '未知'}</div>`;
                    break;
                case 'occupied':
                    statusClass = 'bg-danger';
                    statusText = '使用中';
                    
                    // 使用时间信息
                    const startTime = table.startTime || '未知';
                    const duration = table.duration || table.reservationDuration || '未知';
                    
                    tableInfo = `
                        <div class="small">开始时间: ${startTime}</div>
                        <div class="small">预计用时: ${duration}${typeof duration === 'number' ? '小时' : ''}</div>
                    `;
                    actionButton = `
                        <button class="btn btn-sm btn-outline-primary mt-2 checkout-btn" data-table="${table.id}">
                            结账离店
                        </button>
                    `;
                    break;
            }
            
            const html = `
                <div class="col-md-4 col-lg-3 mb-4">
                    <div class="card table-card">
                        <div class="card-header ${statusClass} text-white">
                            ${table.name}
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-2">
                                <span>容量:</span>
                                <span>${table.capacity || '未知'}人</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span>状态:</span>
                                <span>${statusText}</span>
                            </div>
                            ${tableInfo}
                            ${actionButton}
                        </div>
                    </div>
                </div>
            `;
            
            container.append(html);
        });
    },
    
    // 新增临时客户
    addWalkInCustomer: function() {
        const customerName = $('#walkInName').val().trim();
        const phone = $('#walkInPhone').val().trim();
        const people = $('#walkInPeople').val();
        const tableId = $('#walkInTable').val();
        
        if (!customerName || !phone || !people || !tableId) {
            alert('请填写完整信息\n请填写客户姓名、电话、人数和选择餐桌');
            return;
        }
        
        // 模拟添加临时客户
        // 实际项目中应发送请求到服务器
        
        // 关闭模态框
        $('#addWalkInModal').modal('hide');
        
        // 显示成功消息
        alert('添加成功\n已安排客户入座并通知后厨');
        
        // 重置表单
        $('#addWalkInForm')[0].reset();
        
        // 更新餐桌状态
        setTimeout(() => {
            this.loadTables();
        }, 1500);
    },
    
    // 结账离店
    checkoutTable: function(tableId) {
        // 模拟获取餐桌信息
        // 实际项目中应从服务器获取
        const table = this.getTableInfo(tableId);
        
        if (table) {
            // 设置结账模态框信息
            $('#checkoutTableName').text(table.name);
            $('#checkoutStartTime').text(table.startTime || '--');
            $('#checkoutDuration').text(table.duration ? `${table.duration}小时` : '--');
            
            // 存储当前操作的餐桌ID
            this.currentCheckoutTableId = tableId;
            
            // 显示结账模态框
            $('#checkoutModal').modal('show');
        }
    },
    
    // 确认结账
    confirmCheckout: function() {
        if (!this.currentCheckoutTableId) {
            return;
        }

        $.ajax({
            url: '/api/tables/' + this.currentCheckoutTableId + '/checkout',
            method: 'POST',
            success: (response) => {
                if (response.code === 200) {
                    $('#checkoutModal').modal('hide');
                    this.showSuccess('结账成功，餐桌状态已更新');
                    this.loadTables();
                } else {
                    this.showError('结账失败: ' + response.message);
                }
            },
            error: (xhr, status, error) => {
                this.showError('结账失败，请重试');
            }
        });
    },
    
    // 根据ID获取餐桌信息（模拟数据）
    getTableInfo: function(tableId) {
        // 模拟数据，实际项目中应从服务器获取
        const tables = {
            1: { id: 1, name: '大厅1号桌', capacity: 4, status: 'occupied', startTime: '18:05', duration: 2 },
            2: { id: 2, name: '大厅2号桌', capacity: 4, status: 'available' },
            3: { id: 3, name: '大厅3号桌', capacity: 4, status: 'available' },
            4: { id: 4, name: '包间1号', capacity: 8, status: 'reserved', time: '20:00' },
            5: { id: 5, name: '包间2号', capacity: 10, status: 'available' },
            6: { id: 6, name: '包间3号', capacity: 12, status: 'occupied', startTime: '17:30', duration: 3 }
        };
        
        return tables[tableId];
    },
    
    // 加载订单列表（后厨模式）
    loadOrders: function() {
        // 模拟数据，实际项目中应从服务器获取
        const orders = [
            {
                id: 1001,
                tableId: 1,
                tableName: '大厅1号桌',
                time: '18:05',
                dishes: [
                    { id: 1, name: '白切鸡', quantity: 1, status: 'cooking' },
                    { id: 2, name: '清蒸鱼', quantity: 1, status: 'pending' },
                    { id: 3, name: '蜜汁叉烧包', quantity: 2, status: 'ready' }
                ]
            },
            {
                id: 1002,
                tableId: 6,
                tableName: '包间3号',
                time: '17:35',
                dishes: [
                    { id: 4, name: '叉烧', quantity: 1, status: 'ready' },
                    { id: 5, name: '虾饺', quantity: 3, status: 'ready' },
                    { id: 6, name: '蛋挞', quantity: 2, status: 'ready' }
                ]
            }
        ];
        
        this.renderOrders(orders);
    },
    
    // 渲染订单列表（后厨模式）
    renderOrders: function(orders) {
        const container = $('#ordersList');
        container.empty();
        
        if (orders.length === 0) {
            container.html('<div class="alert alert-info">暂无待处理订单</div>');
            return;
        }
        
        orders.forEach(order => {
            const allReady = order.dishes.every(dish => dish.status === 'ready');
            const completeBtn = allReady 
                ? `<button class="btn btn-success complete-order-btn mt-3" data-id="${order.id}">全部完成</button>`
                : '';
            
            const dishItems = order.dishes.map(dish => {
                let statusBadge = '';
                
                switch (dish.status) {
                    case 'pending':
                        statusBadge = '<span class="badge bg-secondary">待处理</span>';
                        break;
                    case 'cooking':
                        statusBadge = '<span class="badge bg-warning">处理中</span>';
                        break;
                    case 'ready':
                        statusBadge = '<span class="badge bg-success">已完成</span>';
                        break;
                }
                
                return `
                    <div class="dish-item d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <span class="fw-bold">${dish.name}</span>
                            <span class="text-muted"> x${dish.quantity}</span>
                        </div>
                        <div>
                            <select class="form-select form-select-sm dish-status" data-id="${dish.id}">
                                <option value="pending" ${dish.status === 'pending' ? 'selected' : ''}>待处理</option>
                                <option value="cooking" ${dish.status === 'cooking' ? 'selected' : ''}>处理中</option>
                                <option value="ready" ${dish.status === 'ready' ? 'selected' : ''}>已完成</option>
                            </select>
                        </div>
                    </div>
                `;
            }).join('');
            
            const html = `
                <div class="card mb-4 order-card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">订单 #${order.id}</h5>
                        <span class="badge bg-primary">${order.tableName}</span>
                    </div>
                    <div class="card-body">
                        <p class="text-muted">下单时间: ${order.time}</p>
                        <div class="dishes-list">
                            ${dishItems}
                        </div>
                        <div class="text-end">
                            ${completeBtn}
                        </div>
                    </div>
                </div>
            `;
            
            container.append(html);
        });
    },
    
    // 更新菜品状态（后厨模式）
    updateDishStatus: function(dishId, status) {
        // 实际项目中应发送请求到服务器
        console.log(`更新菜品 #${dishId} 状态为: ${status}`);
        
        // 重新加载订单列表
        this.loadOrders();
    },
    
    // 显示完成订单模态框
    showCompleteOrderModal: function(orderId) {
        // 模拟获取订单信息
        // 实际项目中应从服务器获取
        const order = {
            id: orderId,
            tableName: orderId === '1001' ? '大厅1号桌' : '包间3号' 
        };
        
        // 设置模态框信息
        $('#completeOrderId').text(order.id);
        $('#completeOrderTable').text(order.tableName);
        
        // 显示模态框
        $('#completeOrderModal').modal('show');
    },
    
    // 完成所有菜品（后厨模式）
    completeOrder: function(orderId) {
        // 模拟完成操作
        // 实际项目中应发送请求到服务器
        
        // 关闭模态框
        $('#completeOrderModal').modal('hide');
        
        // 显示成功消息
        alert('操作成功\n已通知前台所有菜品已出餐');
        
        // 重新加载订单列表
        setTimeout(() => {
            this.loadOrders();
        }, 1500);
    },

    // 显示错误消息
    showError: function(message) {
        Swal.fire({
            icon: 'error',
            title: '错误',
            text: message,
            timer: 3000,
            showConfirmButton: false
        });
    },

    // 显示成功消息
    showSuccess: function(message) {
        Swal.fire({
            icon: 'success',
            title: '成功',
            text: message,
            timer: 2000,
            showConfirmButton: false
        });
    }
};

// 页面加载完成后初始化
$(document).ready(function() {
    restaurantApp.init();
});

// 更新餐桌显示
function updateTablesDisplay(tables) {
    const $tableContainer = $('#tableContainer');
    $tableContainer.empty();
    
    tables.forEach(table => {
        const statusClass = getStatusClass(table.status);
        const statusText = getStatusText(table.status);
        
        const tableHtml = `
            <div class="col-md-4 mb-4">
                <div class="card table-card">
                    <div class="card-header ${statusClass}">
                        <h5 class="mb-0">${table.name}</h5>
                    </div>
                    <div class="card-body">
                        <p class="mb-2">容纳人数：${table.capacity}人</p>
                        <p class="mb-0">状态：${statusText}</p>
                    </div>
                </div>
            </div>
        `;
        $tableContainer.append(tableHtml);
    });
}

// 获取状态对应的CSS类
function getStatusClass(status) {
    switch (status) {
        case 'available':
            return 'bg-success text-white';
        case 'occupied':
            return 'bg-danger text-white';
        case 'reserved':
            return 'bg-warning text-dark';
        default:
            return 'bg-secondary text-white';
    }
}

// 获取状态对应的文本
function getStatusText(status) {
    switch (status) {
        case 'available':
            return '空闲';
        case 'occupied':
            return '已占用';
        case 'reserved':
            return '已预订';
        default:
            return '未知';
    }
} 