<template>
  <view class="page" :class="templateClass">
    <!-- 顶部标题 -->
    <view class="page-header" v-if="!submitted && isRsvpEnabled">
      <text class="page-tag">RSVP</text>
      <text class="page-title">确认出席</text>
      <view class="page-divider" />
      <text class="page-desc">请告诉我们是否能见证这美好时刻</text>
    </view>

    <view class="rsvp-brief" v-if="!submitted && isRsvpEnabled">
      <view>
        <text class="brief-kicker">{{ activeTemplate.shortName }} RSVP CARD</text>
        <text class="brief-title">{{ store.coupleName || '新人婚礼' }}</text>
      </view>
      <view class="brief-grid">
        <view class="brief-item">
          <text class="brief-label">DATE</text>
          <text class="brief-value">{{ formatDate(store.weddingDate) || '待公布' }}</text>
        </view>
        <view class="brief-item">
          <text class="brief-label">TIME</text>
          <text class="brief-value">{{ store.weddingTime || '12:00' }}</text>
        </view>
        <view class="brief-item wide">
          <text class="brief-label">VENUE</text>
          <text class="brief-value">{{ store.venueName || '婚礼场地' }}</text>
        </view>
      </view>
    </view>

    <!-- 表单 -->
    <view class="feature-closed" v-if="!submitted && !isRsvpEnabled">
      <image class="empty-visual" src="/static/visuals/icon-rsvp.svg" mode="aspectFit" />
      <text class="feature-title">新人暂未开放在线回执</text>
      <text class="feature-desc">您仍可查看婚礼时间、地点和到场路线。</text>
      <button class="feature-action" @click="goToGuide">查看路线</button>
    </view>

    <view class="form" v-if="!submitted && isRsvpEnabled">
      <!-- 姓名 -->
      <view class="form-group">
        <view class="form-label">
          <text class="label-text">姓名</text>
          <text class="label-en">NAME</text>
        </view>
        <input
          class="form-input"
          v-model="form.name"
          placeholder="您的称呼"
          placeholder-class="placeholder"
        />
      </view>

      <!-- 出席状态 -->
      <view class="form-group">
        <view class="form-label">
          <text class="label-text">能否出席</text>
          <text class="label-en">ATTENDANCE</text>
        </view>
        <view class="radio-group">
          <view
            class="radio-item"
            :class="{ active: form.status === 'attending' }"
            @click="form.status = 'attending'"
          >
            <view class="radio-dot" />
            <text class="radio-label">我会出席</text>
          </view>
          <view
            class="radio-item"
            :class="{ active: form.status === 'uncertain' }"
            @click="form.status = 'uncertain'"
          >
            <view class="radio-dot" />
            <text class="radio-label">不确定</text>
          </view>
          <view
            class="radio-item"
            :class="{ active: form.status === 'declined' }"
            @click="form.status = 'declined'"
          >
            <view class="radio-dot" />
            <text class="radio-label">无法出席</text>
          </view>
        </view>
      </view>

      <!-- 与新人关系 -->
      <view class="form-group">
        <view class="form-label">
          <text class="label-text">与新人关系</text>
          <text class="label-en">RELATION</text>
        </view>
        <view class="tag-group">
          <view
            class="tag-item"
            v-for="relation in relationshipOptions"
            :key="relation"
            :class="{ active: form.relationship === relation }"
            @click="form.relationship = relation"
          >
            <text>{{ relation }}</text>
          </view>
        </view>
      </view>

      <!-- 出席人数 -->
      <view class="form-group" v-if="form.status === 'attending' || form.status === 'uncertain'">
        <view class="form-label">
          <text class="label-text">出席人数</text>
          <text class="label-en">GUESTS</text>
        </view>
        <view class="stepper">
          <view class="step-btn" @click="form.guestCount = Math.max(1, form.guestCount - 1)">
            <text class="step-icon">−</text>
          </view>
          <text class="step-value">{{ form.guestCount }}</text>
          <view class="step-btn" @click="form.guestCount = Math.min(form.guestCount + 1, 20)">
            <text class="step-icon">+</text>
          </view>
        </view>
      </view>

      <!-- 联系电话 -->
      <view class="form-group" v-if="form.status !== 'declined'">
        <view class="form-label">
          <text class="label-text">联系电话</text>
          <text class="required-tip" v-if="!phoneRequired">选填</text>
          <text class="label-en">PHONE</text>
        </view>
        <input
          class="form-input"
          v-model="form.phone"
          type="number"
          :placeholder="phoneRequired ? '用于接收通知' : '选填，方便新人联系'"
          placeholder-class="placeholder"
        />
      </view>

      <!-- 到达时间 -->
      <view class="form-group" v-if="form.status !== 'declined'">
        <view class="form-label">
          <text class="label-text">预计到达</text>
          <text class="label-en">ARRIVAL</text>
        </view>
        <picker mode="time" :value="form.arrivalTime" @change="onArrivalTimeChange">
          <view class="picker-value">{{ form.arrivalTime || '选择预计到达时间' }}</view>
        </picker>
      </view>

      <!-- 交通方式 -->
      <view class="form-group" v-if="form.status !== 'declined'">
        <view class="form-label">
          <text class="label-text">交通方式</text>
          <text class="label-en">TRANSPORT</text>
        </view>
        <view class="tag-group">
          <view
            class="tag-item"
            v-for="mode in transportOptions"
            :key="mode"
            :class="{ active: form.transportMode === mode }"
            @click="form.transportMode = mode"
          >
            <text>{{ mode }}</text>
          </view>
        </view>
      </view>

      <!-- 饮食偏好 -->
      <view class="form-group" v-if="form.status !== 'declined'">
        <view class="form-label">
          <text class="label-text">饮食偏好</text>
          <text class="label-en">DIETARY</text>
        </view>
        <view class="tag-group">
          <view
            class="tag-item"
            v-for="diet in dietOptions"
            :key="diet"
            :class="{ active: form.dietary.includes(diet) }"
            @click="toggleDiet(diet)"
          >
            <text>{{ diet }}</text>
          </view>
        </view>
      </view>

      <!-- 随行备注 -->
      <view class="form-group" v-if="form.status !== 'declined' && form.guestCount > 1">
        <view class="form-label">
          <text class="label-text">随行备注</text>
          <text class="label-en">COMPANION</text>
        </view>
        <input
          class="form-input"
          v-model="form.companionNote"
          placeholder="如：携伴 1 位 / 儿童座椅 / 家人同行"
          placeholder-class="placeholder"
        />
      </view>

      <!-- 留言 -->
      <view class="form-group">
        <view class="form-label">
          <text class="label-text">留言</text>
          <text class="label-en">MESSAGE</text>
        </view>
        <textarea
          class="form-textarea"
          v-model="form.message"
          placeholder="写一句祝福给我们吧"
          placeholder-class="placeholder"
          maxlength="200"
        />
        <text class="char-count">{{ (form.message || '').length }}/200</text>
      </view>

      <!-- 提交 -->
      <view class="form-actions">
        <button class="submit-btn" @click="handleSubmit" :disabled="submitting">
          <text v-if="!submitting">确认提交</text>
          <text v-else>提交中...</text>
        </button>
      </view>
    </view>

    <!-- 成功页 -->
    <view class="success-page" v-else>
      <view class="success-ring">
        <view class="success-circle">
          <text class="success-icon">✓</text>
        </view>
      </view>
      <text class="success-title">感谢回复</text>
      <text class="success-desc" v-if="form.status === 'attending'">
        期待在婚礼当天与您相见
      </text>
      <text class="success-desc" v-else-if="form.status === 'declined'">
        很遗憾无法邀请您出席，但您的祝福我们已收到
      </text>
      <text class="success-desc" v-else>
        有任何变动请随时联系我们
      </text>
      <view class="success-card">
        <view class="success-info">
          <text class="info-label">回复人</text>
          <text class="info-value">{{ form.name || '匿名' }}</text>
        </view>
        <view class="success-divider" />
        <view class="success-info">
          <text class="info-label">出席状态</text>
          <text class="info-value">{{ statusText[form.status] }}</text>
        </view>
        <view class="success-divider" v-if="form.status !== 'declined'" />
        <view class="success-info" v-if="form.status !== 'declined'">
          <text class="info-label">出席人数</text>
          <text class="info-value">{{ form.guestCount }} 人</text>
        </view>
      </view>
      <button class="back-btn" @click="resetForm">
        <text>返回首页</text>
      </button>
      <view class="success-actions" v-if="form.status !== 'declined'">
        <button class="success-action" @click="goToGuide">查看路线</button>
        <button class="success-action" @click="openCalendar">加入日历</button>
        <button class="success-action" @click="goToBlessing">写祝福</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding, submitRSVP } from '@/composables/useCloud.js'
