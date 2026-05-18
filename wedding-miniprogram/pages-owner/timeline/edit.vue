<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">TIMELINE</text>
      <text class="page-title">流程编辑</text>
    </view>

    <!-- 时间轴 -->
    <view class="timeline" v-if="events.length > 0">
      <view class="timeline-item" v-for="(event, index) in events" :key="event.id">
        <view class="timeline-left">
          <text class="timeline-time">{{ event.time }}</text>
          <view class="timeline-dot" />
          <view class="timeline-line" v-if="index < events.length - 1" />
        </view>
        <view class="timeline-card">
          <view class="event-header">
            <text class="event-title">{{ event.title }}</text>
            <view class="event-badges">
              <text class="event-badge" v-if="event.is_important">重点</text>
            </view>
          </view>
          <text class="event-venue" v-if="getVenueName(event.venue_id)">
            {{ getVenueName(event.venue_id) }}
          </text>
          <text class="event-notes" v-if="event.notes">{{ event.notes }}</text>
          <view class="event-actions">
            <text class="event-action" @click="editEvent(event)">编辑</text>
            <text class="event-action delete" @click="deleteEvent(event.id)">删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="events.length === 0">
      <image class="empty-visual empty-icon" src="/static/visuals/empty-timeline.svg" mode="aspectFit" />
      <text class="empty-text">还没有添加时间节点</text>
    </view>

    <!-- 添加按钮 -->
    <button class="add-btn" @click="showAddModal">
      <text>+ 添加节点</text>
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
            <input class="form-input" v-model="modalForm.title" placeholder="例如：接亲游戏" />
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
              <checkbox :checked="modalForm.isImportant" @click="modalForm.isImportant = !modalForm.isImportant" color="#1A1A1A" />
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
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { updateWedding } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()

const showModal = ref(false)
const editingEvent = ref(null)

const modalForm = ref({ time: '', title: '', venueIndex: 0, notes: '', isImportant: false })

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

function onTimeChange(e) { modalForm.value.time = e.detail.value }
function onVenueChange(e) { modalForm.value.venueIndex = e.detail.value }

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
    if (!store.timeline) store.timeline = { events: [] }
    if (!store.timeline.events) store.timeline.events = []
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
        if (store.timeline && Array.isArray(store.timeline.events)) {
          store.timeline.events = store.timeline.events.filter(e => e.id !== id)
        }
        saveToStorage()
        showSuccess('已删除')
      }
    }
  })
}

async function saveToStorage() {
  try {
    // 先同步云端
    await updateWedding(userStore.weddingId, 'timelines', store.timeline)
  } catch (err) {
    console.error('timeline 云端保存失败:', err)
    uni.showToast({ title: '云端同步失败', icon: 'none' })
  }
  // 再缓存本地（离线兜底）
  const weddings = uni.getStorageSync('weddings') || {}
  if (weddings[userStore.weddingId]) {
    weddings[userStore.weddingId].timeline = store.timeline
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

/* 时间轴 */
.timeline {
  padding: 0 48rpx;
}
.timeline-item {
  display: flex;
  gap: 32rpx;
  padding-bottom: 32rpx;
}

.timeline-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80rpx;
  flex-shrink: 0;
  position: relative;
}
.timeline-time {
  font-size: 24rpx;
  color: $text-muted;
  font-weight: 500;
  margin-bottom: 8rpx;
  font-variant-numeric: tabular-nums;
}
.timeline-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: $border-color;
  position: relative;
  z-index: 2;
}
.timeline-line {
  position: absolute;
  top: 40rpx;
  bottom: 0;
  width: 1rpx;
  background: $border-color;
}

.timeline-card {
  flex: 1;
  padding: 24rpx 0;
  border-bottom: 1rpx solid $border-color;
}
.event-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}
.event-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-primary;
}
.event-badge {
  padding: 4rpx 10rpx;
  background: $bg-muted;
  color: $text-secondary;
  font-size: 18rpx;
  border-radius: 4rpx;
  font-weight: 500;
}
.event-venue,
.event-notes {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 6rpx;
}
.event-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 16rpx;
}
.event-action {
  font-size: 24rpx;
  color: $text-secondary;
}
.event-action.delete {
  color: $color-error;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 150rpx 60rpx;
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
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 28rpx;
  color: $text-primary;
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
