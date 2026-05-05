<template>
  <view class="page">
    <!-- 音乐控制 -->
    <view class="music-control" @click="toggleMusic" v-if="hasMusic">
      <text class="music-icon">{{ isPlaying ? '🔊' : '🔇' }}</text>
    </view>

    <!-- Section 1: 封面 -->
    <view class="hero-section">
      <image
        class="hero-bg"
        :src="coverImage"
        mode="aspectFill"
      />
      <view class="hero-overlay" />
      <view class="hero-content">
        <view class="ring-icon">💍</view>
        <view class="couple-names">{{ coupleName }}</view>
        <view class="wedding-date">{{ formatDate(weddingDate) }}</view>
        <view class="countdown-box" v-if="countdown">
          <view class="countdown-item">
            <text class="countdown-num">{{ countdown.days }}</text>
            <text class="countdown-label">天</text>
          </view>
          <view class="countdown-item">
            <text class="countdown-num">{{ countdown.hours }}</text>
            <text class="countdown-label">时</text>
          </view>
          <view class="countdown-item">
            <text class="countdown-num">{{ countdown.minutes }}</text>
            <text class="countdown-label">分</text>
          </view>
          <view class="countdown-item">
            <text class="countdown-num">{{ countdown.seconds }}</text>
            <text class="countdown-label">秒</text>
          </view>
        </view>
        <view class="scroll-hint">
          <text>向下滑动</text>
          <view class="scroll-arrow">↓</view>
        </view>
      </view>
    </view>

    <!-- Section 2: 婚书请柬 -->
    <view class="section invitation-section" :class="templateClass">
      <view class="section-title">
        <text class="title-deco">——</text>
        <text>婚书请柬</text>
        <text class="title-deco">——</text>
      </view>
      <view class="invitation-card">
        <view class="invitation-header">
          <text class="invitation-subtitle">谨定于</text>
          <text class="invitation-date">{{ formatDate(weddingDate) }}</text>
          <text class="invitation-week">{{ getWeekDay(weddingDate) }}</text>
        </view>
        <view class="invitation-body">
          <text class="invitation-text">{{ invitationText }}</text>
        </view>
        <view class="invitation-footer">
          <view class="couple-info">
            <text class="groom-name">{{ groomName }}</text>
            <text class="heart">♥</text>
            <text class="bride-name">{{ brideName }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Section 3: 婚礼信息 -->
    <view class="section info-section">
      <view class="section-title">
        <text class="title-deco">——</text>
        <text>婚礼信息</text>
        <text class="title-deco">——</text>
      </view>
      <view class="info-card">
        <view class="info-item">
          <text class="info-icon">📅</text>
          <view class="info-content">
            <text class="info-label">婚礼日期</text>
            <text class="info-value">{{ formatDate(weddingDate) }} {{ getWeekDay(weddingDate) }}</text>
          </view>
        </view>
        <view class="info-item">
          <text class="info-icon">🕐</text>
          <view class="info-content">
            <text class="info-label">仪式时间</text>
            <text class="info-value">{{ weddingTime || '12:00' }}</text>
          </view>
        </view>
        <view class="info-item">
          <text class="info-icon">📍</text>
          <view class="info-content">
            <text class="info-label">婚礼场地</text>
            <text class="info-value">{{ venueName }}</text>
            <text class="info-address">{{ venueAddress }}</text>
          </view>
        </view>
        <view class="info-actions">
          <button class="action-btn" @click="addToCalendar">
            <text>📅 添加到日历</text>
          </button>
          <button class="action-btn primary" @click="openNavigation">
            <text>🧭 一键导航</text>
          </button>
        </view>
      </view>
    </view>

    <!-- Section 4: 快速入口 -->
    <view class="section quick-section">
      <view class="section-title">
        <text class="title-deco">——</text>
        <text>快速入口</text>
        <text class="title-deco">——</text>
      </view>
      <view class="quick-grid">
        <view class="quick-item" @click="goToAlbum">
          <text class="quick-icon">📷</text>
          <text class="quick-label">查看相册</text>
        </view>
        <view class="quick-item" @click="goToGuide">
          <text class="quick-icon">🗺️</text>
          <text class="quick-label">婚礼路书</text>
        </view>
        <view class="quick-item" @click="goToTimeline">
          <text class="quick-icon">📅</text>
          <text class="quick-label">婚礼流程</text>
        </view>
      </view>
    </view>

    <!-- Section 5: 底部操作 -->
    <view class="section bottom-section">
      <view class="bottom-actions">
        <button class="bottom-btn primary" @click="goToRSVP">
          <text>我要出席</text>
        </button>
        <button class="bottom-btn" @click="goToBlessing">
          <text>发送祝福</text>
        </button>
        <button class="bottom-btn" open-type="share">
          <text>分享给好友</text>
        </button>
      </view>
      <view class="bottom-text">
        <text>感谢您的见证与祝福</text>
      </view>
    </view>

    <!-- 创建引流 -->
    <view class="promo-section">
      <navigator url="/pages-owner/wizard/index" open-type="navigate">
        <text class="promo-text">💕 我也要制作婚礼邀请</text>
      </navigator>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad, onShareAppMessage, onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding } from '@/composables/useCloud.js'
