<template>
  <view class="page">
    <!-- 模板选择 -->
    <view class="section">
      <text class="section-title">模板风格</text>
      <scroll-view class="template-scroll" scroll-x>
        <view
          class="template-item"
          v-for="tpl in templates"
          :key="tpl.id"
          :class="{ active: form.template === tpl.id }"
          @click="form.template = tpl.id"
        >
          <view class="template-preview" :style="{ background: tpl.color }">
            <text class="template-text">{{ tpl.name }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 文案编辑 -->
    <view class="section">
      <text class="section-title">请柬文案</text>
      <view class="form-card">
        <view class="form-group">
          <text class="form-label">主标题</text>
          <input class="form-input" v-model="form.title" placeholder="请输入主标题" />
        </view>
        <view class="form-group">
          <text class="form-label">正文</text>
          <textarea class="form-textarea" v-model="form.mainText" placeholder="请输入请柬正文" maxlength="500" />
        </view>
        <view class="form-group">
          <text class="form-label">副标题</text>
          <input class="form-input" v-model="form.subText" placeholder="请输入副标题" />
        </view>
        <view class="form-group">
          <text class="form-label">爱情故事</text>
          <textarea class="form-textarea" v-model="form.story" placeholder="简述你们的爱情故事" maxlength="1000" />
        </view>
      </view>
    </view>

    <!-- 新人信息 -->
    <view class="section">
      <text class="section-title">新人信息</text>
      <view class="form-card">
        <view class="form-group">
          <text class="form-label">新郎姓名</text>
          <input class="form-input" v-model="form.groomName" placeholder="新郎姓名" />
        </view>
        <view class="form-group">
          <text class="form-label">新郎手机号</text>
          <input class="form-input" v-model="form.groomPhone" placeholder="新郎手机号" type="number" />
        </view>
        <view class="form-group">
          <text class="form-label">新娘姓名</text>
          <input class="form-input" v-model="form.brideName" placeholder="新娘姓名" />
        </view>
        <view class="form-group">
          <text class="form-label">新娘手机号</text>
          <input class="form-input" v-model="form.bridePhone" placeholder="新娘手机号" type="number" />
        </view>
      </view>
    </view>

    <!-- 婚礼信息 -->
    <view class="section">
      <text class="section-title">婚礼信息</text>
      <view class="form-card">
        <view class="form-group">
          <text class="form-label">婚礼日期</text>
          <picker mode="date" :value="form.date" @change="onDateChange">
            <view class="picker-value">{{ form.date || '请选择日期' }}</view>
          </picker>
        </view>
        <view class="form-group">
          <text class="form-label">仪式时间</text>
          <picker mode="time" :value="form.time" @change="onTimeChange">
            <view class="picker-value">{{ form.time || '请选择时间' }}</view>
          </picker>
        </view>
        <view class="form-group">
          <text class="form-label">场地名称</text>
          <input class="form-input" v-model="form.venueName" placeholder="场地名称" />
        </view>
        <view class="form-group">
          <text class="form-label">场地地址</text>
          <input class="form-input" v-model="form.venueAddress" placeholder="详细地址" />
        </view>
      </view>
    </view>

    <!-- 功能开关 -->
    <view class="section">
      <text class="section-title">功能开关</text>
      <view class="form-card">
        <view class="switch-row">
          <text class="switch-label">显示倒计时</text>
          <switch :checked="form.showCountdown" @change="form.showCountdown = $event.detail.value" color="#C41E3A" />
        </view>
        <view class="switch-row">
          <text class="switch-label">显示RSVP</text>
          <switch :checked="form.showRSVP" @change="form.showRSVP = $event.detail.value" color="#C41E3A" />
        </view>
        <view class="switch-row">
          <text class="switch-label">显示祝福墙</text>
          <switch :checked="form.showBlessing" @change="form.showBlessing = $event.detail.value" color="#C41E3A" />
        </view>
        <view class="switch-row">
          <text class="switch-label">显示流程</text>
          <switch :checked="form.showTimeline" @change="form.showTimeline = $event.detail.value" color="#C41E3A" />
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="actions">
      <button class="save-btn" @click="saveInvitation">
        <text>保存并发布</text>
      </button>
      <button class="preview-btn" @click="previewInvitation">
        <text>预览效果</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { showSuccess, showError } from '@/utils/index.js'

const store = useWeddingStore()
const userStore = useUserStore()

const templates = [
  { id: 'classic', name: '传统红金', color: '#C41E3A' },
  { id: 'modern', name: '现代简约', color: '#E91E63' },
  { id: 'luxury', name: '轻奢金棕', color: '#8B6914' }
]

const form = ref({
  template: 'classic',
  title: '',
  mainText: '',
  subText: '',
  story: '',
  groomName: '',
  groomPhone: '',
  brideName: '',
  bridePhone: '',
  date: '',
  time: '',
  venueName: '',
  venueAddress: '',
  showCountdown: true,
  showRSVP: true,
  showBlessing: true,
  showTimeline: true
})

function onDateChange(e) {
  form.value.date = e.detail.value
}
function onTimeChange(e) {
  form.value.time = e.detail.value
}

function loadFromStore() {
  const inv = store.invitation
  if (!inv) return
  form.value.template = inv.template || 'classic'
  form.value.title = inv.content?.title || ''
  form.value.mainText = inv.content?.main_text || ''
  form.value.subText = inv.content?.sub_text || ''
  form.value.story = inv.content?.story || ''
  form.value.groomName = inv.couple?.groom?.name || ''
  form.value.groomPhone = inv.couple?.groom?.phone || ''
  form.value.brideName = inv.couple?.bride?.name || ''
  form.value.bridePhone = inv.couple?.bride?.phone || ''
  form.value.date = inv.wedding?.date || ''
  form.value.time = inv.wedding?.time || ''
  form.value.venueName = inv.wedding?.venue_name || ''
  form.value.venueAddress = inv.wedding?.venue_address || ''
  form.value.showCountdown = inv.features?.show_countdown !== false
  form.value.showRSVP = inv.features?.show_rsvp !== false
  form.value.showBlessing = inv.features?.show_blessing !== false
  form.value.showTimeline = inv.features?.show_timeline !== false
}

async function saveInvitation() {
  try {
    uni.showLoading({ title: '保存中...', mask: true })

    const invitationData = {
      template: form.value.template,
      content: {
        title: form.value.title,
        main_text: form.value.mainText,
        sub_text: form.value.subText,
        story: form.value.story
      },
      couple: {
        groom: { name: form.value.groomName, phone: form.value.groomPhone, photo: '' },
        bride: { name: form.value.brideName, phone: form.value.bridePhone, photo: '' }
      },
      wedding: {
        date: form.value.date,
        time: form.value.time,
        venue_name: form.value.venueName,
        venue_address: form.value.venueAddress
      },
      features: {
        show_countdown: form.value.showCountdown,
        show_rsvp: form.value.showRSVP,
        show_blessing: form.value.showBlessing,
        show_timeline: form.value.showTimeline
      }
    }

    store.updateInvitation(invitationData)

    // 更新本地存储
    const weddings = uni.getStorageSync('weddings') || {}
    if (weddings[userStore.weddingId]) {
      weddings[userStore.weddingId].invitation = {
        ...weddings[userStore.weddingId].invitation,
        ...invitationData
      }
      uni.setStorageSync('weddings', weddings)
    }

    showSuccess('保存成功')
  } catch (err) {
    showError('保存失败')
  } finally {
    uni.hideLoading()
  }
}

function previewInvitation() {
  uni.switchTab({ url: '/pages/index/index' })
}

onShow(() => {
  loadFromStore()
})
</script>

<style lang="scss" scoped>
.page {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 30rpx;
  padding-bottom: 160rpx;
}

.section {
  margin-bottom: 30rpx;
}
.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 20rpx;
}

