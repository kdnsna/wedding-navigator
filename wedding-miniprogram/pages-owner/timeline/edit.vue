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
              <text class="event-badge muted" v-for="role in getEventRoles(event.assignee_ids)" :key="role.id">{{ role.name }}</text>
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
            <text class="form-label">适用角色</text>
            <view class="role-tags">
              <view
                class="role-tag"
                v-for="role in timelineRoles"
                :key="role.id"
                :class="{ active: modalForm.roleIds.includes(role.id) }"
                @click="toggleRole(role.id)"
              >
                <text>{{ role.name }}</text>
              </view>
            </view>
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
          <button class="modal-btn primary" :loading="saving" :disabled="saving" @click="saveEvent">确定</button>
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
import { generateId, showSuccess, showError } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { fetchWedding, updateWedding } from '@/composables/useCloud.js'
import { DEFAULT_TIMELINE_ROLES } from '@/utils/templates.js'

const store = useWeddingStore()
const userStore = useUserStore()

const showModal = ref(false)
const editingEvent = ref(null)
const saving = ref(false)
const refreshing = ref(false)

const modalForm = ref({ time: '', title: '', venueIndex: 0, notes: '', roleIds: ['guest'], isImportant: false })

const events = computed(() => store.timeline?.events || [])
const venues = computed(() => store.venues?.venues || [])
const venueNames = computed(() => ['无', ...venues.value.map(v => v.name)])
const timelineRoles = computed(() => store.timeline?.roles?.length ? store.timeline.roles : DEFAULT_TIMELINE_ROLES)

function getVenueName(venueId) {
  if (!venueId) return ''
  const v = venues.value.find(v => v.id === venueId)
  return v?.name || ''
}

function getEventRoles(roleIds = []) {
  if (!roleIds.length) return []
  return roleIds
    .map(id => timelineRoles.value.find(role => role.id === id))
    .filter(Boolean)
}

function showAddModal() {
  editingEvent.value = null
  modalForm.value = { time: '', title: '', venueIndex: 0, notes: '', roleIds: ['guest'], isImportant: false }
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
    roleIds: event.assignee_ids?.length ? [...event.assignee_ids] : ['guest'],
    isImportant: event.is_important || false
  }
  showModal.value = true
}

function onTimeChange(e) { modalForm.value.time = e.detail.value }
function onVenueChange(e) { modalForm.value.venueIndex = e.detail.value }
function toggleRole(roleId) {
  const ids = modalForm.value.roleIds
  const idx = ids.indexOf(roleId)
  if (idx >= 0) {
    if (ids.length > 1) ids.splice(idx, 1)
  } else {
    ids.push(roleId)
  }
}

async function saveEvent() {
  if (saving.value) return
  if (!modalForm.value.time) {
    showError('请选择时间')
    return
  }
  if (!modalForm.value.title.trim()) {
    showError('请输入事件名称')
    return
  }
  const previousTimeline = cloneTimeline()
  saving.value = true
  const venueId = modalForm.value.venueIndex > 0 ? venues.value[modalForm.value.venueIndex - 1]?.id : ''
  const event = {
    id: editingEvent.value?.id || generateId(),
    time: modalForm.value.time,
    title: modalForm.value.title.trim(),
    venue_id: venueId,
    notes: modalForm.value.notes.trim(),
    assignee_ids: modalForm.value.roleIds.length ? [...modalForm.value.roleIds] : ['guest'],
    is_important: modalForm.value.isImportant,
    sort_order: 0
  }
  try {
    if (!store.timeline) store.timeline = { events: [], roles: DEFAULT_TIMELINE_ROLES }
    if (!store.timeline.events) store.timeline.events = []
    if (!store.timeline.roles?.length) store.timeline.roles = DEFAULT_TIMELINE_ROLES
    if (editingEvent.value) {
      const idx = store.timeline.events.findIndex(e => e.id === editingEvent.value.id)
      if (idx >= 0) store.timeline.events[idx] = event
    } else {
      store.timeline.events.push(event)
    }
    sortTimelineEvents()
    await saveToStorage()
    showModal.value = false
    showSuccess('保存成功')
  } catch (err) {
    store.timeline = previousTimeline
    console.error('流程保存失败:', err)
    showError(err?.message || '保存失败，请重试')
  } finally {
    saving.value = false
  }
}

function deleteEvent(id) {
  uni.showModal({
    title: '确认删除',
    content: '确定删除该时间节点？',
    success: async (res) => {
      if (res.confirm) {
        const previousTimeline = cloneTimeline()
        try {
          if (store.timeline && Array.isArray(store.timeline.events)) {
            store.timeline.events = store.timeline.events.filter(e => e.id !== id)
          }
          await saveToStorage()
          showSuccess('已删除')
        } catch (err) {
          store.timeline = previousTimeline
          console.error('流程删除失败:', err)
          showError(err?.message || '删除失败，请重试')
        }
      }
    }
  })
}

async function saveToStorage() {
  if (!userStore.weddingId) {
    throw new Error('未找到婚礼信息，请重新进入')
  }
  if (!store.timeline) store.timeline = { events: [], roles: DEFAULT_TIMELINE_ROLES }
  if (!store.timeline.events) store.timeline.events = []
  if (!store.timeline.roles?.length) store.timeline.roles = DEFAULT_TIMELINE_ROLES
  try {
    // 先同步云端
    await updateWedding(userStore.weddingId, 'timelines', store.timeline)
  } catch (err) {
    console.error('timeline 云端保存失败:', err)
    throw new Error(err?.message || '云端同步失败')
  }
  // 再缓存本地（离线兜底）
  const weddings = uni.getStorageSync('weddings') || {}
  if (weddings[userStore.weddingId]) {
    weddings[userStore.weddingId].timeline = store.timeline
    uni.setStorageSync('weddings', weddings)
  }
}

function cloneTimeline() {
  const timelineData = store.timeline || { events: [], roles: DEFAULT_TIMELINE_ROLES }
  return JSON.parse(JSON.stringify({
    ...timelineData,
    events: timelineData.events || [],
    roles: timelineData.roles || DEFAULT_TIMELINE_ROLES
  }))
}

function sortTimelineEvents() {
  if (store.timeline?.events) {
    store.timeline.events.sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
  }
}

async function refreshTimeline() {
  if (!useOwnerGuard()) return
  if (!userStore.weddingId || refreshing.value) return
  refreshing.value = true
  try {
    await fetchWedding(userStore.weddingId, true)
  } catch (err) {
    console.error('流程刷新失败:', err)
    showError(err?.message || '流程刷新失败')
  } finally {
    refreshing.value = false
  }
}

onShow(refreshTimeline)
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
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
}

/* 时间轴 */
.timeline {
  padding: 0 $page-gutter;
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
  align-items: flex-start;
  gap: 12rpx;
  margin-bottom: 8rpx;
}
.event-title {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 600;
  color: $text-primary;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.event-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8rpx;
  max-width: 260rpx;
}
.event-badge {
  padding: 4rpx 10rpx;
  background: $bg-muted;
  color: $text-secondary;
  font-size: 18rpx;
  border-radius: 4rpx;
  font-weight: 500;
}
.event-badge.muted {
  background: #fff8f1;
  color: $color-primary;
}
.event-venue,
.event-notes {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 6rpx;
  word-break: break-word;
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
.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}
.role-tag {
  padding: 14rpx 22rpx;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-secondary;
  font-size: 24rpx;
}
.role-tag.active {
  background: $text-primary;
  color: #fff;
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
