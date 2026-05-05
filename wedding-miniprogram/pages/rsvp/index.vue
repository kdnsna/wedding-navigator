<template>
  <view class="page">
    <!-- 顶部信息 -->
    <view class="rsvp-header">
      <text class="header-title">💌 期待您的光临</text>
      <text class="header-subtitle">{{ coupleName }} 诚邀您出席婚礼</text>
      <view class="header-info">
        <text class="info-item">📅 {{ formatDate(weddingDate) }}</text>
        <text class="info-item">🕛 {{ weddingTime || '12:00' }}</text>
        <text class="info-item">📍 {{ venueName }}</text>
      </view>
    </view>

    <!-- 表单 -->
    <view class="rsvp-form" v-if="!submitted">
      <!-- 是否出席 -->
      <view class="form-group">
        <text class="form-label">是否出席？</text>
        <view class="attend-options">
          <view
            class="attend-option"
            :class="{ active: form.attending }"
            @click="form.attending = true"
          >
            <text class="option-icon">✅</text>
            <text class="option-text">出席</text>
          </view>
          <view
            class="attend-option"
            :class="{ active: !form.attending }"
            @click="form.attending = false"
          >
            <text class="option-icon">❌</text>
            <text class="option-text">遗憾缺席</text>
          </view>
        </view>
      </view>

      <!-- 出席人数 -->
      <view class="form-group" v-if="form.attending">
        <text class="form-label">出席人数（含本人）</text>
        <view class="count-stepper">
          <button class="stepper-btn" @click="decrement">-</button>
          <text class="stepper-value">{{ form.count }}</text>
          <button class="stepper-btn" @click="increment">+</button>
        </view>
      </view>

      <!-- 姓名 -->
      <view class="form-group">
        <text class="form-label">您的姓名</text>
        <input
          class="form-input"
          v-model="form.name"
          placeholder="请输入您的姓名"
          maxlength="20"
        />
      </view>

      <!-- 电话 -->
      <view class="form-group">
        <text class="form-label">联系电话</text>
        <input
          class="form-input"
          v-model="form.phone"
          placeholder="请输入您的手机号"
          type="number"
          maxlength="11"
        />
      </view>

      <!-- 饮食偏好 -->
      <view class="form-group" v-if="form.attending">
        <text class="form-label">饮食偏好</text>
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

      <!-- 特殊要求 -->
      <view class="form-group" v-if="form.attending">
        <text class="form-label">特殊要求（可选）</text>
        <textarea
          class="form-textarea"
          v-model="form.notes"
          placeholder="如：海鲜过敏、需儿童座椅等"
          maxlength="200"
        />
      </view>

      <!-- 提交按钮 -->
      <button class="submit-btn" @click="handleSubmit">
        提交回执
      </button>
    </view>

    <!-- 提交成功 -->
    <view class="success-card" v-else>
      <text class="success-icon">✅</text>
      <text class="success-title">已收到您的回执，感谢！</text>
      <view class="success-info">
        <text>📍 婚礼地址：{{ venueName }}</text>
        <text>📅 {{ formatDate(weddingDate) }} {{ weddingTime || '12:00' }}</text>
      </view>
      <view class="success-actions">
        <button class="action-btn" @click="openNavigation">
          <text>🗺️ 查看路线</text>
        </button>
        <button class="action-btn" @click="callPhone">
          <text>📞 拨打电话</text>
        </button>
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

function increment() {
  if (form.value.count < 20) form.value.count++
}
function decrement() {
  if (form.value.count > 1) form.value.count--
}

async function handleSubmit() {
  if (!form.value.name.trim()) {
    showError('请输入您的姓名')
    return
  }
  if (!form.value.phone.trim() || form.value.phone.length !== 11) {
    showError('请输入正确的手机号')
    return
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
  if (phone) {
    uni.makePhoneCall({ phoneNumber: phone })
  }
}

onLoad((options) => {
  weddingId.value = options?.id || userStore.weddingId
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 30rpx;
}

/* 头部 */
.rsvp-header {
  text-align: center;
  padding: 40rpx 20rpx;
  margin-bottom: 30rpx;
}
.header-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: $color-primary;
  margin-bottom: 20rpx;
}
.header-subtitle {
  display: block;
  font-size: 30rpx;
  color: $text-primary;
  margin-bottom: 30rpx;
}
.header-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.info-item {
  font-size: 28rpx;
  color: $text-secondary;
}

/* 表单 */
.rsvp-form {
  background: $bg-surface;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: $shadow-sm;
}
.form-group {
  margin-bottom: 40rpx;
}
.form-label {
  display: block;
  font-size: 30rpx;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 20rpx;
}

/* 出席选项 */
.attend-options {
  display: flex;
  gap: 20rpx;
}
.attend-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 20rpx;
  border: 2rpx solid $border-light;
  border-radius: 16rpx;
  background: $bg-muted;
}
.attend-option.active {
  border-color: $color-primary;
  background: rgba(196, 30, 58, 0.05);
}
.option-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
}
.option-text {
  font-size: 28rpx;
  color: $text-primary;
}

/* 步进器 */
.count-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40rpx;
}
.stepper-btn {
  width: 64rpx;
  height: 64rpx;
  line-height: 64rpx;
  text-align: center;
  border-radius: 50%;
  background: $bg-muted;
  font-size: 36rpx;
  color: $text-primary;
}
.stepper-btn::after {
  border: none;
}
.stepper-value {
  font-size: 40rpx;
  font-weight: 700;
  color: $color-primary;
  min-width: 60rpx;
  text-align: center;
}

/* 输入框 */
.form-input {
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  border: 2rpx solid $border-light;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: $bg-muted;
  box-sizing: border-box;
}
.form-textarea {
  width: 100%;
  height: 160rpx;
  padding: 20rpx 24rpx;
  border: 2rpx solid $border-light;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: $bg-muted;
  box-sizing: border-box;
}

/* 饮食选项 */
.diet-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.diet-option {
  padding: 16rpx 32rpx;
  border: 2rpx solid $border-light;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: $text-primary;
  background: $bg-muted;
}
.diet-option.active {
  border-color: $color-primary;
  background: rgba(196, 30, 58, 0.05);
  color: $color-primary;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  text-align: center;
  border-radius: 16rpx;
  background: linear-gradient(135deg, $color-primary 0%, #E91E63 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
}
.submit-btn::after {
  border: none;
}

/* 成功卡片 */
.success-card {
  text-align: center;
  padding: 80rpx 40rpx;
  background: $bg-surface;
  border-radius: 24rpx;
  box-shadow: $shadow-sm;
}
.success-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 30rpx;
}
.success-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: $color-primary;
  margin-bottom: 40rpx;
}
.success-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 40rpx;
}
.success-info text {
  font-size: 28rpx;
  color: $text-secondary;
}
.success-actions {
  display: flex;
  gap: 20rpx;
}
.action-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 12rpx;
  background: #f5f5f5;
  font-size: 28rpx;
  color: $text-primary;
}
.action-btn::after {
  border: none;
}
</style>
