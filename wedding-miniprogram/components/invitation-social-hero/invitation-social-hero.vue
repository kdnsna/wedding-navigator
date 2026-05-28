<template>
  <view class="social-hero">
    <image
      class="hero-image"
      :class="{ default: isDefaultCover }"
      :src="coverImage"
      :mode="coverImageMode"
    />
    <view class="hero-gradient" :class="{ default: isLegacyDefaultCover }" />
    <view class="hero-content">
      <text class="hero-social-label">{{ socialEntryLabel }}</text>
      <text class="hero-tag">{{ activeTemplate.kicker }}</text>
      <text class="hero-names">{{ groomName }} & {{ brideName }}</text>
      <text class="hero-date">{{ formattedDate }}</text>
      <view class="hero-meta">
        <text>{{ weddingTime || '12:00' }}</text>
        <view class="hero-dot" />
        <text>{{ venueName || '婚礼场地' }}</text>
      </view>

      <view class="hero-countdown" v-if="showCountdown && countdown && !countdown.isToday">
        <text class="countdown-num">{{ countdown.days }}</text>
        <view class="countdown-copy">
          <text class="countdown-label">DAYS</text>
          <text class="countdown-desc">距离我们结婚</text>
        </view>
      </view>
      <view class="hero-today" v-if="showCountdown && countdown?.isToday">
        <text class="today-label">TODAY</text>
        <text class="today-desc">就是今天</text>
      </view>

      <view class="share-preview" v-if="sharePreviewText">
        <text>{{ sharePreviewText }}</text>
      </view>

      <view class="hero-actions">
        <button class="hero-btn primary" v-if="isRsvpEnabled" @click="$emit('rsvp')">
          {{ hasSubmittedRsvp ? '修改回执' : '确认出席' }}
        </button>
        <button class="hero-btn" @click="$emit('poster')">保存海报</button>
        <button class="hero-icon-btn" open-type="share">
          <text>↗</text>
        </button>
      </view>
      <button class="route-btn" @click="$emit('navigate')">查看路线与当天安排</button>
    </view>
  </view>
</template>

<script setup>
defineProps({
  socialEntryLabel: { type: String, default: '朋友圈打开即懂' },
  coverImage: { type: String, required: true },
  coverImageMode: { type: String, default: 'aspectFill' },
  isDefaultCover: { type: Boolean, default: false },
  isLegacyDefaultCover: { type: Boolean, default: false },
  activeTemplate: { type: Object, required: true },
  groomName: { type: String, default: '新郎' },
  brideName: { type: String, default: '新娘' },
  formattedDate: { type: String, default: '' },
  weddingTime: { type: String, default: '' },
  venueName: { type: String, default: '' },
  countdown: { type: Object, default: null },
  showCountdown: { type: Boolean, default: true },
  isRsvpEnabled: { type: Boolean, default: true },
  hasSubmittedRsvp: { type: Boolean, default: false },
  sharePreviewText: { type: String, default: '' }
})

defineEmits(['rsvp', 'poster', 'navigate'])
</script>

<style lang="scss" scoped>
.social-hero {
  position: relative;
  height: 86vh;
  min-height: 980rpx;
  max-height: 1280rpx;
  overflow: hidden;
  background: var(--theme-hero-bg, #fcf6f0);
}
.hero-image,
.hero-gradient {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.hero-image {
  z-index: 0;
  filter: var(--theme-hero-filter, none);
}
.hero-image.default {
  opacity: 1;
}
.hero-gradient {
  z-index: 1;
  background: var(--theme-hero-overlay, linear-gradient(
    to bottom,
    rgba(0,0,0,0.28) 0%,
    rgba(0,0,0,0.08) 30%,
    rgba(0,0,0,0.18) 58%,
    rgba(0,0,0,0.62) 100%
  ));
}
.hero-gradient.default {
  background: linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(42,18,25,0.28) 42%, rgba(30,12,18,0.76) 100%);
}
.hero-content {
  position: absolute;
  z-index: 2;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 64rpx $page-gutter calc(44rpx + env(safe-area-inset-bottom));
  color: #fff;
}
.hero-social-label {
  display: inline-flex;
  max-width: 100%;
  padding: 8rpx 18rpx;
  border-radius: $radius-full;
  background: rgba(255,255,255,0.18);
  color: rgba(255,255,255,0.92);
  font-size: 22rpx;
  line-height: 1.2;
}
.hero-tag {
  display: block;
  margin-top: 26rpx;
  font-size: 21rpx;
  color: rgba(255,255,255,0.66);
  letter-spacing: 0;
}
.hero-names {
  display: block;
  margin-top: 14rpx;
  font-size: 66rpx;
  line-height: 1.05;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.hero-date {
  display: block;
  margin-top: 18rpx;
  font-size: 34rpx;
  line-height: 1.25;
}
.hero-meta {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 14rpx;
  color: rgba(255,255,255,0.84);
  font-size: 25rpx;
  line-height: 1.35;
  flex-wrap: wrap;
}
.hero-dot {
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.62);
}
.hero-countdown,
.hero-today,
.share-preview {
  margin-top: 24rpx;
  border-radius: $card-radius;
  background: rgba(0,0,0,0.26);
  backdrop-filter: blur(12rpx);
}
.hero-countdown {
  display: inline-flex;
  align-items: center;
  gap: 18rpx;
  max-width: 100%;
  padding: 18rpx 22rpx;
}
.countdown-num {
  font-size: 48rpx;
  line-height: 1;
  font-weight: 700;
}
.countdown-copy {
  display: flex;
  flex-direction: column;
}
.countdown-label,
.today-label {
  font-size: 20rpx;
  color: rgba(255,255,255,0.62);
  letter-spacing: 0;
}
.countdown-desc,
.today-desc {
  font-size: 24rpx;
  color: rgba(255,255,255,0.92);
  margin-top: 4rpx;
}
.hero-today {
  display: inline-flex;
  flex-direction: column;
  padding: 18rpx 22rpx;
}
.share-preview {
  padding: 18rpx 20rpx;
  color: rgba(255,255,255,0.88);
  font-size: 24rpx;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.hero-actions {
  display: flex;
  gap: 14rpx;
  margin-top: 26rpx;
  align-items: center;
}
.hero-btn,
.route-btn,
.hero-icon-btn {
  height: $control-height;
  line-height: $control-height;
  border-radius: $radius-full;
  background: rgba(255,255,255,0.18);
  color: #fff;
  font-size: 27rpx;
  font-weight: 600;
  padding: 0 28rpx;
}
.hero-btn {
  flex: 1;
  min-width: 0;
}
.hero-btn.primary {
  background: #fff;
  color: #20161a;
}
.hero-icon-btn {
  width: $control-height;
  padding: 0;
  flex-shrink: 0;
}
.route-btn {
  width: 100%;
  margin-top: 16rpx;
  background: rgba(0,0,0,0.22);
  color: rgba(255,255,255,0.92);
}
.hero-btn::after,
.route-btn::after,
.hero-icon-btn::after {
  border: none;
}
</style>
