<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">POSTER</text>
      <text class="page-title">海报生成</text>
      <view class="page-divider" />
      <text class="page-desc">生成精美海报，分享到朋友圈，邀请更多宾客</text>
    </view>

    <!-- 海报预览 -->
    <view class="poster-preview">
      <view class="poster-container">
        <image
          v-if="posterPreviewPath"
          class="poster-image"
          :src="posterPreviewPath"
          mode="aspectFit"
        />
        <view v-else class="poster-placeholder">
          <text>{{ loading ? loadingText : '海报生成中...' }}</text>
        </view>
      </view>
    </view>

    <!-- 操作 -->
    <view class="actions">
      <button class="action-btn primary" @click="saveToAlbum" :disabled="!posterReady || saving">
        <text v-if="!saving">保存到相册</text>
        <text v-else>保存中...</text>
      </button>
      <button class="action-btn secondary" @click="regenerate" :disabled="generating">
        <text v-if="!generating">重新生成</text>
        <text v-else>生成中...</text>
      </button>
    </view>

    <!-- 说明 -->
    <view class="tips">
      <view class="tip-header">
        <image class="tip-icon" src="/static/visuals/icon-tip.svg" mode="aspectFit" />
        <text class="tip-title">使用说明</text>
      </view>
      <view class="tip-item">1. 保存海报到手机相册</view>
      <view class="tip-item">2. 打开微信 → 朋友圈 → 长按发布</view>
      <view class="tip-item">3. 配文引导好友识别小程序码</view>
      <view class="tip-item tip-note">
        海报将自动使用您的婚纱相册封面作为背景图
      </view>
    </view>

    <!-- 加载提示 -->
    <view class="loading-overlay" v-if="loading">
      <view class="loading-content">
        <view class="loading-spinner" />
        <text class="loading-text">{{ loadingText }}</text>
      </view>
    </view>

    <canvas
      type="2d"
      canvas-id="posterCanvas"
      id="posterCanvas"
      class="poster-canvas-export"
      :style="{ width: canvasStyle.width, height: canvasStyle.height }"
    />
  </view>
</template>

<script setup>
import { ref, nextTick, getCurrentInstance } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { generatePoster } from '@/composables/useCloud.js'
import { showSuccess, showError } from '@/utils/index.js'
import { renderWeddingPosterTempFile, POSTER_CANVAS_STYLE } from '@/utils/posterCanvas.js'
import { savePosterCanvasToAlbum, savePosterFileToAlbum, showSaveImageError } from '@/utils/photoAlbum.js'

const store = useWeddingStore()
const userStore = useUserStore()
const instance = getCurrentInstance()?.proxy

const qrCodePath = ref('')
const posterReady = ref(false)
const loading = ref(false)
const loadingText = ref('生成中...')
const generating = ref(false)
const saving = ref(false)
const posterPreviewPath = ref('')
const canvasStyle = POSTER_CANVAS_STYLE

async function generateQRCode() {
  generating.value = true
  loading.value = true
  loadingText.value = '生成小程序码...'

  try {
    const res = await generatePoster(
      'pages/index/index',
      userStore.weddingId || '',
      430
    )

    if (res.success && res.data) {
      qrCodePath.value = res.data
    } else if (res.isConfigError) {
      uni.showToast({ title: '请先发布小程序', icon: 'none', duration: 3000 })
      qrCodePath.value = ''
    } else {
      qrCodePath.value = ''
    }
  } catch (err) {
    console.error('generateQRCode error:', err)
    qrCodePath.value = ''
  } finally {
    generating.value = false
    loading.value = false
  }
}

function onPosterReady() {
  posterReady.value = true
}

async function redrawPoster() {
  try {
    posterReady.value = false
    posterPreviewPath.value = ''
    await nextTick()
    await new Promise(r => setTimeout(r, 300))
    posterPreviewPath.value = await renderWeddingPosterTempFile({ instance, store, qrCodePath: qrCodePath.value })
    onPosterReady()
  } catch (err) {
    console.error('poster draw fail:', err)
    showError('海报绘制失败')
  }
}

