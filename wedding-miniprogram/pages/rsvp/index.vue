<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header" v-if="!submitted">
      <text class="page-tag">RSVP</text>
      <text class="page-title">确认出席</text>
      <view class="page-divider" />
      <text class="page-desc">请告诉我们是否能见证这美好时刻</text>
    </view>

    <!-- 表单 -->
    <view class="form" v-if="!submitted">
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
          <text class="label-en">PHONE</text>
        </view>
        <input
          class="form-input"
          v-model="form.phone"
          type="number"
          placeholder="用于接收通知"
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
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding, submitRSVP } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()

const submitted = ref(false)
const submitting = ref(false)

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
  if (form.status !== 'declined' && !form.phone.trim()) {
    uni.showToast({ title: '请输入联系电话', icon: 'none' })
    return
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
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: 80rpx;
}

/* 顶部标题 */
.page-header {
  padding: 60rpx 48rpx 36rpx;
}
.page-tag {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 6rpx;
  margin-bottom: 12rpx;
}
.page-title {
  display: block;
  font-size: $font-h1;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 16rpx;
}
.page-divider {
  width: 32rpx;
  height: 2rpx;
  background: $text-muted;
  margin-bottom: 16rpx;
}
.page-desc {
  display: block;
  font-size: $font-body;
  color: $text-secondary;
}

/* 表单 */
.form {
  padding: 0 48rpx;
}
.form-group {
  margin-bottom: 48rpx;
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
.label-en {
  font-size: 20rpx;
  color: $text-muted;
  letter-spacing: 3rpx;
}

.form-input {
  height: 96rpx;
  font-size: 30rpx;
  color: $text-primary;
  border-bottom: 2rpx solid $border-color;
  padding: 0;
  transition: border-color 0.3s ease;
}
.form-input:focus {
  border-color: $text-primary;
}
.picker-value {
  height: 88rpx;
  line-height: 88rpx;
  border-bottom: 2rpx solid $border-color;
  font-size: 30rpx;
  color: $text-primary;
}
.placeholder {
  color: $text-placeholder;
  font-size: 30rpx;
}

/* 单选 */
.radio-group {
  display: flex;
  gap: 16rpx;
}
.radio-item {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 28rpx 16rpx;
  border-radius: $radius-lg;
  border: 2rpx solid $border-color;
  background: $bg-surface;
  transition: all 0.25s ease;
}
.radio-item:active {
  transform: scale(0.98);
}
.radio-item.active {
  border-color: $text-primary;
  background: $text-primary;
}
.radio-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  border: 2rpx solid $border-color;
  position: relative;
  transition: all 0.25s ease;
}
.radio-item.active .radio-dot {
  border-color: #fff;
  background: #fff;
}
.radio-label {
  font-size: 26rpx;
  color: $text-primary;
  transition: color 0.25s ease;
  white-space: nowrap;
}
.radio-item.active .radio-label {
  color: #fff;
}

/* 步进器 */
.stepper {
  display: flex;
  align-items: center;
  gap: 32rpx;
}
.step-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  border: 2rpx solid $border-color;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.step-btn:active {
  background: $bg-muted;
  transform: scale(0.95);
}
.step-icon {
  font-size: 32rpx;
  color: $text-primary;
  font-weight: 300;
}
.step-value {
  font-size: 36rpx;
  font-weight: 600;
  color: $text-primary;
  min-width: 48rpx;
  text-align: center;
  font-variant-numeric: tabular-nums;
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
  border: 2rpx solid $border-color;
  font-size: 26rpx;
  color: $text-primary;
  transition: all 0.25s ease;
}
.tag-item:active {
  transform: scale(0.95);
}
.tag-item.active {
  background: $text-primary;
  color: #fff;
  border-color: $text-primary;
}

/* 文本域 */
.form-textarea {
  width: 100%;
  height: 200rpx;
  font-size: 30rpx;
  color: $text-primary;
  border-bottom: 2rpx solid $border-color;
  padding: 16rpx 0;
  line-height: 1.6;
}
.char-count {
  display: block;
  text-align: right;
  font-size: 22rpx;
  color: $text-muted;
  margin-top: 8rpx;
}

/* 提交按钮 */
.form-actions {
  padding-top: 24rpx;
}
.submit-btn {
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  border-radius: $radius-full;
  background: $text-primary;
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.12);
}
.submit-btn::after { border: none; }
.submit-btn:active {
  transform: scale(0.97);
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}
.submit-btn[disabled] {
  opacity: 0.5;
}

/* ========== 成功页 ========== */
.success-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 48rpx;
  min-height: 100vh;
}

.success-ring {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 48rpx;
}
.success-ring::before {
  content: '';
  position: absolute;
  top: -8rpx;
  left: -8rpx;
  right: -8rpx;
  bottom: -8rpx;
  border-radius: 50%;
  border: 2rpx solid $color-success;
  opacity: 0.3;
  animation: scale-fade 2s ease-out infinite;
}
@keyframes scale-fade {
  0% { transform: scale(1); opacity: 0.3; }
  100% { transform: scale(1.3); opacity: 0; }
}

.success-circle {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: $color-success;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  animation: bounceIn 0.8s $ease-out-back both;
}
.success-icon {
  font-size: 72rpx;
  color: #fff;
  font-weight: 700;
}

.success-title {
  font-size: 44rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 16rpx;
  letter-spacing: 4rpx;
  animation: fadeInUp 0.6s $ease-out 0.3s both;
}
.success-desc {
  font-size: 26rpx;
  color: $text-secondary;
  margin-bottom: 48rpx;
  text-align: center;
  animation: fadeInUp 0.6s $ease-out 0.45s both;
}

.success-card {
  width: 100%;
  max-width: 560rpx;
  background: $bg-surface;
  border-radius: $radius-lg;
  border: 1rpx solid $border-color;
  padding: 32rpx;
  margin-bottom: 48rpx;
  animation: fadeInUp 0.6s $ease-out 0.6s both;
}
.success-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
}
.info-label {
  font-size: 24rpx;
  color: $text-muted;
}
.info-value {
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
}
.success-divider {
  height: 1rpx;
  background: $border-color;
}

.back-btn {
  width: 280rpx;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: $radius-full;
  border: 2rpx solid $border-color;
  background: transparent;
  color: $text-primary;
  font-size: 28rpx;
  transition: all 0.2s ease;
  animation: fadeInUp 0.6s $ease-out 0.75s both;
}
.back-btn::after { border: none; }
.back-btn:active {
  background: $bg-muted;
  transform: scale(0.97);
}
.success-actions {
  width: 100%;
  display: flex;
  gap: 14rpx;
  margin-top: 24rpx;
  animation: fadeInUp 0.6s $ease-out 0.85s both;
}
.success-action {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-primary;
  font-size: 24rpx;
  padding: 0;
}
.success-action::after { border: none; }
.success-action:active {
  background: $text-primary;
  color: #fff;
}
</style>
