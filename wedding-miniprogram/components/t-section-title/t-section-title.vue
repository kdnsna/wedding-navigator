<template>
  <view class="t-section-title" :class="{ compact }">
    <t-eyebrow v-if="kicker" :text="kicker" />
    <text class="t-section-heading">{{ title }}</text>
    <text class="t-section-desc" v-if="desc">{{ desc }}</text>
  </view>
</template>

<script setup>
import TEyebrow from '@/components/t-eyebrow/t-eyebrow.vue'

defineOptions({
  components: { TEyebrow }
})

defineProps({
  kicker: { type: String, default: '' },
  title: { type: String, required: true },
  desc: { type: String, default: '' },
  compact: { type: Boolean, default: false }
})
</script>

<style lang="scss" scoped>
.t-section-title {
  padding: 0 $sp-5;
  margin-bottom: $sp-4;
}
.t-section-title.compact {
  margin-bottom: $sp-3;
}
.t-section-heading {
  display: block;
  margin-top: $sp-1;
  color: $ink;
  font-family: $font-serif;
  font-size: $fs-title;
  letter-spacing: $ls-cn;
  line-height: $lh-title;
}
.t-section-desc {
  display: block;
  margin-top: $sp-2;
  color: $ink-soft;
  font-size: $fs-note;
  line-height: $lh-body;
}
</style>
