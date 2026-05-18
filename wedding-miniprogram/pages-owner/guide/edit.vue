<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">VENUES</text>
      <text class="page-title">路书设置</text>
    </view>

    <!-- ===== 场地列表 ===== -->
    <view class="section-title">
      <text class="section-label">婚礼场地</text>
      <text class="section-hint">宾客可一键导航</text>
    </view>

    <view class="venue-list" v-if="venues.length > 0">
      <view class="venue-item" v-for="venue in venues" :key="venue.id">
        <view class="venue-meta">
          <text class="venue-type">{{ typeLabel(venue.type) }}</text>
          <text class="venue-time" v-if="venue.arrival_time">{{ venue.arrival_time }}</text>
        </view>
        <text class="venue-name">{{ venue.name }}</text>
        <text class="venue-address">{{ venue.address }}</text>
        <text class="venue-geo" :class="{ missing: !hasCoordinate(venue) }">
          {{ hasCoordinate(venue) ? '已匹配地图和天气' : '未匹配地图坐标' }}
        </text>
        <view class="venue-actions">
          <text class="venue-action" @click="editVenue(venue)">编辑</text>
          <text class="venue-action delete" @click="deleteVenue(venue.id)">删除</text>
        </view>
      </view>
    </view>

    <view class="empty-state" v-if="venues.length === 0">
      <image class="empty-visual" src="/static/visuals/empty-venue.svg" mode="aspectFit" />
      <text class="empty-text">还没有添加场地</text>
    </view>

    <button class="add-btn secondary" @click="showAddModal">
      <text>+ 添加场地</text>
    </button>

    <!-- ===== 交通指引 ===== -->
    <view class="section-title">
      <text class="section-label">交通指引</text>
      <text class="section-hint">帮助外地宾客出行</text>
    </view>

    <view class="info-section">
      <view class="info-row" @click="editTransportation">
        <view class="info-meta">
          <text class="info-row-label">出行方式</text>
          <text class="info-row-value">{{ transportation.transport || '点击设置' }}</text>
        </view>
        <text class="info-arrow">›</text>
      </view>
      <view class="info-divider" />
      <view class="info-row" @click="editTransportation">
        <view class="info-meta">
          <text class="info-row-label">停车信息</text>
          <text class="info-row-value">{{ transportation.parking || '点击设置' }}</text>
        </view>
        <text class="info-arrow">›</text>
      </view>
    </view>

    <!-- ===== 推荐住宿 ===== -->
    <view class="section-title">
      <text class="section-label">推荐住宿</text>
      <text class="section-hint">附近酒店推荐给宾客</text>
    </view>

    <view class="hotel-list" v-if="accommodations.length > 0">
      <view class="hotel-item" v-for="hotel in accommodations" :key="hotel.id">
        <view class="hotel-info">
          <text class="hotel-name">{{ hotel.name }}</text>
          <view class="hotel-tags">
            <text class="hotel-tag" v-if="hotel.distance">{{ hotel.distance }}</text>
            <text class="hotel-tag" v-if="hotel.price_range">{{ hotel.price_range }}</text>
          </view>
          <view class="hotel-phone" v-if="hotel.phone" @click="callHotel(hotel.phone)">
            <image class="visual-icon-xs hotel-phone-icon" src="/static/visuals/icon-phone.svg" mode="aspectFit" />
            <text>{{ hotel.phone }}</text>
          </view>
        </view>
        <view class="hotel-actions">
          <text class="venue-action" @click="editHotel(hotel)">编辑</text>
          <text class="venue-action delete" @click="deleteHotel(hotel.id)">删除</text>
        </view>
      </view>
    </view>

    <view class="empty-state" v-if="accommodations.length === 0">
      <image class="empty-visual" src="/static/visuals/empty-hotel.svg" mode="aspectFit" />
      <text class="empty-text">还没有添加推荐住宿</text>
    </view>

    <button class="add-btn secondary" @click="showHotelModal">
      <text>+ 添加住宿</text>
    </button>

    <!-- 底部占位 -->
    <view style="height: 160rpx" />

    <!-- ===== 场地弹窗 ===== -->
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
          <view class="geo-box">
            <view class="geo-meta">
              <text class="geo-title">地图与天气匹配</text>
              <text class="geo-desc">{{ geoStatusText }}</text>
            </view>
            <view class="geo-actions">
              <button class="geo-btn" :loading="geocoding" :disabled="geocoding" @click="autoMatchLocation">自动匹配</button>
              <button class="geo-btn primary" :disabled="geocoding" @click="chooseVenueLocation">地图选点</button>
            </view>
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

    <!-- ===== 交通指引弹窗 ===== -->
    <view class="modal-mask" v-if="showTransportModal" @click="showTransportModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">交通指引</text>
          <text class="modal-close" @click="showTransportModal = false">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">出行方式</text>
            <input class="form-input" v-model="transportForm.transport" placeholder="如：高铁至南京南站，换乘地铁2号线" />
          </view>
          <view class="form-group">
            <text class="form-label">停车信息</text>
            <textarea class="form-textarea" v-model="transportForm.parking" placeholder="如：酒店地下停车场，宾客免费停车" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn secondary" @click="showTransportModal = false">取消</button>
          <button class="modal-btn primary" @click="saveTransportation">确定</button>
        </view>
      </view>
    </view>

    <!-- ===== 住宿弹窗 ===== -->
    <view class="modal-mask" v-if="showHotelM" @click="showHotelM = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingHotel ? '编辑住宿' : '添加住宿' }}</text>
          <text class="modal-close" @click="showHotelM = false">✕</text>
        </view>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">酒店名称</text>
            <input class="form-input" v-model="hotelForm.name" placeholder="例如：金陵饭店" />
          </view>
          <view class="form-group">
            <text class="form-label">距离场地</text>
            <input class="form-input" v-model="hotelForm.distance" placeholder="例如：距仪式场地 800 米" />
          </view>
          <view class="form-group">
            <text class="form-label">价格区间</text>
            <input class="form-input" v-model="hotelForm.price_range" placeholder="例如：400-600元/晚" />
          </view>
          <view class="form-group">
            <text class="form-label">预订电话</text>
            <input class="form-input" v-model="hotelForm.phone" placeholder="选填" type="number" />
          </view>
          <view class="form-group">
            <text class="form-label">备注</text>
            <input class="form-input" v-model="hotelForm.notes" placeholder="选填，如：协议价，订房报新人名字" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn secondary" @click="showHotelM = false">取消</button>
          <button class="modal-btn primary" @click="saveHotel">确定</button>
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
import { generateId, showError, showSuccess } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { geocodeVenue, updateWedding } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()

