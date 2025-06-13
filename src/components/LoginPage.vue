<template>
  <div class="login-container">
    <div class="login-card-wrapper">
      <glassmorphic-card variant="primary" :showGlow="true">
        <div class="login-header">
          <h2 class="login-title">用户登录</h2>

          <div class="theme-toggle">
            <button
              @click="handleToggleTheme"
              class="theme-btn"
              :title="isDarkMode ? '切换到亮色模式' : '切换到暗色模式'">
              <i class="theme-icon" :class="{ 'is-dark': isDarkMode }">
                {{ isDarkMode ? '🌙' : '☀️' }}
              </i>
            </button>
          </div>
        </div>

        <el-form
          :model="loginForm"
          :rules="rules"
          ref="loginFormRef"
          label-position="top">
          <el-form-item prop="username" label="用户名">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              prefix-icon="User" />
          </el-form-item>

          <el-form-item prop="password" label="密码">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              show-password />
          </el-form-item>

          <div class="login-options">
            <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
            <el-button link type="primary">忘记密码?</el-button>
          </div>

          <div class="form-actions">
            <el-button
              type="primary"
              :loading="loading"
              @click="handleLogin"
              class="login-btn">
              <div class="btn-content">
                <el-icon v-if="!loading"><Key /></el-icon>
                <span>{{ loading ? '登录中...' : '登录' }}</span>
              </div>
            </el-button>
          </div>

          <div class="register-link">
            <span>还没有账号?</span>
            <el-button link type="primary" @click="goToRegister"
              >立即注册</el-button
            >
          </div>
        </el-form>
      </glassmorphic-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { User, Lock, Key } from '@element-plus/icons-vue'
import GlassmorphicCard from './GlassmorphicCard.vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { API_BASE_URL } from '../utils/urlUtils'

// 接收从父组件传来的isDarkMode和toggleTheme
const props = defineProps({
  isDarkMode: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['toggleTheme', 'login', 'register'])

// 表单引用
const loginFormRef = ref(null)

// 加载状态
const loading = ref(false)

// 登录表单数据
const loginForm = reactive({
  username: 'admin',
  password: '111111',
  remember: false,
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应为3-20个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应为6-20个字符', trigger: 'blur' },
  ],
}

// 处理主题切换
const handleToggleTheme = () => {
  emit('toggleTheme')
}

// 处理登录逻辑
const handleLogin = () => {
  if (!loginFormRef.value) return

  loginFormRef.value.validate(valid => {
    if (valid) {
      loading.value = true

      // 发送登录请求到后端API
      axios
        .post(`${API_BASE_URL}/user/login`, {
          userName: loginForm.username,
          //userPassword: loginForm.password,
          userPassword: '14e1b600b1fd579f47433b88e8d85291',
          logTools: 'pc',
          type: "user"
        })
        .then(response => {
          loading.value = false
          console.log('登录响应:', response.data)

          if (response.data.code === 200) {
            // 登录成功
            ElMessage({
              type: 'success',
              message: response.data.message || '登录成功',
            })

            // 存储令牌和用户信息
            const token = response.data.token
            const user = response.data.result.data

            // 如果选择了"记住我"，则将令牌存储在localStorage中，否则存储在sessionStorage中
            if (loginForm.remember) {
              localStorage.setItem('auth_token', token)
              localStorage.setItem('user_info', JSON.stringify(user))
            } else {
              sessionStorage.setItem('auth_token', token)
              sessionStorage.setItem('user_info', JSON.stringify(user))
            }

            // 设置axios默认Authorization头
            axios.defaults.headers.common['token'] = `Bearer ${token}`

            // 触发登录成功事件
            emit('login', user)
          } else {
            // 登录失败（这种情况不应该发生，因为成功应该是status=success）
            ElMessage({
              type: 'error',
              message: response.data.message || '登录失败，请重试',
            })
          }
        })
        .catch(error => {
          loading.value = false
          console.error('登录请求错误:', error)

          // 处理错误
          let errorMessage = '登录失败，请重试'

          if (error.response) {
            // 服务器响应了错误状态码
            console.error('错误状态码:', error.response.status)
            console.error('错误响应数据:', error.response.data)
            errorMessage = error.response.data.message || errorMessage
          } else if (error.request) {
            // 请求已发送但没有收到响应
            console.error('请求已发送但没有收到响应:', error.request)
            errorMessage = '无法连接到服务器，请检查网络连接'
          } else {
            // 设置请求时发生错误
            console.error('请求错误:', error.message)
          }

          ElMessage({
            type: 'error',
            message: errorMessage,
          })
        })
    }
  })
}

// 跳转到注册页面
const goToRegister = () => {
  emit('register')
}
</script>

<style scoped>
.login-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card-wrapper {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  animation: fadeIn 0.6s ease forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  position: relative;
}

.login-title {
  color: var(--text-color, #fff);
  font-weight: 600;
  margin: 0;
  letter-spacing: 1px;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  flex: 1;
}

.login-options {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  align-items: center;
}

.form-actions {
  margin-bottom: 16px;
}

.login-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
  letter-spacing: 1px;
  background-image: linear-gradient(
    to right,
    var(--secondary-color),
    var(--primary-color)
  );
  border: none;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.login-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: 0.5s;
}

.login-btn:hover:not(:disabled)::before {
  left: 100%;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(83, 82, 237, 0.4);
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.register-link {
  text-align: center;
  margin-top: 8px;
  color: var(--text-secondary);
}

:deep(.el-form-item__label) {
  color: var(--text-color);
  font-weight: 500;
  font-size: 14px;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__wrapper) {
  background: var(--card-bg) !important;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1)) !important;
  box-shadow: none !important;
  transition: all 0.3s;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__wrapper:hover) {
  border-color: var(--secondary-color, rgba(255, 255, 255, 0.2)) !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__wrapper.is-focus) {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 1px rgba(var(--primary-color), 0.2) !important;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  color: var(--text-color) !important;
  background: transparent !important;
}

:deep(.el-checkbox__label) {
  color: var(--text-color);
}

.theme-toggle {
  position: absolute;
  top: 0;
  right: 0;
}

.theme-btn {
  background: var(--card-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.theme-btn:hover {
  transform: rotate(15deg);
  background: var(--primary-color);
  color: white;
}

.theme-icon {
  font-size: 20px;
  line-height: 1;
}

.theme-icon.is-dark {
  transform: rotate(-15deg);
}

/* 头像容器样式 */
.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  animation: fadeIn 0.4s ease;
}

.username-display {
  margin-top: 10px;
  color: var(--text-color);
  font-weight: 500;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .login-card-wrapper {
    padding: 10px;
  }

  .login-title {
    font-size: 1.5rem;
  }

  .theme-btn {
    width: 36px;
    height: 36px;
  }

  .theme-icon {
    font-size: 18px;
  }
}
</style>
