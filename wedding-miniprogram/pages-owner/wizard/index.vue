<template>
  <view class="page">
    <!-- 步骤指示器 -->
    <view class="step-indicator">
      <view
        class="step-dot"
        v-for="i in 4"
        :key="i"
        :class="{ active: i <= currentStep, current: i === currentStep }"
      />
    </view>

    <!-- Step 1: 婚期 -->
    <view class="step-content" v-if="currentStep === 1">
      <view class="step-header">
        <text class="step-title">首先，告诉我们您的婚礼日期</text>
        <text class="step-subtitle">这将用于生成倒计时和婚书请柬</text>
      </view>
      <view class="form-card">
        <view class="form-group">
          <text class="form-label">婚礼日期</text>
          <picker mode="date" :value="form.date" @change="onDateChange">
            <view class="picker-value">{{ form.date || '请选择日期' }}</view>
          </picker>
        </view>
        <view class="form-group">
          <text class="form-label">仪式时间</text>
          <picker mode="time" :value="form.time" @change="onTimeChange">
            <view class="picker-value">{{ form.time || '请选择时间' }}</view>
          </picker>
        </view>
      </view>
    </view>

    <!-- Step 2: 场地 -->
    <view class="step-content" v-if="currentStep === 2">
      <view class="step-header">
        <text class="step-title">婚礼场地在哪里？</text>
        <text class="step-subtitle">宾客将使用这些信息导航到场</text>
      </view>
      <view class="form-card">
        <view class="form-group">
          <text class="form-label">场地名称</text>
          <input class="form-input" v-model="form.venueName" placeholder="例如：华丽大酒楼" />
        </view>
        <view class="form-group">
          <text class="form-label">详细地址</text>
          <input class="form-input" v-model="form.venueAddress" placeholder="请输入详细地址" />
        </view>
      </view>
    </view>

    <!-- Step 3: 模板 -->
    <view class="step-content" v-if="currentStep === 3">
      <view class="step-header">
        <text class="step-title">选择婚书模板风格</text>
        <text class="step-subtitle">可随时在管理后台更换</text>
      </view>
      <view class="template-grid">
        <view
          class="template-card"
          v-for="tpl in templates"
          :key="tpl.id"
          :class="{ active: form.template === tpl.id }"
          @click="form.template = tpl.id"
        >
          <view class="template-preview" :style="{ background: tpl.color }">
            <text class="template-name">{{ tpl.name }}</text>
          </view>
          <text class="template-desc">{{ tpl.desc }}</text>
        </view>
      </view>
    </view>

    <!-- Step 4: 新人信息 -->
    <view class="step-content" v-if="currentStep === 4">
      <view class="step-header">
        <text class="step-title">最后，填写新人信息</text>
        <text class="step-subtitle">这些信息将展示在婚书请柬上</text>
      </view>
      <view class="form-card">
        <view class="form-group">
          <text class="form-label">新郎姓名</text>
          <input class="form-input" v-model="form.groomName" placeholder="新郎姓名" />
        </view>
        <view class="form-group">
          <text class="form-label">新郎手机号</text>
          <input class="form-input" v-model="form.groomPhone" placeholder="新郎手机号" type="number" />
        </view>
        <view class="form-group">
          <text class="form-label">新娘姓名</text>
          <input class="form-input" v-model="form.brideName" placeholder="新娘姓名" />
        </view>
        <view class="form-group">
          <text class="form-label">新娘手机号</text>
          <input class="form-input" v-model="form.bridePhone" placeholder="新娘手机号" type="number" />
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="step-actions">
      <button class="action-btn secondary" v-if="currentStep > 1" @click="prevStep">
        上一步
      </button>
      <button class="action-btn primary" v-if="currentStep < 4" @click="nextStep">
        下一步
      </button>
      <button class="action-btn primary" v-if="currentStep === 4" @click="createWedding">
        创建婚礼
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user.js'
import { useWeddingStore } from '@/stores/wedding.js'
import { generateId, showSuccess, showError } from '@/utils/index.js'

const userStore = useUserStore()
const weddingStore = useWeddingStore()

const currentStep = ref(1)

const form = ref({
  date: '2026-11-14',
  time: '12:00',
  venueName: '',
  venueAddress: '',
  template: 'classic',
  groomName: '',
  groomPhone: '',
  brideName: '',
  bridePhone: ''
})

const templates = [
  { id: 'classic', name: '传统红金', desc: '喜庆庄重，经典中式', color: '#C41E3A' },
  { id: 'modern', name: '现代简约', desc: '清新优雅，时尚大方', color: '#E91E63' },
  { id: 'luxury', name: '轻奢金棕', desc: '低调奢华，高端质感', color: '#8B6914' }
]

function onDateChange(e) {
  form.value.date = e.detail.value
}
function onTimeChange(e) {
  form.value.time = e.detail.value
}

function nextStep() {
  if (!validateStep()) return
  currentStep.value++
}
function prevStep() {
  currentStep.value--
}

function validateStep() {
  if (currentStep.value === 1) {
    if (!form.value.date) {
      showError('请选择婚礼日期')
      return false
    }
  }
  if (currentStep.value === 2) {
    if (!form.value.venueName.trim()) {
      showError('请输入场地名称')
      return false
    }
  }
  if (currentStep.value === 4) {
    if (!form.value.groomName.trim() || !form.value.brideName.trim()) {
      showError('请输入新人姓名')
      return false
    }
  }
  return true
}

