<template>
  <view class="page">
    <!-- 发送祝福区域 -->
    <view class="send-section">
      <text class="send-title">💕 写下您对新人的祝福</text>
      <textarea
        class="send-input"
        v-model="newBlessing"
        placeholder="在此输入您的祝福语..."
        maxlength="500"
      />
      <view class="send-actions">
        <button class="send-btn" @click="sendTextBlessing">
          <text>📝 发送文字祝福</text>
        </button>
      </view>
    </view>

    <!-- 祝福列表 -->
    <view class="list-section">
      <view class="list-header">
        <text class="list-title">祝福列表</text>
        <text class="list-count">{{ blessings.length }} 条</text>
      </view>

      <view
        class="blessing-card"
        v-for="item in blessings"
        :key="item.id"
        :class="{ pinned: item.is_pinned }"
      >
        <view class="blessing-header">
          <text class="sender-name">{{ item.sender?.name || '匿名' }}</text>
          <text class="sender-time">{{ formatTime(item.created_at) }}</text>
        </view>
        <text class="blessing-content">{{ item.content }}</text>
        <view class="blessing-voice" v-if="item.type === 'voice'">
          <text>🎵 语音祝福 ({{ item.voice_duration }}秒)</text>
        </view>
        <view class="pinned-badge" v-if="item.is_pinned">
          <text>⭐ 置顶</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="blessings.length === 0">
      <text class="empty-icon">💌</text>
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
  // 置顶排前面
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
  if (!content) {
    showError('请输入祝福内容')
    return
  }
  if (!userStore.weddingId) {
    showError('未找到婚礼信息')
    return
  }

  try {
    uni.showLoading({ title: '发送中...', mask: true })
    const res = await submitBlessing(userStore.weddingId, {
      sender: {
        name: '宾客',
        openid: userStore.openid || ''
      },
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
    try {
      await fetchWedding(userStore.weddingId)
    } catch (err) {
      console.error('加载祝福墙失败:', err)
    }
  }
})
</script>

<style lang="scss" scoped>
/* ========== 祝福墙页面 ========== */
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 30rpx;
}

/* ===== 发送区域 ===== */
.send-section {
  background: $bg-surface;
  border-radius: 32rpx;
  padding: 44rpx;
  margin-bottom: 30rpx;
  box-shadow: $shadow-md;
  border: 1rpx solid $border-light;
  animation: fadeInUp 0.5s $ease-out both;
}
.send-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 20rpx;
  letter-spacing: 2rpx;
}
.send-input {
  width: 100%;
  height: 180rpx;
  padding: 24rpx 28rpx;
  border: 2rpx solid $border-light;
  border-radius: 20rpx;
  font-size: 28rpx;
  background: $bg-elevated;
  box-sizing: border-box;
  margin-bottom: 24rpx;
  transition: all 0.2s ease;
}
.send-input:focus {
  border-color: $color-gold;
}
.send-actions {
  display: flex;
  gap: 20rpx;
}
.send-btn {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  text-align: center;
  border-radius: 20rpx;
  background: $gradient-primary;
  color: #fff;
  font-size: 28rpx;
  font-weight: 500;
  box-shadow: 0 4rpx 16rpx rgba(196, 30, 58, 0.2);
  transition: all 0.2s ease;
}
.send-btn:active {
  transform: scale(0.97);
  box-shadow: 0 2rpx 8rpx rgba(196, 30, 58, 0.15);
}
.send-btn::after {
  border: none;
}

/* ===== 列表区域 ===== */
.list-section {
  margin-top: 20rpx;
}
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding: 0 10rpx;
}
.list-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
  letter-spacing: 2rpx;
}
.list-count {
  font-size: 24rpx;
  color: $text-muted;
}

/* 祝福卡片 */
.blessing-card {
  background: $bg-surface;
  border-radius: 28rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  box-shadow: $shadow-sm;
  border: 1rpx solid $border-light;
  position: relative;
  animation: fadeInUp 0.5s $ease-out both;
  opacity: 0;
  transition: all 0.3s ease;
}
@for $i from 1 through 15 {
  .blessing-card:nth-child(#{$i}) {
    animation-delay: #{$i * 0.05}s;
  }
}
.blessing-card.pinned {
  border-color: rgba(196, 30, 58, 0.2);
  background: rgba(196, 30, 58, 0.02);
  box-shadow: 0 4rpx 20rpx rgba(196, 30, 58, 0.06);
}
.blessing-card.pinned::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3rpx;
  background: linear-gradient(90deg, transparent, $color-gold, transparent);
}

.blessing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.sender-name {
  font-size: 28rpx;
  font-weight: 600;
  color: $text-primary;
}
.sender-time {
  font-size: 22rpx;
  color: $text-muted;
}

.blessing-content {
  display: block;
  font-size: 28rpx;
  color: $text-secondary;
  line-height: 1.8;
  letter-spacing: 1rpx;
}

.blessing-voice {
  margin-top: 20rpx;
  padding: 20rpx;
  background: $bg-elevated;
  border-radius: 16rpx;
  font-size: 26rpx;
  color: $color-primary;
  border: 1rpx solid $border-light;
}

/* 置顶标签 */
.pinned-badge {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  padding: 4rpx 14rpx;
  background: $gradient-primary;
  color: #fff;
  font-size: 20rpx;
  border-radius: 10rpx;
  font-weight: 500;
  box-shadow: 0 2rpx 8rpx rgba(196, 30, 58, 0.2);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 160rpx 60rpx;
  animation: fadeIn 0.6s $ease-out both;
}
.empty-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
  filter: drop-shadow(0 4rpx 12rpx rgba(212,168,83,0.2));
}
.empty-text {
  font-size: 30rpx;
  color: $text-muted;
  letter-spacing: 2rpx;
}
</style>
