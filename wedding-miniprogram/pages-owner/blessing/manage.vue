<template>
  <view class="page">
    <!-- 统计 -->
    <view class="stats-bar">
      <text>文字祝福：{{ textCount }}条</text>
      <text>语音祝福：{{ voiceCount }}条</text>
    </view>

    <!-- 祝福列表 -->
    <view class="blessing-list">
      <view
        class="blessing-card"
        v-for="item in blessings"
        :key="item.id"
        :class="{ pinned: item.is_pinned }"
      >
        <view class="blessing-header">
          <text class="sender">{{ item.sender?.name || '匿名' }}</text>
          <text class="time">{{ formatTime(item.created_at) }}</text>
        </view>
        <text class="content">{{ item.content }}</text>
        <view class="card-actions">
          <text class="action-btn" @click="togglePin(item)">
            {{ item.is_pinned ? '取消置顶' : '置顶' }}
          </text>
          <text class="action-btn delete" @click="deleteBlessing(item.id)">删除</text>
        </view>
      </view>
    </view>

    <view class="empty-state" v-if="blessings.length === 0">
      <text class="empty-icon">💌</text>
      <text class="empty-text">暂无祝福</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { showSuccess } from '@/utils/index.js'

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

const textCount = computed(() => blessings.value.filter(b => b.type === 'text').length)
const voiceCount = computed(() => blessings.value.filter(b => b.type === 'voice').length)

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function togglePin(item) {
  item.is_pinned = !item.is_pinned
  // 取消其他置顶
  if (item.is_pinned) {
    blessings.value.forEach(b => {
      if (b.id !== item.id) b.is_pinned = false
    })
  }
  saveToStorage()
  showSuccess(item.is_pinned ? '已置顶' : '已取消置顶')
}

function deleteBlessing(id) {
  uni.showModal({
    title: '确认删除',
    content: '确定删除这条祝福？',
    success: (res) => {
      if (res.confirm) {
        store.blessings.blessings = store.blessings.blessings.filter(b => b.id !== id)
        saveToStorage()
        showSuccess('已删除')
      }
    }
  })
}

function saveToStorage() {
  const weddings = uni.getStorageSync('weddings') || {}
  if (weddings[userStore.weddingId]) {
    weddings[userStore.weddingId].blessings = store.blessings
    uni.setStorageSync('weddings', weddings)
  }
}

onShow(() => {})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 30rpx;
}

.stats-bar {
  display: flex;
  justify-content: space-around;
  padding: 20rpx;
  background: $bg-surface;
  border-radius: 24rpx;
  margin-bottom: 20rpx;
  font-size: 26rpx;
  color: $text-secondary;
  border: 2rpx solid rgba(212,168,83,0.08);
  box-shadow: $shadow-sm;
}

.blessing-list {
  margin-bottom: 30rpx;
}
.blessing-card {
  background: $bg-surface;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: $shadow-sm;
  border: 2rpx solid rgba(212,168,83,0.08);
  position: relative;
  overflow: hidden;
}
.blessing-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3rpx;
  background: linear-gradient(90deg, transparent, rgba(212,168,83,0.3), transparent);
}
.blessing-card.pinned {
  border-color: rgba(196, 30, 58, 0.15);
  box-shadow: 0 4rpx 16rpx rgba(196, 30, 58, 0.08);
}
.blessing-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}
.sender {
  font-size: 28rpx;
  font-weight: 500;
}
.time {
  font-size: 22rpx;
  color: $text-muted;
}
.content {
  display: block;
  font-size: 28rpx;
  color: $text-secondary;
  line-height: 1.5;
  margin-bottom: 16rpx;
}
.card-actions {
  display: flex;
  gap: 24rpx;
}
.action-btn {
  font-size: 24rpx;
  color: $color-info;
}
.action-btn.delete {
  color: $color-error;
}

.empty-state {
  text-align: center;
  padding: 150rpx 60rpx;
}
.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
  filter: drop-shadow(0 4rpx 12rpx rgba(212,168,83,0.2));
}
.empty-text {
  font-size: 28rpx;
  color: $text-muted;
}
</style>
