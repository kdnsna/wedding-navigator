<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">BLESSINGS</text>
      <text class="page-title">祝福墙</text>
      <text class="page-count" v-if="blessings.length > 0">{{ blessings.length }} 条祝福</text>
    </view>

    <!-- 发送区域 -->
    <view class="send-area">
      <textarea
        class="send-input"
        v-model="newBlessing"
        placeholder="写下您对新人的祝福..."
        placeholder-class="input-placeholder"
        maxlength="500"
      />
      <view class="send-bar">
        <text class="char-count">{{ newBlessing.length }}/500</text>
        <button class="send-btn" @click="sendTextBlessing">发送</button>
      </view>
    </view>

    <!-- 祝福列表 -->
    <view class="blessing-list" v-if="blessings.length > 0">
      <view
        class="blessing-item"
        v-for="item in blessings"
        :key="item.id"
        :class="{ pinned: item.is_pinned }"
      >
        <view class="item-header">
          <text class="item-name">{{ item.sender?.name || '匿名' }}</text>
          <text class="item-time">{{ formatTime(item.created_at) }}</text>
        </view>
        <text class="item-content">{{ item.content }}</text>
        <view class="item-voice" v-if="item.type === 'voice'">
          <text>语音祝福 {{ item.voice_duration }}"</text>
        </view>
        <view class="pinned-tag" v-if="item.is_pinned">置顶</view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="blessings.length === 0">
      <image class="empty-visual" src="/static/visuals/empty-blessing.png" mode="aspectFit" />
      <text class="empty-text">暂无祝福，来做第一个祝福的人吧</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding, submitBlessing } from '@/composables/useCloud.js'
import { showSuccess, showError } from '@/utils/index.js'

const store = useWeddingStore()
const userStore = useUserStore()
const newBlessing = ref('')

const blessings = computed(() => {
  const list = store.blessings?.blessings || []
  return [...list].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return (b.created_at || 0) - (a.created_at || 0)
  })
})

function formatTime(ts) {
  if (!ts) return ''
  const date = new Date(ts)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

async function sendTextBlessing() {
  const content = newBlessing.value.trim()
  if (!content) { showError('请输入祝福内容'); return }
  if (!userStore.weddingId) { showError('未找到婚礼信息'); return }

  try {
    uni.showLoading({ title: '发送中...', mask: true })
    const res = await submitBlessing(userStore.weddingId, {
      sender: { name: '宾客', openid: userStore.openid || '' },
      type: 'text',
      content
    })
    store.addBlessing({
      id: res.blessing_id,
      sender: { name: '宾客' },
      type: 'text',
      content,
      is_pinned: false,
      created_at: Date.now()
    })
    newBlessing.value = ''
    showSuccess('发送成功')
  } catch (err) {
    showError(err.message || '发送失败')
  } finally {
    uni.hideLoading()
  }
}

onShow(async () => {
  if (userStore.weddingId && blessings.value.length === 0) {
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
  margin-bottom: 8rpx;
}
.page-count {
  display: block;
  font-size: $font-body;
  color: $text-secondary;
}

/* 发送区域 */
.send-area {
  padding: 0 48rpx 36rpx;
}
.send-input {
  width: 100%;
  height: 160rpx;
  padding: 24rpx 0;
  border-bottom: 2rpx solid $border-color;
  font-size: 28rpx;
  background: transparent;
  box-sizing: border-box;
}
.send-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20rpx;
}
.char-count {
  font-size: 22rpx;
  color: $text-muted;
}
.send-btn {
  padding: 16rpx 48rpx;
  border-radius: $radius-full;
  background: $text-primary;
  color: #fff;
  font-size: 26rpx;
  font-weight: 500;
  transition: opacity 0.2s ease;
}
.send-btn::after { border: none; }
.send-btn:active { opacity: 0.8; }

/* 祝福列表 */
.blessing-list {
  padding: 0 48rpx;
}
.blessing-item {
  padding: 32rpx 0;
  border-bottom: 1rpx solid $border-color;
  position: relative;
}
.blessing-item:last-child {
  border-bottom: none;
}
.blessing-item.pinned {
  background: $bg-muted;
  margin: 0 -48rpx;
  padding: 32rpx 48rpx;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
}
.item-voice {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: $text-secondary;
}
.pinned-tag {
  position: absolute;
  top: 32rpx;
  right: 0;
  padding: 4rpx 12rpx;
  background: $text-primary;
  color: #fff;
  font-size: 18rpx;
  border-radius: 4rpx;
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 160rpx 60rpx;
}
.empty-text {
  font-size: 28rpx;
  color: $text-muted;
}
</style>