import { formatDate } from '@/utils/index.js'

const store = useWeddingStore()
const userStore = useUserStore()

const submitted = ref(false)
const submitting = ref(false)
const activeTemplate = computed(() => store.activeTemplate)
const templateClass = computed(() => store.templateClass)
const isRsvpEnabled = computed(() => store.isRsvpEnabled)
const phoneRequired = computed(() => store.rsvpPhoneRequired)
const allowRsvpUpdate = computed(() => store.allowRsvpUpdate)

const form = reactive({
  name: '',
  status: 'attending',
  relationship: '',
  guestCount: 1,
  phone: '',
  arrivalTime: '',
  transportMode: '',
  companionNote: '',
  dietary: [],
  message: ''
})

const relationshipOptions = ['亲友', '同学', '同事', '家人', '其他']
const transportOptions = ['自驾', '打车', '公共交通', '跟车', '待定']
const dietOptions = ['无特殊要求', '素食', '清真', '海鲜过敏', '不吃辣']
const statusText = {
  attending: '确认出席',
  uncertain: '待定',
  declined: '无法出席'
}

function getDietPreference() {
  if (form.dietary.includes('素食')) return 'vegetarian'
  if (form.dietary.includes('清真')) return 'halal'
  if (form.dietary.length > 0 && !form.dietary.includes('无特殊要求')) return 'other'
  return 'normal'
}

