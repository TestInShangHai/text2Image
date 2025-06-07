<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ImageGenerator from './components/ImageGenerator.vue'
import ResultDisplay from './components/ResultDisplay.vue'
import ImageToImageGenerator from './components/ImageToImageGenerator.vue'
import LoginPage from './components/LoginPage.vue'
import RegisterPage from './components/RegisterPage.vue'
import axios from 'axios'
import { API_BASE_URL } from './utils/urlUtils'

const generatedImages = ref([])
const errorMessage = ref('')
const isDarkMode = ref(true) // 默认使用深色模式
const isLoggedIn = ref(false) // 用户登录状态
const currentPage = ref('login') // 当前页面: login, register, main, debug
const currentGenerator = ref('textToImage') // 新增：当前生成器模式
const userInfo = ref(null) // 用户信息

// 检测系统主题偏好
const detectSystemTheme = () => {
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: light)').matches
  ) {
    isDarkMode.value = false
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    isDarkMode.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
  }
}

// 切换主题
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.setAttribute(
    'data-theme',
    isDarkMode.value ? 'dark' : 'light'
  )
}

// 监听系统主题变化
const setupThemeListener = () => {
  if (window.matchMedia) {
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    colorSchemeQuery.addEventListener('change', e => {
      isDarkMode.value = e.matches
      document.documentElement.setAttribute(
        'data-theme',
        e.matches ? 'dark' : 'light'
      )
    })
  }
}

// 全局错误处理
const handleGlobalError = event => {
  console.error('全局错误:', event.error || event.message || '未知错误')
  if (event.error && event.error.message) {
    errorMessage.value = `浏览器错误: ${event.error.message}`
  }
}

// 全局Promise错误处理
const handleUnhandledRejection = event => {
  console.error('未处理的Promise错误:', event.reason)
  if (event.reason && event.reason.message) {
    errorMessage.value = `Promise错误: ${event.reason.message}`
  }
}

// 优化鼠标移动处理函数
const handleMouseMove = e => {
  const mouseGlow = document.querySelector('.mouse-glow')
  if (mouseGlow) {
    const x = (e.clientX / window.innerWidth) * 100
    const y = (e.clientY / window.innerHeight) * 100
    mouseGlow.style.setProperty('--mouse-x', `${x}%`)
    mouseGlow.style.setProperty('--mouse-y', `${y}%`)
  }
}

// 用户登录成功处理
const handleLogin = userData => {
  isLoggedIn.value = true
  userInfo.value = userData
  currentPage.value = 'main'

  // 设置全局Authorization头
  const token =
    localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }
}

// 处理注册成功后的逻辑
const handleRegisterSuccess = data => {
  // 这里可以保存一些注册信息
  console.log('注册成功:', data)
}

// 切换到登录页面
const goToLogin = () => {
  currentPage.value = 'login'
}

// 切换到注册页面
const goToRegister = () => {
  currentPage.value = 'register'
}

// 用户登出
const handleLogout = () => {
  isLoggedIn.value = false
  userInfo.value = null
  currentPage.value = 'login'

  // 清除所有存储的认证信息
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user_info')
  sessionStorage.removeItem('auth_token')
  sessionStorage.removeItem('user_info')

  // 清除Authorization头
  delete axios.defaults.headers.common['Authorization']
}

// 检查本地存储的登录信息
const checkStoredLogin = () => {
  // 首先检查是否有token
  const token =
    localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
  const storedUser =
    localStorage.getItem('user_info') || sessionStorage.getItem('user_info')

  if (token && storedUser) {
    try {
      // 设置全局Authorization头
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // 解析用户信息
      userInfo.value = JSON.parse(storedUser)
      isLoggedIn.value = true
      currentPage.value = 'main'

      // 可以选择验证token是否有效
      // validateToken(token)
    } catch (error) {
      console.error('解析存储的用户信息失败:', error)
      handleLogout() // 出错时登出
    }
  }
}

// 验证token是否有效（可选）
const validateToken = token => {
  // 这里可以添加一个对后端API的请求，验证token是否有效
  // axios.post(`${API_BASE_URL}/auth/validate-token`)
  //   .then(response => {
  //     if (!response.data.valid) {
  //       handleLogout()
  //     }
  //   })
  //   .catch(() => {
  //     handleLogout()
  //   })
}

