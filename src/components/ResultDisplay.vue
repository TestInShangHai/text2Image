/* eslint-disable */
<template>
  <div v-if="images && images.length" class="results-container">
    <glassmorphic-card variant="primary">
      <div class="result-header">
        <h3 class="result-title">生成结果</h3>
        <div class="header-actions">
          <el-button
            size="small"
            class="download-all-btn"
            :disabled="downloadingAll"
            @click="downloadAllImages">
            <el-icon v-if="!downloadingAll"><Download /></el-icon>
            <el-icon v-else class="is-loading"><Loading /></el-icon>
            <span>{{
              downloadingAll
                ? '打开中...'
                : images.length === 1
                  ? '下载'
                  : '下载全部'
            }}</span>
          </el-button>
          <el-button
            class="close-btn"
            circle
            size="small"
            @click="closeResultPanel">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <div class="result-stats">
        <div class="stat-item">
          <div class="stat-value">{{ images.length }}</div>
          <div class="stat-label">图像</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ getImageSize() }}</div>
          <div class="stat-label">尺寸</div>
        </div>
        <div class="stat-item" v-if="createdTime">
          <div class="stat-value time-value">
            <div class="date-value">{{ createdTime.date }}</div>
            <div class="time-value">{{ createdTime.time }}</div>
          </div>
          <div class="stat-label">生成时间</div>
        </div>
      </div>

      <div class="image-grid">
        <div
          v-for="(image, index) in images"
          :key="index"
          class="image-container">
          <div class="image-number">{{ index + 1 }}</div>
          <el-image
            :src="image.url"
            fit="cover"
            :preview-src-list="imageUrls"
            :initial-index="index"
            :preview-teleported="true"
            loading="lazy"
            class="result-image"
            @click="handleImageClick">
            <template #placeholder>
              <div class="image-placeholder">
                <el-icon class="is-loading"><Loading /></el-icon>
              </div>
            </template>
            <template #error>
              <div class="image-error">
                <el-icon><PictureFilled /></el-icon>
                <span>加载失败</span>
              </div>
            </template>
          </el-image>

          <div class="image-actions">
            <el-tooltip content="下载图片" placement="top">
              <el-button
                class="action-btn"
                :loading="downloadingIndex === index"
                @click="downloadImage(image.url, index)">
                <el-icon><Download /></el-icon>
              </el-button>
            </el-tooltip>

            <el-tooltip content="复制链接" placement="top">
              <el-button class="action-btn" @click="copyImageUrl(image.url)">
                <el-icon><Link /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>

      <div class="tip-text">
        <el-icon><InfoFilled /></el-icon>
        <span>点击图像可查看大图</span>
      </div>
    </glassmorphic-card>
  </div>
  <div v-else class="results-container">
    <glassmorphic-card variant="primary">
      <div class="result-header">
        <h3 class="result-title">生成结果</h3>
      </div>
      <div class="result-stats">
        <div class="stat-item">
          <div class="stat-value">-</div>
          <div class="stat-label">图像</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">-</div>
          <div class="stat-label">尺寸</div>
        </div>
        <div class="stat-item">
          <div class="stat-value time-value">-</div>
          <div class="stat-label">生成时间</div>
        </div>
      </div>
      <div class="image-grid">
        <div class="image-container">
          <el-image
              src="https://placehold.co/512x512/e2e8f0/1e293b?text=等待生成图片"
              fit="cover"
              class="result-image"
          >
          </el-image>
        </div>
      </div>
      <div class="tip-text">
        <el-icon><InfoFilled /></el-icon>
        <span>生成图片将在此处展示</span>
      </div>
    </glassmorphic-card>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import {
  Download,
  Loading,
  Link,
  InfoFilled,
  PictureFilled,
  Close,
} from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import GlassmorphicCard from './GlassmorphicCard.vue'

const props = defineProps({
  images: {
    type: Array,
    default: () => [],
  },
  imageSize: {
    type: String,
    default: '',
  },
})

const downloadingIndex = ref(-1)
const downloadingAll = ref(false)
const loadingErrors = ref({}) // 记录图片加载错误状态
const isMounted = ref(true) // 跟踪组件是否挂载

// 添加emit定义
const emit = defineEmits(['close'])

// 组件卸载时设置状态
onUnmounted(() => {
  isMounted.value = false
})

const imageUrls = computed(() => props.images.map(img => img.url))

