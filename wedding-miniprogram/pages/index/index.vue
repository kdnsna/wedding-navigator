<template>
  <view class="page" @touchstart="onPageTap">
    <!-- 封面大图 -->
    <view class="hero">
      <image class="hero-image" :src="coverImage" mode="aspectFill" />
      <view class="hero-gradient" />
      <text class="xi-watermark">囍</text>
      <view class="hero-content">
        <text class="hero-tag animate-fade-in delay-2">WEDDING INVITATION</text>
        <view class="hero-divider animate-draw-line delay-3" />
        <text class="hero-names animate-fade-up delay-4">{{ groomName }} & {{ brideName }}</text>
        <text class="hero-sub animate-fade-up delay-5">We're getting married</text>
        <text class="hero-date animate-fade-up delay-6">{{ formatDate(weddingDate) }}</text>
        <view class="hero-countdown animate-fade-up delay-7" v-if="countdown && !countdown.isToday">
          <text class="countdown-num">{{ countdown.days }}</text>
          <view class="countdown-divider" />
          <view class="countdown-info">
            <text class="countdown-label">DAYS</text>
            <text class="countdown-desc">距离我们结婚</text>
          </view>
        </view>
        <view class="hero-today animate-fade-up delay-7" v-if="countdown?.isToday">
          <text class="today-label">TODAY</text>
          <text class="today-desc">就是今天</text>
        </view>
        <view class="scroll-hint animate-fade-in delay-10">
          <view class="scroll-line" />
          <text class="scroll-text">滑动探索</text>
        </view>
      </view>
    </view>

    <!-- 婚书正文 -->
    <view class="section invitation-section">
      <view class="quote-top">
        <text class="quote-mark">"</text>
      </view>
      <view class="invitation-body">
        <text class="invitation-text stagger-1">{{ invitationText }}</text>
      </view>
      <view class="invitation-couple stagger-3">
        <view class="couple-side">
          <text class="couple-label">GROOM</text>
          <text class="couple-name">{{ groomName }}</text>
        </view>
        <view class="couple-divider">
          <view class="couple-line" />
          <view class="couple-heart" />
          <view class="couple-line" />
        </view>
        <view class="couple-side">
          <text class="couple-label">BRIDE</text>
          <text class="couple-name">{{ brideName }}</text>
        </view>
      </view>
      <view class="quote-bottom">
        <text class="quote-mark">"</text>
      </view>
    </view>

    <!-- 婚礼信息 -->
    <view class="section info-section">
      <view class="section-header stagger-1">
        <view class="header-line" />
        <view class="header-text">
          <text class="info-title">婚礼信息</text>
          <text class="info-sub">INFORMATION</text>
        </view>
        <view class="header-line" />
      </view>
      <view class="info-list stagger-2">
        <view class="info-row" @click="openCalendar">
          <view class="info-icon-wrap">
            <image class="visual-icon info-icon" src="/static/visuals/icon-date.png" mode="aspectFit" />
          </view>
          <view class="info-meta">
            <text class="info-label">日期 DATE</text>
            <text class="info-value">{{ formatDate(weddingDate) }} {{ getWeekDay(weddingDate) }}</text>
          </view>
          <text class="info-action">›</text>
        </view>
        <view class="info-divider" />
        <view class="info-row">
          <view class="info-icon-wrap">
            <image class="visual-icon info-icon" src="/static/visuals/icon-time.png" mode="aspectFit" />
          </view>
          <view class="info-meta">
            <text class="info-label">时间 TIME</text>
            <text class="info-value">{{ weddingTime || '12:00' }}</text>
          </view>
        </view>
        <view class="info-divider" />
        <view class="info-row" @click="openNavigation">
          <view class="info-icon-wrap">
            <image class="visual-icon info-icon" src="/static/visuals/icon-location.png" mode="aspectFit" />
          </view>
          <view class="info-meta">
            <text class="info-label">地点 VENUE</text>
            <text class="info-value">{{ venueName }}</text>
            <text class="info-address" v-if="venueAddress">{{ venueAddress }}</text>
          </view>
          <text class="info-action">›</text>
        </view>
      </view>
    </view>

    <!-- 快速入口 -->
    <view class="section quick-section">
      <view class="section-header stagger-1">
        <view class="header-line" />
        <view class="header-text">
          <text class="quick-title">探索更多</text>
          <text class="quick-sub">EXPLORE</text>
        </view>
        <view class="header-line" />
      </view>
      <view class="quick-grid">
        <view class="quick-item stagger-1" @click="goToAlbum">
          <image class="visual-icon quick-icon" src="/static/visuals/icon-album.png" mode="aspectFit" />
          <view class="quick-meta">
            <text class="quick-label">婚纱相册</text>
            <text class="quick-en">ALBUM</text>
          </view>
          <text class="quick-arrow">›</text>
        </view>
        <view class="quick-item stagger-2" @click="goToGuide">
          <image class="visual-icon quick-icon" src="/static/visuals/icon-guide.png" mode="aspectFit" />
          <view class="quick-meta">
            <text class="quick-label">婚礼路书</text>
            <text class="quick-en">GUIDE</text>
          </view>
          <text class="quick-arrow">›</text>
        </view>
        <view class="quick-item stagger-3" @click="goToTimeline">
          <image class="visual-icon quick-icon" src="/static/visuals/icon-timeline.png" mode="aspectFit" />
          <view class="quick-meta">
            <text class="quick-label">婚礼流程</text>
            <text class="quick-en">TIMELINE</text>
          </view>
          <text class="quick-arrow">›</text>
        </view>
        <view class="quick-item stagger-4" @click="goToBlessing">
          <image class="visual-icon quick-icon" src="/static/visuals/icon-blessing.png" mode="aspectFit" />
          <view class="quick-meta">
            <text class="quick-label">祝福留言</text>
            <text class="quick-en">BLESSING</text>
          </view>
          <text class="quick-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 底部留白 -->
    <view class="section footer-section">
      <view class="footer-line" />
      <text class="footer-text stagger-1">期待与您相见</text>
      <text class="footer-sub stagger-2">Looking forward to seeing you</text>
    </view>

    <!-- 悬浮操作 -->
    <view class="float-actions">
      <button class="float-btn rsvp" @click="goToRSVP">确认出席</button>
      <button class="float-btn share" open-type="share">
        <text class="share-icon">↗</text>
      </button>
    </view>

    <!-- 背景音乐控制 -->
    <view class="music-control" v-if="bgMusicEnabled" @click="toggleMusic">
      <image
        class="music-icon"
        :class="{ playing: isMusicPlaying }"
        :src="isMusicPlaying ? '/static/visuals/icon-speaker.png' : '/static/visuals/icon-music.png'"
        mode="aspectFit"
      />
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding, recordShare, recordView } from '@/composables/useCloud.js'
import { formatDate, getWeekDay } from '@/utils/index.js'