// 监听全局错误
onMounted(() => {
  window.addEventListener('error', handleGlobalError)
  window.addEventListener('unhandledrejection', handleUnhandledRejection)
  window.addEventListener('mousemove', handleMouseMove)

  // 检查浏览器兼容性
  if (!window.fetch) {
    console.error('浏览器不支持Fetch API')
    errorMessage.value = '您的浏览器不支持现代Web功能，请升级您的浏览器'
  }

  // 检查剪贴板API可用性
  if (!navigator.clipboard) {
    console.warn('浏览器不支持剪贴板API，复制功能可能不可用')
  }

  // 初始化主题设置
  detectSystemTheme()
  setupThemeListener()

  // 检查存储的登录信息
  checkStoredLogin()
})

// 清理事件监听器
onUnmounted(() => {
  window.removeEventListener('error', handleGlobalError)
  window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  window.removeEventListener('mousemove', handleMouseMove)
})

const handleImagesGenerated = data => {
  generatedImages.value = data.images || []
  // 保存图像尺寸信息
  if (data.images && data.images[0] && data.images[0].size) {
    generatedImages.value.imageSize = data.images[0].size
  }
  scrollToResults()
}

const handleError = error => {
  errorMessage.value = error.message || '生成图像时发生错误，请稍后再试'
}

