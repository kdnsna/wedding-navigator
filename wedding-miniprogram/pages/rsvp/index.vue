<template>
  <view class="page">
    <!-- 头部 -->
    <view class="rsvp-header">
      <text class="header-tag">RSVP</text>
      <text class="header-title">出席回执</text>
      <text class="header-sub">{{ coupleName }}</text>
      <text class="header-date">{{ formatDate(weddingDate) }} {{ weddingTime || '12:00' }}</text>
      <text class="header-venue">{{ venueName }}</text>
    </view>

    <!-- 表单 -->
    <view class="rsvp-form" v-if="!submitted">
      <view class="form-section">
        <text class="section-label">是否出席</text>
        <view class="attend-options">
          <view
            class="attend-option"
            :class="{ active: form.attending }"
            @click="form.attending = true"
          >
            <text class="option-text">出席</text>
          </view>
          <view
            class="attend-option"
            :class="{ active: !form.attending }"
            @click="form.attending = false"
          >
            <text class="option-text">无法出席</text>
          </view>
        </view>
      </view>

      <view class="form-section" v-if="form.attending">
        <text class="section-label">出席人数</text>
        <view class="count-stepper">
          <button class="stepper-btn" @click="decrement">−</button>
          <text class="stepper-value">{{ form.count }}</text>
          <button class="stepper-btn" @click="increment">+</button>
        </view>
      </view>

      <view class="form-section">
        <text class="section-label">您的姓名</text>
        <input
          class="form-input"
          v-model="form.name"
          placeholder="请输入姓名"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="form-section">
        <text class="section-label">联系电话</text>
        <input
          class="form-input"
          v-model="form.phone"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="form-section" v-if="form.attending">
        <text class="section-label">饮食偏好</text>
        <view class="diet-options">
          <view
            class="diet-option"
            v-for="opt in dietOptions"
            :key="opt.value"
            :class="{ active: form.diet === opt.value }"
            @click="form.diet = opt.value"
          >
            {{ opt.label }}
          </view>
        </view>
      </view>

      <view class="form-section">
        <text class="section-label">备注</text>
        <textarea
          class="form-textarea"
          v-model="form.notes"
          placeholder="如有其他需求请在此留言"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="form-actions">
        <button class="submit-btn" @click="handleSubmit">提交回执</button>
      </view>
    </view>

    <!-- 提交成功 -->
    <view class="success-view" v-else>
      <view class="success-mark">✓</view>
      <text class="success-title">已收到您的回执</text>
      <text class="success-desc">期待与您相见</text>
      <view class="success-info">
        <text class="info-line">{{ formatDate(weddingDate) }} {{ weddingTime || '12:00' }}</text>
        <text class="info-line">{{ venueName }}</text>
      </view>
      <view class="success-actions">
        <button class="action-btn primary" @click="openNavigation">查看路线</button>
        <button class="action-btn" @click="callPhone">联系新人</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { submitRSVP } from '@/composables/useCloud.js'
import { formatDate, showSuccess, showError } from '@/utils/index.js'

const store = useWeddingStore()
const userStore = useUserStore()

const submitted = ref(false)
const weddingId = ref('')

const form = ref({
  attending: true,
  count: 1,
  name: '',
  phone: '',
  diet: 'normal',
  notes: ''
})

const coupleName = computed(() => store.coupleName)
const weddingDate = computed(() => store.weddingDate)
const weddingTime = computed(() => store.weddingTime)
const venueName = computed(() => store.venueName)

const dietOptions = [
  { label: '普通', value: 'normal' },
  { label: '素食', value: 'vegetarian' },
  { label: '清真', value: 'halal' },
  { label: '其他', value: 'other' }
]

function increment() { if (form.value.count < 20) form.value.count++ }
function decrement() { if (form.value.count > 1) form.value.count-- }

async function handleSubmit() {
  if (!form.value.name.trim()) { showError('请输入您的姓名'); return }
  if (!form.value.phone.trim() || form.value.phone.length !== 11) {
    showError('请输入正确的手机号'); return
  }

  try {
    uni.showLoading({ title: '提交中...', mask: true })
    await submitRSVP(weddingId.value, {
      name: form.value.name,
      phone: form.value.phone,
      rsvp_status: form.value.attending ? 'attending' : 'declined',
      attending_count: form.value.attending ? form.value.count : 0,
      diet_preference: form.value.attending ? form.value.diet : 'normal',
      diet_notes: form.value.notes
    })
    submitted.value = true
    showSuccess('提交成功')
  } catch (err) {
    showError(err.message || '提交失败')
  } finally {
    uni.hideLoading()
  }
}

function openNavigation() {
  const venue = store.venues?.venues?.[0]
  if (venue?.coordinate) {
    uni.openLocation({
      latitude: venue.coordinate.latitude,
      longitude: venue.coordinate.longitude,
      name: venue.name,
      address: venue.address
    })
  }
}

