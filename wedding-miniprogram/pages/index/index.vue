<template>
  <view class="page" :class="templateClass" @touchstart="onPageTap">
    <!-- 封面大图 -->
    <view class="hero">
      <image
        class="hero-image"
        :class="{ default: isDefaultCover }"
        :src="coverImage"
        :mode="coverImageMode"
      />
      <view class="hero-gradient" />
      <text class="xi-watermark">囍</text>
      <view class="hero-content">
        <text class="hero-tag animate-fade-in delay-2">{{ activeTemplate.kicker }}</text>
        <view class="hero-divider animate-draw-line delay-3" />
        <text class="hero-names animate-fade-up delay-4">{{ groomName }} & {{ brideName }}</text>
        <text class="hero-sub animate-fade-up delay-5">We're getting married</text>
        <text class="hero-date animate-fade-up delay-6">{{ formatDate(weddingDate) }}</text>
        <view class="hero-meta-line animate-fade-up delay-7">
          <text>{{ weddingTime || '12:00' }}</text>
          <view class="hero-meta-dot" />
          <text>{{ venueName || '婚礼场地' }}</text>
        </view>
        <view class="hero-countdown animate-fade-up delay-8" v-if="showCountdown && countdown && !countdown.isToday">
          <text class="countdown-num">{{ countdown.days }}</text>
          <view class="countdown-divider" />
          <view class="countdown-info">
            <text class="countdown-label">DAYS</text>
            <text class="countdown-desc">距离我们结婚</text>
          </view>
        </view>
        <view class="hero-today animate-fade-up delay-8" v-if="showCountdown && countdown?.isToday">
          <text class="today-label">TODAY</text>
          <text class="today-desc">就是今天</text>
        </view>
        <view class="scroll-hint animate-fade-in delay-10">
          <view class="scroll-line" />
          <text class="scroll-text">滑动探索</text>
        </view>
      </view>
    </view>

    <!-- 婚礼当天行动台 -->
    <view class="section daypack-section">
      <view class="daypack-head">
        <view>
          <text class="daypack-kicker">{{ countdown?.isToday ? 'TODAY PACK' : 'GUEST PACK' }}</text>
          <text class="daypack-title">{{ countdown?.isToday ? '婚礼当天助手' : '宾客行动台' }}</text>
          <text class="daypack-template">{{ activeTemplate.shortName }} · {{ activeTemplate.albumMood }}</text>
        </view>
        <view class="daypack-status" v-if="isRsvpEnabled" :class="{ done: hasSubmittedRsvp }" @click="goToRSVP">
          <text>{{ hasSubmittedRsvp ? '已回执' : '待回执' }}</text>
        </view>
      </view>
      <view class="daypack-card primary" @click="goToGuide">
        <view class="daypack-card-main">
          <text class="daypack-label">主场地</text>
          <text class="daypack-value">{{ primaryVenue.name }}</text>
          <text class="daypack-sub">{{ primaryVenue.address || venueAddress || '主人正在补充详细地址' }}</text>
        </view>
        <button class="daypack-action" @click.stop="openNavigation">导航</button>
      </view>
      <view class="daypack-grid">
        <view class="daypack-mini" v-if="isTimelineEnabled" @click="goToTimeline">
          <text class="mini-label">最近流程</text>
          <text class="mini-value">{{ nextEventText }}</text>
        </view>
        <view class="daypack-mini" @click="openCalendar">
          <text class="mini-label">婚礼时间</text>
          <text class="mini-value">{{ weddingTime || '12:00' }}</text>
        </view>
      </view>
      <view class="daypack-actions">
        <button class="daypack-pill primary" v-if="isRsvpEnabled" @click="goToRSVP">{{ hasSubmittedRsvp ? '修改回执' : '确认出席' }}</button>
        <button class="daypack-pill" v-if="isBlessingEnabled" @click="goToBlessing">写祝福</button>
        <button class="daypack-pill primary" v-if="!isRsvpEnabled && !isBlessingEnabled" @click="goToGuide">查看路线</button>
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
            <image class="visual-icon info-icon" src="/static/visuals/icon-date.svg" mode="aspectFit" />
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
            <image class="visual-icon info-icon" src="/static/visuals/icon-time.svg" mode="aspectFit" />
          </view>
          <view class="info-meta">
            <text class="info-label">时间 TIME</text>
            <text class="info-value">{{ weddingTime || '12:00' }}</text>
          </view>
        </view>
        <view class="info-divider" />
        <view class="info-row" @click="openNavigation">
          <view class="info-icon-wrap">
            <image class="visual-icon info-icon" src="/static/visuals/icon-location.svg" mode="aspectFit" />
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
          <text class="quick-title">接下来做什么</text>
          <text class="quick-sub">NEXT STEPS</text>
        </view>
        <view class="header-line" />
      </view>
      <view class="quick-grid">
        <view class="quick-item stagger-1" @click="goToAlbum">
          <image class="visual-icon quick-icon" src="/static/visuals/icon-album.svg" mode="aspectFit" />
          <view class="quick-meta">
            <text class="quick-label">婚纱相册</text>
            <text class="quick-en">ALBUM</text>
          </view>
          <text class="quick-arrow">›</text>
        </view>
        <view class="quick-item stagger-2" @click="goToGuide">
          <image class="visual-icon quick-icon" src="/static/visuals/icon-guide.svg" mode="aspectFit" />
          <view class="quick-meta">
            <text class="quick-label">婚礼路书</text>
            <text class="quick-en">GUIDE</text>
          </view>
          <text class="quick-arrow">›</text>
        </view>
        <view class="quick-item stagger-3" v-if="isTimelineEnabled" @click="goToTimeline">
          <image class="visual-icon quick-icon" src="/static/visuals/icon-timeline.svg" mode="aspectFit" />
          <view class="quick-meta">
            <text class="quick-label">婚礼流程</text>
            <text class="quick-en">TIMELINE</text>
          </view>
          <text class="quick-arrow">›</text>
        </view>
        <view class="quick-item stagger-4" v-if="isBlessingEnabled" @click="goToBlessing">
          <image class="visual-icon quick-icon" src="/static/visuals/icon-blessing.svg" mode="aspectFit" />
          <view class="quick-meta">
            <text class="quick-label">祝福留言</text>
            <text class="quick-en">BLESSING</text>
          </view>
          <text class="quick-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 精选预览 -->
    <view class="section preview-section">
      <view class="preview-block" v-if="featuredPhotos.length > 0" @click="goToAlbum">
        <view class="preview-header">
          <view>
            <text class="preview-title">{{ activeTemplate.albumMood }}</text>
            <text class="preview-sub">{{ activeTemplate.photoMood }}</text>
          </view>
          <text class="preview-more">查看全部</text>
        </view>
        <view class="photo-strip">
          <image
            class="photo-thumb"
            v-for="photo in featuredPhotos"
            :key="photo.id || photo.url"
            :src="photo.url"
            mode="aspectFill"
          />
        </view>
      </view>
      <view class="preview-block" v-if="isBlessingEnabled && latestBlessings.length > 0" @click="goToBlessing">
        <view class="preview-header">
          <text class="preview-title">最近祝福</text>
          <text class="preview-more">去祝福墙</text>
        </view>
        <view class="blessing-preview" v-for="item in latestBlessings" :key="item.id">
          <text class="blessing-name">{{ item.sender?.name || '宾客' }}</text>
          <text class="blessing-text">{{ item.content }}</text>
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
      <button class="float-btn rsvp" v-if="isRsvpEnabled" @click="goToRSVP">确认出席</button>
      <button class="float-btn share" open-type="share">
        <text class="share-icon">↗</text>
      </button>
    </view>

    <!-- 背景音乐控制 -->
    <view class="music-control" v-if="bgMusicEnabled" @click="toggleMusic">
      <image
        class="music-icon"
        :class="{ playing: isMusicPlaying }"
        :src="isMusicPlaying ? '/static/visuals/icon-speaker.svg' : '/static/visuals/icon-music.svg'"
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
    audioCtx = null
    console.warn('背景音乐播放失败')
  })
}

