<template>
  <view class="ui-metric-strip">
    <view class="ui-metric-item" v-for="item in items" :key="item.label">
      <text class="ui-metric-value">{{ item.value }}</text>
      <text class="ui-metric-label">{{ item.label }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] }
})
</script>

<style lang="scss" scoped>
.ui-metric-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0 $page-gutter 34rpx;
  background: $ink-inverse;
  border: 1rpx solid $border-light;
  border-radius: $card-radius;
  overflow: hidden;
}
.ui-metric-item {
  min-width: 0;
  padding: 24rpx 8rpx;
  text-align: center;
  border-right: 1rpx solid $border-light;
}
.ui-metric-item:last-child {
  border-right: none;
}
.ui-metric-value {
  display: block;
  color: $text-primary;
  font-size: 38rpx;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.ui-metric-label {
  display: block;
  margin-top: 8rpx;
  color: $text-muted;
  font-size: $font-mini;
  line-height: 1.2;
}
</style>
