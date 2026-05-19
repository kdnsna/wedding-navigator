<template>
  <view class="page" :class="preview.templateClass">
    <view class="preview-header">
      <text class="back-btn" @click="goBack">‹</text>
      <view class="header-main">
        <text class="page-kicker">TEMPLATE PREVIEW</text>
        <text class="page-title">{{ preview.template.name }}</text>
        <text class="page-sub">{{ preview.template.desc }}</text>
      </view>
      <button class="use-btn" @click="useTemplate">使用</button>
    </view>

    <scroll-view scroll-x class="mock-tabs">
      <view class="mock-tab-list">
        <view
          class="mock-tab"
          v-for="tab in tabs"
          :key="tab.id"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <text>{{ tab.name }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="phone-shell">
      <view class="phone-screen">
        <view v-if="activeTab === 'home'" class="mock-page mock-home">
          <view class="mock-hero">
            <image class="mock-cover-bg" src="/static/visuals/default-cover.png" mode="aspectFill" />
            <image class="mock-cover" src="/static/visuals/default-cover.png" mode="aspectFit" />
            <view class="mock-hero-overlay" />
            <view class="mock-hero-text">
              <text class="mock-kicker">{{ preview.template.kicker }}</text>
              <text class="mock-names">{{ preview.couple.groom }} & {{ preview.couple.bride }}</text>
              <text class="mock-date">{{ formatDate(preview.date) }}</text>
              <text class="mock-cover-line">{{ preview.coverLine }}</text>
            </view>
          </view>
          <view class="mock-section">
            <view class="mock-section-head">
              <text class="section-kicker">GUEST PACK</text>
              <text class="section-title">宾客行动台</text>
            </view>
            <view class="action-card strong">
              <view>
                <text class="card-label">主场地</text>
                <text class="card-title">{{ preview.venueName }}</text>
                <text class="card-sub">{{ preview.address }}</text>
              </view>
              <text class="card-pill">导航</text>
            </view>
            <view class="mini-grid">
              <view class="mini-card">
                <text class="card-label">婚礼时间</text>
                <text class="mini-value">{{ preview.time }}</text>
              </view>
              <view class="mini-card">
                <text class="card-label">最近流程</text>
                <text class="mini-value">{{ preview.timeline[0]?.title }}</text>
              </view>
            </view>
          </view>
        </view>

        <view v-if="activeTab === 'guide'" class="mock-page">
          <view class="mock-title-block">
            <text class="section-kicker">{{ preview.template.shortName }} ARRIVAL PACK</text>
            <text class="section-title">到场助手</text>
            <text class="section-desc">{{ preview.transport }}</text>
          </view>
          <view class="action-card strong">
            <view>
              <text class="card-label">主场地</text>
              <text class="card-title">{{ preview.venueName }}</text>
              <text class="card-sub">{{ preview.address }}</text>
            </view>
            <text class="card-pill">电话</text>
          </view>
          <view class="weather-card">
            <image class="visual-icon" src="/static/visuals/icon-weather-sunny.svg" mode="aspectFit" />
            <view>
              <text class="card-title">{{ preview.weather }}</text>
              <text class="card-sub">适合提前到场合影，请预留停车时间</text>
            </view>
          </view>
          <view class="info-list">
            <view class="info-row" v-for="tip in preview.guide.transportation.route_tips" :key="tip">
              <text>{{ tip }}</text>
            </view>
          </view>
        </view>

        <view v-if="activeTab === 'timeline'" class="mock-page">
          <view class="mock-title-block">
            <text class="section-kicker">WEDDING DAY</text>
            <text class="section-title">流程时间线</text>
            <text class="section-desc">默认展示普通宾客，也可切换父母、伴郎伴娘、摄影司仪</text>
          </view>
          <view class="role-row">
            <text class="role-pill active">普通宾客</text>
            <text class="role-pill">双方父母</text>
            <text class="role-pill">摄影司仪</text>
          </view>
          <view class="timeline-list">
            <view class="timeline-row" v-for="event in preview.timeline.slice(0, 5)" :key="event.id">
              <text class="timeline-time">{{ event.time }}</text>
              <view class="timeline-dot" />
              <view class="timeline-content">
                <text class="card-title">{{ event.title }}</text>
                <text class="card-sub">{{ event.notes || '以现场安排为准' }}</text>
              </view>
            </view>
          </view>
        </view>

        <view v-if="activeTab === 'rsvp'" class="mock-page">
          <view class="rsvp-brief">
            <text class="section-kicker">{{ preview.template.shortName }} RSVP CARD</text>
            <text class="brief-title">{{ preview.couple.groom }} & {{ preview.couple.bride }}</text>
            <view class="brief-grid">
              <view>
                <text class="card-label">DATE</text>
                <text class="brief-value">{{ formatDate(preview.date) }}</text>
              </view>
              <view>
                <text class="card-label">TIME</text>
                <text class="brief-value">{{ preview.time }}</text>
              </view>
            </view>
          </view>
          <view class="form-mock">
            <text class="form-label">姓名</text>
            <view class="form-line">{{ preview.rsvpName }}</view>
            <text class="form-label">是否出席</text>
            <view class="choice-row">
              <text class="choice active">出席</text>
              <text class="choice">待定</text>
              <text class="choice">无法出席</text>
            </view>
            <text class="form-label">同行人数</text>
            <view class="stepper-mock">-  2  +</view>
          </view>
        </view>

        <view v-if="activeTab === 'blessing'" class="mock-page">
          <view class="mock-title-block">
            <text class="section-kicker">BLESSING WALL</text>
            <text class="section-title">祝福墙</text>
            <text class="section-desc">{{ preview.stats.blessings }} 条祝福会在这里展示</text>
          </view>
          <view class="blessing-input">
            <text class="card-sub">愿你们新婚快乐，日日有光。</text>
            <text class="send-pill">发送</text>
          </view>
          <view class="blessing-card" v-for="(item, index) in preview.blessings" :key="item">
            <text class="card-title">{{ index === 0 ? '好友代表' : '亲友' }}</text>
            <text class="card-sub">{{ item }}</text>
          </view>
        </view>

        <view v-if="activeTab === 'album'" class="mock-page">
          <view class="mock-title-block">
            <text class="section-kicker">PHOTO STORY</text>
            <text class="section-title">{{ preview.template.albumMood }}</text>
            <text class="section-desc">{{ preview.template.photoMood }}</text>
          </view>
          <view class="album-grid">
            <view class="photo-tile" v-for="(item, index) in preview.gallery" :key="item" :class="'tile-' + index">
              <text>{{ item }}</text>
            </view>
          </view>
        </view>

        <view v-if="activeTab === 'poster'" class="mock-page">
          <view class="poster-mock">
            <image class="poster-bg" src="/static/visuals/default-cover.png" mode="aspectFill" />
            <view class="poster-overlay" />
            <view class="poster-content">
              <text class="mock-kicker">WEDDING INVITATION</text>
              <text class="poster-names">{{ preview.couple.groom }} & {{ preview.couple.bride }}</text>
              <text class="mock-date">{{ formatDate(preview.date) }}</text>
              <view class="qr-mock">
                <text>小程序码</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="template-summary">
      <view class="summary-item">
        <text class="summary-num">{{ preview.stats.views }}</text>
        <text class="summary-label">示例浏览</text>
      </view>
      <view class="summary-item">
        <text class="summary-num">{{ preview.stats.rsvp }}</text>
        <text class="summary-label">回执样例</text>
      </view>
      <view class="summary-item">
        <text class="summary-num">{{ preview.stats.blessings }}</text>
        <text class="summary-label">祝福样例</text>
      </view>
    </view>

    <view class="bottom-actions">
      <button class="bottom-btn primary" @click="useTemplate">使用此模板</button>
      <button class="bottom-btn" @click="goBack">返回选择</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { buildTemplatePreviewData, normalizeTemplateId } from '@/utils/templates.js'

const templateId = ref('rose-couture')
const activeTab = ref('home')

const tabs = [
  { id: 'home', name: '首页' },
  { id: 'guide', name: '路书' },
  { id: 'timeline', name: '流程' },
  { id: 'rsvp', name: '回执' },
  { id: 'blessing', name: '祝福' },
  { id: 'album', name: '相册' },
  { id: 'poster', name: '海报' }
]

const preview = computed(() => buildTemplatePreviewData(templateId.value))

function formatDate(date) {
  if (!date) return '日期待定'
  const d = new Date(date)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.redirectTo({ url: '/pages-owner/wizard/index' })
  }
}

