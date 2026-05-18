<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">DASHBOARD</text>
      <text class="page-title">管理后台</text>
    </view>

    <!-- 婚礼信息 -->
    <view class="couple-bar">
      <view class="couple-meta">
        <text class="couple-name">{{ coupleName }}</text>
        <text class="couple-date">{{ formatDate(weddingDate) }}</text>
      </view>
      <view class="status-tag" :class="weddingStatus">{{ statusText }}</view>
    </view>

    <!-- 发布准备 -->
    <view class="readiness-card">
      <view class="readiness-head">
        <view>
          <text class="readiness-kicker">PUBLISH READY</text>
          <text class="readiness-title">发布准备度</text>
        </view>
        <text class="readiness-score">{{ checklist.percent }}%</text>
      </view>
      <view class="readiness-bar">
        <view class="readiness-fill" :style="{ width: checklist.percent + '%' }" />
      </view>
      <view class="readiness-summary">
        <text>{{ readinessSummary }}</text>
      </view>
      <view class="readiness-list">
        <view
          class="readiness-item"
          v-for="item in checklist.items"
          :key="item.key"
          @click="goToRoute(item.route)"
        >
          <view class="readiness-dot" :class="{ done: item.done }" />
          <view class="readiness-meta">
            <text class="readiness-item-title">{{ item.title }}</text>
            <text class="readiness-item-desc">{{ item.desc }}</text>
          </view>
          <text class="readiness-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 数据概览 -->
    <view class="stats-row">
      <view class="stat-item">
        <text class="stat-num">{{ stats.views }}</text>
        <text class="stat-label">浏览</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ stats.shares }}</text>
        <text class="stat-label">分享</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ stats.rsvp }}</text>
        <text class="stat-label">RSVP</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ stats.blessings }}</text>
        <text class="stat-label">祝福</text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-group">
      <view class="menu-item" @click="goTo('invitation/edit')">
        <text class="menu-title">婚书编辑</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goTo('album/manage')">
        <text class="menu-title">相册管理</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goTo('guide/edit')">
        <text class="menu-title">路书设置</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goTo('timeline/edit')">
        <text class="menu-title">流程编辑</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goTo('guests/manage')">
        <text class="menu-title">宾客管理</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goTo('blessing/manage')">
        <text class="menu-title">祝福管理</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goTo('share/index')">
        <text class="menu-title">分享设置</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="divider" />
      <view class="menu-item" @click="goTo('stats/index')">
        <text class="menu-title">数据统计</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-actions">
      <button class="action-btn primary" @click="previewWedding">预览效果</button>
      <button class="action-btn" @click="shareWedding">分享邀请</button>
    </view>

    <view class="danger-zone">
      <text class="danger-kicker">DANGER ZONE</text>
      <text class="danger-title">删除婚礼邀请</text>
      <text class="danger-desc">删除后当前邀请链接将失效，婚书、相册记录、路书、流程、宾客回执、祝福和统计数据都会移除。</text>
      <button class="danger-btn" :loading="deleting" :disabled="deleting" @click="confirmDeleteWedding">删除婚礼邀请</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { formatDate, showError, showSuccess } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { deleteWedding, fetchWedding, getStats } from '@/composables/useCloud.js'

const store = useWeddingStore()
const userStore = useUserStore()
const deleting = ref(false)

const coupleName = computed(() => store.coupleName)
const weddingDate = computed(() => store.weddingDate)
const weddingStatus = computed(() => store.wedding?.status || 'draft')
const checklist = computed(() => store.publishChecklist)
const readinessSummary = computed(() => {
  const left = checklist.value.total - checklist.value.doneCount
  if (checklist.value.ready) return '发布项已齐，可以放心分享给宾客'
  return `还差 ${left} 项，补齐后首页、回执、路线和分享链路会更完整`
})

const statusText = computed(() => {
  const map = { draft: '草稿', published: '已发布', ended: '已结束' }
  return map[weddingStatus.value] || '草稿'
})

