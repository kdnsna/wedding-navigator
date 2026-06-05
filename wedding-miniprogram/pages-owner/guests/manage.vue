<template>
  <PageShell
    class="page guests-page"
    kicker="GUESTS"
    title="宾客管理"
    desc="维护宾客名单、回执状态、到达信息和随行备注。"
  >

    <!-- 统计 -->
    <MetricStrip :items="guestMetricItems" />

    <!-- 筛选 -->
    <view class="filter-row">
      <text
        class="filter-pill"
        v-for="tab in filterTabs"
        :key="tab.value"
        :class="{ active: currentFilter === tab.value }"
        @click="currentFilter = tab.value"
      >
        {{ tab.label }}
      </text>
    </view>

    <!-- 宾客列表 -->
    <view class="guest-list" v-if="filteredGuests.length > 0">
      <view class="guest-item" v-for="guest in filteredGuests" :key="guest.id">
        <view class="guest-main">
          <text class="guest-name">{{ guest.name }}</text>
          <text class="guest-phone">{{ maskPhone(guest.phone) }}</text>
        </view>
        <view class="guest-meta">
          <text class="guest-status" :class="`status-${guest.rsvp_status}`">
            {{ statusText(guest.rsvp_status) }}
          </text>
          <text class="guest-count" v-if="guest.attending_count > 0">{{ guest.attending_count }}人</text>
        </view>
        <view class="guest-extra" v-if="guest.relationship || guest.arrival_time || guest.transport_mode || guest.companion_note">
          <text v-if="guest.relationship">{{ guest.relationship }}</text>
          <text v-if="guest.arrival_time">{{ guest.arrival_time }}到达</text>
          <text v-if="guest.transport_mode">{{ guest.transport_mode }}</text>
          <text v-if="guest.companion_note">{{ guest.companion_note }}</text>
        </view>
        <view class="guest-actions">
          <text class="action-link" :class="{ disabled: guestBusy }" @click="editGuest(guest)">编辑</text>
          <text class="action-link delete" :class="{ disabled: guestBusy }" @click="deleteGuest(guest.id)">删除</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <EmptyState
      v-if="filteredGuests.length === 0"
      icon="/static/visuals/empty-guests.svg"
      :title="currentFilter === 'all' ? '暂无宾客' : '当前筛选下暂无宾客'"
      desc="可以先添加核心亲友，后续 RSVP 会自动同步到这里。"
    />

    <!-- 弹窗 -->
    <view class="modal-mask" v-if="showModal" @click="requestCloseGuestModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingGuest ? '编辑宾客' : '添加宾客' }}</text>
          <image class="modal-close" src="/static/visuals/icon-close.svg" mode="aspectFit" @click="requestCloseGuestModal" />
        </view>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">姓名</text>
            <input class="form-input" v-model="modalForm.name" placeholder="宾客姓名" maxlength="20" />
          </view>
          <view class="form-group">
            <text class="form-label">手机号</text>
            <input class="form-input" v-model="modalForm.phone" placeholder="手机号" type="number" maxlength="20" />
          </view>
          <view class="form-group">
            <text class="form-label">RSVP状态</text>
            <picker mode="selector" :range="rsvpOptions" :value="modalForm.statusIndex" @change="onStatusChange">
              <view class="picker-value">{{ rsvpOptions[modalForm.statusIndex] }}</view>
            </picker>
          </view>
          <view class="form-group">
            <text class="form-label">出席人数</text>
            <view class="stepper">
              <button class="stepper-btn" :disabled="!canDecrementGuest" @click="decrementGuestCount">−</button>
              <text class="stepper-value">{{ modalForm.count }}</text>
              <button class="stepper-btn" :disabled="!canIncrementGuest" @click="incrementGuestCount">+</button>
            </view>
          </view>
          <view class="form-group">
            <text class="form-label">关系</text>
            <picker mode="selector" :range="relationshipOptions" :value="modalForm.relationshipIndex" @change="onRelationshipChange">
              <view class="picker-value">{{ relationshipOptions[modalForm.relationshipIndex] }}</view>
            </picker>
          </view>
          <view class="form-group">
            <text class="form-label">预计到达</text>
            <picker mode="time" :value="modalForm.arrivalTime" @change="onArrivalTimeChange">
              <view class="picker-value">{{ modalForm.arrivalTime || '请选择' }}</view>
            </picker>
          </view>
          <view class="form-group">
            <text class="form-label">交通方式</text>
            <picker mode="selector" :range="transportOptions" :value="modalForm.transportIndex" @change="onTransportChange">
              <view class="picker-value">{{ transportOptions[modalForm.transportIndex] }}</view>
            </picker>
          </view>
          <view class="form-group">
            <text class="form-label">饮食偏好</text>
            <picker mode="selector" :range="dietOptions" :value="modalForm.dietIndex" @change="onDietChange">
              <view class="picker-value">{{ dietOptions[modalForm.dietIndex] }}</view>
            </picker>
          </view>
          <view class="form-group">
            <text class="form-label">随行备注</text>
            <input class="form-input" v-model="modalForm.companionNote" placeholder="选填" maxlength="80" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn secondary" :disabled="saving" @click="requestCloseGuestModal">取消</button>
          <button class="modal-btn primary" :loading="saving" :disabled="saving" @click="saveGuest">确定</button>
        </view>
      </view>
    </view>
    <BottomActionBar
      primary-text="添加宾客"
      secondary-text="刷新"
      :secondary-loading="refreshing"
      :disabled="saving"
      :primary-disabled="refreshing"
      @primary="showAddModal"
      @secondary="refreshGuests"
    />
  </PageShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageShell from '@/components/ui/PageShell.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BottomActionBar from '@/components/ui/BottomActionBar.vue'