function useTemplate() {
  uni.setStorageSync('pending_template_id', templateId.value)
  uni.showToast({ title: '已选择模板', icon: 'success' })
  setTimeout(goBack, 260)
}

onLoad((options = {}) => {
  templateId.value = normalizeTemplateId(decodeURIComponent(options.id || 'rose-couture'))
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: var(--theme-page, $bg-color);
  color: var(--theme-ink, $text-primary);
  padding-bottom: calc(168rpx + env(safe-area-inset-bottom));
}

.preview-header {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: $page-header-top $page-gutter 24rpx;
}
.back-btn {
  width: 56rpx;
  height: 56rpx;
  line-height: 48rpx;
  font-size: 48rpx;
  color: var(--theme-ink, $text-primary);
  flex-shrink: 0;
}
.header-main {
  flex: 1;
  min-width: 0;
}
.page-kicker {
  display: block;
  font-size: 20rpx;
  color: var(--theme-accent, $color-primary);
  margin-bottom: 8rpx;
}
.page-title {
  display: block;
  font-size: 42rpx;
  font-weight: 600;
  color: var(--theme-ink, $text-primary);
  margin-bottom: 8rpx;
}
.page-sub {
  display: block;
  font-size: 24rpx;
  line-height: 1.5;
  color: var(--theme-muted, $text-muted);
}
.use-btn {
  width: 120rpx;
  height: $control-height-sm;
  line-height: $control-height-sm;
  border-radius: $radius-full;
  background: var(--theme-accent, $text-primary);
  color: var(--theme-on-accent, #fff);
  font-size: 26rpx;
  padding: 0;
  flex-shrink: 0;
}
.use-btn::after { border: none; }

.mock-tabs {
  width: 100%;
  white-space: nowrap;
}
.mock-tab-list {
  display: inline-flex;
  gap: 12rpx;
  padding: 8rpx $page-gutter 24rpx;
}
.mock-tab {
  height: $control-height-sm;
  padding: 0 28rpx;
  border-radius: $radius-full;
  background: var(--theme-elevated, $bg-muted);
  color: var(--theme-muted, $text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}
.mock-tab.active {
  background: var(--theme-accent, $text-primary);
  color: var(--theme-on-accent, #fff);
}

.phone-shell {
  margin: 0 $page-gutter;
  padding: 18rpx;
  border-radius: 36rpx;
  background: var(--theme-ink, $text-primary);
  box-shadow: $shadow-md;
}
.phone-screen {
  min-height: 880rpx;
  border-radius: 24rpx;
  overflow: hidden;
  background: var(--theme-page, $bg-color);
}
.mock-page {
  min-height: 880rpx;
  padding: 28rpx;
  box-sizing: border-box;
}
.mock-home {
  padding: 0;
}

.mock-hero {
  position: relative;
  height: 470rpx;
  overflow: hidden;
  background: var(--theme-hero-bg, #fcf6f0);
}
.mock-cover-bg,
.mock-cover,
.mock-hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
}
.mock-cover-bg {
  transform: scale(1.12);
  filter: blur(24rpx) saturate(0.9);
  opacity: var(--theme-default-cover-opacity, 0.76);
}
.mock-cover {
  z-index: 1;
}
.mock-hero-overlay {
  z-index: 2;
  background: var(--theme-hero-overlay);
}
.mock-hero-text {
  position: absolute;
  z-index: 3;
  left: 28rpx;
  right: 28rpx;
  bottom: 42rpx;
  text-align: center;
}
.mock-kicker {
  display: block;
  font-size: 18rpx;
  color: rgba(255,255,255,0.68);
  margin-bottom: 12rpx;
}
.mock-names {
  display: block;
  font-size: 42rpx;
  font-weight: 600;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 10rpx;
}
.mock-date,
.mock-cover-line {
  display: block;
  font-size: 22rpx;
  color: rgba(255,255,255,0.82);
  line-height: 1.45;
}

.mock-section {
  padding: 28rpx;
}
.mock-section-head,
.mock-title-block {
  margin-bottom: 22rpx;
}
.section-kicker {
  display: block;
  font-size: 18rpx;
  color: var(--theme-accent, $color-primary);
  margin-bottom: 8rpx;
}
.section-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  color: var(--theme-ink, $text-primary);
}
.section-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.55;
  color: var(--theme-muted, $text-muted);
}

.action-card,
.weather-card,
.blessing-card,
.rsvp-brief,
.form-mock,
.info-list {
  border-radius: $card-radius;
  background: var(--theme-surface, $bg-surface);
  border: 1rpx solid var(--theme-border, $border-color);
  padding: 24rpx;
  margin-bottom: 18rpx;
}
.action-card {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
}
.action-card.strong {
  background: var(--theme-strong-bg, $text-primary);
  border-color: var(--theme-strong-border, transparent);
}
.card-label {
  display: block;
  font-size: 20rpx;
  color: var(--theme-muted, $text-muted);
  margin-bottom: 8rpx;
}
.strong .card-label,
.strong .card-sub {
  color: var(--theme-strong-muted, rgba(255,255,255,0.68));
}
.card-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--theme-ink, $text-primary);
  line-height: 1.35;
}
.strong .card-title {
  color: var(--theme-strong-ink, #fff);
}
.card-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 23rpx;
  line-height: 1.45;
  color: var(--theme-muted, $text-muted);
}
.card-pill,
.send-pill {
  align-self: center;
  flex-shrink: 0;
  padding: 12rpx 22rpx;
  border-radius: $radius-full;
  background: var(--theme-accent, $color-primary);
  color: var(--theme-on-accent, #fff);
  font-size: 22rpx;
}
.mini-grid,
.brief-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}
.mini-card {
  padding: 22rpx;
  border-radius: $card-radius;
  background: var(--theme-elevated, $bg-muted);
}
.mini-value,
.brief-value {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--theme-ink, $text-primary);
}

