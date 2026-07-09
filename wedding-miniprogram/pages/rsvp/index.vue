<template>
  <PageShell
    class="rsvp-page"
    :theme-class="templateClass"
    :kicker="pageKicker"
    :title="pageTitle"
    :desc="pageDesc"
    :safe-bottom="!submitted && isRsvpEnabled && !loadError"
  >

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
    <EmptyState
      v-if="loadError && !submitted"
      icon="/static/visuals/icon-warning.svg"
      title="婚礼信息加载失败"
      :desc="loadError"
      action-text="重新加载"
      @action="reloadWedding"
    />

    <EmptyState
      v-else-if="!submitted && !isRsvpEnabled"
      icon="/static/visuals/icon-rsvp.svg"
      title="新人暂未开放在线回执"
      desc="您仍可查看婚礼时间、地点和到场路线。"
      action-text="查看路线"
      @action="goToGuide"
    />

    <view class="form" v-else-if="!submitted && isRsvpEnabled">
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
          maxlength="20"
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
            @click="setAttendanceStatus('attending')"
          >
            <view class="radio-dot" />
            <text class="radio-label">我会出席</text>
          </view>
          <view
            class="radio-item"
            :class="{ active: form.status === 'uncertain' }"
            @click="setAttendanceStatus('uncertain')"
          >
            <view class="radio-dot" />
            <text class="radio-label">不确定</text>
          </view>
          <view
            class="radio-item"
            :class="{ active: form.status === 'declined' }"
            @click="setAttendanceStatus('declined')"
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
          <view class="step-btn" @click="decrementGuestCount">
            <text class="step-icon">−</text>
          </view>
          <text class="step-value">{{ form.guestCount }}</text>
          <view class="step-btn" @click="incrementGuestCount">
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
          maxlength="20"
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
          maxlength="80"
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

    </view>

    <!-- 成功页 -->
    <view class="success-page" v-else-if="submitted">
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
      <button class="back-btn" @click="goHome">
        <text>返回首页</text>
      </button>
      <view class="success-actions" v-if="form.status !== 'declined'">
        <button class="success-action" @click="goToGuide">查看路线</button>
        <button class="success-action" @click="openCalendar">加入日历</button>
        <button class="success-action" @click="goToBlessing">写祝福</button>
      </view>
    </view>
    <BottomActionBar
      v-if="!submitted && isRsvpEnabled && !loadError"
      primary-text="确认提交"
      secondary-text="查看路线"
      :loading="submitting"
      :disabled="submitting"
      :primary-disabled="!requiredFieldsReady"
      @primary="handleSubmit"
      @secondary="goToGuide"
    />
  </PageShell>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageShell from '@/components/ui/PageShell.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BottomActionBar from '@/components/ui/BottomActionBar.vue'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding, submitRSVP } from '@/composables/useCloud.js'
import { formatDate } from '@/utils/index.js'

const store = useWeddingStore()
const userStore = useUserStore()

const submitted = ref(false)
const submitting = ref(false)
const loading = ref(false)
const loadError = ref('')
const activeTemplate = computed(() => store.activeTemplate)
const templateClass = computed(() => store.templateClass)
const isRsvpEnabled = computed(() => store.isRsvpEnabled)
const phoneRequired = computed(() => store.rsvpPhoneRequired)
const allowRsvpUpdate = computed(() => store.allowRsvpUpdate)
const pageKicker = computed(() => (submitted.value ? '' : 'RSVP'))
const pageTitle = computed(() => {
  if (submitted.value) return ''
  if (loadError.value) return '确认出席'
  return isRsvpEnabled.value ? '确认出席' : '回执未开放'
})
const pageDesc = computed(() => {
  if (submitted.value) return ''
  if (loadError.value) return '请重新加载邀请信息后再提交回执。'
  return isRsvpEnabled.value ? '请告诉我们是否能见证这美好时刻' : '新人暂未开放在线回执，路线和流程仍可查看。'
})
const requiredFieldsReady = computed(() => {
  if (loading.value || !userStore.weddingId) return false
  if (!form.name.trim()) return false
  if (form.status !== 'declined' && phoneRequired.value && !form.phone.trim()) return false
  return true
})

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