const store = useWeddingStore()
const userStore = useUserStore()

let countdownTimer = null
const countdown = ref(null)

// 背景音乐
let audioCtx = null
const bgMusicEnabled = computed(() => store.invitation?.features?.bg_music_enabled || false)
const bgMusicUrl = computed(() => store.invitation?.features?.bg_music_url || '')
const isMusicPlaying = ref(false)
const musicStarted = ref(false) // 是否已点击过页面（满足自动播放条件）

function initMusic() {
  if (!bgMusicEnabled.value || !bgMusicUrl.value) return
  audioCtx = uni.createInnerAudioContext()
  audioCtx.src = bgMusicUrl.value
  audioCtx.loop = true
  audioCtx.volume = 0.5
  audioCtx.onPlay(() => { isMusicPlaying.value = true })
  audioCtx.onPause(() => { isMusicPlaying.value = false })
  audioCtx.onError(() => {
    isMusicPlaying.value = false
    console.warn('背景音乐播放失败')
  })
}

function toggleMusic() {
  if (!audioCtx) {
    initMusic()
    musicStarted.value = true
  }
  if (audioCtx.paused) {
    audioCtx.play()
  } else {
    audioCtx.pause()
  }
}

// 首页点击时触发音乐播放（满足微信自动播放策略）
function onPageTap() {
  if (!musicStarted.value && bgMusicEnabled.value) {
    musicStarted.value = true
    initMusic()
    if (audioCtx) audioCtx.play()
  }
}