.weather-card {
  display: flex;
  align-items: center;
  gap: 18rpx;
  background: var(--theme-panel-gradient);
}
.visual-icon {
  width: 64rpx;
  height: 64rpx;
}
.info-row {
  padding: 18rpx 0;
  border-bottom: 1rpx solid var(--theme-border, $border-color);
  font-size: 24rpx;
  line-height: 1.45;
  color: var(--theme-muted, $text-muted);
}
.info-row:last-child {
  border-bottom: none;
}

.role-row,
.choice-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 22rpx;
  overflow: hidden;
}
.role-pill,
.choice {
  padding: 12rpx 18rpx;
  border-radius: $radius-full;
  background: var(--theme-elevated, $bg-muted);
  color: var(--theme-muted, $text-muted);
  font-size: 22rpx;
  white-space: nowrap;
}
.role-pill.active,
.choice.active {
  background: var(--theme-accent, $color-primary);
  color: var(--theme-on-accent, #fff);
}
.timeline-row {
  display: grid;
  grid-template-columns: 76rpx 20rpx 1fr;
  gap: 18rpx;
  align-items: start;
  padding: 16rpx 0;
}
.timeline-time {
  font-size: 22rpx;
  color: var(--theme-accent, $color-primary);
  font-weight: 600;
}
.timeline-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: var(--theme-accent, $color-primary);
  margin-top: 10rpx;
}
.timeline-content {
  padding-bottom: 18rpx;
  border-bottom: 1rpx solid var(--theme-border, $border-color);
}