import MetricStrip from '@/components/ui/MetricStrip.vue'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { generateId, showSuccess, showError } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { fetchWedding, updateWedding } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()

const showModal = ref(false)
const editingGuest = ref(null)
const currentFilter = ref('all')
const saving = ref(false)
const refreshing = ref(false)
const guestFormSnapshot = ref('')

const rsvpOptions = ['未填写', '出席', '待定', '缺席']
const statusMap = { '未填写': 'pending', '出席': 'attending', '待定': 'uncertain', '缺席': 'declined' }
const reverseStatusMap = { 'pending': 0, 'attending': 1, 'uncertain': 2, 'declined': 3 }

const dietOptions = ['普通', '素食', '清真', '其他']
const dietMap = { '普通': 'normal', '素食': 'vegetarian', '清真': 'halal', '其他': 'other' }
const reverseDietMap = { 'normal': 0, 'vegetarian': 1, 'halal': 2, 'other': 3 }
const relationshipOptions = ['未填写', '亲友', '同学', '同事', '家人', '其他']
const transportOptions = ['未填写', '自驾', '打车', '公共交通', '跟车', '待定']
const MAX_GUEST_COUNT = 20

const modalForm = ref({ name: '', phone: '', statusIndex: 0, count: 1, dietIndex: 0, relationshipIndex: 0, arrivalTime: '', transportIndex: 0, companionNote: '' })

const guests = computed(() => store.guests?.guests || [])
const stats = computed(() => store.rsvpStats)
const guestMetricItems = computed(() => [
  { label: '出席', value: stats.value.attending || 0 },
  { label: '待定', value: stats.value.uncertain || 0 },
  { label: '缺席', value: stats.value.declined || 0 },
  { label: '未填', value: stats.value.pending || 0 }
])
const canDecrementGuest = computed(() => Number(modalForm.value.count || 0) > minGuestCount())
const canIncrementGuest = computed(() => Number(modalForm.value.count || 0) < MAX_GUEST_COUNT)
const guestBusy = computed(() => saving.value || refreshing.value)

const filterTabs = [
  { label: '全部', value: 'all' },
  { label: '出席', value: 'attending' },
  { label: '待定', value: 'uncertain' },
  { label: '缺席', value: 'declined' },
  { label: '未填', value: 'pending' }
]

const filteredGuests = computed(() => {
  if (currentFilter.value === 'all') return guests.value
  return guests.value.filter(g => g.rsvp_status === currentFilter.value)
})

function statusText(status) {
  const map = { attending: '出席', uncertain: '待定', declined: '缺席', pending: '未填' }
  return map[status] || '未填'
}
function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

