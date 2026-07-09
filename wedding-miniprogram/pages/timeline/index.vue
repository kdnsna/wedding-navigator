<template>
  <PageShell
    title="婚礼流程"
    kicker="TIMELINE"
    :desc="timelineDesc"
    :theme-class="templateClass"
  >

    <!-- 日期展示 -->
    <EmptyState
      v-if="!isTimelineEnabled"
      icon="/static/visuals/icon-timeline.svg"
      title="新人暂未开放婚礼流程"
      desc="您仍可查看婚礼时间、地点和到场路线。"
      action-text="查看路线"
      @action="goToGuide"
    />

    <view class="date-banner" v-if="isTimelineEnabled && weddingDate">
      <text class="date-num">{{ weddingDay }}</text>
      <view class="date-meta">
        <text class="date-month">{{ weddingMonth }}</text>
        <text class="date-week">{{ weddingWeek }}</text>
      </view>
    </view>

    <!-- 时间轴 -->
    <view class="role-filter" v-if="isTimelineEnabled && roleFilters.length > 1">
      <text
        class="role-pill"
        v-for="role in roleFilters"
        :key="role.id"
        :class="{ active: activeRole === role.id }"
        @click="activeRole = role.id"
      >
        {{ role.name }}
      </text>
    </view>

    <view class="timeline" v-if="isTimelineEnabled && visibleEvents.length > 0">
      <view
        class="timeline-item"
        v-for="(event, index) in visibleEvents"
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
          <view class="timeline-line" v-if="index < visibleEvents.length - 1" :class="{ dashed: index % 2 === 0 }" />
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
    <EmptyState
      v-if="isTimelineEnabled && !loading && visibleEvents.length === 0"
      icon="/static/visuals/empty-timeline.svg"
      :title="emptyText"
      :desc="emptySub"
      :action-text="timelineActionText"
      @action="handleEmptyAction"
    />

    <view class="loading-state" v-if="isTimelineEnabled && loading">
      <text>流程加载中...</text>
    </view>

    <!-- 底部 -->
    <view class="page-footer" v-if="isTimelineEnabled && visibleEvents.length > 0">
      <view class="footer-line" />
      <text class="footer-text">以上为预计安排，以现场为准</text>
    </view>
  </PageShell>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding } from '@/composables/useCloud.js'
import PageShell from '@/components/ui/PageShell.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const store = useWeddingStore()
const userStore = useUserStore()
const loading = ref(false)
const loadError = ref('')
const templateClass = computed(() => store.templateClass)
const isTimelineEnabled = computed(() => store.isTimelineEnabled)
const activeRole = ref('all')