.rsvp-brief {
  background: var(--theme-strong-bg, $text-primary);
  border-color: var(--theme-strong-border, transparent);
}
.brief-title {
  display: block;
  font-size: 34rpx;
  color: var(--theme-strong-ink, #fff);
  font-weight: 600;
  margin-bottom: 20rpx;
}
.rsvp-brief .brief-value,
.rsvp-brief .card-label {
  color: var(--theme-strong-muted, rgba(255,255,255,0.72));
}
.form-label {
  display: block;
  margin: 20rpx 0 10rpx;
  font-size: 22rpx;
  color: var(--theme-muted, $text-muted);
}
.form-line,
.stepper-mock {
  min-height: 68rpx;
  border-bottom: 1rpx solid var(--theme-border, $border-color);
  color: var(--theme-ink, $text-primary);
  font-size: 28rpx;
}

.blessing-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18rpx;
  padding: 24rpx;
  margin-bottom: 18rpx;
  border-radius: $card-radius;
  background: var(--theme-elevated, $bg-muted);
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}
.photo-tile {
  min-height: 190rpx;
  border-radius: $card-radius;
  padding: 18rpx;
  display: flex;
  align-items: flex-end;
  background: var(--theme-panel-gradient);
  color: var(--theme-ink, $text-primary);
  font-size: 24rpx;
  font-weight: 600;
}
.photo-tile.tile-1 {
  min-height: 260rpx;
}
.photo-tile.tile-2 {
  grid-column: span 2;
  min-height: 160rpx;
}

