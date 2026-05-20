<template>
  <view class="page" :class="templateClass">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">MORE</text>
      <text class="page-title">更多</text>
    </view>

    <!-- 新人信息 -->
    <view class="couple-info">
      <text class="couple-name">{{ coupleName }}</text>
      <text class="couple-date">{{ formatDate(weddingDate) }}</text>
    </view>

    <!-- 功能列表 -->
    <view class="menu-group">
      <view class="menu-item" v-if="isRsvpEnabled" @click="goToRSVP">
        <image class="visual-icon menu-icon" src="/static/visuals/icon-rsvp.svg" mode="aspectFit" />
        <text class="menu-title">出席回执</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" v-if="isRsvpEnabled && isBlessingEnabled" />
      <view class="menu-item" v-if="isBlessingEnabled" @click="goToBlessing">
        <image class="visual-icon menu-icon" src="/static/visuals/icon-blessing.svg" mode="aspectFit" />
        <text class="menu-title">祝福墙</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" v-if="isBlessingEnabled" />
      <view class="menu-item" @click="goToGuide">
        <image class="visual-icon menu-icon" src="/static/visuals/icon-guide.svg" mode="aspectFit" />
        <text class="menu-title">婚礼路书</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" v-if="isTimelineEnabled" />
      <view class="menu-item" v-if="isTimelineEnabled" @click="goToTimeline">
        <image class="visual-icon menu-icon" src="/static/visuals/icon-timeline.svg" mode="aspectFit" />
        <text class="menu-title">婚礼流程</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" v-if="isTimelineEnabled" />
      <view class="menu-item" @click="goToAlbum">
        <image class="visual-icon menu-icon" src="/static/visuals/icon-album.svg" mode="aspectFit" />
        <text class="menu-title">婚纱相册</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <view class="menu-group">
      <view class="menu-item" v-if="userStore.canEdit" @click="goToManage">
        <image class="visual-icon menu-icon" src="/static/visuals/icon-manage.svg" mode="aspectFit" />
        <text class="menu-title">管理后台</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" v-if="userStore.canEdit" />
      <button class="menu-item contact-btn" open-type="contact">
        <image class="visual-icon menu-icon" src="/static/visuals/icon-phone.svg" mode="aspectFit" />
        <text class="menu-title">联系客服</text>
        <text class="menu-arrow">›</text>
      </button>
    </view>

    <!-- 分享 -->
    <view class="share-area">
      <button class="share-btn" open-type="share">分享给好友</button>
    </view>

    <!-- 引流 -->
    <navigator class="promo-link" url="/pages-owner/wizard/index" open-type="navigate">
      <text>由甜囍手册生成 · 我也要制作</text>
    </navigator>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { formatDate } from '@/utils/index.js'
import { fetchWedding, recordShare } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()

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
  uni.navigateTo({ url: '/pages/rsvp/index' })
}
function goToBlessing() {
  if (!isBlessingEnabled.value) {
    uni.showToast({ title: '新人暂未开放祝福墙', icon: 'none' })
    return
  }
  uni.navigateTo({ url: '/pages/blessing/index' })
}
function goToGuide() { uni.switchTab({ url: '/pages/guide/index' }) }
function goToTimeline() {
  if (!isTimelineEnabled.value) {
    uni.showToast({ title: '新人暂未开放婚礼流程', icon: 'none' })
    return
  }
  uni.switchTab({ url: '/pages/timeline/index' })
}
function goToAlbum() { uni.switchTab({ url: '/pages/album/index' }) }
function goToManage() { uni.navigateTo({ url: '/pages-owner/manage/index' }) }

function getSharePath() {
  return userStore.weddingId ? `/pages/index/index?id=${userStore.weddingId}` : '/pages/index/index'
}

function trackShare() {
  if (userStore.weddingId) {
    recordShare(userStore.weddingId).catch(() => {})
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
    query: userStore.weddingId ? `id=${userStore.weddingId}` : ''
  }
})

onShow(async () => {
  if (userStore.weddingId && !store.wedding?._id && !store.wedding?.wedding_id) {
    try { await fetchWedding(userStore.weddingId) } catch (err) {}
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

.tpl-champagne {
  background: #fbf7f1;
  .menu-group {
    border: 1rpx solid rgba(164,120,59,0.14);
  }
  .share-btn {
    background: #A4783B;
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
    background: #506247;
  }
}

.theme-rose,
.theme-champagne,
.theme-noir,
.theme-garden,
.theme-heritage,
.theme-shandong,
.theme-travel {
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
</style>
