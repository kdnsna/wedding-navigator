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
        <TemplateCard
          v-for="tpl in templates"
          :key="tpl.id"
          :template="tpl"
          :selected="form.template === tpl.id"
          :tier-label="getTemplateTierLabel(tpl)"
          :premium="isTemplatePremium(tpl)"
          @select="selectTemplate"
          @preview="previewTemplate"
        />
      </view>
      <view class="template-note" v-if="selectedTemplate">
        <text class="template-note-title">预设文案</text>
        <text class="template-note-copy">{{ selectedTemplate.preset?.mainText }}</text>
        <text class="template-note-hint">{{ selectedTemplateHint }}</text>
        <button class="template-note-preview" @click="previewTemplate(selectedTemplate)">完整预览</button>
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
        <input class="form-input" v-model="form.venueName" maxlength="40" placeholder="例如：某某酒店" />
      </view>
      <view class="form-group">
        <text class="form-label">详细地址</text>
        <input class="form-input" v-model="form.venueAddress" maxlength="80" placeholder="请输入详细地址" />
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
        <input class="form-input" v-model="form.groomName" maxlength="20" placeholder="新郎姓名" />
      </view>
      <view class="form-group">
        <text class="form-label">新郎手机号</text>
        <input class="form-input" v-model="form.groomPhone" placeholder="新郎手机号" type="number" maxlength="20" />
      </view>
      <view class="form-group">
        <text class="form-label">新娘姓名</text>
        <input class="form-input" v-model="form.brideName" maxlength="20" placeholder="新娘姓名" />
      </view>
      <view class="form-group">
        <text class="form-label">新娘手机号</text>
        <input class="form-input" v-model="form.bridePhone" placeholder="新娘手机号" type="number" maxlength="20" />
      </view>
    </view>

    <!-- 底部按钮 -->
    <BottomActionBar
      :primary-text="currentStep < 4 ? '下一步' : '创建婚礼'"
      :secondary-text="currentStep > 1 ? '上一步' : ''"
      :loading="creating"
      :disabled="creating"
      @primary="handleStepPrimary"
      @secondary="prevStep"
    />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user.js'
import { useWeddingStore } from '@/stores/wedding.js'
import { createWedding } from '@/composables/useCloud.js'
import { showSuccess, showError, getWeekDay } from '@/utils/index.js'
import { WEDDING_TEMPLATES, buildTemplateGuide, buildTemplateTimeline, getWeddingTemplate } from '@/utils/templates.js'
import { buildTemplateCommercialState, getCommercialHint, getTemplateTierLabel, isTemplatePremium } from '@/utils/commercial.js'
import TemplateCard from '@/components/ui/TemplateCard.vue'
import BottomActionBar from '@/components/ui/BottomActionBar.vue'

const userStore = useUserStore()
const weddingStore = useWeddingStore()

const currentStep = ref(1)
const creating = ref(false)

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
const selectedTemplateHint = computed(() => getCommercialHint(selectedTemplate.value, userStore.entitlements))

function onDateChange(e) { form.value.date = e.detail.value }
function onTimeChange(e) { form.value.time = e.detail.value }

function selectTemplate(tpl) {
  form.value.template = tpl.id
  if (!form.value.venueName.trim()) {
    form.value.venueName = tpl.preset?.venueName || ''
  }
}

function previewTemplate(tpl) {
  uni.navigateTo({
    url: `/pages-owner/template/preview?id=${encodeURIComponent(tpl.id)}`,
    fail: (err) => {
      console.warn('创建向导打开模板预览失败:', err)
      showError('模板预览打开失败，请稍后重试')
    }
  })
}

function applyPendingTemplate() {
  const pendingTemplateId = uni.getStorageSync('pending_template_id')
  if (!pendingTemplateId) return
  uni.removeStorageSync('pending_template_id')
  const tpl = getWeddingTemplate(pendingTemplateId)
  selectTemplate(tpl)
}

function nextStep() {
  if (!validateStep()) return
  if (currentStep.value === 1 && selectedTemplate.value?.preset?.venueName && !form.value.venueName.trim()) {
    form.value.venueName = selectedTemplate.value.preset.venueName
  }
  currentStep.value++
}
function prevStep() { currentStep.value-- }
function handleStepPrimary() {
  if (currentStep.value < 4) nextStep()
  else createWeddingAction()
}

function validateStep() {
  if (currentStep.value === 1) {
    if (!form.value.template) { showError('请选择婚礼模板'); return false }
  }
  if (currentStep.value === 2) {
    if (!form.value.date) { showError('请选择婚礼日期'); return false }
  }
  if (currentStep.value === 3) {
    if (!form.value.venueName.trim()) { showError('请输入场地名称'); return false }
    if (form.value.venueName.trim().length > 40) { showError('场地名称请控制在 40 字内'); return false }
    if (form.value.venueAddress.trim().length > 80) { showError('详细地址请控制在 80 字内'); return false }
  }
  if (currentStep.value === 4) {
    if (!form.value.groomName.trim() || !form.value.brideName.trim()) {
      showError('请输入新人姓名'); return false
    }
    if (form.value.groomName.trim().length > 20 || form.value.brideName.trim().length > 20) {
      showError('新人姓名请控制在 20 字内'); return false
    }
    if (!isValidPhone(form.value.groomPhone) || !isValidPhone(form.value.bridePhone)) {
      showError('请输入有效手机号')
      return false
    }
  }
  return true
}

