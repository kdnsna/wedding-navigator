<template>
  <view class="page" :class="templateClass">
    <!-- 顶部标题 -->
    <view class="page-header">
      <view class="header-top">
        <image class="back-btn" src="/static/visuals/icon-back.svg" mode="aspectFit" @click="goBack" />
        <text class="page-title">婚礼海报</text>
        <button v-if="guestStore.canRenderInvitation" class="share-btn" :class="{ 'is-disabled': !posterReady }" open-type="share" :disabled="!posterReady">分享</button>
      </view>
      <text class="page-desc">{{ guestStore.canRenderInvitation ? '保存图片分享到朋友圈，邀请更多人见证' : '请从新人寄来的邀请进入' }}</text>
    </view>

    <template v-if="guestStore.canRenderInvitation">
    <!-- 海报预览 -->
    <view class="poster-preview">
      <view class="poster-container" :style="previewFrameStyle">
        <view class="poster-wrapper" :style="posterScaleStyle">
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
      <button class="action-btn primary" :class="{ 'is-disabled': !posterReady }" @click="saveToAlbum" :disabled="!posterReady">
        <image class="action-visual-icon" src="/static/visuals/icon-save.svg" mode="aspectFit" />
        <text class="action-text">保存到相册</text>
      </button>
      <button class="action-btn" :class="{ 'is-disabled': !posterReady }" open-type="share" :disabled="!posterReady">
        <image class="action-visual-icon" src="/static/visuals/icon-share.svg" mode="aspectFit" />
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
    </template>

    <view class="poster-letter-state" v-else>
      <view class="poster-state-seal">囍</view>
      <text class="poster-state-title">海报尚未展开</text>
      <text class="poster-state-copy">从新人寄来的邀请进入后，才会生成对应的珍藏海报。</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, nextTick, getCurrentInstance } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useGuestInvitationStore } from '@/stores/guest-invitation.js'
import { fetchGuestInvitation, generatePoster } from '@/composables/useCloud.js'
import { drawWeddingPoster, POSTER_CANVAS_STYLE } from '@/utils/posterCanvas.js'
import { DEFAULT_SHARE_IMAGE, prepareShareImage } from '@/utils/shareCard.js'

const store = useWeddingStore()
const guestStore = useGuestInvitationStore()
const instance = getCurrentInstance()

const qrCodePath = ref('')
const posterReady = ref(false)
const loading = ref(false)
const loadingText = ref('生成海报中...')
const posterNotice = ref('')
const shareImageUrl = ref(DEFAULT_SHARE_IMAGE)
const canvasStyle = POSTER_CANVAS_STYLE
const templateClass = computed(() => store.templateClass)
const windowWidth = ref(375)
const previewScale = computed(() => Math.min(Math.max((windowWidth.value - 32) / 375, 0.68), 1))
const previewFrameStyle = computed(() => ({
  width: `${375 * previewScale.value}px`,
  height: `${667 * previewScale.value}px`
}))
const posterScaleStyle = computed(() => ({
  width: '375px',
  height: '667px',
  transform: `scale(${previewScale.value})`,
  transformOrigin: 'top left'
}))

function syncViewport() {
  try {
    windowWidth.value = uni.getWindowInfo()?.windowWidth || 375
  } catch (err) {
    windowWidth.value = 375
  }
}

async function generateQRCode() {
  loading.value = true
  loadingText.value = '生成小程序码...'
  posterNotice.value = ''
  try {
    if (!guestStore.invitationId) {
      posterNotice.value = '小程序码暂未生成，海报仍可保存'
      qrCodePath.value = ''
      return
    }
    const res = await generatePoster(
      'pages/index/index',
      guestStore.invitationId || '',
      430
    )

    if (res.isConfigError) {
      qrCodePath.value = ''
      posterNotice.value = '小程序码暂未生成，海报仍可保存'
    } else if (res.success && res.data) {
      qrCodePath.value = res.data
      posterNotice.value = ''
    } else {
      qrCodePath.value = ''
      posterNotice.value = '小程序码暂未生成，海报仍可保存'
    }
  } catch (err) {
    console.error('generateQRCode error:', err)
    qrCodePath.value = ''
    posterNotice.value = '小程序码暂未生成，海报仍可保存'
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
            const handledError = Object.assign(new Error('需要相册授权'), { handled: true })
            uni.showModal({
              title: '需要授权',
              content: '请允许保存图片到相册',
              confirmText: '去设置',
              success: (res) => {
                if (res.confirm) {
                  uni.openSetting({
                    fail: (settingErr) => {
                      console.warn('打开设置失败:', settingErr)
                      uni.showToast({ title: '打开设置失败', icon: 'none' })
                    }
                  })
                }
              }
            })
            reject(handledError)
            return
          } else {
            uni.showToast({ title: '保存失败', icon: 'none' })
          }
          reject(err)
        }
      })
    })
  } catch (err) {
    console.error('saveToAlbum error:', err)
    if (!err?.handled) {
      uni.showToast({ title: '保存失败', icon: 'none' })
    }
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

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({
      fail: (err) => {
        console.warn('海报页返回失败:', err)
        uni.switchTab({
          url: '/pages/index/index',
          fail: (tabErr) => {
            console.warn('海报页返回首页失败:', tabErr)
            uni.showToast({ title: '返回失败，请稍后重试', icon: 'none' })
          }
        })
      }
    })
  } else {
    uni.switchTab({
      url: '/pages/index/index',
      fail: (err) => {
        console.warn('海报页返回首页失败:', err)
        uni.showToast({ title: '返回失败，请稍后重试', icon: 'none' })
      }
    })
  }
}

