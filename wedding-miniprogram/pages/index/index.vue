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
        <view class="hero-deco-line" />
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
          <view class="info-icon-wrap"><text class="info-icon">📅</text></view>
          <view class="info-content">
            <text class="info-label">婚礼日期</text>
            <text class="info-value">{{ formatDate(weddingDate) }} {{ getWeekDay(weddingDate) }}</text>
          </view>
        </view>
        <view class="info-item">
          <view class="info-icon-wrap"><text class="info-icon">🕐</text></view>
          <view class="info-content">
            <text class="info-label">仪式时间</text>
            <text class="info-value">{{ weddingTime || '12:00' }}</text>
          </view>
        </view>
        <view class="info-item">
          <view class="info-icon-wrap"><text class="info-icon">📍</text></view>
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
/* ========== 页面基础 ========== */
.page {
  background-color: $bg-color;
  min-height: 100vh;
}

/* ========== 音乐控制 ========== */
.music-control {
  position: fixed;
  top: 100rpx;
  right: 30rpx;
  width: 72rpx;
  height: 72rpx;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border: 1rpx solid rgba(255,255,255,0.2);
  animation: fadeInScale 0.6s $ease-out-back 0.8s both;
}
.music-icon {
  font-size: 32rpx;
}

/* ========== 封面区域 ========== */
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
  background: linear-gradient(
    to bottom,
    rgba(44, 24, 16, 0.15) 0%,
    rgba(44, 24, 16, 0.35) 50%,
    rgba(44, 24, 16, 0.6) 100%
  );
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
  padding: 80rpx 50rpx;
}

/* 戒指图标 */
.ring-icon {
  font-size: 72rpx;
  margin-bottom: 40rpx;
  animation: fadeInUp 0.8s $ease-out-back 0.2s both;
  filter: drop-shadow(0 4rpx 12rpx rgba(212, 168, 83, 0.4));
}

/* 新人名字 - 更优雅 */
.couple-names {
  font-size: 64rpx;
  font-weight: 600;
  letter-spacing: 12rpx;
  margin-bottom: 20rpx;
  text-shadow: 0 4rpx 20rpx rgba(0,0,0,0.4);
  animation: fadeInUp 0.8s $ease-out 0.3s both;
  font-family: "PingFang SC", -apple-system, sans-serif;
}

/* 金色装饰线 */
.hero-deco-line {
  width: 80rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, $color-gold-light, transparent);
  margin-bottom: 24rpx;
  animation: lineExpand 1s $ease-out 0.5s both;
}

.wedding-date {
  font-size: 30rpx;
  letter-spacing: 4rpx;
  opacity: 0.85;
  margin-bottom: 60rpx;
  animation: fadeInUp 0.8s $ease-out 0.5s both;
}

/* ========== 倒计时 - 毛玻璃卡片 ========== */
.countdown-box {
  display: flex;
  gap: 16rpx;
  margin-bottom: 80rpx;
  animation: fadeInUp 0.8s $ease-out 0.6s both;
}
.countdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(16rpx);
  -webkit-backdrop-filter: blur(16rpx);
  border-radius: 20rpx;
  padding: 24rpx 28rpx;
  min-width: 110rpx;
  border: 1rpx solid rgba(212, 168, 83, 0.25);
  position: relative;
}
.countdown-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, $color-gold-light, transparent);
}
.countdown-num {
  font-size: 52rpx;
  font-weight: 700;
  line-height: 1.1;
  color: #fff;
  margin-bottom: 6rpx;
  font-variant-numeric: tabular-nums;
}
.countdown-label {
  font-size: 22rpx;
  color: rgba(255,255,255,0.7);
  letter-spacing: 2rpx;
}

/* ========== 滚动提示 ========== */
.scroll-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 22rpx;
  color: rgba(255,255,255,0.6);
  letter-spacing: 2rpx;
  animation: fadeIn 1s $ease-out 1s both;
}
.scroll-arrow {
  font-size: 36rpx;
  margin-top: 8rpx;
  animation: bounceDown 2s ease-in-out infinite;
}

/* ========== 通用 section ========== */
.section {
  padding: 70rpx 30rpx;
}
.section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  font-size: 36rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 50rpx;
  letter-spacing: 4rpx;
}
.title-deco {
  color: $color-gold;
  font-weight: 300;
  font-size: 28rpx;
  opacity: 0.7;
}

/* ========== 婚书区域 ========== */
.invitation-section {
  background: $bg-surface;
  position: relative;
}
.invitation-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, $border-gold, transparent);
}

.invitation-card {
  background: $bg-elevated;
  border: 1rpx solid $border-light;
  border-radius: 32rpx;
  padding: 60rpx 44rpx;
  text-align: center;
  position: relative;
  box-shadow: $shadow-sm;
  animation: fadeInScale 0.6s $ease-out both;
}

/* 中式角落装饰 */
.invitation-card::before,
.invitation-card::after {
  content: '';
  position: absolute;
  width: 32rpx;
  height: 32rpx;
  border-color: $color-gold;
  border-style: solid;
  opacity: 0.35;
}
.invitation-card::before {
  top: 20rpx;
  left: 20rpx;
  border-width: 2rpx 0 0 2rpx;
}
.invitation-card::after {
  bottom: 20rpx;
  right: 20rpx;
  border-width: 0 2rpx 2rpx 0;
}

