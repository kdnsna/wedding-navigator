<template>
  <PageShell
    class="page blessing-manage-page"
    kicker="BLESSINGS"
    title="祝福管理"
    desc="查看宾客留言，置顶精选祝福，及时处理不适合公开展示的内容。"
  >

    <!-- 统计 -->
    <MetricStrip :items="blessingMetricItems" />

    <!-- 祝福列表 -->
    <view class="blessing-list" v-if="blessings.length > 0">
      <view class="blessing-item" v-for="item in blessings" :key="item.id" :class="{ pinned: item.is_pinned }">
        <view class="item-header">
          <text class="item-name">{{ item.sender?.name || '匿名' }}</text>
          <text class="item-time">{{ formatTime(item.created_at) }}</text>
        </view>
        <text class="item-content">{{ item.content }}</text>
        <view class="item-actions">
          <text class="item-action" :class="{ disabled: blessingBusy }" @click="togglePin(item)">
            {{ item.is_pinned ? '取消置顶' : '置顶' }}
          </text>
          <text class="item-action delete" :class="{ disabled: blessingBusy }" @click="deleteBlessing(item.id)">删除</text>
        </view>
      </view>
    </view>

    <EmptyState
      v-if="blessings.length === 0"
      icon="/static/visuals/empty-blessing.svg"
      title="暂无祝福"
      desc="宾客提交公开祝福后，会在这里统一审核和置顶。"
    />

    <BottomActionBar
      primary-text="刷新祝福"
      secondary-text="返回后台"
      :loading="refreshing"
      :disabled="saving"
      @primary="refreshBlessings"
      @secondary="goManage"
    />
  </PageShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageShell from '@/components/ui/PageShell.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BottomActionBar from '@/components/ui/BottomActionBar.vue'
import MetricStrip from '@/components/ui/MetricStrip.vue'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { showSuccess, showError, formatDateTime } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { fetchWedding, updateWedding } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()
const saving = ref(false)
const refreshing = ref(false)
const blessingBusy = computed(() => saving.value || refreshing.value)

const blessings = computed(() => {
  const list = store.blessings?.blessings || []
  return [...list].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return (b.created_at || 0) - (a.created_at || 0)
  })
})

const pinnedCount = computed(() => blessings.value.filter(b => b.is_pinned).length)
const publicCount = computed(() => blessings.value.filter(b => b.is_public !== false).length)
const anonymousCount = computed(() => blessings.value.filter(b => b.sender?.anonymous || !b.sender?.name).length)
const blessingMetricItems = computed(() => [
  { label: '总数', value: blessings.value.length },
  { label: '置顶', value: pinnedCount.value },
  { label: '公开', value: publicCount.value },
  { label: '匿名', value: anonymousCount.value }
])

function formatTime(ts) {
  return formatDateTime(ts)
}

async function togglePin(item) {
  if (guardBlessingBusy()) return
  const originalList = store.blessings?.blessings || []
  const target = originalList.find(b => b.id === item.id)
  if (!target) return
  const previousBlessings = cloneBlessings()
  saving.value = true
  const nextPinned = !target.is_pinned
  try {
    target.is_pinned = nextPinned
    if (target.is_pinned) {
      originalList.forEach(b => { if (b.id !== item.id) b.is_pinned = false })
    }
    await saveToStorage()
    showSuccess(target.is_pinned ? '已置顶' : '已取消置顶')
  } catch (err) {
    store.blessings = previousBlessings
    console.error('祝福置顶失败:', err)
    showError(err?.message || '操作失败，请重试')
  } finally {
    saving.value = false
  }
}

function deleteBlessing(id) {
  if (guardBlessingBusy()) return
  uni.showModal({
    title: '确认删除',
    content: '确定删除这条祝福？',
    success: async (res) => {
      if (res.confirm) {
        const previousBlessings = cloneBlessings()
        saving.value = true
        try {
          if (store.blessings && Array.isArray(store.blessings.blessings)) {
            store.blessings.blessings = store.blessings.blessings.filter(b => b.id !== id)
          }
          await saveToStorage()
          showSuccess('已删除')
        } catch (err) {
          store.blessings = previousBlessings
          console.error('祝福删除失败:', err)
          showError(err?.message || '删除失败，请重试')
        } finally {
          saving.value = false
        }
      }
    }
  })
}

