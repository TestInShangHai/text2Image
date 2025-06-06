<template>
  <glassmorphic-card variant="primary" :showGlow="true">
    <div class="generator-header">
      <h2 class="generator-title">文字生成图像</h2>

      <!-- 添加主题切换按钮到右上角 -->
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

    <el-form label-position="top">
      <el-form-item>
        <template #label>
          <div class="form-label">
            <span>描述你想要的图像</span>
            <el-tooltip
              content="尽可能详细描述你想要的图像，包括风格、场景、色彩等"
              placement="top">
              <el-icon class="help-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="prompt"
          type="textarea"
          :rows="3"
          placeholder="描述你想要生成的图片..."
          :disabled="loading"
          @keydown.enter.prevent="handleGenerate" />
        <div class="character-count" :class="{ warning: prompt.length > 950 }">
          {{ prompt.length }}/1000
        </div>
      </el-form-item>

      <div class="form-row">
        <el-form-item label="图像尺寸" class="form-item-col">
          <div class="size-selector">
            <el-select
              v-model="selectedSize"
              placeholder="选择分辨率"
              class="size-select"
              :disabled="loading">
              <el-option
                v-for="option in sizeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value" />
            </el-select>

            <div v-if="selectedSize === 'custom'" class="custom-size-inputs">
              <el-input-number
                v-model="width"
                :min="256"
                :max="1280"
                :step="64"
                :disabled="loading"
                @change="updateSelectedSize"
                class="size-input" />
              <span class="size-separator">×</span>
              <el-input-number
                v-model="height"
                :min="256"
                :max="1280"
                :step="64"
                :disabled="loading"
                @change="updateSelectedSize"
                class="size-input" />
            </div>
          </div>
        </el-form-item>

        <el-form-item label="生成数量" class="form-item-col">
          <el-select
            v-model="imageCount"
            placeholder="选择生成数量"
            class="count-select"
            :disabled="loading">
            <el-option
              v-for="num in 4"
              :key="num"
              :label="`${num}张图片`"
              :value="num" />
          </el-select>
        </el-form-item>
      </div>

      <div class="additional-options" v-if="showAdditionalOptions">
        <glassmorphic-card variant="dark" :withBorder="false">
          <h4 class="options-title">高级选项</h4>

          <el-form-item label="负向提示词">
            <el-input
              v-model="negativePrompt"
              type="textarea"
              :rows="2"
              resize="none"
              placeholder="排除不需要的元素，例如：模糊, 失真, 低画质" />
          </el-form-item>

          <div class="form-row">
            <el-form-item label="风格强度" class="form-item-col">
              <div class="slider-container">
                <el-slider
                  v-model="guidanceScale"
                  :min="1"
                  :max="20"
                  :step="0.5"
                  :disabled="loading"
                  :format-tooltip="
                    value =>
                      Math.floor(value) === value
                        ? value.toString()
                        : value.toFixed(1)
                  "
                  class="guidance-scale-slider" />
                <div class="slider-value">
                  {{
                    Math.floor(guidanceScale) === guidanceScale
                      ? guidanceScale
                      : guidanceScale.toFixed(1)
                  }}
                </div>
              </div>
            </el-form-item>

            <el-form-item label="采样步数" class="form-item-col">
              <div class="slider-container">
                <el-slider
                  v-model="steps"
                  :min="1"
                  :max="100"
                  :step="1"
                  :disabled="loading"
                  class="steps-slider" />
                <div class="slider-value">{{ steps }}</div>
              </div>
            </el-form-item>
          </div>
        </glassmorphic-card>
      </div>

      <div class="form-actions">
        <el-button
          link
          @click="showAdditionalOptions = !showAdditionalOptions"
          class="toggle-options-btn">
          {{ showAdditionalOptions ? '隐藏高级选项' : '显示高级选项' }}
          <el-icon
            class="toggle-icon"
            :class="{ 'is-expanded': showAdditionalOptions }">
            <ArrowDown />
          </el-icon>
        </el-button>

        <el-button
          type="primary"
          :loading="loading"
          @click="handleGenerate"
          class="generate-btn"
          :disabled="!prompt.trim()">
          <div class="btn-content">
            <el-icon v-if="!loading"><MagicStick /></el-icon>
            <span>{{ loading ? '生成中...' : '生成图像' }}</span>
          </div>
        </el-button>
      </div>
    </el-form>
  </glassmorphic-card>
