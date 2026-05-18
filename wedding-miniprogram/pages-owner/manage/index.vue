<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">DASHBOARD</text>
      <text class="page-title">管理后台</text>
    </view>

    <!-- 婚礼信息 -->
    <view class="couple-bar">
      <view class="couple-meta">
        <text class="couple-name">{{ coupleName }}</text>
        <text class="couple-date">{{ formatDate(weddingDate) }}</text>
      </view>
      <view class="status-tag" :class="weddingStatus">{{ statusText }}</view>
    </view>

    <!-- 发布准备 -->
    <view class="readiness-card">
      <view class="readiness-head">
        <view>
          <text class="readiness-kicker">PUBLISH READY</text>
          <text class="readiness-title">发布准备度</text>
        </view>
        <text class="readiness-score">{{ checklist.percent }}%</text>
      </view>
      <view class="readiness-bar">
        <view class="readiness-fill" :style="{ width: checklist.percent + '%' }" />
      </view>
      <view class="readiness-summary">
        <text>{{ readinessSummary }}</text>
      </view>
      <view class="readiness-list">
        <view
          class="readiness-item"
          v-for="item in checklist.items"
          :key="item.key"
          @click="goToRoute(item.route)"
        >
          <view class="readiness-dot" :class="{ done: item.done }" />
          <view class="readiness-meta">
            <text class="readiness-item-title">{{ item.title }}</text>
            <text class="readiness-item-desc">{{ item.desc }}</text>
          </view>
          <text class="readiness-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 数据概览 -->
    <view class="stats-row">
      <view class="stat-item">
        <text class="stat-num">{{ stats.views }}</text>
        <text class="stat-label">浏览</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ stats.shares }}</text>
        <text class="stat-label">分享</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ stats.rsvp }}</text>
        <text class="stat-label">RSVP</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ stats.blessings }}</text>
        <text class="stat-label">祝福</text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-group">
      <view class="menu-item" @click="goTo('invitation/edit')">
        <text class="menu-title">婚书编辑</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goTo('album/manage')">
        <text class="menu-title">相册管理</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goTo('guide/edit')">
        <text class="menu-title">路书设置</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goTo('timeline/edit')">
        <text class="menu-title">流程编辑</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goTo('guests/manage')">
        <text class="menu-title">宾客管理</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goTo('blessing/manage')">
        <text class="menu-title">祝福管理</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goTo('share/index')">
        <text class="menu-title">分享设置</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goTo('stats/index')">
        <text class="menu-title">数据统计</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-actions">
      <button class="action-btn primary" @click="previewWedding">预览效果</button>
      <button class="action-btn" @click="shareWedding">分享邀请</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { formatDate } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { fetchWedding, getStats } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()

const coupleName = computed(() => store.coupleName)
const weddingDate = computed(() => store.weddingDate)
const weddingStatus = computed(() => store.wedding?.status || 'draft')
const checklist = computed(() => store.publishChecklist)
const readinessSummary = computed(() => {
  const left = checklist.value.total - checklist.value.doneCount
  if (checklist.value.ready) return '发布项已齐，可以放心分享给宾客'
  return `还差 ${left} 项，补齐后首页、回执、路线和分享链路会更完整`
})

const statusText = computed(() => {
  const map = { draft: '草稿', published: '已发布', ended: '已结束' }
  return map[weddingStatus.value] || '草稿'
})

const stats = computed(() => {
  const s = store.wedding?.stats || {}
  return {
    views: s.views || 0,
    shares: s.shares || 0,
    rsvp: s.rsvp_count || 0,
    blessings: s.blessing_count || 0
  }
})

function goTo(path) {
  uni.navigateTo({ url: `/pages-owner/${path}` })
}
function goToRoute(route) {
  uni.navigateTo({ url: route })
}
function previewWedding() {
  uni.switchTab({ url: '/pages/index/index' })
}
function shareWedding() {
  uni.navigateTo({ url: '/pages-owner/share/index' })
}

