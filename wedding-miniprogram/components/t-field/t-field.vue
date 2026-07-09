<template>
  <view class="t-field">
    <view class="t-field-head" v-if="label || note">
      <text class="t-field-label" v-if="label">{{ label }}</text>
      <text class="t-field-note" v-if="note">{{ note }}</text>
    </view>
    <slot />
  </view>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  note: { type: String, default: '' }
})
</script>

<style lang="scss" scoped>
.t-field {
  padding: $sp-3 0;
  @include hairline-bottom;
}
.t-field-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: $sp-2;
  margin-bottom: $sp-2;
}
.t-field-label {
  color: $ink;
  font-size: $fs-note;
  font-weight: 600;
}
.t-field-note {
  color: $ink-soft;
  font-size: $fs-cap;
}
</style>
