<template>
  <view class="page lux-home" :class="templateClass" @touchstart="onPageTap">
    <view class="lux-hero-stage">
      <image
        class="lux-hero-image"
        :class="[{ default: isDefaultCover }, heroPhotoTreatmentClass]"
        :src="coverImage"
        :mode="coverImageMode"
      />
      <view class="lux-hero-overlay" :class="{ default: isLegacyDefaultCover }" />
      <text class="lux-xi-watermark">囍</text>

      <view class="lux-hero-copy">
        <text class="lux-hero-kicker">THE WEDDING OF</text>
        <view class="lux-hero-names">
          <text>{{ groomName }}</text>
          <text class="lux-hero-amp">&amp;</text>
          <text>{{ brideName }}</text>
        </view>
        <text class="lux-hero-sub" v-if="formattedWeddingDate">{{ formattedWeddingDate }}</text>
      </view>
    </view>

    <view class="lux-invite-section">
      <SectionHeader
        title="卷首语"
        kicker="INVITATION"
        desc="愿这一天，被您和我们一起记住"
      />
      <view class="lux-invite-card">
        <text class="lux-invite-mark">"</text>
        <text class="lux-invite-text">{{ invitationText }}</text>
        <view class="lux-couple-row">
          <view class="lux-couple-side">
            <text class="lux-couple-label">GROOM</text>
            <text class="lux-couple-name">{{ groomName }}</text>
          </view>
          <text class="lux-couple-amp">&amp;</text>
          <view class="lux-couple-side">
            <text class="lux-couple-label">BRIDE</text>
            <text class="lux-couple-name">{{ brideName }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="lux-detail-section" v-if="hasWeddingDetails">
      <SectionHeader
        title="囍事详情"
        kicker="DETAILS"
        desc="时间、地点与赴约提示"
      />
      <view class="lux-detail-card">
        <view class="lux-countdown" v-if="showCountdown && countdown">
          <text class="lux-count-num">{{ countdown.isToday ? 'TODAY' : countdown.days }}</text>
          <view class="lux-count-copy">
            <text class="lux-count-label">{{ countdown.isToday ? '就是今天' : 'DAYS TO GO' }}</text>
            <text class="lux-count-desc">{{ countdownDesc }}</text>
          </view>
        </view>

        <view class="lux-detail-list">
          <view class="lux-detail-row" v-if="formattedWeddingDate">
            <text class="lux-detail-label">DATE</text>
            <text class="lux-detail-value">{{ formattedWeddingDate }}</text>
          </view>
          <view class="lux-detail-row" v-if="weddingTime">
            <text class="lux-detail-label">TIME</text>
            <text class="lux-detail-value num">{{ weddingTime }}</text>
          </view>
          <view class="lux-detail-row venue" v-if="hasVenueInfo" @click="goToGuide">
            <view class="lux-detail-main">
              <text class="lux-detail-label">VENUE</text>
              <text class="lux-venue-name">{{ primaryVenue.name || venueName }}</text>
              <text class="lux-venue-address" v-if="primaryVenue.address || venueAddress">{{ primaryVenue.address || venueAddress }}</text>
            </view>
            <button class="lux-nav-btn" v-if="hasNavigableVenue" @click.stop="openNavigation">导航</button>
          </view>
        </view>
      </view>
    </view>

    <view class="lux-rsvp-section" v-if="isRsvpEnabled">
      <SectionHeader
        title="赴约"
        kicker="RSVP"
        desc="愿在这一日与您相见"
      />
      <view class="lux-rsvp-card">
        <text class="lux-rsvp-copy">{{ hasSubmittedRsvp ? '已收到您的回执，如需调整仍可重新填写。' : '若您愿意赴这一日之约，请为新人留下一份回音。' }}</text>
        <button class="lux-rsvp-btn" @click="goToRSVP">{{ hasSubmittedRsvp ? '修改回执' : '确认出席' }}</button>
      </view>
    </view>

    <view class="lux-footer-section">
      <view class="lux-footer-line" />
      <text class="lux-footer-title">期待与您相见</text>
      <text class="lux-footer-sub">Looking forward to seeing you</text>
    </view>

    <view class="music-control lux-music-control" v-if="bgMusicEnabled" @click="toggleMusic">
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
import { formatDate } from '@/utils/index.js'
import { getTemplateHeroImage } from '@/utils/templates.js'
import SectionHeader from '@/components/ui/SectionHeader.vue'

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
  return cover?.url || photos[0]?.url || getTemplateHeroImage(store.invitation?.template) || '/static/visuals/hero/hero-signature-rose.jpg'
})
const isGeneratedTemplateCover = computed(() => String(coverImage.value || '').startsWith('/static/visuals/hero/'))
const isLegacyDefaultCover = computed(() => coverImage.value === '/static/visuals/default-cover.png')
const isDefaultCover = computed(() => isGeneratedTemplateCover.value || isLegacyDefaultCover.value)
const coverImageMode = computed(() => 'aspectFill')
const photoTreatment = computed(() => store.invitation?.photo_treatment || 'original')

