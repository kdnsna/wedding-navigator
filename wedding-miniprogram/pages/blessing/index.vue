<template>
  <view class="page" :class="templateClass">
    <!-- 顶部标题 -->
    <view class="page-header" v-if="isBlessingEnabled">
      <text class="page-tag">BLESSINGS</text>
      <text class="page-title">祝福墙</text>
      <text class="page-count" v-if="blessings.length > 0">{{ blessings.length }} 条祝福</text>
      <text class="page-template">{{ activeTemplate.shortName }} · 为新人留下第一眼会被看见的祝福</text>
    </view>

    <!-- 发送区域 -->
    <view class="feature-closed" v-if="!isBlessingEnabled">
      <image class="empty-visual" src="/static/visuals/icon-blessing.svg" mode="aspectFit" />
      <text class="feature-title">新人暂未开放祝福墙</text>
      <text class="feature-desc">您仍可查看婚礼时间、地点和到场路线。</text>
      <button class="feature-action" @click="goToGuide">查看路线</button>
    </view>

    <view class="send-area" v-if="isBlessingEnabled">
      <view class="sender-row">
        <input
          class="sender-input"
          v-model="senderName"
          :placeholder="allowAnonymousBlessing ? '您的称呼' : '请输入您的称呼'"
          placeholder-class="input-placeholder"
        />
      </view>
      <textarea
        class="send-input"
        v-model="newBlessing"
        placeholder="写下您对新人的祝福..."
        placeholder-class="input-placeholder"
        maxlength="500"
      />
      <view class="send-bar">
        <text class="char-count">{{ newBlessing.length }}/500</text>
        <button class="send-btn" :disabled="sending" @click="sendTextBlessing">{{ sending ? '发送中' : '发送' }}</button>
      </view>
    </view>

    <!-- 祝福列表 -->
    <view class="blessing-list" v-if="isBlessingEnabled && blessingPublic && blessings.length > 0">
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
        <view class="pinned-tag" v-if="item.is_pinned">置顶</view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="isBlessingEnabled && (blessings.length === 0 || !blessingPublic)">
      <image class="empty-visual" src="/static/visuals/empty-blessing.svg" mode="aspectFit" />
      <text class="empty-text">{{ emptyText }}</text>
      <text class="empty-sub" v-if="emptySub">{{ emptySub }}</text>
      <button class="empty-action" @click="focusBlessing" v-if="userStore.weddingId && !loadError">
        {{ blessingPublic ? '写第一条祝福' : '继续写祝福' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding, submitBlessing } from '@/composables/useCloud.js'
import { showSuccess, showError, formatRelativeTime } from '@/utils/index.js'

const store = useWeddingStore()
const userStore = useUserStore()
const newBlessing = ref('')
const senderName = ref('')
const sending = ref(false)
const loadError = ref('')
const activeTemplate = computed(() => store.activeTemplate)
const templateClass = computed(() => store.templateClass)
const isBlessingEnabled = computed(() => store.isBlessingEnabled)
const blessingPublic = computed(() => store.blessingPublic)
const allowAnonymousBlessing = computed(() => store.allowAnonymousBlessing)

const blessings = computed(() => {
  const list = store.blessings?.blessings || []
  return [...list].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return (b.created_at || 0) - (a.created_at || 0)
  })
})
const emptyText = computed(() => {
  if (!userStore.weddingId) return '请从有效婚礼邀请进入'
  if (loadError.value) return '祝福加载失败'
  if (!blessingPublic.value) return '祝福已提交给新人查看'
  return '暂无祝福，来做第一个祝福的人吧'
})
const emptySub = computed(() => {
  if (!userStore.weddingId) return '当前没有关联的婚礼信息'
  if (loadError.value) return '请稍后重试或联系新人'
  return ''
})

function formatTime(ts) {
  return formatRelativeTime(ts)
}

function focusBlessing() {
  uni.pageScrollTo({ scrollTop: 0, duration: 250 })
}

async function sendTextBlessing() {
  const content = newBlessing.value.trim()
  if (!content) { showError('请输入祝福内容'); return }
  if (!userStore.weddingId) { showError('未找到婚礼信息'); return }
  if (!allowAnonymousBlessing.value && !senderName.value.trim()) {
    showError('请输入您的称呼')
    return
  }
  if (sending.value) return
  sending.value = true
  try {
    uni.showLoading({ title: '发送中...', mask: true })
    const res = await submitBlessing(userStore.weddingId, {
      sender: { name: senderName.value.trim() || '宾客', openid: userStore.openid || '' },
      type: 'text',
      content
    })
    store.addBlessing({
      id: res.blessingId || res.blessing_id || Date.now().toString(),
      sender: { name: senderName.value.trim() || '宾客' },
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
    sending.value = false
    uni.hideLoading()
  }
}

function goToGuide() {
  uni.switchTab({ url: '/pages/guide/index' })
}

onShow(async () => {
  if (userStore.weddingId && blessings.value.length === 0) {
    loadError.value = ''
    try { await fetchWedding(userStore.weddingId) } catch (err) { loadError.value = err?.message || 'load failed' }
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
.page-template {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: $text-muted;
  line-height: 1.5;
}

/* 发送区域 */
.send-area {
  padding: 0 48rpx 36rpx;
}
.sender-row {
  margin-bottom: 16rpx;
}
.sender-input {
  height: 72rpx;
  font-size: 28rpx;
  color: $text-primary;
  border-bottom: 2rpx solid $border-color;
  padding: 0;
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
.send-btn[disabled] { opacity: 0.55; }

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
  height: 76rpx;
  line-height: 76rpx;
  border-radius: $radius-full;
  background: $text-primary;
  color: #fff;
  font-size: 26rpx;
}
.feature-action::after { border: none; }

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
.empty-action {
  margin-top: 32rpx;
  width: 260rpx;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: $radius-full;
  background: $text-primary;
  color: #fff;
  font-size: 26rpx;
}
.empty-action::after { border: none; }

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 160rpx 60rpx;
}
.empty-text {
  display: block;
  font-size: 28rpx;
  color: $text-muted;
}
.empty-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: $text-placeholder;
}

.tpl-champagne {
  background: #fbf7f1;
  .send-btn,
  .feature-action,
  .pinned-tag,
  .empty-action {
    background: #A4783B;
  }
  .blessing-item.pinned {
    background: #f7eee4;
  }
}
.tpl-noir {
  background: #111;
  .page-title,
  .feature-title,
  .item-name,
  .item-content,
  .sender-input,
  .send-input {
    color: #fff;
  }
  .page-count,
  .feature-desc,
  .page-template {
    color: rgba(255,255,255,0.62);
  }
  .send-btn,
  .feature-action,
  .pinned-tag,
  .empty-action {
    background: $color-gold;
    color: #111;
  }
  .blessing-item {
    border-bottom-color: rgba(201,169,110,0.16);
  }
  .blessing-item.pinned {
    background: #191919;
  }
}
.tpl-garden {
  background: #f5f6ef;
  .send-btn,
  .feature-action,
  .pinned-tag,
  .empty-action {
    background: #506247;
  }
  .blessing-item.pinned {
    background: #eef2e7;
  }
}
</style>
