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
      <image class="empty-visual empty-icon" src="/static/visuals/empty-blessing.png" mode="aspectFit" />
      <text class="empty-text">暂无祝福</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { showSuccess, formatDateTime } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { updateWedding } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()

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

function togglePin(item) {
  const originalList = store.blessings?.blessings || []
  const target = originalList.find(b => b.id === item.id)
  if (!target) return
  target.is_pinned = !target.is_pinned
  if (target.is_pinned) {
    originalList.forEach(b => { if (b.id !== item.id) b.is_pinned = false })
  }
  saveToStorage()
  showSuccess(target.is_pinned ? '已置顶' : '已取消置顶')
}

function deleteBlessing(id) {
  uni.showModal({
    title: '确认删除',
    content: '确定删除这条祝福？',
    success: (res) => {
      if (res.confirm) {
        if (store.blessings && Array.isArray(store.blessings.blessings)) {
          store.blessings.blessings = store.blessings.blessings.filter(b => b.id !== id)
        }
        saveToStorage()
        showSuccess('已删除')
      }
    }
  })
}

async function saveToStorage() {
  try {
    await updateWedding(userStore.weddingId, 'blessings', store.blessings)
  } catch (err) {
    console.error('blessings 云端保存失败:', err)
  }
  const weddings = uni.getStorageSync('weddings') || {}
  if (weddings[userStore.weddingId]) {
    weddings[userStore.weddingId].blessings = store.blessings
    uni.setStorageSync('weddings', weddings)
  }
}

onShow(() => { useOwnerGuard() })
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: 60rpx;
}

/* 顶部标题 */
.page-header {
  padding: 60rpx 48rpx 24rpx;
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
}

/* 统计 */
.stats-row {
  display: flex;
  padding: 24rpx 48rpx 32rpx;
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
  padding: 0 48rpx;
}
.blessing-item {
  padding: 32rpx 0;
  border-bottom: 1rpx solid $border-color;
}
.blessing-item.pinned {
  background: $bg-muted;
  margin: 0 -48rpx;
  padding: 32rpx 48rpx;
}
.blessing-item:last-child {
  border-bottom: none;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}
.item-name {
  font-size: 28rpx;
  font-weight: 600;
  color: $text-primary;
}
.item-time {
  font-size: 22rpx;
  color: $text-muted;
}
.item-content {
  display: block;
  font-size: 28rpx;
  color: $text-primary;
  line-height: 1.7;
  margin-bottom: 16rpx;
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