onShareAppMessage(() => {
  const groom = store.invitation?.couple?.groom?.name || '我们'
  const bride = store.invitation?.couple?.bride?.name || ''
  const title = `${groom} & ${bride} 诚邀您见证我们的婚礼`
  const path = guestStore.invitationId ? `/pages/index/index?id=${encodeURIComponent(guestStore.invitationId)}` : '/pages/index/index'
  return {
    title,
    path,
    imageUrl: shareImageUrl.value
  }
})

async function ensureWeddingLoaded(options = {}) {
  const weddingId = parseWeddingId(options) || guestStore.invitationId
  if (weddingId) guestStore.setInvitationId(weddingId)
  if (!guestStore.invitationId) return false
  if (guestStore.canRenderInvitation && store.cachedWeddingId === guestStore.invitationId) return true
  try {
    await fetchGuestInvitation(guestStore.invitationId)
  } catch (err) {
    console.warn('海报页加载婚礼数据失败:', err)
    posterNotice.value = '这张海报暂时无法展开'
  }
  return guestStore.canRenderInvitation
}

function parseWeddingId(options = {}) {
  if (options.id) return decodeSceneValue(options.id)
  if (options.weddingId) return decodeSceneValue(options.weddingId)
  const scene = options.scene ? decodeSceneValue(options.scene) : ''
  if (!scene) return ''
  if (!scene.includes('=')) return scene
  const pair = scene.split('&').map(item => item.split('=')).find(([key]) => key === 'id' || key === 'weddingId')
  return pair?.[1] ? decodeSceneValue(pair[1]) : ''
}

function decodeSceneValue(value) {
  try {
    return decodeURIComponent(value)
  } catch (err) {
    return value
  }
}

onLoad(async (options) => {
  syncViewport()
  const ready = await ensureWeddingLoaded(options)
  if (!ready) return
  prepareShareImage(store).then((path) => {
    shareImageUrl.value = path
  })
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
.poster-letter-state {
  flex: 1;
  min-height: 760rpx;
  padding: 96rpx $page-gutter;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.poster-state-seal {
  width: 80rpx;
  height: 80rpx;
  border-radius: $r-full;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: var(--on-accent);
  font-family: $font-serif;
  font-size: $fs-body;
}
.poster-state-title {
  margin-top: $sp-4;
  color: $ink;
  font-family: $font-serif;
  font-size: $fs-title;
}
.poster-state-copy {
  max-width: 520rpx;
  margin-top: $sp-2;
  color: $ink-soft;
  font-size: $fs-note;
  line-height: $lh-body;
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
  width: 52rpx;
  height: 52rpx;
  padding: 8rpx;
  box-sizing: border-box;
}
.page-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
  letter-spacing: $tracking-cn-soft;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
.share-btn {
  min-width: 96rpx;
  height: 52rpx;
  line-height: 52rpx;
  font-size: 28rpx;
  color: $color-primary;
  padding: 0 16rpx;
  background: transparent;
  border-radius: $radius-sm;
}
.share-btn::after {
  border: none;
}
.share-btn.is-disabled {
  color: $text-placeholder;
}
.page-desc {
  font-size: 24rpx;
  color: $text-muted;
  display: block;
  letter-spacing: $tracking-cn-soft;
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
  border-radius: $card-radius;
  overflow: hidden;
  box-shadow: $shadow-md;
}
.poster-wrapper {
  display: block;
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
  background: $gold-soft;
  color: $gold;
  font-size: 24rpx;
  line-height: 1.5;
  letter-spacing: $tracking-cn-soft;
  border: 1rpx solid $hairline-soft;
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
  border: 1rpx solid $hairline-soft;
  font-size: 28rpx;
  color: $text-primary;
  letter-spacing: $tracking-kicker;
  font-weight: 500;
  transition: all 0.25s $ease-editorial;
  box-shadow: $shadow-xs;
}
.action-btn::after { border: none; }
.action-btn:active { transform: scale(0.97); }
.action-btn.primary {
  background: var(--theme-accent, $color-primary);
  color: var(--theme-on-accent, $ink-inverse);
  border-color: var(--theme-accent, $color-primary);
}
.action-btn.is-disabled { opacity: 0.4; }
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

.theme-wine,
.theme-cinnabar,
.theme-indigo,
.theme-pine {
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
    background: var(--theme-accent, $color-primary);
    border-color: var(--theme-accent, $color-primary);
    color: var(--theme-on-accent, $ink-inverse);
  }

  .loading-spinner {
    border-color: var(--theme-border, $border-color);
    border-top-color: var(--theme-accent, $text-primary);
  }
}
</style>