const coverImage = computed(() => {
  const photos = store.album?.photos || []
  const cover = photos.find(p => p.type === 'cover')
  return cover?.url || photos[0]?.url || '/static/visuals/default-cover.png'
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
  const cd = store.getLiveCountdown(Date.now())
  if (!cd) return
  countdown.value = {
    days: String(cd.days).padStart(2, '0'),
    hours: String(cd.hours).padStart(2, '0'),
    minutes: String(cd.minutes).padStart(2, '0'),
    seconds: String(cd.seconds).padStart(2, '0'),
    isToday: cd.isToday
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

function openCalendar() {
  const date = store.weddingDate
  const time = store.weddingTime || '12:00'
  const venue = store.venues?.venues?.[0]
  if (!date) {
    uni.showToast({ title: '暂无婚礼日期信息', icon: 'none' })
    return
  }

  const [h, m] = time.split(':')
  const startTime = Math.floor(new Date(`${date}T${time}`).getTime() / 1000)
  const endTime = startTime + 4 * 3600 // 默认婚礼持续4小时

  if (typeof wx !== 'undefined' && wx.addPhoneCalendar) {
    wx.addPhoneCalendar({
      title: `${groomName.value} & ${brideName.value} 的婚礼`,
      startTime,
      endTime,
      location: venue?.name || store.venueName || '',
      description: `诚挚邀请您参加${groomName.value} & ${brideName.value}的婚礼，期待您的到来。`,
      success: () => {
        uni.showToast({ title: '已添加到日历', icon: 'success' })
      },
      fail: (err) => {
        if (err.errMsg?.includes('auth deny')) {
          uni.showModal({
            title: '需要授权',
            content: '请允许添加到日历权限',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) uni.openSetting()
            }
          })
        } else {
          uni.showToast({ title: '添加失败，请手动添加', icon: 'none' })
        }
      }
    })
  } else {
    uni.showToast({ title: '请手动添加到日历', icon: 'none' })
  }
}

function getSharePath() {
  return userStore.weddingId
    ? `/pages/index/index?id=${userStore.weddingId}`
    : '/pages/index/index'
}

function trackShare() {
  if (userStore.weddingId) {
    recordShare(userStore.weddingId).catch(() => {})
  }
}

onShareAppMessage(() => {
  trackShare()
  const title = store.wedding?.share_config?.title || `${groomName.value} & ${brideName.value} 的婚礼邀请`
  return {
    title,
    path: getSharePath(),
    imageUrl: coverImage.value
  }
})

onShareTimeline(() => {
  trackShare()
  const title = store.wedding?.share_config?.title || `${groomName.value} & ${brideName.value} 的婚礼邀请`
  return {
    title,
    query: userStore.weddingId ? `id=${userStore.weddingId}` : '',
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
      // 异步记录浏览量，不阻塞渲染
      recordView(weddingId).catch(() => {})
    } catch (err) {
      if (err?.message === '婚礼不存在') {
        userStore.setWeddingId('')
      }
      console.warn('加载婚礼数据失败，已使用本地默认数据:', err)
      uni.showToast({
        title: err?.message === '婚礼不存在' ? '婚礼链接已失效，请重新进入' : '加载数据失败，请检查网络',
        icon: 'none',
        duration: 3000
      })
    }
  }
})

onShow(() => { updateCountdown() })

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  if (audioCtx) {
    audioCtx.stop()
    audioCtx = null
  }
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
  height: 88vh;
  min-height: 1100rpx;
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
    rgba(0,0,0,0.25) 0%,
    rgba(0,0,0,0.05) 25%,
    rgba(0,0,0,0.15) 60%,
    rgba(255,255,255,0.95) 90%,
    rgba(255,255,255,1) 100%
  );
}
.xi-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 600rpx;
  font-weight: 900;
  color: rgba(255,255,255,0.04);
  pointer-events: none;
  z-index: 1;
}
.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  padding: 60rpx 48rpx 100rpx;
  text-align: center;
}

