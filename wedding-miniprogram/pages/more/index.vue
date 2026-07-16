<template>
  <PageShell
    title="更多"
    kicker="AFTERWORD"
    :desc="guestStore.canRenderInvitation ? `${coupleName} · ${formatDate(weddingDate)}` : ''"
    :theme-class="templateClass"
  >
    <canvas canvas-id="shareCardCanvas" id="shareCardCanvas" class="share-card-canvas" />

    <EmptyState
      v-if="!guestStore.canRenderInvitation"
      title="这封信还没有抵达"
      desc="请从新人寄来的邀请进入。"
    />

    <template v-else>
    <view class="more-feature">
      <view class="more-seal">囍</view>
      <text class="more-feature-kicker">WEDDING LETTER</text>
      <text class="more-feature-title">{{ coupleName }}</text>
      <text class="more-feature-desc">把这一封邀请，转交给同样被惦念的人。</text>
      <button class="more-share-btn" open-type="share">分享给好友</button>
    </view>

    <view class="more-alert" v-if="loadError">
      <image class="more-alert-icon" src="/static/visuals/icon-warning.svg" mode="aspectFit" />
      <text class="more-alert-copy">{{ loadError }}</text>
      <button class="more-alert-btn" :loading="loading" :disabled="loading" @click="reloadWedding">重试</button>
    </view>

    <view class="more-group">
      <ActionCard v-if="isBlessingEnabled" title="祝福墙" desc="留下给新人的祝福，也可以查看公开留言" icon="/static/visuals/icon-blessing.svg" @click="goToBlessing" />
      <ActionCard title="珍藏海报" desc="生成一张可以留存的婚礼纪念海报" icon="/static/visuals/icon-poster.svg" @click="goToPoster" />
    </view>

    <view class="more-group">
      <ActionCard v-if="userStore.canEdit" title="主人书案" desc="编辑请柬、查看回执和整理分享" icon="/static/visuals/icon-manage.svg" status="主人" @click="goToManage" />
    </view>

    <button class="more-contact-inline" open-type="contact">需要协助，可联系甜囍手册</button>
    <navigator class="more-privacy" url="/pages/privacy/index">隐私保护指引</navigator>

    <navigator class="promo-link" url="/pages-owner/wizard/index" open-type="navigate">
      <text>由甜囍手册生成 · 我也要制作</text>
    </navigator>
    </template>
  </PageShell>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, ref } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { useGuestInvitationStore } from '@/stores/guest-invitation.js'
import { formatDate } from '@/utils/index.js'
import { DEFAULT_SHARE_IMAGE, generateWeddingShareCard } from '@/utils/shareCard.js'
import { fetchGuestInvitation, recordShare } from '@/composables/useCloud.js'
import PageShell from '@/components/ui/PageShell.vue'
import ActionCard from '@/components/ui/ActionCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const store = useWeddingStore()
const userStore = useUserStore()
const guestStore = useGuestInvitationStore()
const instance = getCurrentInstance()
const loading = ref(false)
const loadError = ref('')
const shareImageUrl = ref(DEFAULT_SHARE_IMAGE)

const coupleName = computed(() => store.coupleName)
const weddingDate = computed(() => store.weddingDate)
const templateClass = computed(() => store.templateClass)
const isBlessingEnabled = computed(() => store.isBlessingEnabled)
function goToBlessing() {
  if (!isBlessingEnabled.value) {
    uni.showToast({ title: '祝福这一章暂未启封', icon: 'none' })
    return
  }
  navigateOrToast('/pages/blessing/index', '打开祝福墙')
}
function goToPoster() { navigateOrToast('/pages/poster/index', '打开珍藏海报') }
function goToManage() { navigateOrToast('/pages-owner/manage/index', '打开主人书案') }

function routeFail(label, err) {
  console.warn(`${label}失败:`, err)
  uni.showToast({ title: `${label}失败，请稍后重试`, icon: 'none' })
}

function navigateOrToast(url, label) {
  uni.navigateTo({
    url,
    fail: (err) => routeFail(label, err)
  })
}

function getSharePath() {
  return guestStore.invitationId ? `/pages/index/index?id=${encodeURIComponent(guestStore.invitationId)}` : '/pages/index/index'
}

function trackShare() {
  if (guestStore.invitationId) {
    recordShare(guestStore.invitationId).catch((err) => {
      console.warn('更多页分享记录失败:', err)
    })
  }
}

async function reloadWedding() {
  if (!guestStore.invitationId || loading.value) return
  loading.value = true
  loadError.value = ''
  try {
    await fetchGuestInvitation(guestStore.invitationId)
    refreshShareImage()
  } catch (err) {
    console.warn('更多页加载婚礼失败:', err)
    loadError.value = '这一页暂时没翻开，请稍后重试。'
    uni.showToast({ title: '稍后再试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onShareAppMessage(() => {
  trackShare()
  return {
    title: store.wedding?.share_config?.title || `${coupleName.value}的婚礼邀请`,
    path: getSharePath(),
    imageUrl: shareImageUrl.value
  }
})

onShareTimeline(() => {
  trackShare()
  return {
    title: store.wedding?.share_config?.title || `${coupleName.value}的婚礼邀请`,
    query: guestStore.invitationId ? `id=${encodeURIComponent(guestStore.invitationId)}` : '',
    imageUrl: shareImageUrl.value
  }
})

async function refreshShareImage() {
  try {
    await nextTick()
    shareImageUrl.value = await generateWeddingShareCard({ instance, store })
  } catch (err) {
    console.warn('更多页分享卡生成失败:', err)
    shareImageUrl.value = DEFAULT_SHARE_IMAGE
  }
}

function enableShareMenu() {
  if (!guestStore.canRenderInvitation) return
  const task = uni.showShareMenu?.({
    menus: ['shareAppMessage', 'shareTimeline'],
    fail: (err) => console.warn('更多页分享菜单开启失败:', err)
  })
  if (task && typeof task.catch === 'function') {
    task.catch((err) => console.warn('更多页分享菜单请求未完成:', err))
  }
}

onLoad((options) => {
  const weddingId = String(options?.id || '')
  if (!weddingId) return
  const cached = guestStore.hydrate(weddingId)
  if (cached) store.setWeddingData(cached, weddingId)
})

onShow(async () => {
  if (guestStore.invitationId && store.cachedWeddingId !== guestStore.invitationId) {
    await reloadWedding()
  } else if (guestStore.canRenderInvitation) {
    refreshShareImage()
  }
  enableShareMenu()
})
</script>

<style lang="scss" scoped>
.page {
  background-color: var(--theme-page, $bg-color);
  color: var(--theme-ink, $text-primary);
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}
.share-card-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 500px;
  height: 400px;
  pointer-events: none;
}


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
  font-size: 24rpx;
  line-height: 1.45;
}
.more-alert-btn {
  flex-shrink: 0;
  min-width: 104rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  padding: 0 18rpx;
  border-radius: $radius-sm;
  background: $paper-card;
  color: $gold;
  border: 1rpx solid rgba(201,169,110,0.32);
  font-size: 24rpx;
}
.more-alert-btn::after {
  border: none;
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
  font-size: 24rpx;
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
  font-size: $fs-note;
  line-height: 1.6;
  text-align: center;
}
.more-contact-inline::after {
  border: none;
}
.more-privacy {
  display: block;
  padding: $sp-2;
  color: $ink-faint;
  font-size: $fs-note;
  text-align: center;
}
</style>
