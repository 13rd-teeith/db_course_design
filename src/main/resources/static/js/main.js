// 主脚本文件
// 包含通用逻辑和初始化代码

// 工具函数
const utils = {
    // 格式化日期
    formatDate: function(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    // 格式化时间
    formatTime: function(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    },
    
    // 格式化价格
    formatPrice: function(price) {
        return '¥' + price.toFixed(2);
    },
    
    // 获取URL参数
    getUrlParam: function(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },
    
    // 设置Cookie
    setCookie: function(name, value, days) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + (value || '') + expires + '; path=/';
    },
    
    // 获取Cookie
    getCookie: function(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },
    
    // 删除Cookie
    eraseCookie: function(name) {
        document.cookie = name + '=; Max-Age=-99999999;';
    },
    
    // 深拷贝对象
    deepClone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    // 防抖函数
    debounce: function(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    },
    
    // 节流函数
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// API工具函数
const api = {
    // 发送GET请求
    get: function(url, params = {}) {
        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
        
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        
        return $.ajax({
            url: fullUrl,
            type: 'GET',
            contentType: 'application/json',
            beforeSend: function(xhr) {
                // 可以在这里添加认证头部等
                // 例如: xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            }
        });
    },
    
    // 发送POST请求
    post: function(url, data = {}) {
        return $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            beforeSend: function(xhr) {
                // 可以在这里添加认证头部等
            }
        });
    },
    
    // 发送PUT请求
    put: function(url, data = {}) {
        return $.ajax({
            url: url,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            beforeSend: function(xhr) {
                // 可以在这里添加认证头部等
            }
        });
    },
    
    // 发送DELETE请求
    delete: function(url) {
        return $.ajax({
            url: url,
            type: 'DELETE',
            contentType: 'application/json',
            beforeSend: function(xhr) {
                // 可以在这里添加认证头部等
            }
        });
    },
    
    // 上传文件
    upload: function(url, formData) {
        return $.ajax({
            url: url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function(xhr) {
                // 可以在这里添加认证头部等
            }
        });
    },
    
    // 处理响应结果
    handleResponse: function(promise, successCallback, errorCallback) {
        app.showLoading();
        
        promise.then(response => {
            app.hideLoading();
            
            if (response.code === 200) {
                successCallback && successCallback(response.data);
            } else {
                app.showToast(response.message || '操作失败', 'error');
                errorCallback && errorCallback(response);
            }
        }).catch(error => {
            app.hideLoading();
            app.showToast('网络错误或服务器异常', 'error');
            console.error('API请求失败:', error);
            errorCallback && errorCallback(error);
        });
    }
};

// 全局应用
const app = {
    // 初始化
    init: function() {
        this.setupEventHandlers();
    },
    
    // 设置全局事件处理
    setupEventHandlers: function() {
        // 处理返回顶部
        $(window).scroll(function() {
            if ($(this).scrollTop() > 300) {
                $('.back-to-top').fadeIn();
            } else {
                $('.back-to-top').fadeOut();
            }
        });
        
        // 返回顶部点击
        $(document).on('click', '.back-to-top', function() {
            $('html, body').animate({scrollTop : 0}, 800);
            return false;
        });
        
        // 处理表单验证
        this.setupFormValidation();
    },
    
    // 设置表单验证
    setupFormValidation: function() {
        // 添加手机号验证
        $.validator && $.extend($.validator.methods, {
            // 中国手机号验证
            mobilePhone: function(value, element) {
                return this.optional(element) || /^1[3-9]\d{9}$/.test(value);
            }
        });
    },
    
    // 显示加载中
    showLoading: function(text = '加载中...') {
        if (!$('#appLoading').length) {
            $('body').append(`
                <div id="appLoading" class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="background: rgba(255,255,255,0.8); z-index: 9999;">
                    <div class="text-center">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">加载中...</span>
                        </div>
                        <p class="mt-2">${text}</p>
                    </div>
                </div>
            `);
        } else {
            $('#appLoading').find('p').text(text);
            $('#appLoading').show();
        }
    },
    
    // 隐藏加载中
    hideLoading: function() {
        $('#appLoading').hide();
    },
    
    // 显示消息提示
    showToast: function(message, type = 'success') {
        Swal.fire({
            icon: type,
            title: message,
            showConfirmButton: true,
            confirmButtonText: '确定',
            confirmButtonColor: '#FFC300',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'animated fadeInDown'
            }
        });
    },
    
    // 显示确认对话框
    showConfirm: function(title, text, confirmCallback, cancelCallback) {
        Swal.fire({
            title: title,
            text: text,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '确认',
            cancelButtonText: '取消'
        }).then((result) => {
            if (result.isConfirmed) {
                confirmCallback && confirmCallback();
            } else {
                cancelCallback && cancelCallback();
            }
        });
    }
};

// 页面加载完成后初始化
$(document).ready(function() {
    app.init();
    
    // 添加返回顶部按钮
    if ($('.back-to-top').length === 0) {
        $('body').append(`
            <a href="#" class="back-to-top position-fixed d-none d-lg-flex bottom-0 end-0 mb-5 me-5" style="display: none; width: 40px; height: 40px; background: var(--primary-color); color: #fff; border-radius: 50%; align-items: center; justify-content: center; z-index: 100;">
                <i class="fas fa-arrow-up"></i>
            </a>
        `);
    }
}); 