const groomName = computed(() => store.invitation?.couple?.groom?.name || '新郎')
const brideName = computed(() => store.invitation?.couple?.bride?.name || '新娘')
const weddingDate = computed(() => store.weddingDate)
const weddingTime = computed(() => store.weddingTime)
const venueName = computed(() => store.venueName)
const venueAddress = computed(() => store.invitation?.wedding?.venue_address || '')
const templateClass = computed(() => store.templateClass)
const showCountdown = computed(() => store.showCountdown)
const isRsvpEnabled = computed(() => store.isRsvpEnabled)
const primaryVenue = computed(() => store.primaryVenue || { name: venueName.value || '婚礼场地', address: venueAddress.value })
const hasVenueInfo = computed(() => Boolean(primaryVenue.value?.name || primaryVenue.value?.address || venueAddress.value))
const hasNavigableVenue = computed(() => {
  const latitude = Number(primaryVenue.value?.coordinate?.latitude)
  const longitude = Number(primaryVenue.value?.coordinate?.longitude)
  return Number.isFinite(latitude) && Number.isFinite(longitude)
})
const heroPhotoTreatmentClass = computed(() => (isDefaultCover.value ? '' : photoTreatmentClass()))
const formattedWeddingDate = computed(() => formatDate(weddingDate.value))
const countdownDesc = computed(() => {
  if (formattedWeddingDate.value && weddingTime.value) return `${formattedWeddingDate.value} ${weddingTime.value}`
  return formattedWeddingDate.value || weddingTime.value || '婚期将至'
})
const hasWeddingDetails = computed(() => Boolean(formattedWeddingDate.value || weddingTime.value || hasVenueInfo.value || countdown.value))
const hasSubmittedRsvp = computed(() => {
  if (!isRsvpEnabled.value) return false
  const guest = store.currentGuestRsvp
  const status = guest?.rsvp_status || guest?.status || 'pending'
  return status !== 'pending'
})

function photoTreatmentClass(photo = null) {
  const treatment = String(photo?.treatment || photo?.effect || photo?.filter || photoTreatment.value || '').toLowerCase()
  if (['silver', 'silver-bw', 'black-white', 'bw'].includes(treatment)) return 'treatment-silver'
  if (['soft-color', 'light-color', 'tint'].includes(treatment)) return 'treatment-tint'
  return ''
}
const invitationText = computed(() => {
  return store.invitation?.content?.main_text || '盼与您共赴这一日的约。'
})

function formatWeddingYear(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return String(d.getFullYear())
}

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

function routeFail(label, err) {
  console.warn(`${label}失败:`, err)
  uni.showToast({ title: `${label}失败，请稍后重试`, icon: 'none' })
}

function switchTabOrToast(url, label) {
  uni.switchTab({
    url,
    fail: (err) => routeFail(label, err)
  })
}

function navigateOrToast(url, label) {
  uni.navigateTo({
    url,
    fail: (err) => routeFail(label, err)
  })
}

function goToGuide() { switchTabOrToast('/pages/guide/index', '打开路书') }
function goToRSVP() {
  if (!isRsvpEnabled.value) {
    uni.showToast({ title: '回执这一页暂未启封', icon: 'none' })
    return
  }
  navigateOrToast('/pages/rsvp/index', '打开回执')
}

function openNavigation() {
  const venueList = store.venues?.venues || []
  const venue = venueList.find(v => v.type === 'venue' || v.type === 'home') || venueList[0]
  if (venue?.coordinate?.latitude && venue?.coordinate?.longitude) {
    const latitude = Number(venue.coordinate.latitude)
    const longitude = Number(venue.coordinate.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      uni.showToast({ title: '地图坐标格式有误', icon: 'none' })
      return
    }
    uni.openLocation({
      latitude,
      longitude,
      name: venue.name,
      address: venue.address,
      fail: (err) => {
        console.warn('首页打开导航失败:', err)
        uni.showToast({ title: '打开导航失败', icon: 'none' })
      }
    })
  } else {
    uni.showToast({ title: '路线尚未落笔', icon: 'none' })
  }
}

function getSharePath() {
  return userStore.weddingId
    ? `/pages/index/index?id=${encodeURIComponent(userStore.weddingId)}`
    : '/pages/index/index'
}

