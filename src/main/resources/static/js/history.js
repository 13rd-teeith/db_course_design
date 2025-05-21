$(document).ready(function() {
    // 检查登录状态
    checkLoginStatus();

    // 初始化变量
    let currentPage = 1;
    let pageSize = 10;
    let currentFilter = 'all';
    let currentSort = 'date-desc';
    let searchKeyword = '';

    // 加载预约历史
    loadReservations();

    // 筛选按钮点击事件
    $('.btn-group [data-filter]').on('click', function() {
        $('.btn-group [data-filter]').removeClass('active');
        $(this).addClass('active');
        currentFilter = $(this).data('filter');
        currentPage = 1;
        loadReservations();
    });

    // 排序按钮点击事件
    $('.btn-group [data-sort]').on('click', function() {
        $('.btn-group [data-sort]').removeClass('active');
        $(this).addClass('active');
        currentSort = $(this).data('sort');
        loadReservations();
    });

    // 搜索按钮点击事件
    $('#searchBtn').on('click', function() {
        searchKeyword = $('#searchInput').val().trim();
        currentPage = 1;
        loadReservations();
    });

    // 搜索框回车事件
    $('#searchInput').on('keypress', function(e) {
        if (e.which === 13) {
            searchKeyword = $(this).val().trim();
            currentPage = 1;
            loadReservations();
        }
    });

    // 取消预约按钮点击事件
    $('#cancelReservationBtn').on('click', function() {
        const reservationId = $(this).data('id');
        cancelReservation(reservationId);
    });

    // 退出登录
    $('#logoutBtn').on('click', function(e) {
        e.preventDefault();
        logout();
    });
});

// 检查登录状态
function checkLoginStatus() {
    const customerInfo = localStorage.getItem('customerInfo');
    if (!customerInfo) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const user = JSON.parse(customerInfo);
        if (!user || !user.id) {
            console.error('用户信息无效');
            localStorage.removeItem('customerInfo');
            window.location.href = 'index.html';
        }
    } catch (e) {
        console.error('解析用户信息失败:', e);
        localStorage.removeItem('customerInfo');
        window.location.href = 'index.html';
    }
}

// 加载预约历史
function loadReservations() {
    const customerInfo = localStorage.getItem('customerInfo');
    if (!customerInfo) {
        console.error('无法获取用户信息');
        window.location.href = 'index.html';
        return;
    }

    try {
        const user = JSON.parse(customerInfo);
        if (!user || !user.id) {
            console.error('用户ID不存在');
            return;
        }

        // 显示加载中提示
        Swal.fire({
            title: '加载中...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        $.ajax({
            url: '/reservations/user/' + user.id,
            method: 'GET',
            success: function(response) {
                Swal.close();
                if (response && response.code === 200) {
                    // console.log(response.data);
                    renderReservations(response.data);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: '加载失败',
                        text: response ? response.message : '服务器响应异常'
                    });
                }
            },
            error: function(xhr) {
                Swal.close();
                console.error('获取预约历史失败:', xhr);
                let errorMsg = '加载预约历史失败，请稍后重试';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                Swal.fire({
                    icon: 'error',
                    title: '系统错误',
                    text: errorMsg
                });
            }
        });
    } catch (e) {
        Swal.close();
        console.error('解析用户信息失败:', e);
        localStorage.removeItem('customerInfo');
        window.location.href = 'index.html';
    }
}

// 渲染预约列表
function renderReservations(data) {
    const $list = $('#reservationList');
    $list.empty();

    if (!data || data.length === 0) {
        $list.append(`
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p class="text-muted">暂无预约记录</p>
                </td>
            </tr>
        `);
        return;
    }

    data.forEach(reservation => {
        if (!reservation) return;

        const statusClass = getStatusClass(reservation.status);
        const statusText = getStatusText(reservation.status);
        console.log(reservation);
        $list.append(`
            <tr>
                <td>${reservation.id || '-'}</td>
                <td>${reservation.restaurantName || '-'}</td>
                <td>${reservation.reservationDate}-${reservation.reservationTime || '-'}</td>
                <td>${reservation.peopleCount || '-'}人</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-detail" data-id="${reservation.id}">
                        <i class="fas fa-eye"></i> 查看
                    </button>
                    ${reservation.status === 'confirmed' ? `
                        <button class="btn btn-sm btn-outline-danger cancel-reservation" data-id="${reservation.id}">
                            <i class="fas fa-times"></i> 取消
                        </button>
                    ` : ''}
                </td>
            </tr>
        `);
    });

    // 绑定查看详情事件
    $('.view-detail').off('click').on('click', function() {
        const reservationId = $(this).data('id');
        if (reservationId) {
            showReservationDetail(reservationId);
        }
    });

    // 绑定取消预约事件
    $('.cancel-reservation').off('click').on('click', function() {
        const reservationId = $(this).data('id');
        if (reservationId) {
            confirmCancelReservation(reservationId);
        }
    });
}