onShow(async () => {
  if (!useOwnerGuard()) return
  try {
    await fetchWedding(userStore.weddingId)
    const res = await getStats(userStore.weddingId)
    if (res?.stats) {
      store.wedding.stats = {
        views: res.stats.views || 0,
        shares: res.stats.shares || 0,
        rsvp_count: res.stats.rsvp?.total || 0,
        blessing_count: res.stats.blessings || 0,
        unique_viewers: res.stats.unique_viewers || 0
      }
    }
  } catch (err) {
    console.warn('管理后台数据加载失败:', err)
  }
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: 60rpx;
}

/* 顶部标题 */
.page-header {
  padding: 60rpx 48rpx 24rpx;
}
.page-tag {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 6rpx;
  margin-bottom: 12rpx;
}
.page-title {
  display: block;
  font-size: $font-h1;
  font-weight: 600;
  color: $text-primary;
}

/* 婚礼信息 */
.couple-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 48rpx 40rpx;
}
.couple-name {
  display: block;
  font-size: $font-h2;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 8rpx;
}
.couple-date {
  display: block;
  font-size: $font-body;
  color: $text-secondary;
}
.status-tag {
  padding: 8rpx 20rpx;
  border-radius: 6rpx;
  font-size: 22rpx;
  background: $bg-muted;
  color: $text-secondary;
  font-weight: 500;
}
.status-tag.published {
  background: $color-success;
  color: #fff;
}

/* 发布准备 */
.readiness-card {
  margin: 0 48rpx 40rpx;
  padding: 32rpx;
  border-radius: $radius-lg;
  background: $text-primary;
  color: #fff;
}
.readiness-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 24rpx;
}
.readiness-kicker {
  display: block;
  font-size: 18rpx;
  color: rgba(255,255,255,0.55);
  letter-spacing: 5rpx;
  margin-bottom: 8rpx;
}
.readiness-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
}
.readiness-score {
  font-size: 48rpx;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.readiness-bar {
  height: 8rpx;
  border-radius: 4rpx;
  background: rgba(255,255,255,0.16);
  overflow: hidden;
  margin-bottom: 22rpx;
}
.readiness-fill {
  height: 100%;
  border-radius: 4rpx;
  background: $color-primary-light;
  transition: width 0.45s ease;
}
.readiness-summary {
  padding: 18rpx 22rpx;
  margin-bottom: 14rpx;
  border-radius: $radius-lg;
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.78);
  font-size: 24rpx;
  line-height: 1.45;
}
.readiness-list {
  display: flex;
  flex-direction: column;
}
.readiness-item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 20rpx 0;
  border-top: 1rpx solid rgba(255,255,255,0.08);
}
.readiness-dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255,255,255,0.36);
  flex-shrink: 0;
}
.readiness-dot.done {
  background: $color-success;
  border-color: $color-success;
}
.readiness-meta {
  flex: 1;
  min-width: 0;
}
.readiness-item-title {
  display: block;
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
  margin-bottom: 4rpx;
}
.readiness-item-desc {
  display: block;
  font-size: 22rpx;
  color: rgba(255,255,255,0.62);
  line-height: 1.4;
}
.readiness-arrow {
  color: rgba(255,255,255,0.45);
  font-size: 34rpx;
}

/* 数据概览 */
.stats-row {
  display: flex;
  padding: 0 48rpx;
  margin-bottom: 48rpx;
}
.stat-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
}
.stat-num {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: $text-primary;
  font-variant-numeric: tabular-nums;
  margin-bottom: 8rpx;
}
.stat-label {
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 2rpx;
}

/* 功能菜单 */
.menu-group {
  margin: 0 48rpx;
  background: $bg-surface;
  border-radius: $radius-lg;
  overflow: hidden;
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx 28rpx;
}
.menu-item:active {
  background: $bg-muted;
}
.menu-title {
  flex: 1;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
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

/* 底部操作 */
.bottom-actions {
  padding: 48rpx;
  display: flex;
  gap: 16rpx;
}
.action-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: $radius-full;
  background: $bg-muted;
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
  transition: opacity 0.2s ease;
}
.action-btn::after { border: none; }
.action-btn:active { opacity: 0.8; }
.action-btn.primary {
  background: $text-primary;
  color: #fff;
}
</style>
