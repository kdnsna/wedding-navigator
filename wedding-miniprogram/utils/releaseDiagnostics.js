import { CLOUD_ENV, AMAP_KEY, MARKER_ICON } from '@/config/cloud.js'

function isReady(value) {
  return Boolean(String(value || '').trim())
}

function statusItem({ key, title, desc, status, route = '', actionText = '' }) {
  return { key, title, desc, status, route, actionText }
}

export function buildReleaseDiagnostics(store) {
  const wedding = store.wedding || {}
  const invitation = store.invitation || {}
  const album = store.album || {}
  const venues = store.venues || {}
  const primaryVenue = store.primaryVenue || {}
  const features = store.features || {}
  const coverReady = Boolean(album.photos?.some(p => p.type === 'cover') || album.photos?.[0]?.url)
  const share = wedding.share_config || {}
  const venueHasCoordinate = Boolean(primaryVenue?.coordinate?.latitude && primaryVenue?.coordinate?.longitude)
  const venueHasAddress = isReady(primaryVenue?.address || invitation.wedding?.venue_address)
  const timelineReady = !features.show_timeline || Boolean((store.timeline?.events || []).length)
  const guestRulesCustomized = features.rsvp_phone_required === false ||
    features.blessing_public === false ||
    features.allow_anonymous_blessing === false ||
    features.allow_rsvp_update === false
  const hasPosterPath = isReady(share.poster_image || share.cover_image || album.photos?.[0]?.url)

  const items = [
    statusItem({
      key: 'cloud',
      title: '云环境',
      desc: isReady(CLOUD_ENV) ? `已配置云环境 ${CLOUD_ENV}` : '未配置云开发环境 ID',
      status: isReady(CLOUD_ENV) ? 'done' : 'blocker',
      actionText: '检查配置'
    }),
    statusItem({
      key: 'invitation',
      title: '婚书信息',
      desc: store.coupleName?.replace('&', '').trim() && store.weddingDate
        ? '新人姓名、日期和时间可用于首页与分享'
        : '补齐新人姓名、婚期和时间',
      status: store.coupleName?.replace('&', '').trim() && store.weddingDate ? 'done' : 'blocker',
      route: '/pages-owner/invitation/edit',
      actionText: '去编辑'
    }),
    statusItem({
      key: 'cover',
      title: '封面与海报素材',
      desc: coverReady ? '已有封面图片，可用于首页和分享海报' : '至少上传 1 张封面或婚纱照',
      status: coverReady ? 'done' : 'warning',
      route: '/pages-owner/album/manage',
      actionText: '去上传'
    }),
    statusItem({
      key: 'venue',
      title: '路书场地',
      desc: venueHasAddress && venueHasCoordinate
        ? '主场地地址和地图坐标完整'
        : venueHasAddress ? '已有地址，建议补地图坐标' : '补齐主场地地址和坐标',
      status: venueHasAddress && venueHasCoordinate ? 'done' : 'blocker',
      route: '/pages-owner/guide/edit',
      actionText: '去设置'
    }),
    statusItem({
      key: 'map',
      title: '地图能力',
      desc: MARKER_ICON ? '已配置自定义地图标记，真机仍建议预览点位' : '使用系统默认地图标记，兼容性更稳',
      status: venueHasCoordinate ? 'done' : 'warning',
      route: '/pages-owner/guide/edit',
      actionText: '检查路书'
    }),
    statusItem({
      key: 'weather',
      title: '天气与地理编码',
      desc: AMAP_KEY
        ? '前端地图 Key 已配置；云函数仍需检查 TENCENT_MAP_KEY 与 HEFENG_KEY/QWEATHER_KEY'
        : '云函数需配置 TENCENT_MAP_KEY 与 HEFENG_KEY/QWEATHER_KEY 后，天气和坐标兜底才完整',
      status: 'manual',
      route: '/pages-owner/guide/edit',
      actionText: '人工确认'
    }),
    statusItem({
      key: 'ai',
      title: 'AI 发布助手',
      desc: '需确认 aiPublishAssistant 已部署、依赖已安装，并在 CloudBase 启用 AI 模型服务',
      status: 'manual',
      route: '/pages-owner/diagnostics/index',
      actionText: '人工确认'
    }),
    statusItem({
      key: 'timeline',
      title: '流程展示',
      desc: timelineReady ? '宾客端流程展示逻辑完整' : '添加至少 1 个流程节点，或关闭流程展示',
      status: timelineReady ? 'done' : 'warning',
      route: '/pages-owner/timeline/edit',
      actionText: '去编辑'
    }),
    statusItem({
      key: 'guest-rules',
      title: '宾客信息规则',
      desc: guestRulesCustomized
        ? '已调整至少一项宾客隐私/权限策略'
        : '当前为默认开放策略，建议确认手机号、祝福公开和回执修改规则',
      status: guestRulesCustomized ? 'done' : 'warning',
      route: '/pages-owner/invitation/edit',
      actionText: '去确认'
    }),
    statusItem({
      key: 'platform-privacy',
      title: '微信隐私声明',
      desc: '需声明“收集你选中的照片或视频信息”、“收集你选择的位置信息”和“使用你的相册（仅写入）”，保存约 5 分钟后真机重测选照、地图选点与海报保存',
      status: 'manual',
      route: '/pages/privacy/index',
      actionText: '查看说明'
    }),
    statusItem({
      key: 'share',
      title: '分享卡片',
      desc: isReady(share.title) && isReady(share.description)
        ? '分享标题和描述已配置'
        : '补齐微信分享标题和描述',
      status: isReady(share.title) && isReady(share.description) ? 'done' : 'warning',
      route: '/pages-owner/share/index',
      actionText: '去设置'
    }),
    statusItem({
      key: 'poster',
      title: '小程序码与海报',
      desc: hasPosterPath ? '已有可生成海报的素材，发布前请真机生成一次' : '缺少海报素材，建议上传封面后生成海报',
      status: hasPosterPath ? 'manual' : 'warning',
      route: '/pages-owner/share/index',
      actionText: '去生成'
    }),
    statusItem({
      key: 'commercial',
      title: '模板权益',
      desc: invitation.commercial?.template_tier === 'premium'
        ? '当前使用高级模板，已记录体验期权益状态'
        : '当前使用免费模板，后续可升级高级模板/海报套装',
      status: 'done',
      route: '/pages-owner/profile/index',
      actionText: '看权益'
    })
  ]

  const blockers = items.filter(item => item.status === 'blocker').length
  const warnings = items.filter(item => item.status === 'warning').length
  const manual = items.filter(item => item.status === 'manual').length
  const done = items.filter(item => item.status === 'done').length

  return {
    items,
    blockers,
    warnings,
    manual,
    done,
    total: items.length,
    ready: blockers === 0 && manual === 0,
    percent: Math.round((done / items.length) * 100)
  }
}