</template>

<script setup>
import { ref, onUnmounted, watch } from 'vue'
import {
  MagicStick,
  InfoFilled,
  ArrowDown,
  Expand,
} from '@element-plus/icons-vue'
import GlassmorphicCard from './GlassmorphicCard.vue'
import axios from 'axios'

// 接收从父组件传来的isDarkMode和toggleTheme
const props = defineProps({
  isDarkMode: {
    type: Boolean,
    default: true,
  },
})

const loading = ref(false)
const showAdditionalOptions = ref(false)
const prompt = ref('')
const width = ref(1280)
const height = ref(1280)
const negativePrompt = ref('')
const guidanceScale = ref(7)
const steps = ref(30)
const imageCount = ref(1)

// 添加清理函数引用
let cleanupFunction = null

// 组件卸载时清理资源
onUnmounted(() => {
  if (typeof cleanupFunction === 'function') {
    cleanupFunction()
  }
})

// 预设的分辨率选项
const sizeOptions = [
  { value: '512x512', label: '512×512', width: 512, height: 512 },
  { value: '768x768', label: '768×768', width: 768, height: 768 },
  { value: '768x512', label: '768×512', width: 768, height: 512 },
  { value: '512x768', label: '512×768', width: 512, height: 768 },
  { value: '768x1024', label: '768×1024', width: 768, height: 1024 },
  { value: 'custom', label: '自定义尺寸' },
]

const selectedSize = ref('512x512')

// 设置预设分辨率
const setPresetSize = value => {
  const option = sizeOptions.find(opt => opt.value === value)
  if (option && option.value !== 'custom') {
    width.value = option.width
    height.value = option.height
  }
}

// 初始化时设置默认尺寸
setPresetSize('512x512')

// 当宽度或高度改变时，检查是否匹配某个预设
const updateSelectedSize = () => {
  const matchedOption = sizeOptions.find(
    opt => opt.width === width.value && opt.height === height.value
  )
  selectedSize.value = matchedOption ? matchedOption.value : 'custom'
}

const emit = defineEmits(['imagesGenerated', 'error', 'toggleTheme'])

// 处理主题切换
const handleToggleTheme = () => {
  emit('toggleTheme')
}

