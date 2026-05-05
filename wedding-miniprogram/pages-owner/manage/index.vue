<template>
  <view class="page">
    <!-- 顶部婚礼信息 -->
    <view class="header-card">
      <text class="header-title">👰 {{ coupleName }} 的婚礼</text>
      <text class="header-date">{{ formatDate(weddingDate) }}</text>
      <view class="header-status">
        <text class="status-badge" :class="weddingStatus">{{ statusText }}</text>
      </view>
    </view>

    <!-- 数据概览 -->
    <view class="stats-card">
      <view class="stats-row">
        <view class="stats-item">
          <text class="stats-num">{{ stats.views }}</text>
          <text class="stats-label">浏览</text>
        </view>
        <view class="stats-item">
          <text class="stats-num">{{ stats.shares }}</text>
          <text class="stats-label">分享</text>
        </view>
        <view class="stats-item">
          <text class="stats-num">{{ stats.rsvp }}</text>
          <text class="stats-label">RSVP</text>
        </view>
        <view class="stats-item">
          <text class="stats-num">{{ stats.blessings }}</text>
          <text class="stats-label">祝福</text>
        </view>
      </view>
    </view>

    <!-- 功能网格 -->
    <view class="menu-grid">
      <view class="menu-item" @click="goTo('invitation/edit')">
        <text class="menu-icon">🎨</text>
        <text class="menu-title">婚书编辑</text>
      </view>
      <view class="menu-item" @click="goTo('album/manage')">
        <text class="menu-icon">🖼️</text>
        <text class="menu-title">相册管理</text>
      </view>
      <view class="menu-item" @click="goTo('guide/edit')">
        <text class="menu-icon">🗺️</text>
        <text class="menu-title">路书设置</text>
      </view>
      <view class="menu-item" @click="goTo('timeline/edit')">
        <text class="menu-icon">📅</text>
        <text class="menu-title">流程编辑</text>
      </view>
      <view class="menu-item" @click="goTo('guests/manage')">
        <text class="menu-icon">👥</text>
        <text class="menu-title">宾客管理</text>
      </view>
      <view class="menu-item" @click="goTo('blessing/manage')">
        <text class="menu-icon">💬</text>
        <text class="menu-title">祝福管理</text>
      </view>
      <view class="menu-item" @click="goTo('share/index')">
        <text class="menu-icon">📤</text>
        <text class="menu-title">分享设置</text>
      </view>
      <view class="menu-item" @click="goTo('stats/index')">
        <text class="menu-icon">📊</text>
        <text class="menu-title">数据统计</text>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions">
      <button class="preview-btn" @click="previewWedding">
        <text>👁 预览效果</text>
      </button>
      <button class="share-btn" @click="shareWedding">
        <text>📤 分享邀请</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { formatDate } from '@/utils/index.js'

const store = useWeddingStore()
const userStore = useUserStore()

const coupleName = computed(() => store.coupleName)
const weddingDate = computed(() => store.weddingDate)
const weddingStatus = computed(() => store.wedding?.status || 'draft')

const statusText = computed(() => {
  const map = { draft: '草稿', published: '已发布', ended: '已结束' }
  return map[weddingStatus.value] || '草稿'
})

const stats = computed(() => {
  const s = store.wedding?.stats || {}
  return {
    views: s.views || 0,
    shares: s.shares || 0,
    rsvp: s.rsvp_count || 0,
    blessings: s.blessing_count || 0
  }
})

function goTo(path) {
  uni.navigateTo({ url: `/pages-owner/${path}` })
}

function previewWedding() {
  uni.switchTab({ url: '/pages/index/index' })
}

function shareWedding() {
  uni.navigateTo({ url: '/pages-owner/share/index' })
}

onShow(() => {
  // 检查主人验证
  if (!userStore.isOwner) {
    uni.showModal({
      title: '身份验证',
      content: '请输入主人手机号后4位',
      editable: true,
      success: (res) => {
        if (res.confirm && res.content) {
          // 简单验证逻辑
          userStore.verifyOwner(true)
        }
      }
    })
  }
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 30rpx;
}

/* 顶部卡片 */
.header-card {
  background: linear-gradient(135deg, $color-primary 0%, #E91E63 100%);
  border-radius: 24rpx;
  padding: 40rpx;
  color: #fff;
  margin-bottom: 30rpx;
  box-shadow: $shadow-md;
}
.header-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 10rpx;
}
.header-date {
  display: block;
  font-size: 28rpx;
  opacity: 0.9;
  margin-bottom: 20rpx;
}
.header-status {
  display: flex;
}
.status-badge {
  padding: 6rpx 20rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  background: rgba(255,255,255,0.2);
}
.status-badge.published {
  background: rgba(82, 196, 26, 0.3);
}

/* 统计卡片 */
.stats-card {
  background: $bg-surface;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: $shadow-sm;
}
.stats-row {
  display: flex;
  justify-content: space-around;
}
.stats-item {
  text-align: center;
}
.stats-num {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: $color-primary;
  margin-bottom: 8rpx;
}
.stats-label {
  font-size: 24rpx;
  color: $text-muted;
}

/* 功能网格 */
.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
  margin-bottom: 30rpx;
}
.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx 10rpx;
  background: $bg-surface;
  border-radius: 20rpx;
  box-shadow: $shadow-sm;
}
.menu-item:active {
  background: $bg-muted;
}
.menu-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
}
.menu-title {
  font-size: 24rpx;
  color: $text-primary;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  gap: 20rpx;
}
.preview-btn,
.share-btn {
  flex: 1;
  height: 90rpx;
  line-height: 90rpx;
  text-align: center;
  border-radius: 16rpx;
  font-size: 30rpx;
}
.preview-btn {
  background: $bg-surface;
  color: $text-primary;
  box-shadow: $shadow-sm;
}
.share-btn {
  background: linear-gradient(135deg, $color-primary 0%, #E91E63 100%);
  color: #fff;
}
.preview-btn::after,
.share-btn::after {
  border: none;
}
</style>
