<template>
  <PageShell
    title="祝福墙"
    kicker="BLESSINGS"
    :desc="blessingDesc"
    :theme-class="templateClass"
  >

    <!-- 发送区域 -->
    <EmptyState
      v-if="!isBlessingEnabled"
      icon="/static/visuals/icon-blessing.svg"
      title="祝福这一章暂未启封"
      desc="可先翻到路书，查看婚礼时间、地点和到场路线。"
      action-text="查看路线"
      @action="goToGuide"
    />

    <view class="send-area" v-if="isBlessingEnabled">
      <view class="sender-row">
        <input
          class="sender-input"
          v-model="senderName"
          :placeholder="allowAnonymousBlessing ? '您的称呼' : '请输入您的称呼'"
          placeholder-class="input-placeholder"
          maxlength="20"
        />
      </view>
      <textarea
        class="send-input"
        v-model="newBlessing"
        placeholder="写下您对新人的祝福..."
        placeholder-class="input-placeholder"
        maxlength="500"
        :focus="blessingInputFocus"
        @blur="blessingInputFocus = false"
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
    <EmptyState
      v-if="isBlessingEnabled && !loading && (blessings.length === 0 || !blessingPublic)"
      icon="/static/visuals/empty-blessing.svg"
      :title="emptyText"
      :desc="emptySub"
      :action-text="emptyActionText"
      @action="handleEmptyAction"
    />

    <view class="loading-state" v-if="isBlessingEnabled && loading">
      <text>祝福加载中...</text>
    </view>
  </PageShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding, submitBlessing } from '@/composables/useCloud.js'
import { showSuccess, showError, formatRelativeTime } from '@/utils/index.js'
import PageShell from '@/components/ui/PageShell.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const store = useWeddingStore()
const userStore = useUserStore()
const newBlessing = ref('')
const senderName = ref('')
const sending = ref(false)
const loading = ref(false)
const loadError = ref('')
const blessingInputFocus = ref(false)
const activeTemplate = computed(() => store.activeTemplate)
const templateClass = computed(() => store.templateClass)
const isBlessingEnabled = computed(() => store.isBlessingEnabled)
const blessingPublic = computed(() => store.blessingPublic)
const allowAnonymousBlessing = computed(() => store.allowAnonymousBlessing)
const blessingDesc = computed(() => {
  if (!isBlessingEnabled.value) return '祝福这一章暂未启封'
  const countText = blessings.value.length > 0 ? `${blessings.value.length} 条祝福` : '还在等待第一条祝福'
  return `${activeTemplate.value.shortName} · ${countText}`
})

const blessings = computed(() => {
  const list = store.blessings?.blessings || []
  return [...list].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return (b.created_at || 0) - (a.created_at || 0)
  })
})
const emptyText = computed(() => {
  if (!userStore.weddingId) return '这封信还没有抵达'
  if (loadError.value) return '这一页暂时没翻开'
  if (!blessingPublic.value) return '祝福已提交给新人查看'
  return '祝福这一章，等您轻轻落笔'
})
const emptySub = computed(() => {
  if (!userStore.weddingId) return '从新人寄来的请柬进入后，这一章会铺开'
  if (loadError.value) return '稍后再翻，这一页会重新铺开'
  return ''
})
const emptyActionText = computed(() => {
  if (!userStore.weddingId) return ''
  if (loadError.value) return '重新加载'
  return blessingPublic.value ? '写第一条祝福' : '继续写祝福'
})

function formatTime(ts) {
  return formatRelativeTime(ts)
}

function focusBlessing() {
  uni.pageScrollTo({ scrollTop: 0, duration: 250 })
  setTimeout(() => {
    blessingInputFocus.value = true
  }, 260)
}

function handleEmptyAction() {
  if (loadError.value) {
    loadBlessings(true)
    return
  }
  focusBlessing()
}

async function sendTextBlessing() {
  const content = newBlessing.value.trim()
  if (!content) { showError('请输入祝福内容'); return }
  if (!userStore.weddingId) { showError('这封信还没有抵达'); return }
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
    loadError.value = ''
    showSuccess('发送成功')
  } catch (err) {
    showError(err?.message || '发送失败')
  } finally {
    sending.value = false
    uni.hideLoading()
  }
}

function goToGuide() {
  uni.switchTab({
    url: '/pages/guide/index',
    fail: (err) => {
      console.warn('祝福墙打开路书失败:', err)
      uni.showToast({ title: '路书打开失败，请稍后重试', icon: 'none' })
    }
  })
}

async function loadBlessings(force = false) {
  if (!userStore.weddingId || loading.value) return
  if (!force && blessings.value.length > 0) return
  loading.value = true
  loadError.value = ''
  try {
    await fetchWedding(userStore.weddingId, force)
  } catch (err) {
    console.warn('祝福读取受阻:', err)
    loadError.value = '稍后再翻，这一页会重新铺开'
  } finally {
    loading.value = false
  }
}

onShow(() => loadBlessings(false))
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
  color: $ink-inverse;
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

.loading-state {
  text-align: center;
  padding: 90rpx $page-gutter;
  color: var(--theme-muted, $text-muted);
  font-size: $font-body-sm;
}

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
  color: $ink-inverse;
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
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12rpx;
  gap: 16rpx;
}
.item-name {
  font-size: 28rpx;
  font-weight: 600;
  color: $text-primary;
  flex: 1;
  min-width: 0;
  line-height: 1.35;
  word-break: break-word;
}
.item-time {
  font-size: 20rpx;
  color: $text-muted;
  flex-shrink: 0;

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
  font-family: $font-serif;
  vertical-align: -8rpx;
}
.item-content::after {
  content: '”';
  font-size: 36rpx;
  line-height: 1;
  color: $text-primary;
  opacity: 0.16;
  margin-left: 4rpx;
  font-family: $font-serif;
  vertical-align: -8rpx;
}
.pinned-tag {
  position: absolute;
  top: 32rpx;
  right: $page-gutter;
  padding: 4rpx 12rpx;
  background: var(--theme-accent-soft, $gold-soft);
  color: var(--theme-accent, $color-primary);
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
  color: $ink-inverse;
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

.theme-wine,
.theme-cinnabar,
.theme-indigo,
.theme-pine {
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
  .empty-action {
    background: var(--theme-accent, $text-primary);
    color: var(--theme-on-accent, $ink-inverse);
  }

  .pinned-tag {
    background: var(--theme-accent-soft, rgba(176,58,91,0.10));
    color: var(--theme-accent, $color-primary);
  }

  .blessing-item {
    border-bottom-color: var(--theme-border, $border-color);
  }

  .blessing-item.pinned {
    background: var(--theme-elevated, $bg-muted);
  }
}
</style>
