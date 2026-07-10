<template>
  <view class="ui-bottom-bar">
    <button
      class="ui-bottom-btn secondary"
      :class="{ 'is-disabled': disabled || secondaryDisabled || secondaryLoading }"
      v-if="secondaryText"
      :loading="secondaryLoading"
      :disabled="disabled || secondaryDisabled || secondaryLoading"
      @click="$emit('secondary')"
    >
      {{ secondaryText }}
    </button>
    <button class="ui-bottom-btn primary" :class="{ 'is-disabled': disabled || primaryDisabled || loading }" :loading="loading" :disabled="disabled || primaryDisabled || loading" @click="$emit('primary')">
      {{ primaryText }}
    </button>
  </view>
</template>

<script setup>
defineProps({
  primaryText: { type: String, required: true },
  secondaryText: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  secondaryLoading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  primaryDisabled: { type: Boolean, default: false },
  secondaryDisabled: { type: Boolean, default: false }
})
defineEmits(['primary', 'secondary'])
</script>

<style lang="scss" scoped>
.ui-bottom-bar {
  position: fixed;
  z-index: 50;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 16rpx;
  padding: 18rpx $page-gutter calc(18rpx + env(safe-area-inset-bottom));
  background: rgba(255, 248, 245, 0.94);
  border-top: 1rpx solid rgba(75, 17, 30, 0.08);
  backdrop-filter: blur(18rpx);
}
.ui-bottom-btn {
  flex: 1;
  height: $control-height;
  line-height: $control-height;
  border-radius: $radius-sm;
  font-size: $font-body;
  font-weight: 600;
  letter-spacing: 0;
  padding: 0 20rpx;
}
.ui-bottom-btn::after {
  border: none;
}
.ui-bottom-btn.primary {
  background: var(--theme-accent, $color-primary);
  color: var(--theme-on-accent, $ink-inverse);
}
.ui-bottom-btn.secondary {
  background: $ink-inverse;
  color: $text-primary;
  border: 1rpx solid $border-color;
}
.ui-bottom-btn.is-disabled {
  opacity: 0.56;
}
</style>
