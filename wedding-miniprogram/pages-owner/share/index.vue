<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">SHARE</text>
      <text class="page-title">分享设置</text>
    </view>

    <!-- 小程序码 -->
    <view class="qrcode-section">
      <view class="qrcode-box">
        <text class="qrcode-placeholder">小程序码</text>
        <text class="qrcode-hint">部署后自动生成</text>
      </view>
      <text class="qrcode-tip">微信扫一扫，查看婚礼邀请</text>
    </view>

    <!-- 分享卡片设置 -->
    <view class="section">
      <text class="section-label">分享卡片</text>
      <view class="form-group">
        <text class="form-sub-label">标题</text>
        <input class="form-input" v-model="shareForm.title" placeholder="例如：张三&李四的婚礼邀请" />
      </view>
      <view class="form-group">
        <text class="form-sub-label">描述</text>
        <input class="form-input" v-model="shareForm.description" placeholder="例如：2026年11月14日，我们结婚啦！" />
      </view>
    </view>

    <!-- 分享按钮 -->
    <view class="share-actions">
      <button class="share-btn primary" :loading="saving" :disabled="saving" @click="saveShareSettings">保存分享设置</button>
      <button class="share-btn primary" open-type="share">分享给微信好友</button>
      <button class="share-btn" @click="goToPoster">生成分享海报</button>
      <button class="share-btn" @click="copyPath">复制小程序路径</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow, onShareAppMessage } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { showError, showSuccess } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { recordShare, updateWedding } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()

const shareForm = ref({ title: '', description: '' })
const saving = ref(false)

const weddingId = computed(() => userStore.weddingId)

function loadFromStore() {
  const cfg = store.wedding?.share_config || {}
  shareForm.value.title = cfg.title || `${store.coupleName}的婚礼邀请`
  shareForm.value.description = cfg.description || `${store.weddingDate}，我们结婚啦！诚邀您的见证~`
}

function copyPath() {
  if (!weddingId.value) {
    uni.showToast({ title: '请先创建婚礼', icon: 'none' })
    return
  }
  const path = `pages/index/index?id=${weddingId.value}`
  uni.setClipboardData({ data: path, success: () => showSuccess('已复制') })
}

function goToPoster() {
  if (!weddingId.value) {
    showError('请先创建婚礼')
    return
  }
  uni.navigateTo({ url: '/pages/poster/index' })
}

async function saveShareSettings() {
  if (saving.value) return
  if (!weddingId.value) {
    showError('请先创建婚礼')
    return
  }
  const shareConfig = {
    ...(store.wedding?.share_config || {}),
    title: shareForm.value.title.trim() || `${store.coupleName}的婚礼邀请`,
    description: shareForm.value.description.trim() || `${store.weddingDate}，我们结婚啦！诚邀您的见证~`
  }
  saving.value = true
  try {
    await updateWedding(weddingId.value, 'weddings', { share_config: shareConfig })
    store.updateWeddingField('share_config', shareConfig)
    const weddings = uni.getStorageSync('weddings') || {}
    if (weddings[weddingId.value]) {
      weddings[weddingId.value].share_config = shareConfig
      uni.setStorageSync('weddings', weddings)
    }
    showSuccess('已同步云端')
  } catch (err) {
    console.error('分享设置保存失败:', err)
    showError(err?.message || '保存失败，请重试')
  } finally {
    saving.value = false
  }
}

onShareAppMessage(() => {
  if (!weddingId.value) {
    return { title: '甜囍手册', path: '/pages-owner/wizard/index' }
  }
  recordShare(weddingId.value).catch(() => {})
  return {
    title: shareForm.value.title,
    path: `/pages/index/index?id=${weddingId.value}`,
    desc: shareForm.value.description
  }
})

onShow(() => { useOwnerGuard(); loadFromStore() })
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: 60rpx;
}

/* 顶部标题 */
.page-header {
  padding: 60rpx 48rpx 36rpx;
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
}

/* 小程序码 */
.qrcode-section {
  text-align: center;
  padding: 48rpx;
}
.qrcode-box {
  width: 280rpx;
  height: 280rpx;
  margin: 0 auto 32rpx;
  background: $bg-muted;
  border-radius: $radius-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.qrcode-placeholder {
  font-size: 28rpx;
  color: $text-secondary;
  margin-bottom: 8rpx;
}
.qrcode-hint {
  font-size: 22rpx;
  color: $text-muted;
}
.qrcode-tip {
  font-size: 26rpx;
  color: $text-secondary;
}

/* 表单 */
.section {
  padding: 0 48rpx;
  margin-bottom: 48rpx;
}
.section-label {
  display: block;
  font-size: 26rpx;
  color: $text-muted;
  margin-bottom: 24rpx;
}
.form-group {
  margin-bottom: 24rpx;
}
.form-sub-label {
  display: block;
  font-size: 24rpx;
  color: $text-muted;
  margin-bottom: 12rpx;
}
.form-input {
  width: 100%;
  height: 80rpx;
  padding: 0 4rpx;
  border-bottom: 2rpx solid $border-color;
  font-size: 30rpx;
  background: transparent;
  box-sizing: border-box;
}

/* 分享按钮 */
.share-actions {
  padding: 0 48rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.share-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  border-radius: $radius-full;
  background: $bg-muted;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
  transition: opacity 0.2s ease;
}
.share-btn::after { border: none; }
.share-btn:active { opacity: 0.8; }
.share-btn.primary {
  background: $text-primary;
  color: #fff;
}
.share-btn.primary + .share-btn.primary {
  background: $color-primary;
}
</style>
