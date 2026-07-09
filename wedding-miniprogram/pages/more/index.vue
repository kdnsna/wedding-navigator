<template>
  <PageShell
    title="更多"
    kicker="WEDDING MENU"
    :desc="`${coupleName || '新人婚礼'} · ${formatDate(weddingDate) || '婚期待公布'}`"
    :theme-class="templateClass"
  >
    <view class="more-feature">
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
      <ActionCard title="婚礼路书" desc="主场地、停车、住宿、天气和导航入口" icon="/static/visuals/icon-guide.svg" tone="primary" status="到场必看" @click="goToGuide" />
      <ActionCard v-if="isTimelineEnabled" title="婚礼流程" desc="按角色查看当天时间安排和正在进行的节点" icon="/static/visuals/icon-timeline.svg" @click="goToTimeline" />
      <ActionCard title="婚纱相册" desc="查看新人精选影像和婚礼封面照片" icon="/static/visuals/icon-album.svg" @click="goToAlbum" />
    </view>

    <view class="more-group">
      <ActionCard v-if="userStore.canEdit" title="管理后台" desc="返回主人端编辑、发布、分享和查看统计" icon="/static/visuals/icon-manage.svg" status="主人" @click="goToManage" />
      <button class="more-contact" open-type="contact">
        <image class="more-contact-icon" src="/static/visuals/icon-phone.svg" mode="aspectFit" />
        <text class="more-contact-title">联系客服</text>
        <image class="more-contact-arrow" src="/static/visuals/icon-chevron-right.svg" mode="aspectFit" />
      </button>
    </view>

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
  color: #fff;
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
  background: #FFF7E6;
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
  color: #8F6100;
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
  color: #fff;
  font-size: 23rpx;
}
.more-alert-btn::after {
  border: none;
}

.tpl-champagne {
  background: #fbf7f1;
  .menu-group {
    border: 1rpx solid rgba(164,120,59,0.14);
  }
  .share-btn {
    background: var(--accent, $color-primary);
  }
}
.tpl-noir {
  background: #111;
  .page-title,
  .couple-name,
  .menu-title {
    color: #fff;
  }
  .couple-date,
  .promo-link {
    color: rgba(255,255,255,0.62);
  }
  .menu-group {
    background: #191919;
    border: 1rpx solid rgba(201,169,110,0.16);
  }
  .divider {
    background: rgba(201,169,110,0.12);
  }
  .share-btn {
    background: $color-gold;
    color: #111;
  }
}
.tpl-garden {
  background: #f5f6ef;
  .menu-group {
    border: 1rpx solid rgba(80,98,71,0.12);
  }
  .share-btn {
    background: var(--accent, $color-primary);
  }
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
    color: var(--theme-on-accent, #fff);
  }
}

.more-feature {
  margin: 0 $page-gutter 28rpx;
  padding: 32rpx;
  border-radius: $card-radius;
  background: $text-primary;
  color: #fff;
  box-shadow: $shadow-lg;
}
.more-feature-kicker {
  display: block;
  color: rgba(255,255,255,0.54);
  font-size: 20rpx;
  font-weight: 600;
  letter-spacing: 0;
}
.more-feature-title {
  display: block;
  margin-top: 12rpx;
  font-family: $font-serif;
  font-size: 42rpx;
  font-weight: 600;
  line-height: 1.2;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.more-feature-desc {
  display: block;
  margin-top: 14rpx;
  color: rgba(255,255,255,0.72);
  font-size: 26rpx;
  line-height: 1.5;
}
.more-share-btn {
  margin-top: 26rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-sm;
  background: #fff;
  color: $text-primary;
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
.more-contact {
  display: flex;
  align-items: center;
  gap: 20rpx;
  min-height: 112rpx;
  padding: 24rpx;
  border-radius: $card-radius;
  border: 1rpx solid $border-light;
  background: #fff;
  box-shadow: $shadow-sm;
  line-height: 1;
  text-align: left;
  box-sizing: border-box;
}
.more-contact::after {
  border: none;
}
.more-contact-icon {
  width: 42rpx;
  height: 42rpx;
  flex-shrink: 0;
}
.more-contact-title {
  flex: 1;
  color: $text-primary;
  font-size: 28rpx;
  font-weight: 600;
}
.more-contact-arrow {
  width: 30rpx;
  height: 30rpx;
  opacity: 0.56;
}
</style>
