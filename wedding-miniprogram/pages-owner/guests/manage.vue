<template>
  <view class="page">
    <!-- 统计卡片 -->
    <view class="stats-card">
      <view class="stats-row">
        <view class="stats-item">
          <text class="stats-num">{{ stats.attending }}</text>
          <text class="stats-label">出席</text>
        </view>
        <view class="stats-item">
          <text class="stats-num">{{ stats.uncertain }}</text>
          <text class="stats-label">待定</text>
        </view>
        <view class="stats-item">
          <text class="stats-num">{{ stats.declined }}</text>
          <text class="stats-label">缺席</text>
        </view>
        <view class="stats-item">
          <text class="stats-num">{{ stats.pending }}</text>
          <text class="stats-label">未填写</text>
        </view>
      </view>
      <view class="stats-summary">
        <text>总人数：{{ stats.total }}人 | 已填写：{{ stats.total - stats.pending }}人</text>
      </view>
    </view>

    <!-- 筛选标签 -->
    <view class="filter-tabs">
      <text
        class="filter-tab"
        v-for="tab in filterTabs"
        :key="tab.value"
        :class="{ active: currentFilter === tab.value }"
        @click="currentFilter = tab.value"
      >
        {{ tab.label }}
      </text>
    </view>

    <!-- 宾客列表 -->
    <view class="guest-list">
      <view class="guest-card" v-for="guest in filteredGuests" :key="guest.id">
        <view class="guest-main">
          <text class="guest-name">{{ guest.name }}</text>
          <view class="guest-tags">
            <text class="tag" :class="`status-${guest.rsvp_status}`">{{ statusText(guest.rsvp_status) }}</text>
            <text class="tag" v-if="guest.attending_count > 0">{{ guest.attending_count }}人</text>
            <text class="tag diet" v-if="guest.diet_preference && guest.diet_preference !== 'normal'">{{ dietText(guest.diet_preference) }}</text>
          </view>
        </view>
        <text class="guest-phone">{{ maskPhone(guest.phone) }}</text>
        <view class="guest-actions">
          <text class="action-link" @click="editGuest(guest)">编辑</text>
          <text class="action-link delete" @click="deleteGuest(guest.id)">删除</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="filteredGuests.length === 0">
      <text class="empty-icon">👥</text>
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
            <view class="count-stepper">
              <button class="stepper-btn" @click="modalForm.count > 0 && modalForm.count--">-</button>
              <text class="stepper-value">{{ modalForm.count }}</text>
              <button class="stepper-btn" @click="modalForm.count++">+</button>
            </view>
          </view>
          <view class="form-group">
            <text class="form-label">饮食偏好</text>
            <picker mode="selector" :range="dietOptions" :value="modalForm.dietIndex" @change="onDietChange">
              <view class="picker-value">{{ dietOptions[modalForm.dietIndex] }}</view>
            </picker>
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
import { generateId, maskPhone, showSuccess } from '@/utils/index.js'

const store = useWeddingStore()
const userStore = useUserStore()

const showModal = ref(false)
const editingGuest = ref(null)
const currentFilter = ref('all')

const filterTabs = [
  { label: '全部', value: 'all' },
  { label: '出席', value: 'attending' },
  { label: '待定', value: 'uncertain' },
  { label: '缺席', value: 'declined' },
  { label: '未填', value: 'pending' }
]

const rsvpOptions = ['未填写', '出席', '待定', '缺席']
const rsvpValues = ['pending', 'attending', 'uncertain', 'declined']
const dietOptions = ['普通', '素食', '清真', '其他']
const dietValues = ['normal', 'vegetarian', 'halal', 'other']

const modalForm = ref({
  name: '',
  phone: '',
  statusIndex: 0,
  count: 1,
  dietIndex: 0
})

const guests = computed(() => store.guests?.guests || [])
const stats = computed(() => store.rsvpStats)

const filteredGuests = computed(() => {
  if (currentFilter.value === 'all') return guests.value
  return guests.value.filter(g => g.rsvp_status === currentFilter.value)
})

function statusText(status) {
  const map = { attending: '出席', uncertain: '待定', declined: '缺席', pending: '未填写' }
  return map[status] || status
}
function dietText(diet) {
  const map = { normal: '普通', vegetarian: '素食', halal: '清真', other: '其他' }
  return map[diet] || diet
}

function showAddModal() {
  editingGuest.value = null
  modalForm.value = { name: '', phone: '', statusIndex: 0, count: 1, dietIndex: 0 }
  showModal.value = true
}

function editGuest(guest) {
  editingGuest.value = guest
  modalForm.value = {
    name: guest.name,
    phone: guest.phone,
    statusIndex: rsvpValues.indexOf(guest.rsvp_status) || 0,
    count: guest.attending_count || 1,
    dietIndex: dietValues.indexOf(guest.diet_preference) || 0
  }
  showModal.value = true
}

function onStatusChange(e) {
  modalForm.value.statusIndex = e.detail.value
}
function onDietChange(e) {
  modalForm.value.dietIndex = e.detail.value
}