const generateImage = async () => {
  if (!prompt.value.trim()) {
    return
  }

  loading.value = true
  let isMounted = true // 添加组件挂载状态检查

  // 组件卸载时的清理函数
  const cleanup = () => {
    isMounted = false
  }

  // 保存清理函数供后续使用
  if (typeof cleanupFunction === 'function') {
    cleanupFunction()
  }
  cleanupFunction = cleanup

  try {
    // 验证提示词长度
    if (prompt.value.length > 1000) {
      throw new Error('提示词过长，请保持在1000字符以内')
    }

    // 构建请求参数
    const requestParams = {
      workflow: 'TextToImage.json',
      prompt: prompt.value.trim(),
      batchSize: Math.max(1, Math.min(4, parseInt(imageCount.value))),
      image_size: `${width.value}x${height.value}`,
      model: 'Kwai-Kolors/Kolors',
      width: `${width.value}`,
      height: `${height.value}`
    }

    // 添加可选参数
    if (showAdditionalOptions.value) {
      if (negativePrompt.value.trim()) {
        requestParams.negative_prompt = negativePrompt.value.trim()
      }
      requestParams.guidance_scale = Math.max(
        1,
        Math.min(20, parseFloat(guidanceScale.value))
      )
      requestParams.num_inference_steps = Math.max(
        1,
        Math.min(100, parseInt(steps.value))
      )
    }

    // 验证API密钥
    const apiKey = import.meta.env.VITE_SILICONFLOW_API_KEY
    // if (!apiKey) {
    //   console.error('API密钥验证失败: API密钥未配置')
    //   throw new Error('API密钥未配置，请检查环境变量VITE_SILICONFLOW_API_KEY')
    // }

    // 打印参数（不包含完整图片数据以避免日志过大）
    const logParams = { ...requestParams }
    if (logParams.image) {
      logParams.image = `${logParams.image.substring(
        0,
        30
      )}... [base64数据已截断]`
    }
    if (logParams.prompt) {
      logParams.prompt = logParams.prompt.substring(0, 20) + '...'
    }
    console.log('正在请求图像生成，参数:', JSON.stringify(logParams))

    // 发送请求
    const response = await axios.post(
      //'https://api.siliconflow.cn/v1/images/generations',
        'http://192.168.31.224:18009/comfyui/prompt',
      requestParams,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    )

    // 如果组件已卸载，不继续处理
    if (!isMounted) return

    console.log('API响应状态:', response.status)

    console.log('API响应数据:', response.data)

    // 检查响应数据
    if (!response.data) {
      console.error('API响应格式错误:', response.data)
      throw new Error('服务器返回的数据格式不正确')
    }
    if (response.data.code !== 200) {
      console.error('API未返回图片URL:', response.data)
      throw new Error(response.data.message || '生成失败')
    }
    if (!response.data.result || !response.data.result.data || !response.data.result.data.url) {
      throw new Error('服务器返回的数据中缺少图片URL')
    }

    // 检查是否有错误信息
    if (response.data.result.data && response.data.code === 500) {
      console.error('服务器内部错误:', response.data.result.data.msg)
      throw new Error(response.data.result.data.msg || '服务器内部错误')
    }

    // 检查图片URL数据是否存在
    if (!response.data.result.data || !response.data.result.data.url) {
      console.error('API响应中缺少图片URL数据:', response.data)
      throw new Error('服务器返回的数据中缺少图片URL')
    }

    // 构建图片数据对象数组
    const imageDataArray = response.data.result.data.url.map(url => ({
      url: url,
      size: `${width.value}×${height.value}`
    }))

    // 发出事件，传递图片数据
    emit('imagesGenerated', { images: imageDataArray })
  } catch (error) {
    // 如果组件已卸载，不继续处理错误
    if (!isMounted) return

    console.error('图像生成失败:', error)

    // 增强错误信息
    if (error.response) {
      // 服务器响应了错误状态码
      console.error('API错误响应:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      })
      emit('error', {
        message: `API错误 (${error.response.status}): ${
          error.response.data?.error?.message ||
          error.response.statusText ||
          '未知错误'
        }`,
      })
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('API无响应:', error.request)
      emit('error', { message: '服务器无响应，请检查网络连接' })
    } else {
      // 请求配置或其他错误
      emit('error', { message: error.message || '图像生成失败，请稍后重试' })
    }
  } finally {
    // 如果组件仍然挂载，则更新状态
    if (isMounted) {
      loading.value = false
    }
  }
}

const handleGenerate = () => {
  generateImage()
}

// 监听分辨率选择变化
watch(selectedSize, newVal => {
  setPresetSize(newVal)
})

// 监听宽度和高度变化
watch([width, height], () => {
  updateSelectedSize()
})
</script>

<style scoped>
.generator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  position: relative;
}