// ========== 场地 ==========
const showModal = ref(false)
const editingVenue = ref(null)
const venueTypes = ['家', '酒店', '场地', '住宿', '摄影点']
const typeMap = { '家': 'home', '酒店': 'hotel', '场地': 'venue', '住宿': 'hotel_guest', '摄影点': 'photo' }
const typeReverseMap = { 'home': 0, 'hotel': 1, 'venue': 2, 'hotel_guest': 3, 'photo': 4 }
const modalForm = ref({ name: '', typeIndex: 2, address: '', arrivalTime: '', phone: '', coordinate: null })
const geocoding = ref(false)

const venues = computed(() => store.venues?.venues || [])
const geoStatusText = computed(() => {
  const coord = modalForm.value.coordinate
  if (coord?.latitude && coord?.longitude) {
    return `已匹配 ${Number(coord.latitude).toFixed(5)}, ${Number(coord.longitude).toFixed(5)}`
  }
  return '保存时会按场地名称和详细地址自动匹配；也可以手动地图选点'
})

function typeLabel(type) {
  const map = { home: '家', hotel: '酒店', venue: '场地', hotel_guest: '住宿', photo: '摄影' }
  return map[type] || '场地'
}

function hasCoordinate(venue) {
  return Boolean(venue?.coordinate?.latitude && venue?.coordinate?.longitude)
}

function showAddModal() {
  editingVenue.value = null
  modalForm.value = { name: '', typeIndex: 2, address: '', arrivalTime: '', phone: '', coordinate: null }
  showModal.value = true
}

function editVenue(venue) {
  editingVenue.value = venue
  modalForm.value = {
    name: venue.name,
    typeIndex: typeReverseMap[venue.type] || 2,
    address: venue.address,
    arrivalTime: venue.arrival_time || '',
    phone: venue.contact_phone || '',
    coordinate: venue.coordinate || null
  }
  showModal.value = true
}

function onTypeChange(e) { modalForm.value.typeIndex = e.detail.value }
function onArrivalTimeChange(e) { modalForm.value.arrivalTime = e.detail.value }

