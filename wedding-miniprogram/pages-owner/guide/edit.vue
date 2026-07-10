<template>
  <PageShell
    class="page guide-edit-page"
    kicker="VENUES"
    title="路书设置"
    desc="整理场地、地图坐标、停车路线和住宿建议，保证宾客当天能直接行动。"
  >

    <!-- ===== 场地列表 ===== -->
    <SectionHeader
      title="婚礼场地"
      kicker="MAP READY"
      desc="宾客可一键导航；建议至少补齐主会场坐标和到达时间。"
    />

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
          <text class="venue-action" :class="{ disabled: guideBusy }" @click="editVenue(venue)">编辑</text>
          <text class="venue-action delete" :class="{ disabled: guideBusy }" @click="deleteVenue(venue.id)">删除</text>
        </view>
      </view>
    </view>

    <EmptyState
      v-if="venues.length === 0"
      icon="/static/visuals/empty-venue.svg"
      title="还没有添加场地"
      desc="先添加主仪式场地，再补充接亲、住宿或拍摄点。"
    />

    <button class="add-btn secondary" :class="{ 'is-disabled': guideBusy }" :disabled="guideBusy" @click="showAddModal">
      <text>+ 添加场地</text>
    </button>

    <!-- ===== 交通指引 ===== -->
    <SectionHeader
      title="交通指引"
      kicker="ARRIVAL"
      desc="把外地宾客、自驾宾客和停车信息整理成一段可执行的到场说明。"
    />

    <view class="info-section">
      <view class="info-row" :class="{ disabled: guideBusy }" @click="editTransportation">
        <view class="info-meta">
          <text class="info-row-label">出行方式</text>
          <text class="info-row-value">{{ transportation.transport || '点击设置' }}</text>
        </view>
        <image class="info-arrow" src="/static/visuals/icon-chevron-right.svg" mode="aspectFit" />
      </view>
      <view class="info-divider" />
      <view class="info-row" :class="{ disabled: guideBusy }" @click="editTransportation">
        <view class="info-meta">
          <text class="info-row-label">停车信息</text>
          <text class="info-row-value">{{ transportation.parking || '点击设置' }}</text>
        </view>
        <image class="info-arrow" src="/static/visuals/icon-chevron-right.svg" mode="aspectFit" />
      </view>
    </view>

    <AiSuggestionPanel
      title="AI 路书提示"
      desc="生成出行、停车和到达提醒；不会生成或覆盖地图坐标。"
      generate-text="生成路书"
      empty-text="生成后可一键填入交通指引弹窗，再由你确认保存。"
      :suggestions="aiSuggestions"
      :warnings="aiWarnings"
      :error="aiError"
      :loading="aiLoading"
      :disabled="guideBusy"
      @generate="generateGuideTips"
      @apply="applyGuideTips"
    />

    <!-- ===== 推荐住宿 ===== -->
    <SectionHeader
      title="推荐住宿"
      kicker="STAY"
      desc="给远道而来的亲友准备距离、价格和电话，减少当天反复确认。"
    />

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
          <text class="venue-action" :class="{ disabled: guideBusy }" @click="editHotel(hotel)">编辑</text>
          <text class="venue-action delete" :class="{ disabled: guideBusy }" @click="deleteHotel(hotel.id)">删除</text>
        </view>
      </view>
    </view>

    <EmptyState
      v-if="accommodations.length === 0"
      icon="/static/visuals/empty-hotel.svg"
      title="还没有添加推荐住宿"
      desc="可以添加协议酒店、附近酒店或新人推荐的住宿点。"
    />

    <button class="add-btn secondary" :class="{ 'is-disabled': guideBusy }" :disabled="guideBusy" @click="showHotelModal">
      <text>+ 添加住宿</text>
    </button>

    <BottomActionBar
      primary-text="添加场地"
      secondary-text="添加住宿"
      :disabled="guideBusy"
      @primary="showAddModal"
      @secondary="showHotelModal"
    />

    <!-- ===== 场地弹窗 ===== -->
    <view class="modal-mask" v-if="showModal" @click="requestCloseVenueModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingVenue ? '编辑场地' : '添加场地' }}</text>
          <image class="modal-close" src="/static/visuals/icon-close.svg" mode="aspectFit" @click="requestCloseVenueModal" />
        </view>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">场地名称</text>
            <input class="form-input" v-model="modalForm.name" placeholder="例如：华丽大酒楼" maxlength="40" />
          </view>
          <view class="form-group">
            <text class="form-label">场地类型</text>
            <picker mode="selector" :range="venueTypes" :value="modalForm.typeIndex" @change="onTypeChange">
              <view class="picker-value">{{ venueTypes[modalForm.typeIndex] }}</view>
            </picker>
          </view>
          <view class="form-group">
            <text class="form-label">详细地址</text>
            <input class="form-input" v-model="modalForm.address" placeholder="请输入地址" maxlength="100" />
          </view>
          <view class="geo-box">
            <view class="geo-meta">
              <text class="geo-title">地图与天气匹配</text>
              <text class="geo-desc">{{ geoStatusText }}</text>
            </view>
            <view class="geo-actions">
              <button class="geo-btn" :class="{ 'is-disabled': geocoding || savingVenue }" :loading="geocoding" :disabled="geocoding || savingVenue" @click="autoMatchLocation">自动匹配</button>
              <button class="geo-btn primary" :class="{ 'is-disabled': geocoding || savingVenue }" :disabled="geocoding || savingVenue" @click="chooseVenueLocation">地图选点</button>
            </view>
          </view>
          <view class="manual-coordinate">
            <view class="manual-coordinate-head" @click="showManualCoordinate = !showManualCoordinate">
              <text class="manual-coordinate-title">手动填写坐标</text>
              <text class="manual-coordinate-toggle">{{ showManualCoordinate ? '收起' : '展开' }}</text>
            </view>
            <view class="coordinate-grid" v-if="showManualCoordinate">
              <view class="coordinate-field">
                <text class="form-label">纬度</text>
                <input class="form-input" v-model="manualCoordinate.latitude" placeholder="例如 36.65120" type="digit" maxlength="16" />
              </view>
              <view class="coordinate-field">
                <text class="form-label">经度</text>
                <input class="form-input" v-model="manualCoordinate.longitude" placeholder="例如 117.12010" type="digit" maxlength="16" />
              </view>
              <button class="coordinate-apply" @click="applyManualCoordinate">应用坐标</button>
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
            <input class="form-input" v-model="modalForm.phone" placeholder="选填" type="number" maxlength="20" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn secondary" :disabled="savingVenue || geocoding" @click="requestCloseVenueModal">取消</button>
          <button class="modal-btn primary" :loading="savingVenue" :disabled="savingVenue || geocoding" @click="saveVenue">确定</button>
        </view>
      </view>
    </view>

    <!-- ===== 交通指引弹窗 ===== -->
    <view class="modal-mask" v-if="showTransportModal" @click="requestCloseTransportModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">交通指引</text>
          <image class="modal-close" src="/static/visuals/icon-close.svg" mode="aspectFit" @click="requestCloseTransportModal" />
        </view>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">出行方式</text>
            <input class="form-input" v-model="transportForm.transport" placeholder="如：高铁至南京南站，换乘地铁2号线" maxlength="80" />
          </view>
          <view class="form-group">
            <text class="form-label">停车信息</text>
            <textarea class="form-textarea" v-model="transportForm.parking" placeholder="如：酒店地下停车场，宾客免费停车" maxlength="160" />
          </view>
          <view class="form-group">
            <text class="form-label">角色路线提示</text>
            <textarea class="form-textarea" v-model="transportForm.routeTipsText" placeholder="每行一条，如：普通宾客：直接导航至主场地" maxlength="200" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn secondary" :disabled="savingTransport" @click="requestCloseTransportModal">取消</button>
          <button class="modal-btn primary" :loading="savingTransport" :disabled="savingTransport" @click="saveTransportation">确定</button>
        </view>
      </view>
    </view>

    <!-- ===== 住宿弹窗 ===== -->
    <view class="modal-mask" v-if="showHotelM" @click="requestCloseHotelModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingHotel ? '编辑住宿' : '添加住宿' }}</text>
          <image class="modal-close" src="/static/visuals/icon-close.svg" mode="aspectFit" @click="requestCloseHotelModal" />
        </view>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">酒店名称</text>
            <input class="form-input" v-model="hotelForm.name" placeholder="例如：金陵饭店" maxlength="40" />
          </view>
          <view class="form-group">
            <text class="form-label">距离场地</text>
            <input class="form-input" v-model="hotelForm.distance" placeholder="例如：距仪式场地 800 米" maxlength="30" />
          </view>
          <view class="form-group">
            <text class="form-label">价格区间</text>
            <input class="form-input" v-model="hotelForm.price_range" placeholder="例如：400-600元/晚" maxlength="30" />
          </view>
          <view class="form-group">
            <text class="form-label">预订电话</text>
            <input class="form-input" v-model="hotelForm.phone" placeholder="选填" type="number" maxlength="20" />
          </view>
          <view class="form-group">
            <text class="form-label">备注</text>
            <input class="form-input" v-model="hotelForm.notes" placeholder="选填，如：协议价，订房报新人名字" maxlength="80" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn secondary" :disabled="savingHotel" @click="requestCloseHotelModal">取消</button>
          <button class="modal-btn primary" :loading="savingHotel" :disabled="savingHotel" @click="saveHotel">确定</button>
        </view>
      </view>
    </view>
  </PageShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { generateId, showError, showSuccess } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { generateAiSuggestions, geocodeVenue, updateWedding } from '@/composables/useCloud.js'