.poster-mock {
  position: relative;
  height: 780rpx;
  border-radius: $card-radius;
  overflow: hidden;
  background: var(--theme-hero-bg, #111);
}
.poster-bg,
.poster-overlay,
.poster-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
}
.poster-bg {
  filter: blur(10rpx) saturate(0.92);
  opacity: 0.9;
}
.poster-overlay {
  background: var(--theme-hero-overlay);
}
.poster-content {
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56rpx;
  box-sizing: border-box;
  text-align: center;
}
.poster-names {
  display: block;
  color: #fff;
  font-size: 44rpx;
  font-weight: 600;
  margin: 28rpx 0 16rpx;
}
.qr-mock {
  width: 150rpx;
  height: 150rpx;
  margin-top: 70rpx;
  border-radius: 12rpx;
  background: rgba(255,255,255,0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-size: 22rpx;
}

.template-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin: 24rpx $page-gutter 0;
}
.summary-item {
  padding: 22rpx 10rpx;
  text-align: center;
  border-radius: $card-radius;
  background: var(--theme-surface, $bg-surface);
  border: 1rpx solid var(--theme-border, $border-color);
}
.summary-num {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: var(--theme-ink, $text-primary);
}
.summary-label {
  display: block;
  margin-top: 6rpx;
  font-size: 20rpx;
  color: var(--theme-muted, $text-muted);
}

.bottom-actions {
  position: fixed;
  left: $page-gutter;
  right: $page-gutter;
  bottom: calc(32rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 16rpx;
  z-index: 20;
}
.bottom-btn {
  flex: 1;
  height: $control-height;
  line-height: $control-height;
  border-radius: $radius-full;
  background: var(--theme-surface, $bg-surface);
  border: 1rpx solid var(--theme-border, $border-color);
  color: var(--theme-ink, $text-primary);
  font-size: 28rpx;
  padding: 0;
}
.bottom-btn.primary {
  background: var(--theme-accent, $text-primary);
  border-color: var(--theme-accent, $text-primary);
  color: var(--theme-on-accent, #fff);
}
.bottom-btn::after { border: none; }
</style>
