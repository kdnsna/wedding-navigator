<template>
  <view class="page">
    <!-- 日期和倒计时 -->
    <view class="timeline-header">
      <text class="header-date">{{ formatDate(weddingDate) }}</text>
      <text class="header-countdown" v-if="countdown && !countdown.isToday">
        距离婚礼还有 {{ countdown.days }} 天
      </text>
      <text class="header-countdown today" v-if="countdown?.isToday">
        🎉 今天是婚礼日
      </text>
    </view>

    <!-- 时间轴 -->
    <view class="timeline-body">
      <view
        class="timeline-item"
        v-for="(event, index) in events"
        :key="event.id"
        :class="getEventStatus(event.time)"
      >
        <view class="timeline-dot" />
        <view class="timeline-line" v-if="index < events.length - 1" />
        <view class="timeline-content">
          <view class="timeline-time">
            <text class="time-text">{{ event.time }}</text>
            <text class="time-badge" v-if="event.is_important">重要</text>
          </view>
          <text class="timeline-title">{{ event.title }}</text>
          <text class="timeline-venue" v-if="getVenueName(event.venue_id)">
            📍 {{ getVenueName(event.venue_id) }}
          </text>
          <text class="timeline-assignee" v-if="event.assignee_ids?.length">
            👤 {{ getAssignees(event.assignee_ids) }}
          </text>
          <text class="timeline-notes" v-if="event.notes">{{ event.notes }}</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="events.length === 0">
      <text class="empty-icon">📅</text>
      <text class="empty-text">暂无流程安排</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding } from '@/composables/useCloud.js'
import { formatDate } from '@/utils/index.js'

const store = useWeddingStore()
const userStore = useUserStore()

const weddingDate = computed(() => store.weddingDate)
const countdown = computed(() => store.countdown)
const events = computed(() => store.timeline?.events || [])
const venues = computed(() => store.venues?.venues || [])
const roles = computed(() => store.timeline?.roles || [])

function getVenueName(venueId) {
  if (!venueId) return ''
  const venue = venues.value.find(v => v.id === venueId)
  return venue?.name || ''
}

function getAssignees(assigneeIds) {
  if (!assigneeIds?.length) return ''
  return assigneeIds.map(id => {
    const role = roles.value.find(r => r.id === id)
    return role?.name || id
  }).join('、')
}

function getEventStatus(timeStr) {
  if (!timeStr) return ''
  const today = new Date()
  const weddingDay = new Date(weddingDate.value)
  
  // 如果不是婚礼当天，全部显示为 upcoming
  if (today.toDateString() !== weddingDay.toDateString()) {
    return 'upcoming'
  }
  
  const [h, m] = timeStr.split(':').map(Number)
  const eventTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m)
  const now = new Date()
  const diff = now - eventTime
  
  if (diff > 30 * 60 * 1000) return 'past'
  if (Math.abs(diff) <= 30 * 60 * 1000) return 'current'
  return 'upcoming'
}

onShow(async () => {
  if (userStore.weddingId && events.value.length === 0) {
    try {
      await fetchWedding(userStore.weddingId)
    } catch (err) {
      console.error('加载流程失败:', err)
    }
  }
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 30rpx;
}

.timeline-header {
  text-align: center;
  padding: 40rpx 0;
}
.header-date {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 10rpx;
}
.header-countdown {
  font-size: 28rpx;
  color: $text-secondary;
}
.header-countdown.today {
  color: $color-primary;
  font-weight: 700;
}

.timeline-body {
  position: relative;
  padding-left: 40rpx;
}

.timeline-item {
  position: relative;
  padding-bottom: 40rpx;
}

.timeline-dot {
  position: absolute;
  left: -40rpx;
  top: 10rpx;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: $border-color;
  border: 4rpx solid $bg-surface;
  z-index: 2;
}

.timeline-line {
  position: absolute;
  left: -32rpx;
  top: 30rpx;
  width: 4rpx;
  height: calc(100% + 20rpx);
  background: $border-light;
}

.timeline-content {
  background: $bg-surface;
  border-radius: 16rpx;
  padding: 24rpx 30rpx;
  box-shadow: $shadow-sm;
}

.timeline-time {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 10rpx;
}
.time-text {
  font-size: 32rpx;
  font-weight: 700;
  color: $color-primary;
}
.time-badge {
  padding: 4rpx 12rpx;
  background: rgba(196, 30, 58, 0.1);
  color: $color-primary;
  font-size: 20rpx;
  border-radius: 6rpx;
}

.timeline-title {
  display: block;
  font-size: 30rpx;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 8rpx;
}
.timeline-venue,
.timeline-assignee,
.timeline-notes {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 6rpx;
}

/* 状态样式 */
.timeline-item.current .timeline-dot {
  background: $color-primary;
  box-shadow: 0 0 0 8rpx rgba(196, 30, 58, 0.2);
}
.timeline-item.current .timeline-content {
  border: 2rpx solid $color-primary;
}

.timeline-item.past .timeline-dot {
  background: $text-muted;
}
.timeline-item.past .timeline-content {
  opacity: 0.6;
}

.timeline-item.upcoming .timeline-dot {
  background: $color-info;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 60rpx;
}
.empty-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
}
.empty-text {
  font-size: 30rpx;
  color: $text-muted;
}
</style>