import PageShell from '@/components/ui/PageShell.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BottomActionBar from '@/components/ui/BottomActionBar.vue'
import AiSuggestionPanel from '@/components/ui/AiSuggestionPanel.vue'

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
const lastGeocodeError = ref('')
const showManualCoordinate = ref(false)
const manualCoordinate = ref({ latitude: '', longitude: '' })
const savingVenue = ref(false)
const venueFormSnapshot = ref('')
const aiLoading = ref(false)
const aiError = ref('')
const aiWarnings = ref([])
const aiSuggestions = ref([])

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

function guardGuideBusy() {
  if (!guideBusy.value) return false
  showError('路书数据正在保存或匹配地图，请稍候')
  return true
}

function showAddModal() {
  if (guardGuideBusy()) return
  editingVenue.value = null
  modalForm.value = { name: '', typeIndex: 2, address: '', arrivalTime: '', phone: '', coordinate: null }
  manualCoordinate.value = { latitude: '', longitude: '' }
  showManualCoordinate.value = false
  snapshotVenueForm()
  showModal.value = true
}

function editVenue(venue) {
  if (guardGuideBusy()) return
  editingVenue.value = venue
  modalForm.value = {
    name: venue.name,
    typeIndex: typeReverseMap[venue.type] || 2,
    address: venue.address,
    arrivalTime: venue.arrival_time || '',
    phone: venue.contact_phone || '',
    coordinate: venue.coordinate || null
  }
  manualCoordinate.value = {
    latitude: venue.coordinate?.latitude ? String(venue.coordinate.latitude) : '',
    longitude: venue.coordinate?.longitude ? String(venue.coordinate.longitude) : ''
  }
  showManualCoordinate.value = !hasCoordinate(venue)
  snapshotVenueForm()
  showModal.value = true
}