// 检查图片URL的有效性
onMounted(() => {
  if (props.images && props.images.length > 0) {
    props.images.forEach((image, index) => {
      if (image && image.url) {
        // 检查URL是否有效
        const img = new Image()
        const timeoutId = setTimeout(() => {
          if (isMounted.value) {
            console.error(`图片加载超时: ${image.url}`)
            loadingErrors.value[index] = true
          }
        }, 15000) // 15秒超时

        img.onload = () => {
          clearTimeout(timeoutId)
          if (isMounted.value) {
            console.log(
              `图片 ${index + 1} 加载成功: ${image.url.substring(0, 50)}...`
            )
            loadingErrors.value[index] = false
          }
        }

        img.onerror = () => {
          clearTimeout(timeoutId)
          if (isMounted.value) {
            console.error(
              `图片 ${index + 1} 加载失败: ${image.url.substring(0, 50)}...`
            )
            loadingErrors.value[index] = true
          }
        }

        img.src = image.url
      } else {
        console.error(`图片 ${index + 1} URL无效:`, image)
        loadingErrors.value[index] = true
      }
    })
  }
})

const createdTime = computed(() => {
  const now = new Date()
  const date = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const time = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  return { date, time }
})

const getImageSize = () => {
  // 优先使用传入的尺寸信息
  if (props.imageSize) {
    return props.imageSize
  }

  // 尝试从图片获取尺寸
  if (props.images && props.images.length > 0) {
    const img = new Image()
    img.src = props.images[0].url
    if (img.width && img.height) {
      return `${img.width}×${img.height}`
    }
  }

  return '未知'
}

const downloadImage = async (url, index) => {
  if (!url) {
    console.error('下载失败: URL无效')
    ElNotification({
      title: '下载失败',
      message: 'URL无效，无法下载图片',
      type: 'error',
      duration: 4000,
      showClose: true,
    })
    return
  }

  try {
    downloadingIndex.value = index
    console.log(`开始下载图片 ${index + 1}: ${url.substring(0, 50)}...`)

    // 创建一个链接并打开图片，让用户手动保存
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    ElNotification({
      title: '图片已打开',
      message: '图片已在新标签页打开，请右键保存',
      type: 'success',
      duration: 5000,
      showClose: true,
    })

    console.log(`图片 ${index + 1} 已打开`)
  } catch (error) {
    // 如果组件已卸载，不继续处理错误
    if (!isMounted.value) return

    console.error('下载图片失败:', error)

    ElNotification({
      title: '图片已尝试打开',
      message: '无法直接下载，已尝试在新标签页打开',
      type: 'warning',
      duration: 4000,
      showClose: true,
    })
  } finally {
    // 只有组件仍然挂载时才更新状态
    if (isMounted.value) {
      downloadingIndex.value = -1
    }
  }
}

const downloadAllImages = async () => {
  if (downloadingAll.value) return
  if (!props.images || props.images.length === 0) {
    console.error('没有可下载的图片')
    ElNotification({
      title: '无图片',
      message: '没有可下载的图片',
      type: 'warning',
      duration: 3000,
      showClose: true,
    })
    return
  }

  downloadingAll.value = true
  let openedCount = 0

  try {
    // 当打开多个标签页时，浏览器可能会阻止弹窗，提醒用户
    if (props.images.length > 1) {
      ElNotification({
        title: '打开多个图片',
        message: '系统将尝试打开多个标签页，请允许弹窗',
        type: 'info',
        duration: 5000,
        showClose: true,
      })
      // 等待通知显示
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 遍历打开所有图片
    for (let i = 0; i < props.images.length; i++) {
      // 如果组件已卸载，不继续处理
      if (!isMounted.value) break

      if (props.images[i] && props.images[i].url) {
        try {
          // 创建新标签页打开图片
          const link = document.createElement('a')
          link.href = props.images[i].url
          link.target = '_blank'
          link.rel = 'noopener noreferrer'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          // 短暂延迟，避免浏览器拦截过多弹窗
          await new Promise(resolve => setTimeout(resolve, 300))

          openedCount++
          console.log(`图片 ${i + 1} 已在新标签页打开`)
        } catch (error) {
          console.error(`图片 ${i + 1} 打开失败:`, error)
        }
      }
    }

    // 如果组件已卸载，不继续处理
    if (!isMounted.value) return

    if (openedCount === 0) {
      ElNotification({
        title: '打开失败',
        message:
          props.images.length === 1
            ? '图片打开失败，请检查浏览器是否阻止了弹窗'
            : '所有图片打开失败，请检查浏览器是否阻止了弹窗',
        type: 'error',
        duration: 4000,
        showClose: true,
      })
    } else if (openedCount < props.images.length) {
      ElNotification({
        title: '部分图片已打开',
        message: `已打开 ${openedCount}/${props.images.length} 张图片，请在新标签页右键保存`,
        type: 'warning',
        duration: 4000,
        showClose: true,
      })
    } else {
      ElNotification({
        title: props.images.length === 1 ? '图片已打开' : '所有图片已打开',
        message:
          props.images.length === 1
            ? '图片已在新标签页打开，请右键保存'
            : `已打开 ${openedCount} 张图片，请在新标签页右键保存`,
        type: 'success',
        duration: 3000,
        showClose: true,
      })
    }
  } catch (error) {
    // 如果组件已卸载，不继续处理错误
    if (!isMounted.value) return

    console.error('批量打开失败:', error)
    ElNotification({
      title: '操作失败',
      message: '请检查浏览器是否阻止了弹窗',
      type: 'error',
      duration: 4000,
      showClose: true,
    })
  } finally {
    // 只有组件仍然挂载时才更新状态
    if (isMounted.value) {
      downloadingAll.value = false
    }
  }
}

const copyImageUrl = url => {
  if (!url) {
    console.error('复制失败: URL无效')
    ElNotification({
      title: '复制失败',
      message: 'URL无效，无法复制链接',
      type: 'error',
      duration: 4000, // 设置显示时间为4秒
      showClose: true,
    })
    return
  }

  // 检查Clipboard API是否可用
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        // 如果组件已卸载，不继续处理
        if (!isMounted.value) return

        console.log('图片链接复制成功')
        ElNotification({
          title: '复制成功',
          message: '图片链接已复制到剪贴板',
          type: 'success',
          duration: 3000,
          showClose: true,
        })
      })
      .catch(error => {
        // 如果组件已卸载，不继续处理错误
        if (!isMounted.value) return

        console.error('复制图片链接失败:', error)
        fallbackCopy(url)
      })
  } else {
    // 使用备用复制方法
    fallbackCopy(url)
  }
}

