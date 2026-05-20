<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">BLESSINGS</text>
      <text class="page-title">祝福管理</text>
    </view>

    <!-- 统计 -->
    <view class="stats-row">
      <view class="stat-item">
        <text class="stat-num">{{ blessings.length }}</text>
        <text class="stat-label">祝福总数</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ pinnedCount }}</text>
        <text class="stat-label">已置顶</text>
      </view>
    </view>

    <!-- 祝福列表 -->
    <view class="blessing-list" v-if="blessings.length > 0">
      <view class="blessing-item" v-for="item in blessings" :key="item.id" :class="{ pinned: item.is_pinned }">
        <view class="item-header">
          <text class="item-name">{{ item.sender?.name || '匿名' }}</text>
          <text class="item-time">{{ formatTime(item.created_at) }}</text>
        </view>
        <text class="item-content">{{ item.content }}</text>
        <view class="item-actions">
          <text class="item-action" @click="togglePin(item)">
            {{ item.is_pinned ? '取消置顶' : '置顶' }}
          </text>
          <text class="item-action delete" @click="deleteBlessing(item.id)">删除</text>
        </view>
      </view>
    </view>

    <view class="empty-state" v-if="blessings.length === 0">
      <image class="empty-visual empty-icon" src="/static/visuals/empty-blessing.svg" mode="aspectFit" />
      <text class="empty-text">暂无祝福</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { showSuccess, showError, formatDateTime } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { fetchWedding, updateWedding } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()
const saving = ref(false)
const refreshing = ref(false)

const blessings = computed(() => {
  const list = store.blessings?.blessings || []
  return [...list].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return (b.created_at || 0) - (a.created_at || 0)
  })
})

const pinnedCount = computed(() => blessings.value.filter(b => b.is_pinned).length)

function formatTime(ts) {
  return formatDateTime(ts)
}

async function togglePin(item) {
  if (saving.value) return
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
  uni.showModal({
    title: '确认删除',
    content: '确定删除这条祝福？',
    success: async (res) => {
      if (res.confirm) {
        const previousBlessings = cloneBlessings()
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
        }
      }
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
  if (!useOwnerGuard()) return
  if (!userStore.weddingId || refreshing.value) return
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
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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