import { formatDate, getWeekDay } from '@/utils/index.js'

const store = useWeddingStore()
const userStore = useUserStore()

// 倒计时定时器
let countdownTimer = null
const countdown = ref(null)

// 音乐
const isPlaying = ref(false)
const hasMusic = computed(() => !!store.invitation?.media?.music?.url)

// 封面图
const coverImage = computed(() => {
  const photos = store.album?.photos || []
  const cover = photos.find(p => p.type === 'cover')
  return cover?.url || photos[0]?.url || '/static/default-cover.jpg'
})

// 新人信息
const coupleName = computed(() => store.coupleName)
const groomName = computed(() => store.invitation?.couple?.groom?.name || '新郎')
const brideName = computed(() => store.invitation?.couple?.bride?.name || '新娘')
const weddingDate = computed(() => store.weddingDate)
const weddingTime = computed(() => store.weddingTime)
const venueName = computed(() => store.venueName)
const venueAddress = computed(() => store.invitation?.wedding?.venue_address || '')
const invitationText = computed(() => {
  return store.invitation?.content?.main_text || '诚挚邀请您参加我们的婚礼，见证我们的幸福时刻。'
})

// 模板样式
const templateClass = computed(() => {
  const tpl = store.invitation?.template || 'classic'
  return `template-${tpl}`
})

// 更新倒计时
function updateCountdown() {
  const cd = store.countdown
  if (!cd) return
  countdown.value = {
    days: String(cd.days).padStart(2, '0'),
    hours: String(cd.hours).padStart(2, '0'),
    minutes: String(cd.minutes).padStart(2, '0'),
    seconds: String(cd.seconds).padStart(2, '0')
  }
}

// 音乐控制
function toggleMusic() {
  isPlaying.value = !isPlaying.value
  // TODO: 使用 innerAudioContext 控制播放
}

// 页面跳转
function goToAlbum() {
  uni.switchTab({ url: '/pages/album/index' })
}
function goToGuide() {
  uni.switchTab({ url: '/pages/guide/index' })
}
function goToTimeline() {
  uni.switchTab({ url: '/pages/timeline/index' })
}
function goToRSVP() {
  uni.navigateTo({ url: '/pages/rsvp/index' })
}
function goToBlessing() {
  uni.navigateTo({ url: '/pages/blessing/index' })
}

// 添加到日历
function addToCalendar() {
  // TODO: 使用 wx.addPhoneCalendar
  uni.showToast({ title: '已添加到日历', icon: 'success' })
}

// 一键导航
function openNavigation() {
  const venue = store.venues?.venues?.[0]
  if (venue?.coordinate) {
    uni.openLocation({
      latitude: venue.coordinate.latitude,
      longitude: venue.coordinate.longitude,
      name: venue.name,
      address: venue.address
    })
  } else {
    uni.showToast({ title: '暂无地址信息', icon: 'none' })
  }
}

// 分享
onShareAppMessage(() => {
  const title = store.wedding?.share_config?.title || `${coupleName.value}的婚礼邀请`
  return {
    title,
    path: `/pages/index/index?id=${userStore.weddingId}`,
    imageUrl: coverImage.value
  }
})

// 页面加载
onLoad(async (options) => {
  const weddingId = options?.id || userStore.weddingId
  if (weddingId) {
    userStore.setWeddingId(weddingId)
    try {
      await fetchWedding(weddingId)
      updateCountdown()
      // 启动倒计时
      countdownTimer = setInterval(updateCountdown, 1000)
    } catch (err) {
      console.error('加载婚礼数据失败:', err)
    }
  }
})

onShow(() => {
  updateCountdown()
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
}

/* 音乐控制 */
.music-control {
  position: fixed;
  top: 100rpx;
  right: 30rpx;
  width: 64rpx;
  height: 64rpx;
  background: rgba(255,255,255,0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  box-shadow: $shadow-sm;
}
.music-icon {
  font-size: 32rpx;
}

/* 封面区域 */
.hero-section {
  position: relative;
  height: 100vh;
  overflow: hidden;
}
.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%);
}
.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #fff;
  text-align: center;
  padding: 60rpx;
}
.ring-icon {
  font-size: 80rpx;
  margin-bottom: 30rpx;
}
.couple-names {
  font-size: 56rpx;
  font-weight: 700;
  letter-spacing: 8rpx;
  margin-bottom: 20rpx;
  text-shadow: 0 2rpx 10rpx rgba(0,0,0,0.3);
}
.wedding-date {
  font-size: 32rpx;
  opacity: 0.9;
  margin-bottom: 60rpx;
}