.hero-tag {
  font-size: 22rpx;
  color: rgba(255,255,255,0.65);
  letter-spacing: 8rpx;
  font-weight: 300;
  margin-bottom: 20rpx;
}
.hero-divider {
  width: 40rpx;
  height: 1rpx;
  background: rgba(255,255,255,0.5);
  margin-bottom: 32rpx;
}

.hero-names {
  font-size: 72rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 6rpx;
  margin-bottom: 12rpx;
  text-shadow: 0 4rpx 24rpx rgba(0,0,0,0.3);
  line-height: 1.2;
}
.hero-sub {
  font-size: 24rpx;
  color: rgba(255,255,255,0.7);
  letter-spacing: 4rpx;
  font-weight: 300;
  margin-bottom: 20rpx;
  font-style: italic;
}
.hero-date {
  font-size: 28rpx;
  color: rgba(255,255,255,0.95);
  letter-spacing: 6rpx;
  margin-bottom: 48rpx;
  text-shadow: 0 2rpx 12rpx rgba(0,0,0,0.25);
}

.hero-countdown {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 80rpx;
}
.countdown-num {
  font-size: 120rpx;
  font-weight: 400;
  color: #fff;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 4rpx 24rpx rgba(0,0,0,0.35), 0 1rpx 2rpx rgba(0,0,0,0.2);
  line-height: 1;
}
.countdown-divider {
  width: 1rpx;
  height: 80rpx;
  background: rgba(255,255,255,0.4);
}
.countdown-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8rpx;
}
.countdown-label {
  font-size: 28rpx;
  color: rgba(255,255,255,0.75);
  letter-spacing: 6rpx;
  font-weight: 400;
}
.countdown-desc {
  font-size: 26rpx;
  color: rgba(255,255,255,0.92);
  letter-spacing: 2rpx;
}

/* 婚礼当天 */
.hero-today {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 80rpx;
}
.today-label {
  font-size: 72rpx;
  font-weight: 400;
  color: #fff;
  letter-spacing: 12rpx;
  text-shadow: 0 4rpx 24rpx rgba(0,0,0,0.35), 0 1rpx 2rpx rgba(0,0,0,0.2);
  line-height: 1;
}
.today-desc {
  font-size: 32rpx;
  color: rgba(255,255,255,0.95);
  letter-spacing: 16rpx;
  text-shadow: 0 2rpx 12rpx rgba(0,0,0,0.25);
}

/* 滚动提示 */
.scroll-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.scroll-line {
  width: 1rpx;
  height: 60rpx;
  background: linear-gradient(to bottom, rgba(255,255,255,0.5), transparent);
  margin-bottom: 16rpx;
  animation: float 2s ease-in-out infinite;
}
.scroll-text {
  font-size: 20rpx;
  color: rgba(255,255,255,0.4);
  letter-spacing: 4rpx;
}

/* ========== 通用 section ========== */
.section {
  padding: 80rpx 48rpx;
}

/* ========== 婚书正文 ========== */
.invitation-section {
  text-align: center;
  position: relative;
  padding-top: 100rpx;
  padding-bottom: 100rpx;
}
.quote-top {
  margin-bottom: 24rpx;
}
.quote-bottom {
  margin-top: 24rpx;
  transform: rotate(180deg);
}
.quote-mark {
  font-size: 80rpx;
  line-height: 1;
  color: $border-color;
  font-family: Georgia, serif;
}
.invitation-body {
  max-width: 560rpx;
  margin: 0 auto;
}
.invitation-text {
  font-size: 32rpx;
  line-height: 2.2;
  color: $text-primary;
  letter-spacing: 4rpx;
  font-weight: 400;
}
.invitation-couple {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48rpx;
  margin-top: 64rpx;
}
.couple-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.couple-label {
  font-size: 18rpx;
  color: $text-muted;
  letter-spacing: 4rpx;
}
.couple-name {
  font-size: 36rpx;
  font-weight: 600;
  letter-spacing: 8rpx;
  color: $text-primary;
}
.couple-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.couple-line {
  width: 1rpx;
  height: 20rpx;
  background: $border-color;
}
.couple-heart {
  width: 10rpx;
  height: 10rpx;
  background: $color-primary;
  transform: rotate(45deg);
  position: relative;
}
.couple-heart::before,
.couple-heart::after {
  content: '';
  position: absolute;
  width: 10rpx;
  height: 10rpx;
  background: $color-primary;
  border-radius: 50%;
}
.couple-heart::before { left: -5rpx; top: 0; }
.couple-heart::after { left: 0; top: -5rpx; }