function toggleDiet(diet) {
  const idx = form.dietary.indexOf(diet)
  if (idx > -1) {
    form.dietary.splice(idx, 1)
  } else {
    form.dietary.push(diet)
  }
}

function onArrivalTimeChange(e) {
  form.arrivalTime = e.detail.value
}

async function handleSubmit() {
  if (!userStore.weddingId) {
    uni.showToast({ title: '未找到婚礼信息，请重新打开邀请', icon: 'none' })
    return
  }
  if (!form.name.trim()) {
    uni.showToast({ title: '请输入姓名', icon: 'none' })
    return
  }
  if (form.status !== 'declined' && phoneRequired.value && !form.phone.trim()) {
    uni.showToast({ title: '请输入联系电话', icon: 'none' })
    return
  }
  if (!allowRsvpUpdate.value) {
    const existing = (store.guests?.guests || []).find(item => {
      if (item.is_current_user === true) return true
      if (form.phone && item.phone === form.phone) return true
      return userStore.openid && item.openid === userStore.openid
    })
    if (existing) {
      uni.showToast({ title: '回执已提交，如需修改请联系新人', icon: 'none' })
      return
    }
  }

  submitting.value = true
  try {
    const attendingCount = form.status === 'declined' ? 0 : form.guestCount
    await submitRSVP(userStore.weddingId, {
      name: form.name.trim(),
      phone: form.phone.trim(),
      openid: userStore.openid,
      rsvp_status: form.status,
      attending_count: attendingCount,
      diet_preference: getDietPreference(),
      dietary: form.dietary.join('、'),
      relationship: form.relationship,
      arrival_time: form.arrivalTime,
      transport_mode: form.transportMode,
      companion_note: form.companionNote.trim(),
      message: form.message.trim()
    })
    store.updateGuestRSVP(form.phone.trim() || `${userStore.openid || 'guest'}_${form.name.trim()}`, {
      name: form.name.trim(),
      phone: form.phone.trim(),
      openid: userStore.openid,
      rsvp_status: form.status,
      attending_count: attendingCount,
      diet_preference: getDietPreference(),
      dietary: form.dietary.join('、'),
      relationship: form.relationship,
      arrival_time: form.arrivalTime,
      transport_mode: form.transportMode,
      companion_note: form.companionNote.trim(),
      message: form.message.trim()
    })
    submitted.value = true
  } catch (err) {
    uni.showToast({ title: err?.message || '提交失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  submitted.value = false
  form.name = ''
  form.status = 'attending'
  form.relationship = ''
  form.guestCount = 1
  form.phone = ''
  form.arrivalTime = ''
  form.transportMode = ''
  form.companionNote = ''
  form.dietary = []
  form.message = ''
  uni.reLaunch({ url: '/pages/index/index' })
}

function goToGuide() {
  uni.switchTab({ url: '/pages/guide/index' })
}

function goToBlessing() {
  uni.navigateTo({ url: '/pages/blessing/index' })
}

function openCalendar() {
  const date = store.weddingDate
  const time = store.weddingTime || '12:00'
  if (!date) {
    uni.showToast({ title: '暂无婚礼日期', icon: 'none' })
    return
  }
  const startTime = Math.floor(new Date(`${date}T${time}`).getTime() / 1000)
  if (typeof wx !== 'undefined' && wx.addPhoneCalendar) {
    wx.addPhoneCalendar({
      title: `${store.coupleName} 的婚礼`,
      startTime,
      endTime: startTime + 4 * 3600,
      location: store.primaryVenue?.name || store.venueName || '',
      description: '甜囍手册婚礼提醒'
    })
  } else {
    uni.showToast({ title: '请手动添加到日历', icon: 'none' })
  }
}

onLoad(async (options) => {
  if (options?.id) {
    userStore.setWeddingId(options.id)
  }
  if (userStore.weddingId && !(store.guests?.guests?.length)) {
    try { await fetchWedding(userStore.weddingId) } catch (err) {}
  }
  const rsvp = (store.guests?.guests || []).find(item => {
    if (item.is_current_user === true) return true
    return (form.phone && item.phone === form.phone) || (userStore.openid && item.openid === userStore.openid)
  })
  if (rsvp) {
    form.name = rsvp.name || ''
    form.status = rsvp.rsvp_status || rsvp.status || 'attending'
    form.relationship = rsvp.relationship || ''
    form.guestCount = rsvp.attending_count || rsvp.guest_count || rsvp.guestCount || 1
    form.phone = rsvp.phone || ''
    form.arrivalTime = rsvp.arrival_time || ''
    form.transportMode = rsvp.transport_mode || ''
    form.companionNote = rsvp.companion_note || ''
    form.dietary = rsvp.dietary ? rsvp.dietary.split('、') : []
    form.message = rsvp.message || ''
  }
})
</script>

<style lang="scss" scoped>
.page {
  background-color: var(--theme-page, $bg-color);
  color: var(--theme-ink, $text-primary);
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}

/* 顶部标题 */
.page-header {
  padding: $page-header-top $page-gutter $page-header-bottom;
}
.page-tag {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: $tracking-kicker;
  text-transform: uppercase;
  margin-bottom: 18rpx;
  font-weight: 500;
}
.page-tag::before {
  content: '';
  width: 24rpx;
  height: 1rpx;
  background: currentColor;
  opacity: 0.5;
}
.page-title {
  display: block;
  font-size: $font-h1;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 16rpx;
  letter-spacing: $tracking-cn;
  line-height: 1.25;
}
.page-divider {
  width: 32rpx;
  height: 2rpx;
  background: $text-primary;
  margin-bottom: 20rpx;
  border-radius: 2rpx;
  position: relative;
}
.page-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  left: calc(100% + 12rpx);
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: $text-muted;
  opacity: 0.4;
  transform: translateY(-50%);
}
.page-desc {
  display: block;
  font-size: $font-body;
  color: $text-secondary;
  line-height: 1.7;
  letter-spacing: $tracking-cn-soft;
}

.rsvp-brief {
  width: calc(100vw - 96rpx);
  margin: 0 auto 44rpx;
  padding: 36rpx 36rpx 32rpx;
  border-radius: $card-radius;
  background: $text-primary;
  color: #fff;
  box-shadow:
    0 12rpx 32rpx rgba(0, 0, 0, 0.08),
    0 2rpx 6rpx rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}
.rsvp-brief::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6rpx;
  background: $color-primary;
}
.rsvp-brief::after {
  content: '';
  position: absolute;
  top: 32rpx;
  right: 28rpx;
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 70%);
  pointer-events: none;
  z-index: -1;
}
.brief-kicker {
  display: block;
  font-size: 18rpx;
  color: rgba(255,255,255,0.56);
  letter-spacing: $tracking-kicker;
  text-transform: uppercase;
  margin-bottom: 12rpx;
  font-weight: 500;
}
.brief-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  letter-spacing: $tracking-cn-soft;
}
.brief-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin-top: 28rpx;
}
.brief-item {
  padding-top: 18rpx;
  border-top: 1rpx solid rgba(255,255,255,0.10);
}
.brief-item.wide {
  grid-column: 1 / -1;
}
.brief-label {
  display: block;
  font-size: 18rpx;
  letter-spacing: $tracking-kicker;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
  margin-bottom: 8rpx;
  font-weight: 500;
}
.brief-value {
  display: block;
  font-size: 26rpx;
  color: rgba(255,255,255,0.92);
  line-height: 1.4;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 表单 */
.form {
  width: calc(100vw - 96rpx);
  margin: 0 auto;
  padding: 0;
  box-sizing: border-box;
}
.form-group {
  margin-bottom: 40rpx;
}
.form-label {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.label-text {
  font-size: 28rpx;
  font-weight: 500;
  color: $text-primary;
}
.required-tip {
  padding: 4rpx 10rpx;
  border-radius: 6rpx;
  background: $bg-muted;
  color: $text-muted;
  font-size: 20rpx;
  letter-spacing: 0.04em;
}
.label-en {
  font-size: 20rpx;
  color: $text-muted;
  letter-spacing: $tracking-kicker;
  text-transform: uppercase;
  font-weight: 500;
}

.form-input {
  height: $control-height;
  font-size: 30rpx;
  color: $text-primary;
  border-bottom: 2rpx solid $hairline-medium;
  padding: 0;
  transition:
    border-color 0.4s $ease-editorial,
    background 0.4s $ease-editorial;
  background: transparent;
}
.form-input:focus {
  border-color: $text-primary;
  border-bottom-width: 2rpx;
}
.form-input::placeholder {
  color: $text-placeholder;
  font-weight: 400;
  font-size: 28rpx;
}
.picker-value {
  height: $control-height;
  line-height: $control-height;
  border-bottom: 2rpx solid $hairline-medium;
  font-size: 30rpx;
  color: $text-primary;
  transition: border-color 0.4s $ease-editorial;
}
.placeholder {
  color: $text-placeholder;
  font-size: 30rpx;
  font-weight: 400;
}

.feature-closed {
  text-align: center;
  padding: 180rpx 64rpx;
}
.feature-title {
  display: block;
  font-size: 34rpx;
  color: $text-primary;
  font-weight: 600;
  margin-bottom: 16rpx;
  letter-spacing: $tracking-cn-soft;
  position: relative;
}
.feature-title::after {
  content: '';
  display: block;
  width: 32rpx;
  height: 2rpx;
  background: $text-primary;
  margin: 18rpx auto 0;
  border-radius: 2rpx;
  opacity: 0.6;
}
.feature-desc {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 1.7;
  margin-bottom: 40rpx;
  letter-spacing: $tracking-cn-soft;
}
.feature-action {
  width: 280rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: $text-primary;
  color: #fff;
  font-size: 26rpx;
  letter-spacing: $tracking-cn-soft;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}
.feature-action::after { border: none; }

/* 单选 */
.radio-group {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}
.radio-item {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx 8rpx;
  border-radius: $card-radius;
  border: 2rpx solid $hairline-medium;
  background: $bg-surface;
  transition:
    all 0.35s $ease-editorial,
    transform 0.2s $ease-editorial;
  position: relative;
  overflow: hidden;
}
.radio-item:active {
  transform: scale(0.98);
  background: $bg-muted;
}
.radio-item.active {
  border-color: $text-primary;
  background: $text-primary;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}
.radio-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  border: 2rpx solid $hairline-strong;
  position: relative;
  transition: all 0.35s $ease-editorial;
  background: transparent;
}
.radio-item.active .radio-dot {
  border-color: rgba(255, 255, 255, 0.9);
  background: $text-primary;
}
.radio-item.active .radio-dot::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #fff;
  transform: translate(-50%, -50%);
  animation: scaleIn 0.35s $ease-out-back both;
}
.radio-label {
  max-width: 100%;
  font-size: 24rpx;
  color: $text-primary;
  transition: color 0.3s $ease-editorial;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: $tracking-cn-soft;
}
.radio-item.active .radio-label {
  color: #fff;
}