function parseWeddingIdFromOptions(options = {}) {
  if (options.id) return decodeSceneValue(options.id)
  if (options.weddingId) return decodeSceneValue(options.weddingId)
  const rawScene = options.scene ? decodeSceneValue(options.scene) : ''
  if (!rawScene) return ''
  if (!rawScene.includes('=')) return rawScene
  const pairs = rawScene.split('&').map(item => item.split('='))
  const idPair = pairs.find(([key]) => key === 'id' || key === 'weddingId')
  return idPair?.[1] ? decodeSceneValue(idPair[1]) : ''
}

function decodeSceneValue(value) {
  try {
    return decodeURIComponent(value)
  } catch (err) {
    return value
  }
}

function trackShare() {
  if (userStore.weddingId) {
    recordShare(userStore.weddingId).catch((err) => {
      console.warn('首页分享记录失败:', err)
    })
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
    query: userStore.weddingId ? `id=${encodeURIComponent(userStore.weddingId)}` : '',
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
      recordView(weddingId).catch((err) => {
        console.warn('访问记录失败:', err)
      })
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
  background-color: var(--theme-page, $bg-color);
  color: var(--theme-ink, $text-primary);
  min-height: 100vh;
  padding-bottom: calc(96rpx + env(safe-area-inset-bottom));
}

/* ========== 信笺首页 v2 ========== */
.lux-home {
  min-height: 100vh;
  background: var(--theme-page, $paper-bg);
  color: var(--theme-ink, $text-primary);
  padding-bottom: calc(118rpx + env(safe-area-inset-bottom));
}
.lux-hero-stage {
  position: relative;
  min-height: 1120rpx;
  overflow: hidden;
  background: var(--theme-hero-bg, $paper-bg);
}
.lux-hero-stage::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2rpx;
  height: 360rpx;
  @include photo-hero-scrim;
  pointer-events: none;
  z-index: 3;
  letter-spacing: -0.04em;
  user-select: none;
}
.lux-hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  filter: var(--theme-hero-filter, none);
}
.lux-hero-image.default {
  opacity: 1;
}
.lux-hero-image.treatment-silver {
  filter: grayscale(1) contrast(1.04);
}
.lux-hero-image.treatment-tint {
  filter: saturate(0.86) contrast(0.96);
}
.lux-hero-overlay {
  position: absolute;
  inset: 0;
  background: var(--theme-hero-overlay, linear-gradient(to bottom, rgba(247, 242, 233, 0) 0%, rgba(247, 242, 233, 0.6) 58%, $paper-bg 100%));
  z-index: 2;
}
.lux-hero-overlay.default {
  @include photo-hero-scrim;
}
.lux-xi-watermark {
  position: absolute;
  right: 20rpx;
  bottom: 218rpx;
  z-index: 4;
  color: rgba(176, 141, 87, 0.10);
  font-family: $font-serif;
  font-size: 224rpx;
  font-weight: 900;
  line-height: 1;
}
.lux-hero-copy {
  position: absolute;
  z-index: 5;
  left: $page-gutter;
  right: $page-gutter;
  bottom: 132rpx;
  color: $ink;
  text-shadow: none;
}
.lux-hero-kicker {
  display: block;
  margin-bottom: 22rpx;
  color: $gold;
  font-size: $fs-cap;
  font-weight: 600;
  letter-spacing: $ls-wide;
  text-transform: uppercase;
}
.lux-hero-names {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 16rpx;
  max-width: 640rpx;
  color: var(--theme-ink, $text-primary);
  font-family: $font-serif;
  font-size: $fs-hero;
  font-weight: 600;
  line-height: 1.18;
  letter-spacing: 0;
  word-break: break-word;
}
.lux-hero-amp {
  color: $gold;
  font-family: $font-num;
  font-size: 48rpx;
  font-weight: 400;
}
.lux-hero-sub {
  display: block;
  margin-top: 24rpx;
  color: $ink-soft;
  font-family: $font-num;
  font-size: $fs-note;
  line-height: 1.45;
}
.lux-invite-section,
.lux-detail-section,
.lux-rsvp-section {
  margin-top: $sp-7;
}
.lux-invite-card,
.lux-detail-card,
.lux-rsvp-card {
  position: relative;
  margin: 0 $page-gutter $sp-4;
  padding: $sp-4;
  background: var(--theme-surface, $paper-card);
  border: 1rpx solid var(--theme-border, $line);
  border-radius: $r-md;
  box-shadow: $shadow-card;
  overflow: hidden;
}
.lux-detail-card::before,
.lux-rsvp-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: $sp-4;
  bottom: $sp-4;
  width: 4rpx;
  border-radius: 2rpx;
  background: var(--theme-accent, $color-primary);
}
.lux-invite-mark {
  display: block;
  color: var(--theme-accent-soft, rgba(176,58,91,0.18));
  font-family: $font-serif;
  font-size: 88rpx;
  line-height: 0.8;
}
.lux-invite-text {
  display: block;
  margin-top: 4rpx;
  color: var(--theme-ink, $text-primary);
  font-family: $font-serif;
  font-size: 32rpx;
  line-height: 1.85;
  word-break: break-word;
}
.lux-couple-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 34rpx;
}
.lux-couple-side {
  flex: 1;
  min-width: 0;
}
.lux-couple-label {
  display: block;
  color: $text-muted;
  font-size: 18rpx;
  font-weight: 600;
  letter-spacing: $ls-wide;
}
.lux-couple-name {
  display: block;
  margin-top: 8rpx;
  color: $text-primary;
  font-size: 34rpx;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.lux-couple-amp {
  width: 52rpx;
  color: $gold;
  font-family: $font-num;
  font-size: 34rpx;
  line-height: 1;
  text-align: center;
  flex-shrink: 0;
}
.lux-countdown {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding-bottom: $sp-3;
  border-bottom: 1rpx solid $line-soft;
}
.lux-count-num {
  color: var(--theme-accent-deep, $color-primary-dark);
  font-family: $font-num;
  font-size: 56rpx;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.lux-count-copy {
  flex: 1;
  min-width: 0;
}
.lux-count-label,
.lux-detail-label {
  display: block;
  color: $gold;
  font-size: $fs-cap;
  font-weight: 600;
  letter-spacing: $ls-wide;
  text-transform: uppercase;
}
.lux-count-desc {
  display: block;
  margin-top: 6rpx;
  color: var(--theme-ink, $text-primary);
  font-size: $fs-note;
  line-height: 1.45;
  word-break: break-word;
}
.lux-detail-list {
  display: flex;
  flex-direction: column;
}
.lux-detail-row {
  display: flex;
  flex-direction: column;
  gap: $sp-1;
  padding: $sp-3 0;
  border-bottom: 1rpx solid $line-soft;
}
.lux-detail-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.lux-detail-row.venue {
  flex-direction: row;
  align-items: center;
  gap: $sp-3;
}
.lux-detail-main {
  flex: 1;
  min-width: 0;
}
.lux-detail-value {
  color: var(--theme-ink, $text-primary);
  font-family: $font-serif;
  font-size: $fs-body;
  line-height: 1.45;
  word-break: break-word;
}
.lux-detail-value.num {
  font-family: $font-num;
  font-size: 34rpx;
}
.lux-venue-name {
  display: block;
  margin-top: $sp-1;
  color: var(--theme-ink, $text-primary);
  font-family: $font-serif;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.35;
  word-break: break-word;
}
.lux-venue-address {
  display: block;
  margin-top: $sp-1;
  color: var(--theme-muted, $text-muted);
  font-size: $fs-note;
  line-height: 1.45;
  word-break: break-word;
}
.lux-nav-btn {
  width: 132rpx;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: $r-sm;
  background: var(--theme-accent-soft, rgba(176,58,91,0.08));
  color: var(--theme-accent, $color-primary);
  border: 1rpx solid var(--theme-accent-line, rgba(176,58,91,0.28));
  font-size: $fs-note;
  font-weight: 600;
  padding: 0;
  flex-shrink: 0;
}
.lux-nav-btn::after {
  border: none;
}
.lux-rsvp-copy {
  display: block;

  color: var(--theme-ink, $text-primary);
  font-family: $font-serif;
  font-size: $fs-body;
  line-height: 1.75;
  word-break: break-word;
}
.lux-rsvp-btn {
  margin-top: $sp-4;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: $r-sm;
  background: var(--theme-accent, $color-primary);
  color: var(--theme-on-accent, $ink-inverse);
  font-size: $fs-body;
  font-weight: 600;
  padding: 0;
}
.lux-rsvp-btn::after {
  border: none;
}
.lux-footer-section {
  padding: 70rpx $page-gutter 40rpx;
  text-align: center;
}
.lux-footer-line {
  width: 56rpx;
  height: 2rpx;
  margin: 0 auto 22rpx;
  background: $gold;
  opacity: 0.74;
}
.lux-footer-title {
  display: block;
  color: $text-primary;
  font-family: $font-serif;
  font-size: 34rpx;
}
.lux-footer-sub {
  display: block;
  margin-top: 10rpx;
  color: $text-muted;
  font-size: 22rpx;
}
.lux-music-control {
  right: $page-gutter;
  bottom: calc(116rpx + env(safe-area-inset-bottom));
}
</style>