function onTypeChange(e) { modalForm.value.typeIndex = e.detail.value }
function onArrivalTimeChange(e) { modalForm.value.arrivalTime = e.detail.value }

function snapshotVenueForm() {
  venueFormSnapshot.value = JSON.stringify({
    modalForm: modalForm.value,
    manualCoordinate: manualCoordinate.value,
    showManualCoordinate: showManualCoordinate.value
  })
}

function hasVenueFormChanges() {
  return showModal.value && JSON.stringify({
    modalForm: modalForm.value,
    manualCoordinate: manualCoordinate.value,
    showManualCoordinate: showManualCoordinate.value
  }) !== venueFormSnapshot.value
}

function requestCloseVenueModal() {
  if (savingVenue.value || geocoding.value) return
  if (!hasVenueFormChanges()) {
    showModal.value = false
    return
  }
  uni.showModal({
    title: '放弃未保存内容？',
    content: '当前场地信息还没有保存。',
    confirmText: '放弃',
    cancelText: '继续编辑',
    success: (res) => {
      if (res.confirm) showModal.value = false
    }
  })
}

async function autoMatchLocation(options = {}) {
  const { silent = false } = options
  if (!modalForm.value.name.trim() && !modalForm.value.address.trim()) {
    if (!silent) showError('请先填写场地名称或地址')
    return null
  }
  try {
    lastGeocodeError.value = ''
    geocoding.value = true
    const res = await geocodeVenue({
      name: modalForm.value.name.trim(),
      address: modalForm.value.address.trim()
    })
    if (res?.data?.latitude && res?.data?.longitude) {
      modalForm.value.coordinate = normalizeCoordinate(res.data)
      syncManualCoordinate()
      if (res.data.address && !modalForm.value.address.trim()) {
        modalForm.value.address = res.data.address
      }
      if (!silent) showSuccess('已匹配地图坐标')
      return modalForm.value.coordinate
    }
    lastGeocodeError.value = formatGeocodeError(res)
    if (!silent) showError(lastGeocodeError.value)
  } catch (err) {
    lastGeocodeError.value = formatGeocodeError(err)
    if (!silent) showError(lastGeocodeError.value)
  } finally {
    geocoding.value = false
  }
  return null
}