function showAddModal() {
  if (guardGuestBusy()) return
  editingGuest.value = null
  modalForm.value = { name: '', phone: '', statusIndex: 0, count: 1, dietIndex: 0, relationshipIndex: 0, arrivalTime: '', transportIndex: 0, companionNote: '' }
  snapshotGuestForm()
  showModal.value = true
}

function editGuest(guest) {
  if (guardGuestBusy()) return
  editingGuest.value = guest
  modalForm.value = {
    name: guest.name,
    phone: guest.phone,
    statusIndex: reverseStatusMap[guest.rsvp_status] || 0,
    count: guest.attending_count || 1,
    dietIndex: reverseDietMap[guest.diet_preference] || 0,
    relationshipIndex: Math.max(relationshipOptions.indexOf(guest.relationship || '未填写'), 0),
    arrivalTime: guest.arrival_time || '',
    transportIndex: Math.max(transportOptions.indexOf(guest.transport_mode || '未填写'), 0),
    companionNote: guest.companion_note || ''
  }
  snapshotGuestForm()
  showModal.value = true
}

function onStatusChange(e) {
  modalForm.value.statusIndex = Number(e.detail.value)
  const status = statusMap[rsvpOptions[modalForm.value.statusIndex]]
  if (status === 'declined') {
    modalForm.value.count = 0
  } else if (Number(modalForm.value.count || 0) < 1) {
    modalForm.value.count = 1
  }
}
function onDietChange(e) { modalForm.value.dietIndex = e.detail.value }
function onRelationshipChange(e) { modalForm.value.relationshipIndex = e.detail.value }
function onArrivalTimeChange(e) { modalForm.value.arrivalTime = e.detail.value }
function onTransportChange(e) { modalForm.value.transportIndex = e.detail.value }

function minGuestCount() {
  return statusMap[rsvpOptions[modalForm.value.statusIndex]] === 'declined' ? 0 : 1
}

function incrementGuestCount() {
  modalForm.value.count = Math.min(MAX_GUEST_COUNT, Number(modalForm.value.count || 0) + 1)
}

function decrementGuestCount() {
  modalForm.value.count = Math.max(minGuestCount(), Number(modalForm.value.count || 0) - 1)
}

function isValidPhone(phone) {
  return /^\d{6,20}$/.test(String(phone || '').trim())
}

function snapshotGuestForm() {
  guestFormSnapshot.value = JSON.stringify(modalForm.value)
}

function hasGuestFormChanges() {
  return showModal.value && JSON.stringify(modalForm.value) !== guestFormSnapshot.value
}

function guardGuestBusy() {
  if (!guestBusy.value) return false
  showError('宾客数据正在同步，请稍候')
  return true
}

function requestCloseGuestModal() {
  if (saving.value) return
  if (!hasGuestFormChanges()) {
    showModal.value = false
    return
  }
  uni.showModal({
    title: '放弃未保存内容？',
    content: '当前宾客信息还没有保存。',
    confirmText: '放弃',
    cancelText: '继续编辑',
    success: (res) => {
      if (res.confirm) showModal.value = false
    }
  })
}

async function saveGuest() {
  if (saving.value) return
  if (!modalForm.value.name.trim()) {
    showError('请输入宾客姓名')
    return
  }
  if (!modalForm.value.phone.trim()) {
    showError('请输入手机号')
    return
  }
  if (!isValidPhone(modalForm.value.phone)) {
    showError('请输入有效手机号')
    return
  }
  const normalizedPhone = String(modalForm.value.phone).trim()
  const duplicate = guests.value.find(item => item.id !== editingGuest.value?.id && String(item.phone || '').trim() === normalizedPhone)
  if (duplicate) {
    showError('手机号已存在，请直接编辑该宾客')
    return
  }
  const previousGuests = cloneGuests()
  saving.value = true
  const guest = {
    id: editingGuest.value?.id || generateId(),
    name: modalForm.value.name.trim(),
    phone: normalizedPhone,
    rsvp_status: statusMap[rsvpOptions[modalForm.value.statusIndex]],
    attending_count: statusMap[rsvpOptions[modalForm.value.statusIndex]] === 'declined' ? 0 : Math.max(1, Number(modalForm.value.count) || 1),
    diet_preference: dietMap[dietOptions[modalForm.value.dietIndex]],
    relationship: relationshipOptions[modalForm.value.relationshipIndex] === '未填写' ? '' : relationshipOptions[modalForm.value.relationshipIndex],
    arrival_time: modalForm.value.arrivalTime,
    transport_mode: transportOptions[modalForm.value.transportIndex] === '未填写' ? '' : transportOptions[modalForm.value.transportIndex],
    companion_note: modalForm.value.companionNote.trim(),
    created_at: editingGuest.value?.created_at || Date.now()
  }
  try {
    if (!store.guests) store.guests = { guests: [] }
    if (!store.guests.guests) store.guests.guests = []
    if (editingGuest.value) {
      const idx = store.guests.guests.findIndex(g => g.id === editingGuest.value.id)
      if (idx >= 0) store.guests.guests[idx] = guest
    } else {
      store.addGuest(guest)
    }
    await saveToStorage()
    snapshotGuestForm()
    showModal.value = false
    showSuccess('保存成功')
  } catch (err) {
    store.guests = previousGuests
    console.error('宾客保存失败:', err)
    showError(err?.message || '保存失败，请重试')
  } finally {
    saving.value = false
  }
}