async function regenerate() {
  posterReady.value = false
  posterPreviewPath.value = ''
  await generateQRCode()
  await redrawPoster()
}

async function saveToAlbum() {
  if (!posterReady.value) {
    uni.showToast({ title: '海报生成中，请稍候', icon: 'none' })
    return
  }

  saving.value = true
  try {
    if (posterPreviewPath.value) {
      await savePosterFileToAlbum(posterPreviewPath.value)
    } else {
      await savePosterCanvasToAlbum({ canvasId: 'posterCanvas', instance })
    }
    showSuccess('已保存到相册')
  } catch (err) {
    console.error('saveToAlbum error:', err)
    showSaveImageError(err)
  } finally {
    saving.value = false
  }
}

onShow(async () => {
  if (!useOwnerGuard()) return
  if (!qrCodePath.value && !generating.value) {
    await generateQRCode()
    await redrawPoster()
  }
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}

.page-header {
  padding: calc(24rpx + constant(safe-area-inset-top)) $page-gutter 24rpx;
  padding-top: calc(24rpx + env(safe-area-inset-top));
}
.page-tag {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 0;
  margin-bottom: 12rpx;
}
.page-title {
  display: block;
  font-size: $font-h1;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 16rpx;
}
.page-divider {
  width: 32rpx;
  height: 2rpx;
  background: $text-muted;
  margin-bottom: 16rpx;
}
.page-desc {
  display: block;
  font-size: $font-body;
  color: $text-secondary;
}

.poster-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12rpx $page-gutter 20rpx;
}
.poster-container {
  width: 400rpx;
  height: 711rpx;
  border-radius: $card-radius;
  overflow: hidden;
  box-shadow: $shadow-md;
  background: $bg-muted;
}
.poster-image {
  width: 100%;
  height: 100%;
  display: block;
}
.poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  color: $text-muted;
  font-size: 24rpx;
  text-align: center;
}
.poster-canvas-export {
  position: fixed;
  left: 0;
  top: 0;
  transform: scale(0.01);
  transform-origin: left top;
  opacity: 0.01;
  pointer-events: none;
  z-index: -1;
}

.actions {
  display: flex;
  gap: 20rpx;
  padding: 24rpx $page-gutter;
}
.action-btn {
  flex: 1;
  height: $control-height;
  line-height: $control-height;
  text-align: center;
  border-radius: $radius-full;
  font-size: 30rpx;
  font-weight: 500;
  transition: all 0.2s ease;
}
.action-btn::after { border: none; }
.action-btn:active { transform: scale(0.97); opacity: 0.85; }
.action-btn.primary {
  background: $text-primary;
  color: #fff;
  box-shadow: $shadow-sm;
}
.action-btn.secondary {
  background: $bg-surface;
  color: $text-primary;
  border: 1rpx solid $border-color;
}
.action-btn[disabled] { opacity: 0.4; }

/* 说明 */
.tips {
  margin: 32rpx $page-gutter 0;
  padding: 28rpx 32rpx;
  background: $bg-muted;
  border-radius: $card-radius;
}
.tip-header {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
}
.tip-icon {
  width: 30rpx;
  height: 30rpx;
}
.tip-title {
  font-size: 26rpx;
  font-weight: 500;
  color: $text-primary;
}
.tip-item {
  font-size: 24rpx;
  color: $text-secondary;
  line-height: 2;
}
.tip-note {
  color: $text-muted;
  font-style: italic;
  margin-top: 8rpx;
}

/* 加载遮罩 */
.loading-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.loading-content {
  background: $bg-surface;
  border-radius: $radius-lg;
  padding: $page-gutter 56rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}
.loading-spinner {
  width: 56rpx;
  height: 56rpx;
  border: 3rpx solid $border-color;
  border-top-color: $text-primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text {
  font-size: 26rpx;
  color: $text-primary;
}

@media (min-height: 760px) {
  .poster-preview {
    padding-top: 18rpx;
  }

  .poster-container {
    width: 460rpx;
    height: 818rpx;
  }
}

@media (min-height: 860px) {
  .poster-container {
    width: 500rpx;
    height: 889rpx;
  }
}
</style>
