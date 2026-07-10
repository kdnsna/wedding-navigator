<template>
  <view class="poster-frame" :style="previewFrameStyle">
    <view class="poster-wrapper" :style="posterScaleStyle">
      <canvas
        canvas-id="posterCanvas"
        id="posterCanvas"
        class="poster-canvas"
        :style="{ width: canvasStyle.width, height: canvasStyle.height }"
      />
    </view>
  </view>
</template>

<script setup>
import { computed, ref, onMounted, watch, getCurrentInstance } from 'vue'
import { useWeddingStore } from '@/stores/wedding.js'
import {
  drawWeddingPoster,
  POSTER_CANVAS_HEIGHT,
  POSTER_CANVAS_STYLE,
  POSTER_CANVAS_WIDTH
} from '@/utils/posterCanvas.js'

const props = defineProps({
  qrCodePath: { type: String, default: '' }
})

const emit = defineEmits(['ready', 'fail'])
const store = useWeddingStore()
const instance = getCurrentInstance()

const canvasStyle = POSTER_CANVAS_STYLE
const windowWidth = ref(375)
const previewScale = computed(() => Math.min(Math.max((windowWidth.value - 32) / POSTER_CANVAS_WIDTH, 0.68), 1))
const previewFrameStyle = computed(() => ({
  width: `${POSTER_CANVAS_WIDTH * previewScale.value}px`,
  height: `${POSTER_CANVAS_HEIGHT * previewScale.value}px`
}))
const posterScaleStyle = computed(() => ({
  width: `${POSTER_CANVAS_WIDTH}px`,
  height: `${POSTER_CANVAS_HEIGHT}px`,
  transform: `scale(${previewScale.value})`,
  transformOrigin: 'top left'
}))

function syncViewport() {
  try {
    windowWidth.value = uni.getWindowInfo()?.windowWidth || POSTER_CANVAS_WIDTH
  } catch (err) {
    windowWidth.value = POSTER_CANVAS_WIDTH
  }
}

async function drawPoster() {
  try {
    await drawWeddingPoster({ instance, store, qrCodePath: props.qrCodePath })
    emit('ready')
  } catch (err) {
    console.warn('海报抽屉绘制失败:', err)
    emit('fail', err)
  }
}

onMounted(async () => {
  syncViewport()
  await new Promise(resolve => setTimeout(resolve, 300))
  await drawPoster()
})

watch(() => props.qrCodePath, async () => {
  await drawPoster()
})

defineExpose({ redraw: drawPoster })
</script>

<style lang="scss" scoped>
.poster-frame {
  overflow: hidden;
  border-radius: 16rpx;
  box-shadow: $shadow-md;
}
.poster-wrapper {
  display: block;
}
.poster-canvas {
  border-radius: 16rpx;
}
</style>
