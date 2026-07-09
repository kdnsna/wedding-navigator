<template>
  <view class="ai-panel">
    <view class="ai-panel-head">
      <view class="ai-panel-copy">
        <text class="ai-kicker">AI ASSISTANT</text>
        <text class="ai-title">{{ title }}</text>
        <text class="ai-desc">{{ desc }}</text>
      </view>
      <button class="ai-generate-btn" :loading="loading" :disabled="loading || disabled" @click="$emit('generate')">
        {{ loading ? '生成中' : generateText }}
      </button>
    </view>

    <view class="ai-error" v-if="error">
      <text>{{ error }}</text>
    </view>

    <view class="ai-warning" v-for="warning in warnings" :key="warning">
      <text>{{ warning }}</text>
    </view>

    <view class="ai-empty" v-if="!loading && !error && suggestions.length === 0">
      <text>{{ emptyText }}</text>
    </view>

    <view class="ai-suggestion-list" v-if="suggestions.length > 0">
      <view class="ai-suggestion" v-for="item in suggestions" :key="item.id">
        <view class="ai-suggestion-head">
          <text class="ai-suggestion-title">{{ item.title }}</text>
          <button class="ai-apply-btn" :disabled="disabled" @click="$emit('apply', item)">应用</button>
        </view>
        <text class="ai-suggestion-content">{{ previewContent(item.content) }}</text>
        <text class="ai-suggestion-reason" v-if="item.reason">{{ item.reason }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'AI 发布助手' },
  desc: { type: String, default: '生成内容只作为候选，应用后仍需手动保存。' },
  generateText: { type: String, default: '生成候选' },
  emptyText: { type: String, default: '点击生成，获得可应用的候选内容。' },
  suggestions: { type: Array, default: () => [] },
  warnings: { type: Array, default: () => [] },
  error: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})

defineEmits(['generate', 'apply'])

function previewContent(content) {
  if (Array.isArray(content)) {
    return content.map(item => {
      if (typeof item === 'string') return item
      return [item.time, item.title, item.notes].filter(Boolean).join(' ')
    }).join('\n')
  }
  if (content && typeof content === 'object') {
    return Object.entries(content)
      .map(([key, value]) => `${labelMap[key] || key}: ${Array.isArray(value) ? value.join(' / ') : value}`)
      .join('\n')
  }
  return String(content || '')
}

const labelMap = {
  title: '标题',
  description: '描述',
  posterLine: '海报短句',
  transport: '出行方式',
  parking: '停车信息',
  route_tips: '提醒'
}
</script>

<style lang="scss" scoped>
.ai-panel {
  margin: 0 $page-gutter 44rpx;
  padding: 28rpx;
  border-radius: $card-radius;
  border: 1rpx solid rgba(201,169,110,0.36);
  background:
    linear-gradient(135deg, rgba(255,248,245,0.96), rgba(255,255,255,0.98)),
    $bg-color;
}
.ai-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}
.ai-panel-copy {
  min-width: 0;
  flex: 1;
}
.ai-kicker {
  display: block;
  font-size: 18rpx;
  color: $color-gold;
  letter-spacing: 0;
  margin-bottom: 8rpx;
}
.ai-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 8rpx;
}
.ai-desc {
  display: block;
  font-size: 24rpx;
  line-height: 1.5;
  color: $text-secondary;
}
.ai-generate-btn {
  width: 176rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: $text-primary;
  color: #fff;
  font-size: 24rpx;
  flex-shrink: 0;
}
.ai-generate-btn::after,
.ai-apply-btn::after {
  border: none;
}
.ai-generate-btn[disabled],
.ai-apply-btn[disabled] {
  opacity: 0.58;
}
.ai-error,
.ai-warning,
.ai-empty {
  margin-top: 20rpx;
  padding: 18rpx 20rpx;
  border-radius: $radius-md;
  font-size: 24rpx;
  line-height: 1.45;
}
.ai-error {
  background: rgba(159,45,38,0.08);
  color: #9F2D26;
}
.ai-warning {
  background: rgba(201,169,110,0.14);
  color: $text-secondary;
}
.ai-empty {
  background: rgba(26,26,26,0.04);
  color: $text-muted;
}
.ai-suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 22rpx;
}
.ai-suggestion {
  padding: 22rpx;
  border-radius: $radius-md;
  background: #fff;
  border: 1rpx solid $border-color;
}
.ai-suggestion-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 12rpx;
}
.ai-suggestion-title {
  min-width: 0;
  flex: 1;
  font-size: 28rpx;
  font-weight: 600;
  color: $text-primary;
}
.ai-apply-btn {
  width: 112rpx;
  height: 52rpx;
  line-height: 52rpx;
  border-radius: $radius-full;
  background: $color-primary;
  color: #fff;
  font-size: 24rpx;
  flex-shrink: 0;
}
.ai-suggestion-content {
  display: block;
  white-space: pre-line;
  font-size: 26rpx;
  line-height: 1.6;
  color: $text-primary;
  word-break: break-word;
}
.ai-suggestion-reason {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  line-height: 1.45;
  color: $text-muted;
}
</style>
