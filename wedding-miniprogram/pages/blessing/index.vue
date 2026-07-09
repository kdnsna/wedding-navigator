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
  padding: 0 $page-gutter 36rpx;
}
.sender-row {
  margin-bottom: 16rpx;
}
.sender-input {
  height: $control-height-sm;
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
  min-width: 160rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  padding: 0 32rpx;
  border-radius: $radius-full;
  background: $text-primary;
  color: $ink-inverse;
  font-size: 26rpx;
  font-weight: 500;
  transition: opacity 0.2s ease;
}
.send-btn::after { border: none; }
.send-btn:active { opacity: 0.8; }
.send-btn[disabled] { opacity: 0.55; }

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
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: $text-primary;
  color: $ink-inverse;
  font-size: 26rpx;
}
.feature-action::after { border: none; }

/* 祝福列表 */
.blessing-list {
  padding: 0 $page-gutter;
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
  margin: 0 (-$page-gutter);
  padding: 32rpx $page-gutter;
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
  font-size: 22rpx;
  color: $text-muted;
  flex-shrink: 0;
}
.item-content {
  display: block;
  font-size: 28rpx;
  color: $text-primary;
  line-height: 1.7;
  word-break: break-word;
}
.pinned-tag {
  position: absolute;
  top: 32rpx;
  right: $page-gutter;
  padding: 4rpx 12rpx;
  background: $text-primary;
  color: $ink-inverse;
  font-size: 18rpx;
  border-radius: 4rpx;
  font-weight: 500;
}
.empty-action {
  margin-top: 32rpx;
  width: 260rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: $text-primary;
  color: $ink-inverse;
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
  .pinned-tag,
  .empty-action {
    background: var(--theme-accent, $text-primary);
    color: var(--theme-on-accent, $ink-inverse);
  }

  .blessing-item {
    border-bottom-color: var(--theme-border, $border-color);
  }

  .blessing-item.pinned {
    background: var(--theme-elevated, $bg-muted);
  }
}
</style>
