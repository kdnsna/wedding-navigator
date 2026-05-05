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
/* ========== RSVP 回执页面 ========== */
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 30rpx;
}

/* ===== 头部 ===== */
.rsvp-header {
  text-align: center;
  padding: 50rpx 20rpx 40rpx;
  margin-bottom: 30rpx;
  position: relative;
}
.rsvp-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 30%;
  right: 30%;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, $color-gold, transparent);
}
.header-title {
  display: block;
  font-size: 44rpx;
  font-weight: 600;
  color: $color-primary;
  margin-bottom: 16rpx;
  letter-spacing: 4rpx;
}
.header-subtitle {
  display: block;
  font-size: 30rpx;
  color: $text-primary;
  margin-bottom: 24rpx;
  font-weight: 500;
}
.header-info {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}
.info-item {
  font-size: 26rpx;
  color: $text-secondary;
  letter-spacing: 1rpx;
}

/* ===== 表单卡片 ===== */
.rsvp-form {
  background: $bg-surface;
  border-radius: 32rpx;
  padding: 44rpx;
  box-shadow: $shadow-md;
  border: 1rpx solid $border-light;
  animation: fadeInScale 0.5s $ease-out both;
}
.form-group {
  margin-bottom: 44rpx;
}
.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 20rpx;
  letter-spacing: 2rpx;
}

/* ===== 出席选项 ===== */
.attend-options {
  display: flex;
  gap: 16rpx;
}
.attend-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36rpx 16rpx;
  border: 2rpx solid $border-light;
  border-radius: 20rpx;
  background: $bg-elevated;
  transition: all 0.25s ease;
}
.attend-option.active {
  border-color: $color-primary;
  background: rgba(196, 30, 58, 0.04);
  box-shadow: 0 4rpx 16rpx rgba(196, 30, 58, 0.08);
}
.attend-option:active {
  transform: scale(0.97);
}
.option-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
}
.option-text {
  font-size: 26rpx;
  color: $text-primary;
  font-weight: 500;
}

/* ===== 步进器 ===== */
.count-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48rpx;
}
.stepper-btn {
  width: 68rpx;
  height: 68rpx;
  line-height: 68rpx;
  text-align: center;
  border-radius: 50%;
  background: $bg-muted;
  font-size: 36rpx;
  color: $text-primary;
  font-weight: 500;
  transition: all 0.2s ease;
}
.stepper-btn::after {
  border: none;
}
.stepper-btn:active {
  background: $border-color;
  transform: scale(0.92);
}
.stepper-value {
  font-size: 44rpx;
  font-weight: 700;
  color: $color-primary;
  min-width: 60rpx;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* ===== 输入框 ===== */
.form-input {
  width: 100%;
  height: 92rpx;
  padding: 0 28rpx;
  border: 2rpx solid $border-light;
  border-radius: 16rpx;
  font-size: 28rpx;
  background: $bg-elevated;
  box-sizing: border-box;
  transition: all 0.2s ease;
}
.form-input:focus {
  border-color: $color-gold;
  box-shadow: 0 0 0 4rpx rgba(212, 168, 83, 0.1);
}
.form-textarea {
  width: 100%;
  height: 160rpx;
  padding: 24rpx 28rpx;
  border: 2rpx solid $border-light;
  border-radius: 16rpx;
  font-size: 28rpx;
  background: $bg-elevated;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

/* ===== 饮食选项 ===== */
.diet-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.diet-option {
  padding: 16rpx 32rpx;
  border: 2rpx solid $border-light;
  border-radius: 14rpx;
  font-size: 26rpx;
  color: $text-primary;
  background: $bg-elevated;
  transition: all 0.2s ease;
}
.diet-option.active {
  border-color: $color-primary;
  background: rgba(196, 30, 58, 0.05);
  color: $color-primary;
  font-weight: 500;
}
.diet-option:active {
  transform: scale(0.95);
}

/* ===== 提交按钮 ===== */
.submit-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  border-radius: 24rpx;
  background: $gradient-primary;
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  box-shadow: 0 6rpx 24rpx rgba(196, 30, 58, 0.25);
  transition: all 0.2s ease;
}
.submit-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 12rpx rgba(196, 30, 58, 0.15);
}
.submit-btn::after {
  border: none;
}

/* ===== 成功卡片 ===== */
.success-card {
  text-align: center;
  padding: 80rpx 48rpx;
  background: $bg-surface;
  border-radius: 32rpx;
  box-shadow: $shadow-md;
  border: 1rpx solid $border-light;
  animation: fadeInScale 0.6s $ease-out-back both;
}
.success-icon {
  font-size: 88rpx;
  display: block;
  margin-bottom: 30rpx;
  filter: drop-shadow(0 4rpx 12rpx rgba(212,168,83,0.3));
}
.success-title {
  display: block;
  font-size: 38rpx;
  font-weight: 600;
  color: $color-primary;
  margin-bottom: 40rpx;
  letter-spacing: 4rpx;
}
.success-info {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-bottom: 44rpx;
}
.success-info text {
  font-size: 28rpx;
  color: $text-secondary;
}

.success-actions {
  display: flex;
  gap: 20rpx;
}
.success-actions .action-btn {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  text-align: center;
  border-radius: 20rpx;
  background: $bg-muted;
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
  transition: all 0.2s ease;
}
.success-actions .action-btn:active {
  transform: scale(0.97);
}
.success-actions .action-btn::after {
  border: none;
}
</style>
