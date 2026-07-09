<template>
  <PageShell
    class="privacy-page"
    kicker="PRIVACY"
    title="隐私保护指引"
    desc="说明甜囍手册在婚礼邀请、回执、祝福、相册和导航场景中的信息使用方式。"
  >

    <view class="content">
      <text class="section-title">一、引言</text>
      <text class="section-text">
        甜囍手册（以下简称"本小程序"）非常重视用户的隐私保护。本指引将帮助您了解我们在为您提供婚礼邀请服务过程中，如何收集、使用、存储和保护您的个人信息。
      </text>

      <text class="section-title">二、我们收集的信息</text>
      <text class="section-text">
        为了向您提供完整的婚礼邀请服务，我们可能需要收集以下信息：
      </text>
      <view class="list">
        <text class="list-item">• 微信用户标识（openid）：用于识别用户身份，确保数据归属正确</text>
        <text class="list-item">• 婚礼基本信息：包括婚礼日期、时间、场地地址等您主动填写的信息</text>
        <text class="list-item">• RSVP 信息：宾客填写的出席状态、联系电话、饮食偏好等</text>
        <text class="list-item">• 祝福留言：宾客在祝福墙发表的文本内容</text>
        <text class="list-item">• 位置信息：仅在您使用地图导航功能时，经您授权后获取</text>
        <text class="list-item">• 照片或视频信息：仅在您主动从相册选择婚礼相关图片并上传到相册时使用</text>
      </view>

      <text class="section-title">三、信息的使用</text>
      <text class="section-text">
        我们收集的信息仅用于以下目的：
      </text>
      <view class="list">
        <text class="list-item">• 生成和展示婚礼邀请页面</text>
        <text class="list-item">• 统计宾客 RSVP 出席情况，方便您安排婚礼事宜</text>
        <text class="list-item">• 展示宾客祝福留言</text>
        <text class="list-item">• 提供婚礼场地导航服务</text>
        <text class="list-item">• 生成婚礼分享海报</text>
      </view>

      <text class="section-title">四、信息的存储与保护</text>
      <text class="section-text">
        您的数据存储在微信云开发服务中，我们采用业界标准的安全措施保护您的信息。婚礼结束后，您可以通过主人书案删除相关数据。
      </text>

      <text class="section-title">五、信息共享</text>
      <text class="section-text">
        我们不会将您的个人信息出售、交易或转让给任何第三方。婚礼邀请页面中展示的信息（如婚礼日期、场地）仅对您分享的宾客可见。
      </text>

      <text class="section-title">六、您的权利</text>
      <text class="section-text">
        您有权随时访问、修改或删除您在本小程序中提交的数据。如需帮助，请通过微信客服联系我们。
      </text>

      <text class="section-title">七、联系我们</text>
      <text class="section-text">
        如您对本隐私保护指引有任何疑问，可通过小程序内的客服功能与我们联系。
      </text>

      <text class="update-time">更新日期：2026年5月19日</text>
    </view>
  </PageShell>
</template>

<script setup>
import { onShareAppMessage } from '@dcloudio/uni-app'
import PageShell from '@/components/ui/PageShell.vue'

onShareAppMessage(() => ({
  title: '甜囍手册 - 隐私保护指引',
  path: '/pages/privacy/index'
}))
</script>

<style lang="scss" scoped>
.privacy-page {
  background-color: $bg-color;
  min-height: 100vh;
}

.content {
  padding: 0 $page-gutter 48rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
  margin-top: 48rpx;
  margin-bottom: 16rpx;
}

.section-text {
  display: block;
  font-size: 28rpx;
  color: $text-secondary;
  line-height: 1.8;
  margin-bottom: 16rpx;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.list-item {
  display: block;
  font-size: 28rpx;
  color: $text-secondary;
  line-height: 1.6;
}

.update-time {
  display: block;
  font-size: 24rpx;
  color: $text-muted;
  margin-top: 64rpx;
  text-align: center;
}
</style>