function deleteGuest(id) {
  if (guardGuestBusy()) return
  uni.showModal({
    title: '确认删除',
    content: '确定删除该宾客？',
    success: async (res) => {
      if (res.confirm) {
        const previousGuests = cloneGuests()
        saving.value = true
        try {
          if (store.guests && Array.isArray(store.guests.guests)) {
            store.guests.guests = store.guests.guests.filter(g => g.id !== id)
          }
          await saveToStorage()
          showSuccess('已删除')
        } catch (err) {
          store.guests = previousGuests
          console.error('宾客删除失败:', err)
          showError(err?.message || '删除失败，请重试')
        } finally {
          saving.value = false
        }
      }
    }
  })
}

async function saveToStorage() {
  if (!userStore.weddingId) {
    throw new Error('未找到婚礼信息，请重新进入')
  }
  if (!store.guests) store.guests = { guests: [] }
  if (!store.guests.guests) store.guests.guests = []
  try {
    await updateWedding(userStore.weddingId, 'guests', store.guests)
  } catch (err) {
    console.error('guests 云端保存失败:', err)
    throw new Error(err?.message || '云端同步失败')
  }
  const weddings = uni.getStorageSync('weddings') || {}
  if (weddings[userStore.weddingId]) {
    weddings[userStore.weddingId].guests = store.guests
    uni.setStorageSync('weddings', weddings)
  }
}

function cloneGuests() {
  const guestsData = store.guests || { guests: [] }
  return JSON.parse(JSON.stringify({ guests: guestsData.guests || [] }))
}

async function refreshGuests() {
  if (!(await useOwnerGuard())) return
  if (!userStore.weddingId || refreshing.value || saving.value) return
  refreshing.value = true
  try {
    await fetchWedding(userStore.weddingId, true)
  } catch (err) {
    console.error('宾客刷新失败:', err)
    showError(err?.message || '宾客刷新失败')
  } finally {
    refreshing.value = false
  }
}

onShow(refreshGuests)
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

/* 顶部标题 */
.page-header {
  padding: $page-header-top $page-gutter 24rpx;
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
}

/* 统计 */
.stats-row {
  display: flex;
  padding: 24rpx $page-gutter 32rpx;
}
.stat-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
}
.stat-num {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: $text-primary;
  font-variant-numeric: tabular-nums;
  margin-bottom: 4rpx;
}
.stat-label {
  font-size: 22rpx;
  color: $text-muted;
}

