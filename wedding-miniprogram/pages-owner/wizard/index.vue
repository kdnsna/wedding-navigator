<template>
  <view class="page">
    <!-- 顶部步骤 -->
    <view class="step-bar">
      <view class="step-track">
        <view class="step-fill" :style="{ width: ((currentStep - 1) / 3 * 100) + '%' }" />
      </view>
      <view class="step-labels">
        <text class="step-label" :class="{ active: currentStep >= 1 }">模板</text>
        <text class="step-label" :class="{ active: currentStep >= 2 }">日期</text>
        <text class="step-label" :class="{ active: currentStep >= 3 }">场地</text>
        <text class="step-label" :class="{ active: currentStep >= 4 }">新人</text>
      </view>
    </view>

    <!-- Step 1 -->
    <view class="step-content" v-if="currentStep === 1">
      <view class="step-header">
        <text class="step-title">先选择婚礼模板</text>
        <text class="step-sub">先决定第一眼的气质，再补充婚礼信息；后续仍可在婚书编辑中更换</text>
      </view>
      <view class="template-showcase">
        <view
          class="template-item"
          v-for="tpl in templates"
          :key="tpl.id"
          :class="{ active: form.template === tpl.id }"
          @click="selectTemplate(tpl)"
        >
          <view class="template-visual" :style="{ background: tpl.preview }">
            <text class="template-kicker">{{ tpl.kicker }}</text>
            <text class="template-monogram">{{ tpl.shortName }}</text>
            <view class="template-line" />
            <text class="template-venue">{{ tpl.preset?.venueName }}</text>
          </view>
          <view class="template-meta">
            <view class="template-head">
              <text class="template-name">{{ tpl.name }}</text>
              <text class="template-status">{{ form.template === tpl.id ? '已选择' : '选择' }}</text>
            </view>
            <text class="template-desc">{{ tpl.desc }}</text>
            <text class="template-copy">{{ tpl.copy }}</text>
            <text class="template-photo">{{ tpl.photoMood }}</text>
          </view>
        </view>
      </view>
      <view class="template-note" v-if="selectedTemplate">
        <text class="template-note-title">预设文案</text>
        <text class="template-note-copy">{{ selectedTemplate.preset?.mainText }}</text>
      </view>
    </view>

    <!-- Step 2 -->
    <view class="step-content" v-if="currentStep === 2">
      <view class="step-header">
        <text class="step-title">婚礼日期</text>
        <text class="step-sub">这将用于生成倒计时和分享卡片</text>
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

    <!-- Step 3 -->
    <view class="step-content" v-if="currentStep === 3">
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
      <button class="step-btn primary" v-if="currentStep === 4" @click="createWeddingAction">创建婚礼</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/user.js'
import { useWeddingStore } from '@/stores/wedding.js'
import { createWedding } from '@/composables/useCloud.js'
import { showSuccess, showError, getWeekDay } from '@/utils/index.js'
import { WEDDING_TEMPLATES, buildTemplateGuide, buildTemplateTimeline, getWeddingTemplate } from '@/utils/templates.js'

const userStore = useUserStore()
const weddingStore = useWeddingStore()

const currentStep = ref(1)

const form = ref({
  date: '2026-11-14',
  time: '12:00',
  venueName: '',
  venueAddress: '',
  template: 'rose-couture',
  groomName: '',
  groomPhone: '',
  brideName: '',
  bridePhone: ''
})

const templates = WEDDING_TEMPLATES
const selectedTemplate = computed(() => getWeddingTemplate(form.value.template))

function onDateChange(e) { form.value.date = e.detail.value }
function onTimeChange(e) { form.value.time = e.detail.value }

function selectTemplate(tpl) {
  form.value.template = tpl.id
  if (!form.value.venueName.trim()) {
    form.value.venueName = tpl.preset?.venueName || ''
  }
}

function nextStep() {
  if (!validateStep()) return
  if (currentStep.value === 1 && selectedTemplate.value?.preset?.venueName && !form.value.venueName.trim()) {
    form.value.venueName = selectedTemplate.value.preset.venueName
  }
  currentStep.value++
}
function prevStep() { currentStep.value-- }

function validateStep() {
  if (currentStep.value === 1) {
    if (!form.value.template) { showError('请选择婚礼模板'); return false }
  }
  if (currentStep.value === 2) {
    if (!form.value.date) { showError('请选择婚礼日期'); return false }
  }
  if (currentStep.value === 3) {
    if (!form.value.venueName.trim()) { showError('请输入场地名称'); return false }
  }
  if (currentStep.value === 4) {
    if (!form.value.groomName.trim() || !form.value.brideName.trim()) {
      showError('请输入新人姓名'); return false
    }
  }
  return true
}