const scrollToResults = () => {
  if (generatedImages.value.length) {
    setTimeout(() => {
      const resultsSection = document.querySelector('.results-section')
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 300)
  }
}

// 清空生成的图像结果
const clearGeneratedImages = () => {
  generatedImages.value = []
}
</script>

<template>
  <div class="app-container">
    <!-- 背景层 -->
    <div class="app-background"></div>
    <div class="mouse-glow"></div>

    <div class="content-container">
      <!-- 根据当前页面显示不同内容 -->
      <template v-if="currentPage === 'login'">
        <login-page
          :isDarkMode="isDarkMode"
          @toggleTheme="toggleTheme"
          @login="handleLogin"
          @register="goToRegister" />
      </template>

      <template v-else-if="currentPage === 'register'">
        <register-page
          :isDarkMode="isDarkMode"
          @toggleTheme="toggleTheme"
          @register-success="handleRegisterSuccess"
          @login="goToLogin" />
      </template>

      <template v-else-if="currentPage === 'main' && isLoggedIn">
        <header class="app-header">
          <div class="user-info">
            <span class="welcome-text">欢迎, {{ userInfo?.username }}</span>
            <el-button size="small" @click="handleLogout" class="logout-btn"
              >退出登录</el-button
            >
          </div>
        </header>

        <main class="app-main">
          <transition name="fade">
            <el-alert
              v-if="errorMessage"
              :title="errorMessage"
              type="error"
              show-icon
              class="error-alert"
              @close="errorMessage = ''" />
          </transition>

          <div class="main-layout-container">
            <div class="sidebar-nav">
              <div class="navigation-tabs">
                <button
                  :class="{ active: currentGenerator === 'textToImage' }"
                  @click="currentGenerator = 'textToImage'">
                  文生图
                </button>
                <button
                  :class="{ active: currentGenerator === 'imageToImage' }"
                  @click="currentGenerator = 'imageToImage'">
                  图生图
                </button>
              </div>
              <div class="placeholder-nav-items">
                <button class="nav-placeholder-btn"></button>
                <button class="nav-placeholder-btn"></button>
              </div>
            </div>

            <div class="content-area">
              <div class="app-sections">
                <div class="generator-section">
                  <image-generator
                    v-if="currentGenerator === 'textToImage'"
                    @images-generated="handleImagesGenerated"
                    @error="handleError"
                    :isDarkMode="isDarkMode"
                    @toggleTheme="toggleTheme" />
                  <image-to-image-generator
                    v-else-if="currentGenerator === 'imageToImage'"
                    @images-generated="handleImagesGenerated"
                    @error="handleError"
                    :isDarkMode="isDarkMode"
                    @toggleTheme="toggleTheme" />
                </div>

                <div class="results-section">
                  <result-display
                    :images="generatedImages"
                    :imageSize="generatedImages.imageSize"
                    @close="clearGeneratedImages" />
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer class="app-footer">
          <p>
            <a
              href="https://beian.miit.gov.cn/#/Integrated/recordQuery"
              target="_blank"
              class="beian-link"
              ></a
            >
          </p>
          <!-- <p class="footer-powered">
            基于 <span class="highlight">SiliconFlow API</span> 提供技术支持
          </p> -->
        </footer>
      </template>
    </div>
  </div>
</template>

<style>
:root {
  --primary-color: #5352ed;
  --secondary-color: #3498db;
  --accent-color: #00c9ff;
  --background-dark: #10101e;
  --card-bg: rgba(255, 255, 255, 0.07);
  --text-color: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --border-radius: 16px;
  --transition-speed: 0.3s;
  --max-content-width: 1200px;
}

/* 添加亮色模式变量 */
@media (prefers-color-scheme: light) {
  :root:not([data-theme='dark']) {
    --primary-color: #4646d9;
    --secondary-color: #2980b9;
    --accent-color: #0078cc;
    --background-dark: #f0f4f8;
    --card-bg: rgba(255, 255, 255, 0.75);
    --text-color: #1a1a2e;
    --text-secondary: rgba(0, 0, 0, 0.65);
    --border-color: rgba(0, 0, 0, 0.1);
  }
}

/* 暗色模式变量 - 手动设置时使用 */
:root[data-theme='dark'] {
  --primary-color: #5352ed;
  --secondary-color: #3498db;
  --accent-color: #00c9ff;
  --background-dark: #10101e;
  --card-bg: rgba(255, 255, 255, 0.07);
  --text-color: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  /* 滑块轨道颜色 - 深色模式 */
  --slider-track-bg: #44475a;
  --slider-track-bg-hover: #555970;
  --border-color: rgba(255, 255, 255, 0.1);
}

/* 亮色模式变量 - 手动设置时使用 */
:root[data-theme='light'] {
  --primary-color: #1976d2;
  --secondary-color: #2196f3;
  --accent-color: #42a5f5;
  --background-dark: #ffffff;
  --card-bg: rgba(255, 255, 255, 0.85);
  --text-color: #2c3e50;
  --text-secondary: rgba(44, 62, 80, 0.7);
  --border-color: rgba(0, 0, 0, 0.08);
  --slider-track-bg: rgba(0, 0, 0, 0.08);
  --slider-track-bg-hover: rgba(0, 0, 0, 0.12);
}

/* 优化卡片玻璃态效果 */
:root[data-theme='light'] .glassmorphic-card {
  backdrop-filter: blur(10px);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 0 0 1px rgba(255, 255, 255, 0.7);
  background: var(--card-bg) !important;
}

/* 重置基础样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

body {
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 修复背景和动效 */
#app {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  margin: 0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-color);
}

/* 背景渐变 */
.app-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -2;
  background: linear-gradient(
    135deg,
    #e8f4ff 0%,
    #e0f1ff 20%,
    #d8edff 40%,
    #d0eaff 60%,
    #c8e6ff 80%,
    #c0e3ff 100%
  );
  transition: all 0.3s ease;
}

/* 暗色主题背景 */
:root[data-theme='dark'] .app-background {
  background: linear-gradient(
    135deg,
    #1a1f25 0%,
    #23292f 20%,
    #2c333a 40%,
    #353d45 60%,
    #3e474f 80%,
    #475159 100%
  );
}

/* 鼠标光晕效果 */
.mouse-glow {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.7;
  mix-blend-mode: multiply;
  transition: background 0.15s ease;
}

/* 亮色主题下的光晕 */
:root[data-theme='light'] .mouse-glow {
  background: radial-gradient(
    circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(100, 181, 246, 0.15) 0%,
    transparent 50%
  );
}

/* 暗色主题下的光晕 */
:root[data-theme='dark'] .mouse-glow {
  background: radial-gradient(
    circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(255, 255, 255, 0.12) 0%,
    transparent 50%
  );
  mix-blend-mode: soft-light;
}