function toggleMusic() {
  if (!audioCtx) {
    initMusic()
    musicStarted.value = true
  }
  if (!audioCtx) return
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
const isDefaultCover = computed(() => coverImage.value === '/static/visuals/default-cover.png')
const coverImageMode = computed(() => isDefaultCover.value ? 'aspectFit' : 'aspectFill')

const groomName = computed(() => store.invitation?.couple?.groom?.name || '新郎')
const brideName = computed(() => store.invitation?.couple?.bride?.name || '新娘')
const weddingDate = computed(() => store.weddingDate)
const weddingTime = computed(() => store.weddingTime)
const venueName = computed(() => store.venueName)
const venueAddress = computed(() => store.invitation?.wedding?.venue_address || '')
const activeTemplate = computed(() => store.activeTemplate)
const templateClass = computed(() => store.templateClass)
const showCountdown = computed(() => store.showCountdown)
const isRsvpEnabled = computed(() => store.isRsvpEnabled)
const isBlessingEnabled = computed(() => store.isBlessingEnabled)
const isTimelineEnabled = computed(() => store.isTimelineEnabled)
const primaryVenue = computed(() => store.primaryVenue || { name: venueName.value || '婚礼场地', address: venueAddress.value })
const latestBlessings = computed(() => store.latestBlessings || [])
const featuredPhotos = computed(() => store.featuredPhotos || [])
const hasSubmittedRsvp = computed(() => {
  if (!isRsvpEnabled.value) return false
  const list = store.guests?.guests || []
  return list.some(item => {
    if (userStore.openid && item.openid === userStore.openid) return true
    return item.rsvp_status && item.rsvp_status !== 'pending'
  })
})
const nextEventText = computed(() => {
  const event = store.nextTimelineEvent
  if (!event) return '待公布'
  return event.time ? `${event.time} ${event.title}` : event.title
})
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
function goToTimeline() {
  if (!isTimelineEnabled.value) {
    uni.showToast({ title: '新人暂未开放婚礼流程', icon: 'none' })
    return
  }
  uni.switchTab({ url: '/pages/timeline/index' })
}
function goToRSVP() {
  if (!isRsvpEnabled.value) {
    uni.showToast({ title: '新人暂未开放在线回执', icon: 'none' })
    return
  }
  uni.navigateTo({ url: '/pages/rsvp/index' })
}
function goToBlessing() {
  if (!isBlessingEnabled.value) {
    uni.showToast({ title: '新人暂未开放祝福墙', icon: 'none' })
    return
  }
  uni.navigateTo({ url: '/pages/blessing/index' })
}

function openNavigation() {
  const venueList = store.venues?.venues || []
  const venue = venueList.find(v => v.type === 'venue' || v.type === 'home') || venueList[0]
  if (venue?.coordinate?.latitude && venue?.coordinate?.longitude) {
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

function parseWeddingIdFromOptions(options = {}) {
  if (options.id) return options.id
  if (options.weddingId) return options.weddingId
  const rawScene = options.scene ? decodeURIComponent(options.scene) : ''
  if (!rawScene) return ''
  if (!rawScene.includes('=')) return rawScene
  const pairs = rawScene.split('&').map(item => item.split('='))
  const idPair = pairs.find(([key]) => key === 'id' || key === 'weddingId')
  return idPair?.[1] || ''
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
  const weddingId = parseWeddingIdFromOptions(options) || userStore.weddingId
  if (weddingId) {
    userStore.setWeddingId(weddingId)
    try {
      await fetchWedding(weddingId)
      updateCountdown()
      startCountdownTimer()
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

function startCountdownTimer() {
  if (countdownTimer) clearInterval(countdownTimer)
  const cd = store.getLiveCountdown(Date.now())
  const interval = cd && cd.days > 0 ? 60000 : 1000
  countdownTimer = setInterval(() => {
    updateCountdown()
    const newCd = store.getLiveCountdown(Date.now())
    const newInterval = newCd && newCd.days > 0 ? 60000 : 1000
    if (newInterval !== interval) {
      startCountdownTimer()
    }
  }, interval)
}

onShow(async () => {
  updateCountdown()
  const weddingId = userStore.weddingId
  if (weddingId && !store.wedding?._id && !store.wedding?.wedding_id) {
    try {
      await fetchWedding(weddingId)
      updateCountdown()
      startCountdownTimer()
    } catch (err) {
      console.warn('首页 onShow 刷新数据失败:', err)
    }
  }
})

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
  padding-bottom: calc(260rpx + env(safe-area-inset-bottom));
}

/* ========== 封面大图 ========== */
.hero {
  position: relative;
  height: 86vh;
  min-height: 1040rpx;
  overflow: hidden;
}
.hero-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fcf6f0;
}
.hero-image.default {
  padding: 0;
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
  padding: 60rpx $page-gutter 96rpx;
  text-align: center;
}

.hero-tag {
  font-size: 22rpx;
  color: rgba(255,255,255,0.65);
  letter-spacing: 0;
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
  display: block;
  width: 100%;
  max-width: 560rpx;
  font-size: 56rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0;
  margin-bottom: 12rpx;
  text-shadow: 0 4rpx 24rpx rgba(0,0,0,0.3);
  line-height: 1.2;
  white-space: normal;
  overflow-wrap: anywhere;
}
.hero-sub {
  font-size: 24rpx;
  color: rgba(255,255,255,0.7);
  letter-spacing: 0;
  font-weight: 300;
  margin-bottom: 20rpx;
  font-style: italic;
}
.hero-date {
  font-size: 28rpx;
  color: rgba(255,255,255,0.95);
  letter-spacing: 0;
  margin-bottom: 18rpx;
  text-shadow: 0 2rpx 12rpx rgba(0,0,0,0.25);
}
.hero-meta-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  min-height: 48rpx;
  margin-bottom: 42rpx;
  padding: 0 22rpx;
  border-radius: $radius-full;
  border: 1rpx solid rgba(255,255,255,0.26);
  color: rgba(255,255,255,0.86);
  font-size: 22rpx;
  letter-spacing: 0;
  background: rgba(20,20,20,0.18);
  backdrop-filter: blur(12rpx);
  max-width: 100%;
}
.hero-meta-line text {
  max-width: 280rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.hero-meta-dot {
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.58);
  flex-shrink: 0;
}

.hero-countdown {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  margin-bottom: 80rpx;
  width: 100%;
  max-width: 560rpx;
}
.countdown-num {
  font-size: 112rpx;
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
  min-width: 0;
  max-width: 220rpx;
}
.countdown-label {
  font-size: 26rpx;
  color: rgba(255,255,255,0.75);
  letter-spacing: 0;
  font-weight: 400;
}
.countdown-desc {
  font-size: 24rpx;
  color: rgba(255,255,255,0.92);
  letter-spacing: 0;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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
  letter-spacing: 0;
  text-shadow: 0 4rpx 24rpx rgba(0,0,0,0.35), 0 1rpx 2rpx rgba(0,0,0,0.2);
  line-height: 1;
}
.today-desc {
  font-size: 32rpx;
  color: rgba(255,255,255,0.95);
  letter-spacing: 0;
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
  letter-spacing: 0;
}

/* ========== 通用 section ========== */
.section {
  padding: 80rpx $page-gutter;
}

/* ========== 宾客行动台 ========== */
.daypack-section {
  padding-top: 52rpx;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}
.daypack-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 28rpx;
}
.daypack-kicker {
  display: block;
  font-size: 20rpx;
  color: $color-primary;
  letter-spacing: 0;
  margin-bottom: 8rpx;
  font-weight: 600;
}
.daypack-title {
  display: block;
  font-size: 40rpx;
  color: $text-primary;
  font-weight: 600;
}
.daypack-template {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 0;
}
.daypack-status {
  padding: 10rpx 20rpx;
  border-radius: $radius-full;
  background: rgba(176,58,91,0.08);
  color: $color-primary;
  font-size: 24rpx;
  flex-shrink: 0;
}
.daypack-status.done {
  background: rgba(52,168,83,0.1);
  color: $color-success;
}
.daypack-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 32rpx;
  border-radius: $card-radius;
  border: 1rpx solid $border-color;
  margin-bottom: 16rpx;
}
.daypack-card.primary {
  background: $text-primary;
}
.daypack-card-main {
  flex: 1;
  min-width: 0;
}
.daypack-label {
  display: block;
  font-size: 22rpx;
  color: rgba(255,255,255,0.52);
  margin-bottom: 8rpx;
}
.daypack-value {
  display: block;
  font-size: 34rpx;
  color: #fff;
  font-weight: 600;
  margin-bottom: 8rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.daypack-sub {
  display: block;
  font-size: 24rpx;
  color: rgba(255,255,255,0.7);
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.daypack-action {
  width: 116rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: #fff;
  color: $text-primary;
  font-size: 26rpx;
  padding: 0;
  flex-shrink: 0;
}
.daypack-action::after { border: none; }
.daypack-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.daypack-mini {
  padding: 28rpx;
  background: $bg-muted;
  border-radius: $card-radius;
  min-height: 132rpx;
}
.mini-label {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  margin-bottom: 10rpx;
}
.mini-value {
  display: block;
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 600;
  line-height: 1.35;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.daypack-actions {
  display: flex;
  gap: 16rpx;
}
.daypack-pill {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-primary;
  font-size: 28rpx;
}
.daypack-pill.primary {
  background: $color-primary;
  color: #fff;
}
.daypack-pill::after { border: none; }

.preview-section {
  padding-top: 32rpx;
  padding-bottom: 32rpx;
  background: $bg-muted;
}
.preview-block {
  background: $bg-surface;
  border-radius: $card-radius;
  padding: 28rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid $border-color;
}
.preview-block:last-child {
  margin-bottom: 0;
}
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22rpx;
}
.preview-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: $text-primary;
}
.preview-sub {
  display: block;
  max-width: 470rpx;
  margin-top: 6rpx;
  font-size: 22rpx;
  line-height: 1.45;
  color: $text-muted;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.preview-more {
  font-size: 24rpx;
  color: $color-primary;
}
.photo-strip {
  display: flex;
  gap: 12rpx;
}
.photo-thumb {
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 168rpx;
  border-radius: $radius-md;
  background: $bg-muted;
  display: block;
  overflow: hidden;
}
.blessing-preview {
  padding: 20rpx 0;
  border-top: 1rpx solid $border-color;
}
.blessing-preview:first-of-type {
  border-top: none;
  padding-top: 0;
}
.blessing-name {
  display: block;
  font-size: 24rpx;
  color: $text-muted;
  margin-bottom: 8rpx;
}
.blessing-text {
  display: block;
  font-size: 28rpx;
  color: $text-primary;
  line-height: 1.6;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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
  letter-spacing: 0;
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
  letter-spacing: 0;
}
.couple-name {
  font-size: 36rpx;
  font-weight: 600;
  letter-spacing: 0;
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
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
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
  letter-spacing: 0;
}
.info-sub {
  font-size: 20rpx;
  color: $text-muted;
  letter-spacing: 0;
}

.info-list {
  background: $bg-surface;
  border-radius: $card-radius;
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
  height: $control-height-sm;
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
  min-width: 0;
}
.info-label {
  display: block;
  font-size: 20rpx;
  color: $text-muted;
  margin-bottom: 6rpx;
  letter-spacing: 0;
}
.info-value {
  display: block;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.info-address {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 4rpx;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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
  letter-spacing: 0;
}
.quick-sub {
  font-size: 20rpx;
  color: $text-muted;
  letter-spacing: 0;
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
  border-radius: $card-radius;
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
  display: block;
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.quick-en {
  font-size: 18rpx;
  color: $text-muted;
  letter-spacing: 0;
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
  letter-spacing: 0;
  margin-bottom: 12rpx;
  font-weight: 500;
}
.footer-sub {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 0;
  font-weight: 300;
}

/* ========== 悬浮操作 ========== */
.float-actions {
  position: fixed;
  bottom: calc(128rpx + constant(safe-area-inset-bottom));
  bottom: calc(128rpx + env(safe-area-inset-bottom));
  left: $page-gutter;
  right: $page-gutter;
  display: flex;
  gap: 16rpx;
  z-index: 100;
}
.float-btn {
  height: $control-height;
  line-height: $control-height;
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
  box-shadow: $shadow-sm;
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
  width: $tap-min-height;
  height: $tap-min-height;
  border-radius: 50%;
  background: rgba(255,255,255,0.9);
  border: 1rpx solid $border-color;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  box-shadow: $shadow-xs;
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

/* ========== 内置模板氛围 ========== */
.tpl-rose {
  .hero-gradient {
    background:
      radial-gradient(circle at 50% 34%, rgba(176,58,91,0.08), transparent 42%),
      linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.05) 28%, rgba(24,8,12,0.68) 72%, rgba(255,255,255,0.98) 94%, #fff 100%);
  }
  .hero-divider,
  .daypack-pill.primary,
  .couple-heart,
  .couple-heart::before,
  .couple-heart::after {
    background: $color-primary;
  }
  .hero-tag,
  .daypack-kicker,
  .preview-more {
    color: $color-gold;
  }
}

.tpl-champagne {
  background: #fbf7f1;
  .hero-image.default {
    background: #f7eee4;
  }
  .hero-gradient {
    background: linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.12) 38%, rgba(247,238,228,0.84) 82%, #fbf7f1 100%);
  }
  .hero-content,
  .hero-names,
  .hero-date,
  .countdown-num {
    color: #1a1a1a;
    text-shadow: none;
  }
  .hero-sub,
  .hero-tag,
  .countdown-label,
  .countdown-desc,
  .today-label,
  .today-desc {
    color: rgba(26,26,26,0.62);
  }
  .hero-divider,
  .countdown-divider,
  .scroll-line {
    background: rgba(164,120,59,0.42);
  }
  .hero-meta-line {
    color: #7c5725;
    background: rgba(255,255,255,0.6);
    border-color: rgba(164,120,59,0.22);
  }
  .daypack-section,
  .info-section,
  .preview-section {
    background: #f7eee4;
  }
  .daypack-pill.primary,
  .float-btn.rsvp {
    background: #A4783B;
  }
}

.tpl-noir {
  background: #111;
  .hero-gradient {
    background:
      radial-gradient(circle at 50% 18%, rgba(201,169,110,0.20), transparent 35%),
      linear-gradient(to bottom, rgba(0,0,0,0.10), rgba(0,0,0,0.35) 34%, rgba(3,3,3,0.92) 88%, #111 100%);
  }
  .section,
  .preview-section,
  .info-section {
    background: #111;
  }
  .daypack-section,
  .preview-block,
  .info-list,
  .quick-item,
  .invitation-section {
    background: #191919;
    border-color: rgba(201,169,110,0.16);
  }
  .daypack-title,
  .mini-value,
  .preview-title,
  .blessing-text,
  .invitation-text,
  .couple-name,
  .info-title,
  .info-value,
  .quick-title,
  .quick-label,
  .footer-text {
    color: #fff;
  }
  .daypack-pill.primary,
  .float-btn.rsvp {
    background: $color-gold;
    color: #111;
  }
}

.tpl-garden {
  background: #f5f6ef;
  .hero-image.default {
    background: #eef2e7;
  }
  .hero-gradient {
    background: linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(255,255,255,0.08) 40%, rgba(38,55,42,0.54) 76%, #f5f6ef 100%);
  }
  .hero-tag,
  .daypack-kicker,
  .preview-more {
    color: #6F7E5D;
  }
  .daypack-section,
  .info-section,
  .preview-section {
    background: #eef2e7;
  }
  .daypack-pill.primary,
  .float-btn.rsvp {
    background: #506247;
  }
  .photo-thumb {
    border-radius: 8rpx;
  }
}
</style>
