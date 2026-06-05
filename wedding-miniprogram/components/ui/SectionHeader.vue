<template>
  <view class="ui-section-header" :class="{ compact }">
    <view class="ui-section-rule" />
    <view class="ui-section-copy">
      <text class="ui-section-kicker" v-if="kicker">{{ kicker }}</text>
      <text class="ui-section-title">{{ title }}</text>
      <text class="ui-section-desc" v-if="desc">{{ desc }}</text>
    </view>
    <view class="ui-section-side">
      <slot name="side" />
    </view>
  </view>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  kicker: { type: String, default: '' },
  desc: { type: String, default: '' },
  compact: { type: Boolean, default: false }
})
</script>

<style lang="scss" scoped>
.ui-section-header {
  display: flex;
  align-items: flex-start;
  gap: 18rpx;
  padding: 0 $page-gutter;
  margin-bottom: 24rpx;
}
.ui-section-header.compact {
  margin-bottom: 16rpx;
}
.ui-section-rule {
  width: 4rpx;
  height: 48rpx;
  margin-top: 6rpx;
  background: var(--theme-accent, $color-primary);
  border-radius: 2rpx;
  flex-shrink: 0;
}
.ui-section-copy {
  flex: 1;
  min-width: 0;
}
.ui-section-kicker {
  display: block;
  margin-bottom: 7rpx;
  color: var(--theme-accent, $color-primary);
  font-size: 18rpx;
  font-weight: 600;
  letter-spacing: 0;
}
.ui-section-title {
  display: block;
  color: var(--theme-ink, $text-primary);
  font-family: $font-serif;
  font-size: $font-h2;
  font-weight: 600;
  line-height: 1.2;
}
.ui-section-desc {
  display: block;
  margin-top: 8rpx;
  color: var(--theme-muted, $text-secondary);
  font-size: $font-caption;
  line-height: 1.5;
}
.ui-section-side {
  flex-shrink: 0;
}
</style>
