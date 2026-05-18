<template>
  <view class="page" :class="templateClass">
    <!-- 到场助手 -->
    <view class="arrival-pack">
      <view class="arrival-head">
        <view>
          <text class="arrival-kicker">{{ activeTemplate.shortName }} ARRIVAL PACK</text>
          <text class="arrival-title">到场助手</text>
        </view>
        <text class="arrival-date">{{ formatDate(store.weddingDate) }}</text>
      </view>
      <view class="arrival-card">
        <view class="arrival-main">
          <text class="arrival-label">主场地</text>
          <text class="arrival-name">{{ primaryVenue.name }}</text>
          <text class="arrival-address">{{ primaryVenue.address || '主人正在补充详细地址' }}</text>
        </view>
        <view class="arrival-actions">
          <button class="arrival-btn primary" @click="navigateTo(primaryVenue)">导航</button>
          <button class="arrival-btn" v-if="primaryVenue.contact_phone" @click="callPhone(primaryVenue.contact_phone)">电话</button>
        </view>
      </view>
      <view class="arrival-summary">
        <view class="arrival-summary-item">
          <text class="summary-label">建议到达</text>
          <text class="summary-value">{{ primaryVenue.arrival_time || store.weddingTime || '以邀请为准' }}</text>
        </view>
        <view class="arrival-summary-item" @click="activeTab = 'weather'">
          <text class="summary-label">天气提醒</text>
          <text class="summary-value">{{ weatherHint }}</text>
        </view>
      </view>
      <view class="parking-note" v-if="transportInfo.parking">
        <image class="visual-icon-xs parking-icon" src="/static/visuals/icon-parking.png" mode="aspectFit" />
        <text>{{ transportInfo.parking }}</text>
      </view>
    </view>

    <!-- 顶部 Tab 栏 -->
    <view class="tab-bar">
      <view
        class="tab-item"
        v-for="tab in tabs"
        :key="tab.key"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <text class="tab-label">{{ tab.label }}</text>
        <view class="tab-dot" v-if="tab.key === 'weather' && weatherData" />
      </view>
    </view>

    <!-- 地图 Tab -->
    <view class="tab-content" v-show="activeTab === 'map'">
      <view class="map-container">
        <map
          id="weddingMap"
          class="map"
          :latitude="center.latitude"
          :longitude="center.longitude"
          :scale="scale"
          :markers="markers"
          :polyline="polyline"
          :show-location="true"
          @markertap="onMarkerTap"
        />
      </view>

      <scroll-view class="venue-list" scroll-y>
        <view
          class="venue-card"
          v-for="venue in venues"
          :key="venue.id"
          :class="{ active: selectedVenue?.id === venue.id }"
          @click="selectVenue(venue)"
        >
          <view class="venue-meta">
            <text class="venue-type">{{ typeLabel(venue.type) }}</text>
            <text class="venue-time" v-if="venue.arrival_time">{{ venue.arrival_time }}</text>
          </view>
          <text class="venue-name">{{ venue.name }}</text>
          <text class="venue-address">{{ venue.address }}</text>
          <view class="venue-actions">
            <button class="action-btn" @click.stop="callPhone(venue.contact_phone)" v-if="venue.contact_phone">电话</button>
            <button class="action-btn primary" @click.stop="navigateTo(venue)">导航</button>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 天气 Tab -->
    <view class="tab-content info-tab" v-show="activeTab === 'weather'">
      <view class="weather-banner" v-if="weatherData && !weatherLoading">
        <view class="weather-main">
          <image class="weather-icon" :src="weatherIcon" mode="aspectFit" />
          <view class="weather-temp">
            <text class="temp-max">{{ weatherData.temp_max }}°</text>
            <text class="temp-sep">/</text>
            <text class="temp-min">{{ weatherData.temp_min }}°</text>
          </view>
        </view>
        <view class="weather-desc">
          <text class="weather-text">{{ weatherData.text }}</text>
          <text class="weather-date">{{ formatWeatherDate(weatherData.date) }}</text>
        </view>
        <view class="weather-tags" v-if="weatherData.tips">
          <view class="weather-tag" :class="{ rain: weatherData.precip > 30 }">
            <image class="visual-icon-xs weather-tag-icon" src="/static/visuals/icon-tip.png" mode="aspectFit" />
            <text>{{ weatherData.tips }}</text>
          </view>
        </view>
      </view>

      <!-- 天气加载中 -->
      <view class="weather-loading" v-if="weatherLoading">
        <view class="loading-spinner" />
        <text class="loading-text">加载天气中...</text>
      </view>

      <!-- 无天气数据 -->
      <view class="empty-state" v-if="!weatherLoading && !weatherData">
        <image class="empty-visual" src="/static/visuals/empty-weather.png" mode="aspectFit" />
        <text class="empty-text">暂无天气数据</text>
        <text class="empty-sub">请在主人端设置场地坐标以获取天气</text>
      </view>

      <!-- 天气详情 -->
      <view class="weather-details" v-if="weatherData && !weatherLoading">
        <view class="detail-row">
          <image class="visual-icon-sm detail-icon" src="/static/visuals/icon-weather-wind.png" mode="aspectFit" />
          <text class="detail-text">{{ weatherData.wind }}</text>
        </view>
        <view class="detail-divider" />
        <view class="detail-row">
          <image class="visual-icon-sm detail-icon" src="/static/visuals/icon-weather-precip.png" mode="aspectFit" />
          <text class="detail-text">降水概率 {{ weatherData.precip }}%</text>
        </view>
        <view class="detail-divider" v-if="weatherData.sunrise" />
        <view class="detail-row" v-if="weatherData.sunrise">
          <image class="visual-icon-sm detail-icon" src="/static/visuals/icon-weather-sunrise.png" mode="aspectFit" />
          <text class="detail-text">{{ weatherData.sunrise }} 日出</text>
        </view>
        <view class="detail-divider" v-if="weatherData.sunset" />
        <view class="detail-row" v-if="weatherData.sunset">
          <image class="visual-icon-sm detail-icon" src="/static/visuals/icon-weather-sunset.png" mode="aspectFit" />
          <text class="detail-text">{{ weatherData.sunset }} 日落</text>
        </view>
      </view>

      <!-- 无天气 API 说明 -->
      <view class="api-note" v-if="weatherData?.isMock">
        <image class="visual-icon-xs note-icon" src="/static/visuals/icon-warning.png" mode="aspectFit" />
        <text class="note-text">当前为模拟数据，请配置天气 API Key 以获取真实天气</text>
      </view>
    </view>

    <!-- 交通 Tab -->
    <view class="tab-content info-tab" v-show="activeTab === 'transport'">
      <view class="section-header">
        <text class="section-title">交通指引</text>
        <text class="section-date">{{ formatDate(store.weddingDate) }}</text>
      </view>

      <view v-if="transportInfo.transport || transportInfo.parking" class="info-card">
        <view class="info-row" v-if="transportInfo.transport">
          <view class="info-icon-wrap">
            <image class="visual-icon info-row-icon" src="/static/visuals/icon-transport.png" mode="aspectFit" />
          </view>
          <view class="info-content">
            <text class="info-label">出行方式</text>
            <text class="info-value">{{ transportInfo.transport }}</text>
          </view>
        </view>
        <view class="info-divider" v-if="transportInfo.transport && transportInfo.parking" />
        <view class="info-row" v-if="transportInfo.parking">
          <view class="info-icon-wrap">
            <image class="visual-icon info-row-icon" src="/static/visuals/icon-parking.png" mode="aspectFit" />
          </view>
          <view class="info-content">
            <text class="info-label">停车信息</text>
            <text class="info-value">{{ transportInfo.parking }}</text>
          </view>
        </view>
      </view>

      <view class="empty-state" v-if="!transportInfo.transport && !transportInfo.parking">
        <image class="empty-visual" src="/static/visuals/empty-transport.png" mode="aspectFit" />
        <text class="empty-text">暂无交通指引</text>
        <text class="empty-sub">主人尚未添加交通信息</text>
      </view>
    </view>

    <!-- 住宿 Tab -->
    <view class="tab-content info-tab" v-show="activeTab === 'hotel'">
      <view class="section-header">
        <text class="section-title">推荐住宿</text>
        <text class="section-date">{{ formatDate(store.weddingDate) }}</text>
      </view>

      <view class="hotel-list" v-if="accommodations.length > 0">
        <view class="hotel-card" v-for="hotel in accommodations" :key="hotel.id">
          <view class="hotel-info">
            <text class="hotel-name">{{ hotel.name }}</text>
            <view class="hotel-tags" v-if="hotel.distance || hotel.price_range">
              <text class="hotel-tag" v-if="hotel.distance">{{ hotel.distance }}</text>
              <text class="hotel-tag" v-if="hotel.price_range">{{ hotel.price_range }}</text>
            </view>
            <text class="hotel-notes" v-if="hotel.notes">{{ hotel.notes }}</text>
          </view>
          <view class="hotel-actions">
            <button class="hotel-btn" v-if="hotel.phone" @click="callHotel(hotel.phone)">
              <image class="visual-icon-xs hotel-btn-icon" src="/static/visuals/icon-phone.png" mode="aspectFit" />
              <text>一键拨打</text>
            </button>
          </view>
        </view>
      </view>

      <view class="empty-state" v-if="accommodations.length === 0">
        <image class="empty-visual" src="/static/visuals/empty-hotel.png" mode="aspectFit" />
        <text class="empty-text">暂无推荐住宿</text>
        <text class="empty-sub">主人尚未添加住宿推荐</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { fetchWedding, getWeather } from '@/composables/useCloud.js'
