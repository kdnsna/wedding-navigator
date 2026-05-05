<template>
  <view class="page">
    <!-- 数据概览 -->
    <view class="overview-card">
      <view class="overview-item">
        <text class="overview-num">{{ stats.views }}</text>
        <text class="overview-label">总浏览</text>
      </view>
      <view class="overview-item">
        <text class="overview-num">{{ stats.shares }}</text>
        <text class="overview-label">分享次数</text>
      </view>
      <view class="overview-item">
        <text class="overview-num">{{ stats.uniqueViewers }}</text>
        <text class="overview-label">独立访客</text>
      </view>
    </view>

    <!-- RSVP统计 -->
    <view class="section">
      <text class="section-title">RSVP 统计</text>
      <view class="chart-card">
        <view class="chart-row">
          <view class="chart-bar">
            <view class="bar-fill attending" :style="{ width: attendingPercent + '%' }"></view>
          </view>
          <view class="chart-info">
            <text class="chart-label">出席</text>
            <text class="chart-value">{{ rsvpStats.attending }}人</text>
          </view>
        </view>
        <view class="chart-row">
          <view class="chart-bar">
            <view class="bar-fill uncertain" :style="{ width: uncertainPercent + '%' }"></view>
          </view>
          <view class="chart-info">
            <text class="chart-label">待定</text>
            <text class="chart-value">{{ rsvpStats.uncertain }}人</text>
          </view>
        </view>
        <view class="chart-row">
          <view class="chart-bar">
            <view class="bar-fill declined" :style="{ width: declinedPercent + '%' }"></view>
          </view>
          <view class="chart-info">
            <text class="chart-label">缺席</text>
            <text class="chart-value">{{ rsvpStats.declined }}人</text>
          </view>
        </view>
        <view class="chart-row">
          <view class="chart-bar">
            <view class="bar-fill pending" :style="{ width: pendingPercent + '%' }"></view>
          </view>
          <view class="chart-info">
            <text class="chart-label">未填写</text>
            <text class="chart-value">{{ rsvpStats.pending }}人</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 饮食统计 -->
    <view class="section">
      <text class="section-title">饮食偏好</text>
      <view class="diet-card">
        <view class="diet-item">
          <text class="diet-label">普通</text>
          <text class="diet-value">{{ dietStats.normal }}人</text>
        </view>
        <view class="diet-item">
          <text class="diet-label">素食</text>
          <text class="diet-value">{{ dietStats.vegetarian }}人</text>
        </view>
        <view class="diet-item">
          <text class="diet-label">清真</text>
          <text class="diet-value">{{ dietStats.halal }}人</text>
        </view>
        <view class="diet-item">
          <text class="diet-label">其他</text>
          <text class="diet-value">{{ dietStats.other }}人</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'

const store = useWeddingStore()

const stats = computed(() => store.wedding?.stats || {})
const rsvpStats = computed(() => store.rsvpStats)

const total = computed(() => rsvpStats.value.total || 1)
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

onShow(() => {})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 30rpx;
}

.overview-card {
  display: flex;
  justify-content: space-around;
  background: linear-gradient(135deg, $color-primary 0%, #E91E63 100%);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
}
.overview-item {
  text-align: center;
  color: #fff;
}
.overview-num {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}
.overview-label {
  font-size: 24rpx;
  opacity: 0.9;
}

.section {
  margin-bottom: 30rpx;
}
.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 20rpx;
}

.chart-card {
  background: $bg-surface;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: $shadow-sm;
}
.chart-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
}
.chart-row:last-child {
  margin-bottom: 0;
}
.chart-bar {
  flex: 1;
  height: 24rpx;
  background: $bg-muted;
  border-radius: 12rpx;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 12rpx;
  transition: width 0.5s ease;
}
.bar-fill.attending { background: $rsvp-attending; }
.bar-fill.uncertain { background: $rsvp-uncertain; }
.bar-fill.declined { background: $rsvp-declined; }
.bar-fill.pending { background: $rsvp-pending; }

.chart-info {
  display: flex;
  gap: 16rpx;
  width: 180rpx;
  justify-content: flex-end;
}
.chart-label {
  font-size: 26rpx;
  color: $text-secondary;
}
.chart-value {
  font-size: 26rpx;
  font-weight: 500;
  color: $text-primary;
  min-width: 80rpx;
  text-align: right;
}

.diet-card {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}
.diet-item {
  background: $bg-surface;
  border-radius: 20rpx;
  padding: 30rpx;
  text-align: center;
  box-shadow: $shadow-sm;
}
.diet-label {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  margin-bottom: 10rpx;
}
.diet-value {
  font-size: 36rpx;
  font-weight: 700;
  color: $color-primary;
}
</style>
