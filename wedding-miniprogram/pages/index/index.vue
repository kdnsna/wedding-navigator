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
          <view class="lux-rsvp-chip" v-if="isRsvpEnabled" :class="{ done: hasSubmittedRsvp }" @click="goToRSVP">
            <text>{{ hasSubmittedRsvp ? '已回执' : '待回执' }}</text>
          </view>
        </view>

        <view class="lux-venue-card" @click="goToGuide">
          <view class="lux-venue-main">
            <text class="lux-label">主场地</text>
            <text class="lux-venue-name">{{ primaryVenue.name }}</text>
            <text class="lux-venue-address">{{ primaryVenue.address || venueAddress || '主人正在补充详细地址' }}</text>
          </view>
          <button class="lux-nav-btn" @click.stop="openNavigation">导航</button>
        </view>

        <view class="lux-mini-grid">
          <view class="lux-mini-cell" @click="openCalendar">
            <text class="lux-mini-label">日期</text>
            <text class="lux-mini-value">{{ formatDate(weddingDate) || '待公布' }}</text>
          </view>
          <view class="lux-mini-cell" v-if="isTimelineEnabled" @click="goToTimeline">
            <text class="lux-mini-label">最近流程</text>
            <text class="lux-mini-value">{{ nextEventText }}</text>
          </view>
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
        :kicker="activeTemplate.shortName + ' INVITATION'"
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
          <view class="lux-couple-line" />
          <view class="lux-couple-side">
            <text class="lux-couple-label">BRIDE</text>
            <text class="lux-couple-name">{{ brideName }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="lux-section">
      <SectionHeader title="宾客行动" kicker="GUEST ACTIONS" desc="到场、回执、流程和祝福都在这里" />
      <view class="lux-action-list">
        <ActionCard
          title="婚礼路书"
          :desc="primaryVenue.address || venueAddress || '查看主场地、停车、住宿与天气提醒'"
          icon="/static/visuals/icon-guide.svg"
          tone="primary"
          status="必看"
          @click="goToGuide"
        />
        <ActionCard
          v-if="isTimelineEnabled"
          title="婚礼流程"
          :desc="nextEventText"
          icon="/static/visuals/icon-timeline.svg"
          status="当天安排"
          @click="goToTimeline"
        />
        <ActionCard
          v-if="isRsvpEnabled"
          title="出席回执"
          :desc="hasSubmittedRsvp ? '已收到您的回执，可随时修改' : '请帮新人确认人数与到达信息'"
          icon="/static/visuals/icon-rsvp.svg"
          :status="hasSubmittedRsvp ? '已完成' : '待确认'"
          @click="goToRSVP"
        />
        <ActionCard
          v-if="isBlessingEnabled"
          title="祝福墙"
          desc="写一句会被新人第一眼看到的祝福"
          icon="/static/visuals/icon-blessing.svg"
          @click="goToBlessing"
        />
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

    <view class="lux-float-actions">
      <button class="lux-float-btn rsvp" v-if="isRsvpEnabled" @click="goToRSVP">回执</button>
      <button class="lux-float-btn share" open-type="share">分享</button>
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
import ActionCard from '@/components/ui/ActionCard.vue'

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

/* ========== 封面大图 ========== */
.hero {
  position: relative;
  height: 80vh;
  min-height: 940rpx;
  max-height: 1220rpx;
  overflow: hidden;
  background: var(--theme-hero-bg, #fcf6f0);
}
.hero-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--theme-hero-bg, #fcf6f0);
}
.hero-image-main {
  z-index: 0;
  filter: var(--theme-hero-filter, none);
}
.hero-image.default {
  padding: 0;
  opacity: 1;
}
.hero-gradient {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--theme-hero-overlay, linear-gradient(
    to bottom,
    rgba(0,0,0,0.25) 0%,
    rgba(0,0,0,0.05) 25%,
    rgba(0,0,0,0.15) 60%,
    rgba(255,255,255,0.95) 90%,
    rgba(255,255,255,1) 100%
  ));
}
.hero-gradient.default {
  background:
    linear-gradient(to bottom, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.08) 28%, rgba(48,22,28,0.16) 48%, rgba(58,24,32,0.48) 72%, rgba(255,255,255,0.96) 96%, #fff 100%);
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
  z-index: 3;
}
.hero-content {
  position: relative;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  padding: 60rpx $page-gutter 86rpx;
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
  margin-bottom: 58rpx;
  width: 100%;
  max-width: 560rpx;
}
.countdown-num {
  font-size: 104rpx;
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
  margin-bottom: 58rpx;
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
  color: var(--theme-accent, $color-primary);
  letter-spacing: 0;
  margin-bottom: 8rpx;
  font-weight: 600;
}
.daypack-title {
  display: block;
  font-size: 40rpx;
  color: var(--theme-ink, $text-primary);
  font-weight: 600;
}
.daypack-template {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--theme-muted, $text-muted);
  letter-spacing: 0;
}
.daypack-status {
  padding: 10rpx 20rpx;
  border-radius: $radius-full;
  background: var(--theme-accent-soft, rgba(176,58,91,0.08));
  color: var(--theme-accent, $color-primary);
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
  border: 1rpx solid var(--theme-border, $border-color);
  margin-bottom: 16rpx;
}
.daypack-card.primary {
  background: var(--theme-strong-bg, $text-primary);
  border-color: var(--theme-strong-border, transparent);
}
.daypack-card-main {
  flex: 1;
  min-width: 0;
}
.daypack-label {
  display: block;
  font-size: 22rpx;
  color: var(--theme-strong-muted, rgba(255,255,255,0.52));
  margin-bottom: 8rpx;
}
.daypack-value {
  display: block;
  font-size: 34rpx;
  color: var(--theme-strong-ink, #fff);
  font-weight: 600;
  margin-bottom: 8rpx;
  line-height: 1.35;
  word-break: break-word;
}
.daypack-sub {
  display: block;
  font-size: 24rpx;
  color: var(--theme-strong-muted, rgba(255,255,255,0.7));
  line-height: 1.5;
  word-break: break-word;
}
.daypack-action {
  width: 116rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: var(--theme-strong-soft, #fff);
  color: var(--theme-strong-ink, $text-primary);
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
  background: var(--theme-elevated, $bg-muted);
  border-radius: $card-radius;
  min-height: 132rpx;
}
.mini-label {
  display: block;
  font-size: 22rpx;
  color: var(--theme-muted, $text-muted);
  margin-bottom: 10rpx;
}
.mini-value {
  display: block;
  font-size: 28rpx;
  color: var(--theme-ink, $text-primary);
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
  background: var(--theme-elevated, $bg-muted);
  color: var(--theme-ink, $text-primary);
  font-size: 28rpx;
}
.daypack-pill.primary {
  background: var(--theme-accent, $color-primary);
  color: var(--theme-on-accent, #fff);
}
.daypack-pill::after { border: none; }

.preview-section {
  padding-top: 32rpx;
  padding-bottom: 32rpx;
  background: var(--theme-page-soft, $bg-muted);
}
.preview-block {
  background: var(--theme-surface, $bg-surface);
  border-radius: $card-radius;
  padding: 28rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid var(--theme-border, $border-color);
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
  color: var(--theme-ink, $text-primary);
}
.preview-sub {
  display: block;
  max-width: 470rpx;
  margin-top: 6rpx;
  font-size: 22rpx;
  line-height: 1.45;
  color: var(--theme-muted, $text-muted);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.preview-more {
  font-size: 24rpx;
  color: var(--theme-accent, $color-primary);
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
  border-top: 1rpx solid var(--theme-border, $border-color);
}
.blessing-preview:first-of-type {
  border-top: none;
  padding-top: 0;
}
.blessing-name {
  display: block;
  font-size: 24rpx;
  color: var(--theme-muted, $text-muted);
  margin-bottom: 8rpx;
}
.blessing-text {
  display: block;
  font-size: 28rpx;
  color: var(--theme-ink, $text-primary);
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
  color: var(--theme-border, $border-color);
  font-family: $font-serif;
}
.invitation-body {
  max-width: 560rpx;
  margin: 0 auto;
}
.invitation-text {
  font-size: 32rpx;
  line-height: 2.2;
  color: var(--theme-ink, $text-primary);
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
  color: var(--theme-muted, $text-muted);
  letter-spacing: 0;
}
.couple-name {
  font-size: 36rpx;
  font-weight: 600;
  letter-spacing: 0;
  color: var(--theme-ink, $text-primary);
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
  background: var(--theme-border, $border-color);
}
.couple-heart {
  width: 10rpx;
  height: 10rpx;
  background: var(--theme-accent, $color-primary);
  transform: rotate(45deg);
  position: relative;
}
.couple-heart::before,
.couple-heart::after {
  content: '';
  position: absolute;
  width: 10rpx;
  height: 10rpx;
  background: var(--theme-accent, $color-primary);
  border-radius: 50%;
}
.couple-heart::before { left: -5rpx; top: 0; }
.couple-heart::after { left: 0; top: -5rpx; }

/* ========== 婚礼信息 ========== */
.info-section {
  background: var(--theme-page-soft, $bg-muted);
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
  background: var(--theme-border, $border-color);
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
  color: var(--theme-ink, $text-primary);
  letter-spacing: 0;
}
.info-sub {
  font-size: 20rpx;
  color: var(--theme-muted, $text-muted);
  letter-spacing: 0;
}

.info-list {
  background: var(--theme-surface, $bg-surface);
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
  background: var(--theme-elevated, $bg-muted);
}
.info-icon-wrap {
  width: 72rpx;
  height: $control-height-sm;
  border-radius: 50%;
  background: var(--theme-elevated, $bg-muted);
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
  color: var(--theme-muted, $text-muted);
  margin-bottom: 6rpx;
  letter-spacing: 0;
}
.info-value {
  display: block;
  font-size: 30rpx;
  color: var(--theme-ink, $text-primary);
  font-weight: 500;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.info-address {
  display: block;
  font-size: 24rpx;
  color: var(--theme-muted, $text-secondary);
  margin-top: 4rpx;
  line-height: 1.5;
  word-break: break-word;
}
.info-action {
  font-size: 32rpx;
  color: var(--theme-muted, $text-muted);
  padding: 16rpx;
}
.info-divider {
  height: 1rpx;
  background: var(--theme-border, $border-color);
  margin: 0 32rpx;
}

/* ========== 快速入口 ========== */
.quick-section {
  padding-top: 80rpx;
}
.quick-title {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--theme-ink, $text-primary);
  letter-spacing: 0;
}
.quick-sub {
  font-size: 20rpx;
  color: var(--theme-muted, $text-muted);
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
  background: var(--theme-surface, $bg-surface);
  border-radius: $card-radius;
  border: 1rpx solid var(--theme-border, $border-color);
  transition: all 0.25s ease;
}
.quick-item:active {
  background: var(--theme-elevated, $bg-muted);
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
  color: var(--theme-ink, $text-primary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.quick-en {
  font-size: 18rpx;
  color: var(--theme-muted, $text-muted);
  letter-spacing: 0;
}
.quick-arrow {
  font-size: 28rpx;
  color: var(--theme-muted, $text-muted);
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
  background: var(--theme-border, $border-color);
  margin: 0 auto 32rpx;
}
.footer-text {
  display: block;
  font-size: 28rpx;
  color: var(--theme-ink, $text-primary);
  letter-spacing: 0;
  margin-bottom: 12rpx;
  font-weight: 500;
}
.footer-sub {
  display: block;
  font-size: 22rpx;
  color: var(--theme-muted, $text-muted);
  letter-spacing: 0;
  font-weight: 300;
}

/* ========== 悬浮操作 ========== */
.float-actions {
  margin: 16rpx $page-gutter calc(36rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 16rpx;
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
  background: var(--theme-accent, $text-primary);
  color: var(--theme-on-accent, #fff);
  box-shadow: $shadow-sm;
}
.float-btn.share {
  width: 88rpx;
  background: var(--theme-surface, $bg-surface);
  color: var(--theme-ink, $text-primary);
  border: 1rpx solid var(--theme-border, $border-color);
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
  background: var(--theme-surface, rgba(255,255,255,0.9));
  border: 1rpx solid var(--theme-border, $border-color);
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
    background: var(--accent, $color-primary);
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
    color: var(--accent, $color-primary);
  }
  .daypack-section,
  .info-section,
  .preview-section {
    background: #eef2e7;
  }
  .daypack-pill.primary,
  .float-btn.rsvp {
    background: var(--accent, $color-primary);
  }
  .photo-thumb {
    border-radius: 8rpx;
  }
}

.theme-wine,
.theme-cinnabar,
.theme-indigo,
.theme-pine {
  background: var(--theme-page, $bg-color);

  .hero,
  .hero-image.default {
    background: var(--theme-hero-bg, #fcf6f0);
    opacity: 1;
  }

  .hero-image-main {
    filter: var(--theme-hero-filter, none);
  }

  .hero-gradient {
    background: var(--theme-hero-overlay);
  }

  .hero-gradient.default {
    background:
      linear-gradient(to bottom, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.08) 28%, rgba(48,22,28,0.16) 48%, rgba(58,24,32,0.48) 72%, rgba(255,255,255,0.96) 96%, #fff 100%);
  }

  .daypack-section,
  .preview-section,
  .info-section {
    background: var(--theme-page-soft, $bg-muted);
  }

  .invitation-section,
  .quick-section,
  .footer-section {
    background: var(--theme-page, $bg-color);
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
    color: var(--theme-ink, $text-primary);
  }

  .daypack-template,
  .mini-label,
  .preview-sub,
  .blessing-name,
  .couple-label,
  .info-sub,
  .info-label,
  .info-address,
  .quick-sub,
  .quick-en,
  .footer-sub,
  .quick-arrow {
    color: var(--theme-muted, $text-muted);
  }

  .daypack-kicker,
  .preview-more {
    color: var(--theme-accent, $color-primary);
  }

  .hero-divider,
  .daypack-pill.primary,
  .float-btn.rsvp,
  .couple-heart,
  .couple-heart::before,
  .couple-heart::after {
    background: var(--theme-accent, $color-primary);
    color: var(--theme-on-accent, #fff);
  }

  .daypack-card.primary {
    background: var(--theme-strong-bg, $text-primary);
    border-color: var(--theme-strong-border, transparent);
  }

  .daypack-label,
  .daypack-sub {
    color: var(--theme-strong-muted, rgba(255,255,255,0.68));
  }

  .daypack-value {
    color: var(--theme-strong-ink, #fff);
  }

  .daypack-action {
    background: var(--theme-strong-soft, rgba(255,255,255,0.14));
    color: var(--theme-strong-ink, #fff);
  }

  .daypack-mini,
  .daypack-pill,
  .info-icon-wrap {
    background: var(--theme-elevated, $bg-muted);
  }

  .preview-block,
  .info-list,
  .quick-item,
  .float-btn.share,
  .music-control {
    background: var(--theme-surface, $bg-surface);
    border-color: var(--theme-border, $border-color);
  }

  .header-line,
  .footer-line,
  .couple-line,
  .info-divider {
    background: var(--theme-border, $border-color);
  }

  .blessing-preview {
    border-top-color: var(--theme-border, $border-color);
  }
}

/* ========== 高级礼宴首页 v4 ========== */
.lux-home {
  min-height: 100vh;
  background:
    linear-gradient(180deg, var(--theme-page-soft, rgba(255,248,245,0.98)) 0%, var(--theme-page, #fff) 34%, var(--theme-page-soft, rgba(255,248,245,1)) 100%);
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
  bottom: 414rpx;
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
    linear-gradient(180deg, rgba(255,255,255,0.98) 0%, var(--theme-surface, #fff) 100%);
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
  background: var(--theme-accent, $color-primary);
  opacity: 0.68;
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
.lux-mini-label,
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
.lux-rsvp-chip {
  flex-shrink: 0;
  padding: 9rpx 16rpx;
  border-radius: $radius-sm;
  background: var(--theme-accent-soft, rgba(176,58,91,0.10));
  color: var(--theme-accent, $color-primary);
  font-size: 22rpx;
  font-weight: 600;
}
.lux-rsvp-chip.done {
  background: rgba(52,168,83,0.12);
  color: $color-success;
}
.lux-venue-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 22rpx;
  padding: 26rpx;
  background:
    linear-gradient(135deg, var(--theme-strong-bg, $text-primary) 0%, var(--theme-accent-deep, $color-primary-dark) 100%);
  border-radius: $card-radius;
  box-shadow: inset 0 1rpx 0 rgba(255,255,255,0.10), 0 10rpx 24rpx rgba(20,9,12,0.14);
}
.lux-venue-main {
  flex: 1;
  min-width: 0;
}
.lux-venue-name {
  display: block;
  margin-top: 8rpx;
  color: #fff;
  font-family: $font-serif;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.35;
  word-break: break-word;
}
.lux-venue-address {
  display: block;
  margin-top: 8rpx;
  color: rgba(255,255,255,0.68);
  font-size: 24rpx;
  line-height: 1.45;
  word-break: break-word;
}
.lux-nav-btn {
  width: 132rpx;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: $radius-sm;
  background: var(--theme-accent, $color-primary);
  color: var(--theme-on-accent, #fff);
  font-size: 26rpx;
  font-weight: 600;
  padding: 0;
}
.lux-nav-btn::after {
  border: none;
}
.lux-mini-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 16rpx;
}
.lux-mini-cell {
  min-width: 0;
  padding: 22rpx;
  border: 1rpx solid var(--theme-border, $border-light);
  border-radius: $radius-sm;
  background: var(--theme-panel-gradient, $bg-elevated);
}
.lux-mini-value {
  display: block;
  margin-top: 8rpx;
  color: var(--theme-ink, $text-primary);
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1.35;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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
  color: var(--theme-on-accent, #fff);
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
.lux-couple-line {
  width: 52rpx;
  height: 1rpx;
  background: var(--theme-accent, $color-primary);
  opacity: 0.34;
  flex-shrink: 0;
}
.lux-action-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 0 $page-gutter;
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
.lux-float-actions {
  position: fixed;
  z-index: 50;
  left: $page-gutter;
  right: $page-gutter;
  bottom: calc(18rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 14rpx;
  pointer-events: none;
}
.lux-float-btn {
  flex: 1;
  height: 82rpx;
  line-height: 82rpx;
  border-radius: $radius-sm;
  font-size: 26rpx;
  font-weight: 600;
  pointer-events: auto;
  padding: 0;
}
.lux-float-btn::after {
  border: none;
}
.lux-float-btn.rsvp {
  background: var(--theme-strong-bg, $text-primary);
  color: var(--theme-strong-ink, #fff);
}
.lux-float-btn.share {
  background: rgba(255,255,255,0.94);
  color: var(--theme-ink, $text-primary);
  border: 1rpx solid var(--theme-border, $border-color);
}
.lux-music-control {
  right: $page-gutter;
  bottom: calc(116rpx + env(safe-area-inset-bottom));
}
</style>
