<template>
  <view class="page">
    <!-- 顶部步骤 -->
    <view class="step-bar">
      <view class="step-track">
        <view class="step-fill" :style="{ width: ((currentStep - 1) / 3 * 100) + '%' }" />
      </view>
      <view class="step-labels">
        <text class="step-label" :class="{ active: currentStep >= 1 }">日期</text>
        <text class="step-label" :class="{ active: currentStep >= 2 }">场地</text>
        <text class="step-label" :class="{ active: currentStep >= 3 }">风格</text>
        <text class="step-label" :class="{ active: currentStep >= 4 }">新人</text>
      </view>
    </view>

    <!-- Step 1 -->
    <view class="step-content" v-if="currentStep === 1">
      <view class="step-header">
        <text class="step-title">婚礼日期</text>
        <text class="step-sub">这将用于生成倒计时</text>
      </view>
      <view class="form-group">
        <text class="form-label">日期</text>
        <picker mode="date" :value="form.date" @change="onDateChange">
          <view class="picker-value">{{ form.date || '请选择日期' }}</view>
        </picker>
      </view>
      <view class="form-group">
        <text class="form-label">时间</text>
        <picker mode="time" :value="form.time" @change="onTimeChange">
          <view class="picker-value">{{ form.time || '请选择时间' }}</view>
        </picker>
      </view>
    </view>

    <!-- Step 2 -->
    <view class="step-content" v-if="currentStep === 2">
      <view class="step-header">
        <text class="step-title">婚礼场地</text>
        <text class="step-sub">宾客将使用这些信息导航到场</text>
      </view>
      <view class="form-group">
        <text class="form-label">场地名称</text>
        <input class="form-input" v-model="form.venueName" placeholder="例如：某某酒店" />
      </view>
      <view class="form-group">
        <text class="form-label">详细地址</text>
        <input class="form-input" v-model="form.venueAddress" placeholder="请输入详细地址" />
      </view>
    </view>

    <!-- Step 3 -->
    <view class="step-content" v-if="currentStep === 3">
      <view class="step-header">
        <text class="step-title">选择模板风格</text>
        <text class="step-sub">可随时在管理后台更换</text>
      </view>
      <view class="template-list">
        <view
          class="template-item"
          v-for="tpl in templates"
          :key="tpl.id"
          :class="{ active: form.template === tpl.id }"
          @click="form.template = tpl.id"
        >
          <view class="template-color" :style="{ background: tpl.color }">
            <text v-if="form.template === tpl.id" class="template-check">✓</text>
          </view>
          <view class="template-meta">
            <text class="template-name">{{ tpl.name }}</text>
            <text class="template-desc">{{ tpl.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Step 4 -->
    <view class="step-content" v-if="currentStep === 4">
      <view class="step-header">
        <text class="step-title">新人信息</text>
        <text class="step-sub">将展示在婚书请柬上</text>
      </view>
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

    <!-- 底部按钮 -->
    <view class="step-actions">
      <button class="step-btn secondary" v-if="currentStep > 1" @click="prevStep">上一步</button>
      <button class="step-btn primary" v-if="currentStep < 4" @click="nextStep">下一步</button>
      <button class="step-btn primary" v-if="currentStep === 4" @click="createWedding">创建婚礼</button>
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
  { id: 'classic', name: '传统红金', desc: '喜庆庄重，经典中式', color: '#B03A5B' },
  { id: 'modern', name: '现代简约', desc: '清新优雅，时尚大方', color: '#2C2C2C' },
  { id: 'luxury', name: '极简纯白', desc: '纯白极简，去装饰', color: '#E8E8E8' }
]

function onDateChange(e) { form.value.date = e.detail.value }
function onTimeChange(e) { form.value.time = e.detail.value }

function nextStep() {
  if (!validateStep()) return
  currentStep.value++
}
function prevStep() { currentStep.value-- }

function validateStep() {
  if (currentStep.value === 1) {
    if (!form.value.date) { showError('请选择婚礼日期'); return false }
  }
  if (currentStep.value === 2) {
    if (!form.value.venueName.trim()) { showError('请输入场地名称'); return false }
  }
  if (currentStep.value === 4) {
    if (!form.value.groomName.trim() || !form.value.brideName.trim()) {
      showError('请输入新人姓名'); return false
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
      basic_info: { date: form.value.date, time: form.value.time, week_day: '' },
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
      features: { show_countdown: true, show_rsvp: true, show_blessing: true, show_timeline: true }
    }
    const weddings = uni.getStorageSync('weddings') || {}
    weddings[weddingId] = weddingData
    uni.setStorageSync('weddings', weddings)
    uni.setStorageSync(`invitation_${weddingId}`, invitationData)
    weddingStore.setWedding(weddingData)
    weddingStore.setInvitation(invitationData)
    userStore.setWeddingId(weddingId)
    userStore.verifyOwner(true)
    showSuccess('婚礼创建成功')
    uni.reLaunch({ url: '/pages-owner/manage/index' })
  } catch (err) {
    showError(err.message || '创建失败')
  } finally {
    uni.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: 60rpx;
}

/* 步骤条 */
.step-bar {
  padding: 40rpx 48rpx 0;
}
.step-track {
  height: 4rpx;
  background: $border-color;
  border-radius: 2rpx;
  position: relative;
  margin-bottom: 16rpx;
}
.step-fill {
  height: 100%;
  background: $text-primary;
  border-radius: 2rpx;
  transition: width 0.3s ease;
}
.step-labels {
  display: flex;
  justify-content: space-between;
}
.step-label {
  font-size: 22rpx;
  color: $text-muted;
  font-weight: 500;
}
.step-label.active {
  color: $text-primary;
}

/* 步骤内容 */
.step-content {
  padding: 48rpx 48rpx 0;
}
.step-header {
  margin-bottom: 48rpx;
}
.step-title {
  display: block;
  font-size: $font-h1;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 12rpx;
}
.step-sub {
  display: block;
  font-size: $font-body;
  color: $text-secondary;
}

/* 表单 */
.form-group {
  margin-bottom: 40rpx;
}
.form-label {
  display: block;
  font-size: 26rpx;
  color: $text-muted;
  margin-bottom: 16rpx;
}
.form-input {
  width: 100%;
  height: 96rpx;
  padding: 0 4rpx;
  border-bottom: 2rpx solid $border-color;
  font-size: 32rpx;
  background: transparent;
  box-sizing: border-box;
}
.picker-value {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 32rpx;
  color: $text-primary;
  border-bottom: 2rpx solid $border-color;
}

/* 模板列表 */
.template-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.template-item {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx;
  border-radius: $radius-lg;
  border: 2rpx solid $border-color;
  background: $bg-surface;
  transition: all 0.2s ease;
}
.template-item.active {
  border-color: $text-primary;
}
.template-item:active {
  background: $bg-muted;
}
.template-color {
  width: 72rpx;
  height: 72rpx;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.template-check {
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
}
.template-meta {
  flex: 1;
}
.template-name {
  display: block;
  font-size: 30rpx;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 4rpx;
}
.template-desc {
  font-size: 24rpx;
  color: $text-secondary;
}

/* 底部按钮 */
.step-actions {
  padding: 48rpx;
  display: flex;
  gap: 16rpx;
}
.step-btn {
  flex: 1;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  border-radius: $radius-full;
  font-size: 30rpx;
  font-weight: 500;
  transition: opacity 0.2s ease;
}
.step-btn::after { border: none; }
.step-btn:active { opacity: 0.8; }
.step-btn.primary {
  background: $text-primary;
  color: #fff;
}
.step-btn.secondary {
  background: $bg-muted;
  color: $text-primary;
}
</style>