/* 模板选择 */
.template-scroll {
  white-space: nowrap;
}
.template-item {
  display: inline-block;
  margin-right: 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
  border: 3rpx solid transparent;
}
.template-item.active {
  border-color: $color-primary;
}
.template-preview {
  width: 200rpx;
  height: 280rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.template-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
}

/* 表单卡片 */
.form-card {
  background: $bg-surface;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: $shadow-sm;
}
.form-group {
  margin-bottom: 24rpx;
}
.form-group:last-child {
  margin-bottom: 0;
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
.form-textarea {
  width: 100%;
  height: 160rpx;
  padding: 16rpx 20rpx;
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
  color: $text-primary;
  box-sizing: border-box;
}

/* 开关 */
.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid $border-light;
}
.switch-row:last-child {
  border-bottom: none;
}
.switch-label {
  font-size: 28rpx;
  color: $text-primary;
}

/* 底部按钮 */
.actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: $bg-surface;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.06);
}
.save-btn {
  flex: 2;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 12rpx;
  background: linear-gradient(135deg, $color-primary 0%, #E91E63 100%);
  color: #fff;
  font-size: 30rpx;
}
.preview-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 12rpx;
  background: $bg-muted;
  color: $text-primary;
  font-size: 30rpx;
}
.save-btn::after,
.preview-btn::after {
  border: none;
}
</style>