function chooseVenueLocation() {
  return new Promise((resolve) => {
    const api = (typeof wx !== 'undefined' && wx.chooseLocation)
      ? wx
      : (typeof uni !== 'undefined' && typeof uni.chooseLocation === 'function' ? uni : null)
    if (!api) {
      console.warn('地图选点能力不可用')
      showError('当前环境不支持地图选点，请在微信小程序中操作')
      resolve(false)
      return
    }
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
        syncManualCoordinate()
        lastGeocodeError.value = ''
        showSuccess('已选择地图位置')
        resolve(true)
      },
      fail: (err) => {
        if (!String(err?.errMsg || '').includes('cancel')) {
          console.warn('地图选点失败:', err)
          showLocationPickerError(err)
        }
        resolve(false)
      }
    })
  })
}

function showLocationPickerError(err) {
  const raw = String(err?.errMsg || err?.message || '')
  const normalized = raw.toLowerCase()
  if (normalized.includes('api scope is not declared') || normalized.includes('privacy agreement')) {
    uni.showModal({
      title: '需完成平台声明',
      content: '请在微信公众平台声明“收集你选择的位置信息”，保存约 5 分钟后再使用地图选点。用途建议填写：用于婚礼主人选择并保存婚礼场地位置。',
      showCancel: false,
      confirmText: '知道了'
    })
    return
  }
  if (/privacy|隐私/i.test(raw)) {
    showError('请先同意小程序隐私保护指引后再使用地图选点')
    return
  }
  showError('地图选点失败，请稍后重试；也可以手动填写坐标')
}

