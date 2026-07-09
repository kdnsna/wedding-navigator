<template>
  <view class="ui-template-card" :class="{ selected, compact, disabled }" @click="handleSelect">
    <view class="ui-template-visual">
      <image class="ui-template-image" :src="template.defaultHero" mode="aspectFill" />
      <view class="ui-template-shade" />
      <text class="ui-template-kicker">{{ template.kicker }}</text>
      <text class="ui-template-name">{{ template.shortName }}</text>
      <text class="ui-template-tier" :class="{ premium }">{{ tierLabel }}</text>
    </view>
    <view class="ui-template-body">
      <view class="ui-template-head">
        <text class="ui-template-title">{{ template.name }}</text>
        <text class="ui-template-state">{{ selected ? '已选择' : '选择' }}</text>
      </view>
      <text class="ui-template-desc">{{ template.desc }}</text>
      <text class="ui-template-copy" v-if="!compact">{{ template.copy }}</text>
      <view class="ui-template-actions" v-if="!compact">
        <button class="ui-template-btn primary" :disabled="disabled" @click.stop="handleSelect">
          {{ selected ? '当前模板' : '选择模板' }}
        </button>
        <button class="ui-template-btn" :disabled="disabled" @click.stop="handlePreview">完整预览</button>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  template: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  tierLabel: { type: String, default: '' },
  premium: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['select', 'preview'])

function handleSelect() {
  if (props.disabled) return
  emit('select', props.template)
}

function handlePreview() {
  if (props.disabled) return
  emit('preview', props.template)
}
</script>

<style lang="scss" scoped>
.ui-template-card {
  background: $ink-inverse;
  border: 1rpx solid $border-light;
  border-radius: $card-radius;
  overflow: hidden;
  box-shadow: $shadow-sm;
}
.ui-template-card.selected {
  border-color: $color-primary;
  box-shadow: $shadow-gold;
}
.ui-template-card.disabled {
  opacity: 0.62;
  pointer-events: none;
}
.ui-template-visual {
  position: relative;
  height: 360rpx;
  overflow: hidden;
  background: $color-primary-dark;
}
.ui-template-card.compact .ui-template-visual {
  height: 220rpx;
}
.ui-template-image,
.ui-template-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.ui-template-shade {
  background: linear-gradient(180deg, rgba(20, 4, 8, 0.12) 0%, rgba(20, 4, 8, 0.18) 44%, rgba(20, 4, 8, 0.72) 100%);
}
.ui-template-kicker {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  bottom: 96rpx;
  color: rgba(255, 255, 255, 0.72);
  font-size: 18rpx;
  font-weight: 600;
  letter-spacing: 0;
}
.ui-template-name {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  bottom: 34rpx;
  color: $ink-inverse;
  font-family: $font-serif;
  font-size: 46rpx;
  font-weight: 600;
  letter-spacing: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ui-template-tier {
  position: absolute;
  top: 22rpx;
  right: 22rpx;
  padding: 8rpx 14rpx;
  border-radius: $radius-sm;
  background: rgba(255, 255, 255, 0.88);
  color: $color-success;
  font-size: 20rpx;
  font-weight: 600;
}
.ui-template-tier.premium {
  color: $gold;
}
.ui-template-body {
  padding: 24rpx;
}
.ui-template-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 10rpx;
}
.ui-template-title {
  flex: 1;
  min-width: 0;
  color: $text-primary;
  font-size: $font-h3;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ui-template-state {
  flex-shrink: 0;
  color: $color-primary;
  font-size: $font-caption;
  font-weight: 600;
}
.ui-template-desc,
.ui-template-copy {
  display: block;
  color: $text-secondary;
  font-size: $font-caption;
  line-height: 1.5;
}
.ui-template-copy {
  margin-top: 8rpx;
  color: $text-muted;
}
.ui-template-actions {
  display: flex;
  gap: 14rpx;
  margin-top: 22rpx;
}
.ui-template-btn {
  flex: 1;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-sm;
  background: $bg-muted;
  color: $text-primary;
  font-size: $font-body-sm;
  padding: 0;
}
.ui-template-btn.primary {
  background: $text-primary;
  color: $ink-inverse;
}
.ui-template-btn::after {
  border: none;
}
</style>
