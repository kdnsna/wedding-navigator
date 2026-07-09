<template>
  <view class="t-card" :class="{ flush }">
    <slot />
  </view>
</template>

<script setup>
defineProps({
  flush: { type: Boolean, default: false }
})
</script>

<style lang="scss" scoped>
.t-card {
  @include card;
  margin: 0 $sp-5 $sp-4;
  padding: $sp-4;
}
.t-card.flush {
  padding: 0;
  overflow: hidden;
}
</style>
