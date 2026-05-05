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
      <view class="section-header">
        <text class="section-title">RSVP 统计</text>
        <text class="section-count">{{ rsvpStats.total }}人</text>
      </view>
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
          <view class="diet-icon">🍽️</view>
          <text class="diet-label">普通</text>
          <text class="diet-value">{{ dietStats.normal }}人</text>
        </view>
        <view class="diet-item">
          <view class="diet-icon">🥗</view>
          <text class="diet-label">素食</text>
          <text class="diet-value">{{ dietStats.vegetarian }}人</text>
        </view>
        <view class="diet-item">
          <view class="diet-icon">🥙</view>
          <text class="diet-label">清真</text>
          <text class="diet-value">{{ dietStats.halal }}人</text>
        </view>
        <view class="diet-item">
          <view class="diet-icon">🥡</view>
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
/* ========== 数据统计 ========== */
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 30rpx;
}

/* ===== 概览卡片 ===== */
.overview-card {
  display: flex;
  justify-content: space-around;
  background: $gradient-primary;
  border-radius: 32rpx;
  padding: 44rpx;
  margin-bottom: 30rpx;
  box-shadow: $shadow-lg;
  position: relative;
  overflow: hidden;
  animation: fadeInScale 0.5s $ease-out both;
}
.overview-card::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -15%;
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
}
.overview-item {
  text-align: center;
  color: #fff;
  position: relative;
  z-index: 1;
}
.overview-num {
  display: block;
  font-size: 52rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
  font-variant-numeric: tabular-nums;
}
.overview-label {
  font-size: 24rpx;
  opacity: 0.85;
  letter-spacing: 2rpx;
}

/* ===== 区块标题 ===== */
.section {
  margin-bottom: 30rpx;
  animation: fadeInUp 0.5s $ease-out both;
  opacity: 0;
}
.section:nth-child(2) { animation-delay: 0.1s; }
.section:nth-child(3) { animation-delay: 0.2s; }
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}
.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
  letter-spacing: 2rpx;
}
.section-count {
  font-size: 24rpx;
  color: $text-muted;
}

/* ===== 图表卡片 ===== */
.chart-card {
  background: $bg-surface;
  border-radius: 28rpx;
  padding: 36rpx;
  box-shadow: $shadow-md;
  border: 1rpx solid $border-light;
}
.chart-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 24rpx;
}
.chart-row:last-child {
  margin-bottom: 0;
}
.chart-bar {
  flex: 1;
  height: 28rpx;
  background: $bg-muted;
  border-radius: 14rpx;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 14rpx;
  transition: width 0.6s $ease-out;
}
.bar-fill.attending { background: linear-gradient(90deg, $rsvp-attending, lighten($rsvp-attending, 15%)); }
.bar-fill.uncertain { background: linear-gradient(90deg, $rsvp-uncertain, lighten($rsvp-uncertain, 15%)); }
.bar-fill.declined { background: linear-gradient(90deg, $rsvp-declined, lighten($rsvp-declined, 15%)); }
.bar-fill.pending { background: linear-gradient(90deg, $rsvp-pending, lighten($rsvp-pending, 15%)); }

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
  font-variant-numeric: tabular-nums;
}

/* ===== 饮食统计 ===== */
.diet-card {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}
.diet-item {
  background: $bg-surface;
  border-radius: 28rpx;
  padding: 36rpx;
  text-align: center;
  box-shadow: $shadow-sm;
  border: 1rpx solid $border-light;
  transition: all 0.25s $ease-out;
}
.diet-item:active {
  transform: translateY(-2rpx);
  box-shadow: $shadow-md;
}
.diet-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
}
.diet-label {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  margin-bottom: 10rpx;
}
.diet-value {
  font-size: 38rpx;
  font-weight: 700;
  color: $color-primary;
  font-variant-numeric: tabular-nums;
}
</style>