/* 筛选 */
.filter-row {
  display: flex;
  gap: 12rpx;
  padding: 0 $page-gutter 24rpx;
  overflow-x: auto;
}
.filter-pill {
  padding: 12rpx 28rpx;
  border-radius: $radius-full;
  font-size: 24rpx;
  color: $text-secondary;
  background: $bg-muted;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.filter-pill.active {
  background: $text-primary;
  color: #fff;
}

/* 宾客列表 */
.guest-list {
  padding: 0 $page-gutter;
}
.guest-item {
  padding: 28rpx 0;
  border-bottom: 1rpx solid $border-color;
}
.guest-main {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 8rpx;
  min-width: 0;
}
.guest-name {
  flex: 1;
  font-size: 30rpx;
  font-weight: 600;
  color: $text-primary;
  min-width: 0;
  line-height: 1.35;
  word-break: break-word;
}
.guest-phone {
  font-size: 22rpx;
  color: $text-muted;
  flex-shrink: 0;
}
.guest-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
  flex-wrap: wrap;
}
.guest-status {
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  font-size: 20rpx;
  font-weight: 500;
}
.guest-status.status-attending { background: rgba(52,168,83,0.1); color: $color-success; }
.guest-status.status-uncertain { background: rgba(249,171,0,0.1); color: $color-warning; }
.guest-status.status-declined { background: rgba(153,153,153,0.1); color: $text-muted; }
.guest-status.status-pending { background: $bg-muted; color: $text-muted; }
.guest-count {
  font-size: 22rpx;
  color: $text-secondary;
}
.guest-extra {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 14rpx;
}
.guest-extra text {
  padding: 6rpx 12rpx;
  border-radius: 6rpx;
  background: $bg-muted;
  color: $text-secondary;
  font-size: 22rpx;
}
.guest-actions {
  display: flex;
  gap: 24rpx;
}
.action-link {
  font-size: 24rpx;
  color: $text-secondary;
}
.action-link.delete {
  color: $color-error;
}
.action-link.disabled {
  color: $text-placeholder;
  pointer-events: none;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 120rpx 60rpx;
}
.empty-icon {
  width: 220rpx;
  height: 220rpx;
  font-size: 0;
  display: block;
  margin: 0 auto 24rpx;
}
.empty-text {
  font-size: 28rpx;
  color: $text-muted;
}

/* 添加按钮 */
.add-btn {
  position: fixed;
  bottom: calc(40rpx + constant(safe-area-inset-bottom));
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  left: $page-gutter;
  right: $page-gutter;
  height: $control-height;
  line-height: $control-height;
  text-align: center;
  border-radius: $radius-full;
  background: $text-primary;
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
}
.add-btn::after { border: none; }
.add-btn:active { opacity: 0.8; }

/* 弹窗 */
.modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  width: 100%;
  background: $bg-surface;
  border-radius: $modal-radius $modal-radius 0 0;
  padding: 40rpx $page-gutter calc(40rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 36rpx;
}
.modal-title {
  font-size: $font-h2;
  font-weight: 600;
  color: $text-primary;
}
.modal-close {
  width: 50rpx;
  height: 50rpx;
  padding: 10rpx;
  box-sizing: border-box;
  opacity: 0.68;
}

.form-group {
  margin-bottom: 32rpx;
}
.form-label {
  display: block;
  font-size: 24rpx;
  color: $text-muted;
  margin-bottom: 12rpx;
}
.form-input {
  width: 100%;
  height: $control-height;
  padding: 0 4rpx;
  border-bottom: 2rpx solid $border-color;
  font-size: 30rpx;
  background: transparent;
  box-sizing: border-box;
}
.picker-value {
  width: 100%;
  height: $control-height;
  line-height: $control-height;
  font-size: 30rpx;
  color: $text-primary;
  border-bottom: 2rpx solid $border-color;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 36rpx;
}
.stepper-btn {
  width: $tap-min-height;
  height: $tap-min-height;
  line-height: $tap-min-height;
  text-align: center;
  border-radius: 50%;
  background: $bg-muted;
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
}
.stepper-btn::after { border: none; }
.stepper-btn:active { background: $border-color; transform: scale(0.92); }
.stepper-value {
  font-size: 36rpx;
  font-weight: 600;
  color: $text-primary;
  min-width: 48rpx;
  text-align: center;
}

.modal-footer {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}
.modal-btn {
  flex: 1;
  height: $control-height;
  line-height: $control-height;
  text-align: center;
  border-radius: $radius-full;
  font-size: 28rpx;
  font-weight: 500;
  transition: opacity 0.2s ease;
}
.modal-btn::after { border: none; }
.modal-btn:active { opacity: 0.8; }
.modal-btn.primary {
  background: $text-primary;
  color: #fff;
}
.modal-btn.secondary {
  background: $bg-muted;
  color: $text-primary;
}
</style>
