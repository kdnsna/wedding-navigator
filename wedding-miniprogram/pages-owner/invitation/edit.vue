<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-tag">INVITATION</text>
      <text class="page-title">婚书编辑</text>
    </view>

    <!-- 模板选择 -->
    <view class="section">
      <text class="section-label">模板风格</text>
      <scroll-view scroll-x class="template-scroll">
        <view
          class="template-item"
          v-for="tpl in templates"
          :key="tpl.id"
          :class="{ active: form.template === tpl.id }"
          @click="form.template = tpl.id"
        >
          <view class="template-preview" :style="{ background: tpl.preview }">
            <text class="template-kicker">{{ tpl.kicker }}</text>
            <text class="template-text">{{ tpl.shortName }}</text>
          </view>
          <text class="template-desc">{{ tpl.copy }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 邀请文案 -->
    <view class="section">
      <text class="section-label">邀请文案</text>
      <textarea
        class="form-textarea"
        v-model="form.content"
        placeholder="请输入邀请文案"
        maxlength="500"
      />
    </view>

    <!-- 新人信息 -->
    <view class="section">
      <text class="section-label">新人信息</text>
      <view class="form-row">
        <view class="form-col">
          <text class="form-sub-label">新郎</text>
          <input class="form-input" v-model="form.groomName" placeholder="姓名" />
        </view>
        <view class="form-col">
          <text class="form-sub-label">新娘</text>
          <input class="form-input" v-model="form.brideName" placeholder="姓名" />
        </view>
      </view>
    </view>

    <!-- 婚礼信息 -->
    <view class="section">
      <text class="section-label">婚礼信息</text>
      <view class="form-group">
        <text class="form-sub-label">日期</text>
        <picker mode="date" :value="form.date" @change="onDateChange">
          <view class="picker-value">{{ form.date || '请选择日期' }}</view>
        </picker>
      </view>
      <view class="form-group">
        <text class="form-sub-label">时间</text>
        <picker mode="time" :value="form.time" @change="onTimeChange">
          <view class="picker-value">{{ form.time || '请选择时间' }}</view>
        </picker>
      </view>
      <view class="form-group">
        <text class="form-sub-label">场地</text>
        <input class="form-input" v-model="form.venueName" placeholder="场地名称" />
      </view>
    </view>

    <!-- 功能开关 -->
    <view class="section">
      <text class="section-label">显示设置</text>
      <view class="switch-list">
        <view class="switch-item">
          <text class="switch-label">显示倒计时</text>
          <switch :checked="form.showCountdown" @change="form.showCountdown = $event.detail.value" color="#1A1A1A" />
        </view>
        <view class="switch-item">
          <text class="switch-label">显示RSVP</text>
          <switch :checked="form.showRsvp" @change="form.showRsvp = $event.detail.value" color="#1A1A1A" />
        </view>
        <view class="switch-item">
          <text class="switch-label">显示祝福墙</text>
          <switch :checked="form.showBlessing" @change="form.showBlessing = $event.detail.value" color="#1A1A1A" />
        </view>
        <view class="switch-item">
          <text class="switch-label">显示流程</text>
          <switch :checked="form.showTimeline" @change="form.showTimeline = $event.detail.value" color="#1A1A1A" />
        </view>
      </view>
    </view>

    <!-- 背景音乐 -->
    <view class="section">
      <text class="section-label">背景音乐</text>
      <view class="switch-item">
        <text class="switch-label">开启背景音乐</text>
        <switch :checked="form.bgMusicEnabled" @change="form.bgMusicEnabled = $event.detail.value" color="#1A1A1A" />
      </view>
      <view class="music-presets" v-if="form.bgMusicEnabled">
        <view
          class="music-item"
          v-for="music in musicPresets"
          :key="music.id"
          :class="{ active: form.bgMusicId === music.id }"
          @click="selectMusic(music)"
        >
          <image
            class="visual-icon-sm music-icon"
            :src="form.bgMusicId === music.id ? '/static/visuals/icon-speaker.png' : '/static/visuals/icon-music.png'"
            mode="aspectFit"
          />
          <text class="music-name">{{ music.name }}</text>
        </view>
      </view>
      <view class="music-tip" v-if="form.bgMusicEnabled">
        <text>提示：宾客进入首页后，需点击页面任意位置后音乐才会自动播放</text>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-actions">
      <button class="action-btn primary" @click="saveInvitation">保存</button>
      <button class="action-btn" @click="previewInvitation">预览</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useWeddingStore } from '@/stores/wedding.js'
import { useUserStore } from '@/stores/user.js'
import { showSuccess, showError } from '@/utils/index.js'
import { useOwnerGuard } from '@/composables/useOwnerGuard.js'
import { updateWedding } from '@/composables/useCloud.js'
import { WEDDING_TEMPLATES, normalizeTemplateId } from '@/utils/templates.js'

const store = useWeddingStore()
const userStore = useUserStore()

const templates = WEDDING_TEMPLATES