function isValidPhone(phone) {
  if (!phone) return true
  return /^\d{6,20}$/.test(String(phone).trim())
}

async function createWeddingAction() {
  if (creating.value) return
  if (!validateStep()) return
  try {
    creating.value = true
    uni.showLoading({ title: '创建中...', mask: true })
    const tpl = selectedTemplate.value
    const theme = tpl?.theme || 'wine'

    const weddingPayload = {
      basic_info: { date: form.value.date, time: form.value.time, week_day: getWeekDay(form.value.date), theme },
      status: 'published',
      stats: { views: 0, shares: 0, rsvp_count: 0, blessing_count: 0, unique_viewers: 0 },
      commercial: {
        plan: userStore.plan || 'free',
        template_id: form.value.template,
        theme_key: theme,
        ...buildTemplateCommercialState(tpl, userStore.entitlements)
      },
      workspace: {
        plan: userStore.plan || 'free',
        template_id: form.value.template,
        theme_key: theme,
        commercial_status: 'trial'
      },
      share_config: {
        title: `${form.value.groomName} & ${form.value.brideName}的婚礼邀请`,
        description: `${form.value.date}，我们结婚啦！诚邀您的见证`,
        cover_image: ''
      }
    }
    const invitationPayload = {
      template: form.value.template,
      theme,
      photo_treatment: 'original',
      commercial: buildTemplateCommercialState(tpl, userStore.entitlements),
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
    uni.reLaunch({
      url: '/pages-owner/manage/index',
      fail: (navErr) => {
        console.warn('创建后打开管理后台失败:', navErr)
        showError('婚礼已创建，但管理后台打开失败')
      }
    })
  } catch (err) {
    console.error('创建婚礼失败:', err)
    showError(err.message || '创建失败，请检查云开发环境')
  } finally {
    creating.value = false
    uni.hideLoading()
  }
}

onShow(() => {
  applyPendingTemplate()
})
</script>

<style lang="scss" scoped>
.page {
  background:
    linear-gradient(180deg, rgba(255,248,245,0.98) 0%, #fff 46%, rgba(255,248,245,1) 100%);
  min-height: 100vh;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
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
  padding: 48rpx 0 calc(132rpx + env(safe-area-inset-bottom));
}
.step-header {
  margin-bottom: 48rpx;
}
.step-title {
  display: block;
  font-family: $font-serif;
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
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 22rpx 18rpx;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1rpx rgba(255,255,255,0.34);
  box-sizing: border-box;
}
.template-hero-thumb,
.template-visual-shade {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
}
.template-hero-thumb {
  z-index: 0;
}
.template-visual-shade {
  z-index: 1;
  background: linear-gradient(to bottom, rgba(0,0,0,0.12), rgba(0,0,0,0.36) 54%, rgba(0,0,0,0.62));
}
.template-kicker {
  position: relative;
  z-index: 2;
  color: #fff;
  font-size: 15rpx;
  letter-spacing: 0;
  line-height: 1.25;
  opacity: 0.76;
}
.template-monogram {
  position: relative;
  z-index: 2;
  color: #fff;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.2;
}
.template-line {
  position: relative;
  z-index: 2;
  width: 56rpx;
  height: 2rpx;
  background: rgba(255,255,255,0.72);
}
.template-venue {
  position: relative;
  z-index: 2;
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
  align-items: flex-start;
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
.template-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
  flex-shrink: 0;
}
.template-tier {
  padding: 5rpx 12rpx;
  border-radius: $radius-full;
  background: rgba(52,168,83,0.1);
  color: $color-success;
  font-size: 19rpx;
  line-height: 1.2;
}
.template-tier.premium {
  background: rgba(201,169,110,0.14);
  color: #8F6B2E;
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
.template-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 18rpx;
}
.template-action {
  flex: 1;
  min-width: 0;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-primary;
  font-size: 24rpx;
  padding: 0;
}
.template-action.primary {
  background: $text-primary;
  color: #fff;
}
.template-action::after { border: none; }
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
.template-note-hint {
  display: block;
  margin-top: 18rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid rgba(201,169,110,0.22);
  font-size: 23rpx;
  color: $text-secondary;
  line-height: 1.5;
}
.template-note-preview {
  margin-top: 22rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-sm;
  background: $text-primary;
  color: #fff;
  font-size: 26rpx;
  font-weight: 600;
}
.template-note-preview::after {
  border: none;
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
