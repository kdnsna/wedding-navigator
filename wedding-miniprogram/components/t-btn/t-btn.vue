<template>
  <button class="t-btn" :class="[variant, { 'is-disabled': disabled || loading }]" :disabled="disabled || loading" :loading="loading" @click="$emit('tap')">
    <slot>{{ text }}</slot>
  </button>
</template>

<script setup>
defineProps({
  text: { type: String, default: '' },
  variant: { type: String, default: 'solid' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})
defineEmits(['tap'])
</script>

<style lang="scss" scoped>
.t-btn {
  height: $sp-6;
  line-height: $sp-6;
  padding: 0 $sp-4;
  border-radius: $r-sm;
  font-size: $fs-body;
  font-weight: 600;
  letter-spacing: $ls-body;
}
.t-btn::after {
  border: none;
}
.t-btn.solid {
  background: var(--accent);
  color: var(--on-accent);
}
.t-btn.outline {
  background: transparent;
  color: var(--accent);
  border: 1rpx solid var(--accent-line);
}
.t-btn.ghost {
  background: var(--accent-soft);
  color: var(--accent);
}
.t-btn.is-disabled {
  opacity: 0.56;
}
</style>
