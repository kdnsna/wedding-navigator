<template>
  <view class="page" :class="templateClass">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">TIMELINE</text>
      <text class="page-title">婚礼流程</text>
      <view class="page-divider" />
      <text class="page-desc" v-if="countdown && !countdown.isToday">
        距离婚礼还有 {{ countdown.days }} 天
      </text>
      <text class="page-desc today" v-if="countdown?.isToday">
        今天是我们的婚礼日
      </text>
    </view>

    <!-- 日期展示 -->
    <view class="date-banner" v-if="weddingDate">
      <text class="date-num">{{ weddingDay }}</text>
      <view class="date-meta">
        <text class="date-month">{{ weddingMonth }}</text>
        <text class="date-week">{{ weddingWeek }}</text>
      </view>
    </view>

    <!-- 时间轴 -->
    <view class="timeline" v-if="events.length > 0">
      <view
        class="timeline-item"
        v-for="(event, index) in events"
        :key="event.id"
        :class="getEventStatus(event.time)"
        :style="{ animationDelay: `${index * 0.1}s` }"
      >
        <view class="timeline-left">
          <text class="timeline-time">{{ event.time }}</text>
          <view class="timeline-dot-wrap">
            <view class="timeline-dot" />
            <view class="timeline-dot-ring" v-if="getEventStatus(event.time) === 'current'" />
          </view>
          <view class="timeline-line" v-if="index < events.length - 1" :class="{ dashed: index % 2 === 0 }" />
        </view>
        <view class="timeline-content">
          <view class="content-header">
            <text class="content-title">{{ event.title }}</text>
            <view class="status-badge" :class="getEventStatus(event.time)">
              <text v-if="getEventStatus(event.time) === 'past'">已完成</text>
              <text v-else-if="getEventStatus(event.time) === 'current'">进行中</text>
              <text v-else>待开始</text>
            </view>
          </view>
          <view class="content-meta" v-if="getVenueName(event.venue_id)">
            <image class="visual-icon-sm meta-icon" src="/static/visuals/icon-location.svg" mode="aspectFit" />
            <text class="meta-text">{{ getVenueName(event.venue_id) }}</text>
          </view>
          <view class="content-meta" v-if="event.assignee_ids?.length">
            <image class="visual-icon-sm meta-icon" src="/static/visuals/icon-person.svg" mode="aspectFit" />
            <text class="meta-text">{{ getAssignees(event.assignee_ids) }}</text>
          </view>
          <text class="content-notes" v-if="event.notes">{{ event.notes }}</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="events.length === 0">
      <image class="empty-visual empty-icon" src="/static/visuals/empty-timeline.svg" mode="aspectFit" />
      <text class="empty-text">{{ emptyText }}</text>
      <text class="empty-sub">{{ emptySub }}</text>
    </view>

    <!-- 底部 -->
    <view class="page-footer" v-if="events.length > 0">
      <view class="footer-line" />
      <text class="footer-text">以上为预计安排，以现场为准</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()
const loadError = ref('')
const templateClass = computed(() => store.templateClass)

const weddingDate = computed(() => store.weddingDate)
const countdown = computed(() => store.countdown)
const events = computed(() => store.timeline?.events || [])
const venues = computed(() => store.venues?.venues || [])
const roles = computed(() => store.timeline?.roles || [])
const emptyText = computed(() => {
  if (!userStore.weddingId) return '请从有效婚礼邀请进入'
  if (loadError.value) return '流程加载失败'
  return '暂无流程安排'
})
const emptySub = computed(() => {
  if (!userStore.weddingId) return '当前没有关联的婚礼信息'
  if (loadError.value) return '请稍后重试或联系新人'
  return '婚礼当天的时间表将在这里展示'
})

const weddingDay = computed(() => {
  if (!weddingDate.value) return ''
  const d = new Date(weddingDate.value)
  return String(d.getDate()).padStart(2, '0')
})
const weddingMonth = computed(() => {
  if (!weddingDate.value) return ''
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return months[new Date(weddingDate.value).getMonth()]
})
const weddingWeek = computed(() => {
  if (!weddingDate.value) return ''
  const weeks = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return weeks[new Date(weddingDate.value).getDay()]
})

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
  if (!timeStr) return 'upcoming'
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  if (todayStr !== weddingDate.value) return 'upcoming'
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
    loadError.value = ''
    try { await fetchWedding(userStore.weddingId) } catch (err) { loadError.value = err?.message || 'load failed' }
  }
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: 80rpx;
}

