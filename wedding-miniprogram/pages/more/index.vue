<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">MORE</text>
      <text class="page-title">更多</text>
    </view>

    <!-- 新人信息 -->
    <view class="couple-info">
      <text class="couple-name">{{ coupleName }}</text>
      <text class="couple-date">{{ formatDate(weddingDate) }}</text>
    </view>

    <!-- 功能列表 -->
    <view class="menu-group">
      <view class="menu-item" @click="goToRSVP">
        <image class="visual-icon menu-icon" src="/static/visuals/icon-rsvp.png" mode="aspectFit" />
        <text class="menu-title">出席回执</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goToBlessing">
        <image class="visual-icon menu-icon" src="/static/visuals/icon-blessing.png" mode="aspectFit" />
        <text class="menu-title">祝福墙</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goToGuide">
        <image class="visual-icon menu-icon" src="/static/visuals/icon-guide.png" mode="aspectFit" />
        <text class="menu-title">婚礼路书</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goToTimeline">
        <image class="visual-icon menu-icon" src="/static/visuals/icon-timeline.png" mode="aspectFit" />
        <text class="menu-title">婚礼流程</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goToAlbum">
        <image class="visual-icon menu-icon" src="/static/visuals/icon-album.png" mode="aspectFit" />
        <text class="menu-title">婚纱相册</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <view class="menu-group">
      <view class="menu-item" @click="goToManage">
        <image class="visual-icon menu-icon" src="/static/visuals/icon-manage.png" mode="aspectFit" />
        <text class="menu-title">管理后台</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <button class="menu-item contact-btn" open-type="contact">
        <image class="visual-icon menu-icon" src="/static/visuals/icon-phone.png" mode="aspectFit" />
        <text class="menu-title">联系客服</text>
        <text class="menu-arrow">›</text>
      </button>
    </view>

    <!-- 分享 -->
    <view class="share-area">
      <button class="share-btn" open-type="share">分享给好友</button>
    </view>

    <!-- 引流 -->
    <navigator class="promo-link" url="/pages-owner/wizard/index" open-type="navigate">
      <text>我也要制作婚礼邀请</text>
    </navigator>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { formatDate } from '@/utils/index.js'

const store = useWeddingStore()
const userStore = useUserStore()

const coupleName = computed(() => store.coupleName)
const weddingDate = computed(() => store.weddingDate)

function goToRSVP() { uni.navigateTo({ url: '/pages/rsvp/index' }) }
function goToBlessing() { uni.navigateTo({ url: '/pages/blessing/index' }) }
function goToGuide() { uni.switchTab({ url: '/pages/guide/index' }) }
function goToTimeline() { uni.switchTab({ url: '/pages/timeline/index' }) }
function goToAlbum() { uni.switchTab({ url: '/pages/album/index' }) }
function goToManage() { uni.navigateTo({ url: '/pages-owner/manage/index' }) }

onShareAppMessage(() => ({
  title: `${coupleName.value}的婚礼邀请`,
  path: `/pages/index/index?id=${userStore.weddingId}`
}))

onShareTimeline(() => ({
  title: `${coupleName.value}的婚礼邀请`,
  query: `id=${userStore.weddingId}`
}))
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: 60rpx;
}

/* 顶部标题 */
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
}

/* 新人信息 */
.couple-info {
  padding: 24rpx 48rpx 48rpx;
}
.couple-name {
  display: block;
  font-size: $font-h2;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 8rpx;
}
.couple-date {
  display: block;
  font-size: $font-body;
  color: $text-secondary;
}

/* 菜单组 */
.menu-group {
  margin: 0 48rpx 24rpx;
  background: $bg-surface;
  border-radius: $radius-lg;
  overflow: hidden;
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx 28rpx;
  transition: background 0.15s ease;
}
.menu-item:active {
  background: $bg-muted;
}
.contact-btn {
  background: transparent;
  border: none;
  padding: 32rpx 28rpx;
  margin: 0;
  line-height: inherit;
  text-align: left;
}
.contact-btn::after { border: none; }
.menu-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
  width: 48rpx;
  text-align: center;
}
.menu-title {
  flex: 1;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
}
.menu-arrow {
  font-size: 28rpx;
  color: $text-muted;
}

.divider {
  height: 1rpx;
  background: $border-color;
  margin: 0 28rpx;
}

/* 分享 */
.share-area {
  padding: 48rpx;
}
.share-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  border-radius: $radius-full;
  background: $text-primary;
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  transition: opacity 0.2s ease;
}
.share-btn::after { border: none; }
.share-btn:active { opacity: 0.8; }

/* 引流 */
.promo-link {
  text-align: center;
  padding: 20rpx;
  font-size: 26rpx;
  color: $text-muted;
}
</style>
