<template>
  <glassmorphic-card variant="primary" :showGlow="true">
    <div class="generator-header">
      <h2 class="generator-title">图生图</h2>
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
            <span>上传图片</span>
            <el-tooltip
              content="上传一张基础图片，AI将在此基础上进行创作"
              placement="top">
              <el-icon class="help-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-upload
          class="image-uploader"
          drag
          action="#"
          :show-file-list="false"
          :auto-upload="false"
          :on-change="handleImageUpload"
          :disabled="loading">
          <img v-if="uploadedImageUrl" :src="uploadedImageUrl" class="uploaded-image" />
          <div v-else class="upload-placeholder">
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或 <em>点击上传</em></div>
          </div>
        </el-upload>
        <el-button v-if="uploadedImageUrl" @click="removeUploadedImage" class="remove-image-btn" type="danger" size="small">移除图片</el-button>
      </el-form-item>

      <el-form-item>
        <template #label>
          <div class="form-label">
            <span>图片描述</span>
            <el-tooltip
              content="描述你想要的图像，AI将结合上传图片进行创作"
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

      <!-- 高级选项 -->
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

          <el-form-item label="重绘幅度">
            <div class="slider-container">
              <el-slider
                v-model="strength"
                :min="0.1"
                :max="1"
                :step="0.05"
                :disabled="loading"
                :format-tooltip="value => value.toFixed(2)"
                class="strength-slider" />
              <div class="slider-value">{{ strength.toFixed(2) }}</div>
            </div>
          </el-form-item>

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
          :disabled="!prompt.trim() || !uploadedImageBase64">
          <div class="btn-content">
            <el-icon v-if="!loading"><MagicStick /></el-icon>
            <span>{{ loading ? '生成中...' : '开始绘制' }}</span>
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
  UploadFilled,
} from '@element-plus/icons-vue'
import GlassmorphicCard from './GlassmorphicCard.vue'
import axios from 'axios'
import {API_BASE_URL} from "../utils/urlUtils.js";

const props = defineProps({
  isDarkMode: {
    type: Boolean,
    default: true,
  },
})

const loading = ref(false)
const showAdditionalOptions = ref(false)
const prompt = ref('')
const uploadedImageUrl = ref(null)
const uploadedImageBase64 = ref(null)
const uploadedImageName = ref(null)
const width = ref(1280)
const height = ref(1280)
const negativePrompt = ref('')
const guidanceScale = ref(7)
const steps = ref(30)
const strength = ref(0.8) // 重绘幅度，默认为0.8
const imageCount = ref(1)

let cleanupFunction = null

onUnmounted(() => {
  if (typeof cleanupFunction === 'function') {
    cleanupFunction()
  }
})

const sizeOptions = [
  { value: '512x512', label: '512×512', width: 512, height: 512 },
  { value: '768x768', label: '768×768', width: 768, height: 768 },
  { value: '768x512', label: '768×512', width: 768, height: 512 },
  { value: '512x768', label: '512×768', width: 512, height: 768 },
  { value: '768x1024', label: '768×1024', width: 768, height: 1024 },
  { value: 'custom', label: '自定义尺寸' },
]

const selectedSize = ref('512x512')

const setPresetSize = value => {
  const option = sizeOptions.find(opt => opt.value === value)
  if (option && option.value !== 'custom') {
    width.value = option.width
    height.value = option.height
  }
}

setPresetSize('512x512')

const updateSelectedSize = () => {
  const matchedOption = sizeOptions.find(
    opt => opt.width === width.value && opt.height === height.value
  )
  selectedSize.value = matchedOption ? matchedOption.value : 'custom'
}

const emit = defineEmits(['imagesGenerated', 'error', 'toggleTheme'])

const handleToggleTheme = () => {
  emit('toggleTheme')
}

const handleImageUpload = async file => {
  if (file.raw.type.startsWith('image/')) {
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file.raw)

      // Upload to Java interface
      const response = await axios.post(`${API_BASE_URL}/comfyui/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data && response.data.code === 200) {
        // 保存返回的图片文件名
        uploadedImageName.value = response.data.result.data
        // 更新图片预览
        const reader = new FileReader()
        reader.onload = e => {
          uploadedImageUrl.value = e.target.result
          uploadedImageBase64.value = e.target.result.split(',')[1]
        }
        reader.readAsDataURL(file.raw)
      } else {
        throw new Error(response.data?.message || '上传失败')
      }
    } catch (error) {
      console.error('图片上传失败:', error)
      emit('error', { message: error.message || '图片上传失败，请重试' })
    }
  } else {
    // 处理非图片文件
    emit('error', { message: '请上传图片文件' })
  }
}

const removeUploadedImage = () => {
  uploadedImageUrl.value = null
  uploadedImageBase64.value = null
  uploadedImageName.value = null // 清除图片文件名
}

const generateImage = async () => {
  if (!prompt.value.trim() || !uploadedImageName.value) {
    emit('error', { message: '请填写描述并上传图片' })
    return
  }

  loading.value = true
  let isMounted = true

  const cleanup = () => {
    isMounted = false
  }

  if (typeof cleanupFunction === 'function') {
    cleanupFunction()
  }
  cleanupFunction = cleanup

  try {
    if (prompt.value.length > 1000) {
      throw new Error('提示词过长，请保持在1000字符以内')
    }

    const requestParams = {
      type: 2,
      inputImage: uploadedImageName.value, // 使用上传后的图片文件名
      prompt: prompt.value.trim(),
      batchSize: Math.max(1, Math.min(4, parseInt(imageCount.value))),
      image_size: `${width.value}x${height.value}`,
      model: 'Kwai-Kolors/Kolors',
      width: `${width.value}`,
      height: `${height.value}`,
      strength: parseFloat(strength.value)
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
    const response = await axios.post(`${API_BASE_URL}/comfyui/prompt`,
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

watch(selectedSize, newVal => {
  setPresetSize(newVal)
})

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

.image-uploader {
  width: 100%;
}

:deep(.image-uploader .el-upload-dragger) {
  width: 100%;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  border: 2px dashed var(--border-color);
  background-color: var(--card-bg);
  transition: all 0.3s ease;
  padding: 20px;
  box-sizing: border-box; /* Ensure padding doesn't increase total width/height */
}

:root[data-theme='light'] :deep(.image-uploader .el-upload-dragger) {
  background-color: rgba(255, 255, 255, 0.8);
  border-color: rgba(0, 0, 0, 0.15);
}

:deep(.image-uploader .el-upload-dragger:hover) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}

.uploaded-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.upload-placeholder .el-icon--upload {
  font-size: 60px;
  color: var(--primary-color);
  margin-bottom: 10px;
}

.upload-placeholder .el-upload__text {
  font-size: 14px;
}

.upload-placeholder .el-upload__text em {
  color: var(--accent-color);
  font-style: normal;
  cursor: pointer;
}

.remove-image-btn {
  margin-top: 15px;
  width: 100%;
  background-color: rgba(255, 0, 0, 0.2);
  border: 1px solid rgba(255, 0, 0, 0.3);
  color: #ff6b6b;
  transition: all 0.3s;
}

.remove-image-btn:hover {
  background-color: rgba(255, 0, 0, 0.3);
  box-shadow: 0 4px 10px rgba(255, 0, 0, 0.2);
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-item-col {
  flex: 1;
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
.steps-slider,
.strength-slider {
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
</style>