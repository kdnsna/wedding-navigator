<template>
  <PageShell
    class="stats-page"
    kicker="STATISTICS"
    title="数据统计"
    desc="把浏览、分享、回执、饮食和到场方式汇总成主人端发布判断。"
  >

    <!-- 数据概览 -->
    <MetricStrip :items="overviewItems" />

    <view class="ops-card" v-if="!loadError">
      <view class="ops-copy">
        <text class="ops-kicker">{{ isWeddingDay ? 'WEDDING DAY MODE' : 'RSVP OPS' }}</text>
        <text class="ops-title">{{ opsSummaryTitle }}</text>
        <text class="ops-desc">{{ opsSummaryDesc }}</text>
      </view>
      <view class="ops-tags">
        <text class="ops-tag">{{ rsvpStats.attending_people || 0 }} 人到场</text>
        <text class="ops-tag" v-if="pendingTransportCount > 0">{{ pendingTransportCount }} 人待确认交通</text>
        <text class="ops-tag" v-if="specialDietCount > 0">{{ specialDietCount }} 人特殊餐食</text>
      </view>
    </view>

    <EmptyState
      v-if="loadError"
      icon="/static/visuals/icon-warning.svg"
      title="统计刷新失败"
      :desc="loadError"
    />

    <!-- RSVP -->
    <view class="section" v-if="!loadError">
      <SectionHeader title="RSVP" kicker="ATTENDANCE" :desc="`${rsvpStats.total || 0} 位宾客回执状态`" compact />
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
    <view class="section" v-if="!loadError">
      <SectionHeader title="饮食偏好" kicker="DIETARY" desc="用于提前和宴会厅确认备餐需求。" compact />
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
    <view class="section" v-if="!loadError">
      <SectionHeader title="到场方式" kicker="ARRIVAL" desc="辅助判断停车、接驳和签到提醒。" compact />
      <view class="diet-list" v-if="transportStats.length">
        <view class="diet-item" v-for="item in transportStats" :key="item.label">
          <text class="diet-label">{{ item.label }}</text>
          <text class="diet-value">{{ item.count }} 人</text>
        </view>
      </view>
      <EmptyState
        v-else
        icon="/static/visuals/empty-transport.svg"
        title="暂无到场方式数据"
        desc="宾客提交 RSVP 后会自动汇总到这里。"
      />
    </view>

    <!-- 关系来源 -->
    <view class="section" v-if="!loadError">
      <SectionHeader title="关系来源" kicker="RELATION" desc="帮助新人快速理解来宾构成。" compact />
      <view class="diet-list" v-if="relationshipStats.length">
        <view class="diet-item" v-for="item in relationshipStats" :key="item.label">
          <text class="diet-label">{{ item.label }}</text>
          <text class="diet-value">{{ item.count }} 人</text>
        </view>
      </view>
      <EmptyState
        v-else
        icon="/static/visuals/empty-guests.svg"
        title="暂无关系来源"
        desc="添加宾客或收到回执后会自动生成分布。"
      />
    </view>

    <BottomActionBar
      primary-text="刷新数据"
      secondary-text="宾客管理"
      :loading="loading"
      @primary="refreshStats"
      @secondary="goGuests"
    />
  </PageShell>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageShell from '@/components/ui/PageShell.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import MetricStrip from '@/components/ui/MetricStrip.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BottomActionBar from '@/components/ui/BottomActionBar.vue'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { fetchWedding, getStats } from '@/composables/useCloud.js'
import { showError } from '@/utils/index.js'

const store = useWeddingStore()
const userStore = useUserStore()
const loading = ref(false)
const loadError = ref('')

const stats = computed(() => store.wedding?.stats || {})
const rsvpStats = computed(() => store.rsvpStats)
const overviewItems = computed(() => [
  { label: '总浏览', value: stats.value.views || 0 },
  { label: '分享', value: stats.value.shares || 0 },
  { label: '独立访客', value: stats.value.unique_viewers || 0 },
  { label: '祝福', value: stats.value.blessing_count || (store.blessings?.blessings || []).length }
])