const stats = computed(() => {
  const s = store.wedding?.stats || {}
  return {
    views: s.views || 0,
    shares: s.shares || 0,
    rsvp: s.rsvp_count || 0,
    blessings: s.blessing_count || 0
  }
})

function goTo(path) {
  uni.navigateTo({ url: `/pages-owner/${path}` })
}
function goToRoute(route) {
  uni.navigateTo({ url: route })
}
function previewWedding() {
  uni.switchTab({ url: '/pages/index/index' })
}
function shareWedding() {
  uni.navigateTo({ url: '/pages-owner/share/index' })
}
async function confirmDeleteWedding() {
  if (deleting.value) return
  if (!userStore.weddingId) {
    showError('当前没有可删除的婚礼邀请')
    return
  }
  const first = await showDeleteModal(
    '删除婚礼邀请',
    '这会删除婚礼资料、请柬、相册记录、路书、流程、宾客回执、祝福和统计数据。此操作不可恢复。',
    '继续删除'
  )
  if (!first) return

  const second = await showDeleteModal(
    '再次确认',
    '删除后宾客打开旧邀请链接将看不到这场婚礼。确认继续删除吗？',
    '确认删除'
  )
  if (!second) return

  const weddingId = userStore.weddingId
  try {
    deleting.value = true
    uni.showLoading({ title: '删除中...', mask: true })
    await deleteWedding(weddingId, 'DELETE')
    clearLocalWedding(weddingId)
    showSuccess('已删除婚礼邀请')
    uni.reLaunch({ url: '/pages-owner/wizard/index' })
  } catch (err) {
    console.error('删除婚礼邀请失败:', err)
    showError(err.message || '删除失败，请稍后重试')
  } finally {
    deleting.value = false
    uni.hideLoading()
  }
}

function showDeleteModal(title, content, confirmText) {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      confirmText,
      confirmColor: '#EA4335',
      cancelText: '取消',
      success: (res) => resolve(Boolean(res.confirm)),
      fail: () => resolve(false)
    })
  })
}

function clearLocalWedding(weddingId) {
  if (weddingId) {
    const weddings = uni.getStorageSync('weddings') || {}
    if (weddings[weddingId]) {
      delete weddings[weddingId]
      uni.setStorageSync('weddings', weddings)
    }
    uni.removeStorageSync(`invitation_${weddingId}`)
  }
  store.setWeddingData({})
  userStore.logout()
}