/* 倒计时 */
.countdown-box {
  display: flex;
  gap: 20rpx;
  margin-bottom: 80rpx;
}
.countdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(10rpx);
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  min-width: 100rpx;
}
.countdown-num {
  font-size: 48rpx;
  font-weight: 700;
  line-height: 1.2;
}
.countdown-label {
  font-size: 24rpx;
  opacity: 0.8;
}

/* 滚动提示 */
.scroll-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 24rpx;
  opacity: 0.7;
}
.scroll-arrow {
  font-size: 40rpx;
  animation: bounce 1.5s infinite;
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(10rpx); }
}

/* 通用section */
.section {
  padding: 60rpx 30rpx;
}
.section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  font-size: 36rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 40rpx;
}
.title-deco {
  color: $color-primary;
  opacity: 0.5;
}

/* 婚书区域 */
.invitation-section {
  background: $bg-surface;
}
.invitation-card {
  background: #FFF8F0;
  border: 2rpx solid #F0E6D8;
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  text-align: center;
}
.invitation-header {
  margin-bottom: 40rpx;
}
.invitation-subtitle {
  display: block;
  font-size: 28rpx;
  color: $text-secondary;
  margin-bottom: 10rpx;
}
.invitation-date {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: $color-primary;
  margin-bottom: 6rpx;
}
.invitation-week {
  display: block;
  font-size: 26rpx;
  color: $text-muted;
}
.invitation-body {
  margin: 40rpx 0;
  padding: 30rpx 0;
  border-top: 1rpx solid $border-color;
  border-bottom: 1rpx solid $border-color;
}
.invitation-text {
  font-size: 30rpx;
  line-height: 1.8;
  color: $text-primary;
}
.invitation-footer {
  margin-top: 40rpx;
}
.couple-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  font-size: 36rpx;
}
.groom-name, .bride-name {
  font-weight: 700;
}
.heart {
  color: $color-primary;
  font-size: 32rpx;
}

/* 模板样式变体 */
.template-modern .invitation-card {
  background: #fff;
  border: 2rpx solid #eee;
}
.template-luxury .invitation-card {
  background: #FAF8F5;
  border: 4rpx solid #D4AF37;
}

/* 婚礼信息 */
.info-section {
  background: $bg-color;
}
.info-card {
  background: $bg-surface;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: $shadow-sm;
}
.info-item {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  margin-bottom: 30rpx;
}
.info-icon {
  font-size: 40rpx;
  flex-shrink: 0;
}
.info-content {
  flex: 1;
}
.info-label {
  display: block;
  font-size: 24rpx;
  color: $text-muted;
  margin-bottom: 4rpx;
}
.info-value {
  display: block;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
}
.info-address {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  margin-top: 4rpx;
}
.info-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}
.action-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 12rpx;
  background: #f5f5f5;
  color: $text-primary;
  font-size: 28rpx;
  border: none;
}
.action-btn.primary {
  background: linear-gradient(135deg, $color-primary 0%, #E91E63 100%);
  color: #fff;
}
.action-btn::after {
  border: none;
}

/* 快速入口 */
.quick-section {
  background: $bg-surface;
}
.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}
.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 20rpx;
  background: $bg-muted;
  border-radius: 20rpx;
}
.quick-icon {
  font-size: 60rpx;
  margin-bottom: 16rpx;
}
.quick-label {
  font-size: 26rpx;
  color: $text-primary;
}

/* 底部操作 */
.bottom-section {
  background: $bg-color;
}
.bottom-actions {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.bottom-btn {
  height: 90rpx;
  line-height: 90rpx;
  text-align: center;
  border-radius: 16rpx;
  background: $bg-surface;
  color: $text-primary;
  font-size: 30rpx;
  box-shadow: $shadow-sm;
}
.bottom-btn.primary {
  background: linear-gradient(135deg, $color-primary 0%, #E91E63 100%);
  color: #fff;
}
.bottom-btn::after {
  border: none;
}
.bottom-text {
  text-align: center;
  margin-top: 40rpx;
  font-size: 26rpx;
  color: $text-muted;
}

/* 引流 */
.promo-section {
  padding: 30rpx;
  text-align: center;
}
.promo-text {
  font-size: 26rpx;
  color: $color-primary;
  text-decoration: underline;
}
</style>
