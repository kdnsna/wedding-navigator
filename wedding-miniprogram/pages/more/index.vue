<template>
  <PageShell
    title="更多"
    kicker="WEDDING MENU"
    :desc="`${coupleName || '新人婚礼'} · ${formatDate(weddingDate) || '良辰待定'}`"
    :theme-class="templateClass"
  >
    <view class="more-feature">
      <view class="more-seal">囍</view>
      <text class="more-feature-kicker">甜囍手册</text>
      <text class="more-feature-title">{{ coupleName || '我们的婚礼' }}</text>
      <text class="more-feature-desc">请柬、路书、流程、回执和祝福都已经为宾客整理好。</text>
      <button class="more-share-btn" open-type="share">分享给好友</button>
    </view>

    <view class="more-alert" v-if="loadError">
      <image class="more-alert-icon" src="/static/visuals/icon-warning.svg" mode="aspectFit" />
      <text class="more-alert-copy">{{ loadError }}</text>
      <button class="more-alert-btn" :loading="loading" :disabled="loading" @click="reloadWedding">重试</button>
    </view>

    <view class="more-group">
      <ActionCard v-if="isRsvpEnabled" title="出席回执" desc="确认是否到场、人数、到达时间和饮食偏好" icon="/static/visuals/icon-rsvp.svg" @click="goToRSVP" />
      <ActionCard v-if="isBlessingEnabled" title="祝福墙" desc="留下给新人的祝福，也可以查看公开留言" icon="/static/visuals/icon-blessing.svg" @click="goToBlessing" />
      <ActionCard title="婚礼路书" desc="主场地、停车、住宿、天气和导航入口" icon="/static/visuals/icon-guide.svg" status="到场必看" @click="goToGuide" />
      <ActionCard v-if="isTimelineEnabled" title="婚礼流程" desc="按角色查看当天时间安排和正在进行的节点" icon="/static/visuals/icon-timeline.svg" @click="goToTimeline" />
      <ActionCard title="婚纱相册" desc="查看新人精选影像和婚礼封面照片" icon="/static/visuals/icon-album.svg" @click="goToAlbum" />
    </view>

    <view class="more-group">
      <ActionCard v-if="userStore.canEdit" title="主人书案" desc="编辑请柬、查看回执和整理分享" icon="/static/visuals/icon-manage.svg" status="主人" @click="goToManage" />
    </view>

    <button class="more-contact-inline" open-type="contact">需要协助，可联系甜囍手册</button>

    <navigator class="promo-link" url="/pages-owner/wizard/index" open-type="navigate">
      <text>由甜囍手册生成 · 我也要制作</text>
    </navigator>
  </PageShell>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { formatDate } from '@/utils/index.js'
import { fetchWedding, recordShare } from '@/composables/useCloud.js'
import PageShell from '@/components/ui/PageShell.vue'
import ActionCard from '@/components/ui/ActionCard.vue'

const store = useWeddingStore()
const userStore = useUserStore()
const loading = ref(false)
const loadError = ref('')

const coupleName = computed(() => store.coupleName)
const weddingDate = computed(() => store.weddingDate)
const templateClass = computed(() => store.templateClass)
const isRsvpEnabled = computed(() => store.isRsvpEnabled)
const isBlessingEnabled = computed(() => store.isBlessingEnabled)
const isTimelineEnabled = computed(() => store.isTimelineEnabled)

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
function goToGuide() { switchTabOrToast('/pages/guide/index', '打开路书') }
function goToTimeline() {
  if (!isTimelineEnabled.value) {
    uni.showToast({ title: '新人暂未开放婚礼流程', icon: 'none' })
    return
  }
  switchTabOrToast('/pages/timeline/index', '打开流程')
}
function goToAlbum() { switchTabOrToast('/pages/album/index', '打开相册') }
function goToManage() { navigateOrToast('/pages-owner/manage/index', '打开管理后台') }

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

function getSharePath() {
  return userStore.weddingId ? `/pages/index/index?id=${encodeURIComponent(userStore.weddingId)}` : '/pages/index/index'
}

function trackShare() {
  if (userStore.weddingId) {
    recordShare(userStore.weddingId).catch((err) => {
      console.warn('更多页分享记录失败:', err)
    })
  }
}

