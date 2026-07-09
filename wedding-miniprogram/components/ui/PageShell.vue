<template>
  <view class="ui-page-shell" :class="[themeClass, { 'safe-bottom': safeBottom }]">
    <view class="ui-page-head" v-if="title || kicker || desc">
      <text class="ui-kicker" v-if="kicker">{{ kicker }}</text>
      <text class="ui-title" v-if="title">{{ title }}</text>
      <text class="ui-desc" v-if="desc">{{ desc }}</text>
    </view>
    <slot />
  </view>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  kicker: { type: String, default: '' },
  desc: { type: String, default: '' },
  themeClass: { type: String, default: '' },
  safeBottom: { type: Boolean, default: true }
})
</script>

<style lang="scss" scoped>
.ui-page-shell {
  min-height: 100vh;
  background:
    linear-gradient(180deg, var(--theme-page-soft, rgba(255, 248, 245, 0.98)) 0%, var(--theme-page, rgba(255, 255, 255, 0.98)) 42%, var(--theme-page-soft, rgba(255, 248, 245, 1)) 100%);
  color: var(--theme-ink, $text-primary);
}
.safe-bottom {
  padding-bottom: calc(72rpx + env(safe-area-inset-bottom));
}
.ui-page-head {
  padding: calc(#{$page-header-top} + env(safe-area-inset-top)) $page-gutter $page-header-bottom;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 100%);
}
.ui-kicker {
  display: block;
  margin-bottom: 12rpx;
  color: $gold;
  font-size: 20rpx;
  font-weight: 600;
  letter-spacing: $ls-wide;
  text-transform: uppercase;
  line-height: 1.2;
}
.ui-title {
  display: block;
  color: var(--theme-ink, $text-primary);
  font-family: $font-serif;
  font-size: $font-h1;
  font-weight: 600;
  line-height: 1.18;
  letter-spacing: 0;
}
.ui-desc {
  display: block;
  margin-top: 16rpx;
  color: var(--theme-muted, $text-secondary);
  font-size: $font-body-sm;
  line-height: 1.55;
}
</style>