/* 步进器 */
.stepper {
  display: flex;
  align-items: center;
  gap: 32rpx;
  padding: 8rpx 0;
}
.step-btn {
  width: $tap-min-height;
  height: $tap-min-height;
  border-radius: 50%;
  border: 2rpx solid $hairline-medium;
  background: $bg-surface;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s $ease-editorial;
  color: $text-primary;
}
.step-btn:active {
  background: $text-primary;
  border-color: $text-primary;
  transform: scale(0.94);
  color: #fff;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.08);
}
.step-icon {
  font-size: 32rpx;
  font-weight: 300;
  line-height: 1;
  transition: color 0.25s $ease-editorial;
  color: inherit;
}
.step-value {
  font-size: 36rpx;
  font-weight: 600;
  color: $text-primary;
  min-width: 48rpx;
  text-align: center;
  font-variant-numeric: tabular-nums;
  letter-spacing: $tracking-cn-soft;
}

/* 标签选择 */
.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.tag-item {
  padding: 14rpx 28rpx;
  border-radius: $radius-full;
  border: 2rpx solid $hairline-medium;
  font-size: 26rpx;
  color: $text-primary;
  transition: all 0.3s $ease-editorial;
  min-height: $control-height-sm;
  display: flex;
  align-items: center;
  background: $bg-surface;
  letter-spacing: $tracking-cn-soft;
}
.tag-item:active {
  transform: scale(0.96);
  background: $bg-muted;
}
.tag-item.active {
  background: $text-primary;
  color: #fff;
  border-color: $text-primary;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.06);
}