const weddingDate = computed(() => store.weddingDate)
const countdown = computed(() => store.countdown)
const timelineDesc = computed(() => {
  if (!userStore.weddingId) return '请从新人寄来的请柬进入'
  if (loadError.value) return '稍后再翻，这一页会重新铺开'
  if (!isTimelineEnabled.value) return '流程暂未开放，您仍可查看到场路书'
  if (countdown.value?.isToday) return '今天是我们的婚礼日'
  if (countdown.value) return `距离婚礼还有 ${countdown.value.days} 天`
  return '按角色查看婚礼当天安排'
})
const events = computed(() => store.timeline?.events || [])
const venues = computed(() => store.venues?.venues || [])
const roles = computed(() => store.timeline?.roles || [])
const roleFilters = computed(() => {
  const roleList = roles.value.length ? roles.value : [
    { id: 'guest', name: '普通宾客' },
    { id: 'party', name: '伴郎伴娘' },
    { id: 'parents', name: '双方父母' },
    { id: 'vendor', name: '摄影司仪' }
  ]
  return [{ id: 'all', name: '全部' }, ...roleList]
})
const visibleEvents = computed(() => {
  if (activeRole.value === 'all') return events.value
  return events.value.filter(event => {
    const ids = event.assignee_ids || []
    if (!ids.length) return true
    return ids.includes(activeRole.value)
  })
})
const emptyText = computed(() => {
  if (!userStore.weddingId) return '这封信还没有抵达'
  if (loadError.value) return '这一页暂时没翻开'
  if (activeRole.value !== 'all') return '这一席还未另列安排'
  return '流程这一章，等新人落笔'
})
const emptySub = computed(() => {
  if (!userStore.weddingId) return '请从新人寄来的请柬进入'
  if (loadError.value) return '稍后再翻，这一页会重新铺开'
  if (activeRole.value !== 'all') return '可切回“全部”看整日礼序'
  return '请以现场安排为准'
})
const timelineActionText = computed(() => {
  if (!userStore.weddingId) return ''
  if (loadError.value) return '重新加载'
  if (activeRole.value !== 'all') return '查看全部流程'
  return '查看路线'
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

function goToGuide() {
  uni.switchTab({
    url: '/pages/guide/index',
    fail: (err) => {
      console.warn('流程打开路书失败:', err)
      uni.showToast({ title: '路书打开失败，请稍后重试', icon: 'none' })
    }
  })
}

function handleEmptyAction() {
  if (loadError.value) {
    loadTimeline(true)
    return
  }
  if (activeRole.value !== 'all') {
    activeRole.value = 'all'
    return
  }
  goToGuide()
}

async function loadTimeline(force = false) {
  if (!userStore.weddingId || loading.value) return
  if (!force && events.value.length > 0) return
  loading.value = true
  loadError.value = ''
  try {
    await fetchWedding(userStore.weddingId, force)
  } catch (err) {
    console.warn('流程加载失败:', err)
    loadError.value = err?.message || '流程加载失败'
  } finally {
    loading.value = false
  }
}

onShow(() => loadTimeline(false))
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

.feature-closed {
  text-align: center;
  padding: 180rpx 64rpx;
}
.feature-title {
  display: block;
  font-size: 34rpx;
  color: $text-primary;
  font-weight: 600;
  margin-bottom: 14rpx;
}
.feature-desc {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 1.6;
  margin-bottom: 36rpx;
}
.feature-action {
  width: 260rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: $text-primary;
  color: $ink-inverse;
  font-size: 26rpx;
}
.feature-action::after { border: none; }

.loading-state {
  text-align: center;
  padding: 90rpx $page-gutter;
  color: var(--theme-muted, $text-muted);
  font-size: $font-body-sm;
}

/* 日期横幅 */
.date-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  padding: 24rpx $page-gutter 48rpx;
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
  letter-spacing: 0;
  font-weight: 500;
}
.date-week {
  font-size: 22rpx;
  color: $text-muted;
}

/* 时间轴 */
.timeline {
  padding: 0 $page-gutter;
}
.role-filter {
  display: flex;
  gap: 12rpx;
  padding: 0 80rpx 32rpx $page-gutter;
  overflow-x: auto;
}
.role-pill {
  min-height: $control-height-sm;
  padding: 0 26rpx;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-secondary;
  font-size: 24rpx;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
}
.role-pill.active {
  background: var(--theme-accent-soft, rgba(176,58,91,0.10));
  color: var(--theme-accent, $color-primary);
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 12rpx;
}
.content-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
  min-width: 0;
  line-height: 1.42;
  word-break: break-word;
}
.status-badge {
  flex-shrink: 0;
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
  word-break: break-word;
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

.theme-wine,
.theme-cinnabar,
.theme-indigo,
.theme-pine {
  background: var(--theme-page, $bg-color);
  color: var(--theme-ink, $text-primary);

  .page-title,
  .feature-title,
  .date-num,
  .date-month,
  .content-title,
  .empty-text {
    color: var(--theme-ink, $text-primary);
  }

  .page-tag,
  .page-desc,
  .feature-desc,
  .date-week,
  .timeline-time,
  .meta-text,
  .content-notes,
  .footer-text,
  .empty-sub {
    color: var(--theme-muted, $text-muted);
  }

  .page-desc.today,
  .timeline-item.current .timeline-time {
    color: var(--theme-accent, $color-primary);
  }

  .page-divider,
  .timeline-item.current .timeline-dot,
  .feature-action {
    background: var(--theme-accent, $color-primary);
    color: var(--theme-on-accent, $ink-inverse);
  }

  .role-pill.active {
    background: var(--theme-accent-soft, rgba(176,58,91,0.10));
    color: var(--theme-accent, $color-primary);
  }

  .date-banner,
  .timeline-content {
    background: var(--theme-surface, $bg-surface);
    border: 1rpx solid var(--theme-border, $border-color);
    border-radius: $card-radius;
  }

  .timeline-content {
    padding: 28rpx;
    margin-top: 10rpx;
  }

  .role-pill,
  .status-badge.upcoming {
    background: var(--theme-elevated, $bg-muted);
    color: var(--theme-muted, $text-secondary);
  }

  .status-badge.current {
    background: var(--theme-accent-soft, rgba(176,58,91,0.10));
    color: var(--theme-accent, $color-primary);
  }

  .timeline-dot {
    background: var(--theme-border, $border-color);
  }

  .timeline-dot-ring {
    border-color: var(--theme-accent, $color-primary);
  }

  .timeline-line {
    background: var(--theme-border, $border-color);
  }

  .timeline-line.dashed {
    background: repeating-linear-gradient(
      to bottom,
      var(--theme-border, $line) 0rpx,
      var(--theme-border, $line) 8rpx,
      transparent 8rpx,
      transparent 16rpx
    );
  }

  .footer-line {
    background: var(--theme-border, $border-color);
  }
}
</style>
