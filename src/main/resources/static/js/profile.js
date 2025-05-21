$(document).ready(function() {
    // 检查登录状态
    checkLoginStatus();

    // 获取用户信息
    getUserInfo();

    // 表单提交事件处理
    $('#profileForm').on('submit', function(e) {
        e.preventDefault();
        updateProfile();
    });

    $('#securityForm').on('submit', function(e) {
        e.preventDefault();
        updatePassword();
    });

    $('#preferencesForm').on('submit', function(e) {
        e.preventDefault();
        updatePreferences();
    });

    // 退出登录
    $('#logoutBtn').on('click', function(e) {
        e.preventDefault();
        logout();
    });

    // 添加头像上传事件处理
    $('.btn-outline-primary').on('click', function() {
        $('#avatarInput').click();
    });

    $('#avatarInput').on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // 验证文件类型
            if (!file.type.match('image.*')) {
                showErrorModal('文件类型错误', '请选择图片文件（JPG、PNG、GIF）');
                return;
            }
            
            // 验证文件大小（最大2MB）
            if (file.size > 2 * 1024 * 1024) {
                showErrorModal('文件过大', '图片大小不能超过2MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const base64 = e.target.result;
                // 更新头像显示
                $('#profileAvatarLarge').attr('src', base64);
                $('#profileAvatarSmall').attr('src', base64);
                
                // 上传头像到服务器
                uploadAvatar(base64);
            };
            reader.onerror = function() {
                showErrorModal('读取失败', '图片读取失败，请重试');
            };
            reader.readAsDataURL(file);
        }
    });

    // 初始化各种模态框的事件
    initModalEvents();
});

// 初始化模态框事件
function initModalEvents() {
    // 确认模态框确认按钮点击事件
    $('#confirmModalBtn').on('click', function() {
        if ($(this).data('callback')) {
            const callback = $(this).data('callback');
            window[callback]();
        }
        $('#confirmModal').modal('hide');
    });
}

// 显示成功模态框
function showSuccessModal(title, message, callback) {
    $('#successModalTitle').text(title || '成功');
    $('#successModalBody').text(message || '操作已完成');
    
    if (callback) {
        $('#successModalBtn').off('click').on('click', function() {
            $('#successModal').modal('hide');
            callback();
        });
    }
    
    $('#successModal').modal('show');
}

// 显示错误模态框
function showErrorModal(title, message) {
    $('#errorModalTitle').text(title || '错误');
    $('#errorModalBody').text(message || '操作失败');
    $('#errorModal').modal('show');
}

// 显示确认模态框
function showConfirmModal(title, message, callback) {
    $('#confirmModalTitle').text(title || '确认操作');
    $('#confirmModalBody').text(message || '您确定要执行此操作吗？');
    
    if (callback && typeof callback === 'string') {
        $('#confirmModalBtn').data('callback', callback);
    }
    
    $('#confirmModal').modal('show');
}

// 显示加载模态框
function showLoadingModal(title, message) {
    $('#loadingModalTitle').text(title || '处理中');
    $('#loadingModalBody').text(message || '请稍候...');
    $('#loadingModal').modal({
        backdrop: 'static',
        keyboard: false
    });
    $('#loadingModal').modal('show');
}

// 隐藏加载模态框
function hideLoadingModal() {
    $('#loadingModal').modal('hide');
}

// 检查登录状态
function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const customerInfo = localStorage.getItem('customerInfo');

    // 如果没有默认头像数据，从服务器获取
    const userInfo = JSON.parse(customerInfo);
    if (!userInfo.defaultAvatarBase64) {
        $.ajax({
            url: '/api/user/default-avatar',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            success: function(response) {
                if (response.code === 200 && response.data) {
                    userInfo.defaultAvatarBase64 = response.data;
                    localStorage.setItem('customerInfo', JSON.stringify(userInfo));
                }
            }
        });
    }
}