async function createWedding() {
  if (!validateStep()) return

  try {
    uni.showLoading({ title: '创建中...', mask: true })

    const weddingId = generateId()
    const weddingData = {
      wedding_id: weddingId,
      owner_id: userStore.openid || 'local_user',
      basic_info: {
        date: form.value.date,
        time: form.value.time,
        week_day: ''
      },
      status: 'published',
      stats: { views: 0, shares: 0, rsvp_count: 0, blessing_count: 0, unique_viewers: 0 },
      share_config: {
        title: `${form.value.groomName} & ${form.value.brideName}的婚礼邀请`,
        description: `${form.value.date}，我们结婚啦！诚邀您的见证~`,
        cover_image: ''
      }
    }

    const invitationData = {
      wedding_id: weddingId,
      template: form.value.template,
      content: {
        title: '婚礼请柬',
        main_text: '诚挚邀请您参加我们的婚礼，见证我们的幸福时刻。',
        sub_text: '',
        story: ''
      },
      couple: {
        groom: { name: form.value.groomName, phone: form.value.groomPhone, photo: '' },
        bride: { name: form.value.brideName, phone: form.value.bridePhone, photo: '' }
      },
      wedding: {
        date: form.value.date,
        time: form.value.time,
        venue_name: form.value.venueName,
        venue_address: form.value.venueAddress
      },
      media: { music: { url: '', name: '', auto_play: false }, cover_photos: [], story_photos: [] },
      features: { show_countdown: true, show_rsvp: true, show_blessing: true, show_timeline: true }
    }

    const weddings = uni.getStorageSync('weddings') || {}
    weddings[weddingId] = { wedding: weddingData, invitation: invitationData }
    uni.setStorageSync('weddings', weddings)

    userStore.setWeddingId(weddingId)
    userStore.isOwner = true
    userStore.ownerVerified = true
    weddingStore.setWeddingData({ wedding: weddingData, invitation: invitationData })

    showSuccess('创建成功')
    setTimeout(() => {
      uni.redirectTo({ url: '/pages-owner/manage/index' })
    }, 1000)
  } catch (err) {
    showError(err.message || '创建失败')
  } finally {
    uni.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
/* ========== 创建向导 ========== */
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
}

/* ===== 步骤指示器 ===== */
.step-indicator {
  display: flex;
  justify-content: center;
  gap: 20rpx;
  padding: 30rpx 0;
  animation: fadeIn 0.5s $ease-out both;
}
.step-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: $border-color;
  transition: all 0.4s $ease-out;
  position: relative;
}
.step-dot.active {
  background: $color-primary;
}
.step-dot.current {
  transform: scale(1.4);
  box-shadow: 0 0 0 8rpx rgba(196, 30, 58, 0.15);
}

/* 步骤之间的连接线 */
.step-indicator::before {
  content: '';
  position: absolute;
  top: 38rpx;
  left: 30%;
  right: 30%;
  height: 2rpx;
  background: $border-light;
  z-index: -1;
}

/* ===== 步骤内容 ===== */
.step-content {
  flex: 1;
  animation: fadeInUp 0.4s $ease-out both;
}
.step-header {
  text-align: center;
  margin-bottom: 44rpx;
}
.step-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 12rpx;
  letter-spacing: 1rpx;
}
.step-subtitle {
  font-size: 26rpx;
  color: $text-muted;
  letter-spacing: 1rpx;
}

/* ===== 表单卡片 ===== */
.form-card {
  background: $bg-surface;
  border-radius: 32rpx;
  padding: 44rpx;
  box-shadow: $shadow-md;
  border: 1rpx solid $border-light;
}
.form-group {
  margin-bottom: 32rpx;
}
.form-group:last-child {
  margin-bottom: 0;
}
.form-label {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  margin-bottom: 14rpx;
  letter-spacing: 2rpx;
}
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
.picker-value {
  width: 100%;
  height: 92rpx;
  line-height: 92rpx;
  padding: 0 28rpx;
  border: 2rpx solid $border-light;
  border-radius: 16rpx;
  font-size: 28rpx;
  background: $bg-elevated;
  color: $text-primary;
  box-sizing: border-box;
}

/* ===== 模板选择 ===== */
.template-grid {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.template-card {
  background: $bg-surface;
  border-radius: 28rpx;
  overflow: hidden;
  box-shadow: $shadow-sm;
  border: 2rpx solid $border-light;
  transition: all 0.3s $ease-out;
}
.template-card.active {
  border-color: $color-primary;
  box-shadow: 0 4rpx 20rpx rgba(196, 30, 58, 0.1);
  transform: translateY(-2rpx);
}
.template-card:active {
  transform: scale(0.98);
}
.template-preview {
  height: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.template-preview::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3));
}
.template-name {
  font-size: 38rpx;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2rpx 10rpx rgba(0,0,0,0.4);
  position: relative;
  z-index: 1;
  letter-spacing: 4rpx;
}
.template-desc {
  display: block;
  padding: 24rpx;
  font-size: 26rpx;
  color: $text-secondary;
  text-align: center;
}

/* ===== 底部按钮 ===== */
.step-actions {
  display: flex;
  gap: 20rpx;
  padding: 30rpx 0;
}
.action-btn {
  flex: 1;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  border-radius: 24rpx;
  font-size: 30rpx;
  font-weight: 500;
  transition: all 0.2s ease;
}
.action-btn.primary {
  background: $gradient-primary;
  color: #fff;
  box-shadow: 0 6rpx 24rpx rgba(196, 30, 58, 0.25);
}
.action-btn.primary:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 12rpx rgba(196, 30, 58, 0.15);
}
.action-btn.secondary {
  background: $bg-surface;
  color: $text-primary;
  border: 1rpx solid $border-light;
  box-shadow: $shadow-sm;
}
.action-btn.secondary:active {
  transform: scale(0.98);
}
.action-btn::after {
  border: none;
}
</style>
