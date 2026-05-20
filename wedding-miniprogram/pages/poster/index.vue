<template>
  <view class="page" :class="templateClass">
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
      <view class="poster-status" v-if="posterNotice">
        <image class="poster-status-icon" src="/static/visuals/icon-warning.svg" mode="aspectFit" />
        <text>{{ posterNotice }}</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="actions">
      <button class="action-btn primary" @click="saveToAlbum" :disabled="!posterReady">
        <image class="action-visual-icon" src="/static/visuals/icon-save.svg" mode="aspectFit" />
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
import { computed, ref, nextTick, getCurrentInstance } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding, generatePoster } from '@/composables/useCloud.js'
import { drawWeddingPoster, POSTER_CANVAS_STYLE } from '@/utils/posterCanvas.js'

const store = useWeddingStore()
const userStore = useUserStore()
const instance = getCurrentInstance()

const qrCodePath = ref('')
const posterReady = ref(false)
const loading = ref(false)
const loadingText = ref('生成海报中...')
const posterNotice = ref('')
const canvasStyle = POSTER_CANVAS_STYLE
const templateClass = computed(() => store.templateClass)

async function generateQRCode() {
  loading.value = true
  loadingText.value = '生成小程序码...'
  posterNotice.value = ''
  try {
    if (!userStore.weddingId) {
      posterNotice.value = '缺少婚礼 ID，海报会先使用无小程序码模式'
      qrCodePath.value = ''
      return
    }
    const res = await generatePoster(
      'pages/index/index',
      userStore.weddingId || '',
      430
    )

    if (res.isConfigError) {
      qrCodePath.value = ''
      posterNotice.value = res.message || '请发布小程序或配置体验版后再生成小程序码'
    } else if (res.success && res.data) {
      qrCodePath.value = res.data
      posterNotice.value = ''
    } else {
      qrCodePath.value = ''
      posterNotice.value = res?.message || '小程序码生成失败，海报会先使用无小程序码模式'
    }
  } catch (err) {
    console.error('generateQRCode error:', err)
    qrCodePath.value = ''
    posterNotice.value = err?.result?.message || err?.message || '小程序码生成失败，海报会先使用无小程序码模式'
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
  posterNotice.value = '海报绘制失败，请检查封面图或稍后重试'
  posterReady.value = false
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
    const tempRes = await canvasToTempFilePath()
    await new Promise((resolve, reject) => {
      uni.saveImageToPhotosAlbum({
        filePath: tempRes.tempFilePath,
        success: () => {
          uni.showToast({ title: '已保存到相册', icon: 'success' })
          resolve()
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
          reject(err)
        }
      })
    })
  } catch (err) {
    console.error('saveToAlbum error:', err)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function canvasToTempFilePath() {
  return new Promise((resolve, reject) => {
    uni.canvasToTempFilePath({
      canvasId: 'posterCanvas',
      quality: 0.95,
      success: resolve,
      fail: reject
    }, instance)
  })
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

async function ensureWeddingLoaded(options = {}) {
  const weddingId = parseWeddingId(options) || userStore.weddingId
  if (weddingId) userStore.setWeddingId(weddingId)
  if (!userStore.weddingId) return
  if (store.wedding?._id || store.wedding?.wedding_id) return
  try {
    await fetchWedding(userStore.weddingId)
  } catch (err) {
    console.warn('海报页加载婚礼数据失败:', err)
    posterNotice.value = err?.message || '婚礼数据加载失败，海报将使用默认信息'
  }
}

function parseWeddingId(options = {}) {
  if (options.id) return options.id
  if (options.weddingId) return options.weddingId
  const scene = options.scene ? decodeURIComponent(options.scene) : ''
  if (!scene) return ''
  if (!scene.includes('=')) return scene
  const pair = scene.split('&').map(item => item.split('=')).find(([key]) => key === 'id' || key === 'weddingId')
  return pair?.[1] || ''
}

onLoad(async (options) => {
  await ensureWeddingLoaded(options)
  await generateQRCode()
  await redrawPoster()
})
</script>

<style lang="scss" scoped>
.page {
  background-color: var(--theme-page, $bg-color);
  color: var(--theme-ink, $text-primary);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: $page-gutter $page-gutter 24rpx;
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  padding: 24rpx $page-gutter;
}
.poster-container {
  width: 375px;
  height: 667px;
  border-radius: $card-radius;
  overflow: hidden;
  box-shadow: $shadow-md;
}
.poster-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}
.poster-canvas {
  border-radius: 16rpx;
  box-shadow: $shadow-sm;
}
.poster-status {
  max-width: 375px;
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
  padding: 16rpx 20rpx;
  border-radius: $card-radius;
  background: rgba(249,171,0,0.12);
  color: #8F6100;
  font-size: 23rpx;
  line-height: 1.45;
  box-sizing: border-box;
}
.poster-status-icon {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
  margin-top: 2rpx;
}

.actions {
  display: flex;
  gap: 20rpx;
  padding: 24rpx $page-gutter calc(48rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
}
.action-btn {
  flex: 1;
  height: $control-height;
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
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-text {
  font-size: 26rpx;
  color: $text-primary;
}

.theme-rose,
.theme-champagne,
.theme-noir,
.theme-garden,
.theme-heritage,
.theme-shandong,
.theme-travel {
  background: var(--theme-page, $bg-color);
  color: var(--theme-ink, $text-primary);

  .back-btn,
  .page-title,
  .action-btn,
  .loading-text {
    color: var(--theme-ink, $text-primary);
  }

  .page-desc {
    color: var(--theme-muted, $text-muted);
  }

  .share-btn {
    color: var(--theme-accent, $color-primary);
  }

  .poster-container,
  .poster-canvas {
    border-radius: $card-radius;
    box-shadow: $shadow-sm;
  }

  .action-btn,
  .loading-content {
    background: var(--theme-surface, $bg-surface);
    border-color: var(--theme-border, $border-color);
  }

  .action-btn.primary {
    background: var(--theme-accent, $text-primary);
    border-color: var(--theme-accent, $text-primary);
    color: var(--theme-on-accent, #fff);
  }

  .loading-spinner {
    border-color: var(--theme-border, $border-color);
    border-top-color: var(--theme-accent, $text-primary);
  }
}
</style>