/* 文本域 */
.form-textarea {
  width: 100%;
  height: 200rpx;
  font-size: 30rpx;
  color: $text-primary;
  border-bottom: 2rpx solid $hairline-medium;
  padding: 16rpx 0;
  line-height: 1.7;
  transition: border-color 0.4s $ease-editorial;
  letter-spacing: $tracking-cn-soft;
}
.form-textarea:focus {
  border-color: $text-primary;
}
.char-count {
  display: block;
  text-align: right;
  font-size: 20rpx;
  color: $text-muted;
  margin-top: 10rpx;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}

/* 提交按钮 */
.form-actions {
  padding-top: 32rpx;
  position: relative;
}
.form-actions::before {
  content: '';
  display: block;
  width: 1rpx;
  height: 48rpx;
  background: $hairline-strong;
  margin: 0 auto 32rpx;
  opacity: 0.6;
}
.submit-btn {
  height: $control-height;
  line-height: $control-height;
  text-align: center;
  border-radius: $radius-full;
  background: $text-primary;
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  letter-spacing: $tracking-cn-soft;
  transition: all 0.3s $ease-editorial;
  box-shadow:
    0 6rpx 18rpx rgba(0, 0, 0, 0.1),
    0 2rpx 4rpx rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}
.submit-btn::after { border: none; }
.submit-btn:active {
  transform: scale(0.985);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
  opacity: 0.92;
}
.submit-btn[disabled] {
  opacity: 0.45;
  box-shadow: none;
}

