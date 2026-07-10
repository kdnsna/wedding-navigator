<template>
  <view class="page lux-home" :class="templateClass" @touchstart="onPageTap">
    <template v-if="guestStore.canRenderInvitation">
    <view class="lux-hero-stage">
      <image
        v-if="coverImage"
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

    <view class="lux-invite-section" v-if="invitationText">
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
        <view class="lux-next-event" v-if="nextTimelineEvent">
          <text class="lux-detail-label">NEXT</text>
          <text class="lux-next-time">{{ nextTimelineEvent.time }}</text>
          <text class="lux-next-title">{{ nextTimelineEvent.title || nextTimelineEvent.name }}</text>
        </view>
      </view>
    </view>

    <view class="lux-album-section" v-if="featuredPhotos.length">
      <SectionHeader title="银盐相册" kicker="PHOTOGRAPHS" desc="一些被认真留下的瞬间" />
      <scroll-view class="lux-photo-strip" scroll-x enhanced :show-scrollbar="false">
        <view class="lux-photo-mount" v-for="(photo, index) in featuredPhotos" :key="photo.id || photo.url">
          <image class="lux-photo-image" :class="photoTreatmentClass(photo)" :src="photo.url" mode="aspectFill" />
          <text class="lux-photo-caption">{{ photo.caption || `NO. ${String(index + 1).padStart(2, '0')}` }}</text>
        </view>
      </scroll-view>
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
    </template>

    <view class="letter-state" v-else>
      <view class="letter-state-seal"><text>{{ guestStateSeal }}</text></view>
      <text class="letter-state-kicker">TIAN XI LETTER</text>
      <text class="letter-state-title">{{ guestStateTitle }}</text>
      <text class="letter-state-copy">{{ guestStateCopy }}</text>
      <template v-if="guestStore.status === 'idle'">
        <button class="letter-state-action primary" @click="openOwnerEntry">{{ ownerEntryLabel }}</button>
        <text class="letter-state-hint">宾客请从新人分享的婚礼邀请进入</text>
      </template>
      <button class="letter-state-action" v-else-if="guestStore.invitationId && guestStore.status !== 'loading'" @click="retryInvitation">再试一次</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useGuestInvitationStore } from '@/stores/guest-invitation.js'
import { useUserStore } from '@/stores/user.js'
import { fetchGuestInvitation, recordShare, recordView } from '@/composables/useCloud.js'
import { formatDate } from '@/utils/index.js'
import SectionHeader from '@/components/ui/SectionHeader.vue'

const store = useWeddingStore()
const guestStore = useGuestInvitationStore()
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
  return cover?.url || photos[0]?.url || ''
})
const isLegacyDefaultCover = computed(() => coverImage.value === '/static/visuals/default-cover.png')
const isDefaultCover = computed(() => isLegacyDefaultCover.value)
const coverImageMode = computed(() => 'aspectFill')
const photoTreatment = computed(() => store.invitation?.photo_treatment || 'original')

const groomName = computed(() => store.invitation?.couple?.groom?.name || '')
const brideName = computed(() => store.invitation?.couple?.bride?.name || '')
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
const featuredPhotos = computed(() => (store.featuredPhotos || []).filter(photo => photo?.url))
const nextTimelineEvent = computed(() => store.isTimelineEnabled ? store.nextTimelineEvent : null)
const hasOwnerWorkspace = computed(() => Boolean(userStore.ownerActiveWeddingId))
const ownerEntryLabel = computed(() => hasOwnerWorkspace.value ? '回到我的书案' : '开始制作婚书')

const guestStateTitle = computed(() => ({
  idle: hasOwnerWorkspace.value ? '你的婚书在书案上' : '从这里写下喜事',
  loading: '正在展信',
  invalid: '这封邀请已失效',
  closed: '这场婚礼已经圆满落幕',
  offline: '暂时无法取信'
}[guestStore.status] || '这封信还没有抵达'))
const guestStateCopy = computed(() => {
  if (guestStore.error) return guestStore.error
  return ({
    idle: hasOwnerWorkspace.value ? '继续修书、查看回执，或把邀请寄给亲友。' : '用四幕向导写好姓名、良辰、地点与照片，再把这封信寄给亲友。',
    loading: '纸页正在轻轻展开，请稍候。',
    invalid: '请联系新人重新发送一封邀请。',
    closed: '谢谢您曾经见证这一日。',
    offline: '请检查网络，或稍后再来展开。'
  }[guestStore.status] || '')
})
const guestStateSeal = computed(() => guestStore.status === 'closed' ? '礼' : '囍')

function openOwnerEntry() {
  const url = hasOwnerWorkspace.value ? '/pages-owner/manage/index' : '/pages-owner/wizard/index'
  navigateOrToast(url, hasOwnerWorkspace.value ? '打开我的书案' : '开始制作婚书')
}