// 获取用户信息
function getUserInfo() {
    // 先从localStorage中获取用户信息
    const customerInfo = localStorage.getItem('customerInfo');
    if (customerInfo) {
        try {
            const user = JSON.parse(customerInfo);
            // 更新页面显示
            $('#userName').text(user.name || '未设置');
            $('#userPhone').text(user.phone);
            
            // 填充表单
            $('#name').val(user.name);
            $('#phone').val(user.phone);
            $('#email').val(user.email);
            $('#birthday').val(user.birthday);
            $('#gender').val(user.gender);
            
            // 显示会员信息
            updateMemberInfo(user);
            
            // 更新头像
            if (user.avatarBase64) {
                // 确保 avatarBase64 是完整的 base64 字符串
                const base64Prefix = 'data:image/';
                if (!user.avatarBase64.startsWith(base64Prefix)) {
                    // 如果不是完整的 base64 字符串，添加前缀
                    const imageType = user.avatarBase64.startsWith('/9j/') ? 'jpeg;base64,' : 'png;base64,';
                    user.avatarBase64 = base64Prefix + imageType + user.avatarBase64;
                }
                $('#profileAvatarLarge').attr('src', user.avatarBase64);
                $('#profileAvatarSmall').attr('src', user.avatarBase64);
            } else {
                // 从服务器获取头像
                $.ajax({
                    url: '/api/user/avatar',
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    success: function(response) {
                        if (response.code === 200 && response.data) {
                            const avatarBase64 = response.data;
                            $('#profileAvatarLarge').attr('src', avatarBase64);
                            $('#profileAvatarSmall').attr('src', avatarBase64);
                            // 更新本地存储
                            user.avatarBase64 = avatarBase64;
                            localStorage.setItem('customerInfo', JSON.stringify(user));
                        } else {
                            setDefaultAvatar();
                        }
                    },
                    error: function() {
                        setDefaultAvatar();
                    }
                });
            }
            
            // 填充偏好设置
            if (user.preferences) {
                $('#notifyReservation').prop('checked', user.preferences.notifyReservation);
                $('#notifyPromotion').prop('checked', user.preferences.notifyPromotion);
                $('#defaultPeople').val(user.preferences.defaultPeople);
                $('#preferredCuisine').val(user.preferences.preferredCuisine);
            }
        } catch (e) {
            console.error('解析用户信息失败', e);
            setDefaultAvatar();
        }
        return;
    }
    
    // 否则从API获取
    $.ajax({
        url: '/api/user/profile',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        success: function(response) {
            if (response.code === 200) {
                const user = response.data;
                // 更新页面显示
                $('#userName').text(user.name || '未设置');
                $('#userPhone').text(user.phone);
                
                // 填充表单
                $('#name').val(user.name);
                $('#phone').val(user.phone);
                $('#email').val(user.email);
                $('#birthday').val(user.birthday);
                $('#gender').val(user.gender);
                
                // 显示会员信息
                updateMemberInfo(user);
                
                // 更新头像
                if (user.avatarBase64) {
                    // 确保 avatarBase64 是完整的 base64 字符串
                    const base64Prefix = 'data:image/';
                    if (!user.avatarBase64.startsWith(base64Prefix)) {
                        // 如果不是完整的 base64 字符串，添加前缀
                        const imageType = user.avatarBase64.startsWith('/9j/') ? 'jpeg;base64,' : 'png;base64,';
                        user.avatarBase64 = base64Prefix + imageType + user.avatarBase64;
                    }
                    $('#profileAvatarLarge').attr('src', user.avatarBase64);
                    $('#profileAvatarSmall').attr('src', user.avatarBase64);
                } else {
                    // 从服务器获取头像
                    $.ajax({
                        url: '/api/user/avatar',
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        },
                        success: function(response) {
                            if (response.code === 200 && response.data) {
                                const avatarBase64 = response.data;
                                $('#profileAvatarLarge').attr('src', avatarBase64);
                                $('#profileAvatarSmall').attr('src', avatarBase64);
                                // 更新本地存储
                                user.avatarBase64 = avatarBase64;
                                localStorage.setItem('customerInfo', JSON.stringify(user));
                            } else {
                                setDefaultAvatar();
                            }
                        },
                        error: function() {
                            setDefaultAvatar();
                        }
                    });
                }
                
                // 填充偏好设置
                if (user.preferences) {
                    $('#notifyReservation').prop('checked', user.preferences.notifyReservation);
                    $('#notifyPromotion').prop('checked', user.preferences.notifyPromotion);
                    $('#defaultPeople').val(user.preferences.defaultPeople);
                    $('#preferredCuisine').val(user.preferences.preferredCuisine);
                }
                
                // 更新本地存储
                localStorage.setItem('customerInfo', JSON.stringify(user));
            } else {
                showErrorModal('获取信息失败', response.message);
            }
        },
        error: function() {
            showErrorModal('系统错误', '获取用户信息失败，请稍后重试');
        }
    });
}

// 显示会员信息
function updateMemberInfo(user) {
    // 设置默认值
    const memberLevel = user.memberLevel || '普通会员';
    const creditScore = user.creditScore || 100;
    const points = user.points || 0;
    const balance = user.balance || 0;
    const isBlacklisted = user.isBlacklisted || false;
    
    // 更新会员等级徽章
    $('#memberLevel').text(memberLevel);
    $('#memberLevelDisplay').val(memberLevel);
    
    // 根据会员等级设置不同的样式
    if (memberLevel === '铂金会员') {
        $('#memberLevel').removeClass('bg-primary bg-secondary').addClass('bg-warning text-dark');
    } else if (memberLevel === '注册') {
        $('#memberLevel').removeClass('bg-warning bg-secondary text-dark').addClass('bg-primary');
    } else {
        $('#memberLevel').removeClass('bg-warning bg-primary text-dark').addClass('bg-secondary');
    }
    
    // 更新信誉度进度条
    const percentage = Math.min(100, Math.max(0, creditScore));
    $('#creditScoreBar').css('width', percentage + '%').attr('aria-valuenow', percentage).text(creditScore);
    
    // 根据信誉度设置不同的颜色
    if (creditScore >= 90) {
        $('#creditScoreBar').removeClass('bg-warning bg-danger').addClass('bg-success');
    } else if (creditScore >= 60) {
        $('#creditScoreBar').removeClass('bg-success bg-danger').addClass('bg-warning');
    } else {
        $('#creditScoreBar').removeClass('bg-success bg-warning').addClass('bg-danger');
    }
    
    // 更新积分和余额
    $('#points').val(points);
    $('#balance').val(balance.toFixed(2));
    
    // 显示或隐藏黑名单状态
    if (isBlacklisted) {
        $('#blacklistStatus').show();
    } else {
        $('#blacklistStatus').hide();
    }
}

