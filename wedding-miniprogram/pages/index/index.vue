<template>
  <view class="page">
    <!-- 封面大图 -->
    <view class="hero">
      <image class="hero-image" :src="coverImage" mode="aspectFill" />
      <view class="hero-gradient" />
      <view class="hero-content">
        <text class="hero-tag">WEDDING INVITATION</text>
        <text class="hero-names">{{ groomName }} & {{ brideName }}</text>
        <text class="hero-date">{{ formatDate(weddingDate) }}</text>
        <view class="hero-countdown" v-if="countdown">
          <text class="countdown-num">{{ countdown.days }}</text>
          <text class="countdown-unit">天后，我们结婚</text>
        </view>
        <view class="scroll-hint">
          <view class="scroll-line" />
          <text class="scroll-text">滑动探索</text>
        </view>
      </view>
    </view>

    <!-- 婚书正文 -->
    <view class="section invitation-section">
      <view class="invitation-body">
        <text class="invitation-text">{{ invitationText }}</text>
      </view>
      <view class="invitation-couple">
        <text class="couple-name">{{ groomName }}</text>
        <view class="couple-heart" />
        <text class="couple-name">{{ brideName }}</text>
      </view>
    </view>

    <!-- 婚礼信息 -->
    <view class="section info-section">
      <view class="info-header">
        <text class="info-title">婚礼信息</text>
        <text class="info-sub">INFORMATION</text>
      </view>
      <view class="info-list">
        <view class="info-row">
          <view class="info-meta">
            <text class="info-label">日期</text>
            <text class="info-value">{{ formatDate(weddingDate) }} {{ getWeekDay(weddingDate) }}</text>
          </view>
        </view>
        <view class="divider" />
        <view class="info-row">
          <view class="info-meta">
            <text class="info-label">时间</text>
            <text class="info-value">{{ weddingTime || '12:00' }}</text>
          </view>
        </view>
        <view class="divider" />
        <view class="info-row">
          <view class="info-meta">
            <text class="info-label">地点</text>
            <text class="info-value">{{ venueName }}</text>
            <text class="info-address" v-if="venueAddress">{{ venueAddress }}</text>
          </view>
          <view class="info-arrow" @click="openNavigation">→</view>
        </view>
      </view>
    </view>

    <!-- 快速入口 -->
    <view class="section quick-section">
      <view class="quick-grid">
        <view class="quick-item" @click="goToAlbum">
          <text class="quick-label">婚纱相册</text>
          <text class="quick-arrow">→</text>
        </view>
        <view class="quick-item" @click="goToGuide">
          <text class="quick-label">婚礼路书</text>
          <text class="quick-arrow">→</text>
        </view>
        <view class="quick-item" @click="goToTimeline">
          <text class="quick-label">婚礼流程</text>
          <text class="quick-arrow">→</text>
        </view>
        <view class="quick-item" @click="goToBlessing">
          <text class="quick-label">祝福留言</text>
          <text class="quick-arrow">→</text>
        </view>
      </view>
    </view>

    <!-- 底部留白 -->
    <view class="section footer-section">
      <text class="footer-text">期待与您相见</text>
    </view>

    <!-- 悬浮操作 -->
    <view class="float-actions">
      <button class="float-btn rsvp" @click="goToRSVP">确认出席</button>
      <button class="float-btn share" open-type="share">分享</button>
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

let countdownTimer = null
const countdown = ref(null)

const coverImage = computed(() => {
  const photos = store.album?.photos || []
  const cover = photos.find(p => p.type === 'cover')
  return cover?.url || photos[0]?.url || '/static/default-cover.jpg'
})

const groomName = computed(() => store.invitation?.couple?.groom?.name || '新郎')
const brideName = computed(() => store.invitation?.couple?.bride?.name || '新娘')
const weddingDate = computed(() => store.weddingDate)
const weddingTime = computed(() => store.weddingTime)
const venueName = computed(() => store.venueName)
const venueAddress = computed(() => store.invitation?.wedding?.venue_address || '')
const invitationText = computed(() => {
  return store.invitation?.content?.main_text || '诚挚邀请您参加我们的婚礼，见证我们的幸福时刻。'
})

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

function goToAlbum() { uni.switchTab({ url: '/pages/album/index' }) }
function goToGuide() { uni.switchTab({ url: '/pages/guide/index' }) }
function goToTimeline() { uni.switchTab({ url: '/pages/timeline/index' }) }
function goToRSVP() { uni.navigateTo({ url: '/pages/rsvp/index' }) }
function goToBlessing() { uni.navigateTo({ url: '/pages/blessing/index' }) }

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

onShareAppMessage(() => {
  const title = store.wedding?.share_config?.title || `${groomName.value} & ${brideName.value} 的婚礼邀请`
  return {
    title,
    path: `/pages/index/index?id=${userStore.weddingId}`,
    imageUrl: coverImage.value
  }
})

onLoad(async (options) => {
  const weddingId = options?.id || userStore.weddingId
  if (weddingId) {
    userStore.setWeddingId(weddingId)
    try {
      await fetchWedding(weddingId)
      updateCountdown()
      countdownTimer = setInterval(updateCountdown, 1000)
    } catch (err) {
      console.error('加载婚礼数据失败:', err)
    }
  }
})

onShow(() => { updateCountdown() })

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: 160rpx;
}