onShow(async () => {
  if (!useOwnerGuard()) return
  try {
    await fetchWedding(userStore.weddingId)
    const res = await getStats(userStore.weddingId)
    if (res?.stats) {
      store.wedding.stats = {
        views: res.stats.views || 0,
        shares: res.stats.shares || 0,
        rsvp_count: res.stats.rsvp?.total || 0,
        blessing_count: res.stats.blessings || 0,
        unique_viewers: res.stats.unique_viewers || 0
      }
    }
  } catch (err) {
    console.warn('管理后台数据加载失败:', err)
  }
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding-bottom: 60rpx;
}

/* 顶部标题 */
.page-header {
  padding: 60rpx 48rpx 24rpx;
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

/* 婚礼信息 */
.couple-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 48rpx 40rpx;
}
.couple-name {
  display: block;
  font-size: $font-h2;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 8rpx;
}
.couple-date {
  display: block;
  font-size: $font-body;
  color: $text-secondary;
}
.status-tag {
  padding: 8rpx 20rpx;
  border-radius: 6rpx;
  font-size: 22rpx;
  background: $bg-muted;
  color: $text-secondary;
  font-weight: 500;
}
.status-tag.published {
  background: $color-success;
  color: #fff;
}

/* 发布准备 */
.readiness-card {
  margin: 0 48rpx 40rpx;
  padding: 32rpx;
  border-radius: $radius-lg;
  background: $text-primary;
  color: #fff;
}
.readiness-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 24rpx;
}
.readiness-kicker {
  display: block;
  font-size: 18rpx;
  color: rgba(255,255,255,0.55);
  letter-spacing: 5rpx;
  margin-bottom: 8rpx;
}
.readiness-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
}
.readiness-score {
  font-size: 48rpx;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.readiness-bar {
  height: 8rpx;
  border-radius: 4rpx;
  background: rgba(255,255,255,0.16);
  overflow: hidden;
  margin-bottom: 22rpx;
}
.readiness-fill {
  height: 100%;
  border-radius: 4rpx;
  background: $color-primary-light;
  transition: width 0.45s ease;
}
.readiness-summary {
  padding: 18rpx 22rpx;
  margin-bottom: 14rpx;
  border-radius: $radius-lg;
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.78);
  font-size: 24rpx;
  line-height: 1.45;
}
.readiness-list {
  display: flex;
  flex-direction: column;
}
.readiness-item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 20rpx 0;
  border-top: 1rpx solid rgba(255,255,255,0.08);
}
.readiness-dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255,255,255,0.36);
  flex-shrink: 0;
}
.readiness-dot.done {
  background: $color-success;
  border-color: $color-success;
}
.readiness-meta {
  flex: 1;
  min-width: 0;
}
.readiness-item-title {
  display: block;
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
  margin-bottom: 4rpx;
}
.readiness-item-desc {
  display: block;
  font-size: 22rpx;
  color: rgba(255,255,255,0.62);
  line-height: 1.4;
}
.readiness-arrow {
  color: rgba(255,255,255,0.45);
  font-size: 34rpx;
}

/* 数据概览 */
.stats-row {
  display: flex;
  padding: 0 48rpx;
  margin-bottom: 48rpx;
}
.stat-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
}
.stat-num {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: $text-primary;
  font-variant-numeric: tabular-nums;
  margin-bottom: 8rpx;
}
.stat-label {
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 2rpx;
}

/* 功能菜单 */
.menu-group {
  margin: 0 48rpx;
  background: $bg-surface;
  border-radius: $radius-lg;
  overflow: hidden;
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx 28rpx;
}
.menu-item:active {
  background: $bg-muted;
}
.menu-title {
  flex: 1;
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
}
.menu-arrow {
  font-size: 28rpx;
  color: $text-muted;
}

.divider {
  height: 1rpx;
  background: $border-color;
  margin: 0 28rpx;
}

/* 底部操作 */
.bottom-actions {
  padding: 48rpx;
  display: flex;
  gap: 16rpx;
}
.action-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: $radius-full;
  background: $bg-muted;
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
  transition: opacity 0.2s ease;
}
.action-btn::after { border: none; }
.action-btn:active { opacity: 0.8; }
.action-btn.primary {
  background: $text-primary;
  color: #fff;
}

.danger-zone {
  margin: 0 48rpx 48rpx;
  padding: 30rpx;
  border-radius: $radius-lg;
  border: 1rpx solid rgba(234,67,53,0.24);
  background: rgba(234,67,53,0.045);
}
.danger-kicker {
  display: block;
  font-size: 18rpx;
  color: rgba(234,67,53,0.72);
  letter-spacing: 5rpx;
  margin-bottom: 10rpx;
}
.danger-title {
  display: block;
  font-size: 30rpx;
  color: #9F2D26;
  font-weight: 600;
  margin-bottom: 10rpx;
}
.danger-desc {
  display: block;
  font-size: 24rpx;
  color: $text-secondary;
  line-height: 1.55;
  margin-bottom: 24rpx;
}
.danger-btn {
  height: 82rpx;
  line-height: 82rpx;
  border-radius: $radius-full;
  background: #EA4335;
  color: #fff;
  font-size: 28rpx;
  font-weight: 500;
}
.danger-btn::after { border: none; }
.danger-btn[disabled] {
  opacity: 0.62;
}
</style>
