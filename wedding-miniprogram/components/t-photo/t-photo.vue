<template>
  <view class="t-photo" @click="$emit('tap')">
    <view class="t-photo-frame">
      <image class="t-photo-image" :class="treatmentClass" :src="src" :mode="mode" lazy-load />
    </view>
    <text class="t-photo-caption" v-if="caption">{{ caption }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  src: { type: String, required: true },
  caption: { type: String, default: '' },
  mode: { type: String, default: 'aspectFill' },
  treatment: { type: String, default: 'original' }
})

defineEmits(['tap'])

const treatmentClass = computed(() => {
  const value = String(props.treatment || 'original').toLowerCase()
  if (['silver', 'silver-bw', 'black-white', 'bw'].includes(value)) return 'silver'
  if (['tint', 'soft-color', 'light-color'].includes(value)) return 'tint'
  return ''
})
</script>

<style lang="scss" scoped>
.t-photo {
  @include photo-mount;
  box-sizing: border-box;
}
.t-photo-frame {
  position: relative;
  width: 100%;
  padding-top: $photo-ratio;
  overflow: hidden;
  background: $paper-deep;
}
.t-photo-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  filter: none;
}
.t-photo-image.silver {
  filter: grayscale(1) contrast(1.04);
}
.t-photo-image.tint {
  filter: saturate(0.86) contrast(0.96);
}
.t-photo-caption {
  display: block;
  margin-top: $sp-2;
  color: $ink-soft;
  font-family: $font-num;
  font-size: $fs-cap;
  line-height: 1.35;
  text-align: center;
  word-break: break-word;
}
</style>