async function autoMatchLocation(options = {}) {
  const { silent = false } = options
  if (!modalForm.value.name.trim() && !modalForm.value.address.trim()) {
    if (!silent) showError('请先填写场地名称或地址')
    return null
  }
  try {
    geocoding.value = true
    const res = await geocodeVenue({
      name: modalForm.value.name.trim(),
      address: modalForm.value.address.trim()
    })
    if (res?.data?.latitude && res?.data?.longitude) {
      modalForm.value.coordinate = normalizeCoordinate(res.data)
      if (res.data.address && !modalForm.value.address.trim()) {
        modalForm.value.address = res.data.address
      }
      if (!silent) showSuccess('已匹配地图坐标')
      return modalForm.value.coordinate
    }
    if (!silent) showError(res?.message || '未匹配到地图坐标')
  } catch (err) {
    if (!silent) showError(err.message || '地图匹配失败')
  } finally {
    geocoding.value = false
  }
  return null
}

function chooseVenueLocation() {
  const api = (typeof wx !== 'undefined' && wx.chooseLocation) ? wx : uni
  const keyword = modalForm.value.address || modalForm.value.name
  api.chooseLocation({
    keyword,
    success: (res) => {
      modalForm.value.name = modalForm.value.name || res.name || ''
      modalForm.value.address = res.address || modalForm.value.address || res.name || ''
      modalForm.value.coordinate = normalizeCoordinate({
        latitude: res.latitude,
        longitude: res.longitude,
        title: res.name,
        address: res.address,
        source: 'manual-choose-location',
        matched_at: Date.now()
      })
      showSuccess('已选择地图位置')
    },
    fail: (err) => {
      if (!String(err?.errMsg || '').includes('cancel')) {
        showError('地图选点失败，请检查定位权限')
      }
    }
  })
}

async function saveVenue() {
  if (!modalForm.value.name.trim()) {
    uni.showToast({ title: '请输入场地名称', icon: 'none' })
    return
  }
  if (shouldResolveCoordinate()) {
    await autoMatchLocation({ silent: true })
  }
  const venue = {
    id: editingVenue.value?.id || generateId(),
    name: modalForm.value.name,
    type: typeMap[venueTypes[modalForm.value.typeIndex]],
    address: modalForm.value.address,
    arrival_time: modalForm.value.arrivalTime,
    contact_phone: modalForm.value.phone,
    coordinate: modalForm.value.coordinate || null
  }
  if (editingVenue.value) {
    if (!store.venues) store.venues = { venues: [], transportation: {}, accommodations: [] }
    if (!store.venues.venues) store.venues.venues = []
    const idx = store.venues.venues.findIndex(v => v.id === editingVenue.value.id)
    if (idx >= 0) store.venues.venues[idx] = venue
  } else {
    store.addVenue(venue)
  }
  await saveToStorage()
  showModal.value = false
  showSuccess(venue.coordinate ? '保存成功，已匹配地图' : '保存成功，请稍后补充地图坐标')
}

function shouldResolveCoordinate() {
  const current = modalForm.value.coordinate
  if (!current?.latitude || !current?.longitude) return true
  if (!editingVenue.value) return false
  return modalForm.value.name !== editingVenue.value.name || modalForm.value.address !== editingVenue.value.address
}