.tpl-rose .rsvp-brief::before {
  background: $color-primary;
}
.tpl-champagne {
  background: #fbf7f1;
  .rsvp-brief {
    background: #fff;
    color: #1a1a1a;
    border: 1rpx solid rgba(164,120,59,0.16);
    box-shadow: $shadow-sm;
  }
  .rsvp-brief::before {
    background: #A4783B;
  }
  .brief-kicker,
  .brief-label {
    color: #A4783B;
  }
  .brief-title,
  .brief-value {
    color: #1a1a1a;
  }
  .brief-item {
    border-top-color: rgba(164,120,59,0.16);
  }
  .feature-action,
  .submit-btn,
  .radio-item.active,
  .tag-item.active {
    background: #A4783B;
    border-color: #A4783B;
  }
}
.tpl-noir {
  background: #111;
  .page-title,
  .feature-title,
  .label-text,
  .radio-label,
  .step-icon,
  .step-value {
    color: #fff;
  }
  .page-desc,
  .feature-desc,
  .label-en,
  .tag-item,
  .form-input,
  .picker-value,
  .form-textarea {
    color: rgba(255,255,255,0.72);
  }
  .rsvp-brief,
  .radio-item,
  .tag-item {
    background: #191919;
    border-color: rgba(201,169,110,0.18);
  }
  .rsvp-brief::before,
  .feature-action,
  .submit-btn,
  .radio-item.active,
  .tag-item.active {
    background: $color-gold;
    color: #111;
    border-color: $color-gold;
  }
}
.tpl-garden {
  background: #f5f6ef;
  .rsvp-brief {
    background: #506247;
  }
  .rsvp-brief::before,
  .feature-action,
  .submit-btn,
  .radio-item.active,
  .tag-item.active {
    background: #6F7E5D;
    border-color: #6F7E5D;
  }
}