.generator-title {
  color: var(--text-color, #fff);
  font-weight: 600;
  margin: 0;
  letter-spacing: 1px;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.tech-icon-container {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(var(--primary-color), 0.2);
  box-shadow: 0 3px 10px rgba(var(--primary-color), 0.15);
}

.tech-icon {
  font-size: 20px;
  color: var(--primary-color);
}

.form-label {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.help-icon {
  margin-left: 6px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-item-col {
  flex: 1;
}

.full-width {
  width: 100%;
}

.number-control {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-bg, rgba(255, 255, 255, 0.05));
  border-radius: 8px;
  padding: 3px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
}

.number-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
}

.number-btn:hover:not(:disabled) {
  color: var(--text-color);
  background: rgba(var(--primary-color), 0.1);
}

.number-display {
  min-width: 40px;
  text-align: center;
  font-weight: 600;
  font-size: 16px;
  color: var(--text-color);
}

.character-count {
  text-align: right;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.character-count.warning {
  color: #e6a23c;
}

.option-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-color);
}

.additional-options {
  margin-bottom: 20px;
}

.options-title {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.slider-container {
  width: 100%;
  padding: 0 4px;
  display: flex;
  align-items: center;
  position: relative;
  margin: 10px 0;
}

.guidance-scale-slider,
.steps-slider {
  width: calc(100% - 40px);
  margin-right: 10px;
}

.slider-value {
  min-width: 30px;
  text-align: right;
  font-weight: 500;
  font-size: 14px;
  color: var(--text-color);
}

:deep(.el-slider) {
  --el-slider-height: 10px; /* 增加高度 */
  --el-slider-button-size: 20px;
}

:deep(.el-slider__runway) {
  height: var(--el-slider-height);
  border-radius: calc(var(--el-slider-height) / 2);
  background-color: var(--slider-track-bg);
  margin: 16px 0;
  transition: background-color 0.3s ease;
}

:deep(.el-slider:hover .el-slider__runway) {
  background-color: var(--slider-track-bg-hover);
}

:deep(.el-slider__bar) {
  height: var(--el-slider-height);
  border-radius: calc(var(--el-slider-height) / 2);
  background: linear-gradient(
    90deg,
    var(--secondary-color),
    var(--primary-color)
  );
}

:deep(.el-slider__button) {
  border: none;
  background: #fff;
  width: var(--el-slider-button-size);
  height: var(--el-slider-button-size);
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

:deep(.el-slider__button:hover) {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.4);
}

:deep(.el-slider__button-wrapper) {
  top: calc((var(--el-slider-height) - var(--el-slider-button-size)) / 2);
  width: var(--el-slider-button-size);
  height: var(--el-slider-button-size);
}

/* 移除不再需要的标记点样式 */
:deep(.el-slider__stop) {
  display: none;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
}

.toggle-options-btn {
  color: var(--accent-color);
  padding: 8px 4px;
  font-size: 14px;
}

.toggle-icon {
  margin-left: 4px;
  transition: transform 0.3s;
}

.toggle-icon.is-expanded {
  transform: rotate(180deg);
}

.generate-btn {
  flex: 1;
  max-width: 200px;
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

.generate-btn::before {
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

.generate-btn:hover:not(:disabled)::before {
  left: 100%;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(83, 82, 237, 0.4);
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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

:deep(.el-select .el-input .el-select__caret) {
  color: var(--text-secondary);
}

.uploaded-image-preview {
  margin-bottom: 20px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.preview-header span {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-color, rgba(255, 255, 255, 0.9));
}

.preview-header small {
  font-size: 12px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
  font-weight: normal;
}

.image-preview-container {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: var(--card-bg, rgba(0, 0, 0, 0.2));
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 250px;
  object-fit: contain;
  border-radius: 6px;
}

.upload-icon {
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-icon:hover {
  background: rgba(83, 82, 237, 0.4);
  transform: translateY(-2px);
}

.is-loading {
  opacity: 0.5;
  pointer-events: none;
}

.remove-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary, white);
  padding: 0;
  margin: 0;
  font: inherit;
  cursor: pointer;
  outline: inherit;
}

.image-info {
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  margin-top: 8px;
}

:deep(.el-select-dropdown__item) {
  color: var(--text-color);
}

:deep(.el-select-dropdown) {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
}

:deep(.el-popper.is-light .el-popper__arrow::before) {
  background: var(--card-bg);
  border-color: var(--border-color);
}

.size-selector {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
}

.size-select {
  width: 100%;
}

.custom-size-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.size-input {
  width: 100px;
}

.size-separator {
  font-weight: 600;
  margin: 0 4px;
}

.count-select {
  width: 100%;
}

:deep(.el-select-dropdown__item) {
  text-align: center;
}

:deep(.el-input__inner) {
  text-align: center;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .generator-title {
    font-size: 1.5rem;
  }

  .generate-btn {
    max-width: none;
  }
}

@media (min-width: 1024px) {
  .generator-header {
    align-items: center;
    justify-content: space-between;
  }

  .form-row {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    align-items: center;
  }

  :deep(.el-form-item__label) {
    text-align: left;
  }

  :deep(.el-form) {
    width: 100%;
  }
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
</style>
