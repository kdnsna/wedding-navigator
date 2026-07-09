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
        <text class="lux-hero-kicker">{{ activeTemplate.kicker }}</text>
        <text class="lux-hero-names">{{ groomName }} & {{ brideName }}</text>
        <text class="lux-hero-sub">诚邀您见证我们的婚礼</text>
      </view>

      <view class="lux-action-panel">
        <view class="lux-countdown" v-if="showCountdown && countdown">
          <text class="lux-count-num">{{ countdown.isToday ? 'TODAY' : countdown.days }}</text>
          <view class="lux-count-copy">
            <text class="lux-count-label">{{ countdown.isToday ? '就是今天' : 'DAYS TO GO' }}</text>
            <text class="lux-count-desc">{{ formatDate(weddingDate) }} {{ weddingTime || '12:00' }}</text>
          </view>
        </view>

        <view class="lux-venue-card" v-if="hasVenueInfo" @click="goToGuide">
          <view class="lux-venue-main">
            <text class="lux-label">主场地</text>
            <text class="lux-venue-name">{{ primaryVenue.name }}</text>
            <text class="lux-venue-address" v-if="primaryVenue.address || venueAddress">{{ primaryVenue.address || venueAddress }}</text>
          </view>
          <button class="lux-nav-btn" @click.stop="openNavigation">导航</button>
        </view>

        <view class="lux-panel-actions">
          <button class="lux-panel-btn primary" v-if="isRsvpEnabled" @click="goToRSVP">{{ hasSubmittedRsvp ? '修改回执' : '确认出席' }}</button>
          <button class="lux-panel-btn" v-if="isBlessingEnabled" @click="goToBlessing">写祝福</button>
          <button class="lux-panel-btn" open-type="share">分享请柬</button>
        </view>
      </view>
    </view>

    <view class="lux-invite-section">
      <SectionHeader
        title="婚书请柬"
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

    <view class="lux-section" v-if="featuredPhotos.length > 0 || latestBlessings.length > 0">
      <SectionHeader title="婚礼预览" kicker="MEMORIES" :desc="activeTemplate.albumMood + ' · ' + activeTemplate.photoMood" />
      <view class="lux-preview-block" v-if="featuredPhotos.length > 0" @click="goToAlbum">
        <view class="preview-header">
          <text class="lux-preview-title">{{ activeTemplate.albumMood }}</text>
          <text class="lux-preview-more">查看全部</text>
        </view>
        <view class="lux-photo-strip">
          <view
            class="lux-photo-thumb"
            v-for="(photo, index) in featuredPhotos"
            :key="photo.id || photo.url"
          >
            <view class="lux-photo-frame">
              <image
                class="lux-photo-image"
                :class="photoTreatmentClass(photo)"
                :src="photo.url"
                mode="aspectFill"
              />
            </view>
            <text class="lux-photo-caption">{{ photoCaption(photo, index) }}</text>
          </view>
        </view>
      </view>
      <view class="lux-preview-block" v-if="isBlessingEnabled && latestBlessings.length > 0" @click="goToBlessing">
        <view class="preview-header">
          <text class="lux-preview-title">最近祝福</text>
          <text class="lux-preview-more">去祝福墙</text>
        </view>
        <view class="lux-blessing-row" v-for="item in latestBlessings" :key="item.id">
          <text class="lux-blessing-name">{{ item.sender?.name || '宾客' }}</text>
          <text class="lux-blessing-text">{{ item.content }}</text>
        </view>
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
import { formatDate, getWeekDay } from '@/utils/index.js'
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
const activeTemplate = computed(() => store.activeTemplate)
const templateClass = computed(() => store.templateClass)
const showCountdown = computed(() => store.showCountdown)
const isRsvpEnabled = computed(() => store.isRsvpEnabled)
const isBlessingEnabled = computed(() => store.isBlessingEnabled)
const isTimelineEnabled = computed(() => store.isTimelineEnabled)
const primaryVenue = computed(() => store.primaryVenue || { name: venueName.value || '婚礼场地', address: venueAddress.value })
const hasVenueInfo = computed(() => Boolean(primaryVenue.value?.name || primaryVenue.value?.address || venueAddress.value))
const latestBlessings = computed(() => store.latestBlessings || [])
const featuredPhotos = computed(() => store.featuredPhotos || [])
const heroPhotoTreatmentClass = computed(() => (isDefaultCover.value ? '' : photoTreatmentClass()))
const hasSubmittedRsvp = computed(() => {
  if (!isRsvpEnabled.value) return false
  const list = store.guests?.guests || []
  return list.some(item => {
    if (userStore.openid && item.openid === userStore.openid) return true
    return item.rsvp_status && item.rsvp_status !== 'pending'
  })
})

function photoCaption(photo, index) {
  const custom = photo?.caption || photo?.title || photo?.desc || photo?.description
  if (custom) return custom
  const date = photo?.date || photo?.taken_at || photo?.upload_time || photo?.created_at
  if (date) return formatDate(String(date).slice(0, 10))
  return `PHOTO ${String(index + 1).padStart(2, '0')}`
}

