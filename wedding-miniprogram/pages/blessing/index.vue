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
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: $tracking-kicker;
  text-transform: uppercase;
  margin-bottom: 18rpx;
  font-weight: 500;
}
.page-tag::before {
  content: '';
  width: 24rpx;
  height: 1rpx;
  background: currentColor;
  opacity: 0.5;
}
.page-title {
  display: block;
  font-size: $font-h1;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 12rpx;
  letter-spacing: $tracking-cn;
  line-height: 1.25;
}
.page-count {
  display: block;
  font-size: $font-body;
  color: $text-secondary;
  letter-spacing: $tracking-cn-soft;
  line-height: 1.6;
}
.page-template {
  display: block;
  margin-top: 14rpx;
  font-size: 24rpx;
  color: $text-muted;
  line-height: 1.6;
  letter-spacing: $tracking-cn-soft;
}

/* 发送区域 */
.send-area {
  padding: 0 $page-gutter 40rpx;
}
.sender-row {
  margin-bottom: 20rpx;
}
.sender-input {
  height: $control-height-sm;
  font-size: 28rpx;
  color: $text-primary;
  border-bottom: 2rpx solid $hairline-medium;
  padding: 0;
  transition: border-color 0.4s $ease-editorial;
  letter-spacing: $tracking-cn-soft;
}
.sender-input:focus { border-color: $text-primary; }
.send-input {
  width: 100%;
  height: 160rpx;
  padding: 24rpx 0;
  border-bottom: 2rpx solid $hairline-medium;
  font-size: 28rpx;
  background: transparent;
  box-sizing: border-box;
  line-height: 1.7;
  transition: border-color 0.4s $ease-editorial;
  letter-spacing: $tracking-cn-soft;
}
.send-input:focus { border-color: $text-primary; }
.send-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 24rpx;
}
.char-count {
  font-size: 20rpx;
  color: $text-muted;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}
.send-btn {
  min-width: 168rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  padding: 0 36rpx;
  border-radius: $radius-full;
  background: $text-primary;
  color: #fff;
  font-size: 26rpx;
  font-weight: 500;
  letter-spacing: $tracking-cn-soft;
  transition: all 0.3s $ease-editorial;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}
.send-btn::after { border: none; }
.send-btn:active {
  opacity: 0.9;
  transform: scale(0.98);
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.06);
}
.send-btn[disabled] { opacity: 0.45; box-shadow: none; }

.feature-closed {
  text-align: center;
  padding: 180rpx 64rpx;
}
.feature-title {
  display: block;
  font-size: 34rpx;
  color: $text-primary;
  font-weight: 600;
  margin-bottom: 16rpx;
  letter-spacing: $tracking-cn-soft;
  position: relative;
}
.feature-title::after {
  content: '';
  display: block;
  width: 32rpx;
  height: 2rpx;
  background: $text-primary;
  margin: 18rpx auto 0;
  border-radius: 2rpx;
  opacity: 0.6;
}
.feature-desc {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 1.7;
  margin-bottom: 40rpx;
  letter-spacing: $tracking-cn-soft;
}
.feature-action {
  width: 280rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: $text-primary;
  color: #fff;
  font-size: 26rpx;
  letter-spacing: $tracking-cn-soft;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s $ease-editorial;
}
.feature-action::after { border: none; }
.feature-action:active { transform: scale(0.98); opacity: 0.9; }

/* 祝福列表 */
.blessing-list {
  padding: 0 $page-gutter;
}
.blessing-item {
  padding: 36rpx 0;
  border-bottom: 1rpx solid $hairline-soft;
  position: relative;
  animation: fadeInUp 0.6s $ease-editorial both;
}
.blessing-item:nth-child(2) { animation-delay: 0.05s; }
.blessing-item:nth-child(3) { animation-delay: 0.1s; }
.blessing-item:nth-child(4) { animation-delay: 0.15s; }
.blessing-item:nth-child(5) { animation-delay: 0.2s; }
.blessing-item:nth-child(n+6) { animation-delay: 0.25s; }
.blessing-item:last-child {
  border-bottom: none;
}
.blessing-item.pinned {
  background: var(--theme-elevated, $bg-muted);
  margin: 0 (-$page-gutter);
  padding: 32rpx $page-gutter;
  border-radius: $card-radius;
  border: 1rpx solid $hairline-soft;
  border-bottom-width: 1rpx !important;
  position: relative;
}
.blessing-item.pinned::before {
  content: '';
  position: absolute;
  top: 32rpx;
  left: $page-gutter;
  width: 1rpx;
  height: calc(100% - 64rpx);
  background: $text-primary;
  opacity: 0.18;
}