.content-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: 20px;
  padding-top: 80px; /* Add padding for the absolute header */
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: visible; /* 不设置滚动，允许内容流动 */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.app-header {
  position: absolute; /* Fixed position */
  top: 0;
  right: 0;
  width: 100%; /* Spans the full width of content-container */
  padding: 20px; /* Matches content-container padding */
  display: flex;
  justify-content: flex-end; /* Push to right */
  align-items: center;
  z-index: 100;
  background: transparent; /* Or a light transparent background */
  box-sizing: border-box; /* Include padding in width */
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0; /* Remove this as app-header now has padding */
  gap: 15px;
}

.welcome-text {
  color: var(--text-color);
  font-weight: 500;
}

.logout-btn {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  transition: all 0.3s;
}

.logout-btn:hover {
  background-color: rgba(255, 100, 100, 0.15);
  color: #ff6b6b;
}

.app-subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
  max-width: 500px;
  margin: 0 auto;
}

.app-main {
  flex: 1;
  margin-top: 0; /* No need for margin-top if content-container has padding */
  margin-bottom: 80px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.app-sections {
  /* This div now acts as a wrapper for generator and results */
  display: flex;
  flex-direction: column; /* Stack generator and results vertically */
  gap: 30px;
  width: 100%;
}

.error-alert {
  margin-bottom: 20px;
  width: 100%;
}

.app-footer {
  text-align: center;
  padding: 15px 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: fixed;
  bottom: 0;
  left: 0;
  background-color: transparent;
  z-index: 10;
  /* background-color: rgba(0, 0, 0, 0.2); */
}

.footer-powered {
  margin-top: 5px;
  font-size: 0.85rem;
}

.highlight {
  color: var(--accent-color);
  font-weight: 500;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .app-header {
    padding-top: 20px;
    margin-bottom: 20px;
  }

  .user-info {
    flex-direction: column;
    gap: 10px;
    align-items: flex-end;
  }

  .app-subtitle {
    font-size: 0.95rem;
  }

  .content-container {
    padding: 15px 10px;
  }

  .app-sections {
    gap: 20px;
  }

  .app-main {
    margin-bottom: 60px;
  }

  .app-footer {
    padding: 10px 0;
  }
}

@media (min-width: 1024px) {
  .app-sections {
    flex-direction: row;
    align-items: flex-start;
    justify-content: center;
    width: 100%;
  }

  .generator-section {
    flex: 1;
    max-width: 50%;
    padding-right: 15px;
    display: flex;
    justify-content: flex-end;
  }

  .results-section {
    flex: 1;
    max-width: 50%;
    padding-left: 15px;
    display: flex;
    justify-content: flex-start;
  }

  .generator-section > *,
  .results-section > * {
    width: 100%;
    max-width: 600px;
  }
}

.beian-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.3s;
  display: inline-block;
  padding: 5px 0;
  background: transparent !important;
}

.beian-link:hover {
  color: var(--accent-color);
}

/* 调试按钮样式 */
.debug-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

/* 优化卡片玻璃态效果 */
.glassmorphic-card {
  backdrop-filter: blur(10px);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  background: var(--card-bg) !important;
}

/* 添加微光效果 */
.glassmorphic-card::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.05) 50%,
    transparent 50%,
    transparent
  );
  z-index: -1;
  opacity: 0.5;
}

/* 添加主题切换按钮样式 */
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

.request-info {
  margin-top: 24px;
}

/* 新增导航栏样式 */
.navigation-tabs {
  display: flex;
  background: var(--card-bg);
  border-radius: 12px; /* 较小的圆角 */
  padding: 6px; /* 适当的内边距 */
  gap: 8px; /* 按钮之间的间距 */
  margin-bottom: 24px; /* 与下方内容的间距 */
  width: fit-content; /* 宽度适应内容 */
  max-width: 100%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
}

.navigation-tabs button {
  padding: 8px 20px; /* 按钮内边距 */
  border: none;
  background: transparent;
  color: var(--text-secondary); /* 默认字体颜色 */
  font-size: 1rem;
  font-weight: 500;
  border-radius: 8px; /* 按钮圆角 */
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap; /* 防止文字换行 */
}

.navigation-tabs button:hover:not(.active) {
  color: var(--text-color);
  background-color: rgba(255, 255, 255, 0.05); /* 鼠标悬停效果 */
}

