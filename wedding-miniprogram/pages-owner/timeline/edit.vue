<template>
  <view class="page">
    <!-- 时间轴 -->
    <view class="timeline-list">
      <view class="timeline-item" v-for="(event, index) in events" :key="event.id">
        <view class="timeline-dot" />
        <view class="timeline-line" v-if="index < events.length - 1" />
        <view class="timeline-card">
          <view class="event-header">
            <text class="event-time">{{ event.time }}</text>
            <view class="event-actions">
              <text class="action-btn" @click="editEvent(event)">编辑</text>
              <text class="action-btn delete" @click="deleteEvent(event.id)">删除</text>
            </view>
          </view>
          <text class="event-title">{{ event.title }}</text>
          <text class="event-venue" v-if="getVenueName(event.venue_id)">
            📍 {{ getVenueName(event.venue_id) }}
          </text>
        </view>
      </view>
    </view>

    <!-- 添加按钮 -->
    <button class="add-btn" @click="showAddModal">
      <text>+ 添加时间节点</text>
    </button>

    <!-- 弹窗 -->
    <view class="modal-mask" v-if="showModal" @click="showModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingEvent ? '编辑节点' : '添加节点' }}</text>
          <text class="modal-close" @click="showModal = false">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">时间</text>
            <picker mode="time" :value="modalForm.time" @change="onTimeChange">
              <view class="picker-value">{{ modalForm.time || '请选择' }}</view>
            </picker>
          </view>
          <view class="form-group">
            <text class="form-label">事件名称</text>
            <input class="form-input" v-model="modalForm.title" placeholder="例如：接亲游戏开始" />
          </view>
          <view class="form-group">
            <text class="form-label">关联场地</text>
            <picker mode="selector" :range="venueNames" :value="modalForm.venueIndex" @change="onVenueChange">
              <view class="picker-value">{{ venueNames[modalForm.venueIndex] || '请选择' }}</view>
            </picker>
          </view>
          <view class="form-group">
            <text class="form-label">备注</text>
            <input class="form-input" v-model="modalForm.notes" placeholder="选填" />
          </view>
          <view class="form-group">
            <label class="checkbox-label">
              <checkbox :checked="modalForm.isImportant" @click="modalForm.isImportant = !modalForm.isImportant" />
              <text>重要节点</text>
            </label>
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn secondary" @click="showModal = false">取消</button>
          <button class="modal-btn primary" @click="saveEvent">确定</button>
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
const editingEvent = ref(null)

const modalForm = ref({
  time: '',
  title: '',
  venueIndex: 0,
  notes: '',
  isImportant: false
})

const events = computed(() => store.timeline?.events || [])
const venues = computed(() => store.venues?.venues || [])
const venueNames = computed(() => ['无', ...venues.value.map(v => v.name)])

function getVenueName(venueId) {
  if (!venueId) return ''
  const v = venues.value.find(v => v.id === venueId)
  return v?.name || ''
}

function showAddModal() {
  editingEvent.value = null
  modalForm.value = { time: '', title: '', venueIndex: 0, notes: '', isImportant: false }
  showModal.value = true
}

function editEvent(event) {
  editingEvent.value = event
  const venueIdx = venues.value.findIndex(v => v.id === event.venue_id)
  modalForm.value = {
    time: event.time,
    title: event.title,
    venueIndex: venueIdx >= 0 ? venueIdx + 1 : 0,
    notes: event.notes || '',
    isImportant: event.is_important || false
  }
  showModal.value = true
}

function onTimeChange(e) {
  modalForm.value.time = e.detail.value
}
function onVenueChange(e) {
  modalForm.value.venueIndex = e.detail.value
}

function saveEvent() {
  const venueId = modalForm.value.venueIndex > 0 ? venues.value[modalForm.value.venueIndex - 1]?.id : ''
  const event = {
    id: editingEvent.value?.id || generateId(),
    time: modalForm.value.time,
    title: modalForm.value.title,
    venue_id: venueId,
    notes: modalForm.value.notes,
    is_important: modalForm.value.isImportant,
    sort_order: 0
  }

  if (editingEvent.value) {
    const idx = store.timeline.events.findIndex(e => e.id === editingEvent.value.id)
    if (idx >= 0) store.timeline.events[idx] = event
  } else {
    store.addTimelineEvent(event)
  }

  saveToStorage()
  showModal.value = false
  showSuccess('保存成功')
}

function deleteEvent(id) {
  uni.showModal({
    title: '确认删除',
    content: '确定删除该时间节点？',
    success: (res) => {
      if (res.confirm) {
        store.timeline.events = store.timeline.events.filter(e => e.id !== id)
        saveToStorage()
        showSuccess('已删除')
      }
    }
  })
}

function saveToStorage() {
  const weddings = uni.getStorageSync('weddings') || {}
  if (weddings[userStore.weddingId]) {
    weddings[userStore.weddingId].timeline = store.timeline
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

.timeline-list {
  position: relative;
  padding-left: 40rpx;
}
.timeline-item {
  position: relative;
  padding-bottom: 30rpx;
}
.timeline-dot {
  position: absolute;
  left: -42rpx;
  top: 20rpx;
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: $color-gold;
  border: 4rpx solid $bg-surface;
  box-shadow: 0 0 0 4rpx rgba(212,168,83,0.15);
}
.timeline-line {
  position: absolute;
  left: -32rpx;
  top: 40rpx;
  width: 4rpx;
  height: calc(100% + 10rpx);
  background: $border-light;
}
.timeline-card {
  background: $bg-surface;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: $shadow-sm;
  border: 2rpx solid rgba(212,168,83,0.08);
}
.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}
.event-time {
  font-size: 32rpx;
  font-weight: 700;
  color: $color-primary;
}
.event-actions {
  display: flex;
  gap: 20rpx;
}
.action-btn {
  font-size: 24rpx;
  color: $color-info;
}
.action-btn.delete {
  color: $color-error;
}
.event-title {
  display: block;
  font-size: 28rpx;
  color: $text-primary;
  margin-bottom: 6rpx;
}
.event-venue {
  font-size: 24rpx;
  color: $text-secondary;
}

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
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 28rpx;
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