.invitation-header {
  margin-bottom: 36rpx;
}
.invitation-subtitle {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  margin-bottom: 12rpx;
  letter-spacing: 6rpx;
}
.invitation-date {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: $color-primary;
  margin-bottom: 8rpx;
  letter-spacing: 2rpx;
}
.invitation-week {
  display: block;
  font-size: 24rpx;
  color: $text-muted;
}

/* 正文区域 */
.invitation-body {
  margin: 36rpx 0;
  padding: 36rpx 0;
  position: relative;
}
.invitation-body::before,
.invitation-body::after {
  content: '';
  position: absolute;
  left: 15%;
  right: 15%;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, $color-gold, transparent);
  opacity: 0.4;
}
.invitation-body::before { top: 0; }
.invitation-body::after { bottom: 0; }

.invitation-text {
  font-size: 30rpx;
  line-height: 2;
  color: $text-primary;
  letter-spacing: 2rpx;
}

.invitation-footer {
  margin-top: 36rpx;
}
.couple-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  font-size: 38rpx;
}
.groom-name, .bride-name {
  font-weight: 600;
  letter-spacing: 4rpx;
}
.heart {
  color: $color-primary;
  font-size: 32rpx;
  animation: gentleFloat 2s ease-in-out infinite;
}

/* 模板变体 */
.template-modern .invitation-card {
  background: $bg-surface;
  border: 1rpx solid $border-color;
}
.template-luxury .invitation-card {
  background: #FAF8F5;
  border: 2rpx solid rgba(212, 168, 83, 0.4);
  box-shadow: $shadow-gold;
}

/* ========== 婚礼信息 ========== */
.info-section {
  background: $bg-color;
}
.info-card {
  background: $bg-surface;
  border-radius: 32rpx;
  padding: 44rpx;
  box-shadow: $shadow-md;
  border: 1rpx solid $border-light;
  animation: fadeInUp 0.6s $ease-out both;
}
.info-item {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  margin-bottom: 32rpx;
  padding-bottom: 32rpx;
  border-bottom: 1rpx solid $border-light;
}
.info-item:last-of-type {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

/* 图标容器 */
.info-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, rgba(196,30,58,0.08) 0%, rgba(212,168,83,0.08) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.info-icon {
  font-size: 36rpx;
}
.info-content {
  flex: 1;
}
.info-label {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  margin-bottom: 6rpx;
  letter-spacing: 2rpx;
}
.info-value {
  display: block;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
  line-height: 1.4;
}
.info-address {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 6rpx;
  line-height: 1.5;
}

/* 操作按钮 */
.info-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 36rpx;
  padding-top: 36rpx;
  border-top: 1rpx solid $border-light;
}
.action-btn {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  text-align: center;
  border-radius: 20rpx;
  background: $bg-muted;
  color: $text-primary;
  font-size: 28rpx;
  font-weight: 500;
  transition: all 0.2s ease;
}
.action-btn.primary {
  background: $gradient-primary;
  color: #fff;
  box-shadow: 0 4rpx 16rpx rgba(196, 30, 58, 0.25);
}
.action-btn:active {
  transform: scale(0.97);
}
.action-btn::after {
  border: none;
}

/* ========== 快速入口 ========== */
.quick-section {
  background: $bg-surface;
  position: relative;
}
.quick-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, $border-gold, transparent);
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
  padding: 44rpx 16rpx;
  background: $bg-elevated;
  border-radius: 28rpx;
  border: 1rpx solid $border-light;
  transition: all 0.3s $ease-out;
  position: relative;
  overflow: hidden;
}
.quick-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3rpx;
  background: linear-gradient(90deg, transparent, $color-gold, transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.quick-item:active {
  transform: translateY(-4rpx);
  box-shadow: $shadow-md;
}
.quick-item:active::before {
  opacity: 1;
}
.quick-icon {
  font-size: 56rpx;
  margin-bottom: 16rpx;
}
.quick-label {
  font-size: 26rpx;
  color: $text-primary;
  font-weight: 500;
}

/* ========== 底部操作 ========== */
.bottom-section {
  background: $bg-color;
  padding-bottom: 60rpx;
}
.bottom-actions {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.bottom-btn {
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  border-radius: 24rpx;
  background: $bg-surface;
  color: $text-primary;
  font-size: 30rpx;
  font-weight: 500;
  box-shadow: $shadow-sm;
  border: 1rpx solid $border-light;
  transition: all 0.2s ease;
}
.bottom-btn.primary {
  background: $gradient-primary;
  color: #fff;
  box-shadow: 0 6rpx 24rpx rgba(196, 30, 58, 0.3);
  border: none;
}
.bottom-btn.primary:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 12rpx rgba(196, 30, 58, 0.2);
}
.bottom-btn:active {
  transform: scale(0.98);
}
.bottom-btn::after {
  border: none;
}
.bottom-text {
  text-align: center;
  margin-top: 48rpx;
  font-size: 24rpx;
  color: $text-muted;
  letter-spacing: 2rpx;
}

/* ========== 引流 ========== */
.promo-section {
  padding: 40rpx 30rpx 60rpx;
  text-align: center;
  background: $bg-color;
}
.promo-text {
  font-size: 26rpx;
  color: $color-primary;
  padding: 16rpx 40rpx;
  border-radius: 40rpx;
  background: rgba(196, 30, 58, 0.06);
  border: 1rpx solid rgba(196, 30, 58, 0.12);
}
</style>