async function saveVenue() {
  if (savingVenue.value) return
  if (!modalForm.value.name.trim()) {
    uni.showToast({ title: '请输入场地名称', icon: 'none' })
    return
  }
  if (modalForm.value.phone && !isValidPhone(modalForm.value.phone)) {
    showError('请输入有效联系电话')
    return
  }
  const previousVenues = cloneVenues()
  savingVenue.value = true
  try {
    if (shouldResolveCoordinate()) {
      await autoMatchLocation({ silent: true })
      if (!modalForm.value.coordinate?.latitude || !modalForm.value.coordinate?.longitude) {
        const shouldChoose = await confirmMapFallback(lastGeocodeError.value)
        if (shouldChoose) {
          const picked = await chooseVenueLocation()
          if (!picked) return
        }
      }
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
    if (!store.venues) store.venues = { venues: [], transportation: {}, accommodations: [] }
    if (!store.venues.venues) store.venues.venues = []
    if (editingVenue.value) {
      const idx = store.venues.venues.findIndex(v => v.id === editingVenue.value.id)
      if (idx >= 0) store.venues.venues[idx] = venue
    } else {
      store.addVenue(venue)
    }
    await saveToStorage()
    snapshotVenueForm()
    showModal.value = false
    showSuccess(venue.coordinate ? '保存成功，已匹配地图' : '已保存，待匹配地图')
  } catch (err) {
    store.venues = previousVenues
    console.error('场地保存失败:', err)
    showError(err?.message || '保存失败，请重试')
  } finally {
    savingVenue.value = false
  }
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

function applyManualCoordinate() {
  const coordinate = normalizeCoordinate({
    latitude: manualCoordinate.value.latitude,
    longitude: manualCoordinate.value.longitude,
    title: modalForm.value.name,
    address: modalForm.value.address,
    source: 'manual-input',
    matched_at: Date.now()
  })
  if (!coordinate) {
    showError('请输入有效的经纬度')
    return
  }
  if (Math.abs(coordinate.latitude) > 90 || Math.abs(coordinate.longitude) > 180) {
    showError('经纬度范围不正确')
    return
  }
  modalForm.value.coordinate = coordinate
  syncManualCoordinate()
  lastGeocodeError.value = ''
  showSuccess('已应用手动坐标')
}

function syncManualCoordinate() {
  manualCoordinate.value = {
    latitude: modalForm.value.coordinate?.latitude ? String(modalForm.value.coordinate.latitude) : '',
    longitude: modalForm.value.coordinate?.longitude ? String(modalForm.value.coordinate.longitude) : ''
  }
}

function deleteVenue(id) {
  if (guardGuideBusy()) return
  uni.showModal({
    title: '确认删除',
    content: '确定删除该场地？',
    success: async (res) => {
      if (res.confirm) {
        const previousVenues = cloneVenues()
        savingVenue.value = true
        try {
          if (store.venues && Array.isArray(store.venues.venues)) {
            store.venues.venues = store.venues.venues.filter(v => v.id !== id)
          }
          await saveToStorage()
          showSuccess('已删除')
        } catch (err) {
          store.venues = previousVenues
          showError(err?.message || '删除失败，请重试')
        } finally {
          savingVenue.value = false
        }
      }
    }
  })
}

// ========== 交通指引 ==========
const showTransportModal = ref(false)
const transportForm = ref({ transport: '', parking: '', routeTipsText: '' })
const savingTransport = ref(false)
const transportFormSnapshot = ref('')

const transportation = computed(() => store.venues?.transportation || {})

function editTransportation() {
  if (guardGuideBusy()) return
  transportForm.value = {
    transport: transportation.value.transport || '',
    parking: transportation.value.parking || '',
    routeTipsText: (transportation.value.route_tips || []).join('\n')
  }
  snapshotTransportForm()
  showTransportModal.value = true
}

function snapshotTransportForm() {
  transportFormSnapshot.value = JSON.stringify(transportForm.value)
}

function hasTransportFormChanges() {
  return showTransportModal.value && JSON.stringify(transportForm.value) !== transportFormSnapshot.value
}

function requestCloseTransportModal() {
  if (savingTransport.value) return
  if (!hasTransportFormChanges()) {
    showTransportModal.value = false
    return
  }
  uni.showModal({
    title: '放弃未保存内容？',
    content: '当前交通指引还没有保存。',
    confirmText: '放弃',
    cancelText: '继续编辑',
    success: (res) => {
      if (res.confirm) showTransportModal.value = false
    }
  })
}

async function generateGuideTips() {
  if (guideBusy.value || aiLoading.value) return
  aiLoading.value = true
  aiError.value = ''
  aiWarnings.value = []
  try {
    const res = await generateAiSuggestions('guide_tips', {
      tone: 'luxury_refined',
      context: {
        coupleName: store.coupleName,
        weddingDate: store.weddingDate,
        weddingTime: store.weddingTime,
        template: store.activeTemplate?.name,
        venueName: store.venueName,
        primaryVenue: store.primaryVenue,
        venues: venues.value.map(v => ({
          name: v.name,
          type: v.type,
          address: v.address,
          arrival_time: v.arrival_time,
          hasCoordinate: hasCoordinate(v)
        })),
        transportation: transportation.value,
        accommodations: accommodations.value.map(h => ({
          name: h.name,
          distance: h.distance,
          price_range: h.price_range
        }))
      }
    })
    aiSuggestions.value = res.suggestions || []
    aiWarnings.value = res.warnings || []
  } catch (err) {
    aiError.value = err?.message || 'AI 路书生成失败，请稍后重试'
  } finally {
    aiLoading.value = false
  }
}

function applyGuideTips(item) {
  if (guideBusy.value) return
  const content = item?.content || {}
  if (!content.transport && !content.parking && !content.route_tips?.length) {
    showError('候选路书为空')
    return
  }
  transportForm.value = {
    transport: content.transport || transportation.value.transport || '',
    parking: content.parking || transportation.value.parking || '',
    routeTipsText: (content.route_tips || []).join('\n')
  }
  transportFormSnapshot.value = JSON.stringify({
    transport: transportation.value.transport || '',
    parking: transportation.value.parking || '',
    routeTipsText: (transportation.value.route_tips || []).join('\n')
  })
  showTransportModal.value = true
  showSuccess('已填入交通指引，请保存')
}

async function saveTransportation() {
  if (savingTransport.value) return
  const previousVenues = cloneVenues()
  savingTransport.value = true
  try {
    if (!store.venues) store.venues = { venues: [], transportation: {}, accommodations: [] }
    store.venues.transportation = {
      transport: transportForm.value.transport,
      parking: transportForm.value.parking,
      route_tips: transportForm.value.routeTipsText
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean)
    }
    await saveToStorage()
    snapshotTransportForm()
    showTransportModal.value = false
    showSuccess('保存成功')
  } catch (err) {
    store.venues = previousVenues
    showError(err?.message || '保存失败，请重试')
  } finally {
    savingTransport.value = false
  }
}

// ========== 住宿 ==========
const showHotelM = ref(false)
const editingHotel = ref(null)
const hotelForm = ref({ name: '', distance: '', price_range: '', phone: '', notes: '' })
const savingHotel = ref(false)
const guideBusy = computed(() => savingVenue.value || geocoding.value || savingTransport.value || savingHotel.value || aiLoading.value)
const hotelFormSnapshot = ref('')

const accommodations = computed(() => store.venues?.accommodations || [])

function showHotelModal() {
  if (guardGuideBusy()) return
  editingHotel.value = null
  hotelForm.value = { name: '', distance: '', price_range: '', phone: '', notes: '' }
  snapshotHotelForm()
  showHotelM.value = true
}

function editHotel(hotel) {
  if (guardGuideBusy()) return
  editingHotel.value = hotel
  hotelForm.value = {
    name: hotel.name,
    distance: hotel.distance || '',
    price_range: hotel.price_range || '',
    phone: hotel.phone || '',
    notes: hotel.notes || ''
  }
  snapshotHotelForm()
  showHotelM.value = true
}

function snapshotHotelForm() {
  hotelFormSnapshot.value = JSON.stringify(hotelForm.value)
}

function hasHotelFormChanges() {
  return showHotelM.value && JSON.stringify(hotelForm.value) !== hotelFormSnapshot.value
}

function requestCloseHotelModal() {
  if (savingHotel.value) return
  if (!hasHotelFormChanges()) {
    showHotelM.value = false
    return
  }
  uni.showModal({
    title: '放弃未保存内容？',
    content: '当前住宿信息还没有保存。',
    confirmText: '放弃',
    cancelText: '继续编辑',
    success: (res) => {
      if (res.confirm) showHotelM.value = false
    }
  })
}

async function saveHotel() {
  if (savingHotel.value) return
  if (!hotelForm.value.name.trim()) {
    uni.showToast({ title: '请输入酒店名称', icon: 'none' })
    return
  }
  if (hotelForm.value.phone && !isValidPhone(hotelForm.value.phone)) {
    showError('请输入有效预订电话')
    return
  }
  const previousVenues = cloneVenues()
  savingHotel.value = true
  try {
    const hotel = {
      id: editingHotel.value?.id || generateId(),
      name: hotelForm.value.name,
      distance: hotelForm.value.distance,
      price_range: hotelForm.value.price_range,
      phone: hotelForm.value.phone,
      notes: hotelForm.value.notes
    }
    if (!store.venues) store.venues = { venues: [], transportation: {}, accommodations: [] }
    if (!store.venues.accommodations) store.venues.accommodations = []
    if (editingHotel.value) {
      const idx = store.venues.accommodations.findIndex(h => h.id === editingHotel.value.id)
      if (idx >= 0) store.venues.accommodations[idx] = hotel
    } else {
      store.venues.accommodations.push(hotel)
    }
    await saveToStorage()
    snapshotHotelForm()
    showHotelM.value = false
    showSuccess('保存成功')
  } catch (err) {
    store.venues = previousVenues
    showError(err?.message || '保存失败，请重试')
  } finally {
    savingHotel.value = false
  }
}

function deleteHotel(id) {
  if (guardGuideBusy()) return
  uni.showModal({
    title: '确认删除',
    content: '确定删除该住宿？',
    success: async (res) => {
      if (res.confirm) {
        const previousVenues = cloneVenues()
        savingHotel.value = true
        try {
          if (store.venues && Array.isArray(store.venues.accommodations)) {
            store.venues.accommodations = store.venues.accommodations.filter(h => h.id !== id)
          }
          await saveToStorage()
          showSuccess('已删除')
        } catch (err) {
          store.venues = previousVenues
          showError(err?.message || '删除失败，请重试')
        } finally {
          savingHotel.value = false
        }
      }
    }
  })
}

function callHotel(phone) {
  if (phone) {
    uni.makePhoneCall({
      phoneNumber: String(phone),
      fail: (err) => {
        if (!err?.errMsg?.includes('cancel')) {
          console.warn('拨打酒店电话失败:', err)
          showError('拨打电话失败')
        }
      }
    })
  }
}

function isValidPhone(phone) {
  return /^\d{6,20}$/.test(String(phone || '').trim())
}

// ========== 数据持久化 ==========
async function saveToStorage() {
  if (!userStore.weddingId) {
    throw new Error('未找到婚礼信息，请重新进入')
  }
  if (!store.venues) {
    store.venues = { venues: [], transportation: {}, accommodations: [] }
  }
  try {
    await updateWedding(userStore.weddingId, 'venues', store.venues)
  } catch (err) {
    console.error(' venues 云端保存失败:', err)
    throw new Error(err?.message || '云端同步失败')
  }
  // 再缓存本地（离线兜底）
  const weddings = uni.getStorageSync('weddings') || {}
  if (weddings[userStore.weddingId]) {
    weddings[userStore.weddingId].venues = store.venues
    uni.setStorageSync('weddings', weddings)
  }
}

function cloneVenues() {
  const venuesData = store.venues || { venues: [], transportation: {}, accommodations: [] }
  return JSON.parse(JSON.stringify({
    venues: venuesData.venues || [],
    transportation: venuesData.transportation || {},
    accommodations: venuesData.accommodations || []
  }))
}

function confirmMapFallback(message) {
  return new Promise((resolve) => {
    uni.showModal({
      title: '地图匹配失败',
      content: `${message || '暂时无法自动匹配地图坐标'}。可以现在地图选点；也可以先保存，稍后补充坐标。`,
      confirmText: '地图选点',
      cancelText: '先保存',
      success: (res) => resolve(Boolean(res.confirm)),
      fail: () => resolve(false)
    })
  })
}

function formatGeocodeError(err) {
  const message = err?.message || err?.result?.message || ''
  const code = err?.code || err?.result?.code || ''
  if (err?.needConfig || code === 'MISSING_MAP_KEY' || message.includes('TENCENT_MAP_KEY') || message.includes('腾讯地图 Key')) {
    return '自动匹配服务还没完成腾讯地图 Key 配置，建议先用地图选点；配置后可一键自动匹配'
  }
  if (code === 'NO_MATCH') return '没有匹配到准确坐标，请补全详细地址或使用地图选点'
  if (code === 'MAP_TIMEOUT') return '地图服务响应超时，请稍后重试或使用地图选点'
  return message || '地图匹配失败'
}

onShow(async () => {
  if (!(await useOwnerGuard())) return
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}

.page-header {
  padding: $page-header-top $page-gutter $page-header-bottom;
}
.page-tag {
  display: block;
  font-size: 24rpx;
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

/* 分组标题 */
.section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 40rpx $page-gutter 20rpx;
}
.section-label {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-primary;
}
.section-hint {
  font-size: 24rpx;
  color: $text-muted;
}

/* 场地列表 */
.venue-list, .hotel-list {
  padding: 0 $page-gutter;
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
  font-size: 24rpx;
  border-radius: 6rpx;
  font-weight: 500;
}
.venue-time {
  font-size: 24rpx;
  color: $text-muted;
}
.venue-name, .hotel-name {
  display: block;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
  margin-bottom: 6rpx;
  line-height: 1.35;
  word-break: break-word;
}
.venue-address {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  margin-bottom: 8rpx;
  line-height: 1.5;
  word-break: break-word;
}
.venue-geo {
  display: inline-block;
  margin-bottom: 12rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  background: rgba(52,168,83,0.08);
  color: $color-success;
  font-size: 24rpx;
}
.venue-geo.missing {
  background: rgba(249,171,0,0.12);
  color: $gold;
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
.venue-action.disabled {
  opacity: 0.42;
}

/* 住宿 */
.hotel-tags {
  display: flex;
  gap: 12rpx;
  margin: 6rpx 0;
}
.hotel-tag {
  font-size: 24rpx;
  color: $text-secondary;
  background: $bg-muted;
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
}
.hotel-phone {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: $color-primary;
}
.hotel-phone-icon {
  width: 24rpx;
  height: 24rpx;
}

/* 信息列表 */
.info-section {
  margin: 0 $page-gutter;
  background: $bg-surface;
  border-radius: $card-radius;
  border: 1rpx solid $border-color;
  overflow: hidden;
}
.info-row {
  display: flex;
  align-items: center;
  padding: 32rpx;
}
.info-row.disabled {
  opacity: 0.55;
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
  line-height: 1.45;
  word-break: break-word;
}
.info-arrow {
  width: 30rpx;
  height: 30rpx;
  opacity: 0.54;
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
  margin: 24rpx $page-gutter 0;
  height: $control-height;
  line-height: $control-height;
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
.add-btn.is-disabled {
  opacity: 0.48;
}

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
  border-radius: $modal-radius $modal-radius 0 0;
  max-height: 85vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36rpx $page-gutter 24rpx;
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
  width: 50rpx;
  height: 50rpx;
  padding: 10rpx;
  box-sizing: border-box;
  opacity: 0.68;
}
.modal-body {
  padding: 32rpx $page-gutter;
}
.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 24rpx $page-gutter calc(48rpx + env(safe-area-inset-bottom));
}
.modal-btn {
  flex: 1;
  height: $control-height;
  line-height: $control-height;
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
  color: $ink-inverse;
}
.modal-btn:active { transform: scale(0.98); opacity: 0.85; }

.geo-box {
  margin: -8rpx 0 28rpx;
  padding: 24rpx;
  border-radius: $card-radius;
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
  font-size: 24rpx;
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
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-primary;
  font-size: 24rpx;
}
.geo-btn.primary {
  background: $text-primary;
  color: $ink-inverse;
}
.geo-btn::after { border: none; }
.geo-btn.is-disabled {
  opacity: 0.62;
}
.manual-coordinate {
  margin: -12rpx 0 28rpx;
  padding: 22rpx 24rpx;
  border-radius: $card-radius;
  background: $bg-surface;
  border: 1rpx solid $border-color;
}
.manual-coordinate-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.manual-coordinate-title {
  font-size: 26rpx;
  color: $text-primary;
  font-weight: 500;
}
.manual-coordinate-toggle {
  font-size: 24rpx;
  color: $color-primary;
}
.coordinate-grid {
  margin-top: 20rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}
.coordinate-field {
  min-width: 0;
}
.coordinate-apply {
  grid-column: 1 / -1;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: $text-primary;
  color: $ink-inverse;
  font-size: 26rpx;
}
.coordinate-apply::after {
  border: none;
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
  letter-spacing: 0;
}
.form-input {
  height: $control-height;
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
  height: $control-height;
  font-size: 28rpx;
  color: $text-primary;
  border-bottom: 2rpx solid $border-color;
  display: flex;
  align-items: center;
}
</style>