/* ========== 成功页 ========== */
.success-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx $page-gutter 80rpx;
  min-height: 100vh;
  background: var(--theme-page, $bg-color);
  position: relative;
}
.success-page::before {
  content: '';
  position: absolute;
  top: 8%;
  left: 50%;
  transform: translateX(-50%);
  width: 480rpx;
  height: 480rpx;
  background: radial-gradient(circle at center, rgba(176, 58, 91, 0.04) 0%, rgba(176, 58, 91, 0) 70%);
  pointer-events: none;
  z-index: 0;
}
.success-page .success-ring,
.success-page .success-title,
.success-page .success-desc,
.success-page .success-card,
.success-page .success-info,
.success-page .success-divider,
.success-page .success-btn,
.success-page > view,
.success-page > text { position: relative; z-index: 1; }

.success-ring {
  position: relative;
  width: 168rpx;
  height: 168rpx;
  margin-bottom: 56rpx;
}
.success-ring::before {
  content: '';
  position: absolute;
  top: -8rpx;
  left: -8rpx;
  right: -8rpx;
  bottom: -8rpx;
  border-radius: 50%;
  border: 1rpx solid $color-success;
  opacity: 0.32;
  animation: scale-fade 2.4s ease-out infinite;
}
.success-ring::after {
  content: '';
  position: absolute;
  top: -16rpx;
  left: -16rpx;
  right: -16rpx;
  bottom: -16rpx;
  border-radius: 50%;
  border: 1rpx solid $color-success;
  opacity: 0.18;
  animation: scale-fade 2.4s ease-out 0.4s infinite;
}
@keyframes scale-fade {
  0% { transform: scale(1); opacity: var(--ring-start, 0.32); }
  100% { transform: scale(1.4); opacity: 0; }
}

.success-circle {
  width: 168rpx;
  height: 168rpx;
  border-radius: 50%;
  background: $color-success;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  box-shadow:
    0 12rpx 28rpx rgba(0, 0, 0, 0.12),
    inset 0 2rpx 4rpx rgba(255, 255, 255, 0.2);
  animation: bounceIn 0.9s $ease-out-back both;
}
.success-icon {
  font-size: 76rpx;
  color: #fff;
  font-weight: 600;
  line-height: 1;
}

.success-title {
  font-size: 44rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 16rpx;
  letter-spacing: $tracking-cn-soft;
  animation: fadeInUp 0.7s $ease-editorial 0.3s both;
}
.success-title::after {
  content: '';
  display: block;
  width: 32rpx;
  height: 2rpx;
  background: $text-primary;
  margin: 18rpx auto 0;
  border-radius: 2rpx;
  opacity: 0.6;
}
.success-desc {
  font-size: 26rpx;
  color: $text-secondary;
  margin-bottom: 56rpx;
  text-align: center;
  line-height: 1.7;
  letter-spacing: $tracking-cn-soft;
  animation: fadeInUp 0.7s $ease-editorial 0.45s both;
}