function photoTreatmentClass(photo = null) {
  const treatment = String(photo?.treatment || photo?.effect || photo?.filter || photoTreatment.value || '').toLowerCase()
  if (['silver', 'silver-bw', 'black-white', 'bw'].includes(treatment)) return 'treatment-silver'
  if (['soft-color', 'light-color', 'tint'].includes(treatment)) return 'treatment-tint'
  return ''
}
const nextEventText = computed(() => {
  const event = store.nextTimelineEvent
  if (!event) return '待公布'
  return event.time ? `${event.time} ${event.title}` : event.title
})
const invitationText = computed(() => {
  return store.invitation?.content?.main_text || '盼与您共赴这一日的约。'
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

function goToAlbum() { switchTabOrToast('/pages/album/index', '打开相册') }
function goToGuide() { switchTabOrToast('/pages/guide/index', '打开路书') }
function goToTimeline() {
  if (!isTimelineEnabled.value) {
    uni.showToast({ title: '新人暂未开放婚礼流程', icon: 'none' })
    return
  }
  switchTabOrToast('/pages/timeline/index', '打开流程')
}
function goToRSVP() {
  if (!isRsvpEnabled.value) {
    uni.showToast({ title: '新人暂未开放在线回执', icon: 'none' })
    return
  }
  navigateOrToast('/pages/rsvp/index', '打开回执')
}
function goToBlessing() {
  if (!isBlessingEnabled.value) {
    uni.showToast({ title: '新人暂未开放祝福墙', icon: 'none' })
    return
  }
  navigateOrToast('/pages/blessing/index', '打开祝福墙')
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

  const startTime = Math.floor(new Date(`${date}T${time}`).getTime() / 1000)
  if (!Number.isFinite(startTime)) {
    uni.showToast({ title: '婚礼日期格式有误', icon: 'none' })
    return
  }
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
              if (res.confirm) {
                uni.openSetting({
                  fail: (settingErr) => {
                    console.warn('打开设置失败:', settingErr)
                    uni.showToast({ title: '打开设置失败', icon: 'none' })
                  }
                })
              }
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

/* ========== 高级礼宴首页 v4 ========== */
.lux-home {
  min-height: 100vh;
  background:
    linear-gradient(180deg, var(--theme-page-soft, rgba(255,248,245,0.98)) 0%, var(--theme-page, $ink-inverse) 34%, var(--theme-page-soft, rgba(255,248,245,1)) 100%);
  color: var(--theme-ink, $text-primary);
  padding-bottom: calc(118rpx + env(safe-area-inset-bottom));
}
.lux-hero-stage {
  position: relative;
  min-height: 1168rpx;
  overflow: visible;
  background: var(--theme-hero-bg, $color-primary-dark);
}
.lux-hero-stage::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2rpx;
  height: 260rpx;
  @include photo-hero-scrim;
  pointer-events: none;
  z-index: 3;
}
.lux-hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 994rpx;
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
  height: 994rpx;
  background: var(--theme-hero-overlay, linear-gradient(to bottom, rgba(247, 242, 233, 0) 0%, rgba(247, 242, 233, 0.6) 55%, $paper-bg 100%));
}
.lux-hero-overlay.default {
  @include photo-hero-scrim;
}
.lux-xi-watermark {
  position: absolute;
  top: 596rpx;
  right: 18rpx;
  z-index: 3;
  color: rgba(176, 141, 87, 0.10);
  font-family: $font-serif;
  font-size: 224rpx;
  font-weight: 900;
  line-height: 1;
}
.lux-hero-copy {
  position: absolute;
  z-index: 4;
  left: $page-gutter;
  right: $page-gutter;
  bottom: 500rpx;
  color: $ink;
  text-shadow: none;
}
.lux-hero-kicker {
  display: block;
  margin-bottom: 22rpx;
  color: $gold;
  font-size: 20rpx;
  font-weight: 600;
  letter-spacing: $ls-wide;
  text-transform: uppercase;
}
.lux-hero-names {
  display: block;
  max-width: 620rpx;
  color: var(--theme-accent-deep, $color-primary-dark);
  font-family: $font-serif;
  font-size: 72rpx;
  font-weight: 600;
  line-height: 1.06;
  letter-spacing: 0;
  word-break: break-word;
}
.lux-hero-sub {
  display: block;
  margin-top: 26rpx;
  color: $ink-soft;
  font-size: 28rpx;
  line-height: 1.45;
}
.lux-action-panel {
  position: absolute;
  z-index: 6;
  left: $page-gutter-sm;
  right: $page-gutter-sm;
  bottom: 0;
  padding: 30rpx;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.98) 0%, var(--theme-surface, $ink-inverse) 100%);
  border: 1rpx solid var(--theme-border, rgba(75,17,30,0.10));
  border-radius: $card-radius;
  box-shadow: 0 18rpx 54rpx rgba(42,17,20,0.16);
  backdrop-filter: blur(18rpx);
}
.lux-action-panel::before {
  content: "";
  display: block;
  width: 92rpx;
  height: 4rpx;
  margin: 0 auto 22rpx;
  border-radius: 2rpx;
  background: $gold;
  opacity: 0.72;
}
.lux-countdown {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding-bottom: 22rpx;
  border-bottom: 1rpx solid $border-light;
}
.lux-count-num {
  color: var(--theme-accent-deep, $color-primary-dark);
  font-family: $font-num;
  font-size: 54rpx;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.lux-count-copy {
  flex: 1;
  min-width: 0;
}
.lux-count-label,
.lux-label {
  display: block;
  color: $text-muted;
  font-size: 20rpx;
  font-weight: 600;
  letter-spacing: 0;
}
.lux-count-desc {
  display: block;
  margin-top: 6rpx;
  color: var(--theme-ink, $text-primary);
  font-size: 26rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.lux-venue-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 22rpx;
  padding: 26rpx;
  background: var(--theme-surface, $paper-card);
  border: 1rpx solid var(--theme-border, $border-light);
  border-radius: $card-radius;
  box-shadow: 0 8rpx 28rpx rgba(42,17,20,0.055);
  overflow: hidden;
}
.lux-venue-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 24rpx;
  bottom: 24rpx;
  width: 4rpx;
  border-radius: 2rpx;
  background: var(--theme-accent, $color-primary);
}
.lux-venue-main {
  flex: 1;
  min-width: 0;
}
.lux-venue-name {
  display: block;
  margin-top: 8rpx;
  color: var(--theme-ink, $text-primary);
  font-family: $font-serif;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.35;
  word-break: break-word;
}
.lux-venue-address {
  display: block;
  margin-top: 8rpx;
  color: var(--theme-muted, $text-muted);
  font-size: 24rpx;
  line-height: 1.45;
  word-break: break-word;
}
.lux-nav-btn {
  width: 132rpx;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: $radius-sm;
  background: var(--theme-accent-soft, rgba(176,58,91,0.08));
  color: var(--theme-accent, $color-primary);
  border: 1rpx solid var(--theme-accent-line, rgba(176,58,91,0.28));
  font-size: 26rpx;
  font-weight: 600;
  padding: 0;
}
.lux-nav-btn::after {
  border: none;
}
.lux-panel-actions {
  display: flex;
  gap: 14rpx;
  margin-top: 20rpx;
}
.lux-panel-btn {
  flex: 1;
  min-width: 0;
  height: 78rpx;
  line-height: 78rpx;
  border-radius: $radius-sm;
  background: var(--theme-elevated, $bg-muted);
  color: var(--theme-ink, $text-primary);
  font-size: 26rpx;
  font-weight: 600;
  padding: 0 10rpx;
}
.lux-panel-btn.primary {
  background: var(--theme-accent, $color-primary);
  color: var(--theme-on-accent, $ink-inverse);
}
.lux-panel-btn::after {
  border: none;
}
.lux-invite-section,
.lux-section {
  margin-top: 58rpx;
}
.lux-invite-card,
.lux-preview-block {
  margin: 0 $page-gutter 28rpx;
  padding: 32rpx;
  background:
    linear-gradient(180deg, var(--theme-surface, $paper-card) 0%, rgba(255,253,248,0.96) 100%);
  border: 1rpx solid var(--theme-border, $border-light);
  border-radius: $card-radius;
  box-shadow: 0 10rpx 30rpx rgba(42,17,20,0.06);
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
.lux-preview-block .preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 20rpx;
}
.lux-preview-title {
  color: $text-primary;
  font-size: 30rpx;
  font-weight: 600;
}
.lux-preview-more {
  flex-shrink: 0;
  color: var(--theme-accent, $color-primary);
  font-size: 24rpx;
  font-weight: 600;
}
.lux-photo-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}
.lux-photo-thumb {
  width: 100%;
  min-width: 0;
  @include photo-mount;
  box-sizing: border-box;
}
.lux-photo-frame {
  position: relative;
  width: 100%;
  padding-top: $photo-ratio;
  overflow: hidden;
  background: $paper-deep;
}
.lux-photo-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  filter: none;
}
.lux-photo-image.treatment-silver {
  filter: grayscale(1) contrast(1.04);
}
.lux-photo-image.treatment-tint {
  filter: saturate(0.86) contrast(0.96);
}
.lux-photo-caption {
  display: block;
  margin-top: 10rpx;
  color: $ink-soft;
  font-family: $font-num;
  font-size: 18rpx;
  line-height: 1.35;
  text-align: center;
  word-break: break-word;
}
.lux-blessing-row {
  padding: 18rpx 0;
  border-top: 1rpx solid $border-light;
}
.lux-blessing-row:first-of-type {
  border-top: none;
}
.lux-blessing-name {
  display: block;
  color: var(--theme-accent, $color-primary);
  font-size: 24rpx;
  font-weight: 600;
}
.lux-blessing-text {
  display: block;
  margin-top: 8rpx;
  color: $text-secondary;
  font-size: 26rpx;
  line-height: 1.52;
}
.lux-footer-section {
  padding: 70rpx $page-gutter 40rpx;
  text-align: center;
}
.lux-footer-line {
  width: 56rpx;
  height: 2rpx;
  margin: 0 auto 22rpx;
  background: var(--theme-accent, $color-primary);
  opacity: 0.34;
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
