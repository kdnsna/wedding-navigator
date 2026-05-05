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

    // 本地模拟创建（真实环境调用云函数）
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

    // 保存到本地存储（沙箱环境无真实云开发）
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
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
}

/* 步骤指示器 */
.step-indicator {
  display: flex;
  justify-content: center;
  gap: 16rpx;
  padding: 30rpx 0;
}
.step-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: $border-color;
  transition: all 0.3s;
}
.step-dot.active {
  background: $color-primary;
}
.step-dot.current {
  box-shadow: 0 0 0 8rpx rgba(196, 30, 58, 0.2);
}

/* 步骤内容 */
.step-content {
  flex: 1;
}
.step-header {
  text-align: center;
  margin-bottom: 40rpx;
}
.step-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 12rpx;
}
.step-subtitle {
  font-size: 26rpx;
  color: $text-muted;
}

/* 表单卡片 */
.form-card {
  background: $bg-surface;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: $shadow-sm;
}
.form-group {
  margin-bottom: 30rpx;
}
.form-group:last-child {
  margin-bottom: 0;
}
.form-label {
  display: block;
  font-size: 28rpx;
  color: $text-secondary;
  margin-bottom: 12rpx;
}
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
.picker-value {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  padding: 0 24rpx;
  border: 2rpx solid $border-light;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: $bg-muted;
  color: $text-primary;
  box-sizing: border-box;
}

/* 模板选择 */
.template-grid {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.template-card {
  background: $bg-surface;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: $shadow-sm;
  border: 3rpx solid transparent;
}
.template-card.active {
  border-color: $color-primary;
}
.template-preview {
  height: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.template-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.3);
}
.template-desc {
  display: block;
  padding: 20rpx;
  font-size: 26rpx;
  color: $text-secondary;
}

/* 底部按钮 */
.step-actions {
  display: flex;
  gap: 20rpx;
  padding: 30rpx 0;
}
.action-btn {
  flex: 1;
  height: 90rpx;
  line-height: 90rpx;
  text-align: center;
  border-radius: 16rpx;
  font-size: 30rpx;
}
.action-btn.primary {
  background: linear-gradient(135deg, $color-primary 0%, #E91E63 100%);
  color: #fff;
}
.action-btn.secondary {
  background: $bg-surface;
  color: $text-primary;
  border: 2rpx solid $border-light;
}
.action-btn::after {
  border: none;
}
</style>