function callPhone() {
  const phone = store.invitation?.couple?.groom?.phone
  if (phone) { uni.makePhoneCall({ phoneNumber: phone }) }
}

onLoad((options) => {
  weddingId.value = options?.id || userStore.weddingId
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: 60rpx;
}

/* 头部 */
.rsvp-header {
  padding: 60rpx 48rpx 48rpx;
}
.header-tag {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 6rpx;
  margin-bottom: 12rpx;
}
.header-title {
  display: block;
  font-size: $font-h1;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 24rpx;
}
.header-sub {
  display: block;
  font-size: $font-h3;
  color: $text-primary;
  font-weight: 500;
  margin-bottom: 8rpx;
}
.header-date {
  display: block;
  font-size: $font-body;
  color: $text-secondary;
  margin-bottom: 4rpx;
}
.header-venue {
  display: block;
  font-size: $font-body;
  color: $text-secondary;
}

/* 表单 */
.rsvp-form {
  padding: 0 48rpx;
}
.form-section {
  margin-bottom: 48rpx;
}
.section-label {
  display: block;
  font-size: 26rpx;
  color: $text-muted;
  margin-bottom: 20rpx;
  letter-spacing: 2rpx;
}

/* 出席选项 */
.attend-options {
  display: flex;
  gap: 16rpx;
}
.attend-option {
  flex: 1;
  text-align: center;
  padding: 28rpx;
  border-radius: $radius-lg;
  border: 2rpx solid $border-color;
  background: $bg-color;
  transition: all 0.2s ease;
}
.attend-option.active {
  background: $text-primary;
  border-color: $text-primary;
}
.attend-option.active .option-text {
  color: $text-inverse;
}
.attend-option:active {
  transform: scale(0.98);
}
.option-text {
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
}

/* 步进器 */
.count-stepper {
  display: flex;
  align-items: center;
  gap: 48rpx;
}
.stepper-btn {
  width: 64rpx;
  height: 64rpx;
  line-height: 64rpx;
  text-align: center;
  border-radius: 50%;
  background: $bg-muted;
  font-size: 32rpx;
  color: $text-primary;
  font-weight: 500;
  transition: all 0.2s ease;
}
.stepper-btn::after { border: none; }
.stepper-btn:active { background: $border-color; transform: scale(0.92); }
.stepper-value {
  font-size: 44rpx;
  font-weight: 600;
  color: $text-primary;
  min-width: 60rpx;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* 输入框 */
.form-input {
  width: 100%;
  height: 96rpx;
  padding: 0 4rpx;
  border-bottom: 2rpx solid $border-color;
  font-size: 32rpx;
  background: transparent;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}
.form-input:focus {
  border-bottom-color: $text-primary;
}
.input-placeholder {
  color: $text-muted;
  font-size: 28rpx;
}
.form-textarea {
  width: 100%;
  height: 160rpx;
  padding: 24rpx 4rpx;
  border-bottom: 2rpx solid $border-color;
  font-size: 28rpx;
  background: transparent;
  box-sizing: border-box;
}

/* 饮食选项 */
.diet-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.diet-option {
  padding: 20rpx 36rpx;
  border: 2rpx solid $border-color;
  border-radius: $radius-full;
  font-size: 26rpx;
  color: $text-primary;
  background: $bg-color;
  transition: all 0.2s ease;
}
.diet-option.active {
  background: $text-primary;
  border-color: $text-primary;
  color: $text-inverse;
}
.diet-option:active {
  transform: scale(0.96);
}

/* 提交 */
.form-actions {
  margin-top: 64rpx;
}
.submit-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  border-radius: $radius-full;
  background: $text-primary;
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  transition: opacity 0.2s ease;
}
.submit-btn::after { border: none; }
.submit-btn:active { opacity: 0.8; }

/* 成功 */
.success-view {
  text-align: center;
  padding: 120rpx 48rpx;
}
.success-mark {
  width: 96rpx;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  border-radius: 50%;
  background: $color-success;
  color: #fff;
  font-size: 44rpx;
  font-weight: 600;
  margin: 0 auto 40rpx;
}
.success-title {
  display: block;
  font-size: $font-h1;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 12rpx;
}
.success-desc {
  display: block;
  font-size: $font-body;
  color: $text-secondary;
  margin-bottom: 48rpx;
}
.success-info {
  margin-bottom: 48rpx;
}
.info-line {
  display: block;
  font-size: 26rpx;
  color: $text-muted;
  margin-bottom: 8rpx;
}

.success-actions {
  display: flex;
  gap: 20rpx;
}
.success-actions .action-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: $radius-full;
  background: $bg-muted;
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
  transition: opacity 0.2s ease;
}
.success-actions .action-btn::after { border: none; }
.success-actions .action-btn:active { opacity: 0.7; }
.success-actions .action-btn.primary {
  background: $text-primary;
  color: #fff;
}
</style>
