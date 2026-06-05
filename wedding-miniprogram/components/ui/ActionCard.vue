<template>
  <view class="ui-action-card" :class="[tone, { disabled }]" @click="handleClick">
    <view class="ui-action-icon-wrap" v-if="icon">
      <image class="ui-action-icon" :src="icon" mode="aspectFit" />
    </view>
    <view class="ui-action-copy">
      <view class="ui-action-row">
        <text class="ui-action-title">{{ title }}</text>
        <text class="ui-action-status" v-if="status">{{ status }}</text>
      </view>
      <text class="ui-action-desc" v-if="desc">{{ desc }}</text>
    </view>
    <image class="ui-action-arrow" src="/static/visuals/icon-chevron-right.svg" mode="aspectFit" />
  </view>
</template>

<script setup>
const props = defineProps({
  title: { type: String, required: true },
  desc: { type: String, default: '' },
  icon: { type: String, default: '' },
  tone: { type: String, default: 'default' },
  status: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['click'])

function handleClick() {
  if (!props.disabled) emit('click')
}
</script>

<style lang="scss" scoped>
.ui-action-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  min-height: 112rpx;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.94);
  border: 1rpx solid var(--theme-border, $border-color);
  border-radius: $card-radius;
  box-shadow: $shadow-sm;
  box-sizing: border-box;
}
.ui-action-card:active {
  opacity: 0.82;
}
.ui-action-card.primary {
  background: var(--theme-strong-bg, $text-primary);
  border-color: var(--theme-strong-border, transparent);
}
.ui-action-card.gold {
  background: #FFF8EA;
  border-color: rgba(201, 169, 110, 0.30);
}
.ui-action-card.disabled {
  opacity: 0.55;
}
.ui-action-icon-wrap {
  width: 64rpx;
  height: 64rpx;
  border-radius: $radius-sm;
  background: var(--theme-accent-soft, rgba(176, 58, 91, 0.10));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ui-action-icon {
  width: 34rpx;
  height: 34rpx;
}
.ui-action-copy {
  flex: 1;
  min-width: 0;
}
.ui-action-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.ui-action-title {
  flex: 1;
  min-width: 0;
  color: var(--theme-ink, $text-primary);
  font-size: $font-body;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ui-action-card.primary .ui-action-title {
  color: var(--theme-strong-ink, #fff);
}
.ui-action-status {
  flex-shrink: 0;
  padding: 6rpx 12rpx;
  border-radius: $radius-sm;
  background: var(--theme-accent-soft, rgba(176, 58, 91, 0.10));
  color: var(--theme-accent, $color-primary);
  font-size: $font-mini;
  line-height: 1.2;
}
.ui-action-desc {
  display: block;
  margin-top: 8rpx;
  color: var(--theme-muted, $text-secondary);
  font-size: $font-caption;
  line-height: 1.42;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.ui-action-card.primary .ui-action-desc {
  color: var(--theme-strong-muted, rgba(255, 255, 255, 0.70));
}
.ui-action-arrow {
  width: 30rpx;
  height: 30rpx;
  opacity: 0.58;
  flex-shrink: 0;
}
</style>
