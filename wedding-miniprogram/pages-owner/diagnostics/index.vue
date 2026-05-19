<template>
  <view class="page">
    <view class="page-header">
      <text class="page-tag">RELEASE CHECK</text>
      <text class="page-title">发布诊断</text>
      <text class="page-sub">把上线前最容易遗漏的云环境、路书、分享、隐私和模板权益集中检查</text>
    </view>

    <view class="summary-card" :class="{ ready: diagnostics.ready }">
      <view>
        <text class="summary-kicker">READINESS</text>
        <text class="summary-title">{{ diagnostics.ready ? '可发布' : '需补齐' }}</text>
        <text class="summary-desc">{{ summaryText }}</text>
      </view>
      <text class="summary-score">{{ diagnostics.percent }}%</text>
    </view>

    <view class="metric-row">
      <view class="metric-item">
        <text class="metric-num">{{ diagnostics.blockers }}</text>
        <text class="metric-label">阻断项</text>
      </view>
      <view class="metric-item">
        <text class="metric-num">{{ diagnostics.warnings }}</text>
        <text class="metric-label">建议项</text>
      </view>
      <view class="metric-item">
        <text class="metric-num">{{ diagnostics.manual }}</text>
        <text class="metric-label">人工确认</text>
      </view>
    </view>

    <view class="diagnostic-list">
      <view
        class="diagnostic-item"
        v-for="item in diagnostics.items"
        :key="item.key"
        @click="goItem(item)"
      >
        <view class="status-dot" :class="item.status" />
        <view class="diagnostic-meta">
          <view class="diagnostic-head">
            <text class="diagnostic-title">{{ item.title }}</text>
            <text class="diagnostic-status" :class="item.status">{{ statusText(item.status) }}</text>
          </view>
          <text class="diagnostic-desc">{{ item.desc }}</text>
        </view>
        <text class="diagnostic-action" v-if="item.route">{{ item.actionText || '去处理' }}</text>
      </view>
    </view>

    <view class="note-card">
      <text class="note-title">上线前人工验收</text>
      <text class="note-copy">建议最后用真机完整走一遍：创建婚礼、上传封面、补场地坐标、提交 RSVP、写祝福、分享好友、生成海报、删除婚礼后旧链接失效。</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding } from '@/composables/useCloud.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { buildReleaseDiagnostics } from '@/utils/releaseDiagnostics.js'

const store = useWeddingStore()
const userStore = useUserStore()

const diagnostics = computed(() => buildReleaseDiagnostics(store))
const summaryText = computed(() => {
  if (diagnostics.value.blockers > 0) return `还有 ${diagnostics.value.blockers} 个阻断项，补齐后再分享更稳`
  if (diagnostics.value.warnings > 0) return `主链路可用，还有 ${diagnostics.value.warnings} 个建议项可优化`
  return '基础发布项完整，建议真机再走一遍分享和海报'
})

function statusText(status) {
  const map = {
    done: '已完成',
    warning: '建议补齐',
    blocker: '需处理',
    manual: '人工确认'
  }
  return map[status] || '待确认'
}

function goItem(item) {
  if (!item.route) return
  if (item.route.startsWith('/pages/guide') || item.route.startsWith('/pages/index')) {
    uni.switchTab({ url: item.route })
    return
  }
  uni.navigateTo({ url: item.route })
}

onShow(async () => {
  if (!useOwnerGuard()) return
  if (!userStore.weddingId) return
  try {
    await fetchWedding(userStore.weddingId, true)
  } catch (err) {
    console.warn('发布诊断刷新数据失败:', err)
  }
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: $bg-color;
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
.page-sub {
  display: block;
  margin-top: 14rpx;
  color: $text-secondary;
  font-size: 26rpx;
  line-height: 1.55;
}
.summary-card {
  margin: 0 $page-gutter 32rpx;
  padding: 34rpx;
  border-radius: $card-radius;
  background: #9F2D26;
  color: #fff;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
}
.summary-card.ready {
  background: $text-primary;
}
.summary-card > view {
  min-width: 0;
}
.summary-kicker {
  display: block;
  font-size: 18rpx;
  color: rgba(255,255,255,0.55);
  letter-spacing: 0;
  margin-bottom: 10rpx;
}
.summary-title {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  margin-bottom: 10rpx;
}
.summary-desc {
  display: block;
  color: rgba(255,255,255,0.74);
  font-size: 24rpx;
  line-height: 1.5;
}
.summary-score {
  flex-shrink: 0;
  font-size: 48rpx;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.metric-row {
  display: flex;
  padding: 0 $page-gutter;
  margin-bottom: 40rpx;
}
.metric-item {
  flex: 1;
  text-align: center;
}
.metric-num {
  display: block;
  font-size: 42rpx;
  color: $text-primary;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin-bottom: 6rpx;
}
.metric-label {
  font-size: 22rpx;
  color: $text-muted;
}
.diagnostic-list {
  margin: 0 $page-gutter 42rpx;
  border-radius: $card-radius;
  border: 1rpx solid $border-color;
  overflow: hidden;
  background: $bg-surface;
}
.diagnostic-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  min-height: $tap-min-height;
  padding: 28rpx;
  border-bottom: 1rpx solid $border-color;
}
.diagnostic-item:last-child {
  border-bottom: none;
}
.diagnostic-item:active {
  background: $bg-muted;
}
.status-dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  flex-shrink: 0;
  background: $text-muted;
}
.status-dot.done { background: $color-success; }
.status-dot.warning { background: $color-warning; }
.status-dot.blocker { background: $color-error; }
.status-dot.manual { background: $color-info; }
.diagnostic-meta {
  flex: 1;
  min-width: 0;
}
.diagnostic-head {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 8rpx;
}
.diagnostic-title {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.diagnostic-status {
  flex-shrink: 0;
  padding: 6rpx 12rpx;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-muted;
  font-size: 21rpx;
}
.diagnostic-status.done {
  color: $color-success;
  background: rgba(52,168,83,0.1);
}
.diagnostic-status.warning {
  color: #A76E00;
  background: rgba(249,171,0,0.12);
}
.diagnostic-status.blocker {
  color: $color-error;
  background: rgba(234,67,53,0.1);
}
.diagnostic-status.manual {
  color: $color-info;
  background: rgba(95,99,104,0.1);
}
.diagnostic-desc {
  display: block;
  font-size: 24rpx;
  line-height: 1.45;
  color: $text-secondary;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.diagnostic-action {
  flex-shrink: 0;
  font-size: 24rpx;
  color: $color-primary;
}
.note-card {
  margin: 0 $page-gutter;
  padding: 30rpx;
  border-radius: $card-radius;
  background: $bg-muted;
}
.note-title {
  display: block;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 600;
  margin-bottom: 12rpx;
}
.note-copy {
  display: block;
  font-size: 24rpx;
  line-height: 1.6;
  color: $text-secondary;
}
</style>