// 渲染分页
function renderPagination(total) {
    const totalPages = Math.ceil(total / pageSize);
    const $pagination = $('#pagination');
    $pagination.empty();

    if (totalPages <= 1) {
        return;
    }

    // 上一页
    $pagination.append(`
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `);

    // 页码
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 || 
            i === totalPages || 
            (i >= currentPage - 2 && i <= currentPage + 2)
        ) {
            $pagination.append(`
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `);
        } else if (
            i === currentPage - 3 || 
            i === currentPage + 3
        ) {
            $pagination.append(`
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `);
        }
    }

    // 下一页
    $pagination.append(`
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `);

    // 绑定分页点击事件
    $('.page-link').on('click', function(e) {
        e.preventDefault();
        const page = $(this).data('page');
        if (page && page !== currentPage) {
            currentPage = page;
            loadReservations();
        }
    });
}

// 显示预约详情
function showReservationDetail(reservationId) {
    $.ajax({
        url: '/reservations/' + reservationId,
        method: 'GET',
        success: function(response) {
            if (response && response.code === 200) {
                const reservation = response.data;
                const statusClass = getStatusClass(reservation.status);
                const statusText = getStatusText(reservation.status);

                $('.reservation-detail').html(`
                    <div class="mb-3">
                        <h6 class="text-muted mb-2">预约信息</h6>
                        <p class="mb-1"><strong>预约编号：</strong>${reservation.id || '-'}</p>
                        <p class="mb-1"><strong>餐厅名称：</strong>${reservation.restaurantName || '-'}</p>
                        <p class="mb-1"><strong>预约时间：</strong>${reservation.reservationDate}-${reservation.reservationTime || '-'}</p>
                        <p class="mb-1"><strong>用餐人数：</strong>${reservation.peopleCount || '-'}</p>
                        <p class="mb-1"><strong>状态：</strong><span class="badge ${statusClass}">${statusText}</span></p>
                    </div>
                    ${reservation.dishes && reservation.dishes.length > 0 ? `
                        <div class="mb-3">
                            <h6 class="text-muted mb-2">预点菜品</h6>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>菜品名称</th>
                                            <th>单价</th>
                                            <th>数量</th>
                                            <th>小计</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${reservation.dishes.map(dish => `
                                            <tr>
                                                <td>${dish.name || '-'}</td>
                                                <td>¥${dish.price || '0.00'}</td>
                                                <td>${dish.quantity || '0'}</td>
                                                <td>¥${((dish.price || 0) * (dish.quantity || 0)).toFixed(2)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ` : ''}
                `);

                // 根据预约状态显示/隐藏取消按钮
                if (reservation.status === 'confirmed') {
                    $('#cancelReservationBtn').show().data('id', reservationId);
                } else {
                    $('#cancelReservationBtn').hide();
                }

                // 显示模态框
                $('#reservationDetailModal').modal('show');
            } else {
                Swal.fire({
                    icon: 'error',
                    title: '加载失败',
                    text: response ? response.message : '服务器响应异常'
                });
            }
        },
        error: function(xhr) {
            console.error('获取预约详情失败:', xhr);
            Swal.fire({
                icon: 'error',
                title: '系统错误',
                text: '加载预约详情失败，请稍后重试'
            });
        }
    });
}

// 确认取消预约
function confirmCancelReservation(reservationId) {
    Swal.fire({
        title: '确认取消',
        text: '您确定要取消这个预约吗？',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '确定',
        cancelButtonText: '取消'
    }).then((result) => {
        if (result.isConfirmed) {
            cancelReservation(reservationId);
        }
    });
}

// 取消预约
function cancelReservation(reservationId) {
    $.ajax({
        url: `/reservations/${reservationId}/status`,
        method: 'PUT',
        data: { status: 'cancelled' },
        success: function(response) {
            if (response && response.code === 200) {
                Swal.fire({
                    icon: 'success',
                    title: '取消成功',
                    text: '预约已取消'
                }).then(() => {
                    $('#reservationDetailModal').modal('hide');
                    loadReservations();
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: '取消失败',
                    text: response ? response.message : '服务器响应异常'
                });
            }
        },
        error: function(xhr) {
            console.error('取消预约失败:', xhr);
            Swal.fire({
                icon: 'error',
                title: '系统错误',
                text: '取消预约失败，请稍后重试'
            });
        }
    });
}

// 获取状态样式类
function getStatusClass(status) {
    switch (status) {
        case 'pending':
            return 'bg-warning';
        case 'confirmed':
            return 'bg-success';
        case 'completed':
            return 'bg-info';
        case 'cancelled':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

// 获取状态文本
function getStatusText(status) {
    switch (status) {
        case 'pending':
            return '待确认';
        case 'confirmed':
            return '已确认';
        case 'completed':
            return '已完成';
        case 'cancelled':
            return '已取消';
        default:
            return '未知';
    }
}

// 格式化日期时间
function formatDateTime(dateTimeStr) {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 退出登录
function logout() {
    Swal.fire({
        title: '确认退出',
        text: '您确定要退出登录吗？',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '确定',
        cancelButtonText: '取消'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('token');
            localStorage.removeItem('customerInfo');
            window.location.href = 'index.html';
        }
    });
} 