const total = computed(() => Math.max(rsvpStats.value.total || 1, 1))
const attendingPercent = computed(() => (rsvpStats.value.attending / total.value) * 100)
const uncertainPercent = computed(() => (rsvpStats.value.uncertain / total.value) * 100)
const declinedPercent = computed(() => (rsvpStats.value.declined / total.value) * 100)
const pendingPercent = computed(() => (rsvpStats.value.pending / total.value) * 100)
const isWeddingDay = computed(() => {
  if (!store.weddingDate) return false
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return today === store.weddingDate
})

const dietStats = computed(() => {
  const guests = store.guests?.guests || []
  return {
    normal: guests.filter(g => g.diet_preference === 'normal' || !g.diet_preference).length,
    vegetarian: guests.filter(g => g.diet_preference === 'vegetarian').length,
    halal: guests.filter(g => g.diet_preference === 'halal').length,
    other: guests.filter(g => g.diet_preference === 'other').length
  }
})
const specialDietCount = computed(() => dietStats.value.vegetarian + dietStats.value.halal + dietStats.value.other)
const pendingTransportCount = computed(() => {
  const guests = store.guests?.guests || []
  return guests.filter(g => (g.rsvp_status || g.status) === 'attending' && !g.transport_mode).length
})
const opsSummaryTitle = computed(() => {
  if (isWeddingDay.value) return '今天优先盯签到、交通和特殊餐食'
  if (rsvpStats.value.pending > 0) return `还有 ${rsvpStats.value.pending} 位宾客未填写回执`
  if (rsvpStats.value.uncertain > 0) return `还有 ${rsvpStats.value.uncertain} 位宾客待定`
  return '回执结构基本清楚，可以进入现场准备'
})
const opsSummaryDesc = computed(() => {
  if (isWeddingDay.value) return '建议打开宾客管理，按到达时间和交通方式确认现场衔接。'
  if (rsvpStats.value.pending > 0) return '建议把邀请链接再次发给未填写宾客，优先确认出席人数和交通方式。'
  if (specialDietCount.value > 0) return '已有特殊餐食需求，建议提前同步给宴会厅或桌长。'
  return '继续关注分享转化和祝福反馈，发布前再做一次真机检查。'
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

async function refreshStats() {
  if (!(await useOwnerGuard())) return
  if (!userStore.weddingId || loading.value) return
  loading.value = true
  loadError.value = ''
  try {
    await fetchWedding(userStore.weddingId, true)
    const res = await getStats(userStore.weddingId)
    if (res?.stats) {
      if (!store.wedding) store.wedding = {}
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
    loadError.value = err?.message || '统计数据加载失败，请稍后重试'
    showError(loadError.value)
  } finally {
    loading.value = false
  }
}

function goGuests() {
  uni.navigateTo({
    url: '/pages-owner/guests/manage',
    fail: (err) => {
      console.warn('统计页打开宾客管理失败:', err)
      showError('宾客管理打开失败，请稍后重试')
    }
  })
}

onShow(refreshStats)
</script>

<style lang="scss" scoped>
.stats-page {
  background-color: $bg-color;
  min-height: 100vh;
}
.ops-card {
  margin: 0 $page-gutter 44rpx;
  padding: 30rpx;
  border-radius: $card-radius;
  background: $text-primary;
  color: $ink-inverse;
}
.ops-copy {
  min-width: 0;
}
.ops-kicker {
  display: block;
  font-size: 20rpx;
  color: rgba(255,255,255,0.52);
  letter-spacing: 0;
  margin-bottom: 10rpx;
}
.ops-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.35;
  margin-bottom: 10rpx;
}
.ops-desc {
  display: block;
  font-size: 24rpx;
  line-height: 1.55;
  color: rgba(255,255,255,0.72);
}
.ops-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 22rpx;
}
.ops-tag {
  max-width: 100%;
  padding: 8rpx 14rpx;
  border-radius: $radius-full;
  background: rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.82);
  font-size: 24rpx;
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
