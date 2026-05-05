<template>
  <view class="page">
    <!-- 小程序码 -->
    <view class="qrcode-card">
      <view class="qrcode-box">
        <view class="qrcode-placeholder">
          <text>小程序码</text>
          <text class="qrcode-hint">部署后自动生成</text>
        </view>
      </view>
      <text class="qrcode-tip">微信扫一扫，查看婚礼邀请</text>
    </view>

    <!-- 分享卡片设置 -->
    <view class="section">
      <text class="section-title">分享卡片设置</text>
      <view class="form-card">
        <view class="form-group">
          <text class="form-label">分享标题</text>
          <input class="form-input" v-model="shareForm.title" placeholder="例如：张三&李四的婚礼邀请" />
        </view>
        <view class="form-group">
          <text class="form-label">分享描述</text>
          <input class="form-input" v-model="shareForm.description" placeholder="例如：2026年11月14日，我们结婚啦！" />
        </view>
      </view>
    </view>

    <!-- 分享按钮 -->
    <view class="share-actions">
      <button class="share-btn primary" open-type="share">
        <text>分享给微信好友</text>
      </button>
      <button class="share-btn" @click="copyPath">
        <text>复制小程序路径</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow, onShareAppMessage } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { showSuccess } from '@/utils/index.js'

const store = useWeddingStore()
const userStore = useUserStore()

const shareForm = ref({
  title: '',
  description: ''
})

const weddingId = computed(() => userStore.weddingId)

function loadFromStore() {
  const cfg = store.wedding?.share_config || {}
  shareForm.value.title = cfg.title || `${store.coupleName}的婚礼邀请`
  shareForm.value.description = cfg.description || `${store.weddingDate}，我们结婚啦！诚邀您的见证~`
}

function copyPath() {
  const path = `pages/index/index?id=${weddingId.value}`
  uni.setClipboardData({
    data: path,
    success: () => showSuccess('已复制')
  })
}

onShareAppMessage(() => {
  return {
    title: shareForm.value.title,
    path: `pages/index/index?id=${weddingId.value}`,
    desc: shareForm.value.description
  }
})

onShow(() => {
  loadFromStore()
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 30rpx;
}

.qrcode-card {
  background: $bg-surface;
  border-radius: 28rpx;
  padding: 60rpx;
  text-align: center;
  margin-bottom: 30rpx;
  box-shadow: $shadow-sm;
  border: 2rpx solid rgba(212,168,83,0.08);
}
.qrcode-box {
  width: 300rpx;
  height: 300rpx;
  margin: 0 auto 30rpx;
  background: $bg-muted;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qrcode-placeholder {
  display: flex;
  flex-direction: column;
  color: $text-muted;
  font-size: 28rpx;
}
.qrcode-hint {
  font-size: 22rpx;
  margin-top: 10rpx;
}
.qrcode-tip {
  font-size: 26rpx;
  color: $text-secondary;
}

.section {
  margin-bottom: 30rpx;
}
.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 20rpx;
}

.form-card {
  background: $bg-surface;
  border-radius: 28rpx;
  padding: 30rpx;
  box-shadow: $shadow-sm;
  border: 2rpx solid rgba(212,168,83,0.08);
}
.form-group {
  margin-bottom: 24rpx;
}
.form-group:last-child {
  margin-bottom: 0;
}
.form-label {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  margin-bottom: 10rpx;
}
.form-input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  border: 2rpx solid $border-light;
  border-radius: 10rpx;
  font-size: 28rpx;
  background: $bg-muted;
  box-sizing: border-box;
}

.share-actions {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.share-btn {
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  background: $bg-surface;
  color: $text-primary;
  box-shadow: $shadow-sm;
  border: 2rpx solid rgba(212,168,83,0.08);
}
.share-btn.primary {
  background: linear-gradient(135deg, $color-primary 0%, #E91E63 100%);
  color: #fff;
  box-shadow: $shadow-md;
  border: none;
}
.share-btn::after {
  border: none;
}
</style>