// 添加备用复制方法
const fallbackCopy = text => {
  try {
    // 创建临时文本区域
    const textArea = document.createElement('textarea')
    textArea.value = text

    // 确保文本区域不可见
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)

    // 选择文本并尝试复制
    textArea.focus()
    textArea.select()

    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)

    if (successful) {
      console.log('图片链接复制成功(备用方法)')
      ElNotification({
        title: '复制成功',
        message: '图片链接已复制到剪贴板',
        type: 'success',
        duration: 3000,
        showClose: true,
      })
    } else {
      throw new Error('备用复制方法失败')
    }
  } catch (err) {
    console.error('备用复制方法失败:', err)
    ElNotification({
      title: '复制失败',
      message: '无法复制图片链接，请手动复制',
      type: 'error',
      duration: 4000,
      showClose: true,
    })
  }
}

// 添加handleImageClick函数
const handleImageClick = () => {
  // 可以在这里添加点击图片时的额外处理逻辑
  console.log('图片被点击')
}

// 关闭结果面板
const closeResultPanel = () => {
  console.log('关闭结果面板')
  emit('close')
}
</script>

<style scoped>
.results-container {
  opacity: 0;
  animation: fadeIn 0.5s ease forwards;
  width: 100%;
  display: flex;
  flex-direction: column;
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

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.result-title {
  color: var(--text-color, #fff);
  margin: 0;
  letter-spacing: 1px;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-weight: 600;
  font-size: 1.4rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.download-all-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--card-bg, rgba(255, 255, 255, 0.1));
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: var(--text-color, white);
  padding: 8px 12px;
  transition: all 0.3s;
}

.download-all-btn:hover:not(:disabled) {
  background: rgba(var(--primary-color, 83, 82, 237), 0.1);
  border-color: var(--primary-color, rgba(255, 255, 255, 0.3));
}

.result-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 12px;
  background: var(--card-bg, rgba(0, 0, 0, 0.2));
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  align-items: flex-end;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color, white);
  min-height: 40px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
  margin-top: 4px;
}

.stat-value.time-value {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
  min-height: 40px;
  justify-content: flex-end;
}

.date-value {
  font-size: 0.9rem;
  margin-bottom: 2px;
}

.time-value {
  font-size: 1rem;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  padding-bottom: 16px; /* 为底部留出空间 */
}

/* 自定义滚动条样式 */
.image-grid::-webkit-scrollbar {
  width: 6px;
}

.image-grid::-webkit-scrollbar-track {
  background: rgba(var(--text-color, 255, 255, 255), 0.1);
}

.image-grid::-webkit-scrollbar-thumb {
  background: rgba(var(--text-color, 255, 255, 255), 0.2);
  border-radius: 3px;
}