import { MARKER_ICON } from '@/config/cloud.js'

const store = useWeddingStore()
const userStore = useUserStore()
const activeTemplate = computed(() => store.activeTemplate)
const templateClass = computed(() => store.templateClass)

const activeTab = ref('map')
const tabs = [
  { key: 'map', label: '地图' },
  { key: 'weather', label: '天气' },
  { key: 'transport', label: '交通' },
  { key: 'hotel', label: '住宿' }
]

const center = ref({ latitude: 39.908823, longitude: 116.397470 })
const scale = ref(12)
const selectedVenue = ref(null)

// 天气
const weatherData = ref(null)
const weatherLoading = ref(false)
const weatherIcon = computed(() => {
  const iconMap = {
    sunny: '/static/visuals/icon-weather-sunny.png',
    cloudy: '/static/visuals/icon-weather-cloudy.png',
    overcast: '/static/visuals/icon-weather-cloudy.png',
    rain: '/static/visuals/icon-weather-rain.png',
    thunder: '/static/visuals/icon-weather-rain.png',
    fog: '/static/visuals/icon-weather-cloudy.png',
    snow: '/static/visuals/icon-weather-rain.png',
    dust: '/static/visuals/icon-weather-cloudy.png',
    unknown: '/static/visuals/icon-weather-sunny.png'
  }
  return iconMap[weatherData.value?.icon] || '/static/visuals/icon-weather-sunny.png'
})