.success-card {
  width: 100%;
  max-width: 560rpx;
  background: $bg-surface;
  border-radius: $card-radius;
  border: 1rpx solid $hairline-soft;
  padding: 36rpx 32rpx;
  margin-bottom: 48rpx;
  box-shadow:
    0 8rpx 24rpx rgba(0, 0, 0, 0.04),
    0 1rpx 2rpx rgba(0, 0, 0, 0.02);
  animation: fadeInUp 0.7s $ease-editorial 0.6s both;
}
.success-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 0;
}
.info-label {
  font-size: 24rpx;
  color: $text-muted;
  letter-spacing: $tracking-cn-soft;
}
.info-value {
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
  letter-spacing: $tracking-cn-soft;
}
.success-divider {
  height: 1rpx;
  background: $hairline-soft;
  margin: 0 8rpx;
}

.back-btn {
  width: 280rpx;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: $radius-full;
  border: 1rpx solid $hairline-strong;
  background: transparent;
  color: $text-primary;
  font-size: 28rpx;
  letter-spacing: $tracking-cn-soft;
  transition: all 0.3s $ease-editorial;
  animation: fadeInUp 0.7s $ease-editorial 0.75s both;
}
.back-btn::after { border: none; }
.back-btn:active {
  background: $text-primary;
  color: #fff;
  border-color: $text-primary;
  transform: scale(0.985);
}
.success-actions {
  width: 100%;
  display: flex;
  gap: 14rpx;
  margin-top: 24rpx;
  animation: fadeInUp 0.7s $ease-editorial 0.85s both;
}
.success-action {
  flex: 1;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-primary;
  font-size: 24rpx;
  padding: 0;
  letter-spacing: $tracking-cn-soft;
  transition: all 0.3s $ease-editorial;
}
.success-action::after { border: none; }
.success-action:active {
  background: $text-primary;
  color: #fff;
  transform: scale(0.98);
}

.theme-rose,
.theme-champagne,
.theme-noir,
.theme-garden,
.theme-heritage,
.theme-shandong,
.theme-travel {
  background: var(--theme-page, $bg-color);
  color: var(--theme-ink, $text-primary);

  .page-title,
  .feature-title,
  .label-text,
  .radio-label,
  .tag-item,
  .step-icon,
  .step-value,
  .form-input,
  .picker-value,
  .form-textarea,
  .success-title,
  .info-value,
  .back-btn,
  .success-action {
    color: var(--theme-ink, $text-primary);
  }

  .page-tag,
  .page-desc,
  .feature-desc,
  .label-en,
  .char-count,
  .info-label,
  .success-desc {
    color: var(--theme-muted, $text-muted);
  }

  .page-divider {
    background: var(--theme-accent, $color-primary);
  }

  .rsvp-brief {
    background: var(--theme-strong-bg, $text-primary);
    border: 1rpx solid var(--theme-strong-border, transparent);
    color: var(--theme-strong-ink, #fff);
  }

  .rsvp-brief::before {
    background: var(--theme-accent, $color-primary);
  }

  .brief-title,
  .brief-value {
    color: var(--theme-strong-ink, #fff);
  }

  .brief-kicker,
  .brief-label {
    color: var(--theme-strong-muted, rgba(255,255,255,0.56));
  }

  .brief-item {
    border-top-color: var(--theme-strong-border, rgba(255,255,255,0.12));
  }

  .radio-item,
  .tag-item,
  .success-card,
  .back-btn {
    background: var(--theme-surface, $bg-surface);
    border-color: var(--theme-border, $border-color);
  }

  .radio-item.active,
  .tag-item.active,
  .feature-action,
  .submit-btn {
    background: var(--theme-accent, $text-primary);
    border-color: var(--theme-accent, $text-primary);
    color: var(--theme-on-accent, #fff);
  }

  .form-input,
  .picker-value,
  .form-textarea,
  .success-divider {
    border-color: var(--theme-border, $border-color);
  }

  .success-divider {
    background: var(--theme-border, $border-color);
  }

  .required-tip,
  .success-action {
    background: var(--theme-elevated, $bg-muted);
    color: var(--theme-muted, $text-muted);
  }
}
</style>
