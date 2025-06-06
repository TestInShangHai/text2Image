<template>
  <div
    class="glassmorphic-card"
    :class="{
      primary: variant === 'primary',
      dark: variant === 'dark',
      'with-glow': showGlow,
      'with-border': withBorder,
      'is-visible': modelValue,
    }"
    @click="handleClick">
    <slot></slot>
    <div v-if="showGlow" class="glow-effect"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: value => ['primary', 'dark'].includes(value),
  },
  showGlow: {
    type: Boolean,
    default: false,
  },
  withBorder: {
    type: Boolean,
    default: true,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const handleClick = () => {
  emit('update:modelValue', !props.modelValue)
}

const isMobile = ref(window.innerWidth <= 768)

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.glassmorphic-card {
  border-radius: var(--border-radius);
  padding: 20px;
  overflow: hidden;
  position: relative;
  width: 100%;
  z-index: 1;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.primary {
  background: linear-gradient(
    135deg,
    rgba(var(--primary-color, 83, 82, 237), 0.1) 0%,
    rgba(var(--secondary-color, 52, 152, 219), 0.15) 100%
  );
  border: 1px solid rgba(var(--text-color, 255, 255, 255), 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
}

.primary.with-glow::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(var(--primary-color, 83, 82, 237), 0.1) 0%,
    rgba(var(--primary-color, 83, 82, 237), 0) 70%
  );
  z-index: -1;
}

.dark {
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.2) 100%
  );
  border: 1px solid rgba(var(--text-color, 255, 255, 255), 0.05);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.08);
}

/* 亮色模式下调整样式 */
:root[data-theme='light'] .primary {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05);
}

:root[data-theme='light'] .dark {
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.05) 0%,
    rgba(0, 0, 0, 0.02) 100%
  );
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.glassmorphic-card::before {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to right bottom,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0)
  );
  filter: blur(20px);
  z-index: -2;
}

.glassmorphic-card.with-border {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.glow-effect {
  position: absolute;
  width: 200px;
  height: 200px;
  background: radial-gradient(
    circle,
    rgba(var(--primary-color, 83, 82, 237), 0.2) 0%,
    rgba(var(--primary-color, 83, 82, 237), 0) 70%
  );
  border-radius: 100%;
  filter: blur(15px);
  animation: float 6s ease-in-out infinite;
  opacity: 0.5;
  z-index: -1;
  top: -100px;
  left: -100px;
}

@keyframes float {
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(30px, 30px);
  }
  100% {
    transform: translate(0, 0);
  }
}

.is-mobile {
  padding: 16px;
  margin-bottom: 16px;
}

@media (prefers-reduced-motion) {
  .glassmorphic-card,
  .glassmorphic-card:hover {
    transition: none;
    transform: none;
  }

  .glow-effect {
    animation: none;
  }
}
</style>