const musicPresets = [
  { id: 'piano-dream', name: '梦中的钢琴', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'gentle-love', name: '温柔爱意', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'eternal-vow', name: '永恒誓言', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
]

const form = ref({
  template: 'rose-couture',
  content: '',
  groomName: '',
  brideName: '',
  date: '',
  time: '',
  venueName: '',
  showCountdown: true,
  showRsvp: true,
  showBlessing: true,
  showTimeline: true,
  bgMusicEnabled: false,
  bgMusicId: '',
  bgMusicUrl: ''
})

function loadFromStore() {
  const inv = store.invitation || {}
  const wedding = store.wedding || {}
  form.value = {
    template: normalizeTemplateId(inv.template),
    content: inv.content?.main_text || '',
    groomName: inv.couple?.groom?.name || '',
    brideName: inv.couple?.bride?.name || '',
    date: wedding.basic_info?.date || '',
    time: wedding.basic_info?.time || '',
    venueName: inv.wedding?.venue_name || '',
    showCountdown: inv.features?.show_countdown !== false,
    showRsvp: inv.features?.show_rsvp !== false,
    showBlessing: inv.features?.show_blessing !== false,
    showTimeline: inv.features?.show_timeline !== false,
    bgMusicEnabled: inv.features?.bg_music_enabled || false,
    bgMusicId: inv.features?.bg_music_id || '',
    bgMusicUrl: inv.features?.bg_music_url || ''
  }
}

function selectMusic(music) {
  form.value.bgMusicId = music.id
  form.value.bgMusicUrl = music.url
}

function onDateChange(e) { form.value.date = e.detail.value }
function onTimeChange(e) { form.value.time = e.detail.value }

async function saveInvitation() {
  try {
    uni.showLoading({ title: '保存中...', mask: true })
    const invitationData = {
      template: form.value.template,
      content: {
        title: '婚礼请柬',
        main_text: form.value.content,
        sub_text: '',
        story: ''
      },
      couple: {
        groom: { name: form.value.groomName, phone: store.invitation?.couple?.groom?.phone || '', photo: '' },
        bride: { name: form.value.brideName, phone: store.invitation?.couple?.bride?.phone || '', photo: '' }
      },
      wedding: {
        date: form.value.date,
        time: form.value.time,
        venue_name: form.value.venueName
      },
      features: {
        show_countdown: form.value.showCountdown,
        show_rsvp: form.value.showRsvp,
        show_blessing: form.value.showBlessing,
        show_timeline: form.value.showTimeline,
        bg_music_enabled: form.value.bgMusicEnabled,
        bg_music_id: form.value.bgMusicId,
        bg_music_url: form.value.bgMusicUrl
      }
    }

    // 先同步云端
    await updateWedding(userStore.weddingId, 'invitations', invitationData)

    // 再更新本地 store + 缓存
    store.updateInvitation(invitationData)
    const weddings = uni.getStorageSync('weddings') || {}
    if (weddings[userStore.weddingId]) {
      weddings[userStore.weddingId].invitation = { ...weddings[userStore.weddingId].invitation, ...invitationData }
      uni.setStorageSync('weddings', weddings)
    }
    showSuccess('保存成功')
  } catch (err) {
    console.error('保存请柬失败:', err)
    showError(err.message || '保存失败')
  } finally {
    uni.hideLoading()
  }
}

function previewInvitation() {
  uni.switchTab({ url: '/pages/index/index' })
}

const inv = store.invitation || {}
onShow(() => { useOwnerGuard(); loadFromStore() })
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

/* 区块 */
.section {
  padding: 0 48rpx;
  margin-bottom: 48rpx;
}
.section-label {
  display: block;
  font-size: 26rpx;
  color: $text-muted;
  margin-bottom: 20rpx;
}

/* 模板选择 */
.template-scroll {
  white-space: nowrap;
}
.template-item {
  display: inline-block;
  margin-right: 20rpx;
  width: 220rpx;
  vertical-align: top;
  border-radius: $radius-lg;
  border: 3rpx solid transparent;
  padding: 10rpx;
  transition: all 0.2s ease;
}
.template-item.active {
  border-color: $text-primary;
  background: $bg-surface;
  box-shadow: 0 12rpx 34rpx rgba(0,0,0,0.08);
}
.template-preview {
  width: 200rpx;
  height: 240rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: $radius-lg;
  overflow: hidden;
  padding: 20rpx;
  box-sizing: border-box;
}
.template-kicker {
  display: block;
  font-size: 16rpx;
  color: rgba(255,255,255,0.72);
  letter-spacing: 3rpx;
  text-align: center;
  margin-bottom: 18rpx;
  white-space: normal;
}
.template-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
  text-align: center;
}
.template-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: $text-muted;
  line-height: 1.45;
  white-space: normal;
}

/* 表单 */
.form-textarea {
  width: 100%;
  height: 200rpx;
  padding: 24rpx 0;
  border-bottom: 2rpx solid $border-color;
  font-size: 28rpx;
  background: transparent;
  box-sizing: border-box;
}

.form-row {
  display: flex;
  gap: 24rpx;
}
.form-col {
  flex: 1;
}
.form-sub-label {
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

.form-group {
  margin-bottom: 24rpx;
}
.form-group:last-child {
  margin-bottom: 0;
}

/* 开关列表 */
.switch-list {
  background: $bg-surface;
  border-radius: $radius-lg;
  overflow: hidden;
}
.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx;
}
.switch-item + .switch-item {
  border-top: 1rpx solid $border-color;
}
.switch-label {
  font-size: 28rpx;
  color: $text-primary;
}

/* 底部按钮 */
.bottom-actions {
  position: fixed;
  bottom: calc(40rpx + constant(safe-area-inset-bottom));
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  left: 48rpx;
  right: 48rpx;
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

/* 音乐预设 */
.music-presets {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 20rpx;
}
.music-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx 28rpx;
  background: $bg-surface;
  border-radius: $radius-lg;
  border: 2rpx solid $border-color;
  transition: all 0.2s ease;
}
.music-item.active {
  border-color: $text-primary;
  background: $text-primary;
}
.music-item.active .music-name { color: #fff; }
.music-item:active { transform: scale(0.98); }
.music-icon {
  width: 40rpx;
  height: 40rpx;
}
.music-name {
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
}
.music-tip {
  margin-top: 16rpx;
  font-size: 22rpx;
  color: $text-muted;
  line-height: 1.5;
}
</style>