.navigation-tabs button.active {
  background-image: linear-gradient(to right, var(--secondary-color), var(--primary-color));
  color: white; /* 选中状态字体颜色 */
  box-shadow: 0 2px 10px rgba(var(--primary-color), 0.3);
}

/* 亮色模式下的导航栏样式 */
:root[data-theme='light'] .navigation-tabs {
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.08);
}

:root[data-theme='light'] .navigation-tabs button:hover:not(.active) {
  background-color: rgba(0, 0, 0, 0.05);
}

:root[data-theme='light'] .navigation-tabs button.active {
  background-image: linear-gradient(to right, var(--primary-color-light), var(--secondary-color-light)); /* 亮色模式下可能需要调整渐变色 */
  color: white;
  box-shadow: 0 2px 10px rgba(var(--primary-color-rgb), 0.2);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .navigation-tabs {
    padding: 4px;
    gap: 6px;
    margin-bottom: 20px;
    width: 100%;
    justify-content: center;
  }

  .navigation-tabs button {
    padding: 6px 15px;
    font-size: 0.9rem;
  }
}

/* 新增的布局样式 */
.main-layout-container {
  display: flex; /* Flexbox for sidebar and content */
  width: 100%;
  gap: 30px; /* Gap between sidebar and main content */
  align-items: flex-start; /* Align content to the top */
}

.sidebar-nav {
  flex-shrink: 0; /* Don't shrink */
  padding-top: 20px; /* Space from top of content area */
  width: 180px; /* Fixed width for the sidebar */
  /* Adjust background/shadow if needed to match image */
}

.sidebar-nav .navigation-tabs {
  flex-direction: column; /* Make buttons stack vertically */
  align-items: flex-start; /* Align buttons to the start of the sidebar */
  padding: 10px; /* Adjust padding for vertical layout */
  gap: 5px; /* Smaller gap between vertical buttons */
  width: 100%; /* Take full width of sidebar */
  margin-bottom: 0; /* Remove existing bottom margin if it's in sidebar */
}

.sidebar-nav .navigation-tabs button {
  width: 100%; /* Make buttons fill the width */
  text-align: left; /* Align text to left */
  padding: 10px 15px; /* Adjust padding for vertical buttons */
}

.content-area {
  flex-grow: 1; /* Take remaining space */
  max-width: calc(100% - 180px - 30px); /* Adjust max-width based on sidebar and gap */
  display: flex;
  flex-direction: column; /* Stack generator and results vertically */
  gap: 30px; /* Gap between generator and results */
}

.generator-section,
.results-section {
  width: 100%; /* Take full width of content-area */
  max-width: none; /* Override previous max-width if any */
}

/* Placeholder buttons for the red boxes */
.placeholder-nav-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
  padding: 0 10px;
}

.nav-placeholder-btn {
  background: var(--card-bg); /* Use card background */
  border: 1px solid var(--border-color); /* Use border color */
  border-radius: 8px;
  height: 40px;
  width: 100%;
  cursor: default;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); /* Optional: subtle shadow */
}

/* Light mode adjustments for placeholder buttons */
:root[data-theme='light'] .nav-placeholder-btn {
  background: rgba(255, 255, 255, 0.7); /* Lighter background in light mode */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
}

/* 响应式调整 */
@media (max-width: 1023px) {
  .main-layout-container {
    flex-direction: column; /* Small screens: stack sidebar and content vertically */
    gap: 20px;
  }

  .sidebar-nav {
    width: 100%; /* Full width for sidebar on small screens */
    padding-top: 0;
    display: flex; /* Make it horizontal for smaller screens */
    justify-content: center; /* Center the navigation tabs */
  }

  .sidebar-nav .navigation-tabs {
    flex-direction: row; /* Horizontal navigation tabs for smaller screens */
    width: fit-content;
    padding: 6px;
    gap: 8px;
    margin-bottom: 0;
  }

  .sidebar-nav .navigation-tabs button {
    width: auto;
    text-align: center;
    padding: 8px 15px;
  }

  .content-area {
    max-width: 100%;
  }

  .placeholder-nav-items {
    display: none; /* Hide placeholder buttons on small screens, or adjust their layout */
  }
}
</style>