function normalizeCoordinate(coord) {
  const latitude = Number(coord?.latitude)
  const longitude = Number(coord?.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return {
    latitude,
    longitude,
    title: coord.title || modalForm.value.name,
    address: coord.address || modalForm.value.address,
    source: coord.source || 'unknown',
    matched_at: coord.matched_at || Date.now()
  }
}

function deleteVenue(id) {
  uni.showModal({
    title: '确认删除',
    content: '确定删除该场地？',
    success: (res) => {
      if (res.confirm) {
        if (store.venues && Array.isArray(store.venues.venues)) {
          store.venues.venues = store.venues.venues.filter(v => v.id !== id)
        }
        saveToStorage()
        showSuccess('已删除')
      }
    }
  })
}

// ========== 交通指引 ==========
const showTransportModal = ref(false)
const transportForm = ref({ transport: '', parking: '' })

const transportation = computed(() => store.venues?.transportation || {})

function editTransportation() {
  transportForm.value = {
    transport: transportation.value.transport || '',
    parking: transportation.value.parking || ''
  }
  showTransportModal.value = true
}

function saveTransportation() {
  if (!store.venues) store.venues = { venues: [], transportation: {}, accommodations: [] }
  store.venues.transportation = { ...transportForm.value }
  saveToStorage()
  showTransportModal.value = false
  showSuccess('保存成功')
}

// ========== 住宿 ==========
const showHotelM = ref(false)
const editingHotel = ref(null)
const hotelForm = ref({ name: '', distance: '', price_range: '', phone: '', notes: '' })

const accommodations = computed(() => store.venues?.accommodations || [])

function showHotelModal() {
  editingHotel.value = null
  hotelForm.value = { name: '', distance: '', price_range: '', phone: '', notes: '' }
  showHotelM.value = true
}

function editHotel(hotel) {
  editingHotel.value = hotel
  hotelForm.value = {
    name: hotel.name,
    distance: hotel.distance || '',
    price_range: hotel.price_range || '',
    phone: hotel.phone || '',
    notes: hotel.notes || ''
  }
  showHotelM.value = true
}

function saveHotel() {
  if (!hotelForm.value.name.trim()) {
    uni.showToast({ title: '请输入酒店名称', icon: 'none' })
    return
  }
  const hotel = {
    id: editingHotel.value?.id || generateId(),
    name: hotelForm.value.name,
    distance: hotelForm.value.distance,
    price_range: hotelForm.value.price_range,
    phone: hotelForm.value.phone,
    notes: hotelForm.value.notes
  }
  if (editingHotel.value) {
    if (!store.venues) store.venues = { venues: [], transportation: {}, accommodations: [] }
    if (!store.venues.accommodations) store.venues.accommodations = []
    const idx = store.venues.accommodations.findIndex(h => h.id === editingHotel.value.id)
    if (idx >= 0) store.venues.accommodations[idx] = hotel
  } else {
    if (!store.venues) store.venues = { venues: [], transportation: {}, accommodations: [] }
    if (!store.venues.accommodations) store.venues.accommodations = []
    store.venues.accommodations.push(hotel)
  }
  saveToStorage()
  showHotelM.value = false
  showSuccess('保存成功')
}

function deleteHotel(id) {
  uni.showModal({
    title: '确认删除',
    content: '确定删除该住宿？',
    success: (res) => {
      if (res.confirm) {
        if (store.venues && Array.isArray(store.venues.accommodations)) {
          store.venues.accommodations = store.venues.accommodations.filter(h => h.id !== id)
        }
        saveToStorage()
        showSuccess('已删除')
      }
    }
  })
}

function callHotel(phone) {
  if (phone) {
    uni.makePhoneCall({ phoneNumber: String(phone) })
  }
}

// ========== 数据持久化 ==========
async function saveToStorage() {
  if (!userStore.weddingId) {
    uni.showToast({ title: '未找到婚礼信息，请重新进入', icon: 'none' })
    return
  }
  if (!store.venues) {
    store.venues = { venues: [], transportation: {}, accommodations: [] }
  }
  try {
    await updateWedding(userStore.weddingId, 'venues', store.venues)
  } catch (err) {
    console.error(' venues 云端保存失败:', err)
    uni.showToast({ title: '云端同步失败', icon: 'none' })
  }
  // 再缓存本地（离线兜底）
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
  padding-bottom: 80rpx;
}

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

/* 分组标题 */
.section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 40rpx 48rpx 20rpx;
}
.section-label {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-primary;
}
.section-hint {
  font-size: 22rpx;
  color: $text-muted;
}

/* 场地列表 */
.venue-list, .hotel-list {
  padding: 0 48rpx;
}
.venue-item, .hotel-item {
  padding: 28rpx 0;
  border-bottom: 1rpx solid $border-color;
}
.venue-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 8rpx;
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
}
.venue-name, .hotel-name {
  display: block;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
  margin-bottom: 6rpx;
}
.venue-address {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  margin-bottom: 8rpx;
}
.venue-geo {
  display: inline-block;
  margin-bottom: 12rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  background: rgba(52,168,83,0.08);
  color: $color-success;
  font-size: 20rpx;
}
.venue-geo.missing {
  background: rgba(249,171,0,0.12);
  color: #A66A00;
}
.venue-actions, .hotel-actions {
  display: flex;
  gap: 24rpx;
}
.venue-action {
  font-size: 24rpx;
  color: $text-secondary;
}
.venue-action.delete {
  color: $color-error;
}

