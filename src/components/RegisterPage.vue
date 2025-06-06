<template>
  <div class="register-container">
    <div class="register-card-wrapper">
      <glassmorphic-card variant="primary" :showGlow="true">
        <div class="register-header">
          <h2 class="register-title">用户注册</h2>

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
          :model="registerForm"
          :rules="rules"
          ref="registerFormRef"
          label-position="top">
          <el-form-item label="头像 (可选)" prop="avatar">
            <el-upload
              class="avatar-uploader"
              action="#"
              :show-file-list="false"
              :auto-upload="false"
              :on-change="handleAvatarChange"
              accept="image/*">
              <img
                v-if="avatarPreviewUrl"
                :src="avatarPreviewUrl"
                class="avatar-preview" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              <div class="el-upload__tip">
                点击上传头像，仅支持图片格式，大小不超过5MB
              </div>
            </el-upload>
          </el-form-item>

          <el-form-item prop="username" label="用户名">
            <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名"
              prefix-icon="User" />
          </el-form-item>

          <el-form-item prop="email" label="邮箱">
            <el-input
              v-model="registerForm.email"
              placeholder="请输入邮箱"
              prefix-icon="Message" />
          </el-form-item>

          <el-form-item prop="password" label="密码">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              show-password />
          </el-form-item>

          <el-form-item prop="confirmPassword" label="确认密码">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              prefix-icon="Lock"
              show-password />
          </el-form-item>

          <div class="form-actions">
            <el-button
              type="primary"
              :loading="loading"
              @click="handleRegister"
              class="register-btn">
              <div class="btn-content">
                <el-icon v-if="!loading"><UserFilled /></el-icon>
                <span>{{ loading ? '注册中...' : '立即注册' }}</span>
              </div>
            </el-button>
          </div>

          <div class="login-link">
            <span>已有账号?</span>
            <el-button link type="primary" @click="goToLogin"
              >返回登录</el-button
            >
          </div>
        </el-form>
      </glassmorphic-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { User, Lock, Message, UserFilled, Plus } from '@element-plus/icons-vue'
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

const emit = defineEmits(['toggleTheme', 'register-success', 'login'])

// 表单引用
const registerFormRef = ref(null)

// 加载状态
const loading = ref(false)

// 注册表单数据
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  avatarFile: null,
})

// 头像预览
const avatarPreviewUrl = ref('')

// 处理头像选择
const handleAvatarChange = uploadFile => {
  if (uploadFile.raw) {
    // 检查文件大小和类型 (虽然后端也有验证，前端可以先做一层)
    const isLt5M = uploadFile.size / 1024 / 1024 < 5
    const isImage = uploadFile.raw.type.startsWith('image/')

    if (!isImage) {
      ElMessage.error('请上传图片格式的文件!')
      return false
    }
    if (!isLt5M) {
      ElMessage.error('上传头像图片大小不能超过 5MB!')
      return false
    }
    registerForm.avatarFile = uploadFile.raw
    avatarPreviewUrl.value = URL.createObjectURL(uploadFile.raw)
  }
}

// 密码确认验证器
const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 邮箱验证器
const validateEmail = (rule, value, callback) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
  if (value === '') {
    callback(new Error('请输入邮箱'))
  } else if (!emailRegex.test(value)) {
    callback(new Error('请输入有效的邮箱地址'))
  } else {
    callback()
  }
}

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应为3-20个字符', trigger: 'blur' },
  ],
  email: [{ required: true, trigger: 'blur', validator: validateEmail }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应为6-20个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, trigger: 'blur', validator: validateConfirmPassword },
  ],
}

// 处理主题切换
const handleToggleTheme = () => {
  emit('toggleTheme')
}

// 处理注册逻辑
const handleRegister = () => {
  if (!registerFormRef.value) return

  registerFormRef.value.validate(valid => {
    if (valid) {
      loading.value = true

      const formData = new FormData()
      formData.append('username', registerForm.username)
      formData.append('email', registerForm.email)
      formData.append('password', registerForm.password)
      if (registerForm.avatarFile) {
        formData.append('avatar', registerForm.avatarFile)
      }

      axios
        .post(`${API_BASE_URL}/auth/register`, formData)
        .then(response => {
          loading.value = false
          if (response.data.status === 'success') {
            ElMessage.success(response.data.message || '注册成功，请登录')
            emit('register-success', {
              username: registerForm.username,
              email: registerForm.email,
              avatarUrl: response.data.data.avatarUrl,
            })
            setTimeout(() => {
              goToLogin()
            }, 1500)
          } else {
            ElMessage.error(response.data.message || '注册失败，请重试')
          }
        })
        .catch(error => {
          loading.value = false
          let errorMessage = '注册失败，请重试'
          if (error.response) {
            errorMessage = error.response.data.message || errorMessage
            if (error.response.status === 409) {
              if (error.response.data.message.includes('用户名已存在')) {
                errorMessage = '用户名已被使用，请更换用户名'
              } else if (error.response.data.message.includes('邮箱已被注册')) {
                errorMessage = '邮箱已被注册，请使用其他邮箱'
              }
            } else if (
              error.response.status === 400 &&
              error.response.data.message.includes('只允许上传图片文件')
            ) {
              errorMessage = '头像只允许上传图片文件!'
            } else if (
              error.response.status === 400 &&
              error.response.data.message.includes('File too large')
            ) {
              errorMessage = '上传头像图片大小不能超过 5MB!'
            }
          } else if (error.request) {
            errorMessage = '无法连接到服务器，请检查网络连接'
          } else {
            errorMessage = error.message || errorMessage
          }
          ElMessage.error(errorMessage)
        })
    }
  })
}

// 跳转到登录页面
const goToLogin = () => {
  emit('login')
}
</script>

<style scoped>
.register-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-card-wrapper {
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

.register-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  position: relative;
}

.register-title {
  color: var(--text-color, #fff);
  font-weight: 600;
  margin: 0;
  letter-spacing: 1px;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  flex: 1;
}

.form-actions {
  margin-top: 10px;
  margin-bottom: 16px;
}

.register-btn {
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

.register-btn::before {
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

.register-btn:hover:not(:disabled)::before {
  left: 100%;
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(83, 82, 237, 0.4);
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-link {
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

/* 移动端适配 */
@media (max-width: 768px) {
  .register-card-wrapper {
    padding: 10px;
  }

  .register-title {
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

/* 头像上传样式 */
.avatar-uploader .el-upload {
  border: 1px dashed var(--border-color, #d9d9d9);
  border-radius: 50%; /* 圆形 */
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100px; /* 固定大小 */
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 10px; /* 居中并添加底部边距 */
}

.avatar-uploader .el-upload:hover {
  border-color: var(--primary-color);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: var(--text-secondary, #8c939d);
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  object-fit: cover; /* 保持图片比例并填充 */
  border-radius: 50%; /* 确保预览也是圆形的 */
}

.el-upload__tip {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-top: 5px;
}

/* 调整el-form-item的间距 */
.el-form-item {
  margin-bottom: 20px;
}
</style>