function setAttendanceStatus(status) {
  form.status = status
  if (status === 'declined') {
    form.guestCount = 0
    form.phone = ''
    form.arrivalTime = ''
    form.transportMode = ''
    form.companionNote = ''
    form.dietary = []
    return
  }
  if (Number(form.guestCount || 0) < 1) {
    form.guestCount = 1
  }
}

function onArrivalTimeChange(e) {
  form.arrivalTime = e.detail.value
}

function isValidPhone(phone) {
  if (!phone) return true
  return /^\d{6,20}$/.test(String(phone).trim())
}

function incrementGuestCount() {
  if (form.status === 'declined') return
  form.guestCount = Math.min(Number(form.guestCount || 1) + 1, 20)
}

function decrementGuestCount() {
  if (form.status === 'declined') return
  form.guestCount = Math.max(1, Number(form.guestCount || 1) - 1)
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
  if (form.status !== 'declined' && form.phone.trim() && !isValidPhone(form.phone)) {
    uni.showToast({ title: '请输入有效联系电话', icon: 'none' })
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
  relaunchOrToast('/pages/index/index', '返回首页')
}

function goHome() {
  relaunchOrToast('/pages/index/index', '返回首页')
}

function goToGuide() {
  switchTabOrToast('/pages/guide/index', '打开路书')
}

function goToBlessing() {
  uni.navigateTo({
    url: '/pages/blessing/index',
    fail: (err) => routeFail('打开祝福墙', err)
  })
}

function routeFail(label, err) {
  console.warn(`${label}失败:`, err)
  uni.showToast({ title: `${label}失败，请稍后重试`, icon: 'none' })
}

function relaunchOrToast(url, label) {
  uni.reLaunch({
    url,
    fail: (err) => routeFail(label, err)
  })
}

function switchTabOrToast(url, label) {
  uni.switchTab({
    url,
    fail: (err) => routeFail(label, err)
  })
}

function openCalendar() {
  const date = store.weddingDate
  const time = store.weddingTime || '12:00'
  if (!date) {
    uni.showToast({ title: '暂无婚礼日期', icon: 'none' })
    return
  }
  const startTime = Math.floor(new Date(`${date}T${time}`).getTime() / 1000)
  if (!Number.isFinite(startTime)) {
    uni.showToast({ title: '婚礼日期格式有误', icon: 'none' })
    return
  }
  if (typeof wx !== 'undefined' && wx.addPhoneCalendar) {
    wx.addPhoneCalendar({
      title: `${store.coupleName} 的婚礼`,
      startTime,
      endTime: startTime + 4 * 3600,
      location: store.primaryVenue?.name || store.venueName || '',
      description: '甜囍手册婚礼提醒',
      success: () => {
        uni.showToast({ title: '已添加到日历', icon: 'success' })
      },
      fail: (err) => {
        if (err?.errMsg?.includes('auth deny')) {
          uni.showModal({
            title: '需要授权',
            content: '请允许添加到日历权限',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                uni.openSetting({
                  fail: (settingErr) => {
                    console.warn('打开设置失败:', settingErr)
                    uni.showToast({ title: '打开设置失败', icon: 'none' })
                  }
                })
              }
            }
          })
        } else {
          console.warn('加入日历失败:', err)
          uni.showToast({ title: '添加失败，请手动添加', icon: 'none' })
        }
      }
    })
  } else {
    uni.showToast({ title: '请手动添加到日历', icon: 'none' })
  }
}

onLoad(async (options) => {
  if (options?.id) {
    userStore.setWeddingId(options.id)
  }
  await loadWedding()
  const rsvp = (store.guests?.guests || []).find(item => {
    if (item.is_current_user === true) return true
    return (form.phone && item.phone === form.phone) || (userStore.openid && item.openid === userStore.openid)
  })
  if (rsvp) {
    form.name = rsvp.name || ''
    form.status = rsvp.rsvp_status || rsvp.status || 'attending'
    form.relationship = rsvp.relationship || ''
    form.guestCount = rsvp.attending_count || rsvp.guest_count || rsvp.guestCount || 1
    if (form.status === 'declined') form.guestCount = 0
    form.phone = rsvp.phone || ''
    form.arrivalTime = rsvp.arrival_time || ''
    form.transportMode = rsvp.transport_mode || ''
    form.companionNote = rsvp.companion_note || ''
    form.dietary = rsvp.dietary ? rsvp.dietary.split('、') : []
    form.message = rsvp.message || ''
  }
})

