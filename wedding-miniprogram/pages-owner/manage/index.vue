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
        <view class="menu-icon-wrap"><text class="menu-icon">🎨</text></view>
        <text class="menu-title">婚书编辑</text>
      </view>
      <view class="menu-item" @click="goTo('album/manage')">
        <view class="menu-icon-wrap"><text class="menu-icon">🖼️</text></view>
        <text class="menu-title">相册管理</text>
      </view>
      <view class="menu-item" @click="goTo('guide/edit')">
        <view class="menu-icon-wrap"><text class="menu-icon">🗺️</text></view>
        <text class="menu-title">路书设置</text>
      </view>
      <view class="menu-item" @click="goTo('timeline/edit')">
        <view class="menu-icon-wrap"><text class="menu-icon">📅</text></view>
        <text class="menu-title">流程编辑</text>
      </view>
      <view class="menu-item" @click="goTo('guests/manage')">
        <view class="menu-icon-wrap"><text class="menu-icon">👥</text></view>
        <text class="menu-title">宾客管理</text>
      </view>
      <view class="menu-item" @click="goTo('blessing/manage')">
        <view class="menu-icon-wrap"><text class="menu-icon">💬</text></view>
        <text class="menu-title">祝福管理</text>
      </view>
      <view class="menu-item" @click="goTo('share/index')">
        <view class="menu-icon-wrap"><text class="menu-icon">📤</text></view>
        <text class="menu-title">分享设置</text>
      </view>
      <view class="menu-item" @click="goTo('stats/index')">
        <view class="menu-icon-wrap"><text class="menu-icon">📊</text></view>
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
  if (!userStore.isOwner) {
    uni.showModal({
      title: '身份验证',
      content: '请输入主人手机号后4位',
      editable: true,
      success: (res) => {
        if (res.confirm && res.content) {
          userStore.verifyOwner(true)
        }
      }
    })
  }
})
</script>

<style lang="scss" scoped>
/* ========== 管理后台 ========== */
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 30rpx;
}

/* ===== 顶部卡片 ===== */
.header-card {
  background: $gradient-primary;
  border-radius: 32rpx;
  padding: 44rpx;
  color: #fff;
  margin-bottom: 30rpx;
  box-shadow: $shadow-lg;
  position: relative;
  overflow: hidden;
  animation: fadeInScale 0.5s $ease-out both;
}
.header-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
}
.header-card::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -10%;
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
}
.header-title {
  display: block;
  font-size: 38rpx;
  font-weight: 600;
  margin-bottom: 10rpx;
  position: relative;
  z-index: 1;
}
.header-date {
  display: block;
  font-size: 28rpx;
  opacity: 0.85;
  margin-bottom: 20rpx;
  position: relative;
  z-index: 1;
}
.header-status {
  display: flex;
  position: relative;
  z-index: 1;
}
.status-badge {
  padding: 6rpx 20rpx;
  border-radius: 10rpx;
  font-size: 22rpx;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(8rpx);
  font-weight: 500;
}
.status-badge.published {
  background: rgba(91, 154, 94, 0.35);
}

/* ===== 统计卡片 ===== */
.stats-card {
  background: $bg-surface;
  border-radius: 32rpx;
  padding: 36rpx;
  margin-bottom: 30rpx;
  box-shadow: $shadow-md;
  border: 1rpx solid $border-light;
  animation: fadeInUp 0.5s $ease-out 0.1s both;
  opacity: 0;
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
  font-size: 44rpx;
  font-weight: 700;
  color: $color-primary;
  margin-bottom: 8rpx;
  font-variant-numeric: tabular-nums;
}
.stats-label {
  font-size: 24rpx;
  color: $text-muted;
  letter-spacing: 2rpx;
}

/* ===== 功能网格 ===== */
.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
  margin-bottom: 30rpx;
  animation: fadeInUp 0.5s $ease-out 0.2s both;
  opacity: 0;
}
.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28rpx 6rpx;
  background: $bg-surface;
  border-radius: 24rpx;
  box-shadow: $shadow-sm;
  border: 1rpx solid $border-light;
  transition: all 0.25s $ease-out;
}
.menu-item:active {
  transform: translateY(-2rpx);
  box-shadow: $shadow-md;
}
.menu-icon-wrap {
  width: 68rpx;
  height: 68rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, rgba(196,30,58,0.06) 0%, rgba(212,168,83,0.06) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}
.menu-icon {
  font-size: 40rpx;
}
.menu-title {
  font-size: 22rpx;
  color: $text-primary;
  font-weight: 500;
}

/* ===== 快捷操作 ===== */
.quick-actions {
  display: flex;
  gap: 20rpx;
  animation: fadeInUp 0.5s $ease-out 0.3s both;
  opacity: 0;
}
.preview-btn,
.share-btn {
  flex: 1;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  border-radius: 24rpx;
  font-size: 30rpx;
  font-weight: 500;
  transition: all 0.2s ease;
}
.preview-btn {
  background: $bg-surface;
  color: $text-primary;
  box-shadow: $shadow-sm;
  border: 1rpx solid $border-light;
}
.share-btn {
  background: $gradient-primary;
  color: #fff;
  box-shadow: 0 6rpx 24rpx rgba(196, 30, 58, 0.25);
}
.preview-btn:active,
.share-btn:active {
  transform: scale(0.97);
}
.preview-btn::after,
.share-btn::after {
  border: none;
}
</style>
