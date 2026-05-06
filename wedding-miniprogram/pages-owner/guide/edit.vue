<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">VENUES</text>
      <text class="page-title">路书设置</text>
    </view>

    <!-- 场地列表 -->
    <view class="venue-list" v-if="venues.length > 0">
      <view class="venue-item" v-for="venue in venues" :key="venue.id">
        <view class="venue-meta">
          <text class="venue-type">{{ typeLabel(venue.type) }}</text>
          <text class="venue-time" v-if="venue.arrival_time">{{ venue.arrival_time }}</text>
        </view>
        <text class="venue-name">{{ venue.name }}</text>
        <text class="venue-address">{{ venue.address }}</text>
        <view class="venue-actions">
          <text class="venue-action" @click="editVenue(venue)">编辑</text>
          <text class="venue-action delete" @click="deleteVenue(venue.id)">删除</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="venues.length === 0">
      <image class="empty-visual empty-icon" src="/static/visuals/empty-guide.png" mode="aspectFit" />
      <text class="empty-text">还没有添加场地</text>
    </view>

    <!-- 添加按钮 -->
    <button class="add-btn" @click="showAddModal">
      <text>+ 添加场地</text>
    </button>

    <!-- 弹窗 -->
    <view class="modal-mask" v-if="showModal" @click="showModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingVenue ? '编辑场地' : '添加场地' }}</text>
          <text class="modal-close" @click="showModal = false">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">场地名称</text>
            <input class="form-input" v-model="modalForm.name" placeholder="例如：华丽大酒楼" />
          </view>
          <view class="form-group">
            <text class="form-label">场地类型</text>
            <picker mode="selector" :range="venueTypes" :value="modalForm.typeIndex" @change="onTypeChange">
              <view class="picker-value">{{ venueTypes[modalForm.typeIndex] }}</view>
            </picker>
          </view>
          <view class="form-group">
            <text class="form-label">详细地址</text>
            <input class="form-input" v-model="modalForm.address" placeholder="请输入地址" />
          </view>
          <view class="form-group">
            <text class="form-label">到达时间</text>
            <picker mode="time" :value="modalForm.arrivalTime" @change="onArrivalTimeChange">
              <view class="picker-value">{{ modalForm.arrivalTime || '请选择' }}</view>
            </picker>
          </view>
          <view class="form-group">
            <text class="form-label">联系电话</text>
            <input class="form-input" v-model="modalForm.phone" placeholder="选填" type="number" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn secondary" @click="showModal = false">取消</button>
          <button class="modal-btn primary" @click="saveVenue">确定</button>
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

const store = useWeddingStore()
const userStore = useUserStore()

const showModal = ref(false)
const editingVenue = ref(null)

const venueTypes = ['家', '酒店', '场地', '住宿', '摄影点']
const typeMap = { '家': 'home', '酒店': 'hotel', '场地': 'venue', '住宿': 'hotel_guest', '摄影点': 'photo' }
const typeReverseMap = { 'home': 0, 'hotel': 1, 'venue': 2, 'hotel_guest': 3, 'photo': 4 }

const modalForm = ref({ name: '', typeIndex: 2, address: '', arrivalTime: '', phone: '' })

const venues = computed(() => store.venues?.venues || [])

function typeLabel(type) {
  const map = { home: '家', hotel: '酒店', venue: '场地', hotel_guest: '住宿', photo: '摄影' }
  return map[type] || '场地'
}

function showAddModal() {
  editingVenue.value = null
  modalForm.value = { name: '', typeIndex: 2, address: '', arrivalTime: '', phone: '' }
  showModal.value = true
}

function editVenue(venue) {
  editingVenue.value = venue
  modalForm.value = {
    name: venue.name,
    typeIndex: typeReverseMap[venue.type] || 2,
    address: venue.address,
    arrivalTime: venue.arrival_time || '',
    phone: venue.contact_phone || ''
  }
  showModal.value = true
}

function onTypeChange(e) { modalForm.value.typeIndex = e.detail.value }
function onArrivalTimeChange(e) { modalForm.value.arrivalTime = e.detail.value }

function saveVenue() {
  const venue = {
    id: editingVenue.value?.id || generateId(),
    name: modalForm.value.name,
    type: typeMap[venueTypes[modalForm.value.typeIndex]],
    address: modalForm.value.address,
    arrival_time: modalForm.value.arrivalTime,
    contact_phone: modalForm.value.phone,
    coordinate: editingVenue.value?.coordinate || null
  }
  if (editingVenue.value) {
    const idx = store.venues.venues.findIndex(v => v.id === editingVenue.value.id)
    if (idx >= 0) store.venues.venues[idx] = venue
  } else {
    store.addVenue(venue)
  }
  saveToStorage()
  showModal.value = false
  showSuccess('保存成功')
}

function deleteVenue(id) {
  uni.showModal({
    title: '确认删除',
    content: '确定删除该场地？',
    success: (res) => {
      if (res.confirm) {
        store.venues.venues = store.venues.venues.filter(v => v.id !== id)
        saveToStorage()
        showSuccess('已删除')
      }
    }
  })
}

function saveToStorage() {
  const weddings = uni.getStorageSync('weddings') || {}
  if (weddings[userStore.weddingId]) {
    weddings[userStore.weddingId].venues = store.venues
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
}

/* 场地列表 */
.venue-list {
  padding: 0 48rpx;
}
.venue-item {
  padding: 32rpx 0;
  border-bottom: 1rpx solid $border-color;
}
.venue-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}
.venue-type {
  padding: 4rpx 12rpx;
  background: $bg-muted;
  color: $text-secondary;
  font-size: 20rpx;
  border-radius: 6rpx;
  font-weight: 500;
}
.venue-time {
  font-size: 22rpx;
  color: $text-muted;
  font-weight: 500;
}
.venue-name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 8rpx;
}
.venue-address {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  margin-bottom: 16rpx;
}
.venue-actions {
  display: flex;
  gap: 24rpx;
}
.venue-action {
  font-size: 26rpx;
  color: $text-secondary;
}
.venue-action.delete {
  color: $color-error;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 150rpx 60rpx;
}
.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
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