// 更新个人信息
function updateProfile() {
    const formData = {
        name: $('#name').val(),
        email: $('#email').val(),
        birthday: $('#birthday').val(),
        gender: $('#gender').val()
    };

    $.ajax({
        url: '/api/user/profile',
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        data: JSON.stringify(formData),
        contentType: 'application/json',
        success: function(response) {
            if (response.code === 200) {
                showSuccessModal('更新成功', '个人信息已更新');
                getUserInfo(); // 刷新用户信息
            } else {
                showErrorModal('更新失败', response.message);
            }
        },
        error: function() {
            showErrorModal('系统错误', '更新失败，请稍后重试');
        }
    });
}

// 更新密码
function updatePassword() {
    const currentPassword = $('#currentPassword').val();
    const newPassword = $('#newPassword').val();
    const confirmPassword = $('#confirmPassword').val();

    if (newPassword !== confirmPassword) {
        showErrorModal('密码不匹配', '两次输入的新密码不一致');
        return;
    }

    $.ajax({
        url: '/api/user/password',
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        data: JSON.stringify({
            currentPassword: currentPassword,
            newPassword: newPassword
        }),
        contentType: 'application/json',
        success: function(response) {
            if (response.code === 200) {
                showSuccessModal('密码修改成功', '请使用新密码重新登录', function() {
                    logout();
                });
            } else {
                showErrorModal('修改失败', response.message);
            }
        },
        error: function() {
            showErrorModal('系统错误', '修改失败，请稍后重试');
        }
    });
}

// 更新偏好设置
function updatePreferences() {
    const preferences = {
        notifyReservation: $('#notifyReservation').is(':checked'),
        notifyPromotion: $('#notifyPromotion').is(':checked'),
        defaultPeople: $('#defaultPeople').val(),
        preferredCuisine: $('#preferredCuisine').val()
    };

    $.ajax({
        url: '/api/user/preferences',
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        data: JSON.stringify(preferences),
        contentType: 'application/json',
        success: function(response) {
            if (response.code === 200) {
                showSuccessModal('设置已更新', '偏好设置已保存');
            } else {
                showErrorModal('更新失败', response.message);
            }
        },
        error: function() {
            showErrorModal('系统错误', '更新失败，请稍后重试');
        }
    });
}

// 退出登录
function logout() {
    showConfirmModal('确认退出', '您确定要退出登录吗？', 'doLogout');
}

// 执行退出登录
function doLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('customerInfo');
    window.location.href = 'index.html';
}

// 上传头像
function uploadAvatar(base64) {
    // 显示上传进度
    showLoadingModal('正在上传', '请稍候...');

    // 确保 base64 格式正确
    const base64Prefix = 'data:image/';
    if (!base64.startsWith(base64Prefix)) {
        const imageType = base64.startsWith('/9j/') ? 'jpeg;base64,' : 'png;base64,';
        base64 = base64Prefix + imageType + base64;
    }

    $.ajax({
        url: '/api/user/avatar',
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        data: JSON.stringify({
            avatarBase64: base64
        }),
        contentType: 'application/json',
        success: function(response) {
            hideLoadingModal(); // 确保先隐藏加载框
            if (response.code === 200) {
                // 更新本地存储的用户信息
                const customerInfo = JSON.parse(localStorage.getItem('customerInfo'));
                customerInfo.avatarBase64 = base64;
                localStorage.setItem('customerInfo', JSON.stringify(customerInfo));
                
                // 更新页面显示
                $('#profileAvatarLarge').attr('src', base64);
                $('#profileAvatarSmall').attr('src', base64);
                
                showSuccessModal('头像更新成功', '您的头像已更新');
                
                // 延迟1秒后自动关闭成功提示
                setTimeout(() => {
                    $('#successModal').modal('hide');
                }, 1000);
            } else {
                showErrorModal('更新失败', response.message || '头像上传失败，请重试');
                setDefaultAvatar();
            }
        },
        error: function() {
            hideLoadingModal(); // 确保先隐藏加载框
            showErrorModal('系统错误', '头像上传失败，请稍后重试');
            setDefaultAvatar();
        }
    });
}

// 设置默认头像
function setDefaultAvatar() {
    // 从本地存储获取默认头像
    const customerInfo = JSON.parse(localStorage.getItem('customerInfo') || '{}');
    const defaultAvatar = customerInfo.defaultAvatarBase64 || 'assets/img/default-avatar.png';
    $('#profileAvatarLarge').attr('src', defaultAvatar);
    $('#profileAvatarSmall').attr('src', defaultAvatar);
} 