function photoTreatmentClass(photo = null) {
  const treatment = String(photo?.treatment || photo?.effect || photo?.filter || photoTreatment.value || '').toLowerCase()
  if (['silver', 'silver-bw', 'black-white', 'bw'].includes(treatment)) return 'treatment-silver'
  if (['soft-color', 'light-color', 'tint'].includes(treatment)) return 'treatment-tint'
  return ''
}
const invitationText = computed(() => {
  return store.invitation?.content?.main_text || ''
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
  switchTabOrToast('/pages/rsvp/index', '打开回执')
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
  return guestStore.invitationId
    ? `/pages/index/index?id=${encodeURIComponent(guestStore.invitationId)}`
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
  if (guestStore.isReady && guestStore.invitationId) {
    recordShare(guestStore.invitationId).catch((err) => {
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
    query: guestStore.isReady ? `id=${encodeURIComponent(guestStore.invitationId)}` : '',
    imageUrl: coverImage.value
  }
})

onLoad(async (options) => {
  const pendingPreviewId = userStore.canEdit ? uni.getStorageSync('guestPreviewInvitationId') : ''
  if (pendingPreviewId) uni.removeStorageSync('guestPreviewInvitationId')
  const weddingId = parseWeddingIdFromOptions(options) || pendingPreviewId
  if (!weddingId) {
    guestStore.clear()
    syncShareMenu()
    return
  }

  const cached = guestStore.hydrate(weddingId)
  if (cached) {
    store.setWeddingData(cached, weddingId)
    updateCountdown()
    startCountdownTimer()
  }
  await loadGuestInvitation(weddingId)
})

async function loadGuestInvitation(weddingId = guestStore.invitationId) {
  if (!weddingId) return
  try {
    await fetchGuestInvitation(weddingId)
    updateCountdown()
    startCountdownTimer()
    syncShareMenu()
    recordView(weddingId).catch((err) => console.warn('访问记录失败:', err))
  } catch (err) {
    console.warn('宾客邀请加载失败:', err)
    syncShareMenu()
  }
}

function retryInvitation() {
  loadGuestInvitation()
}

function syncShareMenu() {
  const options = {
    fail: (err) => console.warn('同步分享菜单失败:', err)
  }
  if (guestStore.isReady) {
    consumeUniTask(uni.showShareMenu?.({ ...options, menus: ['shareAppMessage', 'shareTimeline'] }))
  }
}

function consumeUniTask(task) {
  if (task && typeof task.catch === 'function') {
    task.catch((err) => console.warn('分享菜单请求未完成:', err))
  }
}

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
  const pendingPreviewId = userStore.canEdit ? uni.getStorageSync('guestPreviewInvitationId') : ''
  if (pendingPreviewId) {
    uni.removeStorageSync('guestPreviewInvitationId')
    guestStore.setInvitationId(pendingPreviewId)
    await loadGuestInvitation(pendingPreviewId)
    return
  }
  updateCountdown()
  const weddingId = guestStore.invitationId
  if (weddingId && store.cachedWeddingId !== weddingId) {
    try {
      await fetchGuestInvitation(weddingId)
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
  letter-spacing: 0;
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
  font-size: 24rpx;
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
  color: $gold-ink;
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
  font-size: $fs-note;
}
.lux-music-control {
  right: $page-gutter;
  bottom: calc(116rpx + env(safe-area-inset-bottom));
}

.lux-next-event {
  display: grid;
  grid-template-columns: 88rpx 116rpx minmax(0, 1fr);
  align-items: center;
  gap: $sp-2;
  margin-top: $sp-3;
  padding-top: $sp-3;
  border-top: 1rpx solid $line-soft;
}
.lux-next-time {
  font-family: $font-num;
  color: var(--accent);
  font-size: $fs-body;
}
.lux-next-title {
  min-width: 0;
  color: $ink;
  font-size: $fs-note;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lux-album-section {
  padding: $sp-7 0;
  overflow: hidden;
}
.lux-album-section :deep(.section-header) {
  padding-left: $page-gutter;
  padding-right: $page-gutter;
}
.lux-photo-strip {
  width: 100%;
  white-space: nowrap;
  padding-left: $page-gutter;
}
.lux-photo-mount {
  @include photo-mount;
  display: inline-flex;
  width: 520rpx;
  margin-right: $sp-3;
  flex-direction: column;
  vertical-align: top;
}
.lux-photo-image {
  width: 100%;
  height: 620rpx;
  display: block;
}
.lux-photo-caption {
  display: block;
  margin-top: $sp-2;
  color: $ink-soft;
  font-family: $font-num;
  font-size: $fs-note;
  line-height: 1.4;
  white-space: normal;
}

.letter-state {
  min-height: 100vh;
  padding: calc(160rpx + env(safe-area-inset-top)) $page-gutter 160rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: $paper-bg;
}
.letter-state-seal {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid var(--accent-ink);
  border-radius: $r-full;
  background: var(--accent);
  color: var(--on-accent);
  font-family: $font-serif;
  font-size: $fs-title;
  box-shadow: 0 4rpx 16rpx var(--accent-glow);
}
.letter-state-kicker {
  margin-top: $sp-5;
  color: $gold-ink;
  font-family: $font-num;
  font-size: $fs-cap;
  letter-spacing: $ls-wide;
}
.letter-state-title {
  margin-top: $sp-3;
  color: $ink;
  font-size: $fs-title;
  line-height: $lh-title;
}
.letter-state-copy {
  max-width: 520rpx;
  margin-top: $sp-2;
  color: $ink-soft;
  font-size: $fs-body;
  line-height: $lh-body;
}
.letter-state-action {
  min-width: 224rpx;
  height: 80rpx;
  margin-top: $sp-5;
  padding: 0 $sp-4;
  border: 1rpx solid var(--accent-line);
  border-radius: $r-sm;
  background: transparent;
  color: var(--accent);
  font-size: $fs-note;
  line-height: 78rpx;
}
.letter-state-action::after { border: 0; }
.letter-state-action.primary {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--on-accent);
}
.letter-state-hint {
  margin-top: $sp-3;
  color: $ink-faint;
  font-size: $fs-note;
  line-height: $lh-body;
}
</style>
