<template>
  <text class="t-eyebrow"><slot>{{ text }}</slot></text>
</template>

<script setup>
defineProps({
  text: { type: String, default: '' }
})
</script>

<style lang="scss" scoped>
.t-eyebrow {
  display: block;
  @include eyebrow;
  line-height: 1.2;
}
</style>