function saveGuest() {
  const guest = {
    id: editingGuest.value?.id || generateId(),
    name: modalForm.value.name,
    phone: modalForm.value.phone,
    rsvp_status: rsvpValues[modalForm.value.statusIndex],
    attending_count: modalForm.value.count,
    diet_preference: dietValues[modalForm.value.dietIndex],
    created_at: editingGuest.value?.created_at || Date.now(),
    updated_at: Date.now()
  }

  if (editingGuest.value) {
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
        store.guests.guests = store.guests.guests.filter(g => g.id !== id)
        saveToStorage()
        showSuccess('已删除')
      }
    }
  })
}

function saveToStorage() {
  const weddings = uni.getStorageSync('weddings') || {}
  if (weddings[userStore.weddingId]) {
    weddings[userStore.weddingId].guests = store.guests
    uni.setStorageSync('weddings', weddings)
  }
}

onShow(() => {
  // 加载
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 30rpx;
  padding-bottom: 140rpx;
}

/* 统计 */
.stats-card {
  background: $bg-surface;
  border-radius: 28rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: $shadow-sm;
  border: 2rpx solid rgba(212,168,83,0.08);
  animation: fadeInUp 0.6s $ease-out-back both;
}
.stats-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20rpx;
}
.stats-item {
  text-align: center;
}
.stats-num {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: $color-primary;
  margin-bottom: 6rpx;
}
.stats-label {
  font-size: 24rpx;
  color: $text-muted;
}
.stats-summary {
  text-align: center;
  font-size: 24rpx;
  color: $text-secondary;
  padding-top: 20rpx;
  border-top: 1rpx solid $border-light;
}

/* 筛选 */
.filter-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
  overflow-x: auto;
}
.filter-tab {
  padding: 12rpx 24rpx;
  border-radius: 10rpx;
  font-size: 26rpx;
  color: $text-secondary;
  background: $bg-surface;
  white-space: nowrap;
}
.filter-tab.active {
  background: $color-primary;
  color: #fff;
}

/* 宾客列表 */
.guest-list {
  margin-bottom: 30rpx;
}
.guest-card {
  background: $bg-surface;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: $shadow-sm;
  border: 2rpx solid rgba(212,168,83,0.08);
}
.guest-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}
.guest-name {
  font-size: 30rpx;
  font-weight: 500;
  color: $text-primary;
}
.guest-tags {
  display: flex;
  gap: 10rpx;
}
.tag {
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  font-size: 20rpx;
  background: $bg-muted;
  color: $text-secondary;
}
.tag.status-attending {
  background: rgba(82, 196, 26, 0.1);
  color: $rsvp-attending;
}
.tag.status-uncertain {
  background: rgba(250, 173, 20, 0.1);
  color: $rsvp-uncertain;
}
.tag.status-declined {
  background: rgba(153, 153, 153, 0.1);
  color: $rsvp-declined;
}
.tag.status-pending {
  background: rgba(24, 144, 255, 0.1);
  color: $rsvp-pending;
}
.tag.diet {
  background: rgba(196, 30, 58, 0.1);
  color: $color-primary;
}
.guest-phone {
  font-size: 24rpx;
  color: $text-muted;
}
.guest-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 12rpx;
}
.action-link {
  font-size: 24rpx;
  color: $color-info;
}
.action-link.delete {
  color: $color-error;
}

.empty-state {
  text-align: center;
  padding: 120rpx 60rpx;
}
.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
  filter: drop-shadow(0 4rpx 12rpx rgba(212,168,83,0.2));
}
.empty-text {
  font-size: 28rpx;
  color: $text-muted;
}

/* 添加按钮 */
.add-btn {
  position: fixed;
  bottom: calc(30rpx + constant(safe-area-inset-bottom));
  bottom: calc(30rpx + env(safe-area-inset-bottom));
  left: 30rpx;
  right: 30rpx;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  border-radius: 16rpx;
  background: linear-gradient(135deg, $color-primary 0%, #E91E63 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: $shadow-md;
}
.add-btn::after {
  border: none;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}
.modal-content {
  width: 100%;
  background: $bg-surface;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx;
  padding-bottom: calc(40rpx + constant(safe-area-inset-bottom));
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}
.modal-title {
  font-size: 34rpx;
  font-weight: 700;
}
.modal-close {
  font-size: 36rpx;
  color: $text-muted;
}

.form-group {
  margin-bottom: 24rpx;
}
.form-label {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  margin-bottom: 10rpx;
}
.form-input, .picker-value {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  border: 2rpx solid $border-light;
  border-radius: 10rpx;
  font-size: 28rpx;
  background: $bg-muted;
  box-sizing: border-box;
}
.picker-value {
  line-height: 80rpx;
}
.count-stepper {
  display: flex;
  align-items: center;
  gap: 30rpx;
}
.stepper-btn {
  width: 56rpx;
  height: 56rpx;
  line-height: 56rpx;
  text-align: center;
  border-radius: 50%;
  background: $bg-muted;
  font-size: 32rpx;
}
.stepper-btn::after {
  border: none;
}
.stepper-value {
  font-size: 36rpx;
  font-weight: 700;
  min-width: 50rpx;
  text-align: center;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}
.modal-btn {
  flex: 1;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
}
.modal-btn.primary {
  background: linear-gradient(135deg, $color-primary 0%, #E91E63 100%);
  color: #fff;
  box-shadow: $shadow-md;
}
.modal-btn.secondary {
  background: $bg-muted;
  color: $text-primary;
}
.modal-btn::after {
  border: none;
}
</style>
