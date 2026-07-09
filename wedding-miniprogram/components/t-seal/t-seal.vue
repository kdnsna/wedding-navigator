<template>
  <view class="t-seal" :class="[size, { disabled }]" @click="handleTap">
    <text class="t-seal-char">{{ char }}</text>
  </view>
</template>

<script setup>
const props = defineProps({
  char: { type: String, default: '囍' },
  size: { type: String, default: 'lg' },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['tap'])

function handleTap() {
  if (!props.disabled) emit('tap')
}
</script>

<style lang="scss" scoped>
.t-seal {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $r-full;
  background: var(--accent);
  border: 6rpx solid var(--accent-ink);
  box-shadow: 0 6rpx 24rpx var(--accent-glow);
}
.t-seal.lg {
  width: 128rpx;
  height: 128rpx;
}
.t-seal.sm {
  width: 64rpx;
  height: 64rpx;
  border-width: 4rpx;
}
.t-seal.disabled {
  opacity: 0.56;
}
.t-seal-char {
  color: var(--on-accent);
  font-family: $font-serif;
  font-size: $fs-title;
  line-height: 1;
}
.t-seal.sm .t-seal-char {
  font-size: $fs-note;
}
</style>