function guardBlessingBusy() {
  if (!blessingBusy.value) return false
  showError('祝福数据正在同步，请稍候')
  return true
}

function goManage() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({
      fail: (err) => {
        console.warn('祝福管理返回失败:', err)
        uni.redirectTo({
          url: '/pages-owner/manage/index',
          fail: (redirectErr) => {
            console.warn('祝福管理返回后台失败:', redirectErr)
            showError('返回后台失败，请稍后重试')
          }
        })
      }
    })
    return
  }
  uni.redirectTo({
    url: '/pages-owner/manage/index',
    fail: (err) => {
      console.warn('祝福管理返回后台失败:', err)
      showError('返回后台失败，请稍后重试')
    }
  })
}

async function saveToStorage() {
  if (!userStore.weddingId) {
    throw new Error('未找到婚礼信息，请重新进入')
  }
  if (!store.blessings) store.blessings = { blessings: [] }
  if (!store.blessings.blessings) store.blessings.blessings = []
  try {
    await updateWedding(userStore.weddingId, 'blessings', store.blessings)
  } catch (err) {
    console.error('blessings 云端保存失败:', err)
    throw new Error(err?.message || '云端同步失败')
  }
  const weddings = uni.getStorageSync('weddings') || {}
  if (weddings[userStore.weddingId]) {
    weddings[userStore.weddingId].blessings = store.blessings
    uni.setStorageSync('weddings', weddings)
  }
}

function cloneBlessings() {
  const blessingsData = store.blessings || { blessings: [] }
  return JSON.parse(JSON.stringify({ blessings: blessingsData.blessings || [] }))
}

async function refreshBlessings() {
  if (!(await useOwnerGuard())) return
  if (!userStore.weddingId || refreshing.value || saving.value) return
  refreshing.value = true
  try {
    await fetchWedding(userStore.weddingId, true)
  } catch (err) {
    console.error('祝福刷新失败:', err)
    showError(err?.message || '祝福刷新失败')
  } finally {
    refreshing.value = false
  }
}

onShow(refreshBlessings)
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}

/* 顶部标题 */
.page-header {
  padding: $page-header-top $page-gutter 24rpx;
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

/* 统计 */
.stats-row {
  display: flex;
  padding: 24rpx $page-gutter 32rpx;
}
.stat-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
}
.stat-num {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: $text-primary;
  font-variant-numeric: tabular-nums;
  margin-bottom: 4rpx;
}
.stat-label {
  font-size: 22rpx;
  color: $text-muted;
}

/* 祝福列表 */
.blessing-list {
  padding: 0 $page-gutter;
}
.blessing-item {
  padding: 32rpx 0;
  border-bottom: 1rpx solid $border-color;
}
.blessing-item.pinned {
  background: $bg-muted;
  margin: 0 (-$page-gutter);
  padding: 32rpx $page-gutter;
}
.blessing-item:last-child {
  border-bottom: none;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}
.item-name {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  font-weight: 600;
  color: $text-primary;
  line-height: 1.35;
  word-break: break-word;
}
.item-time {
  font-size: 22rpx;
  color: $text-muted;
  flex-shrink: 0;
}
.item-content {
  display: block;
  font-size: 28rpx;
  color: $text-primary;
  line-height: 1.7;
  margin-bottom: 16rpx;
  word-break: break-word;
}
.item-actions {
  display: flex;
  gap: 24rpx;
}
.item-action {
  font-size: 24rpx;
  color: $text-secondary;
}
.item-action.delete {
  color: $color-error;
}
.item-action.disabled {
  color: $text-placeholder;
  pointer-events: none;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 160rpx 60rpx;
}
.empty-icon {
  width: 220rpx;
  height: 220rpx;
  font-size: 0;
  display: block;
  margin: 0 auto 24rpx;
}
.empty-text {
  font-size: 28rpx;
  color: $text-muted;
}
</style>