/* ========== 婚礼信息 ========== */
.info-section {
  background: $bg-muted;
  padding-top: 80rpx;
  padding-bottom: 80rpx;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  margin-bottom: 48rpx;
}
.header-line {
  flex: 1;
  max-width: 80rpx;
  height: 1rpx;
  background: $border-color;
}
.header-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.info-title {
  font-size: 36rpx;
  font-weight: 600;
  color: $text-primary;
  letter-spacing: 4rpx;
}
.info-sub {
  font-size: 20rpx;
  color: $text-muted;
  letter-spacing: 6rpx;
}

.info-list {
  background: $bg-surface;
  border-radius: $radius-lg;
  overflow: hidden;
}
.info-row {
  display: flex;
  align-items: center;
  padding: 36rpx 32rpx;
  transition: background 0.15s ease;
}
.info-row:active {
  background: $bg-muted;
}
.info-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: $bg-muted;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;
}
.info-icon {
  font-size: 32rpx;
}
.info-meta {
  flex: 1;
}
.info-label {
  display: block;
  font-size: 20rpx;
  color: $text-muted;
  margin-bottom: 6rpx;
  letter-spacing: 3rpx;
}
.info-value {
  display: block;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
}
.info-address {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 4rpx;
}
.info-action {
  font-size: 32rpx;
  color: $text-muted;
  padding: 16rpx;
}
.info-divider {
  height: 1rpx;
  background: $border-color;
  margin: 0 32rpx;
}

/* ========== 快速入口 ========== */
.quick-section {
  padding-top: 80rpx;
}
.quick-title {
  font-size: 36rpx;
  font-weight: 600;
  color: $text-primary;
  letter-spacing: 4rpx;
}
.quick-sub {
  font-size: 20rpx;
  color: $text-muted;
  letter-spacing: 6rpx;
}
.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-top: 8rpx;
}
.quick-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 32rpx 24rpx;
  background: $bg-surface;
  border-radius: $radius-lg;
  border: 1rpx solid $border-color;
  transition: all 0.25s ease;
}
.quick-item:active {
  background: $bg-muted;
  transform: scale(0.98);
}
.quick-icon {
  font-size: 40rpx;
  flex-shrink: 0;
}
.quick-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.quick-label {
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
  white-space: nowrap;
}
.quick-en {
  font-size: 18rpx;
  color: $text-muted;
  letter-spacing: 2rpx;
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
.footer-line {
  width: 40rpx;
  height: 1rpx;
  background: $border-color;
  margin: 0 auto 32rpx;
}
.footer-text {
  display: block;
  font-size: 28rpx;
  color: $text-primary;
  letter-spacing: 8rpx;
  margin-bottom: 12rpx;
  font-weight: 500;
}
.footer-sub {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 3rpx;
  font-weight: 300;
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
  transition: all 0.2s ease;
}
.float-btn::after { border: none; }
.float-btn:active { transform: scale(0.96); opacity: 0.85; }
.float-btn.rsvp {
  flex: 1;
  min-width: 0;
  background: $text-primary;
  color: #fff;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.15);
}
.float-btn.share {
  width: 88rpx;
  background: $bg-surface;
  color: $text-primary;
  border: 1rpx solid $border-color;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.share-icon {
  font-size: 28rpx;
}

/* 背景音乐控制 */
.music-control {
  position: fixed;
  top: calc(80rpx + env(safe-area-inset-top));
  right: 32rpx;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.9);
  border: 1rpx solid $border-color;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
  transition: all 0.2s ease;
}
.music-control:active { transform: scale(0.92); }
.music-icon {
  width: 46rpx;
  height: 46rpx;
  transition: transform 0.3s ease;
}
.music-icon.playing {
  animation: musicPulse 2.4s ease-in-out infinite;
}
@keyframes musicPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
</style>
