<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">STATISTICS</text>
      <text class="page-title">数据统计</text>
    </view>

    <!-- 数据概览 -->
    <view class="overview-row">
      <view class="overview-item">
        <text class="overview-num">{{ stats.views || 0 }}</text>
        <text class="overview-label">总浏览</text>
      </view>
      <view class="overview-item">
        <text class="overview-num">{{ stats.shares || 0 }}</text>
        <text class="overview-label">分享次数</text>
      </view>
      <view class="overview-item">
        <text class="overview-num">{{ stats.unique_viewers || 0 }}</text>
        <text class="overview-label">独立访客</text>
      </view>
    </view>

    <!-- RSVP -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">RSVP</text>
        <text class="section-count">{{ rsvpStats.total }} 人</text>
      </view>
      <view class="chart-list">
        <view class="chart-item">
          <view class="chart-bar-bg">
            <view class="chart-bar-fill" :style="{ width: attendingPercent + '%' }" />
          </view>
          <view class="chart-meta">
            <text class="chart-label">出席</text>
            <text class="chart-value">{{ rsvpStats.attending }} 人</text>
          </view>
        </view>
        <view class="chart-item">
          <view class="chart-bar-bg">
            <view class="chart-bar-fill" :style="{ width: uncertainPercent + '%' }" />
          </view>
          <view class="chart-meta">
            <text class="chart-label">待定</text>
            <text class="chart-value">{{ rsvpStats.uncertain }} 人</text>
          </view>
        </view>
        <view class="chart-item">
          <view class="chart-bar-bg">
            <view class="chart-bar-fill" :style="{ width: declinedPercent + '%' }" />
          </view>
          <view class="chart-meta">
            <text class="chart-label">缺席</text>
            <text class="chart-value">{{ rsvpStats.declined }} 人</text>
          </view>
        </view>
        <view class="chart-item">
          <view class="chart-bar-bg">
            <view class="chart-bar-fill" :style="{ width: pendingPercent + '%' }" />
          </view>
          <view class="chart-meta">
            <text class="chart-label">未填写</text>
            <text class="chart-value">{{ rsvpStats.pending }} 人</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 饮食 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">饮食偏好</text>
      </view>
      <view class="diet-list">
        <view class="diet-item">
          <text class="diet-label">普通</text>
          <text class="diet-value">{{ dietStats.normal }} 人</text>
        </view>
        <view class="divider" />
        <view class="diet-item">
          <text class="diet-label">素食</text>
          <text class="diet-value">{{ dietStats.vegetarian }} 人</text>
        </view>
        <view class="divider" />
        <view class="diet-item">
          <text class="diet-label">清真</text>
          <text class="diet-value">{{ dietStats.halal }} 人</text>
        </view>
        <view class="divider" />
        <view class="diet-item">
          <text class="diet-label">其他</text>
          <text class="diet-value">{{ dietStats.other }} 人</text>
        </view>
      </view>
    </view>

    <!-- 到场方式 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">到场方式</text>
      </view>
      <view class="diet-list">
        <view class="diet-item" v-for="item in transportStats" :key="item.label">
          <text class="diet-label">{{ item.label }}</text>
          <text class="diet-value">{{ item.count }} 人</text>
        </view>
      </view>
    </view>

    <!-- 关系来源 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">关系来源</text>
      </view>
      <view class="diet-list">
        <view class="diet-item" v-for="item in relationshipStats" :key="item.label">
          <text class="diet-label">{{ item.label }}</text>
          <text class="diet-value">{{ item.count }} 人</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { fetchWedding, getStats } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()

const stats = computed(() => store.wedding?.stats || {})
const rsvpStats = computed(() => store.rsvpStats)

const total = computed(() => Math.max(rsvpStats.value.total || 1, 1))
const attendingPercent = computed(() => (rsvpStats.value.attending / total.value) * 100)
const uncertainPercent = computed(() => (rsvpStats.value.uncertain / total.value) * 100)
const declinedPercent = computed(() => (rsvpStats.value.declined / total.value) * 100)
const pendingPercent = computed(() => (rsvpStats.value.pending / total.value) * 100)

const dietStats = computed(() => {
  const guests = store.guests?.guests || []
  return {
    normal: guests.filter(g => g.diet_preference === 'normal' || !g.diet_preference).length,
    vegetarian: guests.filter(g => g.diet_preference === 'vegetarian').length,
    halal: guests.filter(g => g.diet_preference === 'halal').length,
    other: guests.filter(g => g.diet_preference === 'other').length
  }
})

function groupGuestsBy(field, fallback = '未填写') {
  const guests = store.guests?.guests || []
  const map = new Map()
  guests.forEach(guest => {
    const label = guest[field] || fallback
    map.set(label, (map.get(label) || 0) + 1)
  })
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

const transportStats = computed(() => groupGuestsBy('transport_mode'))
const relationshipStats = computed(() => groupGuestsBy('relationship'))

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
    console.warn('统计数据加载失败:', err)
  }
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}

.page-header {
  padding: $page-header-top $page-gutter $page-header-bottom;
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

/* 概览 */
.overview-row {
  display: flex;
  padding: 0 $page-gutter 48rpx;
}
.overview-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
}
.overview-num {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: $text-primary;
  font-variant-numeric: tabular-nums;
  margin-bottom: 8rpx;
}
.overview-label {
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 0;
}

/* 区块 */
.section {
  padding: 0 $page-gutter;
  margin-bottom: 48rpx;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}
.section-title {
  font-size: $font-h3;
  font-weight: 600;
  color: $text-primary;
}
.section-count {
  font-size: 24rpx;
  color: $text-muted;
}

/* 图表 */
.chart-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.chart-item {
  display: flex;
  align-items: center;
  gap: 24rpx;
}
.chart-bar-bg {
  width: 120rpx;
  height: 8rpx;
  background: $border-color;
  border-radius: 4rpx;
  overflow: hidden;
  flex-shrink: 0;
}
.chart-bar-fill {
  height: 100%;
  background: $text-primary;
  border-radius: 4rpx;
  transition: width 0.5s ease;
}
.chart-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}
.chart-label {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  color: $text-primary;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.chart-value {
  font-size: 26rpx;
  color: $text-secondary;
  font-weight: 500;
  flex-shrink: 0;
}

/* 饮食 */
.diet-list {
  background: $bg-surface;
  border-radius: $card-radius;
  overflow: hidden;
}
.diet-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx;
}
.diet-label {
  min-width: 0;
  font-size: 28rpx;
  color: $text-primary;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.diet-value {
  font-size: 26rpx;
  color: $text-secondary;
  font-weight: 500;
  flex-shrink: 0;
}

.divider {
  height: 1rpx;
  background: $border-color;
  margin: 0 28rpx;
}
</style>