/* ========== 封面大图 ========== */
.hero {
  position: relative;
  height: 85vh;
  min-height: 1000rpx;
  overflow: hidden;
}
.hero-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.hero-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(0,0,0,0.2) 0%,
    rgba(0,0,0,0.1) 30%,
    rgba(0,0,0,0.3) 70%,
    rgba(255,255,255,0.98) 100%
  );
}
.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  padding: 60rpx 48rpx 120rpx;
  text-align: center;
}

.hero-tag {
  font-size: 22rpx;
  color: rgba(255,255,255,0.7);
  letter-spacing: 6rpx;
  margin-bottom: 24rpx;
  animation: fadeIn 1s $ease-out 0.3s both;
}

.hero-names {
  font-size: 68rpx;
  font-weight: 600;
  color: #fff;
  letter-spacing: 8rpx;
  margin-bottom: 16rpx;
  text-shadow: 0 2rpx 16rpx rgba(0,0,0,0.3);
  animation: fadeInUp 0.8s $ease-out 0.4s both;
}

.hero-date {
  font-size: 28rpx;
  color: rgba(255,255,255,0.85);
  letter-spacing: 4rpx;
  margin-bottom: 40rpx;
  animation: fadeInUp 0.8s $ease-out 0.55s both;
}

.hero-countdown {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-bottom: 80rpx;
  animation: fadeInUp 0.8s $ease-out 0.7s both;
}
.countdown-num {
  font-size: 56rpx;
  font-weight: 700;
  color: #fff;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2rpx 12rpx rgba(0,0,0,0.2);
}
.countdown-unit {
  font-size: 26rpx;
  color: rgba(255,255,255,0.8);
}

/* 滚动提示 */
.scroll-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn 1s $ease-out 1.2s both;
}
.scroll-line {
  width: 1rpx;
  height: 60rpx;
  background: linear-gradient(to bottom, rgba(255,255,255,0.6), transparent);
  margin-bottom: 16rpx;
}
.scroll-text {
  font-size: 20rpx;
  color: rgba(255,255,255,0.5);
  letter-spacing: 4rpx;
}

/* ========== 通用 section ========== */
.section {
  padding: 80rpx 48rpx;
}

/* ========== 婚书正文 ========== */
.invitation-section {
  text-align: center;
}
.invitation-text {
  font-size: 32rpx;
  line-height: 2;
  color: $text-primary;
  letter-spacing: 4rpx;
}
.invitation-couple {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  margin-top: 48rpx;
}
.couple-name {
  font-size: 36rpx;
  font-weight: 600;
  letter-spacing: 6rpx;
  color: $text-primary;
}
.couple-heart {
  width: 12rpx;
  height: 12rpx;
  background: $color-primary;
  transform: rotate(45deg);
  position: relative;
}
.couple-heart::before,
.couple-heart::after {
  content: '';
  position: absolute;
  width: 12rpx;
  height: 12rpx;
  background: $color-primary;
  border-radius: 50%;
}
.couple-heart::before { left: -6rpx; top: 0; }
.couple-heart::after { left: 0; top: -6rpx; }

/* ========== 婚礼信息 ========== */
.info-section {
  background: $bg-muted;
}
.info-header {
  margin-bottom: 48rpx;
}
.info-title {
  display: block;
  font-size: $font-h1;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 8rpx;
}
.info-sub {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 4rpx;
}

.info-list {
  background: $bg-surface;
  border-radius: $radius-lg;
  padding: 0 40rpx;
}
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36rpx 0;
}
.info-meta {
  flex: 1;
}
.info-label {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  margin-bottom: 8rpx;
  letter-spacing: 2rpx;
}
.info-value {
  display: block;
  font-size: 32rpx;
  color: $text-primary;
  font-weight: 500;
}
.info-address {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 4rpx;
}
.info-arrow {
  font-size: 32rpx;
  color: $text-muted;
  padding: 16rpx;
}

.divider {
  height: 1rpx;
  background: $border-color;
}

/* ========== 快速入口 ========== */
.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}
.quick-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36rpx 32rpx;
  background: $bg-surface;
  border-radius: $radius-lg;
  border: 1rpx solid $border-color;
  transition: all 0.2s ease;
}
.quick-item:active {
  background: $bg-muted;
}
.quick-label {
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
}
.quick-arrow {
  font-size: 28rpx;
  color: $text-muted;
}

/* ========== 底部 ========== */
.footer-section {
  text-align: center;
  padding-top: 40rpx;
  padding-bottom: 40rpx;
}
.footer-text {
  font-size: 24rpx;
  color: $text-muted;
  letter-spacing: 4rpx;
}

/* ========== 悬浮操作 ========== */
.float-actions {
  position: fixed;
  bottom: calc(40rpx + constant(safe-area-inset-bottom));
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  left: 48rpx;
  right: 48rpx;
  display: flex;
  gap: 16rpx;
  z-index: 100;
}
.float-btn {
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: $radius-full;
  font-size: 30rpx;
  font-weight: 500;
  transition: opacity 0.2s ease;
}
.float-btn::after { border: none; }
.float-btn:active { opacity: 0.8; }
.float-btn.rsvp {
  flex: 1;
  background: $text-primary;
  color: #fff;
}
.float-btn.share {
  width: 120rpx;
  background: $bg-surface;
  color: $text-primary;
  border: 1rpx solid $border-color;
}
</style>
