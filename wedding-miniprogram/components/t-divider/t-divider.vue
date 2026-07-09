<template>
  <view class="t-divider" :class="{ center }">
    <view class="t-divider-line" />
    <text class="t-divider-text" v-if="text">{{ text }}</text>
    <view class="t-divider-line" v-if="text" />
  </view>
</template>

<script setup>
defineProps({
  text: { type: String, default: '' },
  center: { type: Boolean, default: false }
})
</script>

<style lang="scss" scoped>
.t-divider {
  display: flex;
  align-items: center;
  gap: $sp-2;
  margin: $sp-5;
}
.t-divider.center {
  justify-content: center;
}
.t-divider-line {
  width: 56rpx;
  height: 2rpx;
  background: $gold;
  opacity: 0.72;
}
.t-divider-text {
  color: $gold;
  font-size: $fs-cap;
  letter-spacing: $ls-wide;
  text-transform: uppercase;
}
</style>
