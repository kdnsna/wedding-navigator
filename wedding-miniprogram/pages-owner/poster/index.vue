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
        <view class="poster-wrapper">
          <canvas
            canvas-id="posterCanvas"
            id="posterCanvas"
            class="poster-canvas"
            :style="{ width: canvasStyle.width, height: canvasStyle.height }"
          />
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
        <image class="tip-icon" src="/static/visuals/icon-tip.png" mode="aspectFit" />
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
  </view>
</template>

<script setup>
import { ref, nextTick, getCurrentInstance } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { generatePoster } from '@/composables/useCloud.js'
import { showSuccess, showError } from '@/utils/index.js'
import { drawWeddingPoster, POSTER_CANVAS_STYLE } from '@/utils/posterCanvas.js'

const store = useWeddingStore()
const userStore = useUserStore()
const instance = getCurrentInstance()

const qrCodePath = ref('')
const posterReady = ref(false)
const loading = ref(false)
const loadingText = ref('生成中...')
const generating = ref(false)
const saving = ref(false)
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
    await nextTick()
    await new Promise(r => setTimeout(r, 300))
    await drawWeddingPoster({ instance, store, qrCodePath: qrCodePath.value })
    onPosterReady()
  } catch (err) {
    console.error('poster draw fail:', err)
    showError('海报绘制失败')
  }
}

async function regenerate() {
  posterReady.value = false
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
    const tempRes = await uni.canvasToTempFilePath({
      canvasId: 'posterCanvas',
      quality: 0.95
    })

    await new Promise((resolve, reject) => {
      uni.saveImageToPhotosAlbum({
        filePath: tempRes.tempFilePath,
        success: () => {
          showSuccess('已保存到相册')
          resolve()
        },
        fail: (err) => {
          if (err.errMsg?.includes('auth deny')) {
            uni.showModal({
              title: '需要授权',
              content: '请允许保存图片到相册',
              confirmText: '去设置',
              success: (res) => {
                if (res.confirm) uni.openSetting()
              }
            })
          } else {
            showError('保存失败')
          }
          reject(err)
        }
      })
    })
  } catch (err) {
    console.error('saveToAlbum error:', err)
  } finally {
    saving.value = false
  }
}

onShow(() => { useOwnerGuard() })

onLoad(async () => {
  await generateQRCode()
  await redrawPoster()
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: 80rpx;
}

.page-header {
  padding: 60rpx 48rpx 24rpx;
}
.page-tag {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 6rpx;
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
  padding: 24rpx 48rpx;
}
.poster-container {
  width: 375px;
  height: 667px;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 24rpx 80rpx rgba(0, 0, 0, 0.18);
}
.poster-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}
.poster-canvas {
  border-radius: 16rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.25);
}

.actions {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 48rpx;
}
.action-btn {
  flex: 1;
  height: 96rpx;
  line-height: 96rpx;
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
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.12);
}
.action-btn.secondary {
  background: $bg-surface;
  color: $text-primary;
  border: 1rpx solid $border-color;
}
.action-btn[disabled] { opacity: 0.4; }

/* 说明 */
.tips {
  margin: 32rpx 48rpx 0;
  padding: 28rpx 32rpx;
  background: $bg-muted;
  border-radius: $radius-lg;
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
  padding: 48rpx 64rpx;
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
</style>
