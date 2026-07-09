<template>
  <view class="ui-empty-state">
    <image class="ui-empty-icon" v-if="icon" :src="icon" mode="aspectFit" />
    <text class="ui-empty-title">{{ title }}</text>
    <text class="ui-empty-desc" v-if="desc">{{ desc }}</text>
    <button class="ui-empty-action" v-if="actionText" @click="$emit('action')">{{ actionText }}</button>
  </view>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '' },
  title: { type: String, required: true },
  desc: { type: String, default: '' },
  actionText: { type: String, default: '' }
})
defineEmits(['action'])
</script>

<style lang="scss" scoped>
.ui-empty-state {
  padding: 150rpx $page-gutter;
  text-align: center;
}
.ui-empty-icon {
  width: 180rpx;
  height: 180rpx;
  margin-bottom: 30rpx;
  opacity: 0.92;
}
.ui-empty-title {
  display: block;
  color: var(--theme-ink, $text-primary);
  font-size: $font-h3;
  font-weight: 600;
  line-height: 1.35;
}
.ui-empty-desc {
  display: block;
  margin-top: 12rpx;
  color: var(--theme-muted, $text-secondary);
  font-size: $font-body-sm;
  line-height: 1.6;
}
.ui-empty-action {
  margin-top: 34rpx;
  min-width: 220rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  padding: 0 32rpx;
  border-radius: $radius-sm;
  background: var(--theme-accent, $text-primary);
  color: var(--theme-on-accent, $ink-inverse);
  font-size: $font-body-sm;
  font-weight: 600;
}
.ui-empty-action::after {
  border: none;
}
</style>