const venues = computed(() => store.venues?.venues || [])
const primaryVenue = computed(() => store.primaryVenue || venues.value[0] || {})
const transportInfo = computed(() => store.venues?.transportation || {})
const accommodations = computed(() => store.venues?.accommodations || [])
const weatherHint = computed(() => {
  if (weatherLoading.value) return '加载中'
  if (!weatherData.value) return '点此查看'
  if (weatherData.value.precip > 30) return `可能降雨 ${weatherData.value.precip}%`
  return `${weatherData.value.text || '适合出行'} ${weatherData.value.temp_min || ''}-${weatherData.value.temp_max || ''}°`
})

const markers = computed(() => {
  return venues.value.map((v, i) => ({
    id: i,
    latitude: v.coordinate?.latitude || center.value.latitude,
    longitude: v.coordinate?.longitude || center.value.longitude,
    title: v.name,
    iconPath: MARKER_ICON || '',
    width: 30,
    height: 30,
    callout: {
      content: v.name, color: '#333', fontSize: 14,
      borderRadius: 8, bgColor: '#fff', padding: 10, display: 'BYCLICK'
    }
  }))
})

const polyline = computed(() => {
  const points = venues.value.filter(v => v.coordinate).map(v => ({
    latitude: v.coordinate.latitude, longitude: v.coordinate.longitude
  }))
  if (points.length < 2) return []
  return [{ points, color: '#B03A5B', width: 3, dottedLine: false }]
})

function typeLabel(type) {
  const map = { home: '家', hotel: '酒店', venue: '场地', hotel_guest: '住宿', photo: '摄影' }
  return map[type] || '场地'
}

