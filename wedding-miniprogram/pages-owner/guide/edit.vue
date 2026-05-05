<template>
  <view class="page">
    <!-- 场地列表 -->
    <view class="venue-list">
      <view class="venue-card" v-for="venue in venues" :key="venue.id">
        <view class="venue-info">
          <text class="venue-name">{{ venue.name }}</text>
          <text class="venue-address">{{ venue.address }}</text>
          <text class="venue-time" v-if="venue.arrival_time">⏰ {{ venue.arrival_time }}</text>
        </view>
        <view class="venue-actions">
          <text class="edit-btn" @click="editVenue(venue)">编辑</text>
          <text class="delete-btn" @click="deleteVenue(venue.id)">删除</text>
        </view>
      </view>
    </view>

    <!-- 添加场地按钮 -->
    <button class="add-btn" @click="showAddModal">
      <text>+ 添加场地</text>
    </button>

    <!-- 添加/编辑弹窗 -->
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

const store = useWeddingStore()
const userStore = useUserStore()

const showModal = ref(false)
const editingVenue = ref(null)

const venueTypes = ['家', '酒店', '场地', '住宿', '摄影点']
const typeMap = { '家': 'home', '酒店': 'hotel', '场地': 'venue', '住宿': 'hotel_guest', '摄影点': 'photo' }
const typeReverseMap = { 'home': 0, 'hotel': 1, 'venue': 2, 'hotel_guest': 3, 'photo': 4 }

const modalForm = ref({
  name: '',
  typeIndex: 2,
  address: '',
  arrivalTime: '',
  phone: ''
})

const venues = computed(() => store.venues?.venues || [])

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

function onTypeChange(e) {
  modalForm.value.typeIndex = e.detail.value
}
function onArrivalTimeChange(e) {
  modalForm.value.arrivalTime = e.detail.value
}

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

onShow(() => {
  // 加载数据
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 30rpx;
  padding-bottom: 140rpx;
}

.venue-list {
  margin-bottom: 30rpx;
}
.venue-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: $bg-surface;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: $shadow-sm;
}
.venue-info {
  flex: 1;
}
.venue-name {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 8rpx;
}
.venue-address {
  display: block;
  font-size: 26rpx;
  color: $text-secondary;
  margin-bottom: 6rpx;
}
.venue-time {
  font-size: 24rpx;
  color: $color-primary;
}
.venue-actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.edit-btn, .delete-btn {
  font-size: 26rpx;
  padding: 8rpx 16rpx;
}
.edit-btn {
  color: $color-info;
}
.delete-btn {
  color: $color-error;
}

.add-btn {
  position: fixed;
  bottom: calc(30rpx + constant(safe-area-inset-bottom));
  bottom: calc(30rpx + env(safe-area-inset-bottom));
  left: 30rpx;
  right: 30rpx;
  height: 90rpx;
  line-height: 90rpx;
  text-align: center;
  border-radius: 16rpx;
  background: linear-gradient(135deg, $color-primary 0%, #E91E63 100%);
  color: #fff;
  font-size: 30rpx;
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
.form-input {
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
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  padding: 0 20rpx;
  border: 2rpx solid $border-light;
  border-radius: 10rpx;
  font-size: 28rpx;
  background: $bg-muted;
  box-sizing: border-box;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}
.modal-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 12rpx;
  font-size: 30rpx;
}
.modal-btn.primary {
  background: linear-gradient(135deg, $color-primary 0%, #E91E63 100%);
  color: #fff;
}
.modal-btn.secondary {
  background: $bg-muted;
  color: $text-primary;
}
.modal-btn::after {
  border: none;
}
</style>