.item-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14rpx;
}
.item-name {
  font-size: 28rpx;
  font-weight: 600;
  color: $text-primary;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  letter-spacing: $tracking-cn-soft;
}
.item-time {
  font-size: 20rpx;
  color: $text-muted;
  flex-shrink: 0;
  margin-left: 16rpx;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}
.item-content {
  display: block;
  font-size: 28rpx;
  color: $text-primary;
  line-height: 1.75;
  word-break: break-word;
  letter-spacing: $tracking-cn-soft;
  position: relative;
}
.item-content::before {
  content: '“';
  font-size: 36rpx;
  line-height: 1;
  color: $text-primary;
  opacity: 0.16;
  margin-right: 4rpx;
  font-family: Georgia, 'Times New Roman', serif;
  vertical-align: -8rpx;
}
.item-content::after {
  content: '”';
  font-size: 36rpx;
  line-height: 1;
  color: $text-primary;
  opacity: 0.16;
  margin-left: 4rpx;
  font-family: Georgia, 'Times New Roman', serif;
  vertical-align: -8rpx;
}
.pinned-tag {
  position: absolute;
  top: 32rpx;
  right: $page-gutter;
  padding: 4rpx 12rpx;
  background: $text-primary;
  color: #fff;
  font-size: 18rpx;
  letter-spacing: $tracking-kicker;
  text-transform: uppercase;
  border-radius: 4rpx;
  font-weight: 500;
  opacity: 0.92;
}
.empty-action {
  margin-top: 32rpx;
  width: 280rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: $text-primary;
  color: #fff;
  font-size: 26rpx;
  letter-spacing: $tracking-cn-soft;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s $ease-editorial;
}
.empty-action::after { border: none; }
.empty-action:active { transform: scale(0.98); opacity: 0.9; }

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 180rpx 60rpx;
}
.empty-state::before {
  content: '';
  display: block;
  width: 1rpx;
  height: 56rpx;
  background: $hairline-strong;
  margin: 0 auto 32rpx;
  opacity: 0.5;
}
.empty-text {
  display: block;
  font-size: 28rpx;
  color: $text-muted;
  letter-spacing: $tracking-cn-soft;
}
.empty-sub {
  display: block;
  margin-top: 14rpx;
  font-size: 24rpx;
  color: $text-placeholder;
  letter-spacing: $tracking-cn-soft;
  line-height: 1.7;
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

.theme-rose,
.theme-champagne,
.theme-noir,
.theme-garden,
.theme-heritage,
.theme-shandong,
.theme-travel {
  background: var(--theme-page, $bg-color);
  color: var(--theme-ink, $text-primary);

  .page-title,
  .feature-title,
  .item-name,
  .item-content,
  .sender-input,
  .send-input {
    color: var(--theme-ink, $text-primary);
  }

  .page-tag,
  .page-count,
  .page-template,
  .feature-desc,
  .char-count,
  .item-time,
  .empty-text,
  .empty-sub {
    color: var(--theme-muted, $text-muted);
  }

  .sender-input,
  .send-input {
    border-bottom-color: var(--theme-border, $border-color);
  }

  .send-btn,
  .feature-action,
  .pinned-tag,
  .empty-action {
    background: var(--theme-accent, $text-primary);
    color: var(--theme-on-accent, #fff);
  }

  .blessing-item {
    border-bottom-color: var(--theme-border, $border-color);
  }

  .blessing-item.pinned {
    background: var(--theme-elevated, $bg-muted);
  }
}
</style>