.image-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--text-color, 255, 255, 255), 0.3);
}

.image-container {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: var(--card-bg, rgba(0, 0, 0, 0.2));
  transition:
    transform 0.3s,
    box-shadow 0.3s;
  border: 1px solid rgba(var(--text-color, 255, 255, 255), 0.05);
  display: flex;
  flex-direction: column;
}

.image-container:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.image-number {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 10px;
  z-index: 1;
}

.result-image {
  width: 100%;
  height: 100%;
  cursor: zoom-in !important;
  transition: all 0.3s ease;
  z-index: 1;
}

.image-container:hover .result-image {
  transform: scale(1.05);
}

.image-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  color: white;
  font-size: 24px;
}

.image-error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.7);
  gap: 10px;
}

.image-error .el-icon {
  font-size: 32px;
  opacity: 0.8;
}

.image-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  transform: translateY(100%);
  transition: transform 0.3s;
  z-index: 3;
}

:root[data-theme='light'] .image-actions {
  background: rgba(0, 0, 0, 0.5);
}

.image-container:hover .image-actions {
  transform: translateY(0);
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.tip-text {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  justify-content: center;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .results-container {
    width: 100%;
    height: auto;
    padding: 0; /* 移除内边距 */
  }

  .result-header {
    margin-bottom: 12px;
  }

  .result-title {
    font-size: 1.1rem;
  }

  .download-all-btn {
    padding: 6px 10px;
    font-size: 0.9rem;
  }

  .result-stats {
    padding: 8px;
    gap: 12px;
    margin-bottom: 12px;
    align-items: flex-end;
  }

  .stat-item {
    flex: 1;
  }

  .stat-value {
    font-size: 1rem;
    min-height: 32px;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .image-grid {
    grid-template-columns: repeat(2, 1fr); /* 固定两列布局 */
    gap: 8px;
  }

  .image-number {
    width: 20px;
    height: 20px;
    font-size: 10px;
    top: 6px;
    left: 6px;
  }

  .image-actions {
    transform: translateY(0);
    opacity: 0.95;
    padding: 6px;
    gap: 6px;
  }

  .action-btn {
    width: 28px;
    height: 28px;
    font-size: 0.9em;
  }

  .tip-text {
    font-size: 0.8rem;
    margin-top: 12px;
    padding: 0 8px;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .header-actions {
    gap: 6px;
  }
}

/* 超小屏幕适配 */
@media (max-width: 360px) {
  .image-grid {
    grid-template-columns: 1fr; /* 单列布局 */
  }

  .result-stats {
    gap: 8px;
  }

  .stat-value {
    font-size: 0.9rem;
  }

  .stat-label {
    font-size: 0.7rem;
  }
}

/* 增强图片预览样式 */
:deep(.el-image-viewer__wrapper) {
  z-index: 2100; /* 确保预览层级足够高 */
  background-color: rgba(0, 0, 0, 0.9); /* 增加背景暗度 */
}

:deep(.el-image-viewer__img) {
  max-width: 95%; /* 调整为更大的宽度比例 */
  max-height: 95vh; /* 调整为更大的高度比例 */
  object-fit: contain;
}

:deep(.el-image-viewer__canvas) {
  width: 100%;
  height: 100vh; /* 确保画布占满全屏 */
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-image-viewer__close) {
  color: #fff;
  font-size: 32px; /* 放大关闭按钮 */
  top: 25px;
  right: 25px;
}

:deep(.el-image-viewer__actions) {
  padding: 25px 0; /* 增加操作区的大小 */
}

:deep(.el-image-viewer__prev),
:deep(.el-image-viewer__next) {
  color: #fff;
  font-size: 44px; /* 放大翻页按钮 */
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  width: 60px; /* 增加按钮尺寸 */
  height: 60px; /* 增加按钮尺寸 */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 添加桌面端优化 */
@media (min-width: 1024px) {
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }

  .image-container {
    max-width: 280px;
    justify-self: center;
    width: 100%;
  }
}

/* 亮色模式下图片网格和容器的特殊样式 */
:root[data-theme='light'] .image-container {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

:root[data-theme='light'] .image-number {
  background: rgba(0, 0, 0, 0.4);
}

:root[data-theme='light'] .image-placeholder {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-color);
}

:root[data-theme='light'] .image-error {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-secondary);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-bg, rgba(255, 255, 255, 0.1));
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--text-secondary);
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(255, 0, 0, 0.15);
  color: var(--text-color);
  transform: rotate(90deg);
}
</style>
