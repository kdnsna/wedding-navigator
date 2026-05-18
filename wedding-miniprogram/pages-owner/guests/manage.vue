<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">GUESTS</text>
      <text class="page-title">宾客管理</text>
    </view>

    <!-- 统计 -->
    <view class="stats-row">
      <view class="stat-item">
        <text class="stat-num">{{ stats.attending }}</text>
        <text class="stat-label">出席</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ stats.uncertain }}</text>
        <text class="stat-label">待定</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ stats.declined }}</text>
        <text class="stat-label">缺席</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ stats.pending }}</text>
        <text class="stat-label">未填</text>
      </view>
    </view>

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
          <text class="action-link" @click="editGuest(guest)">编辑</text>
          <text class="action-link delete" @click="deleteGuest(guest.id)">删除</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="filteredGuests.length === 0">
      <image class="empty-visual empty-icon" src="/static/visuals/empty-guests.png" mode="aspectFit" />
      <text class="empty-text">暂无宾客</text>
    </view>

    <!-- 添加按钮 -->
    <button class="add-btn" @click="showAddModal">
      <text>+ 添加宾客</text>
    </button>

    <!-- 弹窗 -->
    <view class="modal-mask" v-if="showModal" @click="showModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingGuest ? '编辑宾客' : '添加宾客' }}</text>
          <text class="modal-close" @click="showModal = false">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">姓名</text>
            <input class="form-input" v-model="modalForm.name" placeholder="宾客姓名" />
          </view>
          <view class="form-group">
            <text class="form-label">手机号</text>
            <input class="form-input" v-model="modalForm.phone" placeholder="手机号" type="number" />
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
              <button class="stepper-btn" @click="modalForm.count > 0 && modalForm.count--">−</button>
              <text class="stepper-value">{{ modalForm.count }}</text>
              <button class="stepper-btn" @click="modalForm.count++">+</button>
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
            <input class="form-input" v-model="modalForm.companionNote" placeholder="选填" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn secondary" @click="showModal = false">取消</button>
          <button class="modal-btn primary" @click="saveGuest">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { generateId, showSuccess } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { updateWedding } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()

const showModal = ref(false)
const editingGuest = ref(null)
const currentFilter = ref('all')

const rsvpOptions = ['未填写', '出席', '待定', '缺席']
const statusMap = { '未填写': 'pending', '出席': 'attending', '待定': 'uncertain', '缺席': 'declined' }
const reverseStatusMap = { 'pending': 0, 'attending': 1, 'uncertain': 2, 'declined': 3 }

const dietOptions = ['普通', '素食', '清真', '其他']
const dietMap = { '普通': 'normal', '素食': 'vegetarian', '清真': 'halal', '其他': 'other' }
const reverseDietMap = { 'normal': 0, 'vegetarian': 1, 'halal': 2, 'other': 3 }
const relationshipOptions = ['未填写', '亲友', '同学', '同事', '家人', '其他']
const transportOptions = ['未填写', '自驾', '打车', '公共交通', '跟车', '待定']

const modalForm = ref({ name: '', phone: '', statusIndex: 0, count: 1, dietIndex: 0, relationshipIndex: 0, arrivalTime: '', transportIndex: 0, companionNote: '' })

const guests = computed(() => store.guests?.guests || [])
const stats = computed(() => store.rsvpStats)

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
  editingGuest.value = null
  modalForm.value = { name: '', phone: '', statusIndex: 0, count: 1, dietIndex: 0, relationshipIndex: 0, arrivalTime: '', transportIndex: 0, companionNote: '' }
  showModal.value = true
}

function editGuest(guest) {
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
  showModal.value = true
}

function onStatusChange(e) { modalForm.value.statusIndex = e.detail.value }
function onDietChange(e) { modalForm.value.dietIndex = e.detail.value }
function onRelationshipChange(e) { modalForm.value.relationshipIndex = e.detail.value }
function onArrivalTimeChange(e) { modalForm.value.arrivalTime = e.detail.value }
function onTransportChange(e) { modalForm.value.transportIndex = e.detail.value }

function saveGuest() {
  const guest = {
    id: editingGuest.value?.id || generateId(),
    name: modalForm.value.name,
    phone: modalForm.value.phone,
    rsvp_status: statusMap[rsvpOptions[modalForm.value.statusIndex]],
    attending_count: modalForm.value.count,
    diet_preference: dietMap[dietOptions[modalForm.value.dietIndex]],
    relationship: relationshipOptions[modalForm.value.relationshipIndex] === '未填写' ? '' : relationshipOptions[modalForm.value.relationshipIndex],
    arrival_time: modalForm.value.arrivalTime,
    transport_mode: transportOptions[modalForm.value.transportIndex] === '未填写' ? '' : transportOptions[modalForm.value.transportIndex],
    companion_note: modalForm.value.companionNote,
    created_at: editingGuest.value?.created_at || Date.now()
  }
  if (editingGuest.value) {
    if (!store.guests) store.guests = { guests: [] }
    if (!store.guests.guests) store.guests.guests = []
    const idx = store.guests.guests.findIndex(g => g.id === editingGuest.value.id)
    if (idx >= 0) store.guests.guests[idx] = guest
  } else {
    store.addGuest(guest)
  }
  saveToStorage()
  showModal.value = false
  showSuccess('保存成功')
}

function deleteGuest(id) {
  uni.showModal({
    title: '确认删除',
    content: '确定删除该宾客？',
    success: (res) => {
      if (res.confirm) {
        if (store.guests && Array.isArray(store.guests.guests)) {
          store.guests.guests = store.guests.guests.filter(g => g.id !== id)
        }
        saveToStorage()
        showSuccess('已删除')
      }
    }
  })
}

async function saveToStorage() {
  try {
    await updateWedding(userStore.weddingId, 'guests', store.guests)
  } catch (err) {
    console.error('guests 云端保存失败:', err)
  }
  const weddings = uni.getStorageSync('weddings') || {}
  if (weddings[userStore.weddingId]) {
    weddings[userStore.weddingId].guests = store.guests
    uni.setStorageSync('weddings', weddings)
  }
}

onShow(() => { useOwnerGuard() })
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: 160rpx;
}

/* 顶部标题 */
.page-header {
  padding: 60rpx 48rpx 24rpx;
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
}

/* 统计 */
.stats-row {
  display: flex;
  padding: 24rpx 48rpx 32rpx;
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
  padding: 0 48rpx 24rpx;
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
  padding: 0 48rpx;
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
}
.guest-name {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-primary;
}
.guest-phone {
  font-size: 22rpx;
  color: $text-muted;
}
.guest-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
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
  left: 48rpx;
  right: 48rpx;
  height: 96rpx;
  line-height: 96rpx;
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
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 48rpx calc(40rpx + constant(safe-area-inset-bottom));
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
  font-size: 32rpx;
  color: $text-muted;
  padding: 10rpx;
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
  height: 80rpx;
  padding: 0 4rpx;
  border-bottom: 2rpx solid $border-color;
  font-size: 30rpx;
  background: transparent;
  box-sizing: border-box;
}
.picker-value {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
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
  width: 56rpx;
  height: 56rpx;
  line-height: 56rpx;
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
  height: 88rpx;
  line-height: 88rpx;
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
