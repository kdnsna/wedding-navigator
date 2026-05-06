<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">TIMELINE</text>
      <text class="page-title">婚礼流程</text>
      <text class="page-desc" v-if="countdown && !countdown.isToday">
        距离婚礼还有 {{ countdown.days }} 天
      </text>
      <text class="page-desc today" v-if="countdown?.isToday">
        今天是我们的婚礼日
      </text>
    </view>

    <!-- 时间轴 -->
    <view class="timeline" v-if="events.length > 0">
      <view
        class="timeline-item"
        v-for="(event, index) in events"
        :key="event.id"
        :class="getEventStatus(event.time)"
      >
        <view class="timeline-left">
          <text class="timeline-time">{{ event.time }}</text>
          <view class="timeline-dot" />
          <view class="timeline-line" v-if="index < events.length - 1" />
        </view>
        <view class="timeline-content">
          <view class="content-header">
            <text class="content-title">{{ event.title }}</text>
            <text class="content-badge" v-if="event.is_important">重点</text>
          </view>
          <text class="content-venue" v-if="getVenueName(event.venue_id)">
            {{ getVenueName(event.venue_id) }}
          </text>
          <text class="content-assignee" v-if="event.assignee_ids?.length">
            {{ getAssignees(event.assignee_ids) }}
          </text>
          <text class="content-notes" v-if="event.notes">{{ event.notes }}</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="events.length === 0">
      <text class="empty-text">暂无流程安排</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding } from '@/composables/useCloud.js'

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
  if (today.toDateString() !== weddingDay.toDateString()) return 'upcoming'
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
    try { await fetchWedding(userStore.weddingId) } catch (err) {}
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
  padding: 60rpx 48rpx 48rpx;
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
  margin-bottom: 16rpx;
}
.page-desc {
  display: block;
  font-size: $font-body;
  color: $text-secondary;
}
.page-desc.today {
  color: $color-primary;
  font-weight: 500;
}

/* 时间轴 */
.timeline {
  padding: 0 48rpx;
}
.timeline-item {
  display: flex;
  gap: 32rpx;
  padding-bottom: 48rpx;
  position: relative;
}

.timeline-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80rpx;
  flex-shrink: 0;
  position: relative;
}
.timeline-time {
  font-size: 26rpx;
  color: $text-muted;
  font-weight: 500;
  margin-bottom: 12rpx;
  font-variant-numeric: tabular-nums;
}
.timeline-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: $border-color;
  position: relative;
  z-index: 2;
}
.timeline-line {
  position: absolute;
  top: 52rpx;
  bottom: 0;
  width: 1rpx;
  background: $border-color;
}

.timeline-content {
  flex: 1;
  padding-top: 36rpx;
}
.content-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 8rpx;
}
.content-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
}
.content-badge {
  padding: 4rpx 12rpx;
  background: $bg-muted;
  color: $text-secondary;
  font-size: 18rpx;
  border-radius: 6rpx;
  font-weight: 500;
}
.content-venue,
.content-assignee,
.content-notes {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  margin-top: 8rpx;
  line-height: 1.5;
}

/* 状态 */
.timeline-item.current .timeline-dot {
  width: 16rpx;
  height: 16rpx;
  background: $color-primary;
}
.timeline-item.current .timeline-time {
  color: $color-primary;
  font-weight: 600;
}
.timeline-item.current .content-title {
  color: $color-primary;
}

.timeline-item.past .timeline-dot {
  background: $text-muted;
}
.timeline-item.past .timeline-time,
.timeline-item.past .content-title,
.timeline-item.past .content-venue,
.timeline-item.past .content-assignee,
.timeline-item.past .content-notes {
  color: $text-muted;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 200rpx 60rpx;
}
.empty-text {
  font-size: 30rpx;
  color: $text-muted;
}
</style>