async function loadWedding(force = false) {
  loadError.value = ''
  if (!userStore.weddingId || (store.guests?.guests?.length && !force)) return
  loading.value = true
  try {
    await fetchWedding(userStore.weddingId, force)
  } catch (err) {
    console.error('回执页加载婚礼失败:', err)
    loadError.value = err?.message || '暂时无法读取婚礼信息，请检查网络后重试。'
    uni.showToast({ title: '婚礼信息加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function reloadWedding() {
  await loadWedding(true)
}
</script>

<style lang="scss" scoped>
.rsvp-page {
  background-color: var(--theme-page, $bg-color);
  color: var(--theme-ink, $text-primary);
  min-height: 100vh;
}

/* 顶部标题 */
.page-header {
  padding: $page-header-top $page-gutter $page-header-bottom;
}
.page-tag {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 0;
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

.rsvp-brief {
  width: calc(100vw - 96rpx);
  margin: 0 auto 44rpx;
  padding: 32rpx;
  border-radius: $card-radius;
  background: $text-primary;
  color: #fff;
  box-shadow: $shadow-sm;
  position: relative;
  overflow: hidden;
}
.rsvp-brief::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 8rpx;
  background: $color-primary;
}
.brief-kicker {
  display: block;
  font-size: 18rpx;
  color: rgba(255,255,255,0.56);
  letter-spacing: 0;
  margin-bottom: 10rpx;
}
.brief-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.brief-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin-top: 28rpx;
}
.brief-item {
  padding-top: 18rpx;
  border-top: 1rpx solid rgba(255,255,255,0.12);
}
.brief-item.wide {
  grid-column: 1 / -1;
}
.brief-label {
  display: block;
  font-size: 18rpx;
  letter-spacing: 0;
  color: rgba(255,255,255,0.45);
  margin-bottom: 6rpx;
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
}
.label-en {
  font-size: 20rpx;
  color: $text-muted;
  letter-spacing: 0;
}

.form-input {
  height: $control-height;
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
  height: $control-height;
  line-height: $control-height;
  border-bottom: 2rpx solid $border-color;
  font-size: 30rpx;
  color: $text-primary;
}
.placeholder {
  color: $text-placeholder;
  font-size: 30rpx;
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
  margin-bottom: 14rpx;
}
.feature-desc {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 1.6;
  margin-bottom: 36rpx;
}
.feature-action {
  width: 260rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: $text-primary;
  color: #fff;
  font-size: 26rpx;
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
  max-width: 100%;
  font-size: 24rpx;
  color: $text-primary;
  transition: color 0.25s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  width: $tap-min-height;
  height: $tap-min-height;
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
  min-height: $control-height-sm;
  display: flex;
  align-items: center;
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
  height: $control-height;
  line-height: $control-height;
  text-align: center;
  border-radius: $radius-full;
  background: $text-primary;
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: $shadow-sm;
}
.submit-btn::after { border: none; }
.submit-btn:active {
  transform: scale(0.97);
  box-shadow: $shadow-xs;
}
.submit-btn[disabled] {
  opacity: 0.5;
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
    background: var(--accent, $color-primary);
  }
  .brief-kicker,
  .brief-label {
    color: var(--accent, $color-primary);
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
    background: var(--accent, $color-primary);
    border-color: var(--accent, $color-primary);
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
    background: var(--accent, $color-primary);
  }
  .rsvp-brief::before,
  .feature-action,
  .submit-btn,
  .radio-item.active,
  .tag-item.active {
    background: var(--accent, $color-primary);
    border-color: var(--accent, $color-primary);
  }
}

/* ========== 成功页 ========== */
.success-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx $page-gutter;
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
  letter-spacing: 0;
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
  border-radius: $card-radius;
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
  height: $control-height-sm;
  line-height: $control-height-sm;
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

.theme-wine,
.theme-cinnabar,
.theme-indigo,
.theme-pine {
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
