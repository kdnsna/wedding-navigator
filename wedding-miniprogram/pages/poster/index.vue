<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <view class="header-top">
        <text class="back-btn" @click="goBack">‹</text>
        <text class="page-title">婚礼海报</text>
        <text class="share-btn" @click="sharePoster">分享</text>
      </view>
      <text class="page-desc">保存图片分享到朋友圈，邀请更多人见证</text>
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

    <!-- 操作按钮 -->
    <view class="actions">
      <button class="action-btn primary" @click="saveToAlbum" :disabled="!posterReady">
        <image class="action-visual-icon" src="/static/visuals/icon-save.png" mode="aspectFit" />
        <text class="action-text">保存到相册</text>
      </button>
      <button class="action-btn" open-type="share" :disabled="!posterReady">
        <text class="action-icon">↗</text>
        <text class="action-text">发给好友</text>
      </button>
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
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { generatePoster } from '@/composables/useCloud.js'
import { drawWeddingPoster, POSTER_CANVAS_STYLE } from '@/utils/posterCanvas.js'

const store = useWeddingStore()
const userStore = useUserStore()
const instance = getCurrentInstance()

const qrCodePath = ref('')
const posterReady = ref(false)
const loading = ref(false)
const loadingText = ref('生成海报中...')
const canvasStyle = POSTER_CANVAS_STYLE

async function generateQRCode() {
  loading.value = true
  loadingText.value = '生成小程序码...'
  try {
    const res = await generatePoster(
      'pages/index/index',
      userStore.weddingId || '',
      430
    )

    if (res.isConfigError) {
      // 未配置体验版，降级为本地小程序码
      qrCodePath.value = ''
      uni.showToast({ title: '请发布后再生成海报', icon: 'none' })
    } else if (res.success && res.data) {
      qrCodePath.value = res.data
    } else {
      qrCodePath.value = ''
      uni.showToast({ title: '生成码失败，使用备用模式', icon: 'none' })
    }
  } catch (err) {
    console.error('generateQRCode error:', err)
    qrCodePath.value = ''
  } finally {
    loading.value = false
  }
}

function onPosterReady() {
  posterReady.value = true
  loading.value = false
}

function onPosterFail(err) {
  console.error('poster draw fail:', err)
  uni.showToast({ title: '海报绘制失败', icon: 'none' })
  loading.value = false
}

async function redrawPoster() {
  try {
    await nextTick()
    await new Promise(r => setTimeout(r, 300))
    await drawWeddingPoster({ instance, store, qrCodePath: qrCodePath.value })
    onPosterReady()
  } catch (err) {
    onPosterFail(err)
  }
}

async function saveToAlbum() {
  if (!posterReady.value) {
    uni.showToast({ title: '海报生成中，请稍候', icon: 'none' })
    return
  }

  loading.value = true
  loadingText.value = '保存到相册...'

  try {
    const res = await uni.canvasToTempFilePath({
      canvasId: 'posterCanvas',
      quality: 0.95,
      success: (tempRes) => {
        uni.saveImageToPhotosAlbum({
          filePath: tempRes.tempFilePath,
          success: () => {
            uni.showToast({ title: '已保存到相册', icon: 'success' })
          },
          fail: (err) => {
            if (err.errMsg?.includes('auth deny')) {
              uni.showModal({
                title: '需要授权',
                content: '请允许保存图片到相册',
                confirmText: '去设置',
                success: (res) => {
                  if (res.confirm) {
                    uni.openSetting()
                  }
                }
              })
            } else {
              uni.showToast({ title: '保存失败', icon: 'none' })
            }
          }
        })
      },
      fail: (err) => {
        console.error('canvasToTempFilePath fail:', err)
        uni.showToast({ title: '保存失败', icon: 'none' })
      }
    }, instance)
  } catch (err) {
    console.error('saveToAlbum error:', err)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function sharePoster() {
  // 触发页面分享
  uni.showToast({ title: '点击右上角分享', icon: 'none' })
}

function goBack() {
  uni.navigateBack()
}

onShareAppMessage(() => {
  const groom = store.invitation?.couple?.groom?.name || '我们'
  const bride = store.invitation?.couple?.bride?.name || ''
  const title = `${groom} & ${bride} 诚邀您见证我们的婚礼`
  return {
    title,
    path: `/pages/index/index?id=${userStore.weddingId}`
  }
})

onLoad(async (options) => {
  await generateQRCode()
  await redrawPoster()
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: 48rpx 48rpx 24rpx;
  flex-shrink: 0;
}
.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}
.back-btn {
  font-size: 48rpx;
  color: $text-primary;
  padding: 8rpx 16rpx;
  line-height: 1;
}
.page-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
.share-btn {
  font-size: 28rpx;
  color: $color-primary;
  padding: 8rpx 16rpx;
}
.page-desc {
  font-size: 24rpx;
  color: $text-muted;
  display: block;
}

.poster-preview {
  flex: 1;
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
  padding: 24rpx 48rpx calc(48rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
}
.action-btn {
  flex: 1;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  border-radius: $radius-full;
  background: $bg-surface;
  border: 1rpx solid $border-color;
  font-size: 28rpx;
  color: $text-primary;
  transition: all 0.2s ease;
}
.action-btn::after { border: none; }
.action-btn:active { transform: scale(0.97); }
.action-btn.primary {
  background: $text-primary;
  color: #fff;
  border-color: $text-primary;
}
.action-btn[disabled] { opacity: 0.4; }
.action-icon { font-size: 32rpx; }
.action-visual-icon {
  width: 34rpx;
  height: 34rpx;
}
.action-text { font-weight: 500; }

/* 加载遮罩 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-text {
  font-size: 26rpx;
  color: $text-primary;
}
</style>