async function reloadWedding() {
  if (!userStore.weddingId || loading.value) return
  loading.value = true
  loadError.value = ''
  try {
    await fetchWedding(userStore.weddingId, true)
  } catch (err) {
    console.warn('更多页加载婚礼失败:', err)
    loadError.value = err?.message || '婚礼信息加载失败，请稍后重试。'
    uni.showToast({ title: '婚礼信息加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onShareAppMessage(() => {
  trackShare()
  return {
    title: `${coupleName.value || '甜囍手册'}的婚礼邀请`,
    path: getSharePath()
  }
})

onShareTimeline(() => {
  trackShare()
  return {
    title: `${coupleName.value || '甜囍手册'}的婚礼邀请`,
    query: userStore.weddingId ? `id=${encodeURIComponent(userStore.weddingId)}` : ''
  }
})

onShow(async () => {
  if (userStore.weddingId && !store.wedding?._id && !store.wedding?.wedding_id) {
    await reloadWedding()
  }
})
</script>

<style lang="scss" scoped>
.page {
  background-color: var(--theme-page, $bg-color);
  color: var(--theme-ink, $text-primary);
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}

/* 顶部标题 */
.page-header {
  padding: $page-header-top $page-gutter 24rpx;
}
.page-tag {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 0;
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
  padding: 24rpx $page-gutter 48rpx;
}
.couple-name {
  display: block;
  font-size: $font-h2;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 8rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.couple-date {
  display: block;
  font-size: $font-body;
  color: $text-secondary;
}

/* 菜单组 */
.menu-group {
  margin: 0 $page-gutter 24rpx;
  background: $bg-surface;
  border-radius: $card-radius;
  overflow: hidden;
}
.menu-item {
  display: flex;
  align-items: center;
  min-height: $tap-min-height;
  padding: 28rpx;
  transition: background 0.15s ease;
}
.menu-item:active {
  background: $bg-muted;
}
.contact-btn {
  background: transparent;
  border: none;
  padding: 28rpx;
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
  min-width: 0;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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
  padding: 40rpx $page-gutter 24rpx;
}
.share-btn {
  width: 100%;
  height: $control-height;
  line-height: $control-height;
  text-align: center;
  border-radius: $radius-full;
  background: $text-primary;
  color: $ink-inverse;
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

.more-alert {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin: 0 $page-gutter 24rpx;
  padding: 18rpx 20rpx;
  border-radius: $card-radius;
  background: $gold-soft;
  border: 1rpx solid rgba(201,169,110,0.24);
}
.more-alert-icon {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
}
.more-alert-copy {
  flex: 1;
  min-width: 0;
  color: $gold;
  font-size: 23rpx;
  line-height: 1.45;
}
.more-alert-btn {
  flex-shrink: 0;
  min-width: 104rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  padding: 0 18rpx;
  border-radius: $radius-sm;
  background: $text-primary;
  color: $ink-inverse;
  font-size: 23rpx;
}
.more-alert-btn::after {
  border: none;
}

.theme-wine,
.theme-cinnabar,
.theme-indigo,
.theme-pine {
  background: var(--theme-page, $bg-color);
  color: var(--theme-ink, $text-primary);

  .page-title,
  .couple-name,
  .menu-title {
    color: var(--theme-ink, $text-primary);
  }

  .page-tag,
  .couple-date,
  .menu-arrow,
  .promo-link {
    color: var(--theme-muted, $text-muted);
  }

  .menu-group {
    background: var(--theme-surface, $bg-surface);
    border: 1rpx solid var(--theme-border, $border-color);
  }

  .menu-item:active {
    background: var(--theme-elevated, $bg-muted);
  }

  .divider {
    background: var(--theme-border, $border-color);
  }

  .share-btn {
    background: var(--theme-accent, $text-primary);
    color: var(--theme-on-accent, $ink-inverse);
  }
}

.more-feature {
  position: relative;
  margin: 0 $page-gutter 28rpx;
  padding: 34rpx 32rpx 32rpx;
  border-radius: $card-radius;
  background: var(--theme-surface, $paper-card);
  color: var(--theme-ink, $text-primary);
  border: 1rpx solid var(--theme-border, $border-light);
  box-shadow: $shadow-sm;
  overflow: hidden;
}
.more-feature::before {
  content: "";
  position: absolute;
  left: 0;
  top: 28rpx;
  bottom: 28rpx;
  width: 4rpx;
  background: var(--theme-accent, $color-primary);
  border-radius: 2rpx;
}
.more-seal {
  position: absolute;
  right: 28rpx;
  top: 26rpx;
  width: 54rpx;
  height: 54rpx;
  border-radius: $radius-full;
  background: var(--theme-accent, $color-primary);
  color: var(--theme-on-accent, $ink-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: $font-serif;
  font-size: 24rpx;
  box-shadow: 0 4rpx 16rpx var(--theme-accent-glow, rgba(176,58,91,0.26));
}
.more-feature-kicker {
  display: block;
  color: $gold;
  font-size: 20rpx;
  font-weight: 600;
  letter-spacing: $ls-wide;
  text-transform: uppercase;
}
.more-feature-title {
  display: block;
  margin-top: 12rpx;
  font-family: $font-serif;
  font-size: 42rpx;
  font-weight: 600;
  line-height: 1.2;
  color: var(--theme-ink, $text-primary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.more-feature-desc {
  display: block;
  margin-top: 14rpx;
  color: var(--theme-muted, $text-muted);
  font-size: 26rpx;
  line-height: 1.5;
  padding-right: 74rpx;
}
.more-share-btn {
  margin-top: 26rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-sm;
  background: var(--theme-accent, $color-primary);
  color: var(--theme-on-accent, $ink-inverse);
  font-size: 26rpx;
  font-weight: 600;
}
.more-share-btn::after {
  border: none;
}
.more-group {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 0 $page-gutter;
  margin-bottom: 28rpx;
}
.more-contact-inline {
  display: block;
  margin: 4rpx auto 16rpx;
  padding: 0;
  width: auto;
  background: transparent;
  color: var(--theme-muted, $ink-faint);
  font-size: 22rpx;
  line-height: 1.6;
  text-align: center;
}
.more-contact-inline::after {
  border: none;
}
</style>