function selectVenue(venue) {
  selectedVenue.value = venue
  if (venue.coordinate) {
    center.value = { latitude: venue.coordinate.latitude, longitude: venue.coordinate.longitude }
    scale.value = 16
  }
  activeTab.value = 'map'
}

function onMarkerTap(e) {
  const idx = e.detail.markerId
  if (venues.value[idx]) selectVenue(venues.value[idx])
}

function navigateTo(venue) {
  if (!venue.coordinate) {
    uni.showToast({ title: '暂无坐标信息', icon: 'none' })
    return
  }
  uni.openLocation({
    latitude: venue.coordinate.latitude,
    longitude: venue.coordinate.longitude,
    name: venue.name,
    address: venue.address
  })
}

function callPhone(phone) {
  if (!phone) return
  uni.makePhoneCall({ phoneNumber: phone })
}

function callHotel(phone) {
  if (phone) uni.makePhoneCall({ phoneNumber: String(phone) })
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function formatWeatherDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${days[d.getDay()]}`
}

async function loadWeather() {
  if (!userStore.weddingId) return
  weatherLoading.value = true
  try {
    const res = await getWeather(userStore.weddingId)
    if (res?.success) {
      weatherData.value = res.data
    } else {
      weatherData.value = null
    }
  } catch (err) {
    console.error('loadWeather error:', err)
    weatherData.value = null
  } finally {
    weatherLoading.value = false
  }
}

onShow(async () => {
  const hasLoadedWedding = Boolean(store.wedding?._id || store.wedding?.wedding_id)
  if (userStore.weddingId && !hasLoadedWedding) {
    try {
      await fetchWedding(userStore.weddingId)
      const first = venues.value[0]
      if (first?.coordinate) {
        center.value = { latitude: first.coordinate.latitude, longitude: first.coordinate.longitude }
      }
    } catch (err) {
      console.warn('路书数据加载失败:', err)
      uni.showToast({ title: '加载失败，下拉重试', icon: 'none' })
    }
  }
  if (userStore.weddingId && !weatherData.value && !weatherLoading.value) {
    await loadWeather()
  }
})
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $bg-color;
}

/* 到场助手 */
.arrival-pack {
  padding: 36rpx 32rpx 24rpx;
  border-bottom: 1rpx solid $border-color;
  background: $bg-color;
  flex-shrink: 0;
}
.arrival-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 22rpx;
}
.arrival-kicker {
  display: block;
  font-size: 18rpx;
  color: $color-primary;
  letter-spacing: 5rpx;
  margin-bottom: 8rpx;
  font-weight: 600;
}
.arrival-title {
  display: block;
  font-size: 38rpx;
  color: $text-primary;
  font-weight: 600;
}
.arrival-date {
  font-size: 24rpx;
  color: $text-muted;
  padding-top: 8rpx;
}
.arrival-card {
  display: flex;
  gap: 24rpx;
  align-items: center;
  padding: 28rpx;
  background: $text-primary;
  border-radius: $radius-lg;
  margin-bottom: 16rpx;
}
.arrival-main {
  flex: 1;
  min-width: 0;
}
.arrival-label {
  display: block;
  font-size: 22rpx;
  color: rgba(255,255,255,0.55);
  margin-bottom: 8rpx;
}
.arrival-name {
  display: block;
  font-size: 32rpx;
  color: #fff;
  font-weight: 600;
  margin-bottom: 8rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.arrival-address {
  display: block;
  font-size: 24rpx;
  color: rgba(255,255,255,0.72);
  line-height: 1.5;
}
.arrival-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  flex-shrink: 0;
}
.arrival-btn {
  width: 116rpx;
  height: 58rpx;
  line-height: 58rpx;
  border-radius: $radius-full;
  background: rgba(255,255,255,0.12);
  color: #fff;
  font-size: 24rpx;
  padding: 0;
}
.arrival-btn.primary {
  background: #fff;
  color: $text-primary;
}
.arrival-btn::after { border: none; }
.arrival-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}
.arrival-summary-item {
  padding: 20rpx 22rpx;
  background: $bg-muted;
  border-radius: $radius-md;
}
.summary-label {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  margin-bottom: 8rpx;
}
.summary-value {
  display: block;
  font-size: 26rpx;
  color: $text-primary;
  font-weight: 600;
}
.parking-note {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
  margin-top: 16rpx;
  padding: 18rpx 20rpx;
  border-radius: $radius-md;
  background: rgba(176,58,91,0.06);
  color: $color-primary;
  font-size: 24rpx;
  line-height: 1.5;
}
.parking-icon {
  margin-top: 4rpx;
  flex-shrink: 0;
}

/* Tab 栏 */
.tab-bar {
  display: flex;
  background: $bg-surface;
  border-bottom: 1rpx solid $border-color;
  flex-shrink: 0;
  padding: 0 16rpx;
}
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
  position: relative;
  gap: 6rpx;
}
.tab-label {
  font-size: 26rpx;
  color: $text-muted;
  font-weight: 500;
  transition: color 0.2s ease;
}
.tab-item.active .tab-label {
  color: $text-primary;
  font-weight: 600;
}
.tab-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: $color-primary;
  position: absolute;
  top: 16rpx;
  right: calc(50% - 24rpx);
}

.tab-content {
  flex: 1;
  overflow: hidden;
}

/* 地图 */
.map-container {
  flex: 1;
  min-height: 300rpx;
}
.map {
  width: 100%;
  height: 100%;
}

.venue-list {
  max-height: 45vh;
  padding: 24rpx;
  background: $bg-color;
}

.venue-card {
  background: $bg-surface;
  border-radius: $radius-lg;
  padding: 32rpx;
  margin-bottom: 16rpx;
  transition: all 0.2s ease;
  border: 1rpx solid transparent;
}
.venue-card.active {
  background: $text-primary;
  border-color: $text-primary;
}
.venue-card.active .venue-name,
.venue-card.active .venue-address,
.venue-card.active .venue-type,
.venue-card.active .venue-time {
  color: rgba(255,255,255,0.85);
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
.venue-time { font-size: 22rpx; color: $text-muted; }
.venue-name {
  display: block;
  font-size: 30rpx;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 4rpx;
}
.venue-address {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  margin-bottom: 16rpx;
}
.venue-actions {
  display: flex;
  gap: 12rpx;
}
.action-btn {
  padding: 10rpx 28rpx;
  font-size: 24rpx;
  border-radius: $radius-full;
  background: $bg-muted;
  color: $text-primary;
  border: none;
  line-height: 1.5;
}
.action-btn.primary {
  background: $color-primary;
  color: #fff;
}
.action-btn::after { border: none; }

/* 天气 */
.weather-banner {
  padding: 48rpx;
  background: linear-gradient(135deg, #fef9f3 0%, #fdf2eb 100%);
  margin: 24rpx;
  border-radius: $radius-lg;
}
.weather-main {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 20rpx;
}
.weather-icon {
  width: 88rpx;
  height: 88rpx;
  flex-shrink: 0;
}
.weather-temp {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}
.temp-max {
  font-size: 64rpx;
  font-weight: 300;
  color: $text-primary;
  font-variant-numeric: tabular-nums;
}
.temp-sep {
  font-size: 32rpx;
  color: $text-muted;
  font-weight: 300;
}
.temp-min {
  font-size: 32rpx;
  color: $text-muted;
  font-variant-numeric: tabular-nums;
}
.weather-desc {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
}
.weather-text {
  font-size: 32rpx;
  color: $text-primary;
  font-weight: 500;
}
.weather-date {
  font-size: 24rpx;
  color: $text-muted;
}
.weather-tags {
  margin-top: 16rpx;
}
.weather-tag {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  color: $text-secondary;
  background: rgba(255,255,255,0.7);
  padding: 8rpx 16rpx;
  border-radius: $radius-full;
}
.weather-tag-icon { flex-shrink: 0; }
.weather-tag.rain { color: #4a90d9; }

.weather-details {
  margin: 24rpx;
  background: $bg-surface;
  border-radius: $radius-lg;
  border: 1rpx solid $border-color;
  overflow: hidden;
}
.detail-row {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
}
.detail-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 16rpx;
}
.detail-text { font-size: 26rpx; color: $text-primary; }
.detail-divider { height: 1rpx; background: $border-color; margin: 0 32rpx; }

.weather-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
  gap: 20rpx;
}
.loading-spinner {
  width: 56rpx; height: 56rpx;
  border: 3rpx solid $border-color;
  border-top-color: $text-primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 26rpx; color: $text-muted; }

.api-note {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin: 24rpx;
  padding: 20rpx 24rpx;
  background: #FFF7E6;
  border-radius: $radius-lg;
}
.note-icon { flex-shrink: 0; }
.note-text { font-size: 22rpx; color: #B8860B; }

/* 交通 / 住宿 */
.info-tab {
  padding: 24rpx;
  overflow-y: auto;
}
.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-primary;
}
.section-date {
  font-size: 22rpx;
  color: $text-muted;
}

.info-card {
  background: $bg-surface;
  border-radius: $radius-lg;
  border: 1rpx solid $border-color;
  overflow: hidden;
  margin-bottom: 24rpx;
}
.info-row {
  display: flex;
  align-items: flex-start;
  padding: 32rpx;
  gap: 20rpx;
}
.info-icon-wrap {
  width: 52rpx;
  height: 52rpx;
  flex-shrink: 0;
}
.info-row-icon {
  width: 52rpx;
  height: 52rpx;
}
.info-content { flex: 1; }
.info-label {
  display: block;
  font-size: 22rpx;
  color: $text-muted;
  margin-bottom: 6rpx;
  letter-spacing: 2rpx;
}
.info-value {
  display: block;
  font-size: 28rpx;
  color: $text-primary;
  line-height: 1.5;
}
.info-divider { height: 1rpx; background: $border-color; margin: 0 32rpx; }

/* 住宿列表 */
.hotel-list { display: flex; flex-direction: column; gap: 16rpx; }
.hotel-card {
  background: $bg-surface;
  border-radius: $radius-lg;
  border: 1rpx solid $border-color;
  padding: 32rpx;
}
.hotel-name {
  display: block;
  font-size: 30rpx;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 8rpx;
}
.hotel-tags { display: flex; gap: 12rpx; margin: 8rpx 0; }
.hotel-tag {
  font-size: 20rpx;
  color: $text-secondary;
  background: $bg-muted;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}
.hotel-notes {
  display: block;
  font-size: 24rpx;
  color: $text-muted;
  margin-top: 8rpx;
}
.hotel-actions { margin-top: 20rpx; }
.hotel-btn {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 14rpx 32rpx;
  background: $text-primary;
  color: #fff;
  border-radius: $radius-full;
  font-size: 24rpx;
  border: none;
  line-height: 1;
}
.hotel-btn-icon {
  width: 28rpx;
  height: 28rpx;
}
.hotel-btn::after { border: none; }

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80rpx 0;
}
.empty-visual {
  display: block;
  width: 220rpx;
  height: 220rpx;
  margin: 0 auto 16rpx;
}
.empty-text {
  display: block;
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
  margin-bottom: 8rpx;
}
.empty-sub {
  display: block;
  font-size: 24rpx;
  color: $text-muted;
}

.tpl-champagne {
  background: #fbf7f1;
  .arrival-pack {
    background: #f7eee4;
  }
  .arrival-btn.primary,
  .action-btn.primary,
  .hotel-btn {
    background: #A4783B;
  }
}
.tpl-noir {
  background: #111;
  .arrival-pack,
  .venue-card,
  .info-card,
  .hotel-card,
  .weather-banner,
  .weather-details {
    background: #191919;
    border-color: rgba(201,169,110,0.16);
  }
  .arrival-title,
  .arrival-name,
  .summary-value,
  .venue-name,
  .section-title,
  .info-value,
  .hotel-name,
  .weather-text,
  .temp-max,
  .temp-min {
    color: #fff;
  }
  .arrival-date,
  .arrival-address,
  .summary-label,
  .venue-address,
  .section-date,
  .info-label,
  .hotel-notes {
    color: rgba(255,255,255,0.62);
  }
  .arrival-btn.primary,
  .action-btn.primary,
  .hotel-btn {
    background: $color-gold;
    color: #111;
  }
}
.tpl-garden {
  background: #f5f6ef;
  .arrival-pack {
    background: #eef2e7;
  }
  .arrival-btn.primary,
  .action-btn.primary,
  .hotel-btn {
    background: #506247;
  }
}
</style>