/* 顶部标题 */
.page-header {
  padding: 60rpx 48rpx 36rpx;
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
.page-divider {
  width: 32rpx;
  height: 2rpx;
  background: $text-muted;
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

/* 日期横幅 */
.date-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  padding: 24rpx 48rpx 48rpx;
}
.date-num {
  font-size: 80rpx;
  font-weight: 200;
  color: $text-primary;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.date-meta {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.date-month {
  font-size: 24rpx;
  color: $text-primary;
  letter-spacing: 4rpx;
  font-weight: 500;
}
.date-week {
  font-size: 22rpx;
  color: $text-muted;
}

/* 时间轴 */
.timeline {
  padding: 0 48rpx;
}
.timeline-item {
  display: flex;
  gap: 32rpx;
  padding-bottom: 48rpx;
  animation: fadeInUp 0.6s $ease-out both;
  opacity: 0;
}

.timeline-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100rpx;
  flex-shrink: 0;
  position: relative;
}
.timeline-time {
  font-size: 24rpx;
  color: $text-muted;
  font-weight: 500;
  margin-bottom: 16rpx;
  font-variant-numeric: tabular-nums;
}

.timeline-dot-wrap {
  position: relative;
  width: 24rpx;
  height: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.timeline-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: $border-color;
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
}
.timeline-dot-ring {
  position: absolute;
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  border: 2rpx solid $color-primary;
  animation: pulse 2s ease-in-out infinite;
  z-index: 1;
}

.timeline-line {
  position: absolute;
  top: 76rpx;
  bottom: 0;
  width: 1rpx;
  background: $border-color;
}
.timeline-line.dashed {
  background: repeating-linear-gradient(
    to bottom,
    $border-color 0rpx,
    $border-color 8rpx,
    transparent 8rpx,
    transparent 16rpx
  );
}

.timeline-content {
  flex: 1;
  padding-top: 40rpx;
}
.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 12rpx;
}
.content-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
}
.status-badge {
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  font-size: 18rpx;
  font-weight: 500;
  white-space: nowrap;
}
.status-badge.past {
  background: rgba(153,153,153,0.1);
  color: $text-muted;
}
.status-badge.current {
  background: rgba(176,58,91,0.1);
  color: $color-primary;
}
.status-badge.upcoming {
  background: $bg-muted;
  color: $text-secondary;
}

.content-meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 8rpx;
}
.meta-icon {
  font-size: 22rpx;
}
.meta-text {
  font-size: 24rpx;
  color: $text-secondary;
}
.content-notes {
  display: block;
  font-size: 24rpx;
  color: $text-muted;
  margin-top: 8rpx;
  line-height: 1.5;
}

/* 状态样式 */
.timeline-item.current .timeline-dot {
  width: 14rpx;
  height: 14rpx;
  background: $color-primary;
}
.timeline-item.current .timeline-time {
  color: $color-primary;
  font-weight: 600;
}

.timeline-item.past .timeline-dot {
  background: $text-muted;
}
.timeline-item.past .content-title {
  color: $text-muted;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 200rpx 60rpx;
}
.empty-icon {
  width: 220rpx;
  height: 220rpx;
  font-size: 0;
  display: block;
  margin: 0 auto 24rpx;
}
.empty-text {
  display: block;
  font-size: 30rpx;
  color: $text-primary;
  margin-bottom: 8rpx;
  font-weight: 500;
}
.empty-sub {
  font-size: 24rpx;
  color: $text-muted;
}

/* 底部 */
.page-footer {
  text-align: center;
  padding: 40rpx;
}
.footer-line {
  width: 32rpx;
  height: 1rpx;
  background: $border-color;
  margin: 0 auto 20rpx;
}
.footer-text {
  font-size: 22rpx;
  color: $text-muted;
}

.tpl-champagne {
  background: #fbf7f1;
  .date-banner,
  .timeline-content {
    background: #fff;
    border-color: rgba(164,120,59,0.14);
  }
  .timeline-dot,
  .timeline-item.current .timeline-dot {
    background: #A4783B;
  }
  .timeline-item.current .timeline-time {
    color: #A4783B;
  }
}
.tpl-noir {
  background: #111;
  .page-title,
  .date-num,
  .content-title {
    color: #fff;
  }
  .page-desc,
  .date-month,
  .date-week,
  .meta-text,
  .content-notes,
  .footer-text {
    color: rgba(255,255,255,0.62);
  }
  .date-banner,
  .timeline-content {
    background: #191919;
    border-color: rgba(201,169,110,0.16);
  }
  .timeline-dot,
  .timeline-item.current .timeline-dot {
    background: $color-gold;
  }
  .timeline-item.current .timeline-time {
    color: $color-gold;
  }
}
.tpl-garden {
  background: #f5f6ef;
  .date-banner,
  .timeline-content {
    background: #fff;
    border-color: rgba(80,98,71,0.14);
  }
  .timeline-dot,
  .timeline-item.current .timeline-dot {
    background: #506247;
  }
  .timeline-item.current .timeline-time {
    color: #506247;
  }
}
</style>