/* 住宿 */
.hotel-tags {
  display: flex;
  gap: 12rpx;
  margin: 6rpx 0;
}
.hotel-tag {
  font-size: 20rpx;
  color: $text-secondary;
  background: $bg-muted;
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
}
.hotel-phone {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  color: $color-primary;
}
.hotel-phone-icon {
  width: 24rpx;
  height: 24rpx;
}

/* 信息列表 */
.info-section {
  margin: 0 48rpx;
  background: $bg-surface;
  border-radius: $radius-lg;
  border: 1rpx solid $border-color;
  overflow: hidden;
}
.info-row {
  display: flex;
  align-items: center;
  padding: 32rpx;
}
.info-row-label {
  display: block;
  font-size: 26rpx;
  color: $text-primary;
  font-weight: 500;
  margin-bottom: 4rpx;
}
.info-row-value {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  max-width: 480rpx;
}
.info-arrow {
  font-size: 28rpx;
  color: $text-muted;
  margin-left: auto;
}
.info-divider {
  height: 1rpx;
  background: $border-color;
  margin: 0 32rpx;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40rpx 0;
}
.empty-visual {
  display: block;
  width: 220rpx;
  height: 220rpx;
  margin: 0 auto 24rpx;
}
.empty-text {
  font-size: 26rpx;
  color: $text-muted;
}

/* 添加按钮 */
.add-btn {
  margin: 24rpx 48rpx 0;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: $radius-full;
  font-size: 28rpx;
  font-weight: 500;
  border: 2rpx dashed $border-color;
  background: transparent;
  color: $text-secondary;
  transition: all 0.2s ease;
}
.add-btn.secondary {
  border: 2rpx dashed $border-color;
}
.add-btn::after { border: none; }
.add-btn:active { background: $bg-muted; }

/* 弹窗 */
.modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
}
.modal-content {
  width: 100%;
  background: $bg-surface;
  border-radius: 32rpx 32rpx 0 0;
  max-height: 85vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36rpx 48rpx 24rpx;
  border-bottom: 1rpx solid $border-color;
  position: sticky;
  top: 0;
  background: $bg-surface;
}
.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
}
.modal-close {
  font-size: 32rpx;
  color: $text-muted;
  padding: 8rpx;
}
.modal-body {
  padding: 32rpx 48rpx;
}
.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 48rpx calc(48rpx + env(safe-area-inset-bottom));
}
.modal-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: $radius-full;
  font-size: 30rpx;
  font-weight: 500;
  transition: all 0.2s ease;
}
.modal-btn::after { border: none; }
.modal-btn.secondary {
  background: $bg-muted;
  color: $text-primary;
}
.modal-btn.primary {
  background: $text-primary;
  color: #fff;
}
.modal-btn:active { transform: scale(0.98); opacity: 0.85; }

.geo-box {
  margin: -8rpx 0 28rpx;
  padding: 24rpx;
  border-radius: $radius-lg;
  border: 1rpx solid $border-color;
  background: $bg-elevated;
}
.geo-title {
  display: block;
  font-size: 26rpx;
  color: $text-primary;
  font-weight: 500;
  margin-bottom: 6rpx;
}
.geo-desc {
  display: block;
  font-size: 22rpx;
  color: $text-secondary;
  line-height: 1.45;
}
.geo-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}
.geo-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-primary;
  font-size: 24rpx;
}
.geo-btn.primary {
  background: $text-primary;
  color: #fff;
}
.geo-btn::after { border: none; }
.geo-btn[disabled] {
  opacity: 0.62;
}

/* 表单 */
.form-group {
  margin-bottom: 28rpx;
}
.form-label {
  display: block;
  font-size: 24rpx;
  color: $text-muted;
  margin-bottom: 12rpx;
  letter-spacing: 2rpx;
}
.form-input {
  height: 88rpx;
  font-size: 28rpx;
  color: $text-primary;
  border-bottom: 2rpx solid $border-color;
}
.form-textarea {
  width: 100%;
  height: 160rpx;
  font-size: 28rpx;
  color: $text-primary;
  border-bottom: 2rpx solid $border-color;
  line-height: 1.6;
}
.picker-value {
  height: 88rpx;
  font-size: 28rpx;
  color: $text-primary;
  border-bottom: 2rpx solid $border-color;
  display: flex;
  align-items: center;
}
</style>