async function createWeddingAction() {
  if (!validateStep()) return
  try {
    uni.showLoading({ title: '创建中...', mask: true })
    const tpl = selectedTemplate.value

    const weddingPayload = {
      basic_info: { date: form.value.date, time: form.value.time, week_day: getWeekDay(form.value.date) },
      status: 'published',
      stats: { views: 0, shares: 0, rsvp_count: 0, blessing_count: 0, unique_viewers: 0 },
      share_config: {
        title: `${form.value.groomName} & ${form.value.brideName}的婚礼邀请`,
        description: `${form.value.date}，我们结婚啦！诚邀您的见证`,
        cover_image: ''
      }
    }
    const invitationPayload = {
      template: form.value.template,
      content: {
        title: '婚礼请柬',
        main_text: tpl?.preset?.mainText || '诚挚邀请您参加我们的婚礼，见证我们的幸福时刻。',
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
        venue_name: form.value.venueName || tpl?.preset?.venueName || '',
        venue_address: form.value.venueAddress
      },
      features: {
        show_countdown: true,
        show_rsvp: true,
        show_blessing: true,
        show_timeline: true,
        rsvp_phone_required: false,
        allow_rsvp_update: true,
        blessing_public: true,
        allow_anonymous_blessing: true
      }
    }
    const mainVenueId = 'main-venue'
    const venuesPayload = buildTemplateGuide(form.value.template, {
      mainVenueId,
      venueName: form.value.venueName || tpl?.preset?.venueName || '',
      venueAddress: form.value.venueAddress,
      time: form.value.time
    })
    const timelinePayload = buildTemplateTimeline(form.value.template, mainVenueId)

    // 先写云端
    const res = await createWedding({
      wedding: weddingPayload,
      invitation: invitationPayload,
      venues: venuesPayload,
      timeline: timelinePayload
    })

    if (!res?.success) {
      throw new Error(res?.message || '云端创建失败')
    }

    const weddingId = res.weddingId

    // 再缓存本地（离线兜底）
    const weddings = uni.getStorageSync('weddings') || {}
    weddings[weddingId] = { wedding_id: weddingId, ...weddingPayload }
    uni.setStorageSync('weddings', weddings)
    uni.setStorageSync(`invitation_${weddingId}`, { wedding_id: weddingId, ...invitationPayload })

    weddingStore.setWeddingData({
      wedding: { wedding_id: weddingId, ...weddingPayload },
      invitation: { wedding_id: weddingId, ...invitationPayload },
      album: { photos: [] },
      venues: venuesPayload,
      timeline: timelinePayload,
      guests: { guests: [] },
      blessings: { blessings: [] }
    })
    userStore.setWeddingId(weddingId)
    userStore.verifyOwner(true)
    showSuccess('婚礼创建成功')
    uni.reLaunch({ url: '/pages-owner/manage/index' })
  } catch (err) {
    console.error('创建婚礼失败:', err)
    uni.hideLoading()
    showError(err.message || '创建失败，请检查云开发环境')
  } finally {
    uni.hideLoading()
  }
}
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}

/* 步骤条 */
.step-bar {
  width: calc(100vw - 96rpx);
  margin: 0 auto;
  padding: 40rpx 0 0;
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
  width: calc(100vw - 96rpx);
  margin: 0 auto;
  padding: 48rpx 0 0;
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
  height: $control-height;
  padding: 0 4rpx;
  border-bottom: 2rpx solid $border-color;
  font-size: 32rpx;
  background: transparent;
  box-sizing: border-box;
}
.picker-value {
  width: 100%;
  height: $control-height;
  line-height: $control-height;
  font-size: 32rpx;
  color: $text-primary;
  border-bottom: 2rpx solid $border-color;
}

/* 模板列表 */
.template-showcase {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}
.template-item {
  display: flex;
  align-items: stretch;
  gap: 22rpx;
  padding: 22rpx;
  border-radius: $card-radius;
  border: 2rpx solid $border-color;
  background: $bg-surface;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}
.template-item.active {
  border-color: $text-primary;
  box-shadow: $shadow-sm;
}
.template-item:active {
  background: $bg-muted;
}
.template-visual {
  width: 180rpx;
  min-height: 232rpx;
  border-radius: $card-radius;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 22rpx 18rpx;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1rpx rgba(255,255,255,0.34);
  box-sizing: border-box;
}
.template-kicker {
  color: #fff;
  font-size: 15rpx;
  letter-spacing: 0;
  line-height: 1.25;
  opacity: 0.76;
}
.template-monogram {
  color: #fff;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.2;
}
.template-line {
  width: 56rpx;
  height: 2rpx;
  background: rgba(255,255,255,0.72);
}
.template-venue {
  color: rgba(255,255,255,0.82);
  font-size: 18rpx;
  line-height: 1.3;
}
.template-meta {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.template-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 8rpx;
}
.template-name {
  display: block;
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 500;
  color: $text-primary;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.template-status {
  flex-shrink: 0;
  padding: 6rpx 14rpx;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-muted;
  font-size: 20rpx;
}
.template-item.active .template-status {
  background: $text-primary;
  color: #fff;
}
.template-desc {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.template-copy {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: $text-primary;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.template-photo {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: $text-muted;
  line-height: 1.45;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.template-note {
  margin-top: 28rpx;
  padding: 28rpx;
  border-radius: $card-radius;
  background: #fff8f1;
  border: 1rpx solid rgba(201,169,110,0.32);
}
.template-note-title {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 0;
  margin-bottom: 12rpx;
}
.template-note-copy {
  display: block;
  font-size: 26rpx;
  color: $text-primary;
  line-height: 1.65;
}

/* 底部按钮 */
.step-actions {
  width: calc(100vw - 96rpx);
  margin: 0 auto;
  padding: $page-gutter 0;
  display: flex;
  gap: 16rpx;
}
.step-btn {
  flex: 1;
  height: $control-height;
  line-height: $control-height;
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
