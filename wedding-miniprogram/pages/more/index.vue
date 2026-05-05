<template>
  <view class="page">
    <!-- 新人信息卡片 -->
    <view class="couple-card">
      <text class="couple-name">{{ coupleName }}</text>
      <text class="couple-date">{{ formatDate(weddingDate) }}</text>
    </view>

    <!-- 功能列表 -->
    <view class="menu-list">
      <view class="menu-item" @click="goToRSVP">
        <text class="menu-icon">📝</text>
        <view class="menu-content">
          <text class="menu-title">出席回执</text>
          <text class="menu-desc">填写您的出席信息</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>

      <view class="menu-item" @click="goToBlessing">
        <text class="menu-icon">💌</text>
        <view class="menu-content">
          <text class="menu-title">祝福墙</text>
          <text class="menu-desc">发送您对新人的祝福</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>

      <view class="menu-item" @click="goToGuide">
        <text class="menu-icon">🗺️</text>
        <view class="menu-content">
          <text class="menu-title">婚礼路书</text>
          <text class="menu-desc">查看场地和导航路线</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>

      <view class="menu-item" @click="goToTimeline">
        <text class="menu-icon">📅</text>
        <view class="menu-content">
          <text class="menu-title">婚礼流程</text>
          <text class="menu-desc">查看婚礼当天时间安排</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>

      <view class="menu-item" @click="goToAlbum">
        <text class="menu-icon">📷</text>
        <view class="menu-content">
          <text class="menu-title">婚纱相册</text>
          <text class="menu-desc">浏览新人婚纱照</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>

      <!-- 主人入口 -->
      <view class="menu-divider" />

      <view class="menu-item" @click="goToManage">
        <text class="menu-icon">⚙️</text>
        <view class="menu-content">
          <text class="menu-title">管理后台</text>
          <text class="menu-desc">编辑婚礼内容（需主人验证）</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 分享按钮 -->
    <view class="share-section">
      <button class="share-btn" open-type="share">
        <text>分享给好友</text>
      </button>
    </view>

    <!-- 创建引流 -->
    <navigator class="promo-link" url="/pages-owner/wizard/index" open-type="navigate">
      <text>💕 我也要制作婚礼邀请</text>
    </navigator>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onShareAppMessage } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { formatDate } from '@/utils/index.js'

const store = useWeddingStore()
const userStore = useUserStore()

const coupleName = computed(() => store.coupleName)
const weddingDate = computed(() => store.weddingDate)

function goToRSVP() {
  uni.navigateTo({ url: '/pages/rsvp/index' })
}
function goToBlessing() {
  uni.navigateTo({ url: '/pages/blessing/index' })
}
function goToGuide() {
  uni.switchTab({ url: '/pages/guide/index' })
}
function goToTimeline() {
  uni.switchTab({ url: '/pages/timeline/index' })
}
function goToAlbum() {
  uni.switchTab({ url: '/pages/album/index' })
}
function goToManage() {
  uni.navigateTo({ url: '/pages-owner/manage/index' })
}

onShareAppMessage(() => {
  return {
    title: `${coupleName.value}的婚礼邀请`,
    path: `/pages/index/index?id=${userStore.weddingId}`
  }
})
</script>

<style lang="scss" scoped>
/* ========== 更多页面 ========== */
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 30rpx;
}

/* ===== 顶部卡片 ===== */
.couple-card {
  text-align: center;
  padding: 60rpx 30rpx 50rpx;
  margin-bottom: 30rpx;
  position: relative;
}
.couple-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 25%;
  right: 25%;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, $color-gold, transparent);
}
.couple-name {
  display: block;
  font-size: 48rpx;
  font-weight: 600;
  color: $color-primary;
  margin-bottom: 16rpx;
  letter-spacing: 6rpx;
}
.couple-date {
  font-size: 28rpx;
  color: $text-secondary;
  letter-spacing: 2rpx;
}

/* ===== 菜单列表 ===== */
.menu-list {
  background: $bg-surface;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: $shadow-md;
  border: 1rpx solid $border-light;
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid $border-light;
  transition: all 0.2s ease;
}
.menu-item:last-child {
  border-bottom: none;
}
.menu-item:active {
  background: $bg-elevated;
}

/* 图标容器 */
.menu-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, rgba(196,30,58,0.06) 0%, rgba(212,168,83,0.06) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;
}
.menu-icon {
  font-size: 40rpx;
}
.menu-content {
  flex: 1;
}
.menu-title {
  display: block;
  font-size: 30rpx;
  color: $text-primary;
  margin-bottom: 6rpx;
  font-weight: 500;
}
.menu-desc {
  font-size: 24rpx;
  color: $text-muted;
}
.menu-arrow {
  font-size: 32rpx;
  color: $color-gold;
  opacity: 0.5;
}

.menu-divider {
  height: 24rpx;
  background: $bg-color;
}

/* ===== 分享区域 ===== */
.share-section {
  margin-top: 44rpx;
}
.share-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  border-radius: 24rpx;
  background: $gradient-primary;
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  box-shadow: 0 6rpx 24rpx rgba(196, 30, 58, 0.25);
  transition: all 0.2s ease;
}
.share-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 12rpx rgba(196, 30, 58, 0.15);
}
.share-btn::after {
  border: none;
}

/* ===== 引流 ===== */
.promo-link {
  display: block;
  text-align: center;
  margin-top: 44rpx;
  font-size: 26rpx;
  color: $color-primary;
  padding: 16rpx 40rpx;
  border-radius: 40rpx;
  background: rgba(196, 30, 58, 0.05);
  border: 1rpx solid rgba(196, 30, 58, 0.1);
}
</style>
